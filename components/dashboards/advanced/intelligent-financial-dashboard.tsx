"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../../../lib/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { Progress } from "../../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { ScrollArea } from "../../ui/scroll-area";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  CheckCircle,
  XCircle,
  Info,
  Brain,
  Zap,
  Shield,
  PiggyBank,
  BarChart3,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  financialIntelligence,
  type FinancialAlert,
  type FinancialInsight,
  type SmartRecommendation,
} from "../../../lib/financial/financial-intelligence";
import { useRouter } from "next/navigation";

interface IntelligentDashboardProps {
  className?: string;
}

const getAlertIcon = (type: FinancialAlert["type"]) => {
  switch (type) {
    case "critical":
      return <XCircle className="h-4 w-4" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4" />;
    case "info":
      return <Info className="h-4 w-4" />;
    case "success":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getAlertVariant = (type: FinancialAlert["type"]) => {
  switch (type) {
    case "critical":
      return "destructive";
    case "warning":
      return "default";
    case "info":
      return "default";
    case "success":
      return "default";
    default:
      return "default";
  }
};

const getInsightIcon = (type: FinancialInsight["type"]) => {
  switch (type) {
    case "trend":
      return <TrendingUp className="h-4 w-4" />;
    case "pattern":
      return <BarChart3 className="h-4 w-4" />;
    case "opportunity":
      return <Target className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getCategoryIcon = (category: SmartRecommendation["category"]) => {
  switch (category) {
    case "savings":
      return <PiggyBank className="h-4 w-4" />;
    case "investment":
      return <TrendingUp className="h-4 w-4" />;
    case "budget":
      return <Target className="h-4 w-4" />;
    case "debt":
      return <Shield className="h-4 w-4" />;
    default:
      return <Lightbulb className="h-4 w-4" />;
  }
};

const getDifficultyColor = (difficulty: SmartRecommendation["difficulty"]) => {
  switch (difficulty) {
    case "easy":
      return "bg-green-100 text-green-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "hard":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTimeframeColor = (timeframe: SmartRecommendation["timeframe"]) => {
  switch (timeframe) {
    case "immediate":
      return "bg-red-100 text-red-800";
    case "short":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-blue-100 text-blue-800";
    case "long":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getHealthScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
};

const getHealthScoreLabel = (score: number) => {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Regular";
  return "Precisa Melhorar";
};

export default function IntelligentFinancialDashboard({
  className,
}: IntelligentDashboardProps) {
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>(
    [],
  );
  const [healthScore, setHealthScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(),
  );
  const router = useRouter();

  useEffect(() => {
    loadFinancialIntelligence();
  }, []);

  const loadFinancialIntelligence = async () => {
    try {
      setLoading(true);
      const intelligence = await financialIntelligence.generateIntelligence();

      setAlerts(intelligence.alerts || []);
      setInsights(intelligence.insights || []);
      setRecommendations(intelligence.recommendations || []);
      setHealthScore(intelligence.healthScore || 0);
    } catch (error) {
      logComponents.error("Erro ao carregar inteligência financeira:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  };

  const executeRecommendation = (recommendation: SmartRecommendation) => {
    // Implementar ação baseada na recomendação
    switch (recommendation.category) {
      case "budget":
        router.push("/budget");
        break;
      case "savings":
        router.push("/goals");
        break;
      case "investment":
        router.push("/investments");
        break;
      case "debt":
        router.push("/debts");
        break;
      default:
        break;
    }
  };

  const visibleAlerts = (alerts || []).filter(
    (alert) => !dismissedAlerts.has(alert.id),
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Inteligência Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.priority === "critical");
  const highAlerts = alerts.filter((a) => a.priority === "high");
  const mediumAlerts = alerts.filter((a) => a.priority === "medium");
  const positiveInsights = insights.filter((i) => i.impact === "positive");
  const neutralInsights = insights.filter((i) => i.impact === "neutral");
  const negativeInsights = insights.filter((i) => i.impact === "negative");

  return (
    <div className={className}>
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas ({(alerts || []).length})
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights ({(insights || []).length})
          </TabsTrigger>
          <TabsTrigger
            value="recommendations"
            className="flex items-center gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            Recomendações ({(recommendations || []).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Health Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Score de Saúde Financeira
                </div>
                <Badge className={getHealthScoreColor(healthScore)}>
                  {healthScore}/100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={healthScore} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  Status:{" "}
                  <span className={getHealthScoreColor(healthScore)}>
                    {getHealthScoreLabel(healthScore)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {visibleAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tudo Certo!</h3>
                <p className="text-muted-foreground text-center">
                  Não há alertas financeiros no momento. Continue monitorando
                  suas finanças.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {visibleAlerts.map((alert) => (
                  <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <AlertTitle className="text-sm font-medium">
                            {alert.title}
                          </AlertTitle>
                          <AlertDescription className="text-sm">
                            {alert.description}
                          </AlertDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {alert.priority === "critical"
                                ? "Crítico"
                                : alert.priority === "high"
                                  ? "Alto"
                                  : alert.priority === "medium"
                                    ? "Médio"
                                    : "Baixo"}
                            </Badge>
                            {alert.actionRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Ação Necessária
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {(insights || []).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sem Insights</h3>
                <p className="text-muted-foreground text-center">
                  Continue usando o sistema para gerar insights personalizados
                  sobre suas finanças.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {(insights || []).map((insight) => (
                  <Card key={insight.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          {getInsightIcon(insight.type)}
                          {insight.title}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              insight.impact === "positive"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              insight.impact === "positive"
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                          >
                            {insight.impact === "positive"
                              ? "Positivo"
                              : insight.impact === "negative"
                                ? "Atenção"
                                : "Neutro"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insight.confidence}% confiança
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {(recommendations || []).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Sem Recomendações
                </h3>
                <p className="text-muted-foreground text-center">
                  Adicione mais transações e metas para receber recomendações
                  personalizadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {(recommendations || []).map((rec) => (
                  <Card key={rec.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(rec.category)}
                          {rec.title}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getDifficultyColor(rec.difficulty)}>
                            {rec.difficulty === "easy"
                              ? "Fácil"
                              : rec.difficulty === "medium"
                                ? "Médio"
                                : "Difícil"}
                          </Badge>
                          <Badge className={getTimeframeColor(rec.timeframe)}>
                            {rec.timeframe === "immediate"
                              ? "Imediato"
                              : rec.timeframe === "short"
                                ? "Curto prazo"
                                : rec.timeframe === "medium"
                                  ? "Médio prazo"
                                  : "Longo prazo"}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {rec.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Impacto: {rec.impact}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {rec.confidence}% confiança
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => executeRecommendation(rec)}
                          className="flex items-center gap-1"
                        >
                          Aplicar
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                      {rec.steps && rec.steps.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Passos:
                          </p>
                          <ul className="space-y-1">
                            {rec.steps.map((step, index) => (
                              <li
                                key={index}
                                className="text-sm text-muted-foreground flex items-start gap-2"
                              >
                                <span className="text-primary font-medium">
                                  {index + 1}.
                                </span>
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
