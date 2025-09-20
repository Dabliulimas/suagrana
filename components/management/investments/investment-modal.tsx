"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { DatePicker } from "../../ui/date-picker";
import { TrendingUp, TrendingDown } from "lucide-react";
import { storage, type Investment } from "../../../lib/storage";
import { useInvestments } from "../../../contexts/unified-context";
import { toast } from "sonner";

interface InvestmentModalProps {
  onClose: () => void;
  onSave: () => void;
  investment?: Investment;
}

export function InvestmentModal({
  onClose,
  onSave,
  investment,
}: InvestmentModalProps) {
  const { create: createInvestment, update: updateInvestment } =
    useInvestments();
  const [formData, setFormData] = useState({
    operation: "buy" as "buy" | "sell",
    type: "",
    ticker: "",
    name: "",
    quantity: "",
    price: "",
    fees: "",
    account: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (investment) {
      setFormData({
        operation: investment.operation,
        type: investment.type,
        ticker: investment.ticker || "",
        name: investment.name,
        quantity: investment.quantity.toString(),
        price: investment.price.toString(),
        fees: investment.fees.toString(),
        account: investment.account,
        date: investment.date,
        notes: "",
      });
    }
  }, [investment]);

  const investmentTypes = [
    "Ações",
    "FIIs",
    "ETFs",
    "Criptomoedas",
    "Tesouro Direto",
    "CDB",
    "LCI/LCA",
    "Debêntures",
    "Fundos",
    "Outros",
  ];

  const accounts = [
    "Conta Corrente",
    "Poupança",
    "Corretora XP",
    "Corretora Rico",
    "Corretora Clear",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const quantity = Number.parseFloat(formData.quantity);
      const price = Number.parseFloat(formData.price);
      const fees = Number.parseFloat(formData.fees) || 0;

      if (isNaN(quantity) || quantity <= 0) {
        toast.error("Por favor, insira uma quantidade válida");
        return;
      }

      if (isNaN(price) || price <= 0) {
        toast.error("Por favor, insira um preço válido");
        return;
      }

      const totalValue = quantity * price + fees;

      const investmentData = {
        operation: formData.operation,
        type: formData.type as
          | "stock"
          | "fii"
          | "treasury"
          | "cdb"
          | "crypto"
          | "fund",
        ticker: formData.ticker.toUpperCase(),
        name: formData.name,
        quantity,
        price,
        totalValue,
        fees,
        account: formData.account,
        date: formData.date,
      };

      if (investment) {
        await updateInvestment(investment.id, investmentData);
        toast.success("Investimento atualizado com sucesso!");
      } else {
        await actions.addInvestment(investmentData);
        toast.success(
          `${formData.operation === "buy" ? "Compra" : "Venda"} registrada com sucesso!`,
        );
      }

      onSave();
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar investimento");
    } finally {
      setIsLoading(false);
    }
  };

  const totalValue =
    formData.quantity && formData.price
      ? (
          Number.parseFloat(formData.quantity) *
            Number.parseFloat(formData.price) +
          (Number.parseFloat(formData.fees) || 0)
        ).toFixed(2)
      : "0.00";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.operation === "buy" ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            {investment ? "Editar" : "Registrar"}{" "}
            {formData.operation === "buy" ? "Compra" : "Venda"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operation">Operação *</Label>
              <Select
                value={formData.operation}
                onValueChange={(value: "buy" | "sell") =>
                  setFormData({ ...formData, operation: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Compra</SelectItem>
                  <SelectItem value="sell">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {investmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ticker">Ticker/Código</Label>
              <Input
                id="ticker"
                placeholder="Ex: PETR4, HASH11..."
                value={formData.ticker}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ticker: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="name">Nome do Ativo *</Label>
              <Input
                id="name"
                placeholder="Ex: Petrobras, Bitcoin..."
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.000001"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="price">Preço Unitário *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="fees">Taxas</Label>
              <Input
                id="fees"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.fees}
                onChange={(e) =>
                  setFormData({ ...formData, fees: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="account">Conta/Corretora *</Label>
              <Select
                value={formData.account}
                onValueChange={(value) =>
                  setFormData({ ...formData, account: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account} value={account}>
                      {account}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Data *</Label>
              <DatePicker
                id="date"
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
                placeholder="Selecionar data"
                maxDate={new Date()}
                required
              />
            </div>
          </div>

          {/* Valor Total */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Valor Total:</span>
              <span className="text-lg font-bold text-blue-600">
                R$ {totalValue}
              </span>
            </div>
            {formData.fees && Number.parseFloat(formData.fees) > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Incluindo R$ {Number.parseFloat(formData.fees).toFixed(2)} em
                taxas
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre a operação..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className={
                formData.operation === "buy"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
              disabled={isLoading}
            >
              {isLoading
                ? "Salvando..."
                : `${investment ? "Atualizar" : "Registrar"} ${formData.operation === "buy" ? "Compra" : "Venda"}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
