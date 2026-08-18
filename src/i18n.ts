import { createContext, useContext } from "react";

export type Lang = "es" | "en";

export type Vars = Record<string, string | number>;

const es = {
  page: {
    title: "Fohohoto · Tu postal navideña",
  },
  hero: {
    subtitle: "Convierte tu foto en una postal navideña",
    cta: "Haz tu postal 🎄",
  },
  greetings: {
    pause: "Pausar saludos",
    resume: "Reanudar saludos",
  },
  lang: {
    button: "Idioma: Español · Cambiar a inglés",
  },
  countdown: {
    merryChristmas: "¡Feliz Navidad! 🎄",
    oneDay: "Falta 1 día para Navidad 🎄",
    days: "Faltan {n} días para Navidad 🎄",
  },
  footer: {
    credit: "Hecho con ❤️ para las fiestas · Fohohoto 🎄 · De ",
  },
  uploader: {
    title: "Sube tu imagen navideña 🎄",
    subtitle: "Elige un fondo y conviértela en una postal",
    step1: "1 · Tu foto",
    step2: "2 · Elige un fondo",
    step3: "3 · Tu mensaje (opcional)",
    dropzone: "Arrastra tu foto aquí o toca para elegir",
    dropzoneHint: "JPEG, PNG o WEBP",
    changePhoto: "Toca para cambiar la foto",
    previewAlt: "Vista previa de la imagen elegida",
    before: "Antes",
    after: "Después",
    originalAlt: "Imagen original",
    transformedAlt: "Imagen transformada",
    pending: "Tu postal navideña aparecerá acá ✨",
    loading: "Transformando...",
    transform: "Transformar mi foto ✨",
    srTransforming: "Transformando tu foto",
    srReady: "Tu postal navideña está lista",
    invalidFormat: "Formato no válido. Sube una imagen JPEG, PNG o WEBP.",
    uploadError:
      "Hubo un problema al subir o transformar la imagen. Intenta nuevamente.",
    generateError: "No se pudo generar la postal. Intenta nuevamente.",
    messagePlaceholder: "Ej: Feliz Navidad, familia ❤️",
    share: "📤 Compartir",
    download: "Descargar",
    viewImage: "Ver imagen",
    makeAnother: "Hacer otra postal",
    shareText: "Mi postal navideña 🎄",
    linkCopied: "Link copiado ✅",
    shareError: "No se pudo compartir. Usá Descargar.",
    cloudinary: "Tu foto se procesa en la nube con Cloudinary",
  },
  tree: {
    title: "Árbol colaborativo 🎄",
    subtitle: "Dejá tu deseo y colgalo en el árbol",
    pickPosition: "Hacé clic en el árbol para elegir dónde colgar tu nota",
    positionPicked: "¡Listo! Tu nota colgará ahí",
    formName: "Tu nombre (opcional)",
    namePlaceholder: "Ej: Juli",
    formMessage: "Tu mensaje",
    messagePlaceholder:
      "Ej: Que este año nos llene de abrazos y chocolate caliente 🍫",
    messageRequired: "Escribí un mensaje antes de colgarlo en el árbol.",
    submit: "Colgar mi nota ✨",
    submitting: "Colgando...",
    success: "¡Tu nota ya cuelga del árbol! 🎉",
    loadError: "No se pudieron cargar las notas. Intenta nuevamente.",
    submitError: "No se pudo guardar tu nota. Intenta nuevamente.",
    comingSoon:
      "Las notas navideñas estarán disponibles muy pronto. ¡Volvé en unos días! 🎄",
    notesTitle: "Notas del árbol",
    empty: "Todavía no hay notas. ¡Colgá la primera!",
    anonymous: "Anónimo",
    noteCount: "{n} deseos colgados en el árbol 🎄",
  },
  bg: {
    "Navideño": { label: "Navideño", desc: "Ambiente navideño clásico" },
    "Nieve": { label: "Nieve", desc: "Nieve y atmósfera invernal" },
    "Santa Claus": { label: "Santa Claus", desc: "Santa en el cielo con nieve" },
    "¡Regalos!": { label: "¡Regalos!", desc: "Regalos y árbol de Navidad" },
    "Elfos": { label: "Elfos", desc: "Un elfo y un gorrito navideño" },
    "Soy un Grinch": { label: "Soy un Grinch", desc: "Un Grinch en el fondo" },
  },
};

type Dictionary = typeof es;

const en: Dictionary = {
  page: {
    title: "Fohohoto · Your Christmas card",
  },
  hero: {
    subtitle: "Turn your photo into a Christmas card",
    cta: "Make your card 🎄",
  },
  greetings: {
    pause: "Pause greetings",
    resume: "Resume greetings",
  },
  lang: {
    button: "Language: English · Switch to Spanish",
  },
  countdown: {
    merryChristmas: "Merry Christmas! 🎄",
    oneDay: "1 day until Christmas 🎄",
    days: "{n} days until Christmas 🎄",
  },
  footer: {
    credit: "Made with ❤️ for the holidays · Fohohoto 🎄 · By ",
  },
  uploader: {
    title: "Upload your Christmas image 🎄",
    subtitle: "Pick a background and turn it into a card",
    step1: "1 · Your photo",
    step2: "2 · Choose a background",
    step3: "3 · Your message (optional)",
    dropzone: "Drag your photo here or tap to choose",
    dropzoneHint: "JPEG, PNG or WEBP",
    changePhoto: "Tap to change the photo",
    previewAlt: "Preview of the chosen image",
    before: "Before",
    after: "After",
    originalAlt: "Original image",
    transformedAlt: "Transformed image",
    pending: "Your Christmas card will appear here ✨",
    loading: "Transforming...",
    transform: "Transform my photo ✨",
    srTransforming: "Transforming your photo",
    srReady: "Your Christmas card is ready",
    invalidFormat: "Invalid format. Upload a JPEG, PNG or WEBP image.",
    uploadError:
      "There was a problem uploading or transforming the image. Try again.",
    generateError: "Couldn't generate the card. Try again.",
    messagePlaceholder: "E.g. Merry Christmas, family ❤️",
    share: "📤 Share",
    download: "Download",
    viewImage: "View image",
    makeAnother: "Make another card",
    shareText: "My Christmas card 🎄",
    linkCopied: "Link copied ✅",
    shareError: "Couldn't share. Use Download.",
    cloudinary: "Your photo is processed in the cloud with Cloudinary",
  },
  tree: {
    title: "Collaborative tree 🎄",
    subtitle: "Leave a wish and hang it on the tree",
    pickPosition: "Click the tree to choose where to hang your note",
    positionPicked: "Done! Your note will hang there",
    formName: "Your name (optional)",
    namePlaceholder: "E.g. Juli",
    formMessage: "Your message",
    messagePlaceholder:
      "E.g. May this year bring hugs and hot chocolate 🍫",
    messageRequired: "Write a message before hanging it on the tree.",
    submit: "Hang my note ✨",
    submitting: "Hanging...",
    success: "Your note is on the tree! 🎉",
    loadError: "Couldn't load the notes. Try again.",
    submitError: "Couldn't save your note. Try again.",
    comingSoon:
      "Christmas notes will be available very soon. Come back in a few days! 🎄",
    notesTitle: "Notes on the tree",
    empty: "No notes yet. Hang the first one!",
    anonymous: "Anonymous",
    noteCount: "{n} wishes hanging on the tree 🎄",
  },
  bg: {
    "Navideño": { label: "Classic", desc: "Classic Christmas atmosphere" },
    "Nieve": { label: "Snow", desc: "Snow and winter atmosphere" },
    "Santa Claus": { label: "Santa Claus", desc: "Santa in the sky with snow" },
    "¡Regalos!": { label: "Gifts!", desc: "Gifts and a Christmas tree" },
    "Elfos": { label: "Elves", desc: "An elf and a Christmas hat" },
    "Soy un Grinch": { label: "Grinch", desc: "A Grinch in the background" },
  },
};

export const dictionaries: Record<Lang, Dictionary> = { es, en };

export interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (path: string, vars?: Vars) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export const useI18n: () => I18nContextValue = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
};