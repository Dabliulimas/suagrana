"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
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
} from "../lib/financial/financial-intelligence";
import { useRouter } from "next/navigation";
import { useSafeTheme } from "../hooks/use-safe-theme";

interface IntelligentDashboardProps {
  className?: string;
}

const getAlertIcon = (type: FinancialAlert["type"], colorfulIcons: boolean) => {
  const getIconClass = (baseClass: string, colorClass: string) =>
    colorfulIcons
      ? `${baseClass} ${colorClass}`
      : `${baseClass} text-muted-foreground`;

  switch (type) {
    case "critical":
      return <XCircle className={getIconClass("h-4 w-4", "text-red-600")} />;
    case "warning":
      return (
        <AlertTriangle className={getIconClass("h-4 w-4", "text-yellow-600")} />
      );
    case "info":
      return <Info className={getIconClass("h-4 w-4", "text-blue-600")} />;
    case "success":
      return (
        <CheckCircle className={getIconClass("h-4 w-4", "text-green-600")} />
      );
    default:
      return <Info className={getIconClass("h-4 w-4", "text-blue-600")} />;
  }
};

const getAlertVariant = (type: FinancialAlert["type"]) => {
  switch (type) {
    case "critical":
      return "destructive";
    case "warning":
      return "default";
    case "info":
      return "secondary";
    case "success":
      return "default";
    default:
      return "default";
  }
};

const getInsightIcon = (
  type: FinancialInsight["type"],
  colorfulIcons: boolean,
) => {
  const getIconClass = (baseClass: string, colorClass: string) =>
    colorfulIcons
      ? `${baseClass} ${colorClass}`
      : `${baseClass} text-muted-foreground`;

  switch (type) {
    case "trend":
      return (
        <TrendingUp className={getIconClass("h-4 w-4", "text-green-600")} />
      );
    case "pattern":
      return <BarChart3 className={getIconClass("h-4 w-4", "text-blue-600")} />;
    case "prediction":
      return <Brain className={getIconClass("h-4 w-4", "text-purple-600")} />;
    case "recommendation":
      return (
        <Lightbulb className={getIconClass("h-4 w-4", "text-yellow-600")} />
      );
    default:
      return <Info className={getIconClass("h-4 w-4", "text-blue-600")} />;
  }
};

const getCategoryIcon = (
  category: SmartRecommendation["category"],
  colorfulIcons: boolean,
) => {
  const getIconClass = (baseClass: string, colorClass: string) =>
    colorfulIcons
      ? `${baseClass} ${colorClass}`
      : `${baseClass} text-muted-foreground`;

  switch (category) {
    case "savings":
      return (
        <PiggyBank className={getIconClass("h-4 w-4", "text-green-600")} />
      );
    case "investment":
      return (
        <TrendingUp className={getIconClass("h-4 w-4", "text-blue-600")} />
      );
    case "budget":
      return (
        <BarChart3 className={getIconClass("h-4 w-4", "text-purple-600")} />
      );
    case "debt":
      return <Shield className={getIconClass("h-4 w-4", "text-red-600")} />;
    case "goal":
      return <Target className={getIconClass("h-4 w-4", "text-orange-600")} />;
    default:
      return (
        <Lightbulb className={getIconClass("h-4 w-4", "text-yellow-600")} />
      );
  }
};

const getDifficultyColor = (difficulty: SmartRecommendation["difficulty"]) => {
  switch (difficulty) {
    case "easy":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "hard":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
};

const getTimeframeColor = (timeframe: SmartRecommendation["timeframe"]) => {
  switch (timeframe) {
    case "immediate":
      return "bg-red-100 text-red-800";
    case "short_term":
      return "bg-orange-100 text-orange-800";
    case "medium_term":
      return "bg-blue-100 text-blue-800";
    case "long_term":
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
  if (score >= 60) return "Boa";
  if (score >= 40) return "Regular";
  return "Precisa Melhorar";
};

export function IntelligentFinancialDashboard({
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
  const { colorfulIcons } = useSafeTheme();

  useEffect(() => {
    loadFinancialIntelligence();
  }, []);

  const loadFinancialIntelligence = async () => {
    try {
      setLoading(true);
      const analysis = await financialIntelligence.analyzeFinancialHealth();
      setAlerts(
        analysis.alerts.filter((alert) => !dismissedAlerts.has(alert.id)),
      );
      setInsights(analysis.insights);
      setRecommendations(analysis.recommendations);
      setHealthScore(analysis.healthScore);
    } catch (error) {
      logComponents.error("Erro ao carregar inteligência financeira:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  const handleAlertAction = (alert: FinancialAlert) => {
    if (alert.action?.href) {
      router.push(alert.action.href);
    } else if (alert.action?.callback) {
      alert.action.callback();
    }
  };

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
          {(alerts || []).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tudo em Ordem!</h3>
                <p className="text-muted-foreground text-center">
                  Não há alertas financeiros no momento. Continue mantendo suas
                  finanças organizadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {(alerts || []).map((alert) => (
                  <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type, colorfulIcons)}
                        <div className="flex-1">
                          <AlertTitle className="flex items-center gap-2">
                            {alert.title}
                            <Badge variant="outline" className="text-xs">
                              {alert.category}
                            </Badge>
                          </AlertTitle>
                          <AlertDescription className="mt-1">
                            {alert.message}
                          </AlertDescription>
                          {alert.actionable && alert.action && (
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAlertAction(alert)}
                                className="flex items-center gap-2"
                              >
                                {alert.action.label}
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => dismissAlert(alert.id)}
                              >
                                Dispensar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
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
                <h3 className="text-lg font-semibold mb-2">
                  Analisando Padrões
                </h3>
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
                          {getInsightIcon(insight.type, colorfulIcons)}
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
                  Suas finanças estão bem organizadas. Continue assim!
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {(recommendations || []).map((rec) => (
                  <Card key={rec.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(rec.category, colorfulIcons)}
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
                            <Clock className="h-3 w-3 mr-1" />
                            {rec.timeframe === "immediate"
                              ? "Imediato"
                              : rec.timeframe === "short_term"
                                ? "Curto prazo"
                                : rec.timeframe === "medium_term"
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

                      {(rec.potentialSavings || rec.potentialGains) && (
                        <div className="bg-green-50 p-3 rounded-lg mb-3">
                          <div className="text-sm font-medium text-green-800">
                            Potencial de economia: R${" "}
                            {(
                              rec.potentialSavings ||
                              rec.potentialGains ||
                              0
                            ).toFixed(2)}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">
                          Passos recomendados:
                        </h4>
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
