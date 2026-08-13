package com.oldsongs.app

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import coil.load

class TrackAdapter(
    private val onClick: (Int) -> Unit
) : RecyclerView.Adapter<TrackAdapter.Holder>() {

    private val items = mutableListOf<Track>()

    fun submit(list: List<Track>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    class Holder(val view: View) : RecyclerView.ViewHolder(view) {
        val thumb: ImageView = view.findViewById(R.id.trackThumb)
        val title: TextView = view.findViewById(R.id.trackTitle)
        val artist: TextView = view.findViewById(R.id.trackArtist)
        val duration: TextView = view.findViewById(R.id.trackDuration)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_track, parent, false)
        return Holder(view)
    }

    override fun getItemCount(): Int = items.size

    override fun onBindViewHolder(holder: Holder, position: Int) {
        val track = items[position]
        holder.title.text = track.title
        holder.artist.text = track.artist
        holder.duration.text = formatDuration(track)
        holder.thumb.load(track.artwork) {
            placeholder(R.drawable.ic_stat_music)
            error(R.drawable.ic_stat_music)
            crossfade(true)
        }
        holder.view.setOnClickListener { onClick(holder.bindingAdapterPosition) }
    }

    private fun formatDuration(track: Track): String {
        val sec = track.durationMs?.takeIf { it > 0 }?.div(1000)
            ?: track.videoDuration?.takeIf { it > 0 }
            ?: return ""
        val m = sec / 60
        val s = sec % 60
        return "%d:%02d".format(m, s)
    }
}