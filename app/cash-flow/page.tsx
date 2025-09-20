"use client";

import { ModernAppLayout } from "@/components/modern-app-layout";
import { logComponents } from "../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
} from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: "income" | "expense";
}

interface CashFlowData {
  monthly: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
    savingsRate: number;
  }>;
  totals: {
    totalIncome: number;
    totalExpenses: number;
    totalBalance: number;
  };
  period: {
    start: string;
    end: string;
  };
}

export default function CashFlowPage() {
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCashFlowData();
    loadTransactions();
  }, [selectedYear, loadCashFlowData, loadTransactions]);

  const loadCashFlowData = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = startOfYear(new Date(parseInt(selectedYear)));
      const endDate = endOfYear(new Date(parseInt(selectedYear)));

      const response = await fetch(
        `/api/reports/cash-flow?start=${format(startDate, "yyyy-MM-dd")}&end=${format(endDate, "yyyy-MM-dd")}`,
      );
      if (response.ok) {
        const data = await response.json();
        setCashFlowData(data);
      }
    } catch (error) {
      logComponents.error("Erro ao carregar dados de fluxo de caixa:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  const loadTransactions = useCallback(async () => {
    try {
      const startDate = startOfMonth(
        new Date(parseInt(selectedYear), selectedMonth),
      );
      const endDate = endOfMonth(
        new Date(parseInt(selectedYear), selectedMonth),
      );

      const response = await fetch(
        `/api/transactions?start=${format(startDate, "yyyy-MM-dd")}&end=${format(endDate, "yyyy-MM-dd")}`,
      );
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      logComponents.error("Erro ao carregar transações:", error);
    }
  }, [selectedYear, selectedMonth]);

  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const daysInMonth = new Date(
    parseInt(selectedYear),
    selectedMonth + 1,
    0,
  ).getDate();

  const getDailyData = (day: number) => {
    const date = new Date(parseInt(selectedYear), selectedMonth, day);
    const dailyTransactions = monthlyTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getDate() === day;
    });

    const entrada = dailyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const saida = dailyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const diario = entrada - saida;

    return { entrada, saida, diario };
  };

  // Usar dados da API para totais anuais
  const yearTotals = cashFlowData
    ? {
        entradas: cashFlowData.totals.totalIncome,
        saidas: cashFlowData.totals.totalExpenses,
      }
    : { entradas: 0, saidas: 0 };

  const saldoFinal = yearTotals.entradas - yearTotals.saidas;

  // Calcular dados diários para o mês selecionado
  const monthlyTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return (
      tDate.getFullYear() === parseInt(selectedYear) &&
      tDate.getMonth() === selectedMonth
    );
  });

  // Recarregar transações quando o mês mudar
  useEffect(() => {
    loadTransactions();
  }, [selectedMonth, selectedYear, loadTransactions]);

  let saldoAcumulado = 0;

  return (
    <ModernAppLayout
      title="Fluxo de Caixa"
      subtitle="Acompanhe suas entradas e saídas"
    >
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() - 5 + i,
                ).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Poupança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cashFlowData && cashFlowData.totals.totalIncome > 0
                  ? `${(((cashFlowData.totals.totalIncome - cashFlowData.totals.totalExpenses) / cashFlowData.totals.totalIncome) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Gastos Mensais Médios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {cashFlowData
                  ? (
                      cashFlowData.totals.totalExpenses /
                      Math.max(cashFlowData.monthly.length, 1)
                    ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                  : "0,00"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Mensal Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {cashFlowData
                  ? (
                      cashFlowData.totals.totalIncome /
                      Math.max(cashFlowData.monthly.length, 1)
                    ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                  : "0,00"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Entradas {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {yearTotals.entradas.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Saídas {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {yearTotals.saidas.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Diário {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Saldo Final {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {saldoFinal.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-2">
          {months.map((month, index) => (
            <Button
              key={month}
              variant={selectedMonth === index ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMonth(index)}
            >
              {month}
            </Button>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            {months[selectedMonth]} {selectedYear}
          </h2>
          <div className="grid grid-cols-5 gap-2 text-center font-semibold mb-2">
            <div>DIA</div>
            <div>ENTRADA</div>
            <div>SAÍDA</div>
            <div>DIÁRIO</div>
            <div>SALDO</div>
          </div>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const { entrada, saida, diario } = getDailyData(day);
            saldoAcumulado += diario;
            return (
              <div
                key={day}
                className="grid grid-cols-5 gap-2 text-center items-center p-2 border-b"
              >
                <div>{day}</div>
                <div className="text-green-500">
                  R${" "}
                  {entrada.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div className="text-red-500">
                  R${" "}
                  {saida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <div>
                  R${" "}
                  {diario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <div>
                  R${" "}
                  {saldoAcumulado.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModernAppLayout>
  );
}
