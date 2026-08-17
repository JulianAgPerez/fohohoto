import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChristmasDictionary } from "../types/ChristmasDictionary";

const BULB_COLORS = ["#ef4444", "#fbbf24", "#22c55e", "#3b82f6"];

const Home = () => {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const translations = useMemo(() => Object.values(ChristmasDictionary), []);
  const keys = useMemo(() => Object.keys(ChristmasDictionary), []);

  /** Palabra más larga: reserva el espacio del rotador para evitar cortes y saltos */
  const longestWord = useMemo(
    () => translations.reduce((a, b) => (a.length > b.length ? a : b)),
    [translations]
  );

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
      setIndex((prevIndex) => (prevIndex + 1) % translations.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [translations, reducedMotion]);

  return (
    <div className="relative flex h-screen min-h-[560px] flex-col items-center justify-center overflow-hidden bg-blue-950 px-4">
      {/* Capa de fondo: cielo nocturno + estrellas + viñeta */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="hero-sky absolute inset-0" />
        <div className="stars-bg absolute inset-0 opacity-60" />
        <div className="hero-vignette absolute inset-0" />
      </div>

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

      <div className="relative z-20 text-center">
        {/* Idioma de la palabra actual */}
        <AnimatePresence mode="wait">
          <motion.p
            key={keys[index]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-amber-200 sm:text-sm"
          >
            {keys[index]}
          </motion.p>
        </AnimatePresence>

        <h1 className="flex items-center justify-center font-christmas text-4xl text-red-500 sm:text-6xl md:text-8xl lg:text-9xl">
          ¡Feliz{" "}
          <span className="relative inline-flex justify-center">
            {/* Elemento invisible que reserva el ancho de la palabra más larga */}
            <span aria-hidden="true" className="invisible whitespace-nowrap">
              {longestWord}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={translations[index]}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
              >
                {translations[index]}
              </motion.span>
            </AnimatePresence>
          </span>
          <span>!</span>
        </h1>
      </div>
    </div>
  );
};

export default Home;