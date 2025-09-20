"use client";

import React, { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import {
  Calculator,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle,
  Info,
  Edit2,
  Save,
  X,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface InvestmentOption {
  id: string;
  name: string;
  type:
    | "cdb"
    | "lci"
    | "lca"
    | "tesouro_selic"
    | "tesouro_ipca"
    | "tesouro_prefixado"
    | "poupanca"
    | "fundo_di"
    | "acoes";
  rate: number; // Taxa anual
  taxable: boolean; // Se é tributável pelo IR
  minAmount: number;
  riskLevel: "baixo" | "medio" | "alto";
  liquidity: "diaria" | "mensal" | "vencimento";
  description: string;
}

const defaultInvestments: InvestmentOption[] = [
  {
    id: "cdb_100_cdi",
    name: "CDB 100% CDI",
    type: "cdb",
    rate: 13.75, // 100% do CDI atual
    taxable: true,
    minAmount: 1000,
    riskLevel: "baixo",
    liquidity: "diaria",
    description: "CDB com rentabilidade de 100% do CDI, tributável pelo IR",
  },
  {
    id: "cdb_110_cdi",
    name: "CDB 110% CDI",
    type: "cdb",
    rate: 15.13, // 110% do CDI atual
    taxable: true,
    minAmount: 5000,
    riskLevel: "baixo",
    liquidity: "vencimento",
    description: "CDB com rentabilidade de 110% do CDI, tributável pelo IR",
  },
  {
    id: "lci_90_cdi",
    name: "LCI 90% CDI",
    type: "lci",
    rate: 12.38, // 90% do CDI atual
    taxable: false,
    minAmount: 10000,
    riskLevel: "baixo",
    liquidity: "vencimento",
    description: "LCI com rentabilidade de 90% do CDI, isenta de IR",
  },
  {
    id: "lca_85_cdi",
    name: "LCA 85% CDI",
    type: "lca",
    rate: 11.69, // 85% do CDI atual
    taxable: false,
    minAmount: 15000,
    riskLevel: "baixo",
    liquidity: "vencimento",
    description: "LCA com rentabilidade de 85% do CDI, isenta de IR",
  },
  {
    id: "tesouro_selic",
    name: "Tesouro Selic",
    type: "tesouro_selic",
    rate: 13.75,
    taxable: true,
    minAmount: 100,
    riskLevel: "baixo",
    liquidity: "diaria",
    description: "Tesouro Direto atrelado à taxa Selic",
  },
  {
    id: "tesouro_ipca",
    name: "Tesouro IPCA+ 2029",
    type: "tesouro_ipca",
    rate: 6.5, // IPCA + 6.5% ao ano
    taxable: true,
    minAmount: 100,
    riskLevel: "medio",
    liquidity: "vencimento",
    description: "Tesouro Direto com proteção contra inflação",
  },
  {
    id: "poupanca",
    name: "Poupança",
    type: "poupanca",
    rate: 8.5, // 70% da Selic quando > 8.5%
    taxable: false,
    minAmount: 0,
    riskLevel: "baixo",
    liquidity: "diaria",
    description: "Caderneta de poupança tradicional",
  },
];

const IRTax = {
  "0-180": 0.225, // 22.5%
  "181-360": 0.2, // 20%
  "361-720": 0.175, // 17.5%
  "721+": 0.15, // 15%
};

function calculateIRTax(days: number): number {
  if (days <= 180) return IRTax["0-180"];
  if (days <= 360) return IRTax["181-360"];
  if (days <= 720) return IRTax["361-720"];
  return IRTax["721+"];
}

function calculateInvestmentReturn(
  principal: number,
  annualRate: number,
  months: number,
  taxable: boolean,
) {
  const monthlyRate = annualRate / 100 / 12;
  const grossAmount = principal * Math.pow(1 + monthlyRate, months);
  const grossReturn = grossAmount - principal;

  let netAmount = grossAmount;
  let netReturn = grossReturn;
  let taxAmount = 0;

  if (taxable) {
    const days = months * 30;
    const taxRate = calculateIRTax(days);
    taxAmount = grossReturn * taxRate;
    netAmount = grossAmount - taxAmount;
    netReturn = grossReturn - taxAmount;
  }

  return {
    grossAmount,
    grossReturn,
    netAmount,
    netReturn,
    taxAmount,
    effectiveRate: (netAmount / principal - 1) * 100,
  };
}

export function InvestmentCalculator() {
  const [principal, setPrincipal] = useState<string>("10000");
  const [months, setMonths] = useState<string>("12");
  const [selectedInvestments, setSelectedInvestments] = useState<string[]>([
    "cdb_100_cdi",
    "lci_90_cdi",
    "poupanca",
  ]);
  const [customInvestments, setCustomInvestments] = useState<
    InvestmentOption[]
  >([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editableInvestments, setEditableInvestments] =
    useState<InvestmentOption[]>(defaultInvestments);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Custom investment form
  const [customName, setCustomName] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [customTaxable, setCustomTaxable] = useState("true");
  const [customType, setCustomType] = useState<InvestmentOption["type"]>("cdb");

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editTaxable, setEditTaxable] = useState("true");

  const allInvestments = [...editableInvestments, ...customInvestments];

  const calculations = useMemo(() => {
    const principalNum = parseFloat(principal) || 0;
    const monthsNum = parseInt(months) || 0;

    return selectedInvestments
      .map((id) => {
        const investment = allInvestments.find((inv) => inv.id === id);
        if (!investment) return null;

        const result = calculateInvestmentReturn(
          principalNum,
          investment.rate,
          monthsNum,
          investment.taxable,
        );

        return {
          investment,
          ...result,
        };
      })
      .filter(Boolean);
  }, [principal, months, selectedInvestments, allInvestments]);

  const chartData = useMemo(() => {
    const principalNum = parseFloat(principal) || 0;
    const monthsNum = parseInt(months) || 0;

    const data = [];
    for (let month = 0; month <= monthsNum; month++) {
      const point: any = { month };

      selectedInvestments.forEach((id) => {
        const investment = allInvestments.find((inv) => inv.id === id);
        if (investment) {
          const result = calculateInvestmentReturn(
            principalNum,
            investment.rate,
            month,
            investment.taxable,
          );
          point[investment.name] = result.netAmount;
        }
      });

      data.push(point);
    }

    return data;
  }, [principal, months, selectedInvestments, allInvestments]);

  const addCustomInvestment = () => {
    if (!customName || !customRate) return;

    const newInvestment: InvestmentOption = {
      id: `custom_${Date.now()}`,
      name: customName,
      type: customType,
      rate: parseFloat(customRate),
      taxable: customTaxable === "true",
      minAmount: 0,
      riskLevel: "medio",
      liquidity: "vencimento",
      description: `Investimento personalizado: ${customName}`,
    };

    setCustomInvestments([...customInvestments, newInvestment]);
    setSelectedInvestments([...selectedInvestments, newInvestment.id]);

    // Reset form
    setCustomName("");
    setCustomRate("");
    setShowCustomForm(false);
  };

  const startEditing = (investment: InvestmentOption) => {
    setEditingId(investment.id);
    setEditName(investment.name);
    setEditRate(investment.rate.toString());
    setEditTaxable(investment.taxable.toString());
  };

  const saveEdit = () => {
    if (!editingId || !editName || !editRate) return;

    const updatedInvestments = editableInvestments.map((inv) =>
      inv.id === editingId
        ? {
            ...inv,
            name: editName,
            rate: parseFloat(editRate),
            taxable: editTaxable === "true",
            description: `${editName} - Taxa: ${editRate}% ao ano`,
          }
        : inv,
    );

    setEditableInvestments(updatedInvestments);
    setEditingId(null);
    setEditName("");
    setEditRate("");
    setEditTaxable("true");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditRate("");
    setEditTaxable("true");
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "baixo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medio":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "alto":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getLiquidityColor = (liquidity: string) => {
    switch (liquidity) {
      case "diaria":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "mensal":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "vencimento":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Calculadora de Investimentos</h2>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator">Calculadora</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Parâmetros do Investimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="principal">Valor a Investir (R$)</Label>
                  <Input
                    id="principal"
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    placeholder="10000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="months">Período (meses)</Label>
                  <Input
                    id="months"
                    type="number"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    placeholder="12"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Investimentos para Comparar</Label>
                  <div className="space-y-3">
                    {allInvestments.map((investment) => {
                      const isEditing = editingId === investment.id;
                      const isCustom = investment.id.startsWith("custom_");

                      return (
                        <div
                          key={investment.id}
                          className="border rounded-lg p-3 space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={investment.id}
                              checked={selectedInvestments.includes(
                                investment.id,
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedInvestments([
                                    ...selectedInvestments,
                                    investment.id,
                                  ]);
                                } else {
                                  setSelectedInvestments(
                                    selectedInvestments.filter(
                                      (id) => id !== investment.id,
                                    ),
                                  );
                                }
                              }}
                              className="rounded"
                            />

                            {isEditing ? (
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Nome do investimento"
                                  className="text-sm"
                                />
                                <Input
                                  type="number"
                                  value={editRate}
                                  onChange={(e) => setEditRate(e.target.value)}
                                  placeholder="Taxa (%)"
                                  className="text-sm"
                                />
                              </div>
                            ) : (
                              <div className="flex-1">
                                <label
                                  htmlFor={investment.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {investment.name} - {investment.rate}%
                                </label>
                              </div>
                            )}

                            <Badge
                              className={getRiskColor(investment.riskLevel)}
                            >
                              {investment.riskLevel}
                            </Badge>

                            {!isCustom && (
                              <div className="flex items-center space-x-1">
                                {isEditing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={saveEdit}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={cancelEdit}
                                      className="h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditing(investment)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {isEditing && (
                            <div className="flex items-center space-x-2">
                              <Label className="text-xs">Tributação:</Label>
                              <Select
                                value={editTaxable}
                                onValueChange={setEditTaxable}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">
                                    Tributável (IR)
                                  </SelectItem>
                                  <SelectItem value="false">
                                    Isento de IR
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowCustomForm(!showCustomForm)}
                  className="w-full"
                >
                  {showCustomForm
                    ? "Cancelar"
                    : "Adicionar Investimento Personalizado"}
                </Button>

                {showCustomForm && (
                  <Card className="p-4 space-y-3">
                    <Input
                      placeholder="Nome do investimento"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Taxa anual (%)"
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                    />
                    <Select
                      value={customTaxable}
                      onValueChange={setCustomTaxable}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Tributável (IR)</SelectItem>
                        <SelectItem value="false">Isento de IR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addCustomInvestment} className="w-full">
                      Adicionar
                    </Button>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Results Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Resumo dos Resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {calculations.length > 0 ? (
                  <div className="space-y-4">
                    {calculations.map((calc, index) => (
                      <div
                        key={calc.investment.id}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">
                            {calc.investment.name}
                          </h4>
                          <div className="flex gap-1">
                            <Badge
                              className={getRiskColor(
                                calc.investment.riskLevel,
                              )}
                            >
                              {calc.investment.riskLevel}
                            </Badge>
                            <Badge
                              className={getLiquidityColor(
                                calc.investment.liquidity,
                              )}
                            >
                              {calc.investment.liquidity}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Valor Final</p>
                            <p className="font-semibold text-green-600">
                              {calc.netAmount.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rendimento</p>
                            <p className="font-semibold">
                              {calc.netReturn.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Taxa Efetiva
                            </p>
                            <p className="font-semibold">
                              {calc.effectiveRate.toFixed(2)}%
                            </p>
                          </div>
                          {calc.taxAmount > 0 && (
                            <div>
                              <p className="text-muted-foreground">
                                IR Descontado
                              </p>
                              <p className="font-semibold text-red-600">
                                {calc.taxAmount.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione investimentos para ver os resultados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Evolução dos Investimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(value) =>
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(value)
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(value),
                        "Valor",
                      ]}
                      labelFormatter={(label) => `Mês ${label}`}
                    />
                    <Legend />
                    {selectedInvestments.map((id, index) => {
                      const investment = allInvestments.find(
                        (inv) => inv.id === id,
                      );
                      if (!investment) return null;

                      const colors = [
                        "#8884d8",
                        "#82ca9d",
                        "#ffc658",
                        "#ff7300",
                        "#00ff00",
                        "#ff00ff",
                      ];
                      return (
                        <Line
                          key={id}
                          type="monotone"
                          dataKey={investment.name}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione investimentos para ver o gráfico</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Análise de Tributação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Tabela Regressiva do IR</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Até 180 dias:</span>
                      <span className="font-semibold">22,5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>181 a 360 dias:</span>
                      <span className="font-semibold">20,0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>361 a 720 dias:</span>
                      <span className="font-semibold">17,5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Acima de 720 dias:</span>
                      <span className="font-semibold">15,0%</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold">Investimentos Isentos</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• LCI (Letra de Crédito Imobiliário)</p>
                    <p>• LCA (Letra de Crédito do Agronegócio)</p>
                    <p>• Poupança</p>
                    <p>• CRI/CRA (até R$ 300.000/ano)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Dicas de Investimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold">Diversifique</p>
                      <p className="text-muted-foreground">
                        Não coloque todos os recursos em um único investimento
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold">Considere o prazo</p>
                      <p className="text-muted-foreground">
                        Investimentos mais longos geralmente oferecem melhores
                        taxas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold">Avalie a liquidez</p>
                      <p className="text-muted-foreground">
                        Mantenha parte dos recursos em investimentos com
                        liquidez diária
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold">Compare após impostos</p>
                      <p className="text-muted-foreground">
                        Sempre considere o rendimento líquido na comparação
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
