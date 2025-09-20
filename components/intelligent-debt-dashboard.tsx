"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  Target,
  Lightbulb,
  CreditCard,
  PieChart,
  Clock,
  Percent,
} from "lucide-react";
import { useDebtAnalysis } from "../hooks/use-debt-analysis";
import { DebtNotificationSystem } from "./debt-notification-system";
import { toast } from "sonner";

interface IntelligentDebtDashboardProps {
  className?: string;
}

const riskLevelConfig = {
  low: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    label: "Baixo Risco",
    description: "Sua situação de dívidas está controlada",
  },
  medium: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    label: "Risco Moderado",
    description: "Atenção necessária para algumas dívidas",
  },
  high: {
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
    label: "Alto Risco",
    description: "Situação requer ação imediata",
  },
  critical: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertTriangle,
    label: "Risco Crítico",
    description: "Situação financeira comprometida",
  },
};

const alertTypeConfig = {
  overdue: {
    icon: Calendar,
    color: "border-red-500 bg-red-50",
  },
  high_interest: {
    icon: Percent,
    color: "border-orange-500 bg-orange-50",
  },
  payment_opportunity: {
    icon: Target,
    color: "border-blue-500 bg-blue-50",
  },
  cash_flow_risk: {
    icon: TrendingDown,
    color: "border-red-500 bg-red-50",
  },
  negotiation_suggestion: {
    icon: Lightbulb,
    color: "border-green-500 bg-green-50",
  },
};

const suggestionTypeConfig = {
  extra_payment: {
    icon: DollarSign,
    color: "text-green-600",
  },
  debt_consolidation: {
    icon: PieChart,
    color: "text-blue-600",
  },
  avalanche: {
    icon: TrendingUp,
    color: "text-purple-600",
  },
  snowball: {
    icon: Target,
    color: "text-indigo-600",
  },
  negotiation: {
    icon: Lightbulb,
    color: "text-orange-600",
  },
};

export function IntelligentDebtDashboard({
  className,
}: IntelligentDebtDashboardProps) {
  const { analysis, isLoading, debts } = useDebtAnalysis();

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">Erro ao carregar análise de dívidas</p>
      </div>
    );
  }

  const riskConfig = riskLevelConfig[analysis.riskLevel];
  const RiskIcon = riskConfig.icon;

  const handleSuggestionAction = (suggestion: any) => {
    toast.info(`Implementando sugestão: ${suggestion.title}`);
    // Aqui você pode implementar a lógica específica para cada tipo de sugestão
  };

  const handleAlertAction = (alert: any) => {
    if (alert.suggestedAction) {
      toast.info(alert.suggestedAction);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Notification System */}
      <DebtNotificationSystem />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Análise Inteligente de Dívidas
          </h2>
          <p className="text-gray-600 mt-1">
            Insights baseados em sua situação financeira atual
          </p>
        </div>
        <Badge className={`${riskConfig.color} px-3 py-1`}>
          <RiskIcon className="w-4 h-4 mr-1" />
          {riskConfig.label}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-red-500" />
              Total de Dívidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R${" "}
              {analysis.totalDebt.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {debts.filter((d) => d.status === "active").length} dívidas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-blue-500" />
              Pagamentos Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R${" "}
              {analysis.monthlyPayments.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {analysis.debtToIncomeRatio.toFixed(1)}% da renda mensal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Percent className="w-4 h-4 mr-2 text-orange-500" />
              Taxa Média de Juros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analysis.averageInterestRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">ao mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="w-4 h-4 mr-2 text-green-500" />
              Capacidade de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R${" "}
              {analysis.paymentCapacity.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">disponível mensalmente</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card className={`border-2 ${riskConfig.color.split(" ")[2]}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RiskIcon className="w-5 h-5 mr-2" />
            Avaliação de Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {riskConfig.description}
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Comprometimento da Renda</span>
                    <span>{analysis.debtToIncomeRatio.toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={Math.min(analysis.debtToIncomeRatio, 100)}
                    className="h-2"
                  />
                </div>
              </div>
            </div>

            {analysis.payoffTime > 0 && (
              <div className="text-sm text-gray-600">
                <strong>Tempo estimado para quitação:</strong>{" "}
                {Math.ceil(analysis.payoffTime)} meses
                <br />
                <strong>Custo total de juros:</strong> R${" "}
                {analysis.totalInterestCost.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {analysis.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Alertas Importantes ({analysis.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.alerts.slice(0, 5).map((alert) => {
                const alertConfig = alertTypeConfig[alert.type];
                const AlertIcon = alertConfig.icon;

                return (
                  <Alert
                    key={alert.id}
                    className={`${alertConfig.color} border-l-4`}
                  >
                    <AlertIcon className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {alert.message}
                          </p>
                          {alert.suggestedAction && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              Sugestão: {alert.suggestedAction}
                            </p>
                          )}
                        </div>
                        {alert.actionable && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAlertAction(alert)}
                            className="ml-2 shrink-0"
                          >
                            Ação
                          </Button>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              Sugestões Inteligentes ({analysis.suggestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.suggestions.slice(0, 3).map((suggestion) => {
                const suggestionConfig = suggestionTypeConfig[suggestion.type];
                const SuggestionIcon = suggestionConfig.icon;

                return (
                  <div
                    key={suggestion.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <SuggestionIcon
                            className={`w-5 h-5 mr-2 ${suggestionConfig.color}`}
                          />
                          <h4 className="font-medium">{suggestion.title}</h4>
                          {suggestion.feasible && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Viável
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {suggestion.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                          {suggestion.potentialSavings > 0 && (
                            <div>
                              <span className="text-gray-500">
                                Economia Potencial:
                              </span>
                              <p className="font-medium text-green-600">
                                R${" "}
                                {suggestion.potentialSavings.toLocaleString(
                                  "pt-BR",
                                  { minimumFractionDigits: 2 },
                                )}
                              </p>
                            </div>
                          )}
                          {suggestion.timeReduction > 0 && (
                            <div>
                              <span className="text-gray-500">
                                Redução de Tempo:
                              </span>
                              <p className="font-medium text-blue-600">
                                {suggestion.timeReduction.toFixed(1)} meses
                              </p>
                            </div>
                          )}
                          {suggestion.requiredAmount > 0 && (
                            <div>
                              <span className="text-gray-500">
                                Valor Necessário:
                              </span>
                              <p className="font-medium text-orange-600">
                                R${" "}
                                {suggestion.requiredAmount.toLocaleString(
                                  "pt-BR",
                                  { minimumFractionDigits: 2 },
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSuggestionAction(suggestion)}
                        className="ml-4 shrink-0"
                        disabled={!suggestion.feasible}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {debts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Parabéns!
            </h3>
            <p className="text-gray-600">
              Você não possui dívidas registradas no momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
