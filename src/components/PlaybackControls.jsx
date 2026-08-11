export default function PlaybackControls({ artwork, isPlaying, lidOpen, onToggle }) {
  const caption = lidOpen ? (isPlaying ? "baj raha hai" : "Spotify ke play pe tap karo") : "play";

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-label={lidOpen ? "Spotify player chhupao" : "Spotify player dikhao"}
        aria-expanded={lidOpen}
        className="focus-ring relative h-24 w-24 touch-target rounded-full md:h-28 md:w-28"
      >
        <span
          className={`absolute inset-0 overflow-hidden rounded-full border border-cream/15 shadow-[0_12px_32px_-12px_rgba(5,2,0,0.9)] ${
            isPlaying ? "vinyl-spin" : ""
          }`}
        >
          {artwork ? (
            <img src={artwork} alt="" className="h-full w-full object-cover" />
          ) : (
            <span
              className="block h-full w-full"
              style={{
                background:
                  "repeating-radial-gradient(circle, #191009 0 2px, #2b1d13 2px 4px)"
              }}
            />
          )}
        </span>

        <span className="absolute inset-0 flex items-center justify-center">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full border bg-ink/85 ${
              lidOpen ? "border-cream/40 text-gold/80" : "breathe border-gold/70 text-gold"
            }`}
          >
            {lidOpen ? <PauseGlyph /> : <PlayGlyph />}
          </span>
        </span>

        <span
          className={`absolute inset-0 rounded-full ring-1 ring-inset transition-colors duration-500 ${
            isPlaying ? "ring-accent/40" : "ring-gold/20"
          }`}
        />
      </button>
      <span className="font-hand text-sm text-cream/70 md:text-base">{caption}</span>
    </div>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 12 14" className="h-3.5 w-3.5 translate-x-[1px]" aria-hidden="true">
      <path d="M0 0l12 7-12 7z" fill="currentColor" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 10 12" className="h-3 w-4" aria-hidden="true">
      <rect x="0" y="0" width="3.4" height="12" rx="1" fill="currentColor" />
      <rect x="6.6" y="0" width="3.4" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}
