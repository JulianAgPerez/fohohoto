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
  type: string | null;
  color: string | null;
}

const ORNAMENT_COLORS = [
  { id: "orn-berry", from: "#ef4444", to: "#dc2626" },
  { id: "orn-green", from: "#22c55e", to: "#16a34a" },
  { id: "orn-gold", from: "#fbbf24", to: "#f59e0b" },
  { id: "orn-blue", from: "#3b82f6", to: "#2563eb" },
  { id: "orn-cream", from: "#f8fafc", to: "#e2e8f0" },
];

const ORNAMENT_TYPES = ["ball", "bow", "bell", "star", "snowflake"] as const;

type OrnamentType = (typeof ORNAMENT_TYPES)[number];

type OrnamentColorId = (typeof ORNAMENT_COLORS)[number]["id"];

// Hash FNV-1a de 31 bits (masked a 0x7fffffff) para asignar un tipo
// determinista a las notas sin tipo guardado (las existentes antes del backfill).
const fnv1a31 = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) & 0x7fffffff;
};

const fallbackType = (noteId: string): OrnamentType =>
  ORNAMENT_TYPES[fnv1a31(noteId) % ORNAMENT_TYPES.length];

const isOrnamentType = (value: string | null): value is OrnamentType =>
  value !== null && (ORNAMENT_TYPES as readonly string[]).includes(value);

const ornamentTypeOf = (note: TreeNote): OrnamentType =>
  isOrnamentType(note.type) ? note.type : fallbackType(note.id);

const colorOf = (note: TreeNote): (typeof ORNAMENT_COLORS)[number] =>
  ORNAMENT_COLORS.find((c) => c.id === note.color) ??
  ORNAMENT_COLORS[fnv1a31(note.id) % ORNAMENT_COLORS.length];

const ORNAMENT_POSITIONS: { x: number; y: number; r: number }[] = [
  { x: 120, y: 64, r: 12 },
  { x: 88, y: 100, r: 12 },
  { x: 152, y: 100, r: 12 },
  { x: 66, y: 136, r: 12 },
  { x: 120, y: 136, r: 12 },
  { x: 174, y: 136, r: 12 },
  { x: 68, y: 178, r: 12 },
  { x: 100, y: 172, r: 12 },
  { x: 146, y: 172, r: 12 },
  { x: 172, y: 178, r: 12 },
  { x: 72, y: 208, r: 12 },
  { x: 124, y: 208, r: 12 },
  { x: 166, y: 208, r: 12 },
  { x: 120, y: 240, r: 12 },
  { x: 96, y: 72, r: 12 },
  { x: 144, y: 72, r: 12 },
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

interface OrnamentShapeProps {
  type: OrnamentType;
  x: number;
  y: number;
  r: number;
  fill: string;
  hex: string;
  initial: string;
}

const OrnamentShape: React.FC<OrnamentShapeProps> = ({
  type,
  x,
  y,
  r,
  fill,
  hex,
  initial,
}) => {
  switch (type) {
    case "ball":
      return (
        <>
          <circle cx={x} cy={y} r={r + 4} fill={fill} opacity="0.2" />
          <circle
            cx={x}
            cy={y}
            r={r}
            fill={fill}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="1"
          />
          <ellipse
            cx={x - r * 0.35}
            cy={y - r * 0.4}
            rx={r * 0.3}
            ry={r * 0.16}
            fill="#ffffff"
            opacity="0.35"
            transform={`rotate(-28 ${x - r * 0.35} ${y - r * 0.4})`}
          />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fontWeight="700"
            fill="#ffffff"
          >
            {initial}
          </text>
        </>
      );
    case "bow": {
      // Lazo navideño
      const leftTail = `M ${x - 3} ${y - 1} L ${x + 1.5} ${y} L ${x - 0.5} ${y + 9} L ${x - 2.25} ${y + 11} L ${x - 4} ${y + 9} Z`;
      const rightTail = `M ${x + 3} ${y - 1} L ${x - 1.5} ${y} L ${x + 0.5} ${y + 9} L ${x + 2.25} ${y + 11} L ${x + 4} ${y + 9} Z`;
      const leftO = `M ${x - 3} ${y} C ${x - 4} ${y - 8} ${x - 11} ${y - 8} ${x - 9} ${y - 1} C ${x - 11} ${y + 6} ${x - 4} ${y + 6} ${x - 3} ${y} Z`;
      const rightO = `M ${x + 3} ${y} C ${x + 4} ${y - 8} ${x + 11} ${y - 8} ${x + 9} ${y - 1} C ${x + 11} ${y + 6} ${x + 4} ${y + 6} ${x + 3} ${y} Z`;
      return (
        <>
          <path d={leftTail} fill={hex} opacity="0.9" />
          <path d={rightTail} fill={hex} opacity="0.9" />
          <path
            d={leftO}
            fill={fill}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.6"
          />
          <path
            d={rightO}
            fill={fill}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.6"
          />
          <circle
            cx={x}
            cy={y}
            r="5"
            fill={fill}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.8"
          />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="7.5"
            fontWeight="700"
            fill="#ffffff"
          >
            {initial}
          </text>
        </>
      );
    }
    case "bell": {
      // Campana
      const bellPath = `M ${x - 3} ${y - 8} Q ${x} ${y - 10.5} ${x + 3} ${y - 8} L ${x + 5} ${y + 2} Q ${x + 5.5} ${y + 5} ${x + 2.5} ${y + 4.5} Q ${x} ${y + 6} ${x - 2.5} ${y + 4.5} Q ${x - 5.5} ${y + 5} ${x - 5} ${y + 2} Z`;
      return (
        <>
          <path
            d={bellPath}
            fill={fill}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="0.7"
          />
          <circle
            cx={x}
            cy={y - 10.5}
            r="1.5"
            fill="none"
            stroke={hex}
            strokeWidth="1.1"
          />
          <circle cx={x} cy={y + 7} r="2.5" fill="#fbbf24" />
          <text
            x={x}
            y={y + 11}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="8"
            fontWeight="700"
            fill="#ffffff"
          >
            {initial}
          </text>
        </>
      );
    }
    case "star": {
      // Estrella
      const inner =
        (12 * Math.sin(Math.PI / 10)) / Math.sin((3 * Math.PI) / 10);
      const points = Array.from({ length: 10 }, (_, i) => {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const radius = i % 2 === 0 ? 12 : inner;
        return `${(x + radius * Math.cos(angle)).toFixed(2)} ${(y + radius * Math.sin(angle)).toFixed(2)}`;
      }).join(" L ");
      return (
        <>
          <path
            d={`M ${points} Z`}
            fill={fill}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="0.8"
          />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="8"
            fontWeight="700"
            fill="#ffffff"
          >
            {initial}
          </text>
        </>
      );
    }
    case "snowflake": {
      // Copo de nieve
      const arms: { x1: number; y1: number; x2: number; y2: number }[] = [];
      const twigs: { x1: number; y1: number; x2: number; y2: number }[] = [];
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI) / 3;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        arms.push({
          x1: x - dx * 10,
          y1: y - dy * 10,
          x2: x + dx * 10,
          y2: y + dy * 10,
        });
        for (const side of [1, -1]) {
          const bx = x + dx * 6 * side;
          const by = y + dy * 6 * side;
          twigs.push({
            x1: bx - dy * 3.5,
            y1: by + dx * 3.5,
            x2: bx + dy * 3.5,
            y2: by - dx * 3.5,
          });
        }
      }
      return (
        <>
          <circle cx={x} cy={y} r="6" fill="rgba(255,255,255,0.6)" />
          {arms.map((line, i) => (
            <line
              key={`arm-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#e0f2fe"
              strokeWidth="2"
            />
          ))}
          {twigs.map((twig, i) => (
            <line
              key={`twig-${i}`}
              x1={twig.x1}
              y1={twig.y1}
              x2={twig.x2}
              y2={twig.y2}
              stroke="#e0f2fe"
              strokeWidth="1.5"
            />
          ))}
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="7"
            fontWeight="700"
            fill="#0284c7"
          >
            {initial}
          </text>
        </>
      );
    }
  }
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
  const [ornamentType, setOrnamentType] = useState<OrnamentType>("ball");
  const [ornamentColor, setOrnamentColor] = useState<OrnamentColorId | null>(
    null,
  );
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
          .select(
            "id, name, message, created_at, position_x, position_y, type, color",
          )
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
      setOrnamentType("ball");
      setOrnamentColor(null);
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
    const { count } = await supabase
      .from("tree_notes")
      .select("*", { count: "exact", head: true });
    const colorId = ORNAMENT_COLORS[(count ?? 0) % ORNAMENT_COLORS.length].id;
    const { error } = await supabase.from("tree_notes").insert({
      name: name.trim() || null,
      message: trimmedMessage,
      position_x: selectedPosition?.x ?? null,
      position_y: selectedPosition?.y ?? null,
      type: ornamentType,
      color: ornamentColor ?? colorId,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(t("tree.submitError"));
      return;
    }
    setMessage("");
    setName("");
    setSelectedPosition(null);
    setOrnamentType("ball");
    setOrnamentColor(null);
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
              const color = colorOf(note);
              const fillId = `url(#${color.id})`;
              const label = note.name?.trim()
                ? `${note.name.trim()} — ${note.message}`
                : note.message;
              const type = ornamentTypeOf(note);
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
                  <OrnamentShape
                    type={type}
                    x={position.x}
                    y={position.y}
                    r={position.r}
                    fill={fillId}
                    hex={color.to}
                    initial={initialOf(note)}
                  />
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

              <fieldset>
                <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-amber-100/60">
                  {t("tree.type.label")}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {ORNAMENT_TYPES.map((type) => {
                    const selected = ornamentType === type;
                    return (
                      <label
                        key={type}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                          selected
                            ? "border-amber-300/70 bg-amber-300/20 text-amber-50"
                            : "border-amber-200/15 bg-slate-800/40 text-amber-100/70 hover:border-amber-200/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="ornament-type"
                          value={type}
                          checked={selected}
                          onChange={() => {
                            setOrnamentType(type);
                            setSubmitSuccess(false);
                          }}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              type === "ball"
                                ? "#ef4444"
                                : type === "bow"
                                  ? "#f59e0b"
                                  : type === "bell"
                                    ? "#eab308"
                                    : type === "star"
                                      ? "#fcd34d"
                                      : "#bae6fd",
                          }}
                        />
                        {t(`tree.type.${type}`)}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-3">
                <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-amber-100/60">
                  {t("tree.color.label")}
                </legend>
                <div className="flex flex-wrap gap-2">
                  <label
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                      ornamentColor === null
                        ? "border-amber-300/70 bg-amber-300/20 text-amber-50"
                        : "border-amber-200/15 bg-slate-800/40 text-amber-100/70 hover:border-amber-200/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="ornament-color"
                      value="auto"
                      checked={ornamentColor === null}
                      onChange={() => {
                        setOrnamentColor(null);
                        setSubmitSuccess(false);
                      }}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500"
                    />
                    {t("tree.color.auto")}
                  </label>
                  {ORNAMENT_COLORS.map((c) => {
                    const selected = ornamentColor === c.id;
                    return (
                      <label
                        key={c.id}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                          selected
                            ? "border-amber-300/70 bg-amber-300/20 text-amber-50"
                            : "border-amber-200/15 bg-slate-800/40 text-amber-100/70 hover:border-amber-200/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="ornament-color"
                          value={c.id}
                          checked={selected}
                          onChange={() => {
                            setOrnamentColor(c.id);
                            setSubmitSuccess(false);
                          }}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                          }}
                        />
                        {t(`tree.color.${c.id}`)}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

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
