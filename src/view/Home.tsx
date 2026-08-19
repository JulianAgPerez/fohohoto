import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChristmasGreetings,
  ChristmasGreetingLangCodes,
  isLatinScript,
} from "../types/ChristmasGreetings";
import ChristmasLights from "../components/ChristmasLights";
import { useI18n } from "../i18n";

const Home = () => {
  const { t, lang, setLang } = useI18n();
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  const entries = useMemo(() => {
    const all = Object.entries(ChristmasGreetings);
    const preferredKey = lang === "en" ? "English" : "Spanish";
    return [
      [preferredKey, ChristmasGreetings[preferredKey]],
      ...all.filter(([key]) => key !== preferredKey),
    ];
  }, [lang]);
  const greetings = useMemo(() => entries.map(([, value]) => value), [entries]);
  const keys = useMemo(() => entries.map(([key]) => key), [entries]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % greetings.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [greetings, reducedMotion, paused]);

  useEffect(() => {
    setIndex((prevIndex) => (prevIndex >= greetings.length ? 0 : prevIndex));
  }, [greetings.length]);

  return (
    <div className="relative flex h-screen min-h-[560px] flex-col items-center justify-center overflow-hidden px-4">
      {/* Guirnalda de luces titilantes */}
      <ChristmasLights className="absolute inset-x-0 top-0 z-10 px-2" />

      <button
        type="button"
        onClick={() => setLang(lang === "es" ? "en" : "es")}
        aria-pressed={lang === "en"}
        aria-label={t("lang.button")}
        title={t("lang.button")}
        className="absolute left-6 top-14 z-20 rounded-full border border-amber-200/30 bg-slate-900/50 p-3 text-xs font-semibold uppercase tracking-wider text-amber-200/80 transition hover:text-amber-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/30 md:top-6"
      >
        <span aria-hidden="true">🌐</span> {lang === "es" ? "ES" : "EN"}
      </button>

      {!reducedMotion && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? t("greetings.resume") : t("greetings.pause")}
          className="absolute right-6 top-14 z-20 rounded-full border border-amber-200/30 bg-slate-900/50 p-3 text-amber-200/80 transition hover:text-amber-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200/30 md:top-6"
        >
          {paused ? (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          )}
        </button>
      )}

      <div className="relative z-20 w-full max-w-5xl text-center">
        {/* Marca */}
        <p className="mb-8 font-christmas text-2xl text-amber-100/90 sm:text-3xl">
          Fohohoto
        </p>

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
            lang={ChristmasGreetingLangCodes[keys[index]]}
            dir={
              ["ar", "he"].includes(ChristmasGreetingLangCodes[keys[index]])
                ? "rtl"
                : "ltr"
            }
            className={`text-balance ${
              isLatinScript(greetings[index]) ? "font-christmas" : "font-sans"
            } text-3xl text-berry-500 sm:text-5xl md:text-7xl lg:text-8xl`}
          >
            {greetings[index]}
          </motion.h1>
        </AnimatePresence>

        <p className="mt-4 font-handwriting text-base text-amber-100/75 sm:text-lg">
          {t("hero.magicLine")}
        </p>
        <p className="mt-6 text-base text-amber-100/80 sm:text-lg">
          {t("hero.subtitle")}
        </p>
        <button
          type="button"
          onClick={() =>
            document.getElementById("uploader")?.scrollIntoView({
              behavior: reducedMotion ? "auto" : "smooth",
            })
          }
          className="mt-8 rounded-full bg-gradient-to-r from-berry-600 to-berry-700 px-8 py-3.5 font-semibold text-white shadow-lg shadow-red-900/40 transition hover:from-berry-500 hover:to-berry-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-berry-300/50"
        >
          {t("hero.cta")}
        </button>
      </div>
    </div>
  );
};

export default Home;
