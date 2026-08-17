import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChristmasGreetings } from "../types/ChristmasGreetings";

const BULB_COLORS = ["#ef4444", "#fbbf24", "#22c55e", "#3b82f6"];

const Home = () => {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const greetings = useMemo(() => Object.values(ChristmasGreetings), []);
  const keys = useMemo(() => Object.keys(ChristmasGreetings), []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % greetings.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [greetings, reducedMotion]);

  return (
    <div className="relative flex h-screen min-h-[560px] flex-col items-center justify-center overflow-hidden px-4">
      {/* Guirnalda de luces titilantes */}
      <ul
        className="absolute inset-x-0 top-0 z-10 flex justify-around px-2"
        aria-hidden="true"
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <li
            key={i}
            className="christmas-light h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: BULB_COLORS[i % BULB_COLORS.length],
              boxShadow: `0 0 12px ${BULB_COLORS[i % BULB_COLORS.length]}`,
              animationDelay: `${(i % 7) * 0.35}s`,
              animationDuration: `${1.6 + (i % 4) * 0.4}s`,
            }}
          />
        ))}
      </ul>

      <div className="relative z-20 w-full max-w-5xl text-center">
        {/* Idioma del saludo actual */}
        <AnimatePresence mode="wait">
          <motion.p
            key={keys[index]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-amber-200 sm:text-sm"
          >
            {keys[index]}
          </motion.p>
        </AnimatePresence>

        {/* Saludo completo que cambia de idioma */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={greetings[index]}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="text-balance font-christmas text-3xl text-red-500 sm:text-5xl md:text-7xl lg:text-8xl"
          >
            {greetings[index]}
          </motion.h1>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Home;