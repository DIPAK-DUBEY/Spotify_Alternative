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
      <div className="flex flex-row items-center justify-center gap-2 px-3.5 ">
        <span className="dot-blink h-2 w-2 translate-y-px rounded-full bg-current text-green-400" aria-hidden="true" />
        <span className="font-dev text-sm leading-none text-gold">
          {count.toLocaleString("en-IN")} Are There
        </span>
      </div>
    </motion.div>
  );
}
