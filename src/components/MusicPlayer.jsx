import { appConfig } from "../data/config.js";
import { shareUrl } from "../utils/spotify.js";

function Vinyl({ artwork, isPlaying }) {
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-sand/40 bg-[radial-gradient(circle_at_32%_30%,#3a2a1e,#120c08_70%)] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.6)] md:h-14 md:w-14">
      {artwork ? (
        <img src={artwork} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-[13px] rounded-full bg-gold/70" />
      )}
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle_at_center,transparent_0_2px,rgba(244,232,208,0.08)_2px_4px)] opacity-60 mix-blend-overlay ${
          isPlaying ? "vinyl-spin" : ""
        }`}
      />
      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sand/40 bg-[#1c130d]" />
    </div>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 12 14" className="h-4 w-4 translate-x-[1px]" aria-hidden="true">
      <path d="M0 0l12 7-12 7z" fill="currentColor" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 10 12" className="h-4 w-5" aria-hidden="true">
      <rect x="0" y="0" width="3.4" height="12" rx="1" fill="currentColor" />
      <rect x="6.6" y="0" width="3.4" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}

function PrevGlyph() {
  return (
    <svg viewBox="0 0 14 14" className="h-4 w-4" aria-hidden="true">
      <path d="M1 2h2v10H1zm3 5l7-5v10z" fill="currentColor" />
    </svg>
  );
}

function NextGlyph() {
  return (
    <svg viewBox="0 0 14 14" className="h-4 w-4" aria-hidden="true">
      <path d="M11 2h2v10h-2zM10 7L3 2v10z" fill="currentColor" />
    </svg>
  );
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function MusicPlayer({
  playlist,
  currentTrack,
  isPlaying,
  progress,
  trackCount,
  onToggle,
  onNext,
  onPrev,
  onSeekFraction,
  onChangePlaylist
}) {
  const { playlistLabel } = appConfig;
  const artwork = currentTrack?.artwork || playlist?.artwork || null;
  const fraction = progress.duration > 0 ? Math.min(1, Math.max(0, progress.current / progress.duration)) : 0;

  function handleSeek(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    onSeekFraction(Math.min(1, Math.max(0, x / rect.width)));
  }

  return (
    <section
      aria-label="Music player"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),1.1rem)] md:px-10 md:pb-9"
    >
      <div className="vintage-frame pointer-events-auto w-full max-w-md rounded-xl border-sand/40 px-4 pb-4 pt-4 backdrop-blur-md md:max-w-lg md:px-6 md:pb-5 md:pt-5">
        <div className="flex items-center gap-3.5 md:gap-4">
          <Vinyl artwork={artwork} isPlaying={isPlaying} />

          <div className="min-w-0 flex-1">
            <p className="truncate font-hand text-[clamp(0.78rem,2.2vw,0.9rem)] leading-none text-cream/60">
              {playlistLabel}: {playlist?.name || "Purane Geet"}
              {trackCount > 0 && (
                <span className="ml-1.5 text-[clamp(0.7rem,2vw,0.8rem)] text-cream/40">· {trackCount} geet</span>
              )}
            </p>
            {currentTrack ? (
              <div key={currentTrack.videoId} className="track-in mt-1.5 min-w-0">
                <p className="truncate font-serif2 text-[clamp(1.05rem,4.4vw,1.35rem)] leading-tight text-ivory">
                  {currentTrack.title}
                </p>
                <p className="mt-0.5 truncate text-[clamp(0.72rem,2vw,0.85rem)] text-cream/70">
                  {currentTrack.artist || "Purana geet"}
                </p>
              </div>
            ) : (
              <div className="mt-1.5 min-w-0">
                <p className="truncate font-serif2 text-[clamp(1.05rem,4.4vw,1.35rem)] leading-tight text-ivory/90">
                  Pehla geet sunne ko tayyar
                </p>
                <p className="mt-0.5 text-[clamp(0.72rem,2vw,0.85rem)] text-cream/60">
                  Play dabao — yaadein shuru ho jayengi
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fraction * 100)}
            onClick={handleSeek}
            className="group/bar relative h-5 w-full cursor-pointer"
          >
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-cream/20">
              <div className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold" style={{ width: `${fraction * 100}%` }} />
            </div>
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sand/60 bg-gold shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-opacity duration-200 max-md:opacity-100 md:opacity-0 md:group-hover/bar:opacity-100"
              style={{ left: `${fraction * 100}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs tabular-nums text-cream/60">
            <span>{formatTime(progress.current)}</span>
            <span>{progress.duration > 0 ? formatTime(progress.duration) : "--:--"}</span>
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-center gap-7">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Pichla geet"
            className="touch-target grid h-11 w-11 place-items-center rounded-full text-cream/70 transition-colors duration-200 hover:text-ivory"
          >
            <PrevGlyph />
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={isPlaying ? "Roko" : "Bajao"}
            className={`touch-target grid h-14 w-14 place-items-center rounded-full border transition-all duration-300 md:h-16 md:w-16 ${
              isPlaying
                ? "border-cream/40 bg-ink/70 text-gold/90"
                : "breathe border-gold/70 bg-gradient-to-b from-gold/80 to-brass/70 text-ink shadow-[0_6px_22px_-6px_rgba(201,166,107,0.5)]"
            }`}
          >
            {isPlaying ? <PauseGlyph /> : <PlayGlyph />}
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Agla geet"
            className="touch-target grid h-11 w-11 place-items-center rounded-full text-cream/70 transition-colors duration-200 hover:text-ivory"
          >
            <NextGlyph />
          </button>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-3">
          <a
            href={shareUrl(playlist.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target inline-flex items-center gap-1.5 font-hand text-sm text-gold/90 transition-colors duration-200 hover:text-gold"
          >
            Open in Spotify
            <span aria-hidden="true">↗</span>
          </a>
          <span className="hairline hidden w-16 md:inline-block" />
          <button
            type="button"
            onClick={onChangePlaylist}
            className="touch-target font-hand text-sm text-cream/60 underline-offset-4 transition-colors duration-200 hover:text-cream/85"
          >
            Change playlist
          </button>
        </div>
      </div>
    </section>
  );
}
