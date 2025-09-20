"use client";

import { useState } from "react";
import { parseNumber, isValidNumber, formatNumber, formatCurrency } from "../../lib/utils/number-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Check, X, AlertTriangle } from "lucide-react";

export default function TestNumberFix() {
  const [inputValue, setInputValue] = useState('');
  const [testResults, setTestResults] = useState<Array<{
    input: string;
    parsed: number;
    isValid: boolean;
    formatted: string;
    currency: string;
  }>>([]);

  const runTest = () => {
    if (!inputValue.trim()) return;
    
    const parsed = parseNumber(inputValue);
    const isValid = isValidNumber(inputValue);
    const formatted = formatNumber(parsed);
    const currency = formatCurrency(parsed);

    const newResult = {
      input: inputValue,
      parsed,
      isValid,
      formatted,
      currency,
    };

    setTestResults(prev => [newResult, ...prev.slice(0, 9)]); // Manter apenas os 10 últimos
    setInputValue('');
  };

  const runPredefinedTests = () => {
    const testCases = [
      '100,00',
      '100.00', 
      '1.000,50',
      '1,000.50',
      '12.345.678,90',
      '50',
      '0,01',
      'abc',
      '100,50,25',
      '',
    ];

    const results = testCases.map(input => ({
      input,
      parsed: parseNumber(input),
      isValid: isValidNumber(input),
      formatted: formatNumber(parseNumber(input)),
      currency: formatCurrency(parseNumber(input)),
    }));

    setTestResults(results);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Teste da Correção do Bug de Conversão de Números
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">🐛 Problema Original:</h3>
              <p className="text-red-700 text-sm">
                Quando o usuário digitava "100,00", o sistema interpretava como "1000,00" (multiplicava por 10).
                Isso acontecia porque <code>parseFloat("100,00")</code> retorna <code>100</code> mas não considera a vírgula decimal brasileira.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">✅ Solução:</h3>
              <p className="text-green-700 text-sm">
                Criamos a função <code>parseNumber()</code> que entende formatos brasileiros:
              </p>
              <ul className="text-green-700 text-sm ml-4 mt-2 list-disc">
                <li>"100,00" → 100</li>
                <li>"1.234,56" → 1234.56</li>
                <li>"100.00" → 100 (formato americano também)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teste Manual */}
        <Card>
          <CardHeader>
            <CardTitle>Teste Manual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="manual-input">Digite um valor para testar:</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ex: 100,00 ou 1.234,56"
                  onKeyPress={(e) => e.key === 'Enter' && runTest()}
                />
                <Button onClick={runTest} disabled={!inputValue.trim()}>
                  Testar
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={runPredefinedTests} 
              variant="outline" 
              className="w-full"
            >
              Executar Testes Pré-definidos
            </Button>
          </CardContent>
        </Card>

        {/* Explicação Técnica */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>1. Detecção de Formato:</strong>
                <p className="text-gray-600">Identifica se é formato brasileiro (vírgula) ou americano (ponto)</p>
              </div>
              <div>
                <strong>2. Normalização:</strong>
                <p className="text-gray-600">Remove separadores de milhares e converte vírgula para ponto</p>
              </div>
              <div>
                <strong>3. Validação:</strong>
                <p className="text-gray-600">Verifica se o resultado é um número válido</p>
              </div>
              <div>
                <strong>4. Conversão:</strong>
                <p className="text-gray-600">Usa parseFloat() apenas após normalização</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados */}
      {testResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Entrada</th>
                    <th className="text-left p-2">Válido?</th>
                    <th className="text-left p-2">Valor Numérico</th>
                    <th className="text-left p-2">Formatado</th>
                    <th className="text-left p-2">Moeda</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono">
                        {result.input || '(vazio)'}
                      </td>
                      <td className="p-2">
                        {result.isValid ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="w-3 h-3 mr-1" />
                            Não
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 font-mono">
                        {isNaN(result.parsed) ? 'NaN' : result.parsed}
                      </td>
                      <td className="p-2 font-mono">
                        {result.formatted}
                      </td>
                      <td className="p-2 font-mono">
                        {result.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status da Correção */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Status da Correção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800">Modal de Transação</h3>
              <p className="text-sm text-green-600">✅ Corrigido</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800">Lista de Edição</h3>
              <p className="text-sm text-green-600">✅ Corrigido</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800">FAB de Ações</h3>
              <p className="text-sm text-green-600">✅ Corrigido</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
