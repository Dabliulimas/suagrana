"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { type Account, type Transaction } from "../lib/data-layer/types";
import { useAccounts, useTransactions } from "../contexts/unified-context";
import { logComponents } from "../lib/utils/logger";

interface FutureInvoice {
  id: string;
  cardId: string;
  cardName: string;
  amount: number;
  dueDate: string;
  month: string;
  description?: string;
  isPaid: boolean;
  isEstimated: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceSyncManagerProps {
  onUpdate?: () => void;
}

export function InvoiceSyncManager({ onUpdate }: InvoiceSyncManagerProps) {
  const { accounts, update: updateAccount } = useAccounts();
  const { transactions } = useTransactions();
  const [futureInvoices, setFutureInvoices] = useState<FutureInvoice[]>([]);
  const [cards, setCards] = useState<Account[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load cards
    const creditCards = accounts.filter((account) => account.type === "credit");
    setCards(creditCards);

    // Load future invoices
    const savedInvoices = localStorage.getItem("futureInvoices");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (savedInvoices) {
      setFutureInvoices(JSON.parse(savedInvoices));
    }

    // Load last sync
    const savedLastSync = localStorage.getItem("lastInvoiceSync");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (savedLastSync) {
      setLastSync(savedLastSync);
    }
  };

  const calculateCurrentInvoiceAmount = (cardId: string, month: string) => {
    const startDate = new Date(month + "-01");
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0,
    );

    return transactions
      .filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          t.account === cardId &&
          t.type === "expense" &&
          transactionDate >= startDate &&
          transactionDate <= endDate
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const updateCardBalance = async (cardId: string, newBalance: number) => {
    const card = cards.find((c) => c.id === cardId);
    if (card) {
      try {
        await updateAccount(cardId, { balance: -newBalance });
      } catch (error) {
        logComponents.error("Erro ao atualizar saldo do cartão", error);
      }
    }
  };

  const processInvoiceSync = async () => {
    setIsProcessing(true);
    setSyncProgress(0);

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentInvoices = futureInvoices.filter(
        (inv) => inv.month === currentMonth,
      );

      for (let i = 0; i < currentInvoices.length; i++) {
        const invoice = currentInvoices[i];

        // Calculate current spending on this card for this month
        const currentSpending = calculateCurrentInvoiceAmount(
          invoice.cardId,
          invoice.month,
        );

        // Update card balance with the higher value (future invoice or current spending)
        const finalAmount = Math.max(invoice.amount, currentSpending);
        await updateCardBalance(invoice.cardId, finalAmount);

        // Update progress
        setSyncProgress(((i + 1) / currentInvoices.length) * 100);

        // Small delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Save last sync time
      const now = new Date().toISOString();
      localStorage.setItem("lastInvoiceSync", now);
      setLastSync(now);

      toast.success(
        `${currentInvoices.length} faturas sincronizadas com sucesso!`,
      );
      onUpdate?.();
    } catch (error) {
      logComponents.error("Erro ao sincronizar faturas", error);
      toast.error("Erro ao sincronizar faturas");
    } finally {
      setIsProcessing(false);
      setSyncProgress(0);
    }
  };

  const getInvoicesForCurrentMonth = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return futureInvoices.filter((inv) => inv.month === currentMonth);
  };

  const getUpcomingInvoices = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthStr = nextMonth.toISOString().slice(0, 7);

    return futureInvoices.filter((inv) => inv.month === nextMonthStr);
  };

  const getTotalFutureInvoices = () => {
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);

    return futureInvoices
      .filter((inv) => inv.month >= currentMonth && !inv.isPaid)
      .reduce((sum, inv) => sum + inv.amount, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const currentMonthInvoices = getInvoicesForCurrentMonth();
  const upcomingInvoices = getUpcomingInvoices();
  const totalFutureAmount = getTotalFutureInvoices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Sincronização de Faturas
          </h3>
          <p className="text-sm text-gray-600">
            Mantenha os saldos dos cartões atualizados com as faturas futuras
          </p>
        </div>
        <Button
          onClick={processInvoiceSync}
          disabled={isProcessing || currentMonthInvoices.length === 0}
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isProcessing ? "Sincronizando..." : "Sincronizar Agora"}
        </Button>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando faturas...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Mês Atual</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {currentMonthInvoices.length}
            </p>
            <p className="text-xs text-gray-500">faturas para sincronizar</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Próximo Mês</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {upcomingInvoices.length}
            </p>
            <p className="text-xs text-gray-500">faturas programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">Total Futuro</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalFutureAmount)}
            </p>
            <p className="text-xs text-gray-500">em faturas pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Month Invoices */}
      {currentMonthInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Faturas do Mês Atual
            </CardTitle>
            <CardDescription>
              Faturas que serão sincronizadas com os saldos dos cartões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentMonthInvoices.map((invoice) => {
                const currentSpending = calculateCurrentInvoiceAmount(
                  invoice.cardId,
                  invoice.month,
                );
                const difference = invoice.amount - currentSpending;

                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{invoice.cardName}</p>
                        <p className="text-sm text-gray-500">
                          Vence em{" "}
                          {new Date(invoice.dueDate).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        {formatCurrency(invoice.amount)}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">
                          Gasto atual: {formatCurrency(currentSpending)}
                        </span>
                        {difference > 0 && (
                          <Badge variant="outline" className="text-orange-600">
                            +{formatCurrency(difference)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Status da Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {lastSync ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              )}
              <div>
                <p className="font-medium">
                  {lastSync ? "Última sincronização" : "Nunca sincronizado"}
                </p>
                {lastSync && (
                  <p className="text-sm text-gray-500">
                    {new Date(lastSync).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
            </div>
            {currentMonthInvoices.length === 0 && (
              <Badge variant="outline">Nenhuma fatura para sincronizar</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <p>
                <strong>Faturas Futuras:</strong> Cadastre faturas que você já
                conhece para os próximos meses
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <p>
                <strong>Sincronização:</strong> O sistema atualiza o saldo do
                cartão com o maior valor entre a fatura futura e os gastos
                atuais
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
              <p>
                <strong>Atualização Automática:</strong> Conforme você faz
                compras, o saldo se ajusta automaticamente
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
              <p>
                <strong>Controle Total:</strong> Tenha visibilidade completa das
                suas faturas futuras e planejamento financeiro
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
