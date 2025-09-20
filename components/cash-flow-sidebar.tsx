"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import type { Transaction, RecurringBill } from "../types";

interface MonthlyProjection {
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  isPositive: boolean;
  transactions: Transaction[];
  recurringBills: RecurringBill[];
}

interface CashFlowSidebarProps {
  className?: string;
}

export const CashFlowSidebar = React.memo(function CashFlowSidebar({
  className,
}: CashFlowSidebarProps) {
  const [projections, setProjections] = useState<MonthlyProjection[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);

  // Calcular projeções de fluxo de caixa
  const calculateProjections = useMemo(() => {
    const transactions = transactions || [];
    const recurringBills = storage.getItem("recurringBills") || [];
    const accounts = accounts || [];

    // Calcular saldo atual
    const totalBalance = accounts.reduce(
      (sum, account) => sum + (account.balance || 0),
      0,
    );
    setCurrentBalance(totalBalance);

    const projections: MonthlyProjection[] = [];
    const today = new Date();

    // Gerar projeções para os próximos 6 meses
    for (let i = 0; i < 6; i++) {
      const projectionDate = new Date(
        today.getFullYear(),
        today.getMonth() + i,
        1,
      );
      const month = projectionDate.toLocaleDateString("pt-BR", {
        month: "short",
      });
      const year = projectionDate.getFullYear();

      // Filtrar transações futuras do mês
      const monthTransactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getMonth() === projectionDate.getMonth() &&
          transactionDate.getFullYear() === projectionDate.getFullYear() &&
          transactionDate >= today
        );
      });

      // Calcular receitas e despesas das transações
      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      // Adicionar contas recorrentes ativas
      const monthlyRecurringExpenses = recurringBills
        .filter((bill) => bill.isActive)
        .reduce((sum, bill) => {
          // Verificar se a conta vence neste mês
          const dueDate = new Date(bill.nextDueDate);
          if (
            dueDate.getMonth() === projectionDate.getMonth() &&
            dueDate.getFullYear() === projectionDate.getFullYear()
          ) {
            return sum + bill.amount;
          }
          return sum;
        }, 0);

      const totalExpenses = expenses + monthlyRecurringExpenses;
      const balance = income - totalExpenses;

      projections.push({
        month,
        year,
        income,
        expenses: totalExpenses,
        balance,
        isPositive: balance >= 0,
        transactions: monthTransactions,
        recurringBills: recurringBills.filter((bill) => {
          const dueDate = new Date(bill.nextDueDate);
          return (
            bill.isActive &&
            dueDate.getMonth() === projectionDate.getMonth() &&
            dueDate.getFullYear() === projectionDate.getFullYear()
          );
        }),
      });
    }

    return projections;
  }, []);

  useEffect(() => {
    setProjections(calculateProjections);
  }, [calculateProjections]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Math.abs(value));
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600";
    if (balance < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <ArrowUp className="w-3 h-3" />;
    if (balance < 0) return <ArrowDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getBadgeVariant = (balance: number) => {
    if (balance > 0) return "default";
    if (balance < 0) return "destructive";
    return "secondary";
  };

  if (isCollapsed) {
    return (
      <Card className={`w-16 ${className}`}>
        <CardContent className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="w-full h-12 flex flex-col items-center justify-center"
          >
            <TrendingUp className="w-4 h-4 mb-1" />
            <span className="text-xs">Fluxo</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Fluxo de Caixa
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="h-6 w-6 p-0"
          >
            <EyeOff className="w-3 h-3" />
          </Button>
        </div>

        {/* Saldo Atual */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-600 font-medium">
              Saldo Atual
            </span>
            <DollarSign className="w-3 h-3 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-700">
            {formatCurrency(currentBalance)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground font-medium mb-2">
          Projeção - Próximos 6 Meses
        </div>

        {projections.map((projection, index) => (
          <div
            key={`${projection.month}-${projection.year}`}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium capitalize">
                  {projection.month} {projection.year}
                </span>
              </div>
              <Badge
                variant={getBadgeVariant(projection.balance)}
                className="text-xs px-2 py-0 h-5"
              >
                <span className="flex items-center gap-1">
                  {getBalanceIcon(projection.balance)}
                  {formatCurrency(projection.balance)}
                </span>
              </Badge>
            </div>

            {/* Detalhes do mês */}
            <div className="bg-gray-50 p-2 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-green-600 flex items-center gap-1">
                  <ArrowUp className="w-2 h-2" />
                  Receitas:
                </span>
                <span className="font-medium text-green-600">
                  {formatCurrency(projection.income)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-red-600 flex items-center gap-1">
                  <ArrowDown className="w-2 h-2" />
                  Despesas:
                </span>
                <span className="font-medium text-red-600">
                  {formatCurrency(projection.expenses)}
                </span>
              </div>

              <div className="border-t my-1" />

              <div className="flex justify-between font-medium">
                <span className={getBalanceColor(projection.balance)}>
                  Saldo:
                </span>
                <span className={getBalanceColor(projection.balance)}>
                  {projection.balance >= 0 ? "+" : "-"}
                  {formatCurrency(projection.balance)}
                </span>
              </div>
            </div>

            {index < projections.length - 1 && (
              <div className="border-t my-2" />
            )}
          </div>
        ))}

        {/* Resumo Geral */}
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs text-muted-foreground mb-2 font-medium">
            Resumo dos 6 Meses
          </div>

          {(() => {
            const totalIncome = projections.reduce(
              (sum, p) => sum + p.income,
              0,
            );
            const totalExpenses = projections.reduce(
              (sum, p) => sum + p.expenses,
              0,
            );
            const totalBalance = totalIncome - totalExpenses;
            const positiveMonths = projections.filter(
              (p) => p.isPositive,
            ).length;

            return (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Meses Positivos:</span>
                  <Badge
                    variant={positiveMonths >= 3 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {positiveMonths}/6
                  </Badge>
                </div>

                <div className="flex justify-between text-xs font-medium">
                  <span className={getBalanceColor(totalBalance)}>
                    Saldo Total:
                  </span>
                  <span className={getBalanceColor(totalBalance)}>
                    {totalBalance >= 0 ? "+" : "-"}
                    {formatCurrency(totalBalance)}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
});
