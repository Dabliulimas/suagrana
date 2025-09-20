"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { DatePicker } from "./ui/date-picker";
import { DollarSign, Plus, Edit, Trash2, Calendar } from "lucide-react";
import { type Dividend, type Investment } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { useInvestments } from "../contexts/investments/investment-context";
import { toast } from "sonner";

interface DividendManagerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ticker?: string;
}

export function DividendManager({
  isOpen,
  onOpenChange,
  ticker,
}: DividendManagerProps) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const {
    state: { investments, dividendOperations },
    executeDividendOperation,
    getDividendsByInvestment,
  } = useInvestments();

  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDividend, setEditingDividend] = useState<Dividend | null>(null);
  const [formData, setFormData] = useState({
    ticker: ticker || "",
    amount: "",
    quantity: "",
    exDate: "",
    payDate: "",
    type: "dividend" as Dividend["type"],
    account: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, dividendOperations]);

  const loadData = () => {
    // Combinar dividendos do storage antigo com as novas operações de dividendos
    const storageDividends = storage.getDividends();
    const contextDividends = dividendOperations.map(
      (op) =>
        ({
          id: op.id,
          ticker: op.symbol,
          amount: op.valuePerShare || op.price,
          quantity: op.quantity,
          totalAmount: op.totalValue,
          exDate: op.date,
          payDate: op.paymentDate || op.date,
          type: op.dividendType || "dividend",
          account: "Conta Principal", // Valor padrão
          createdAt: op.date,
          updatedAt: op.date,
        }) as Dividend,
    );

    const allDividends = [...storageDividends, ...contextDividends];

    if (ticker) {
      setDividends(allDividends.filter((d) => d.ticker === ticker));
    } else {
      setDividends(allDividends);
    }
  };

  const getAvailableTickers = () => {
    const tickers = new Set<string>();
    // Usar investimentos do contexto
    investments.forEach((inv) => {
      if (inv.symbol) {
        tickers.add(inv.symbol);
      }
    });
    // Também incluir investimentos do storage antigo
    const storageInvestments = storage.getInvestments();
    storageInvestments.forEach((inv) => {
      if (inv.ticker) {
        tickers.add(inv.ticker);
      }
    });
    return Array.from(tickers).sort();
  };

  const getAvailableAccounts = () => {
    const accounts = new Set<string>();
    // Usar investimentos do contexto
    investments.forEach((inv) => {
      if (inv.account) {
        accounts.add(inv.account);
      }
    });
    // Também incluir investimentos do storage antigo
    const storageInvestments = storage.getInvestments();
    storageInvestments.forEach((inv) => {
      accounts.add(inv.account);
    });
    // Adicionar conta padrão se não houver nenhuma
    if (accounts.size === 0) {
      accounts.add("Conta Principal");
    }
    return Array.from(accounts).sort();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.ticker ||
      !formData.amount ||
      !formData.quantity ||
      !formData.exDate
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const amount = parseFloat(formData.amount);
    const quantity = parseFloat(formData.quantity);

    if (isNaN(amount) || isNaN(quantity) || amount <= 0 || quantity <= 0) {
      toast.error("Valores devem ser números positivos");
      return;
    }

    const dividendData = {
      ticker: formData.ticker,
      amount,
      quantity,
      totalAmount: amount * quantity,
      exDate: formData.exDate,
      payDate: formData.payDate || formData.exDate,
      type: formData.type,
      account: formData.account || "Conta Principal",
    };

    try {
      if (editingDividend) {
        // Atualizar dividendo existente no storage
        storage.updateDividend(editingDividend.id, dividendData);
        toast.success("Dividendo atualizado com sucesso!");
      } else {
        // Verificar se é um investimento do novo contexto
        const contextInvestment = investments.find(
          (inv) => inv.symbol === formData.ticker,
        );

        if (contextInvestment) {
          // Usar a nova função do contexto
          await executeDividendOperation({
            investmentId: contextInvestment.id,
            dividendType: formData.type as any,
            valuePerShare: amount,
            exDividendDate: formData.exDate,
            paymentDate: formData.payDate || formData.exDate,
            quantity,
          });
          toast.success("Dividendo adicionado com sucesso!");
        } else {
          // Usar storage antigo para investimentos legados
          storage.saveDividend(dividendData);
          toast.success("Dividendo adicionado com sucesso!");
        }
      }

      setFormData({
        ticker: ticker || "",
        amount: "",
        quantity: "",
        exDate: "",
        payDate: "",
        type: "dividend",
        account: "",
      });
      setEditingDividend(null);
      setShowAddModal(false);
      loadData();
    } catch (error) {
      logComponents.error("Error saving dividend:", error);
      toast.error("Erro ao salvar dividendo");
    }
  };

  const handleEdit = (dividend: Dividend) => {
    setEditingDividend(dividend);
    setFormData({
      ticker: dividend.ticker,
      amount: dividend.amount.toString(),
      quantity: dividend.quantity.toString(),
      exDate: dividend.exDate,
      payDate: dividend.payDate,
      type: dividend.type,
      account: dividend.account,
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este dividendo?")) {
      storage.deleteDividend(id);
      toast.success("Dividendo excluído com sucesso!");
      loadData();
    }
  };

  const totalDividends = dividends.reduce(
    (sum, div) => sum + div.totalAmount,
    0,
  );
  const currentYear = new Date().getFullYear();
  const currentYearDividends = dividends
    .filter((div) => new Date(div.payDate).getFullYear() === currentYear)
    .reduce((sum, div) => sum + div.totalAmount, 0);

  const getDividendTypeLabel = (type: Dividend["type"]) => {
    switch (type) {
      case "dividend":
        return "Dividendo";
      case "jscp":
        return "JCP";
      case "bonus":
        return "Bonificação";
      case "split":
        return "Desdobramento";
      default:
        return type;
    }
  };

  const getDividendTypeBadge = (type: Dividend["type"]) => {
    switch (type) {
      case "dividend":
        return "default";
      case "jscp":
        return "secondary";
      case "bonus":
        return "outline";
      case "split":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            {ticker ? `Dividendos - ${ticker}` : "Gerenciar Dividendos"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Recebido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R${" "}
                  {totalDividends.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Todos os períodos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Recebido em {currentYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  R${" "}
                  {currentYearDividends.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Ano atual</p>
              </CardContent>
            </Card>
          </div>

          {/* Add Dividend Button */}
          <div className="flex justify-end">
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Dividendo
            </Button>
          </div>

          {/* Dividends Table */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Dividendos</CardTitle>
            </CardHeader>
            <CardContent>
              {dividends.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum dividendo registrado
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor/Cota</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Data Ex</TableHead>
                      <TableHead>Data Pagto</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dividends
                      .sort(
                        (a, b) =>
                          new Date(b.payDate).getTime() -
                          new Date(a.payDate).getTime(),
                      )
                      .map((dividend) => (
                        <TableRow key={dividend.id}>
                          <TableCell className="font-medium">
                            {dividend.ticker}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                getDividendTypeBadge(dividend.type) as any
                              }
                            >
                              {getDividendTypeLabel(dividend.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>R$ {dividend.amount.toFixed(4)}</TableCell>
                          <TableCell>{dividend.quantity}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            R${" "}
                            {dividend.totalAmount.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            {new Date(dividend.exDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(dividend.payDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(dividend)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(dividend.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Dividend Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingDividend ? "Editar Dividendo" : "Adicionar Dividendo"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="ticker">Ticker *</Label>
                <Select
                  value={formData.ticker}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ticker: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ticker" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTickers().map((tickerOption) => (
                      <SelectItem key={tickerOption} value={tickerOption}>
                        {tickerOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      type: value as Dividend["type"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dividend">Dividendo</SelectItem>
                    <SelectItem value="jscp">JCP</SelectItem>
                    <SelectItem value="bonus">Bonificação</SelectItem>
                    <SelectItem value="split">Desdobramento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Valor por Cota *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exDate">Data Ex *</Label>
                  <DatePicker
                    id="exDate"
                    value={formData.exDate}
                    onChange={(value) =>
                      setFormData({ ...formData, exDate: value })
                    }
                    placeholder="Selecionar data ex"
                    maxDate={new Date()}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="payDate">Data Pagamento</Label>
                  <DatePicker
                    id="payDate"
                    value={formData.payDate}
                    onChange={(value) =>
                      setFormData({ ...formData, payDate: value })
                    }
                    placeholder="Selecionar data pagamento"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="account">Conta</Label>
                <Select
                  value={formData.account}
                  onValueChange={(value) =>
                    setFormData({ ...formData, account: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableAccounts().map((accountOption) => (
                      <SelectItem key={accountOption} value={accountOption}>
                        {accountOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingDividend ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
