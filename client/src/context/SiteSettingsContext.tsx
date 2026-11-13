import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

export interface SiteSettings {
  logoUrl: string | null;
  logoIconUrl: string | null;
  faviconUrl: string | null;
}

const empty: SiteSettings = { logoUrl: null, logoIconUrl: null, faviconUrl: null };

const SiteSettingsContext = createContext<{ settings: SiteSettings; setSettings: (next: SiteSettings) => void }>({
  settings: empty,
  setSettings: () => undefined,
});

const applyFavicon = (href: string | null) => {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) return;
  if (!link.dataset.defaultHref) link.dataset.defaultHref = link.getAttribute("href") ?? "/favicon.svg";
  link.setAttribute("href", href ?? link.dataset.defaultHref);
  if (href) link.removeAttribute("type");
};

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setState] = useState<SiteSettings>(empty);

  useEffect(() => {
    let alive = true;
    api
      .get<SiteSettings>("/settings")
      .then((response) => alive && setState({ ...empty, ...response.data }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => applyFavicon(settings.faviconUrl), [settings.faviconUrl]);

  const setSettings = useCallback((next: SiteSettings) => setState(next), []);
  const value = useMemo(() => ({ settings, setSettings }), [settings, setSettings]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export const useSiteSettings = () => useContext(SiteSettingsContext);

export function SiteSettingsPreview({ value, children }: { value: SiteSettings; children: ReactNode }) {
  const preview = useMemo(() => ({ settings: value, setSettings: () => undefined }), [value]);
  return <SiteSettingsContext.Provider value={preview}>{children}</SiteSettingsContext.Provider>;
}
