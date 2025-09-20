"use client";

import { useState } from "react";
import { logComponents } from "../../lib/logger";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { TrendingUp, Calendar, DollarSign, Target } from "lucide-react";

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function InvestmentModal({
  isOpen,
  onClose,
  initialData,
}: InvestmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    type: initialData?.type || "stocks",
    amount: initialData?.amount || "",
    currentValue: initialData?.currentValue || "",
    purchaseDate:
      initialData?.purchaseDate || new Date().toISOString().split("T")[0],
    broker: initialData?.broker || "",
    notes: initialData?.notes || "",
  });

  const investmentTypes = [
    { value: "stocks", label: "Ações" },
    { value: "funds", label: "Fundos de Investimento" },
    { value: "bonds", label: "Títulos" },
    { value: "crypto", label: "Criptomoedas" },
    { value: "real_estate", label: "Fundos Imobiliários" },
    { value: "savings", label: "Poupança" },
    { value: "cdb", label: "CDB" },
    { value: "other", label: "Outros" },
  ];

  const brokers = [
    "XP Investimentos",
    "Rico",
    "Clear",
    "Inter",
    "Nubank",
    "BTG Pactual",
    "Itaú",
    "Bradesco",
    "Santander",
    "Outro",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular salvamento
  

      // Aqui você integraria com o sistema de dados real
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onClose();
      setFormData({
        name: "",
        type: "stocks",
        amount: "",
        currentValue: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        broker: "",
        notes: "",
      });
    } catch (error) {
      logComponents.error("Erro ao criar investimento:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReturn = () => {
    const purchase = parseFloat(formData.amount);
    const current = parseFloat(formData.currentValue);
    if (purchase && current) {
      const returnValue = current - purchase;
      const returnPercent = ((current - purchase) / purchase) * 100;
      return { value: returnValue, percent: returnPercent };
    }
    return null;
  };

  const returnData = calculateReturn();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Novo Investimento
          </DialogTitle>
          <DialogDescription>
            Adicione um novo investimento ao seu portfólio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Investimento */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Investimento</Label>
            <Input
              id="name"
              placeholder="Ex: PETR4, Tesouro Selic, Bitcoin"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          {/* Tipo de Investimento */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Investimento</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {investmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor Investido */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor Investido (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>

          {/* Valor Atual */}
          <div className="space-y-2">
            <Label htmlFor="currentValue">Valor Atual (R$)</Label>
            <Input
              id="currentValue"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.currentValue}
              onChange={(e) =>
                setFormData({ ...formData, currentValue: e.target.value })
              }
            />
          </div>

          {/* Retorno Calculado */}
          {returnData && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retorno:</span>
                <div className="text-right">
                  <div
                    className={`font-semibold ${returnData.value >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {returnData.value >= 0 ? "+" : ""}R${" "}
                    {Math.abs(returnData.value).toFixed(2)}
                  </div>
                  <div
                    className={`text-xs ${returnData.percent >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {returnData.percent >= 0 ? "+" : ""}
                    {returnData.percent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data de Compra */}
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Data de Compra</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) =>
                setFormData({ ...formData, purchaseDate: e.target.value })
              }
              required
            />
          </div>

          {/* Corretora */}
          <div className="space-y-2">
            <Label htmlFor="broker">Corretora</Label>
            <Select
              value={formData.broker}
              onValueChange={(value) =>
                setFormData({ ...formData, broker: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a corretora" />
              </SelectTrigger>
              <SelectContent>
                {brokers.map((broker) => (
                  <SelectItem key={broker} value={broker}>
                    {broker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Estratégia, objetivos, observações..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Investimento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
