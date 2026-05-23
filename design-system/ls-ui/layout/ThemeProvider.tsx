"use client";

import * as React from "react";

import type { ThemeMode } from "../foundations/colors";
import { themeCssVars } from "../tokens";

export type LayoutMode = "sidebar" | "compact" | "centered";

export type ThemePreferences = {
  mode: ThemeMode | "system";
  primary: string;
  secondary: string;
  radius: number;
  backgroundBlur: boolean;
  layout: LayoutMode;
};

export type ThemeContextValue = {
  theme: ThemePreferences;
  resolvedMode: ThemeMode;
  setMode: (mode: ThemePreferences["mode"]) => void;
  setPrimary: (value: string) => void;
  setSecondary: (value: string) => void;
  setRadius: (value: number) => void;
  toggleBlur: () => void;
  setLayout: (value: LayoutMode) => void;
  updateTheme: (updater: (prev: ThemePreferences) => ThemePreferences) => void;
};

const DEFAULT_THEME: ThemePreferences = {
  mode: "system",
  primary: "#3ABAB4",
  secondary: "#0E3A4C",
  radius: 10,
  backgroundBlur: true,
  layout: "sidebar",
};

const STORAGE_KEY = "ls-ui-theme";

export const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Partial<ThemePreferences>;
  storageKey?: string;
  persist?: boolean;
};

export function ThemeProvider({
  children,
  defaultTheme,
  storageKey = STORAGE_KEY,
  persist = true,
}: ThemeProviderProps) {
  const initialTheme = React.useMemo(() => {
    if (typeof window === "undefined") {
      return { ...DEFAULT_THEME, ...defaultTheme };
    }
    if (!persist) {
      return { ...DEFAULT_THEME, ...defaultTheme };
    }
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        return { ...DEFAULT_THEME, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_THEME, ...defaultTheme };
  }, [defaultTheme, persist, storageKey]);

  const [theme, setTheme] = React.useState<ThemePreferences>(initialTheme);
  const [systemMode, setSystemMode] = React.useState<ThemeMode>(() =>
    typeof window === "undefined" ? "light" : getSystemMode(),
  );

  const resolvedMode = theme.mode === "system" ? systemMode : theme.mode;

  React.useEffect(() => {
    if (!persist) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(theme));
    } catch {
      // ignore persistence errors
    }
  }, [persist, storageKey, theme]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemMode(media.matches ? "dark" : "light");
    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const vars = themeCssVars(resolvedMode);
    Object.entries(vars).forEach(([token, value]) => {
      root.style.setProperty(token, value);
    });
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--primary-foreground", "#FFFFFF");
    root.style.setProperty("--secondary", theme.secondary);
    root.style.setProperty("--radius", `${theme.radius}px`);
    root.style.setProperty("--radius-sm", `${Math.max(theme.radius - 4, 0)}px`);
    root.style.setProperty("--radius-md", `${Math.max(theme.radius - 2, 0)}px`);
    root.style.setProperty("--radius-lg", `${theme.radius}px`);
    root.style.setProperty("--radius-xl", `${theme.radius + 4}px`);
    root.style.setProperty("--ls-blur", theme.backgroundBlur ? "blur(20px)" : "none");
    root.classList.toggle("dark", resolvedMode === "dark");
  }, [resolvedMode, theme.backgroundBlur, theme.primary, theme.radius, theme.secondary]);

  const updateTheme: ThemeContextValue["updateTheme"] = React.useCallback((updater) => {
    setTheme((prev) => updater(prev));
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedMode,
      setMode: (mode) => updateTheme((prev) => ({ ...prev, mode })),
      setPrimary: (primary) => updateTheme((prev) => ({ ...prev, primary })),
      setSecondary: (secondary) => updateTheme((prev) => ({ ...prev, secondary })),
      setRadius: (radius) => updateTheme((prev) => ({ ...prev, radius })),
      toggleBlur: () => updateTheme((prev) => ({ ...prev, backgroundBlur: !prev.backgroundBlur })),
      setLayout: (layout) => updateTheme((prev) => ({ ...prev, layout })),
      updateTheme,
    }),
    [resolvedMode, theme, updateTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

function getSystemMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

