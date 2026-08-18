import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { I18nContext, dictionaries } from "./i18n";
import type { I18nContextValue, Lang, Vars } from "./i18n";

const STORAGE_KEY = "fohohoto-lang";
const DEFAULT_LANG: Lang = "es";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return DEFAULT_LANG;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === "en" ? "en" : DEFAULT_LANG;
    } catch {
      return DEFAULT_LANG;
    }
  });

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Si localStorage no está disponible, el idioma solo vive en memoria.
    }
  }, []);

  const t = useCallback(
    (path: string, vars?: Vars): string => {
      const value = path.split(".").reduce<unknown>((acc, segment) => {
        if (acc !== null && typeof acc === "object" && segment in acc) {
          return (acc as Record<string, unknown>)[segment];
        }
        return undefined;
      }, dictionaries[lang]);
      if (typeof value !== "string") return path;
      if (!vars) return value;
      return value.replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(vars, name)
          ? String(vars[name])
          : match,
      );
    },
    [lang],
  );

  useEffect(() => {
    document.title = t("page.title");
    document.documentElement.lang = lang;
  }, [t, lang]);

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t }),
    [lang, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}