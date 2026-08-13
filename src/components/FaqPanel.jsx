import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TulipMark from "./TulipMark.jsx";

const FAQ_ITEMS = [
  {
    q: "How do I start?",
    a: "Copy your Spotify playlist link, paste it in the box, and press \"Load Playlist\". Your songs appear in the player below."
  },
  {
    q: "Which links work?",
    a: "Full open.spotify.com/playlist/... links and spotify:playlist: links work. Short spotify.link links and album links don't — open your playlist in the Spotify app and use Share → Copy Playlist Link."
  },
  {
    q: "Do I need a Spotify account?",
    a: "No login needed. Your songs play right here, without opening Spotify."
  },
  {
    q: "Will ads interrupt my music?",
    a: "No — your songs always play from start to finish. The site shows ads in the page itself, never over the music."
  },
  {
    q: "How do I choose a song?",
    a: "Press \"Show playlist\", then tap any song. It starts playing and the panel closes."
  },
  {
    q: "How do I get more songs?",
    a: "Press \"Load more songs\" — or just wait, the rest load in the background automatically."
  },
  {
    q: "How do I switch to another playlist?",
    a: "Press \"Change playlist\", paste a new link, and press \"Load Playlist\". Pressing \"Back — keep the music playing\" returns without stopping your music."
  },
  {
    q: "Is my playlist private?",
    a: "Yes. Your playlist is fetched on the fly and kept only in your browser for 7 days. Nothing is stored on a server."
  },
  {
    q: "Who is this for?",
    a: "A little memory, made for Prachi."
  }
];

export default function FaqPanel({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex items-end justify-center md:items-center">
          <motion.button
            type="button"
            aria-label="Close"
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
            aria-label="How it works"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="vintage-frame relative flex max-h-[78dvh] w-full flex-col overflow-hidden rounded-t-2xl border-sand/40 pb-[max(env(safe-area-inset-bottom),0.8rem)] md:max-h-[72dvh] md:w-[min(92vw,34rem)] md:rounded-2xl"
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-sand/15 px-4 py-3.5 md:px-6 md:py-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-sand/25 bg-[radial-gradient(circle_at_32%_30%,#3a2a1e,#120c08_70%)]">
                <TulipMark className="h-5 w-5 text-accent/80" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif2 text-base text-ivory md:text-lg">How it works</p>
                <p className="mt-0.5 truncate font-hand text-sm text-cream/75">
                  Everything you need to know
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="touch-target grid h-10 w-10 shrink-0 place-items-center rounded-full border border-sand/25 text-cream/70 transition-colors duration-200 hover:border-gold/60 hover:text-ivory"
              >
                <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="song-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {FAQ_ITEMS.map((item, i) => (
                <details
                  key={item.q}
                  className="group border-b border-sand/10 last:border-0"
                >
                  <summary className="flex cursor-pointer items-center gap-3 px-4 py-3.5 md:px-6 md:py-4">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-gold/40 font-serif2 text-[10px] tabular-nums text-gold md:h-6 md:w-6 md:text-xs">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 font-serif2 text-sm leading-snug text-ivory md:text-[15px]">
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-lg leading-none text-gold/80 transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-4 pb-4 font-serif2 text-sm leading-relaxed text-cream/80 md:px-6 md:pb-5 md:text-[15px]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
