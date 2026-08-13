package com.oldsongs.app

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Track(
    val videoId: String,
    val title: String,
    val artist: String = "",
    val artwork: String? = null,
    @SerialName("videoDuration") val videoDuration: Int? = null,
    @SerialName("durationMs") val durationMs: Long? = null
)

@Serializable
data class PlaylistResponse(
    val ok: Boolean,
    val name: String? = null,
    val artwork: String? = null,
    val totalCount: Int = 0,
    val start: Int = 0,
    val nextStart: Int = 0,
    val done: Boolean = false,
    val reason: String? = null,
    val tracks: List<Track> = emptyList()
)