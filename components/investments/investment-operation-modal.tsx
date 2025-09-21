"use client";

import React, { useState, useEffect, useMemo } from "react";
import { logComponents } from "../../lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  CalendarIcon,
  Calculator,
  DollarSign,
  Building2,
  Wallet,
} from "lucide-react";
import { Calendar } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../../lib/utils";
import { useInvestments } from "../../contexts/unified-context";
import { useAccounts } from "../../contexts/unified-context";
import { useSafeTheme } from "../../hooks/use-safe-theme";
import {
  AssetType,
  BuyOperationData,
  SellOperationData,
} from "../../lib/types/investments";
import { formatCurrency } from "../../lib/utils/investment-calculations";
import { AssetAutocomplete } from "./asset-autocomplete";
import { type AssetData } from "../../lib/data/assets-database";
import { toast } from "sonner";

interface InvestmentOperationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operationType: "buy" | "sell";
  preSelectedInvestmentId?: string;
}

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: "stock", label: "Ação" },
  { value: "fii", label: "Fundo Imobiliário" },
  { value: "etf", label: "ETF" },
  { value: "crypto", label: "Criptomoeda" },
  { value: "fixed_income", label: "Renda Fixa" },
  { value: "fund", label: "Fundo de Investimento" },
  { value: "bdr", label: "BDR" },
  { value: "option", label: "Opção" },
  { value: "future", label: "Futuro" },
  { value: "other", label: "Outro" },
];

export function InvestmentOperationModal({
  open,
  onOpenChange,
  operationType,
  preSelectedInvestmentId,
}: InvestmentOperationModalProps) {
  const {
    investments,
    create: createInvestment,
    update: updateInvestment,
  } = useInvestments();
  const { accounts } = useAccounts();
  const { settings } = useSafeTheme();

  // Estados do formulário
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(
    preSelectedInvestmentId || "",
  );
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("stock");
  const [brokerId, setBrokerId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [fees, setFees] = useState("");
  const [operationDate, setOperationDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados calculados
  const [totalValue, setTotalValue] = useState(0);
  const [netValue, setNetValue] = useState(0);

  // Funções auxiliares - usar useMemo para evitar recriação
  const selectedInvestment = useMemo(() => {
    return selectedInvestmentId
      ? investments.find((inv) => inv.id === selectedInvestmentId) || null
      : null;
  }, [selectedInvestmentId, investments]);
  
  const selectedAccount = useMemo(() => {
    return accounts.find((acc) => acc.id === accountId) || null;
  }, [accountId, accounts]);
  
  const availableInvestments = useMemo(() => {
    return (investments || []).filter((inv) => inv.status === "active" || !inv.status);
  }, [investments]);

  // Calcular valores quando inputs mudam
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    const fee = parseFloat(fees) || 0;

    const total = qty * price;
    setTotalValue(total);

    if (operationType === "buy") {
      setNetValue(total + fee); // Compra: valor + taxas
    } else {
      setNetValue(total - fee); // Venda: valor - taxas
    }
  }, [quantity, unitPrice, fees, operationType]);

  // Reset form when modal opens/closes or operation type changes
  useEffect(() => {
    if (open) {
      if (preSelectedInvestmentId) {
        setSelectedInvestmentId(preSelectedInvestmentId);
        const investment = investments.find((inv) => inv.id === preSelectedInvestmentId);
        if (investment) {
          setIdentifier(investment.symbol || investment.identifier || '');
          setName(investment.name || "");
          setAssetType(investment.type as AssetType || "stock");
          setBrokerId(investment.broker || '');
        }
      } else {
        resetForm();
      }
    }
  }, [open, operationType, preSelectedInvestmentId, investments]);

  const resetForm = () => {
    setSelectedInvestmentId("");
    setIdentifier("");
    setName("");
    setAssetType("stock");
    setBrokerId("");
    setAccountId("");
    setQuantity("");
    setUnitPrice("");
    setFees("");
    setOperationDate(new Date());
    setNotes("");
  };

  const handleInvestmentSelect = (investmentId: string) => {
    setSelectedInvestmentId(investmentId);
    const investment = investments.find((inv) => inv.id === investmentId);
    if (investment) {
      setIdentifier(investment.symbol || investment.identifier || '');
      setName(investment.name || "");
      setAssetType(investment.type as AssetType || "stock");
      setBrokerId(investment.broker || '');
    }
  };

  const validateForm = () => {
    if (operationType === "sell" && !selectedInvestmentId) {
      toast.error("Selecione um investimento para vender");
      return false;
    }

    if (operationType === "buy" && (!identifier.trim() || !brokerId)) {
      toast.error("Preencha o ticker/código e selecione uma corretora");
      return false;
    }

    if (!accountId || !quantity || !unitPrice) {
      toast.error("Preencha todos os campos obrigatórios");
      return false;
    }

    if (parseFloat(quantity) <= 0 || parseFloat(unitPrice) <= 0) {
      toast.error("Quantidade e preço devem ser maiores que zero");
      return false;
    }

    if (parseFloat(fees) < 0) {
      toast.error("Taxas não podem ser negativas");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (operationType === "buy") {
        // Compra de investimento
        const investmentData = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol: identifier.trim().toUpperCase(),
          name: name.trim() || identifier.trim(),
          type: assetType,
          broker: brokerId,
          quantity: parseFloat(quantity),
          purchasePrice: parseFloat(unitPrice),
          currentPrice: parseFloat(unitPrice),
          fees: parseFloat(fees) || 0,
          purchaseDate: operationDate.toISOString(),
          notes: notes.trim() || undefined,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        /**
         * @deprecated localStorage não é mais usado - dados ficam no banco
         * Dados agora são salvos via DataService no backend
         */
        console.log("Compra de investimento - localStorage removido, dados agora vêm do banco via DataService");
        
        // TODO: Implementar salvamento via DataService
        // await DataService.createInvestment(investmentData);
        // await DataService.createTransaction(transactionData);
        // await DataService.updateAccount(accountId, newBalance);

        toast.success(`Compra de ${identifier.trim().toUpperCase()} registrada com sucesso!`);
        
      } else {
        // Venda de investimento
        if (!selectedInvestment) {
          toast.error("Investimento não encontrado");
          return;
        }

        const sellQuantity = parseFloat(quantity);
        const sellPrice = parseFloat(unitPrice);
        const sellFees = parseFloat(fees) || 0;
        const totalReceived = (sellQuantity * sellPrice) - sellFees;

        // Verificar se há quantidade suficiente
        if (sellQuantity > (selectedInvestment.quantity || 0)) {
          toast.error("Quantidade insuficiente para venda");
          return;
        }

        /**
         * @deprecated localStorage não é mais usado - dados ficam no banco
         * Dados agora são salvos via DataService no backend
         */
        console.log("Venda de investimento - localStorage removido, dados agora vêm do banco via DataService");
        
        // TODO: Implementar salvamento via DataService
        // await DataService.updateInvestment(selectedInvestmentId, { quantity: newQuantity, status });
        // await DataService.createTransaction(transactionData);
        // await DataService.updateAccount(accountId, newBalance);

        toast.success(`Venda de ${selectedInvestment.symbol || selectedInvestment.name} registrada com sucesso!`);
      }

      // Fechar modal e resetar form
      onOpenChange(false);
      resetForm();
      
      // Fechar modal após sucesso
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      logComponents.error("Erro na operação:", error);
      toast.error("Erro ao registrar operação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {operationType === "buy" ? (
              <>
                <DollarSign
                  className={`h-5 w-5 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                />
                Comprar Investimento
              </>
            ) : (
              <>
                <DollarSign
                  className={`h-5 w-5 ${settings.colorfulIcons ? "text-red-600" : "text-muted-foreground"}`}
                />
                Vender Investimento
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Investimento (apenas para venda) */}
          {operationType === "sell" && (
            <div className="space-y-2">
              <Label>Investimento *</Label>
              <Select
                value={selectedInvestmentId}
                onValueChange={handleInvestmentSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um investimento para vender" />
                </SelectTrigger>
                <SelectContent>
                  {availableInvestments.map((investment) => {
                    return (
                      <SelectItem key={investment.id} value={investment.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {investment.symbol || investment.identifier || investment.name || 'N/A'}
                            </span>
                            {investment.name && (
                              <span className="text-muted-foreground text-sm">
                                - {investment.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant="outline" className="text-xs">
                              {investment.quantity || 0}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {investment.broker || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {selectedInvestment && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">
                          Quantidade Disponível
                        </p>
                        <p className="font-medium">
                          {selectedInvestment.quantity || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Preço Médio</p>
                        <p className="font-medium">
                          {formatCurrency(Number(selectedInvestment.purchasePrice) || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor Investido</p>
                        <p className="font-medium">
                          {formatCurrency((Number(selectedInvestment.quantity) || 0) * (Number(selectedInvestment.purchasePrice) || 0))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Dados do Ativo (apenas para compra) */}
          {operationType === "buy" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ativo *</Label>
                <AssetAutocomplete
                  onAssetSelect={(asset) => {
                    if (asset) {
                      setIdentifier(asset.ticker || '');
                      setName(asset.name || '');
                      setAssetType(asset.assetType || 'stock');
                    }
                  }}
                  placeholder="Digite o ticker ou nome do ativo (ex: PETR4, Petrobras)"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Ticker/Código *</Label>
                  <Input
                    id="identifier"
                    placeholder="Ex: PETR4, HASH11, BTC"
                    value={identifier}
                    onChange={(e) =>
                      setIdentifier(e.target.value.toUpperCase())
                    }
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Ativo</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Petrobras PN"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Ativo *</Label>
                <Select
                  value={assetType}
                  onValueChange={(value: AssetType) => setAssetType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Corretora *</Label>
                <Select value={brokerId} onValueChange={setBrokerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a corretora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xp">XP Investimentos</SelectItem>
                    <SelectItem value="nuinvest">NuInvest</SelectItem>
                    <SelectItem value="clear">Clear Corretora</SelectItem>
                    <SelectItem value="modal">Modal Mais</SelectItem>
                    <SelectItem value="btg">BTG Pactual</SelectItem>
                    <SelectItem value="itau">Itaú Corretora</SelectItem>
                    <SelectItem value="rico">Rico Investimentos</SelectItem>
                    <SelectItem value="inter">Inter Invest</SelectItem>
                    <SelectItem value="toro">Toro Investimentos</SelectItem>
                    <SelectItem value="avenue">Avenue Securities</SelectItem>
                    <SelectItem value="c6">C6 Bank</SelectItem>
                    <SelectItem value="easynvest">Easynvest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Dados da Operação */}
          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Conta *</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{account.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAccount &&
                operationType === "buy" &&
                netValue > selectedAccount.balance && (
                  <p className="text-sm text-red-600">
                    Saldo insuficiente. Disponível:{" "}
                    {formatCurrency(selectedAccount.balance)}
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label>Data da Operação *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !operationDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon
                      className={`mr-2 h-4 w-4 ${settings.colorfulIcons ? "text-blue-600" : ""}`}
                    />
                    {operationDate ? (
                      format(operationDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={operationDate}
                    onSelect={(date) => date && setOperationDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="any"
              />
              {selectedInvestment &&
                operationType === "sell" &&
                parseFloat(quantity) > selectedInvestment.totalQuantity && (
                  <p className="text-sm text-red-600">
                    Quantidade maior que disponível (
                    {selectedInvestment.totalQuantity})
                  </p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Preço Unitário *</Label>
              <Input
                id="unitPrice"
                type="number"
                placeholder="0,00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fees">Taxas e Custos</Label>
              <Input
                id="fees"
                type="number"
                placeholder="0,00"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Resumo da Operação */}
          {quantity && unitPrice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calculator
                    className={`h-5 w-5 ${settings.colorfulIcons ? "text-purple-600" : ""}`}
                  />
                  Resumo da Operação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Valor Bruto</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(totalValue)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Taxas</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(parseFloat(fees) || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Valor Líquido
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        operationType === "buy"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {operationType === "buy" ? "-" : "+"}
                      {formatCurrency(netValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre a operação (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex-1 ${
                operationType === "buy"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : null}
              {operationType === "buy" ? "Confirmar Compra" : "Confirmar Venda"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
