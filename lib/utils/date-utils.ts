"use client";

/**
 * Utilitários para formatação e validação de datas no padrão brasileiro
 */

/**
 * Formata uma data para o padrão brasileiro (dd/mm/aaaa)
 * @param date - Data a ser formatada
 * @returns String no formato dd/mm/aaaa
 */
export function formatDateToBR(date: Date | string): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Converte uma data do formato brasileiro (dd/mm/aaaa) para ISO (aaaa-mm-dd)
 * @param brDate - Data no formato brasileiro
 * @returns String no formato ISO ou string vazia se inválida
 */
export function convertBRDateToISO(brDate: string): string {
  if (!brDate) return "";

  const parts = brDate.split("/");
  if (parts.length !== 3) return "";

  const [day, month, year] = parts;

  // Validar se são números válidos
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return "";
  if (dayNum < 1 || dayNum > 31) return "";
  if (monthNum < 1 || monthNum > 12) return "";
  if (yearNum < 1900 || yearNum > 2100) return "";

  // Criar data e verificar se é válida (isso detecta datas como 31/02)
  const testDate = new Date(yearNum, monthNum - 1, dayNum);
  if (
    testDate.getFullYear() !== yearNum ||
    testDate.getMonth() !== monthNum - 1 ||
    testDate.getDate() !== dayNum
  ) {
    return "";
  }

  // Criar data no formato ISO apenas se a data for válida
  const isoDate = `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

  return isoDate;
}

/**
 * Converte uma data do formato ISO (aaaa-mm-dd) para brasileiro (dd/mm/aaaa)
 * @param isoDate - Data no formato ISO
 * @returns String no formato brasileiro ou string vazia se inválida
 */
export function convertISODateToBR(isoDate: string): string {
  if (!isoDate) return "";

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return "";

  return formatDateToBR(date);
}

/**
 * Valida se uma data no formato brasileiro é válida
 * @param brDate - Data no formato brasileiro (dd/mm/aaaa)
 * @returns boolean indicando se a data é válida
 */
export function validateBRDate(brDate: string): boolean {
  if (!brDate) return false;

  const parts = brDate.split("/");
  if (parts.length !== 3) return false;

  const [day, month, year] = parts;

  // Validar se são números válidos
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return false;
  if (dayNum < 1 || dayNum > 31) return false;
  if (monthNum < 1 || monthNum > 12) return false;
  if (yearNum < 1900 || yearNum > 2100) return false;

  // Criar data e verificar se é válida
  const testDate = new Date(yearNum, monthNum - 1, dayNum);
  return (
    testDate.getFullYear() === yearNum &&
    testDate.getMonth() === monthNum - 1 &&
    testDate.getDate() === dayNum
  );
}

/**
 * Formata um input de data para aceitar apenas números e barras
 * @param value - Valor atual do input
 * @returns String formatada com máscara dd/mm/aaaa
 */
export function formatDateInput(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Aplica a máscara dd/mm/aaaa
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }
}

/**
 * Obtém a data atual no formato brasileiro
 * @returns String no formato dd/mm/aaaa
 */
export function getCurrentDateBR(): string {
  return formatDateToBR(new Date());
}

/**
 * Obtém a data atual no formato ISO
 * @returns String no formato aaaa-mm-dd
 */
export function getCurrentDateISO(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

/**
 * Calcula a diferença em dias entre duas datas
 * @param startDate - Data inicial (formato brasileiro ou ISO)
 * @param endDate - Data final (formato brasileiro ou ISO)
 * @returns Número de dias ou null se alguma data for inválida
 */
export function calculateDaysDifference(
  startDate: string,
  endDate: string,
): number | null {
  let start: Date;
  let end: Date;

  // Tentar converter datas brasileiras para ISO primeiro
  if (startDate.includes("/")) {
    const isoStart = convertBRDateToISO(startDate);
    if (!isoStart) return null;
    start = new Date(isoStart);
  } else {
    start = new Date(startDate);
  }

  if (endDate.includes("/")) {
    const isoEnd = convertBRDateToISO(endDate);
    if (!isoEnd) return null;
    end = new Date(isoEnd);
  } else {
    end = new Date(endDate);
  }

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Adiciona dias a uma data
 * @param date - Data base (formato brasileiro ou ISO)
 * @param days - Número de dias a adicionar
 * @returns Data resultante no formato brasileiro ou null se inválida
 */
export function addDaysToDate(date: string, days: number): string | null {
  let baseDate: Date;

  // Tentar converter data brasileira para ISO primeiro
  if (date.includes("/")) {
    const isoDate = convertBRDateToISO(date);
    if (!isoDate) return null;
    baseDate = new Date(isoDate);
  } else {
    baseDate = new Date(date);
  }

  if (isNaN(baseDate.getTime())) return null;

  baseDate.setDate(baseDate.getDate() + days);
  return formatDateToBR(baseDate);
}
