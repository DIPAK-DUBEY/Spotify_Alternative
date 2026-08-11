import { useState } from "react";
import { motion } from "framer-motion";
import TulipMark from "./TulipMark.jsx";
import { appConfig } from "../data/config.js";

export default function PlaylistInput({ isChanging, error, onSubmit, onCancel }) {
  const [value, setValue] = useState("");
  const { openingLine, prompt, personal } = appConfig;
  const lines = openingLine.split("\n");

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(value);
  }

  return (
    <section className="absolute inset-0 flex flex-col items-center justify-center px-6">
      <p className="max-w-xs text-balance text-center font-serif2 text-[clamp(0.9rem,3vw,1.05rem)] italic leading-relaxed text-cream/80 md:max-w-sm">
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>

      <div className="mt-6 flex items-center gap-2">
        <span className="hairline w-10" />
        <h2 className="whitespace-nowrap font-hand text-[clamp(1.7rem,7.5vw,2.5rem)] text-ivory">{prompt}</h2>
        <span className="hairline w-10" />
      </div>

      <form className="mt-8 w-full max-w-sm" onSubmit={handleSubmit}>
        <label htmlFor="playlist-link" className="sr-only">
          Spotify playlist link
        </label>
        <div className="focus-ring rounded-md border border-sand/30 bg-[#1a120c]/55 px-4 py-3">
          <input
            id="playlist-link"
            type="text"
            name="playlist"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Spotify playlist ka link"
            autoComplete="off"
            spellCheck="false"
            enterKeyHint="go"
            className="w-full bg-transparent font-serif2 text-sm text-ivory placeholder:text-ivory/35 focus:outline-none"
          />
        </div>

        <button
          type="submit"
            className="touch-target mt-5 w-full rounded-md border border-gold/40 bg-gradient-to-b from-umber/80 to-earth/90 font-serif2 text-[clamp(0.72rem,2.2vw,0.8rem)] uppercase tracking-[0.25em] text-ivory transition-all duration-200 hover:border-gold/70 hover:from-umber/90 hover:to-earth active:scale-[0.98]"
        >
          Laayein
        </button>

        {isChanging && (
          <button
            type="button"
            onClick={onCancel}
            className="touch-target mt-3 w-full font-hand text-lg text-cream/55 underline-offset-4 transition-colors duration-200 hover:text-cream/85"
          >
            Wapas, geet chalta rahe
          </button>
        )}
      </form>

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

      <p className="mt-8 flex items-center gap-1.5 text-xs text-cream/40">
        <TulipMark className="h-3 w-3 text-accent/70" />
        <span>{personal.greeting}</span>
      </p>
    </section>
  );
}
