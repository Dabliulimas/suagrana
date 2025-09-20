/**
 * WRAPPER DO PROVIDER DE TEMA SIMPLIFICADO
 */

"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "../contexts/theme-context";

interface ThemeProviderWrapperProps {
  children: ReactNode;
}

export function ThemeProviderWrapper({ children }: ThemeProviderWrapperProps) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
