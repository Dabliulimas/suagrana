"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { UnifiedFinancialSystem } from "../lib/unified-financial-system";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import {
  Plus,
  Minus,
  ArrowUpDown,
  CreditCard,
  Wallet,
  Building2,
  TrendingUp,
  History,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { Account } from "../types";
import { auditLogger } from "../lib/audit";

interface AccountOperation {
  id: string;
  accountId: string;
  type: "deposit" | "withdrawal" | "transfer" | "adjustment";
  amount: number;
  description: string;
  targetAccountId?: string;
  timestamp: string;
  status: "pending" | "completed" | "failed";
  reference?: string;
}

interface AccountOperationsProps {
  // account?: Account; // Unused in current implementation
  onClose?: () => void;
  onUpdate?: () => void;
}

export function AccountOperations({
  // account, // Unused
  onClose,
  onUpdate,
}: AccountOperationsProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [operations, setOperations] = useState<AccountOperation[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [operationType, setOperationType] = useState<
    "deposit" | "withdrawal" | "transfer" | "adjustment"
  >("deposit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [targetAccount, setTargetAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOperationDialog, setShowOperationDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const financialSystem = UnifiedFinancialSystem.getInstance();
    const accounts = await financialSystem.getAccounts();
      setAccounts(accounts || []);
      const ops = JSON.parse(
        localStorage.getItem("sua-grana-account-operations") || "[]",
      );
      setOperations(Array.isArray(ops) ? ops : []);
    } catch {
      setAccounts([]);
      setOperations([]);
    }
  };

  const saveOperations = (newOperations: AccountOperation[]) => {
    localStorage.setItem(
      "sua-grana-account-operations",
      JSON.stringify(newOperations),
    );
    setOperations(newOperations);
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const executeOperation = async () => {
    if (!selectedAccount || !amount || !description) {
      return;
    }

    setIsLoading(true);

    try {
      const operationAmount = Number.parseFloat(amount);
      const account = accounts.find((a) => a.id === selectedAccount);

      if (!account) {
        throw new Error("Conta não encontrada");
      }

      // Validate operation
      if (operationType === "withdrawal" && account.balance < operationAmount) {
        throw new Error("Saldo insuficiente");
      }

      if (operationType === "transfer") {
        if (!targetAccount) {
          throw new Error("Conta de destino é obrigatória para transferências");
        }

        const target = accounts.find((a) => a.id === targetAccount);
        if (!target) {
          throw new Error("Conta de destino não encontrada");
        }

        if (account.balance < operationAmount) {
          throw new Error("Saldo insuficiente para transferência");
        }
      }

      // Create operation record
      const operation: AccountOperation = {
        id: generateId(),
        accountId: selectedAccount,
        type: operationType,
        amount: operationAmount,
        description,
        targetAccountId:
          operationType === "transfer" ? targetAccount : undefined,
        timestamp: new Date().toISOString(),
        status: "pending",
        reference: `OP-${Date.now()}`,
      };

      // Execute the operation
      // let balanceChange = 0; // Unused - balance is handled by transaction system

      switch (operationType) {
        case "deposit":
          // balanceChange = operationAmount;
          break;
        case "withdrawal":
          // balanceChange = -operationAmount;
          break;
        case "adjustment":
          // balanceChange = operationAmount;
          break;
        case "transfer":
          // balanceChange = -operationAmount;
          // Update target account
          const targetAcc = accounts.find((a) => a.id === targetAccount);
          if (targetAcc) {
            await updateAccount(targetAccount, {
              balance: targetAcc.balance + operationAmount,
            });
          }
          break;
      }

      // Atualização de saldo será refletida pelo backend via transação

      // Create corresponding transaction
      const payload = {
        description: `${getOperationTypeLabel(operationType)}: ${description}`,
        amount:
          operationType === "deposit"
            ? Math.abs(operationAmount)
            : -Math.abs(operationAmount),
        type: operationType === "deposit" ? "income" : "expense",
        category: getOperationCategory(operationType),
        accountId: selectedAccount,
        date: new Date().toISOString().split("T")[0],
        notes: `Operação: ${operationType}`,
      };
      const financialSystem = UnifiedFinancialSystem.getInstance();
    await financialSystem.createTransaction(payload);

      // Mark operation as completed
      operation.status = "completed";
      const newOperations = [...operations, operation];
      saveOperations(newOperations);

      // Log audit event
      await auditLogger.log({
        action: "ACCOUNT_OPERATION",
        details: {
          operationType,
          accountId: selectedAccount,
          amount: operationAmount,
          reference: operation.reference,
        },
        severity: operationAmount > 10000 ? "high" : "medium",
      });

      // Reset form
      setAmount("");
      setDescription("");
      setTargetAccount("");
      setShowOperationDialog(false);

      // Reload data
      loadData();
      onUpdate?.();
    } catch (error) {
      logComponents.error("Erro ao executar operação:", error);

      // Create failed operation record
      const failedOperation: AccountOperation = {
        id: generateId(),
        accountId: selectedAccount,
        type: operationType,
        amount: Number.parseFloat(amount),
        description,
        targetAccountId:
          operationType === "transfer" ? targetAccount : undefined,
        timestamp: new Date().toISOString(),
        status: "failed",
        reference: `OP-${Date.now()}`,
      };

      const newOperations = [...operations, failedOperation];
      saveOperations(newOperations);

      await auditLogger.log({
        action: "ACCOUNT_OPERATION_FAILED",
        details: {
          operationType,
          accountId: selectedAccount,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        },
        severity: "high",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Depósito";
      case "withdrawal":
        return "Saque";
      case "transfer":
        return "Transferência";
      case "adjustment":
        return "Ajuste";
      default:
        return type;
    }
  };

  const getOperationCategory = (type: string) => {
    switch (type) {
      case "deposit":
        return "Depósito";
      case "withdrawal":
        return "Saque";
      case "transfer":
        return "Transferência";
      case "adjustment":
        return "Ajuste de Conta";
      default:
        return "Operação Bancária";
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <Plus className="w-4 h-4 text-green-600" />;
      case "withdrawal":
        return <Minus className="w-4 h-4 text-red-600" />;
      case "transfer":
        return <ArrowUpDown className="w-4 h-4 text-blue-600" />;
      case "adjustment":
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluída
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Falhou
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Dialog
          open={showOperationDialog}
          onOpenChange={setShowOperationDialog}
        >
          <DialogTrigger asChild>
            <Button
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setOperationType("deposit")}
            >
              <Plus className="w-6 h-6" />
              <span>Depósito</span>
            </Button>
          </DialogTrigger>
        </Dialog>

        <Dialog
          open={showOperationDialog}
          onOpenChange={setShowOperationDialog}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
              onClick={() => setOperationType("withdrawal")}
            >
              <Minus className="w-6 h-6" />
              <span>Saque</span>
            </Button>
          </DialogTrigger>
        </Dialog>

        <Dialog
          open={showOperationDialog}
          onOpenChange={setShowOperationDialog}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
              onClick={() => setOperationType("transfer")}
            >
              <ArrowUpDown className="w-6 h-6" />
              <span>Transferência</span>
            </Button>
          </DialogTrigger>
        </Dialog>

        <Dialog
          open={showOperationDialog}
          onOpenChange={setShowOperationDialog}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent"
              onClick={() => setOperationType("adjustment")}
            >
              <TrendingUp className="w-6 h-6" />
              <span>Ajuste</span>
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Nova Operação - {getOperationTypeLabel(operationType)}
              </DialogTitle>
              <DialogDescription>
                Execute operações nas suas contas bancárias
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="account">Conta</Label>
                <Select
                  value={selectedAccount}
                  onValueChange={setSelectedAccount}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4" />
                          <span>{account.name}</span>
                          <span className="text-sm text-gray-500">
                            R$ {account.balance.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {operationType === "transfer" && (
                <div>
                  <Label htmlFor="targetAccount">Conta de Destino</Label>
                  <Select
                    value={targetAccount}
                    onValueChange={setTargetAccount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((account) => account.id !== selectedAccount)
                        .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4" />
                              <span>{account.name}</span>
                              <span className="text-sm text-gray-500">
                                R$ {account.balance.toFixed(2)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva a operação..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowOperationDialog(false);
                    onClose?.();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={executeOperation}
                  disabled={
                    isLoading ||
                    !selectedAccount ||
                    !amount ||
                    !description ||
                    (operationType === "transfer" && !targetAccount)
                  }
                >
                  {isLoading ? "Executando..." : "Executar Operação"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Account Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                {account.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {account.balance.toFixed(2)}
              </div>
              <p className="text-xs text-gray-600">
                {account.type || "Conta Corrente"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operations History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Histórico de Operações
          </CardTitle>
          <CardDescription>
            Últimas operações realizadas nas contas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {operations
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime(),
              )
              .slice(0, 10)
              .map((operation) => {
                const account = accounts.find(
                  (a) => a.id === operation.accountId,
                );
                const targetAcc = operation.targetAccountId
                  ? accounts.find((a) => a.id === operation.targetAccountId)
                  : null;

                return (
                  <div
                    key={operation.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getOperationIcon(operation.type)}
                      <div>
                        <p className="font-medium">{operation.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{account?.name}</span>
                          {targetAcc && (
                            <>
                              <ArrowUpDown className="w-3 h-3" />
                              <span>{targetAcc.name}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(operation.timestamp).toLocaleString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        R$ {operation.amount.toFixed(2)}
                      </p>
                      {getStatusBadge(operation.status)}
                      {operation.reference && (
                        <p className="text-xs text-gray-500 mt-1">
                          {operation.reference}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

            {operations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma operação realizada ainda</p>
                <p className="text-sm">
                  Execute sua primeira operação bancária
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
