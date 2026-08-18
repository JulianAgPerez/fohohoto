import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cloudinary } from "@cloudinary/url-gen";
import { generativeBackgroundReplace } from "@cloudinary/url-gen/actions/effect";
import { scale } from "@cloudinary/url-gen/actions/resize";
import { source } from "@cloudinary/url-gen/actions/overlay";
import { text } from "@cloudinary/url-gen/qualifiers/source";
import { Position } from "@cloudinary/url-gen/qualifiers/position";
import { TextStyle } from "@cloudinary/url-gen/qualifiers/textStyle";
import { compass } from "@cloudinary/url-gen/qualifiers/gravity";
import { confetti } from "@tsparticles/confetti";
import ChristmasLights from "./ChristmasLights";
import { useI18n } from "../i18n";

const cloud_name = import.meta.env.VITE_CLOUDNAME as string;
const upload_preset =
  import.meta.env.VITE_UPLOAD_PRESET ?? "upload-unsigned_presets";

const backgrounds = [
  {
    key: "Navideño",
    emoji: "🎄",
    prompt: "Add a christmas background",
  },
  {
    key: "Nieve",
    emoji: "❄️",
    prompt: "Add snow and a Christmas atmosphere to the background",
  },
  {
    key: "Santa Claus",
    emoji: "🎅",
    prompt: "Add santa claus in the sky with snow",
  },
  {
    key: "¡Regalos!",
    emoji: "🎁",
    prompt: "Add gifts and a christmas tree to the background",
  },
  {
    key: "Elfos",
    emoji: "🧝",
    prompt: "Add an elf to the background and add me a Christmas hat",
  },
  {
    key: "Soy un Grinch",
    emoji: "💚",
    prompt: "Add a Grinch to the background",
  },
];

const validImageTypes = ["image/jpeg", "image/png", "image/webp"];

// Cloudinary: en el segmento l_text el texto debe ir doble-codificado (%25 en
// vez de %) para que caracteres reservados (coma, slash, acentos, emojis) no
// rompan el parser de transformaciones. La fuente no se toca.
const doubleEncodeTextLayer = (url: string): string => {
  return url.replace(/l_text:[^:/]+(?::[^/]*)?/g, (segment) => {
    const firstColon = segment.indexOf(":");
    const secondColon = segment.indexOf(":", firstColon + 1);
    if (secondColon === -1) return segment;
    const textStart = secondColon + 1;
    return (
      segment.slice(0, textStart) +
      segment.slice(textStart).replace(/%/g, "%25")
    );
  });
};

const MAX_IMAGE_DIMENSION = 1200;

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      const scaleFactor = Math.min(
        1,
        MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const width = Math.round(image.naturalWidth * scaleFactor);
      const height = Math.round(image.naturalHeight * scaleFactor);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo procesar la imagen."));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);

      const keepPng = file.type === "image/png";
      const mimeType = keepPng ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("No se pudo comprimir la imagen."));
          }
        },
        mimeType,
        keepPng ? undefined : 0.82,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };

    image.src = url;
  });
};

const ImageUploader: React.FC = () => {
  const { t } = useI18n();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>(
    backgrounds[0].key,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [shareError, setShareError] = useState<boolean>(false);
  const shareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasGeneratedRef = useRef(false);
  const transformRequestRef = useRef(0);
  const handleTransformRef = useRef<() => Promise<void>>(async () => {});

  const cld = new Cloudinary({ cloud: { cloudName: cloud_name } });

  const handleFile = (file: File) => {
    if (!validImageTypes.includes(file.type)) {
      setError(t("uploader.invalidFormat"));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setError(null);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setTransformedImage(null);
    hasGeneratedRef.current = false;
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleUploadAndTransform = async () => {
    if (!imageFile) return;
    const requestId = ++transformRequestRef.current;
    setLoading(true);
    setError(null);
    try {
      const compressed = await compressImage(imageFile);
      if (requestId !== transformRequestRef.current) return;

      const formData = new FormData();
      const extension = compressed.type.split("/")[1] ?? "jpg";
      formData.append("file", compressed, `fohohoto-upload.${extension}`);
      formData.append("upload_preset", upload_preset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      if (requestId !== transformRequestRef.current) return;

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const transformedUrl = applyChristmasEffects(
        data.public_id,
        selectedBackground,
        message,
      );

      const transformed = await uploadTransformedImage(transformedUrl);
      if (requestId !== transformRequestRef.current) return;
      setTransformedImage(transformed);
    } catch (error) {
      if (requestId !== transformRequestRef.current) return;
      console.error("Error uploading image:", error);
      setError(
        t("uploader.uploadError"),
      );
      setLoading(false);
    }
  };

  handleTransformRef.current = handleUploadAndTransform;

  useEffect(() => {
    if (!hasGeneratedRef.current || !imageFile) return;
    void handleTransformRef.current();
  }, [selectedBackground, imageFile]);

  const applyChristmasEffects = (
    imageId: string,
    backgroundKey: string,
    messageText: string,
  ) => {
    const cldImage = cld.image(imageId);
    const background = backgrounds.find((bg) => bg.key === backgroundKey);
    const prompt = background?.prompt ?? backgroundKey;

    cldImage
      .effect(generativeBackgroundReplace().prompt(prompt))
      .resize(scale().width(1000).height(1000))
      .format("auto")
      .quality("auto:best");

    if (messageText.trim()) {
      cldImage.overlay(
        source(
          text(
            messageText,
            new TextStyle("Mountains of Christmas@google", 60),
          ).textColor("white"),
        ).position(new Position().gravity(compass("south")).offsetY(40)),
      );
    }

    return doubleEncodeTextLayer(cldImage.toURL());
  };

  const uploadTransformedImage = async (transformedUrl: string) => {
    const formData = new FormData();
    formData.append("file", transformedUrl);
    formData.append("upload_preset", upload_preset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      let detail = response.statusText;
      const cldError = response.headers.get("X-Cld-Error");
      if (cldError) detail = cldError;
      try {
        const errorBody = await response.json();
        if (errorBody?.error?.message) {
          detail = errorBody.error.message;
        }
      } catch {
        // Sin cuerpo JSON, se queda con statusText / X-Cld-Error
      }
      throw new Error(`Error al subir la imagen transformada: ${detail}`);
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleDownload = async () => {
    if (transformedImage) {
      try {
        const response = await fetch(transformedImage);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const originalName = imageFile?.name ?? "imagen_navidena";
        const baseName =
          originalName.replace(/\.[^.]+$/, "") || "imagen_navidena";
        link.download = `${baseName}_navidena.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error al descargar la imagen:", error);
      }
    }
  };

  const showShareFeedback = (text: string, isError: boolean) => {
    if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
    setShareError(isError);
    setShareFeedback(text);
    shareTimeoutRef.current = setTimeout(() => {
      setShareFeedback(null);
    }, 3000);
  };

  const handleShare = async () => {
    if (!transformedImage) return;
    try {
      const response = await fetch(transformedImage);
      const blob = await response.blob();
      const originalName = imageFile?.name ?? "imagen_navidena";
      const baseName =
        originalName.replace(/\.[^.]+$/, "") || "imagen_navidena";
      const file = new File([blob], `${baseName}_navidena.jpg`, {
        type: "image/jpeg",
      });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: "Fohohoto",
          text: t("uploader.shareText"),
        });
      } else {
        await navigator.clipboard.writeText(transformedImage);
        showShareFeedback(t("uploader.linkCopied"), false);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      showShareFeedback(t("uploader.shareError"), true);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    hasGeneratedRef.current = false;
    setImageFile(null);
    setPreviewUrl(null);
    setTransformedImage(null);
    setError(null);
    setMessage("");
    setSelectedBackground(backgrounds[0].key);
    document.getElementById("uploader")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-200/25 bg-slate-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
        {/* Guirnalda de luces en el borde de la card */}
        <ChristmasLights
          count={10}
          className="absolute inset-x-0 -top-3 z-10 px-4"
        />
        <ChristmasLights
          count={10}
          className="absolute inset-x-0 -bottom-3 z-10 px-4"
        />

        <h2 className="mb-1 text-center font-christmas text-3xl text-berry-400 sm:text-4xl">
          {t("uploader.title")}
        </h2>
        <p className="mb-6 text-center text-sm text-amber-100/75">
          {t("uploader.subtitle")}
        </p>

        {/* Paso 1: tu foto */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-100/60">
          {t("uploader.step1")}
        </p>
        <label
          htmlFor="image-upload"
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition focus-within:ring-4 focus-within:ring-amber-200/40 ${
            dragActive
              ? "border-amber-300 bg-slate-800/70"
              : "border-amber-200/30 bg-slate-800/30 hover:border-amber-200/60"
          }`}
        >
          <input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = "";
            }}
          />
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt={t("uploader.previewAlt")}
                className="h-28 w-28 rounded-xl border border-amber-200/30 object-cover shadow-lg"
              />
              <span className="text-sm font-medium text-amber-100">
                {imageFile?.name}
              </span>
              <span className="text-xs text-amber-100/70">
                {t("uploader.changePhoto")}
              </span>
            </>
          ) : (
            <>
              <svg
                className="h-10 w-10 text-amber-200/70"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-sm font-medium text-amber-100">
                {t("uploader.dropzone")}
              </span>
              <span className="text-xs text-amber-100/70">
                {t("uploader.dropzoneHint")}
              </span>
            </>
          )}
        </label>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-berry-500/15 px-3 py-2 text-sm text-berry-300"
          >
            {error}
          </p>
        )}

        {/* Paso 2: fondo */}
        <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-amber-100/60">
          {t("uploader.step2")}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {backgrounds.map((bg) => {
            const selected = selectedBackground === bg.key;
            return (
              <button
                key={bg.key}
                type="button"
                onClick={() => setSelectedBackground(bg.key)}
                aria-pressed={selected}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition ${
                  selected
                    ? "border-amber-300/80 bg-slate-700/70 ring-2 ring-amber-300/50"
                    : "border-amber-200/15 bg-slate-800/40 hover:border-amber-200/40 hover:bg-slate-800/70"
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {bg.emoji}
                </span>
                <span className="text-sm font-semibold text-amber-50">
                  {t(`bg.${bg.key}.label`)}
                </span>
                <span className="text-xs leading-tight text-amber-100/80">
                  {t(`bg.${bg.key}.desc`)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Paso 3: mensaje */}
        <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-amber-100/60">
          {t("uploader.step3")}
        </p>
        <input
          type="text"
          maxLength={60}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t("uploader.messagePlaceholder")}
          className="w-full rounded-xl border border-amber-200/15 bg-slate-800/40 px-4 py-3 text-sm text-amber-50 placeholder:text-amber-100/40 focus:border-amber-300/60 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
        />

        {/* Paso 4: transformar */}
        <button
          type="button"
          onClick={handleUploadAndTransform}
          disabled={!imageFile || loading}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-berry-600 to-berry-700 px-6 py-3 font-semibold text-white shadow-lg shadow-red-900/40 transition hover:from-berry-500 hover:to-berry-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-berry-300/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? t("uploader.loading") : t("uploader.transform")}
        </button>

        {/* Resultado */}
        <AnimatePresence>
          {(previewUrl || transformedImage || loading) && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="mt-6 space-y-4"
            >
              <span className="sr-only" aria-live="polite">
                {loading
                  ? t("uploader.srTransforming")
                  : transformedImage
                    ? t("uploader.srReady")
                    : ""}
              </span>
              {previewUrl && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-100/60">
                    {t("uploader.before")}
                  </p>
                  <div
                    className="h-52 overflow-hidden rounded-xl border border-amber-200/20"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.07), rgba(0,0,0,0.35))",
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt={t("uploader.originalAlt")}
                      className="h-full w-full"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                </div>
              )}

              <div>
<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-100/60">
                    {t("uploader.after")}
                  </p>
                <div
                  className="relative h-52 overflow-hidden rounded-xl border border-amber-200/20"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.07), rgba(0,0,0,0.35))",
                  }}
                >
                  {transformedImage ? (
                    <img
                      src={transformedImage}
                      alt={t("uploader.transformedAlt")}
                      onLoad={() => {
                        hasGeneratedRef.current = true;
                        setLoading(false);
                        const prefersReducedMotion = window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches;
                        if (!prefersReducedMotion) {
                          confetti({
                            count: 120,
                            spread: 75,
                            position: { x: 50, y: 70 },
                            colors: [
                              "#ef4444",
                              "#fbbf24",
                              "#22c55e",
                              "#3b82f6",
                              "#ffffff",
                            ],
                          });
                        }
                      }}
                      onError={() => {
                        setLoading(false);
                        setError(t("uploader.generateError"));
                      }}
                      className="h-full w-full"
                      style={{ objectFit: "contain" }}
                    />
                  ) : loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-300/30 border-t-amber-300" />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-amber-100/70">
                      {t("uploader.pending")}
                    </div>
                  )}
                  {loading && transformedImage && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-300/30 border-t-amber-300" />
                    </div>
                  )}
                </div>
              </div>

              {transformedImage && !loading && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="rounded-full bg-gradient-to-r from-berry-600 to-berry-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition hover:from-berry-500 hover:to-berry-600"
                    >
                      {t("uploader.share")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="rounded-full bg-gradient-to-r from-berry-600 to-berry-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition hover:from-berry-500 hover:to-berry-600"
                    >
                      {t("uploader.download")}
                    </button>
                    <a
                      href={transformedImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-amber-200/40 px-4 py-2.5 text-center text-sm font-semibold text-amber-100 transition hover:bg-amber-200/10"
                    >
                      {t("uploader.viewImage")}
                    </a>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="rounded-full border border-amber-200/40 px-4 py-2.5 text-center text-sm font-semibold text-amber-100 transition hover:bg-amber-200/10"
                    >
                      {t("uploader.makeAnother")}
                    </button>
                  </div>
                  {shareFeedback && (
                    <p
                      role="status"
                      aria-live="polite"
                      className={`text-center text-sm ${
                        shareError ? "text-berry-300" : "text-emerald-300"
                      }`}
                    >
                      {shareFeedback}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-xs text-amber-100/60">
          {t("uploader.cloudinary")}
        </p>
      </div>
    </div>
  );
};

export default ImageUploader;
