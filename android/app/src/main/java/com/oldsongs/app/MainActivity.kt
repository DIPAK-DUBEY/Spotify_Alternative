package com.oldsongs.app

import android.Manifest
import android.content.ComponentName
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.ImageButton
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.ContextCompat.getMainExecutor
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.appbar.MaterialToolbar
import com.google.common.util.concurrent.ListenableFuture
import kotlinx.coroutines.launch

@UnstableApi
class MainActivity : AppCompatActivity() {

    private lateinit var recycler: RecyclerView
    private lateinit var adapter: TrackAdapter
    private lateinit var miniPlayer: View
    private lateinit var nowTitle: TextView
    private lateinit var nowArtist: TextView
    private lateinit var statusText: TextView
    private lateinit var btnPlay: ImageButton
    private lateinit var btnNext: ImageButton
    private lateinit var btnPrev: ImageButton

    private var tracks: List<Track> = emptyList()
    private var controller: MediaController? = null
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private var pendingPlay: (MediaController) -> Unit = {}

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbar)
        toolbar.title = getString(R.string.app_name)

        recycler = findViewById(R.id.recyclerView)
        statusText = findViewById(R.id.statusText)
        miniPlayer = findViewById(R.id.miniPlayer)
        nowTitle = findViewById(R.id.nowTitle)
        nowArtist = findViewById(R.id.nowArtist)
        btnPlay = findViewById(R.id.btnPlay)
        btnNext = findViewById(R.id.btnNext)
        btnPrev = findViewById(R.id.btnPrev)

        adapter = TrackAdapter { position -> playAt(position) }
        recycler.layoutManager = LinearLayoutManager(this)
        recycler.adapter = adapter

        btnPlay.setOnClickListener {
            val c = controller ?: return@setOnClickListener
            if (c.isPlaying) c.pause() else c.play()
        }
        btnNext.setOnClickListener { controller?.seekToNextMediaItem() }
        btnPrev.setOnClickListener { controller?.seekToPreviousMediaItem() }

        requestNotificationPermission()
        loadPlaylist()
    }

    private fun loadPlaylist() {
        statusText.text = "Loading playlist…"
        lifecycleScope.launch {
            runCatching { PlaylistRepository.loadPlaylist() }
                .onSuccess { list ->
                    tracks = list
                    if (list.isEmpty()) {
                        statusText.text = "Playlist empty or not accessible"
                    } else {
                        statusText.text = "${list.size} songs"
                        adapter.submit(list)
                    }
                }
                .onFailure { statusText.text = "Load failed: ${it.message}" }
        }
    }

    private fun playAt(position: Int) {
        if (tracks.isEmpty()) return
        connectController { c ->
            val items = tracks.map { it.toMediaItem() }
            c.setMediaItems(items, position, 0L)
            c.prepare()
            c.play()
        }
    }

    private fun connectController(onReady: (MediaController) -> Unit) {
        val existing = controller
        if (existing != null) {
            onReady(existing)
            return
        }
        pendingPlay = onReady
        if (controllerFuture != null) return

        val token = SessionToken(this, ComponentName(this, PlayerService::class.java))
        val future = MediaController.Builder(this, token)
            .setListenerAsync(controllerListener)
            .buildAsync()
        controllerFuture = future
        future.addListener({
            runCatching {
                val c = future.get()
                controller = c
                val p = pendingPlay
                pendingPlay = {}
                p(c)
                updateMiniPlayer()
            }
        }, getMainExecutor(this))
    }

    private val controllerListener = object : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) = updateMiniPlayer()
        override fun onPlaybackStateChanged(playbackState: Int) = updateMiniPlayer()
        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) = updateMiniPlayer()
    }

    private fun updateMiniPlayer() {
        val c = controller ?: return
        val item = c.currentMediaItem ?: return
        miniPlayer.visibility = View.VISIBLE
        nowTitle.text = item.mediaMetadata.title?.toString() ?: ""
        nowArtist.text = item.mediaMetadata.artist?.toString() ?: ""
        btnPlay.setImageResource(if (c.isPlaying) R.drawable.ic_pause else R.drawable.ic_play)
        btnPlay.isEnabled = c.playbackState != Player.STATE_IDLE
    }

    private fun Track.toMediaItem(): MediaItem {
        val metadata = MediaMetadata.Builder()
            .setTitle(title)
            .setArtist(artist)
            .setArtworkUri(artwork?.let { android.net.Uri.parse(it) })
            .build()
        return MediaItem.Builder()
            .setMediaId(videoId)
            .setUri(PlaylistRepository.PLACEHOLDER_URI_PREFIX + videoId)
            .setMediaMetadata(metadata)
            .build()
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    override fun onDestroy() {
        controllerFuture?.let { MediaController.releaseFuture(it) }
        super.onDestroy()
    }
}