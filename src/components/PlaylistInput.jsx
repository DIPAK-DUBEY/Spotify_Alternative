import { motion } from "framer-motion";
import { appConfig } from "../data/config.js";

export default function PlaylistInput({ isChanging, error, inputValue, onInputChange, onSubmit, onCancel, onOpenFaq }) {
  const { prompt } = appConfig;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(inputValue || "");
  }

  return (
    <section className="absolute inset-0 flex flex-col items-center justify-center px-6">
      <p className="max-w-sm text-balance text-center font-serif2 text-shadow-cinematic text-[clamp(1.15rem,4.5vw,1.6rem)] italic leading-snug text-ivory md:max-w-md">
        Ad-free music from your Spotify playlist.
      </p>

      <div className="mt-5 flex items-center gap-2">
        <span className="hairline w-10" />
        <h2 className="whitespace-nowrap font-hand text-shadow-cinematic text-[clamp(1.7rem,7.5vw,2.5rem)] text-ivory">{prompt}</h2>
        <span className="hairline w-10" />
      </div>

      <form className="mt-8 w-full max-w-sm" onSubmit={handleSubmit}>
        <label htmlFor="playlist-link" className="sr-only">
          Spotify playlist link
        </label>
        <div className="focus-ring rounded-md border border-sand/40 bg-[#1a120c]/65 px-4 py-3">
          <input
            id="playlist-link"
            type="text"
            name="playlist"
            value={inputValue || ""}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Paste your Spotify playlist link"
            autoComplete="off"
            spellCheck="false"
            enterKeyHint="go"
            className="w-full bg-transparent font-serif2 text-sm text-ivory placeholder:text-ivory/55 focus:outline-none"
          />
        </div>

        <button
          type="submit"
            className="touch-target mt-5 w-full rounded-md border border-gold/40 bg-gradient-to-b from-umber/80 to-earth/90 font-serif2 text-[clamp(0.72rem,2.2vw,0.8rem)] uppercase tracking-[0.25em] text-ivory transition-all duration-200 hover:border-gold/70 hover:from-umber/90 hover:to-earth active:scale-[0.98]"
        >
          Load Playlist
        </button>

        {isChanging && (
          <button
            type="button"
            onClick={onCancel}
            className="touch-target mt-3 w-full font-hand text-lg text-cream/75 underline-offset-4 transition-colors duration-200 hover:text-ivory"
          >
            Back — keep the music playing
          </button>
        )}
      </form>

      <button
        type="button"
        onClick={onOpenFaq}
        className="touch-target mt-5 inline-flex items-center gap-2 font-hand text-base text-cream/75 underline-offset-4 transition-colors duration-200 hover:text-ivory md:text-lg"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full border border-cream/40 text-xs" aria-hidden="true">
          ?
        </span>
        How it works
      </button>

      {error && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-5 max-w-sm text-balance text-center font-hand text-[clamp(1rem,3.2vw,1.15rem)] text-gold"
        >
          {error}
        </motion.p>
      )}

    </section>
  );
}
