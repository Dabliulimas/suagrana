import { parseNumber, isValidNumber, formatNumber, formatCurrency } from '../number-utils';

describe('Number Utils', () => {
  describe('parseNumber', () => {
    test('should parse Brazilian decimal format', () => {
      expect(parseNumber('100,50')).toBe(100.5);
      expect(parseNumber('1.234,56')).toBe(1234.56);
      expect(parseNumber('10.000,00')).toBe(10000);
    });

    test('should parse American decimal format', () => {
      expect(parseNumber('100.50')).toBe(100.5);
      expect(parseNumber('1234.56')).toBe(1234.56);
    });

    test('should handle integers', () => {
      expect(parseNumber('100')).toBe(100);
      expect(parseNumber(100)).toBe(100);
    });

    test('should handle edge cases', () => {
      expect(parseNumber('')).toBeNaN();
      expect(parseNumber('abc')).toBeNaN();
      expect(parseNumber('0')).toBe(0);
      expect(parseNumber('0,00')).toBe(0);
    });

    test('should handle mixed formats correctly', () => {
      // Brazilian format with thousands separator
      expect(parseNumber('1.234.567,89')).toBe(1234567.89);
      // Only comma (Brazilian decimal)
      expect(parseNumber('567,89')).toBe(567.89);
      // Only dot (American decimal or thousands)
      expect(parseNumber('1234.56')).toBe(1234.56);
    });
  });

  describe('isValidNumber', () => {
    test('should validate correct numbers', () => {
      expect(isValidNumber('100,50')).toBe(true);
      expect(isValidNumber('1.234,56')).toBe(true);
      expect(isValidNumber('100')).toBe(true);
      expect(isValidNumber(100)).toBe(true);
    });

    test('should invalidate incorrect inputs', () => {
      expect(isValidNumber('')).toBe(false);
      expect(isValidNumber('abc')).toBe(false);
      expect(isValidNumber('100,50,25')).toBe(false);
    });
  });

  describe('formatNumber', () => {
    test('should format numbers in Brazilian format', () => {
      expect(formatNumber(100.5)).toBe('100,50');
      expect(formatNumber(1234.56)).toBe('1.234,56');
      expect(formatNumber(10000)).toBe('10.000,00');
    });

    test('should handle NaN', () => {
      expect(formatNumber(NaN)).toBe('0,00');
    });
  });

  describe('formatCurrency', () => {
    test('should format currency in Brazilian format', () => {
      expect(formatCurrency(100.5)).toBe('R$ 100,50');
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
    });

    test('should handle NaN', () => {
      expect(formatCurrency(NaN)).toBe('R$ 0,00');
    });
  });
});

// Casos de teste específicos para o bug relatado
describe('Transaction Bug Fix', () => {
  test('should correctly parse 100,00 as 100', () => {
    const userInput = '100,00';
    const parsed = parseNumber(userInput);
    expect(parsed).toBe(100);
    expect(parsed).not.toBe(1000); // Garantir que não está multiplicando por 10
  });

  test('should correctly parse 100.00 as 100', () => {
    const userInput = '100.00';
    const parsed = parseNumber(userInput);
    expect(parsed).toBe(100);
    expect(parsed).not.toBe(1000);
  });

  test('should correctly parse 1.000,50 as 1000.5', () => {
    const userInput = '1.000,50';
    const parsed = parseNumber(userInput);
    expect(parsed).toBe(1000.5);
  });
});
