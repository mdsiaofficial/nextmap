import { useEffect } from "react";
import { create } from "zustand";

interface ThemeStore {
  theme: "light" | "dark";
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme:
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  toggle: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("nextmap-theme", next);
      return { theme: next };
    }),
}));

const stored = typeof window !== "undefined" ? localStorage.getItem("nextmap-theme") : null;
if (stored === "light" || stored === "dark") {
  useThemeStore.setState({ theme: stored });
}

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return theme;
}
