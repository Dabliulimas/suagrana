"use client";

import { useState, useEffect, useCallback } from "react";
import { logComponents } from "../lib/utils/logger";

// Configurações padrão para evitar erros durante SSR
const defaultSettings = {
  theme: "light" as const,
  accentColor: "blue" as const,
  fontSize: "medium" as const,
  compactMode: false,
  animations: true,
  highContrast: false,
  reducedMotion: false,
  sidebarCollapsed: false,
  showAvatars: true,
  colorfulIcons: true,
};

type ThemeSettings = typeof defaultSettings;

export function useSafeTheme() {
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Detectar preferência do sistema
  const getSystemTheme = useCallback(() => {
    if (typeof window === "undefined") return "light";
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Carrega as configurações do localStorage
    try {
      const savedSettings = localStorage.getItem("suagrana-theme-settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const mergedSettings = { ...defaultSettings, ...parsed };
        setSettings(mergedSettings);
        applyTheme(mergedSettings);
      } else {
        // Se não há configurações salvas, usar preferência do sistema
        const systemTheme = getSystemTheme();
        const initialSettings = { ...defaultSettings, theme: systemTheme };
        setSettings(initialSettings);
        applyTheme(initialSettings);
      }
    } catch (error) {
      console.warn("Error loading theme settings from localStorage:", error);
      applyTheme(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [isMounted, getSystemTheme]);

  // Aplicar tema ao DOM
  const applyTheme = useCallback((themeSettings: ThemeSettings) => {
    if (typeof window === "undefined") return;

    try {
      const root = document.documentElement;

      // Aplicar classe de tema
      root.classList.remove("light", "dark");
      root.classList.add(themeSettings.theme);

      // Aplicar outras configurações CSS
      root.style.setProperty("--font-size", themeSettings.fontSize);
      root.style.setProperty("--accent-color", themeSettings.accentColor);

      if (themeSettings.highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }

      if (themeSettings.reducedMotion) {
        root.classList.add("reduced-motion");
      } else {
        root.classList.remove("reduced-motion");
      }
    } catch (error) {
      console.warn("Error applying theme:", error);
    }
  }, []);

  const updateSettings = useCallback(
    (newSettings: Partial<ThemeSettings>) => {
      if (!isMounted) return;

      setSettings((prevSettings) => {
        const updated = { ...prevSettings, ...newSettings };

        try {
          localStorage.setItem(
            "suagrana-theme-settings",
            JSON.stringify(updated),
          );
          applyTheme(updated);
        } catch (error) {
          console.warn("Error saving theme settings to localStorage:", error);
        }

        return updated;
      });
    },
    [isMounted, applyTheme],
  );

  const resetSettings = useCallback(() => {
    if (!isMounted) return;

    try {
      localStorage.removeItem("suagrana-theme-settings");
      setSettings(defaultSettings);
      applyTheme(defaultSettings);
    } catch (error) {
      console.warn("Error resetting theme settings:", error);
    }
  }, [isMounted, applyTheme]);

  const toggleTheme = useCallback(() => {
    if (!isMounted) return;

    const newTheme = settings.theme === "light" ? "dark" : "light";
    updateSettings({ theme: newTheme });
  }, [isMounted, settings.theme, updateSettings]);

  // Escutar mudanças na preferência do sistema
  useEffect(() => {
    if (!isMounted) return;

    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e: MediaQueryListEvent) => {
        // Só atualizar se não há configuração manual salva
        try {
          const savedSettings = localStorage.getItem("suagrana-theme-settings");
          if (!savedSettings) {
            const systemTheme = e.matches ? "dark" : "light";
            updateSettings({ theme: systemTheme });
          }
        } catch (error) {
          console.warn("Error handling system theme change:", error);
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } catch (error) {
      console.warn("Error setting up system theme listener:", error);
    }
  }, [isMounted, updateSettings]);

  // Retornar configurações padrão durante SSR ou loading
  if (!isMounted || isLoading) {
    return {
      settings: defaultSettings,
      updateSettings: () => {},
      resetSettings: () => {},
      toggleTheme: () => {},
      isMounted: false,
      isLoading: true,
    };
  }

  return {
    settings,
    updateSettings,
    resetSettings,
    toggleTheme,
    isMounted: true,
    isLoading: false,
  };
}

export type { ThemeSettings };
