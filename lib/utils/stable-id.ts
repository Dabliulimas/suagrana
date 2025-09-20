"use client";

// Contador global para IDs estáveis
let idCounter = 0;

/**
 * Gera um ID estável que não causa problemas de hidratação
 * Usa um contador incremental em vez de Date.now() ou Math.random()
 */
export function generateStableId(prefix: string = "id"): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Gera um ID baseado em timestamp apenas no cliente
 * No servidor, usa um ID sequencial
 */
export function generateClientSafeId(prefix: string = "id"): string {
  if (typeof window !== "undefined") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  return generateStableId(prefix);
}

/**
 * Hook para gerar IDs estáveis em componentes React
 */
import { useId } from "react";

export function useStableId(prefix: string = "id"): string {
  const reactId = useId();
  return `${prefix}-${reactId}`;
}

/**
 * Reseta o contador (útil para testes)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}
