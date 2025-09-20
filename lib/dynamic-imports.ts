// Dynamic imports para bibliotecas pesadas
// Isso reduz o bundle inicial e melhora o tempo de startup

import { ComponentType } from "react";

import { logComponents } from "../logger";
// Puppeteer - para geração de PDFs
export const loadPuppeteer = async () => {
  const puppeteer = await import("puppeteer");
  return puppeteer.default;
};

// ExcelJS - para manipulação de planilhas
export const loadExcelJS = async () => {
  const ExcelJS = await import("exceljs");
  return ExcelJS.default;
};

// jsPDF - para geração de PDFs
export const loadJsPDF = async () => {
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable"); // Plugin para tabelas
  return jsPDF;
};

// html2canvas - para captura de tela
export const loadHtml2Canvas = async () => {
  const html2canvas = await import("html2canvas");
  return html2canvas.default;
};

// Framer Motion - para animações
export const loadFramerMotion = async () => {
  const { motion, AnimatePresence } = await import("framer-motion");
  return { motion, AnimatePresence };
};

// React Window - para virtualização
export const loadReactWindow = async () => {
  const { FixedSizeList, VariableSizeList } = await import("react-window");
  return { FixedSizeList, VariableSizeList };
};

// Recharts - para gráficos (se não usado em todas as páginas)
export const loadRecharts = async () => {
  const recharts = await import("recharts");
  return recharts;
};

// Utility para carregar componentes dinamicamente
export function createDynamicComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ComponentType,
) {
  const DynamicComponent = ({ ...props }: T) => {
    const [Component, setComponent] = useState<ComponentType<T> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      importFn()
        .then((module) => {
          setComponent(() => module.default);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    }, []);

    if (loading) {
      return fallback
        ? React.createElement(fallback, props)
        : React.createElement("div", {}, "Loading...");
    }

    if (error) {
      logComponents.error("Failed to load component:", error);
      return React.createElement("div", {}, "Failed to load component");
    }

    if (!Component) {
      return null;
    }

    return React.createElement(Component, props);
  };

  return DynamicComponent;
}

// Hook para usar dynamic imports com loading state
export function useDynamicImport<T>(importFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (data) return data; // Já carregado

    setLoading(true);
    setError(null);

    try {
      const result = await importFn();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Import failed");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [importFn, data]);

  return { data, loading, error, load };
}

import React, { useState, useEffect, useCallback } from "react";
