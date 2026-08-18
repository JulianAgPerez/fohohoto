import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent as ReactMouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useI18n } from "../i18n";
import type { Lang } from "../i18n";
import ChristmasLights from "./ChristmasLights";

const MAX_MESSAGE_LENGTH = 200;
const MAX_NAME_LENGTH = 60;
const MAX_NOTES = 100;
const MAX_TREE_ORNAMENTS = 20;
const COLLAPSED_NOTE_COUNT = 6;

interface TreeNote {
  id: string;
  name: string | null;
  message: string;
  created_at: string;
  position_x: number | null;
  position_y: number | null;
}

const ORNAMENT_COLORS = [
  { id: "orn-berry", from: "#ef4444", to: "#dc2626" },
  { id: "orn-green", from: "#22c55e", to: "#16a34a" },
  { id: "orn-gold", from: "#fbbf24", to: "#f59e0b" },
  { id: "orn-blue", from: "#3b82f6", to: "#2563eb" },
  { id: "orn-cream", from: "#f8fafc", to: "#e2e8f0" },
];

const ORNAMENT_POSITIONS: { x: number; y: number; r: number }[] = [
  { x: 120, y: 64, r: 12 },
  { x: 88, y: 100, r: 12 },
  { x: 152, y: 100, r: 12 },
  { x: 66, y: 136, r: 12 },
  { x: 120, y: 136, r: 12 },
  { x: 174, y: 136, r: 12 },
  { x: 52, y: 172, r: 12 },
  { x: 100, y: 172, r: 12 },
  { x: 146, y: 172, r: 12 },
  { x: 188, y: 172, r: 12 },
  { x: 72, y: 208, r: 12 },
  { x: 124, y: 208, r: 12 },
  { x: 166, y: 208, r: 12 },
  { x: 120, y: 240, r: 12 },
  { x: 76, y: 64, r: 12 },
  { x: 164, y: 64, r: 12 },
  { x: 120, y: 100, r: 12 },
  { x: 98, y: 208, r: 12 },
  { x: 92, y: 240, r: 12 },
  { x: 148, y: 240, r: 12 },
];

const TREE_LIGHTS: { x: number; y: number }[] = [
  { x: 62, y: 140 },
  { x: 178, y: 140 },
  { x: 48, y: 200 },
  { x: 192, y: 200 },
  { x: 34, y: 260 },
  { x: 206, y: 260 },
];

const formatRelativeDate = (iso: string, lang: Lang): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diff = date.getTime() - Date.now();
  const relative = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const absMinutes = Math.abs(Math.round(diff / 60000));
  if (absMinutes < 1) return relative.format(0, "second");
  const absHours = Math.abs(Math.round(diff / 3600000));
  if (absHours < 24) return relative.format(Math.round(diff / 3600000), "hour");
  const absDays = Math.abs(Math.round(diff / 86400000));
  if (absDays < 7) return relative.format(Math.round(diff / 86400000), "day");
  return new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(date);
};

const initialOf = (note: TreeNote): string => {
  const first = note.name?.trim().charAt(0);
  return first ? first.toUpperCase() : "✦";
};

const getNotePosition = (note: TreeNote, index: number) => {
  const fallback = ORNAMENT_POSITIONS[index % ORNAMENT_POSITIONS.length];
  if (note.position_x != null && note.position_y != null) {
    return { x: note.position_x, y: note.position_y, r: fallback.r };
  }
  return fallback;
};

const tooltipPreview = (note: TreeNote): string => {
  const message =
    note.message.length > 40 ? `${note.message.slice(0, 40)}…` : note.message;
  return note.name?.trim() ? `${note.name.trim()} — ${message}` : message;
};

const ChristmasTree: React.FC = () => {
  const { t, lang } = useI18n();
  const [notes, setNotes] = useState<TreeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [activeNote, setActiveNote] = useState<TreeNote | null>(null);
  const [hoveredNote, setHoveredNote] = useState<{
    note: TreeNote;
    index: number;
  } | null>(null);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [website, setWebsite] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const loadNotes = useCallback(
    async (showSpinner: boolean) => {
      if (!supabase) return;
      if (showSpinner) setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tree_notes")
          .select("id, name, message, created_at, position_x, position_y")
          .order("created_at", { ascending: false })
          .limit(MAX_NOTES);
        if (error) {
          setLoadError(t("tree.loadError"));
          return;
        }
        setLoadError(null);
        setNotes((data ?? []) as TreeNote[]);
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    void loadNotes(true);
  }, [loadNotes]);

  const openNote = (note: TreeNote) => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    setActiveNote(note);
  };

  const closeNote = () => {
    setActiveNote(null);
    restoreFocusRef.current?.focus();
    restoreFocusRef.current = null;
  };

  useEffect(() => {
    if (!activeNote) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNote();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeNote]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    if (website.trim()) {
      setMessage("");
      setName("");
      setSelectedPosition(null);
      setSubmitError(null);
      setSubmitSuccess(true);
      return;
    }
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setSubmitError(t("tree.messageRequired"));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    const { error } = await supabase.from("tree_notes").insert({
      name: name.trim() || null,
      message: trimmedMessage,
      position_x: selectedPosition?.x ?? null,
      position_y: selectedPosition?.y ?? null,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(t("tree.submitError"));
      return;
    }
    setMessage("");
    setName("");
    setSelectedPosition(null);
    setSubmitSuccess(true);
    await loadNotes(false);
  };

  const handleTreeClick = (event: ReactMouseEvent<SVGSVGElement>) => {
    // Ignora clicks fuera del arbol - usan hit-testing nativo
    const svg = event.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      ctm.inverse(),
    );
    const canopies = svg.querySelectorAll('[data-layer="canopy"]');
    const inside = Array.from(canopies).some((el) =>
      (el as SVGGeometryElement).isPointInFill(point),
    );
    if (!inside) return;
    if (!isSupabaseConfigured || submitting) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const viewBox = svg.viewBox.baseVal;
    const x = Math.round(
      Math.max(
        0,
        Math.min(
          viewBox.width,
          ((event.clientX - rect.left) / rect.width) * viewBox.width,
        ),
      ),
    );
    const y = Math.round(
      Math.max(
        0,
        Math.min(
          viewBox.height,
          ((event.clientY - rect.top) / rect.height) * viewBox.height,
        ),
      ),
    );
    setSelectedPosition({ x, y });
  };

  const treeNotes = notes.slice(0, MAX_TREE_ORNAMENTS);
  const visibleNotes = showAllNotes
    ? notes
    : notes.slice(0, COLLAPSED_NOTE_COUNT);

  return (
    <div className="flex flex-col items-center px-4 py-16">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-200/25 bg-slate-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
        <ChristmasLights
          count={10}
          className="absolute inset-x-0 -top-3 z-10 px-4"
        />

        <h2 className="mb-1 text-center font-christmas text-3xl text-berry-400 sm:text-4xl">
          {t("tree.title")}
        </h2>
        <p className="mb-6 text-center text-sm text-amber-100/75">
          {t("tree.subtitle")}
        </p>

        {/* Árbol con las notas colgadas como ornamentos */}
        <div className="relative mx-auto w-full max-w-sm">
          <svg
            ref={svgRef}
            viewBox="0 0 240 320"
            className={`h-auto w-full ${isSupabaseConfigured ? "cursor-crosshair" : ""}`}
            role="img"
            aria-label={t("tree.title")}
            onClick={handleTreeClick}
          >
            <title>{t("tree.title")}</title>
            {/* Gradientes radiales de las bolas */}
            <defs>
              {ORNAMENT_COLORS.map((c) => (
                <radialGradient key={c.id} id={c.id} cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stopColor={c.from} />
                  <stop offset="100%" stopColor={c.to} />
                </radialGradient>
              ))}
            </defs>
            {/* Estrella */}
            <path
              d="M120 10 l4.6 10.4 11.3 1.4 -8.4 7.8 2.3 11.2 -9.8 -5.7 -9.8 5.7 2.3 -11.2 -8.4 -7.8 11.3 -1.4 z"
              fill="#fcd34d"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
            {/* Copas del árbol */}
            <polygon
              points="120,42 62,140 178,140"
              fill="#047857"
              data-layer="canopy"
            />
            <polygon
              points="120,90 48,200 192,200"
              fill="#065f46"
              data-layer="canopy"
            />
            <polygon
              points="120,138 34,260 206,260"
              fill="#064e3b"
              data-layer="canopy"
            />
            {/* Tronco */}
            <rect
              x="106"
              y="260"
              width="28"
              height="28"
              rx="3"
              fill="#92400e"
            />
            {/* Sombra en la base */}
            <ellipse
              cx="120"
              cy="292"
              rx="92"
              ry="9"
              fill="#020617"
              opacity="0.5"
            />
            {/* Luces en los bordes */}
            {TREE_LIGHTS.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill="#fbbf24"
                className="christmas-light"
                style={{
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${1.6 + (i % 3) * 0.4}s`,
                }}
              />
            ))}
            {/* Notas como ornamentos (las más recientes primero) */}
            {treeNotes.map((note, i) => {
              const position = getNotePosition(note, i);
              const color = ORNAMENT_COLORS[i % ORNAMENT_COLORS.length];
              const fillId = `url(#${color.id})`;
              const label = note.name?.trim()
                ? `${note.name.trim()} — ${note.message}`
                : note.message;
              return (
                <g
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  className="ornament-swing cursor-pointer"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "top center",
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    openNote(note);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      openNote(note);
                    }
                  }}
                  onMouseEnter={() => setHoveredNote({ note, index: i })}
                  onMouseLeave={() => setHoveredNote(null)}
                  onFocus={() => setHoveredNote({ note, index: i })}
                  onBlur={() => setHoveredNote(null)}
                >
                  <line
                    x1={position.x}
                    y1={position.y - position.r - 12}
                    x2={position.x}
                    y2={position.y - position.r}
                    stroke="#d6d3d1"
                    strokeWidth="0.8"
                  />
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={position.r + 4}
                    fill={fillId}
                    opacity="0.2"
                  />
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={position.r}
                    fill={fillId}
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="1"
                  />
                  <ellipse
                    cx={position.x - position.r * 0.35}
                    cy={position.y - position.r * 0.4}
                    rx={position.r * 0.3}
                    ry={position.r * 0.16}
                    fill="#ffffff"
                    opacity="0.35"
                    transform={`rotate(-28 ${position.x - position.r * 0.35} ${position.y - position.r * 0.4})`}
                  />
                  <text
                    x={position.x}
                    y={position.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="11"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {initialOf(note)}
                  </text>
                </g>
              );
            })}
            {/* Marcador de la posición elegida por el visitante */}
            {selectedPosition && (
              <g pointerEvents="none">
                <circle
                  cx={selectedPosition.x}
                  cy={selectedPosition.y}
                  r={15}
                  fill="#fcd34d"
                  opacity="0.18"
                />
                <circle
                  cx={selectedPosition.x}
                  cy={selectedPosition.y}
                  r={10}
                  fill="none"
                  stroke="#fcd34d"
                  strokeWidth="2.5"
                  className="animate-ping"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                  }}
                />
                <circle
                  cx={selectedPosition.x}
                  cy={selectedPosition.y}
                  r={5}
                  fill="#fcd34d"
                />
              </g>
            )}
          </svg>
          {hoveredNote && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-20 max-w-[220px] -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-lg bg-slate-900/90 px-2.5 py-1.5 text-xs leading-snug text-amber-50 shadow-lg shadow-black/40 ring-1 ring-amber-200/20"
              style={{
                left: `${
                  (getNotePosition(hoveredNote.note, hoveredNote.index).x /
                    240) *
                  100
                }%`,
                top: `${
                  (getNotePosition(hoveredNote.note, hoveredNote.index).y /
                    320) *
                  100
                }%`,
              }}
            >
              {tooltipPreview(hoveredNote.note)}
            </div>
          )}
        </div>

        {isSupabaseConfigured && (
          <p className="mt-3 text-center text-xs text-amber-100/60">
            {selectedPosition
              ? t("tree.positionPicked")
              : t("tree.pickPosition")}
          </p>
        )}

        {isSupabaseConfigured ? (
          <>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="tree-name"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-amber-100/60"
                >
                  {t("tree.formName")}
                </label>
                <input
                  id="tree-name"
                  type="text"
                  maxLength={MAX_NAME_LENGTH}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setSubmitSuccess(false);
                  }}
                  placeholder={t("tree.namePlaceholder")}
                  className="w-full rounded-xl border border-amber-200/15 bg-slate-800/40 px-4 py-3 text-sm text-amber-50 placeholder:text-amber-100/40 focus:border-amber-300/60 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                />
              </div>
              <div>
                <label
                  htmlFor="tree-message"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-amber-100/60"
                >
                  {t("tree.formMessage")}
                </label>
                <textarea
                  id="tree-message"
                  required
                  rows={3}
                  maxLength={MAX_MESSAGE_LENGTH}
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    setSubmitSuccess(false);
                  }}
                  placeholder={t("tree.messagePlaceholder")}
                  className="w-full resize-none rounded-xl border border-amber-200/15 bg-slate-800/40 px-4 py-3 text-sm text-amber-50 placeholder:text-amber-100/40 focus:border-amber-300/60 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                />
                <p className="mt-1 text-right text-xs text-amber-100/50">
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </p>
              </div>

              <div className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="tree-website">Website</label>
                <input
                  id="tree-website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              {submitError && (
                <p
                  role="alert"
                  className="rounded-lg bg-berry-500/15 px-3 py-2 text-sm text-berry-300"
                >
                  {submitError}
                </p>
              )}
              {submitSuccess && (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300"
                >
                  {t("tree.success")}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full rounded-full bg-gradient-to-r from-berry-600 to-berry-700 px-6 py-3 font-semibold text-white shadow-lg shadow-red-900/40 transition hover:from-berry-500 hover:to-berry-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-berry-300/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? t("tree.submitting") : t("tree.submit")}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-amber-100/60">
              {t("tree.noteCount", { n: notes.length })}
            </p>
          </>
        ) : (
          <p
            role="status"
            className="mt-6 rounded-xl border border-amber-200/15 bg-slate-800/40 px-4 py-3 text-center text-sm text-amber-100/70"
          >
            {t("tree.comingSoon")}
          </p>
        )}
      </div>

      {/* Grilla de notas existentes */}
      {isSupabaseConfigured && (
        <div className="mt-12 w-full max-w-4xl">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-300/30 border-t-amber-300" />
            </div>
          ) : loadError ? (
            <p
              role="alert"
              className="mx-auto max-w-lg rounded-xl border border-amber-200/15 bg-slate-800/40 px-4 py-3 text-center text-sm text-berry-300"
            >
              {loadError}
            </p>
          ) : notes.length === 0 ? (
            <p className="text-center text-sm text-amber-100/70">
              {t("tree.empty")}
            </p>
          ) : (
            <>
              <h3 className="mb-4 text-center font-christmas text-2xl text-amber-200 sm:text-3xl">
                {t("tree.notesTitle")}
              </h3>
              <ul
                id="tree-notes-grid"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                {visibleNotes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-2xl border border-amber-200/15 bg-slate-800/40 p-4 shadow-lg shadow-black/20"
                  >
                    <p className="whitespace-pre-wrap break-words text-sm text-amber-50">
                      {note.message}
                    </p>
                    <p className="mt-2 flex items-center justify-between gap-2 text-xs text-amber-100/60">
                      <span className="font-semibold">
                        {note.name?.trim() || t("tree.anonymous")}
                      </span>
                      <time dateTime={note.created_at}>
                        {formatRelativeDate(note.created_at, lang)}
                      </time>
                    </p>
                  </li>
                ))}
              </ul>
              {notes.length > COLLAPSED_NOTE_COUNT && (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllNotes((value) => !value)}
                    aria-expanded={showAllNotes}
                    aria-controls="tree-notes-grid"
                    className="rounded-full border border-amber-200/20 bg-slate-800/40 px-5 py-2 text-sm font-medium text-amber-100/80 transition hover:border-amber-200/40 hover:text-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
                  >
                    {showAllNotes
                      ? t("tree.hideAll")
                      : t("tree.viewAll", { n: notes.length })}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal nota de papel */}
      <AnimatePresence>
        {activeNote && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeNote}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={activeNote.name?.trim() || t("tree.anonymous")}
              initial={{ scale: 0.85, rotate: -4, opacity: 0 }}
              animate={{ scale: 1, rotate: -2, opacity: 1 }}
              exit={{ scale: 0.85, rotate: -4, opacity: 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 220 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-sm rounded-lg bg-[#fef9c3] p-6 pt-9 shadow-2xl shadow-black/50"
            >
              <div
                aria-hidden="true"
                className="sticky-tape absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 rotate-[-3deg] rounded-sm"
              />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeNote}
                aria-label={t("tree.close")}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-lg text-slate-500 transition hover:bg-slate-900/10 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
              >
                ×
              </button>
              <p className="whitespace-pre-wrap break-words font-handwriting text-2xl leading-snug text-slate-800">
                {activeNote.message}
              </p>
              <p className="mt-4 flex items-center justify-between gap-2 text-sm font-semibold text-slate-600">
                <span>{activeNote.name?.trim() || t("tree.anonymous")}</span>
                <time
                  dateTime={activeNote.created_at}
                  className="font-normal text-slate-500"
                >
                  {formatRelativeDate(activeNote.created_at, lang)}
                </time>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChristmasTree;
