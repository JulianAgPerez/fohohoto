import React, { lazy, Suspense } from "react";
import SnowEffect from "./components/SnowEffect";
import Home from "./view/Home";
import ImageUploader from "./components/ImageUploader";
import { useI18n } from "./i18n";

const ChristmasTree = lazy(() => import("./components/ChristmasTree"));

const daysUntilChristmas = () => {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  let christmas = new Date(todayStart.getFullYear(), 11, 25);
  if (todayStart.getTime() > christmas.getTime()) {
    christmas = new Date(todayStart.getFullYear() + 1, 11, 25);
  }
  return Math.round((christmas.getTime() - todayStart.getTime()) / 86400000);
};

const App: React.FC = () => {
  const { t } = useI18n();
  const days = daysUntilChristmas();
  const countdownText =
    days === 0
      ? t("countdown.merryChristmas")
      : days === 1
        ? t("countdown.oneDay")
        : t("countdown.days", { n: days });

  return (
    <div className="relative min-h-screen bg-blue-950">
      {/* Fondo nocturno */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="hero-sky absolute inset-0" />
        <div className="stars-bg absolute inset-0 opacity-60" />
        <div className="hero-vignette absolute inset-0" />
      </div>
      <div className="relative z-10">
        <Home />
        <SnowEffect />
        <section id="uploader">
          <ImageUploader />
        </section>
        <section id="arbol">
          <Suspense
            fallback={
              <div className="flex items-center justify-center px-4 py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-300/30 border-t-amber-300" />
              </div>
            }
          >
            <ChristmasTree />
          </Suspense>
        </section>
      </div>
      <footer className="relative z-10 pb-10 pt-2 text-center text-sm text-amber-100/75">
        {t("footer.credit")}
        <a href="https://www.linkedin.com/in/julian-perez-dev/">Julian</a>
        <p className="mt-1 text-xs text-amber-100/60">{countdownText}</p>
      </footer>
    </div>
  );
};

export default App;
