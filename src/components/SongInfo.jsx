import { appConfig } from "../data/config.js";

export default function SongInfo({ track, playlistName }) {
  const hasTrack = Boolean(track && track.name);

  return (
    <div className="min-w-0 flex-1 text-left">
      <p className="font-hand text-sm text-sand/90 md:text-base">
        {hasTrack ? "now playing" : "some old songs"}
      </p>
      <div key={hasTrack ? track.id || "track" : "idle"} className="fade-up mt-0.5">
        <h2 className="text-shadow-cinematic line-clamp-2 font-dev text-lg leading-snug text-ivory md:text-xl">
          {hasTrack ? track.name : "Your first song is waiting"}
        </h2>
        <p className="mt-0.5 line-clamp-1 text-sm text-cream/70 md:text-base">
          {hasTrack ? track.artists : "press play — the song begins"}
        </p>
        <p className="mt-1 text-xs italic text-cream/45 md:text-sm">From: {playlistName}</p>
      </div>
    </div>
  );
}
