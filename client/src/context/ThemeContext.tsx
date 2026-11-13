import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setPreference: (preference: ThemePreference) => void;
  cycle: () => void;
}

const STORAGE_KEY = "theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

const readPreference = (): ThemePreference => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "dark";
  } catch {
    return "dark";
  }
};

const systemPrefersDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const listener = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const resolved: "light" | "dark" = preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#0e0f12" : "#ffffff");
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      return;
    }
  }, []);

  const cycle = useCallback(() => {
    setPreference(preference === "light" ? "dark" : preference === "dark" ? "system" : "light");
  }, [preference, setPreference]);

  const value = useMemo(() => ({ preference, resolved, setPreference, cycle }), [preference, resolved, setPreference, cycle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
