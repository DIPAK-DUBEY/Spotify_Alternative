import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TulipMark from "./TulipMark.jsx";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function Equalizer({ playing }) {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-gold"
          style={{
            height: "100%",
            transformOrigin: "bottom",
            animation: playing ? `eq-bounce 0.9s ease-in-out ${i * 0.18}s infinite` : "none",
            transform: playing ? undefined : "scaleY(0.35)"
          }}
        />
      ))}
    </span>
  );
}

function Thumb({ track, isCurrent }) {
  if (track.artwork) {
    return (
      <img
        src={track.artwork}
        alt=""
        loading="lazy"
        className="h-11 w-11 shrink-0 rounded-md border border-sand/25 object-cover md:h-12 md:w-12"
      />
    );
  }
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-sand/25 bg-[radial-gradient(circle_at_32%_30%,#3a2a1e,#120c08_70%)] md:h-12 md:w-12">
      <span className={`h-2.5 w-2.5 rounded-full ${isCurrent ? "bg-gold" : "bg-gold/60"}`} />
    </span>
  );
}

export default function PlaylistPanel({
  open,
  onClose,
  playlist,
  tracks,
  currentIndex,
  isPlaying,
  totalCount,
  canLoadMore,
  truncated,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
  onPlayTrack
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && currentIndex >= 0 && scrollRef.current) {
      const row = scrollRef.current.querySelector(`[data-index="${currentIndex}"]`);
      row?.scrollIntoView({ block: "nearest" });
    }
  }, [open, currentIndex]);

  function handleRowClick(index) {
    onPlayTrack(index);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex items-end justify-center md:items-center">
          <motion.button
            type="button"
            aria-label="Band karo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-[#0d0805]/70 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Playlist ke geet"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="vintage-frame relative flex max-h-[78dvh] w-full flex-col overflow-hidden rounded-t-2xl border-sand/40 pb-[max(env(safe-area-inset-bottom),0.8rem)] md:max-h-[72dvh] md:w-[min(92vw,34rem)] md:rounded-2xl"
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-sand/15 px-4 py-3.5 md:px-6 md:py-4">
              {playlist?.artwork ? (
                <img
                  src={playlist.artwork}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-md border border-sand/25 object-cover md:h-12 md:w-12"
                />
              ) : (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-sand/25 bg-[radial-gradient(circle_at_32%_30%,#3a2a1e,#120c08_70%)] md:h-12 md:w-12">
                  <TulipMark className="h-5 w-5 text-accent/80" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-hand text-base text-cream/55 md:text-lg">
                  {playlist?.name || "Purane Geet"}
                </p>
                <p className="mt-0.5 truncate font-serif2 text-sm text-ivory md:text-base">
                  {tracks.length} geet
                  {canLoadMore && totalCount > tracks.length ? ` · ${totalCount} kul` : ""}
                  {currentIndex >= 0 && " · ab baj raha hai"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Band karo"
                className="touch-target grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sand/25 text-cream/70 transition-colors duration-200 hover:border-gold/60 hover:text-ivory"
              >
                <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div ref={scrollRef} className="song-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 md:px-3">
              {tracks.length === 0 ? (
                <p className="px-4 py-10 text-center font-hand text-lg text-cream/50">
                  Abhi koi geet nahi — thodi der baad playlist bhar jayegi.
                </p>
              ) : (
                tracks.map((track, index) => {
                const isCurrent = index === currentIndex;
                return (
                  <motion.button
                    type="button"
                    key={track.videoId || index}
                    data-index={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.5) }}
                    onClick={() => handleRowClick(index)}
                    aria-current={isCurrent ? "true" : undefined}
                    className={`song-row flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 md:px-3 md:py-2.5 ${
                      isCurrent
                        ? "bg-gold/10 shadow-[inset_0_0_0_1px_rgba(201,166,107,0.35)]"
                        : "hover:bg-cream/[0.06]"
                    }`}
                  >
                    <div className="w-7 shrink-0 text-center md:w-8">
                      {isCurrent ? (
                        <Equalizer playing={isPlaying} />
                      ) : (
                        <span className="font-serif2 text-xs tabular-nums text-cream/40 md:text-sm">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                    <Thumb track={track} isCurrent={isCurrent} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate font-serif2 text-sm leading-tight md:text-[15px] ${
                          isCurrent ? "text-gold" : "text-ivory"
                        }`}
                      >
                        {track.title || "Unknown geet"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-cream/60">
                        {track.artist || "Purana geet"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs tabular-nums ${
                        isCurrent ? "text-gold/90" : "text-cream/40"
                      }`}
                    >
                      {formatTime(track.videoDuration)}
                    </span>
                  </motion.button>
                );
                })
              )}
            </div>

            {canLoadMore && (
              <div className="shrink-0 border-t border-sand/15 px-4 py-3 md:px-6">
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  className="touch-target w-full rounded-md border border-gold/40 bg-gradient-to-b from-umber/80 to-earth/90 font-serif2 text-[0.72rem] uppercase tracking-[0.25em] text-ivory transition-all duration-200 hover:border-gold/70 hover:from-umber/90 hover:to-earth active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 md:text-[0.75rem]"
                >
                  {isLoadingMore
                    ? "Aur geet laa rahe hain…"
                    : `Aur geet laao (${Math.max(0, totalCount - tracks.length)})`}
                </button>
                {(loadMoreError || truncated) && (
                  <p className="mt-2 text-center font-hand text-xs text-gold/80">
                    {truncated
                      ? "YouTube tak pahunch thodi der ke liye ruk gayi — baad mein dobara koshish karo."
                      : loadMoreError}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
