import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChristmasGreetings } from "../types/ChristmasGreetings";
import ChristmasLights from "../components/ChristmasLights";

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
      <ChristmasLights className="absolute inset-x-0 top-0 z-10 px-2" />

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

      {/* Indicador de scroll */}
      <button
        type="button"
        aria-label="Bajar a la herramienta"
        onClick={() =>
          document.getElementById("uploader")?.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
          })
        }
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full p-2 text-amber-200/70 transition hover:text-amber-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/30"
      >
        <svg
          className="h-8 w-8 animate-bounce"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  );
};

export default Home;