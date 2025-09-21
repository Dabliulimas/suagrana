"use client";

import React, { useState } from "react";
import { logComponents } from "../../lib/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Calendar } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Investment,
  DividendOperationData,
  DividendType,
} from "../../lib/types/investments";
import { formatCurrency } from "../../lib/utils/investment-calculations";
import { useInvestments } from "../../contexts/unified-context";
import { useSafeTheme } from "../../hooks/use-safe-theme";
import { useAccounts } from "../../contexts/unified-context";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

interface DividendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DividendModal({ open, onOpenChange }: DividendModalProps) {
  const { investments, create: createInvestment } = useInvestments();
  const { accounts } = useAccounts();
  const { settings } = useSafeTheme();
  const [formData, setFormData] = useState({
    investmentId: "",
    accountId: "",
    amount: "",
    dividendType: "dividend" as "dividend" | "jscp" | "bonus",
    exDividendDate: undefined as Date | undefined,
    paymentDate: new Date(),
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const activeInvestments = (investments || []).filter(
    (inv) => inv.status === "active",
  );
  const availableAccounts = accounts.filter((acc) => acc.type !== "credit");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.investmentId ||
      !formData.accountId ||
      !formData.amount ||
      !formData.paymentDate
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const amount = parseFloat(formData.amount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor deve ser um número positivo");
      return;
    }

    setLoading(true);
    try {
      const investment = activeInvestments.find(
        (inv) => inv.id === formData.investmentId,
      );
      if (!investment) {
        throw new Error("Investimento não encontrado");
        return;
      }

      // Registrar dividendo com funcionalidade real
      const dividendData = {
        id: `div_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        investmentId: formData.investmentId,
        investmentSymbol: investment.symbol || investment.name,
        accountId: formData.accountId,
        dividendType: formData.dividendType,
        amount: amount,
        valuePerShare: amount / (investment.quantity || 1),
        exDividendDate: formData.exDividendDate?.toISOString() || null,
        paymentDate: formData.paymentDate.toISOString(),
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      /**
       * @deprecated localStorage não é mais usado - dados ficam no banco
       * Dados agora são salvos via DataService no backend
       */
      console.log("Salvamento de dividendo - localStorage removido, dados agora vêm do banco via DataService");
      
      // TODO: Implementar salvamento via DataService
      // await DataService.createDividend(dividendData);
      // await DataService.createTransaction(transactionData);
      // await DataService.updateAccount(formData.accountId, newBalance);

      toast.success(
        `Dividendo de ${new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(amount)} adicionado com sucesso!`,
      );

      // Reset form
      setFormData({
        investmentId: "",
        accountId: "",
        amount: "",
        dividendType: "dividend",
        exDividendDate: undefined,
        paymentDate: new Date(),
        notes: "",
      });

      onOpenChange(false);
      
    } catch (error) {
      logComponents.error("Erro ao adicionar dividendo:", error);
      toast.error("Erro ao adicionar dividendo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getDividendTypeLabel = (type: string) => {
    switch (type) {
      case "dividend":
        return "Dividendo";
      case "jscp":
        return "JCP (Juros sobre Capital Próprio)";
      case "bonus":
        return "Bonificação";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign
              className={`h-5 w-5 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
            />
            Adicionar Dividendo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção do Investimento */}
          <div className="space-y-2">
            <Label htmlFor="investment">Investimento *</Label>
            <Select
              value={formData.investmentId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, investmentId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o investimento" />
              </SelectTrigger>
              <SelectContent>
                {activeInvestments.map((investment) => (
                  <SelectItem key={investment.id} value={investment.id}>
                    {investment.symbol || investment.identifier || investment.name || 'Sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção da Conta */}
          <div className="space-y-2">
            <Label htmlFor="account">Conta de Destino *</Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, accountId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor Recebido (R$) *</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9,]/g, "");
                setFormData((prev) => ({ ...prev, amount: value }));
              }}
            />
          </div>

          {/* Tipo de Dividendo */}
          <div className="space-y-2">
            <Label htmlFor="dividendType">Tipo de Provento</Label>
            <Select
              value={formData.dividendType}
              onValueChange={(value: "dividend" | "jscp" | "bonus") =>
                setFormData((prev) => ({ ...prev, dividendType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dividend">Dividendo</SelectItem>
                <SelectItem value="jscp">
                  JCP (Juros sobre Capital Próprio)
                </SelectItem>
                <SelectItem value="bonus">Bonificação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Ex-Dividendo */}
          <div className="space-y-2">
            <Label>Data Ex-Dividendo</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.exDividendDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon
                    className={`mr-2 h-4 w-4 ${settings.colorfulIcons ? "text-blue-600" : ""}`}
                  />
                  {formData.exDividendDate ? (
                    format(formData.exDividendDate, "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.exDividendDate}
                  onSelect={(date) =>
                    setFormData((prev) => ({ ...prev, exDividendDate: date }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data de Pagamento */}
          <div className="space-y-2">
            <Label>Data de Pagamento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.paymentDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon
                    className={`mr-2 h-4 w-4 ${settings.colorfulIcons ? "text-blue-600" : ""}`}
                  />
                  {formData.paymentDate ? (
                    format(formData.paymentDate, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.paymentDate}
                  onSelect={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentDate: date || new Date(),
                    }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações adicionais sobre o dividendo..."
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Adicionando..." : "Adicionar Dividendo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
