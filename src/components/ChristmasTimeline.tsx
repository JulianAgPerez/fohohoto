import React, { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n";

type StopId = "home" | "postcard" | "tree";

interface StopPositions {
  home: number;
  postcard: number;
  tree: number;
}

interface Stop {
  id: StopId;
  label: string;
  action: () => void;
}

const clamp = (value: number): number => Math.min(100, Math.max(0, value));

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9L12 2z" />
  </svg>
);

const PostcardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M6.5 10.5v3.5" />
    <path d="M10 10.5h7" />
    <path d="M10 14h5" />
    <path
      d="M15.5 5l5.5 5.5V7a2 2 0 0 0-2-2z"
      fill="currentColor"
      stroke="none"
      opacity="0.5"
    />
  </svg>
);

const TreeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 1.8L17 8.5H7z" />
    <path d="M12 6.5L19 14.5H5z" />
    <path d="M12 11.5L20.5 21H3.5z" />
    <rect x="10.7" y="19.8" width="2.6" height="2.6" rx="0.4" />
  </svg>
);

const SantaSvg: React.FC<{
  className?: string;
  orientation?: "horizontal" | "vertical";
}> = ({ className, orientation = "horizontal" }) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {orientation === "horizontal" ? (
      <>
        {/* Banda blanca del gorro sobre la frente */}
        <path
          d="M18.7 9.8 C 16.9 7.6, 13.4 7.7, 12.1 10.3"
          stroke="#f8fafc"
          strokeWidth="1.8"
        />
        {/* Gorro: cono que nace de la cabeza y cae hacia atrás (izquierda) */}
        <path
          d="M18.7 9.8 C 18.7 4.4, 14.8 2.2, 11.9 3.2 C 9 4.2, 6.4 7.4, 7.9 10.6"
          stroke="#ef4444"
          strokeWidth="2"
        />
        {/* Pompón conectado al extremo de la cola */}
        <circle cx="7.9" cy="10.6" r="2" stroke="#f8fafc" strokeWidth="1.8" />
        {/* Cabeza de perfil */}
        <circle cx="16" cy="14.5" r="5.5" stroke="#f8fafc" strokeWidth="1.8" />
        {/* Nariz hacia la derecha (dirección de avance) */}
        <path
          d="M20.5 13.5 C 22.2 13.5, 23 15, 21.8 16 C 21 16.8, 20.2 16.2, 20.2 16"
          stroke="#f8fafc"
          strokeWidth="1.5"
        />
        {/* Barba que cae del mentón */}
        <path
          d="M11.5 17.5 C 12.5 22.5, 18.5 23.5, 21.5 18.5 C 22 17.5, 21 16.5, 20 16.8"
          stroke="#f8fafc"
          strokeWidth="1.8"
        />
        {/* Hombro/espalda con capa */}
        <path
          d="M12.5 27.5 C 12.5 22.5, 26 22.5, 26 27.5"
          stroke="#ef4444"
          strokeWidth="2"
        />
      </>
    ) : (
      <>
        {/* Banda blanca del gorro sobre la frente */}
        <path
          d="M18.7 5.2 C 16.8 3.2, 13.4 3.3, 12.7 5.5"
          stroke="#f8fafc"
          strokeWidth="1.8"
        />
        {/* Gorro: cono que nace de la cabeza y cae hacia arriba (detrás de la cabeza) */}
        <path
          d="M18.7 5.2 C 19 1.6, 15 0.6, 12.2 1.3 C 10.4 1.7, 8.4 1.9, 8.6 3.2"
          stroke="#ef4444"
          strokeWidth="2"
        />
        {/* Pompón conectado al extremo de la cola */}
        <circle cx="8.6" cy="3.2" r="2" stroke="#f8fafc" strokeWidth="1.8" />
        {/* Cabeza de perfil mirando hacia abajo */}
        <circle cx="16" cy="10" r="5.5" stroke="#f8fafc" strokeWidth="1.8" />
        {/* Nariz apuntando hacia abajo (dirección de avance) */}
        <path
          d="M17 14.5 C 17 16.2, 15.5 17, 14.5 15.8 C 13.7 15, 14.3 14.2, 14.5 14.2"
          stroke="#f8fafc"
          strokeWidth="1.5"
        />
        {/* Barba que cuelga del mentón */}
        <path
          d="M11.5 13.5 C 11 18, 13 22.5, 16 22.8 C 19.2 22.5, 21.5 18.5, 20.8 13.8 C 21.6 13, 20.8 12.3, 20 12.9"
          stroke="#f8fafc"
          strokeWidth="1.8"
        />
        {/* Hombro/espalda con capa */}
        <path
          d="M10.5 28 C 10.5 23.5, 25 23.5, 25 28"
          stroke="#ef4444"
          strokeWidth="2"
        />
      </>
    )}
  </svg>
);

const ChristmasTimeline: React.FC = () => {
  const { t } = useI18n();
  const [progress, setProgress] = useState(0);
  const [positions, setPositions] = useState<StopPositions>({
    home: 0,
    postcard: 50,
    tree: 100,
  });
  const rafRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [desktop, setDesktop] = useState(false);
  const [trackSize, setTrackSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const updateDesktop = () => setDesktop(mq.matches);
    updateDesktop();
    mq.addEventListener("change", updateDesktop);
    return () => mq.removeEventListener("change", updateDesktop);
  }, []);

  const measure = useCallback(() => {
    if (typeof document === "undefined") return;
    const absoluteTop = (el: HTMLElement | null): number =>
      el ? el.getBoundingClientRect().top + window.scrollY : 0;
    const treeTop = Math.max(1, absoluteTop(document.getElementById("arbol")));
    setPositions({
      home: 0,
      postcard: clamp(
        (absoluteTop(document.getElementById("uploader")) / treeTop) * 100,
      ),
      tree: 100,
    });
    const rect = trackRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      setTrackSize({ width: rect.width, height: rect.height });
    }
  }, []);

  const update = useCallback(() => {
    rafRef.current = null;
    if (typeof document === "undefined") return;
    const treeEl = document.getElementById("arbol");
    if (!treeEl) return;
    const treeTop = Math.max(
      1,
      treeEl.getBoundingClientRect().top + window.scrollY,
    );
    setProgress(clamp((window.scrollY / treeTop) * 100));
    measure();
  }, [measure]);

  const schedule = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(update);
  }, [update]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    measure();
    const mountRaf = window.requestAnimationFrame(measure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => schedule())
        : null;
    if (observer) observer.observe(document.documentElement);
    return () => {
      window.cancelAnimationFrame(mountRaf);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (observer) observer.disconnect();
    };
  }, [measure, schedule]);

  const stops: Stop[] = [
    {
      id: "home",
      label: t("timeline.home"),
      action: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    },
    {
      id: "postcard",
      label: t("timeline.postcard"),
      action: () =>
        document
          .getElementById("uploader")
          ?.scrollIntoView({ behavior: "smooth" }),
    },
    {
      id: "tree",
      label: t("timeline.tree"),
      action: () => {
        window.dispatchEvent(new Event("fohohoto:tree-request"));
        const treeEl = document.getElementById("arbol");
        if (!treeEl) return;
        const scrollToTree = () => {
          const top = treeEl.getBoundingClientRect().top + window.scrollY + 64;
          window.scrollTo({ top, behavior: "smooth" });
        };

        if (treeEl.querySelector("h2")) {
          scrollToTree();
          return;
        }
        let attempts = 0;
        const waitForTree = () => {
          attempts += 1;
          if (treeEl.querySelector("h2") || attempts > 120) {
            scrollToTree();
            return;
          }
          window.requestAnimationFrame(waitForTree);
        };
        window.requestAnimationFrame(waitForTree);
      },
    },
  ];

  const santaSize = 32;
  const halfSanta = santaSize / 2;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;
  const trackWidth =
    trackSize.width > 0
      ? trackSize.width
      : desktop
        ? 28
        : Math.min(viewportWidth * 0.9, 560);
  const trackHeight =
    trackSize.height > 0
      ? trackSize.height
      : desktop
        ? Math.min(viewportHeight * 0.6, 380)
        : 24;
  const cappedProgress = Math.min(progress, positions.tree);
  const santaT = Math.min(
    1,
    Math.max(0, cappedProgress / Math.max(positions.tree, 1)),
  );
  const treeButtonX = (positions.tree / 100) * trackWidth;
  const treeButtonY = (positions.tree / 100) * trackHeight;
  const santaCenter = desktop
    ? Math.min(
        trackHeight - halfSanta,
        halfSanta + (treeButtonY - halfSanta) * santaT,
      )
    : Math.min(
        trackWidth - halfSanta,
        halfSanta + (treeButtonX - halfSanta) * santaT,
      );

  return (
    <nav
      aria-label={t("timeline.aria")}
      className={`fixed z-50 ${
        desktop
          ? "top-1/2 right-6 -translate-y-1/2"
          : "pointer-events-none top-3 left-1/2 -translate-x-1/2"
      }`}
    >
      <div
        ref={trackRef}
        className={`relative ${
          desktop ? "h-[min(60vh,380px)] w-7" : "h-6 w-[min(90vw,560px)]"
        }`}
      >
        {/* Track */}
        <div
          className={`absolute rounded-full bg-slate-800/60 ${
            desktop
              ? "top-0 left-1/2 w-1.5 -translate-x-1/2"
              : "left-0 top-1/2 h-1.5 -translate-y-1/2"
          }`}
          style={
            desktop
              ? { height: `${positions.tree}%` }
              : { width: `${positions.tree}%` }
          }
        />
        {/* Camino recorrido */}
        <div
          className={`absolute rounded-full bg-gradient-to-r from-amber-300 to-emerald-500 ${
            desktop
              ? "top-0 left-1/2 w-1.5 -translate-x-1/2"
              : "top-1/2 left-0 h-1.5 -translate-y-1/2"
          }`}
          style={
            desktop
              ? { height: `${cappedProgress}%` }
              : { width: `${cappedProgress}%` }
          }
        />
        {stops.map((stop) => (
          <button
            key={stop.id}
            type="button"
            onClick={stop.action}
            aria-label={stop.label}
            title={stop.label}
            className={`group pointer-events-auto absolute z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 bg-slate-900 text-amber-200 shadow-md shadow-black/30 transition hover:border-amber-300 hover:text-amber-50 focus-visible:border-amber-300 focus-visible:text-amber-50 focus-visible:outline-none ${
              desktop ? "left-1/2 -translate-x-1/2" : "top-1/2 -translate-y-1/2"
            }`}
            style={
              desktop
                ? { top: `${positions[stop.id]}%` }
                : { left: `${positions[stop.id]}%` }
            }
          >
            {stop.id === "home" && <StarIcon className="h-3.5 w-3.5" />}
            {stop.id === "postcard" && <PostcardIcon className="h-3.5 w-3.5" />}
            {stop.id === "tree" && <TreeIcon className="h-3.5 w-3.5" />}
            <span
              className={`pointer-events-none absolute z-40 rounded bg-slate-900 px-2 py-1 text-xs whitespace-nowrap text-amber-50 opacity-0 shadow-lg shadow-black/40 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${
                desktop
                  ? "top-1/2 right-full mr-2 -translate-y-1/2"
                  : "-top-9 left-1/2 -translate-x-1/2"
              }`}
            >
              {stop.label}
            </span>
          </button>
        ))}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute z-30 drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)] ${
            desktop
              ? "left-1/2 -translate-x-1/2 -translate-y-1/2"
              : "top-1/2 -translate-x-1/2 -translate-y-1/2"
          }`}
          style={
            desktop ? { top: `${santaCenter}px` } : { left: `${santaCenter}px` }
          }
        >
          <SantaSvg
            orientation={desktop ? "vertical" : "horizontal"}
            className="h-8 w-8"
          />
        </div>
      </div>
    </nav>
  );
};

export default ChristmasTimeline;
