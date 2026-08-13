package com.oldsongs.app

import android.app.PendingIntent
import android.content.Intent
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(UnstableApi::class)
class PlayerService : MediaSessionService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var mediaSession: MediaSession? = null
    private var resolveJob: Job? = null

    private val player: ExoPlayer by lazy {
        ExoPlayer.Builder(this).build().apply {
            repeatMode = Player.REPEAT_MODE_ALL
            addListener(playerListener)
        }
    }

    private val playerListener = object : Player.Listener {
        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
            resolveCurrent()
        }

        override fun onPlayerError(error: PlaybackException) {
            val item = player.currentMediaItem ?: return
            val uri = item.localConfiguration?.uri?.toString() ?: ""
            if (uri.startsWith(PlaylistRepository.PLACEHOLDER_URI_PREFIX)) {
                resolveCurrent(force = true)
            } else {
                player.seekToNextMediaItem()
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        val sessionActivity = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        mediaSession = MediaSession.Builder(this, player)
            .setSessionActivity(sessionActivity)
            .build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = mediaSession

    override fun onDestroy() {
        resolveJob?.cancel()
        mediaSession?.release()
        player.release()
        serviceScope.cancel()
        super.onDestroy()
    }

    private fun resolveCurrent(force: Boolean = false) {
        val index = player.currentMediaItemIndex
        val item = player.currentMediaItem ?: return
        val uri = item.localConfiguration?.uri?.toString() ?: return
        if (!force && !uri.startsWith(PlaylistRepository.PLACEHOLDER_URI_PREFIX)) return
        if (resolveJob?.isActive == true) resolveJob?.cancel()

        resolveJob = serviceScope.launch {
            val videoId = item.mediaId
            var url = runCatching { PlaylistRepository.resolveStream(videoId) }.getOrNull()
            if (url == null) {
                delay(2000)
                url = runCatching { PlaylistRepository.resolveStream(videoId) }.getOrNull()
            }
            if (url == null) {
                if (player.currentMediaItem?.mediaId == videoId) player.seekToNextMediaItem()
                return@launch
            }
            if (player.currentMediaItem?.mediaId == videoId) {
                val updated = item.buildUpon().setUri(url).build()
                val items = player.mediaItems.toMutableList()
                items[index] = updated
                player.setMediaItems(items, index, player.currentPosition)
                player.play()
            }
            prewarmNext(index + 1)
        }
    }

    private fun prewarmNext(index: Int) {
        if (index < 0 || index >= player.mediaItemCount) return
        val next = player.getMediaItemAt(index) ?: return
        serviceScope.launch {
            delay(500)
            runCatching { PlaylistRepository.resolveStream(next.mediaId) }
        }
    }
}