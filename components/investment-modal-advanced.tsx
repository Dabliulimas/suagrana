"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../lib/utils/logger";
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
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { DatePicker } from "./ui/date-picker";
import { TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { type Investment } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { brapiService } from "../lib/brapi-service";
import { storage } from "../lib/storage/storage";
import { toast } from "sonner";

interface InvestmentModalAdvancedProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  investment?: Investment | null;
}

export function InvestmentModal({
  open,
  onClose,
  onSave,
  investment,
}: InvestmentModalAdvancedProps) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
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
  const [searchingTicker, setSearchingTicker] = useState(false);
  const [tickerSuggestions, setTickerSuggestions] = useState<any[]>([]);
  const [existingPosition, setExistingPosition] = useState<any>(null);

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

  useEffect(() => {
    if (formData.ticker && formData.ticker.length >= 3) {
      checkExistingPosition();
    }
  }, [formData.ticker]);

  const checkExistingPosition = () => {
    const investments = storage.getInvestments();
    const existing = investments.filter(
      (inv) => inv.ticker === formData.ticker.toUpperCase(),
    );

    if (existing.length > 0) {
      // Calcular posição atual
      let totalQuantity = 0;
      let totalInvested = 0;

      existing.forEach((inv) => {
        if (inv.operation === "buy") {
          totalQuantity += inv.quantity;
          totalInvested += inv.totalValue;
        } else {
          totalQuantity -= inv.quantity;
          const sellRatio = inv.quantity / (totalQuantity + inv.quantity);
          totalInvested -= totalInvested * sellRatio;
        }
      });

      if (totalQuantity > 0) {
        const averagePrice = totalInvested / totalQuantity;
        setExistingPosition({
          quantity: totalQuantity,
          averagePrice,
          totalInvested,
          name: existing[0].name,
        });
      } else {
        setExistingPosition(null);
      }
    } else {
      setExistingPosition(null);
    }
  };

  const searchTicker = async (ticker: string) => {
    if (ticker.length < 2) {
      setTickerSuggestions([]);
      return;
    }

    setSearchingTicker(true);
    try {
      const results = await brapiService.searchStock(ticker);
      setTickerSuggestions(results ? [results] : []); // searchStock returns single result
    } catch (error) {
      console.warn("Erro ao buscar ticker:", error);
      setTickerSuggestions([]);
    } finally {
      setSearchingTicker(false);
    }
  };

  const selectTicker = async (tickerData: any) => {
    setFormData({
      ...formData,
      ticker: tickerData.stock,
      name: tickerData.name,
      type: tickerData.type === "stock" ? "Ações" : "FII",
    });
    setTickerSuggestions([]);

    // Buscar cotação atual
    try {
      const quote = await brapiService.searchStock(tickerData.stock);
      if (quote) {
        setFormData((prev) => ({
          ...prev,
          price: quote.toString(),
        }));
      }
    } catch (error) {
      console.warn("Erro ao buscar cotação:", error);
    }
  };

  const calculateNewAverage = () => {
    if (!existingPosition || !formData.quantity || !formData.price) return null;

    const newQuantity = Number.parseFloat(formData.quantity);
    const newPrice = Number.parseFloat(formData.price);
    const fees = Number.parseFloat(formData.fees) || 0;

    if (formData.operation === "buy") {
      const newTotalQuantity = existingPosition.quantity + newQuantity;
      const newTotalInvested =
        existingPosition.totalInvested + newQuantity * newPrice + fees;
      const newAveragePrice = newTotalInvested / newTotalQuantity;

      return {
        newAveragePrice,
        newTotalQuantity,
        newTotalInvested,
      };
    } else if (formData.operation === "sell") {
      const newTotalQuantity = existingPosition.quantity - newQuantity;
      if (newTotalQuantity < 0) return null;

      const sellValue = newQuantity * newPrice - fees;
      const sellRatio = newQuantity / existingPosition.quantity;
      const newTotalInvested = existingPosition.totalInvested * (1 - sellRatio);
      const newAveragePrice =
        newTotalQuantity > 0 ? newTotalInvested / newTotalQuantity : 0;

      return {
        newAveragePrice,
        newTotalQuantity,
        newTotalInvested,
        sellValue,
      };
    }

    return null;
  };

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

      // Validar venda
      if (
        formData.operation === "sell" &&
        existingPosition &&
        quantity > existingPosition.quantity
      ) {
        toast.error(
          `Quantidade insuficiente. Você possui ${existingPosition.quantity} unidades`,
        );
        return;
      }

      const totalValue =
        quantity * price + (formData.operation === "buy" ? fees : -fees);

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
        storage.updateInvestment(investment.id, investmentData);
        toast.success("Operação atualizada com sucesso!");
      } else {
        storage.saveInvestment(investmentData);
        toast.success(
          `${formData.operation === "buy" ? "Compra" : "Venda"} registrada com sucesso!`,
        );
      }

      onSave();
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar operação");
    } finally {
      setIsLoading(false);
    }
  };

  const totalValue =
    formData.quantity && formData.price
      ? Number.parseFloat(formData.quantity) *
          Number.parseFloat(formData.price) +
        (formData.operation === "buy"
          ? Number.parseFloat(formData.fees) || 0
          : -(Number.parseFloat(formData.fees) || 0))
      : 0;

  const newAverageData = calculateNewAverage();

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
  ];
  const accounts = [
    "Conta Corrente",
    "Poupança",
    "Corretora XP",
    "Corretora Rico",
    "Corretora Clear",
    "Inter Invest",
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.operation === "buy" ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            {investment ? "Editar" : "Nova"}{" "}
            {formData.operation === "buy" ? "Compra" : "Venda"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operation Type */}
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
                  <SelectItem value="buy">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      Compra
                    </div>
                  </SelectItem>
                  <SelectItem value="sell">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      Venda
                    </div>
                  </SelectItem>
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

          {/* Ticker Search */}
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker/Código</Label>
            <div className="relative">
              <Input
                id="ticker"
                placeholder="Ex: PETR4, HASH11..."
                value={formData.ticker}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setFormData({ ...formData, ticker: value });
                  searchTicker(value);
                }}
              />
              {searchingTicker && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Ticker Suggestions */}
            {tickerSuggestions.length > 0 && (
              <div className="border rounded-md bg-white shadow-lg max-h-40 overflow-y-auto">
                {tickerSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                    onClick={() => selectTicker(suggestion)}
                  >
                    <div className="font-medium">{suggestion.stock}</div>
                    <div className="text-sm text-gray-600">
                      {suggestion.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Asset Name */}
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

          {/* Existing Position Info */}
          {existingPosition && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Posição Atual</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Quantidade</p>
                  <p className="font-medium">
                    {existingPosition.quantity.toLocaleString("pt-BR", {
                      maximumFractionDigits: 6,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Preço Médio</p>
                  <p className="font-medium">
                    R$ {existingPosition.averagePrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Total Investido</p>
                  <p className="font-medium">
                    R$ {existingPosition.totalInvested.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantity, Price, Fees */}
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
              {formData.operation === "sell" && existingPosition && (
                <p className="text-xs text-gray-500 mt-1">
                  Disponível:{" "}
                  {existingPosition.quantity.toLocaleString("pt-BR", {
                    maximumFractionDigits: 6,
                  })}
                </p>
              )}
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

          {/* Account and Date */}
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

          {/* New Average Calculation */}
          {newAverageData && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-green-900">
                  {formData.operation === "buy"
                    ? "Nova Média de Preço"
                    : "Resultado da Venda"}
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {formData.operation === "buy" ? (
                  <>
                    <div>
                      <p className="text-green-700">Nova Quantidade</p>
                      <p className="font-medium">
                        {newAverageData.newTotalQuantity.toLocaleString(
                          "pt-BR",
                          { maximumFractionDigits: 6 },
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-700">Novo Preço Médio</p>
                      <p className="font-medium">
                        R$ {newAverageData.newAveragePrice.toFixed(2)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-green-700">Quantidade Restante</p>
                      <p className="font-medium">
                        {newAverageData.newTotalQuantity.toLocaleString(
                          "pt-BR",
                          { maximumFractionDigits: 6 },
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-green-700">Valor da Venda</p>
                      <p className="font-medium">
                        R${" "}
                        {newAverageData.sellValue?.toLocaleString("pt-BR") ||
                          "0"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Total Value */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Valor Total:</span>
              <span
                className={`text-lg font-bold ${formData.operation === "buy" ? "text-red-600" : "text-green-600"}`}
              >
                {formData.operation === "buy" ? "-" : "+"}R${" "}
                {Math.abs(totalValue).toFixed(2)}
              </span>
            </div>
            {formData.fees && Number.parseFloat(formData.fees) > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {formData.operation === "buy" ? "Incluindo" : "Descontando"} R${" "}
                {Number.parseFloat(formData.fees).toFixed(2)} em taxas
              </p>
            )}
          </div>

          {/* Notes */}
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

          {/* Submit Buttons */}
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
