import { appConfig } from "../data/config.js";

export default function LoadingMemory() {
  const { loadingText } = appConfig;
  return (
    <section className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <span className="hairline mb-6 w-24" />
      <p className="breathe font-hand text-shadow-cinematic text-2xl text-ivory md:text-3xl">{loadingText}</p>
      <p className="mt-3 font-serif2 text-shadow-cinematic text-sm italic text-cream/80 md:text-base">
        Loading a few songs to open the player — the rest will follow.
      </p>
      <span className="hairline mt-6 w-24" />
    </section>
  );
}
