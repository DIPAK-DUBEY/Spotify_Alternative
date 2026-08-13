import { appConfig } from "../data/config.js";
import AdSlot from "./AdSlot.jsx";

function Vinyl({ artwork, isPlaying }) {
  return (
    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-sand/40 bg-[radial-gradient(circle_at_32%_30%,#3a2a1e,#120c08_70%)] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.6)] md:h-12 md:w-12">
      {artwork ? (
        <img src={artwork} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-[10px] rounded-full bg-gold/70 md:inset-[13px]" />
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
  totalCount,
  canLoadMore,
  truncated,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
  onToggle,
  onNext,
  onPrev,
  onSeekFraction,
  onChangePlaylist,
  onShowPlaylist,
  onOpenFaq
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
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.9rem)] md:px-10 md:pb-9"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-2 md:max-w-2xl">
        <div className="vintage-frame pointer-events-auto w-full rounded-xl border-sand/40 px-3.5 py-3 backdrop-blur-md md:px-6 md:py-4">
        <div className="flex items-center gap-3 md:gap-4">
          <Vinyl artwork={artwork} isPlaying={isPlaying} />

          <div className="min-w-0 flex-1">
            <p className="truncate font-hand text-[10px] leading-none text-cream/70 md:text-xs">
              {playlistLabel}: {playlist?.name || "Old Songs"}
              {trackCount > 0 && (
                <span className="ml-1.5 text-[10px] text-cream/55">
                  · {trackCount}{canLoadMore && totalCount > trackCount ? ` / ${totalCount}` : ""} songs
                </span>
              )}
            </p>
            {currentTrack ? (
              <div key={currentTrack.videoId} className="track-in mt-1 min-w-0">
                <p className="truncate font-serif2 text-[clamp(0.9rem,3.2vw,1.25rem)] leading-tight text-ivory">
                  {currentTrack.title}
                </p>
                <p className="mt-0.5 truncate text-[clamp(0.68rem,2vw,0.85rem)] text-cream/85">
                  {currentTrack.artist || "Old song"}
                </p>
              </div>
            ) : (
              <div className="mt-1 min-w-0">
                <p className="truncate font-serif2 text-[clamp(0.9rem,3.2vw,1.25rem)] leading-tight text-ivory/90">
                  {canLoadMore && trackCount === 0 ? "Songs are loading…" : "Ready to play your first song"}
                </p>
                <p className="mt-0.5 text-[clamp(0.68rem,2vw,0.85rem)] text-cream/80">
                  {canLoadMore && trackCount === 0
                    ? "Press play — your first song starts on its own"
                    : "Press play — the memories begin"}
                </p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 md:gap-1.5 md:pl-2">
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous song"
              className="touch-target grid h-10 w-10 place-items-center rounded-full text-cream/70 transition-colors duration-200 hover:text-ivory md:h-11 md:w-11"
            >
              <PrevGlyph />
            </button>
            <button
              type="button"
              onClick={onToggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className={`touch-target grid h-11 w-11 place-items-center rounded-full border transition-all duration-300 md:h-14 md:w-14 ${
                isPlaying
                  ? "border-cream/40 bg-ink/70 text-gold/90"
                  : "breathe border-gold/70 bg-gradient-to-b from-gold/80 to-brass/70 text-ink shadow-[0_6px_22px_-6px_rgba(201,166,107,0.55)]"
              }`}
            >
              {isPlaying ? <PauseGlyph /> : <PlayGlyph />}
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next song"
              className="touch-target grid h-10 w-10 place-items-center rounded-full text-cream/70 transition-colors duration-200 hover:text-ivory md:h-11 md:w-11"
            >
              <NextGlyph />
            </button>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-3 md:mt-3.5 md:gap-4">
          <div
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fraction * 100)}
            onClick={handleSeek}
            className="group/bar relative h-4 flex-1 cursor-pointer"
          >
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-cream/20">
              <div className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold" style={{ width: `${fraction * 100}%` }} />
            </div>
            <div
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sand/60 bg-gold shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-opacity duration-200 max-md:opacity-100 md:h-3.5 md:w-3.5 md:opacity-0 md:group-hover/bar:opacity-100"
              style={{ left: `${fraction * 100}%` }}
            />
          </div>
          <div className="flex shrink-0 items-baseline gap-1 whitespace-nowrap text-[10px] tabular-nums text-cream/70 md:text-xs">
            <span>{formatTime(progress.current)}</span>
            <span className="text-cream/50">/</span>
            <span>{progress.duration > 0 ? formatTime(progress.duration) : "--:--"}</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 md:mt-3">
          <button
            type="button"
            onClick={onShowPlaylist}
            className="touch-target inline-flex items-center gap-1.5 font-hand text-xs text-gold/90 underline-offset-4 transition-colors duration-200 hover:text-gold md:text-sm"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3 md:h-3.5 md:w-3.5" aria-hidden="true">
              <path
                d="M2 2h8v2H2zm0 3h8v2H2zm0 3h5v2H2z"
                fill="currentColor"
              />
            </svg>
            Show playlist
          </button>

          {canLoadMore && (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="touch-target font-hand text-xs text-gold/90 underline-offset-4 transition-colors duration-200 hover:text-gold disabled:cursor-wait disabled:text-gold/50 md:text-sm"
            >
              {isLoadingMore
                ? "Loading more songs…"
                : `Load more songs (${totalCount - trackCount})`}
            </button>
          )}

          <span className="hairline hidden w-10 md:inline-block" />
          <button
            type="button"
            onClick={onChangePlaylist}
            className="touch-target font-hand text-xs text-cream/75 underline-offset-4 transition-colors duration-200 hover:text-ivory md:text-sm"
          >
            Change playlist
          </button>
          <button
            type="button"
            onClick={onOpenFaq}
            aria-label="How it works — FAQ"
            className="touch-target grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cream/25 text-sm text-cream/70 transition-colors duration-200 hover:border-gold/60 hover:text-ivory md:h-10 md:w-10"
          >
            ?
          </button>
        </div>

        {(loadMoreError || truncated) && (
          <p className="mt-2 text-center font-hand text-xs text-gold/80">
            {truncated
              ? "YouTube access paused for a moment — try again later."
              : loadMoreError}
          </p>
        )}
        </div>

        <div className="pointer-events-auto w-full max-w-[320px]">
          <AdSlot />
        </div>
      </div>
    </section>
  );
}
