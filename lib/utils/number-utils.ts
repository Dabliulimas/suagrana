/**
 * Utilitários para normalização de números no formato brasileiro
 */

/**
 * Converte um valor string do formato brasileiro para number
 * @param value - Valor como string (ex: "1.234,56" ou "100,00")
 * @returns Number convertido ou NaN se inválido
 */
export function parseNumber(value: string | number): number {
  // Se já é number, retorna direto
  if (typeof value === 'number') {
    return value;
  }

  // Remove espaços e caracteres especiais desnecessários
  let cleanValue = value.toString().trim();
  
  // Remove espaços, caracteres de formatação
  cleanValue = cleanValue.replace(/\s/g, '');
  
  // Verifica se há pontos E vírgulas (formato brasileiro: 1.234,56)
  const hasThousandsSeparator = cleanValue.includes('.') && cleanValue.includes(',');
  const lastCommaIndex = cleanValue.lastIndexOf(',');
  const lastDotIndex = cleanValue.lastIndexOf('.');
  
  if (hasThousandsSeparator) {
    // Formato brasileiro: 1.234.567,89
    // Remove pontos (separadores de milhares) e substitui vírgula por ponto
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  } else if (cleanValue.includes(',') && lastCommaIndex > lastDotIndex) {
    // Formato brasileiro sem milhares: 123,45
    cleanValue = cleanValue.replace(',', '.');
  } else if (cleanValue.includes('.') && !cleanValue.includes(',')) {
    // Já está no formato americano: 123.45
    // Mantém como está
  }
  
  // Remove caracteres não numéricos exceto ponto decimal
  cleanValue = cleanValue.replace(/[^\d.-]/g, '');
  
  return parseFloat(cleanValue);
}

/**
 * Formata um número para exibição no formato brasileiro
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada (ex: "1.234,56")
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value)) {
    return '0,00';
  }
  
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata um número para exibição de moeda brasileira
 * @param value - Valor numérico
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  if (isNaN(value)) {
    return 'R$ 0,00';
  }
  
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Valida se uma string representa um número válido
 * @param value - Valor a ser validado
 * @returns true se for um número válido
 */
export function isValidNumber(value: string | number): boolean {
  const parsed = parseNumber(value);
  return !isNaN(parsed) && isFinite(parsed);
}

/**
 * Cria um input handler para campos numéricos
 * Permite apenas números, vírgulas e pontos
 * @param onChange - Callback quando o valor mudar
 * @returns Handler para onChange do input
 */
export function createNumberInputHandler(onChange: (value: string) => void) {
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Permite apenas números, vírgula, ponto e sinal de menos
    const allowedChars = /^-?[\d.,]*$/;
    
    if (allowedChars.test(value) || value === '') {
      onChange(value);
    }
  };
}

/**
 * Hook personalizado para campos de valor monetário
 */
export function useMoneyInput(initialValue: string = '') {
  const [displayValue, setDisplayValue] = React.useState(initialValue);
  
  const numericValue = React.useMemo(() => {
    return parseNumber(displayValue);
  }, [displayValue]);
  
  const isValid = React.useMemo(() => {
    return isValidNumber(displayValue);
  }, [displayValue]);
  
  const handleChange = React.useCallback((value: string) => {
    setDisplayValue(value);
  }, []);
  
  const setValue = React.useCallback((value: number | string) => {
    if (typeof value === 'number') {
      setDisplayValue(formatNumber(value));
    } else {
      setDisplayValue(value);
    }
  }, []);
  
  return {
    displayValue,
    numericValue,
    isValid,
    handleChange,
    setValue,
    inputHandler: createNumberInputHandler(handleChange),
  };
}

// Para compatibilidade com código React
import React from 'react';
