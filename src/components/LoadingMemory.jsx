import { appConfig } from "../data/config.js";

export default function LoadingMemory() {
  const { loadingText } = appConfig;
  return (
    <section className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <span className="hairline mb-6 w-24" />
      <p className="breathe font-hand text-2xl text-ivory md:text-3xl">{loadingText}</p>
      <p className="mt-3 font-serif2 text-sm italic text-cream/60 md:text-base">
        Pehle kuch geet laakar player kholege — baaki piche-piche aa jayenge.
      </p>
      <span className="hairline mt-6 w-24" />
    </section>
  );
}
