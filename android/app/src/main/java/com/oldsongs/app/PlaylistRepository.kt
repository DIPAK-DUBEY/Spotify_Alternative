package com.oldsongs.app

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

object PlaylistRepository {

    const val PLAYLIST_ID = "1fYx6s4pBo4g04mRLPV8gu"
    const val API_BASE = "https://prachijha.site"
    const val PLACEHOLDER_URI_PREFIX = "oldsongs://track/"

    private const val YT_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"
    private const val UA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    private val clients = listOf(
        "ANDROID" to "19.09.37",
        "WEB" to "2.20250101.00.00"
    )

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    private val json = Json { ignoreUnknownKeys = true }

    private val streamCache = HashMap<String, String>()

    suspend fun loadPlaylist(): List<Track> = withContext(Dispatchers.IO) {
        val out = mutableListOf<Track>()
        var start = 0
        while (true) {
            val url = "$API_BASE/api/playlist?id=$PLAYLIST_ID&start=$start&count=100"
            val req = Request.Builder().url(url).build()
            val resp = client.newCall(req).execute()
            if (!resp.isSuccessful) throw IOException("API error HTTP ${resp.code}")
            val body = resp.body?.string() ?: throw IOException("empty body")
            val parsed = json.decodeFromString<PlaylistResponse>(body)
            if (!parsed.ok) throw IOException("API error: ${parsed.reason ?: "unknown"}")
            out.addAll(parsed.tracks)
            if (parsed.done) break
            val next = parsed.nextStart
            if (next <= start) break
            start = next
            if (start >= parsed.totalCount) break
        }
        out
    }

    suspend fun resolveStream(videoId: String): String? = withContext(Dispatchers.IO) {
        streamCache[videoId]?.let { return@withContext it }
        for ((name, version) in clients) {
            try {
                val url = callYoutubePlayer(videoId, name, version)
                if (url != null) {
                    if (streamCache.size > 200) streamCache.clear()
                    streamCache[videoId] = url
                    return@withContext url
                }
            } catch (_: Exception) {
                // try next client
            }
        }
        null
    }

    private fun callYoutubePlayer(videoId: String, clientName: String, clientVersion: String): String? {
        val body = """{"context":{"client":{"clientName":"$clientName","clientVersion":"$clientVersion","androidSdkVersion":30,"hl":"en"}},"videoId":"$videoId"}"""
        val req = Request.Builder()
            .url("https://www.youtube.com/youtubei/v1/player?key=$YT_KEY")
            .header("Content-Type", "application/json")
            .header("User-Agent", UA)
            .post(body.toRequestBody("application/json".toMediaType()))
            .build()
        val resp = client.newCall(req).execute()
        if (!resp.isSuccessful) return null
        val text = resp.body?.string() ?: return null
        return parseStreamUrl(text)
    }

    private fun parseStreamUrl(text: String): String? {
        val root = json.parseToJsonElement(text).jsonObject
        val playability = root["playabilityStatus"]?.jsonObject ?: return null
        if (playability["status"]?.jsonPrimitive?.content != "OK") return null
        val streaming = root["streamingData"]?.jsonObject ?: return null
        val formats = streaming["adaptiveFormats"]?.jsonArray
            ?: streaming["formats"]?.jsonArray
            ?: return null

        var fallback: String? = null
        var best: String? = null
        for (f in formats) {
            val obj = f.jsonObject
            val itag = obj["itag"]?.jsonPrimitive?.intOrNull
            val url = obj["url"]?.jsonPrimitive?.contentOrNull ?: continue
            if (itag == 140) return url
            if ((itag == 251 || itag == 141) && fallback == null) fallback = url
            if (best == null && itag != null) {
                val mime = obj["mimeType"]?.jsonPrimitive?.contentOrNull ?: ""
                if (mime.startsWith("audio/")) best = url
            }
        }
        return fallback ?: best
    }
}