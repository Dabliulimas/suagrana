"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { logComponents } from "../lib/logger";
import { useClientOnly } from "../hooks/use-client-only";

type Theme = "light" | "dark" | "system";
type AccentColor = "blue" | "green" | "purple" | "red" | "orange" | "pink";
type FontSize = "small" | "medium" | "large" | "extra-large";

interface ThemeSettings {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  compactMode: boolean;
  animations: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  sidebarCollapsed: boolean;
  showAvatars: boolean;
  colorfulIcons: boolean;
}

interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => void;
  resetSettings: () => void;
  toggleTheme: () => void;
}

const defaultSettings: ThemeSettings = {
  theme: "light",
  accentColor: "blue",
  fontSize: "medium",
  compactMode: false,
  animations: true,
  highContrast: false,
  reducedMotion: false,
  sidebarCollapsed: false,
  showAvatars: true,
  colorfulIcons: true,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const isClient = useClientOnly();

  // Load settings from localStorage on mount
  useEffect(() => {
    if (!isClient) return;

    const savedSettings = localStorage.getItem("theme-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        logComponents.error("Error parsing theme settings:", error);
      }
    }
  }, [isClient]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem("theme-settings", JSON.stringify(settings));
  }, [settings, isClient]);

  // Apply theme changes to document
  useEffect(() => {
    if (!isClient) return;

    const root = document.documentElement;

    // Apply theme class
    root.classList.remove("light", "dark");
    if (settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }

    // Apply accent color CSS variables
    const accentColors = {
      blue: { primary: "220 100% 50%", primaryForeground: "0 0% 100%" },
      green: { primary: "142 76% 36%", primaryForeground: "0 0% 100%" },
      purple: { primary: "262 83% 58%", primaryForeground: "0 0% 100%" },
      red: { primary: "0 84% 60%", primaryForeground: "0 0% 100%" },
      orange: { primary: "25 95% 53%", primaryForeground: "0 0% 100%" },
      pink: { primary: "330 81% 60%", primaryForeground: "0 0% 100%" },
    };

    const colors = accentColors[settings.accentColor];
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);

    // Apply font size
    const fontSizes = {
      small: "14px",
      medium: "16px",
      large: "18px",
      "extra-large": "20px",
    };
    root.style.setProperty("--base-font-size", fontSizes[settings.fontSize]);

    // Apply other settings
    root.classList.toggle("compact-mode", settings.compactMode);
    root.classList.toggle("high-contrast", settings.highContrast);
    root.classList.toggle("reduced-motion", settings.reducedMotion);
    root.style.setProperty(
      "--animations",
      settings.animations ? "all" : "none",
    );
  }, [settings, isClient]);

  // Listen for system theme changes
  useEffect(() => {
    if (!isClient || settings.theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [settings.theme, isClient]);

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem("theme-settings");
  };

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme:
        prev.theme === "light"
          ? "dark"
          : prev.theme === "dark"
            ? "system"
            : "light",
    }));
  };

  return (
    <ThemeContext.Provider
      value={{ settings, updateSettings, resetSettings, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export type { Theme, AccentColor, FontSize, ThemeSettings };
