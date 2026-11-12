import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, Locale, TranslationKey } from "../i18n/dictionary";

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const STORAGE_KEY = "electroshop:locale";
const I18nContext = createContext<I18nValue | null>(null);

const initialLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "az" || stored === "ru" || stored === "en") return stored;
  } catch {
    return "az";
  }
  return "az";
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      return;
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const template = dictionaries[locale][key] ?? dictionaries.az[key] ?? key;
      return vars ? template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? "")) : template;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
