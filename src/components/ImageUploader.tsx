import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloudinary } from "@cloudinary/url-gen";
import { generativeBackgroundReplace } from "@cloudinary/url-gen/actions/effect";
import { scale } from "@cloudinary/url-gen/actions/resize";
import ChristmasLights from "./ChristmasLights";

const cloud_name = import.meta.env.VITE_CLOUDNAME as string;
const upload_preset = "upload-unsigned_presets";

const backgrounds = [
  { key: "Navideño", emoji: "🎄", prompt: "Add a christmas background" },
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
  { key: "Soy un Grinch", emoji: "💚", prompt: "Add a Grinch to the background" },
];

const validImageTypes = ["image/jpeg", "image/png", "image/webp"];

const ImageUploader: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>(
    backgrounds[0].key
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const cld = new Cloudinary({ cloud: { cloudName: cloud_name } });

  const handleFile = (file: File) => {
    if (!validImageTypes.includes(file.type)) {
      setError("Formato no válido. Sube una imagen JPEG, PNG o WEBP.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setError(null);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setTransformedImage(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleUploadAndTransform = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", upload_preset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const transformedUrl = applyChristmasEffects(
        data.public_id,
        selectedBackground
      );

      const uploadedTransformedImage = await uploadTransformedImage(
        transformedUrl
      );

      setTransformedImage(uploadedTransformedImage);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError(
        "Hubo un problema al subir o transformar la imagen. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const applyChristmasEffects = (imageId: string, backgroundKey: string) => {
    const cldImage = cld.image(imageId);
    const background = backgrounds.find((bg) => bg.key === backgroundKey);
    const prompt = background?.prompt ?? backgroundKey;

    cldImage
      .effect(generativeBackgroundReplace().prompt(prompt))
      .resize(scale().width(1000).height(1000))
      .format("auto")
      .quality("auto:best");
    return cldImage.toURL();
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
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error al subir la imagen transformada: ${response.statusText}`
      );
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
        link.download = "imagen_navidena.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error al descargar la imagen:", error);
      }
    }
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

        <h2 className="mb-1 text-center font-christmas text-3xl text-red-400 sm:text-4xl">
          Sube tu imagen navideña 🎄
        </h2>
        <p className="mb-6 text-center text-sm text-amber-100/60">
          Elige un fondo y conviértela en una postal
        </p>

        {/* Paso 1: tu foto */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-100/50">
          1 · Tu foto
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
                alt="Vista previa de la imagen elegida"
                className="h-28 w-28 rounded-xl border border-amber-200/30 object-cover shadow-lg"
              />
              <span className="text-sm font-medium text-amber-100">
                {imageFile?.name}
              </span>
              <span className="text-xs text-amber-100/50">
                Toca para cambiar la foto
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
                Arrastra tu foto aquí o toca para elegir
              </span>
              <span className="text-xs text-amber-100/50">
                JPEG, PNG o WEBP
              </span>
            </>
          )}
        </label>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {/* Paso 2: fondo */}
        <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-amber-100/50">
          2 · Elige un fondo
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
                  {bg.key}
                </span>
              </button>
            );
          })}
        </div>

        {/* Paso 3: transformar */}
        <button
          type="button"
          onClick={handleUploadAndTransform}
          disabled={!imageFile || loading}
          className="mt-6 w-full rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-900/40 transition hover:from-red-400 hover:to-rose-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300/50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Transformando..." : "Transformar mi foto ✨"}
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
              {previewUrl && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-100/50">
                    Antes
                  </p>
                  <div
                    className="h-40 overflow-hidden rounded-xl border border-amber-200/20"
                    style={{
                      backgroundImage:
                        "repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%)",
                      backgroundSize: "24px 24px",
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Imagen original"
                      className="h-full w-full"
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-100/50">
                  Después
                </p>
                <div
                  className="h-52 overflow-hidden rounded-xl border border-amber-200/20"
                  style={{
                    backgroundImage:
                      "repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%)",
                    backgroundSize: "24px 24px",
                  }}
                >
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-300/30 border-t-amber-300" />
                    </div>
                  ) : transformedImage ? (
                    <img
                      src={transformedImage}
                      alt="Imagen transformada"
                      onLoad={() => setLoading(false)}
                      className="h-full w-full"
                      style={{ objectFit: "contain" }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-amber-100/40">
                      Tu postal navideña aparecerá acá ✨
                    </div>
                  )}
                </div>
              </div>

              {transformedImage && !loading && (
                <div className="flex gap-3">
                  <a
                    href={transformedImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-full border border-amber-200/40 px-4 py-2.5 text-center text-sm font-semibold text-amber-100 transition hover:bg-amber-200/10"
                  >
                    Ver imagen
                  </a>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex-1 rounded-full bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition hover:from-red-400 hover:to-rose-500"
                  >
                    Descargar
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ImageUploader;