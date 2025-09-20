"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { storage, type SharedDebt } from "../lib/storage/storage";
import { CreditCard, AlertCircle, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

interface SharedDebtsDisplayProps {
  className?: string;
}

export function SharedDebtsDisplay({ className }: SharedDebtsDisplayProps) {
  const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [debts, setDebts] = useState<SharedDebt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDebts = () => {
    try {
      const allDebts = storage.getSharedDebts();
      const activeDebts = allDebts.filter((debt) => debt.status === "active");
      setDebts(activeDebts);
    } catch (error) {
      logComponents.error("Erro ao carregar dívidas:", error);
      toast.error("Erro ao carregar dívidas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, []);

  const handleMarkAsPaid = (debt: SharedDebt) => {
    try {
      storage.updateSharedDebt(debt.id, { status: "paid" });
      loadDebts();
      toast.success(`Dívida com ${debt.creditor} marcada como paga!`);
    } catch (error) {
      logComponents.error("Erro ao marcar dívida como paga:", error);
      toast.error("Erro ao marcar dívida como paga");
    }
  };

  const handleCancelDebt = (debt: SharedDebt) => {
    try {
      storage.updateSharedDebt(debt.id, { status: "cancelled" });
      loadDebts();
      toast.success(`Dívida com ${debt.creditor} cancelada!`);
    } catch (error) {
      logComponents.error("Erro ao cancelar dívida:", error);
      toast.error("Erro ao cancelar dívida");
    }
  };

  const currentUser = "Usuário Atual"; // TODO: Pegar do contexto de usuário
  const debtsOwed = debts.filter((debt) => debt.debtor === currentUser);
  const debtsToReceive = debts.filter((debt) => debt.creditor === currentUser);

  const totalOwed = debtsOwed.reduce(
    (sum, debt) => sum + debt.currentAmount,
    0,
  );
  const totalToReceive = debtsToReceive.reduce(
    (sum, debt) => sum + debt.currentAmount,
    0,
  );
  const netBalance = totalToReceive - totalOwed;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Dívidas Compartilhadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando dívidas...</div>
        </CardContent>
      </Card>
    );
  }

  if (debts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Dívidas Compartilhadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            Nenhuma dívida ativa no momento
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Dívidas Compartilhadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo do saldo */}
        <Alert
          className={
            netBalance >= 0
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex justify-between items-center">
              <span>Saldo líquido:</span>
              <span
                className={`font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {netBalance >= 0 ? "+" : ""}R$ {netBalance.toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Você deve: R$ {totalOwed.toFixed(2)} • Devem para você: R${" "}
              {totalToReceive.toFixed(2)}
            </div>
          </AlertDescription>
        </Alert>

        {/* Dívidas que você deve */}
        {debtsOwed.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Você deve ({debtsOwed.length})
            </h4>
            {debtsOwed.map((debt) => (
              <div
                key={debt.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200"
              >
                <div className="flex-1">
                  <div className="font-medium">{debt.creditor}</div>
                  <div className="text-sm text-muted-foreground">
                    {debt.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Criado em {new Date(debt.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">
                    R$ {debt.currentAmount.toFixed(2)}
                  </div>
                  <div className="flex gap-1 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsPaid(debt)}
                      className="text-xs"
                    >
                      Marcar como Pago
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelDebt(debt)}
                      className="text-xs"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dívidas que devem para você */}
        {debtsToReceive.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-green-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Devem para você ({debtsToReceive.length})
            </h4>
            {debtsToReceive.map((debt) => (
              <div
                key={debt.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200"
              >
                <div className="flex-1">
                  <div className="font-medium">{debt.debtor}</div>
                  <div className="text-sm text-muted-foreground">
                    {debt.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Criado em {new Date(debt.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    +R$ {debt.currentAmount.toFixed(2)}
                  </div>
                  <Badge variant="secondary" className="mt-1">
                    A receber
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
