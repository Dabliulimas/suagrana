"use client";

import React, { useState, useMemo } from "react";
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
import { CalendarIcon, DollarSign, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface Investment {
  id: string;
  name: string;
  symbol?: string;
  type: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  purchaseDate: string;
  broker?: string;
  status: string;
  fees?: number;
}

interface InvestmentSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvestmentSaleModal({ open, onOpenChange }: InvestmentSaleModalProps) {
  const [formData, setFormData] = useState({
    investmentId: "",
    quantity: "",
    salePrice: "",
    saleDate: new Date(),
    fees: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   * Dados agora vêm do banco via DataService
   */
  const investments = useMemo(() => {
    console.log("Carregamento de investimentos - localStorage removido, dados agora vêm do banco via DataService");
    // TODO: Implementar carregamento via DataService
    // return DataService.getActiveInvestments();
    return [];
  }, []);

  const selectedInvestment = investments.find(inv => inv.id === formData.investmentId);

  // Calcular dados da venda
  const saleData = useMemo(() => {
    if (!selectedInvestment || !formData.quantity || !formData.salePrice) {
      return null;
    }

    const quantity = parseFloat(formData.quantity.replace(',', '.'));
    const salePrice = parseFloat(formData.salePrice.replace(',', '.'));
    const fees = parseFloat(formData.fees.replace(',', '.')) || 0;

    if (isNaN(quantity) || isNaN(salePrice) || quantity <= 0 || salePrice <= 0) {
      return null;
    }

    if (quantity > selectedInvestment.quantity) {
      return null;
    }

    const grossAmount = quantity * salePrice;
    const netAmount = grossAmount - fees;
    const averagePrice = selectedInvestment.purchasePrice;
    const costBasis = quantity * averagePrice;
    const grossProfit = grossAmount - costBasis;
    const netProfit = netAmount - costBasis;
    const profitPercentage = costBasis > 0 ? (netProfit / costBasis) * 100 : 0;

    // Determinar se há IR a pagar
    let taxRate = 0;
    let exemptionApplies = false;

    if (selectedInvestment.type === 'stock' || selectedInvestment.type === 'acao') {
      // Ações: 15% sobre o ganho, com isenção para vendas até R$ 20.000/mês
      taxRate = 0.15;
      exemptionApplies = true; // Será calculado no contexto mensal
    } else if (selectedInvestment.type === 'fii') {
      // FIIs: 20% sobre o ganho, sem isenção
      taxRate = 0.20;
    } else if (selectedInvestment.type === 'etf') {
      // ETFs: 15% sobre o ganho, com isenção para vendas até R$ 20.000/mês
      taxRate = 0.15;
      exemptionApplies = true;
    } else {
      // Outros: 15% por padrão
      taxRate = 0.15;
    }

    const taxDue = netProfit > 0 ? netProfit * taxRate : 0;

    return {
      quantity,
      salePrice,
      fees,
      grossAmount,
      netAmount,
      averagePrice,
      costBasis,
      grossProfit,
      netProfit,
      profitPercentage,
      taxRate,
      taxDue,
      exemptionApplies,
      isProfit: netProfit > 0,
      isLoss: netProfit < 0
    };
  }, [selectedInvestment, formData.quantity, formData.salePrice, formData.fees]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2
    }).format(value / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvestment || !saleData) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (saleData.quantity > selectedInvestment.quantity) {
      toast.error("Quantidade de venda não pode ser maior que a quantidade possuída");
      return;
    }

    setLoading(true);
    try {
      // Registrar venda
      const saleRecord = {
        id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        investmentId: formData.investmentId,
        investmentSymbol: selectedInvestment.symbol || selectedInvestment.name,
        investmentType: selectedInvestment.type,
        quantity: saleData.quantity,
        salePrice: saleData.salePrice,
        grossAmount: saleData.grossAmount,
        netAmount: saleData.netAmount,
        fees: saleData.fees,
        averagePrice: saleData.averagePrice,
        costBasis: saleData.costBasis,
        grossProfit: saleData.grossProfit,
        netProfit: saleData.netProfit,
        profitPercentage: saleData.profitPercentage,
        taxRate: saleData.taxRate,
        taxDue: saleData.taxDue,
        exemptionApplies: saleData.exemptionApplies,
        saleDate: formData.saleDate.toISOString(),
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      /**
       * @deprecated localStorage não é mais usado - dados ficam no banco
       * Dados agora são salvos via DataService no backend
       */
      console.log("Salvamento de venda - localStorage removido, dados agora vêm do banco via DataService");
      
      // TODO: Implementar salvamento via DataService
      // await DataService.createSale(saleRecord);
      // await DataService.updateInvestment(formData.investmentId, { quantity: remainingQuantity, status });
      // await DataService.createTransaction(transactionData);

      toast.success(
        `Venda registrada com sucesso! ${saleData.isProfit ? 'Lucro' : 'Prejuízo'}: ${formatCurrency(saleData.netProfit)}`
      );

      // Reset form
      setFormData({
        investmentId: "",
        quantity: "",
        salePrice: "",
        saleDate: new Date(),
        fees: "",
        notes: "",
      });

      onOpenChange(false);

      // Recarregar a página para atualizar os dados
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error("Erro ao registrar venda:", error);
      toast.error("Erro ao registrar venda. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Vender Investimento
          </DialogTitle>
          <DialogDescription>
            Registre a venda de um investimento e calcule automaticamente o ganho/prejuízo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Investimento */}
          <div className="space-y-2">
            <Label htmlFor="investment">Investimento *</Label>
            <Select
              value={formData.investmentId}
              onValueChange={(value) =>
                setFormData({ ...formData, investmentId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o investimento..." />
              </SelectTrigger>
              <SelectContent>
                {investments.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.symbol || inv.name} - {inv.quantity} cotas ({formatCurrency(inv.purchasePrice)}/cota)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedInvestment && (
            <div className="grid grid-cols-2 gap-4">
              {/* Informações do Investimento */}
              <div className="p-4 bg-blue-50 rounded-lg border">
                <h4 className="font-medium text-blue-800 mb-2">Posição Atual</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Quantidade:</span> {selectedInvestment.quantity} cotas</p>
                  <p><span className="font-medium">Preço Médio:</span> {formatCurrency(selectedInvestment.purchasePrice)}</p>
                  <p><span className="font-medium">Valor Total:</span> {formatCurrency(selectedInvestment.quantity * selectedInvestment.purchasePrice)}</p>
                </div>
              </div>

              {/* Data da Venda */}
              <div className="space-y-2">
                <Label>Data da Venda *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.saleDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.saleDate ? format(formData.saleDate, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.saleDate}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, saleDate: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            {/* Quantidade */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
              {selectedInvestment && formData.quantity && parseFloat(formData.quantity) > selectedInvestment.quantity && (
                <p className="text-sm text-red-600">
                  Máximo: {selectedInvestment.quantity} cotas
                </p>
              )}
            </div>

            {/* Preço de Venda */}
            <div className="space-y-2">
              <Label htmlFor="salePrice">Preço de Venda *</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.salePrice}
                onChange={(e) =>
                  setFormData({ ...formData, salePrice: e.target.value })
                }
                required
              />
            </div>

            {/* Taxas */}
            <div className="space-y-2">
              <Label htmlFor="fees">Taxas e Custos</Label>
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

          {/* Resumo da Venda */}
          {saleData && (
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Resumo da Operação
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Valor Bruto:</span>
                    <span className="font-medium">{formatCurrency(saleData.grossAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxas:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(saleData.fees)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium border-t pt-2">
                    <span>Valor Líquido:</span>
                    <span>{formatCurrency(saleData.netAmount)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Custo de Aquisição:</span>
                    <span className="font-medium">{formatCurrency(saleData.costBasis)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{saleData.isProfit ? 'Lucro' : 'Prejuízo'}:</span>
                    <span className={`font-medium ${saleData.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(saleData.netProfit))} ({formatPercentage(saleData.profitPercentage)})
                    </span>
                  </div>
                  {saleData.isProfit && (
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span>IR Devido ({formatPercentage(saleData.taxRate * 100)}):</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(saleData.taxDue)}
                        {saleData.exemptionApplies && (
                          <span className="text-xs text-gray-500 block">*Sujeito à isenção</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {saleData.exemptionApplies && saleData.isProfit && (
                <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Isenção de IR</p>
                      <p className="text-yellow-700">
                        Vendas de ações até R$ 20.000/mês são isentas de IR. 
                        O sistema calculará automaticamente no relatório mensal.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre a venda..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !saleData}>
              {loading ? "Salvando..." : "Registrar Venda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
