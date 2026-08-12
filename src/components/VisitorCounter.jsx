import { motion } from "framer-motion";

export default function VisitorCounter({ count }) {
  if (count === null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-[max(env(safe-area-inset-top),0.7rem)]"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gradient-to-b from-[#24180F]/85 to-[#120C08]/80 px-3.5 py-1 shadow-md shadow-black/30 backdrop-blur-md">
        <span className="dot-blink h-2 w-2 rounded-full bg-green-400" aria-hidden="true" />
        <span className="font-dev text-sm text-gold">
          {count.toLocaleString("en-IN")} visits
        </span>
      </div>
    </motion.div>
  );
}
