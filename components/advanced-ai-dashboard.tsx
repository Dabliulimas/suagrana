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
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lightbulb,
  BarChart3,
  LineChart,
  Zap,
  Star,
  ThumbsUp,
  ThumbsDown,
  Settings,
  RefreshCw,
} from "lucide-react";
import {
  advancedAIEngine,
  type PredictiveAnalysis,
  type PersonalizedRecommendation,
  type FinancialBehaviorProfile,
} from "../lib/financial/advanced-ai-engine";
import { formatCurrency } from "../lib/utils";

interface AIInsight {
  id: string;
  type: "prediction" | "pattern" | "opportunity" | "risk";
  title: string;
  description: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  actionable: boolean;
}

interface RecommendationFeedback {
  recommendationId: string;
  action: "accepted" | "rejected" | "modified";
  feedback?: string;
}

export default function AdvancedAIDashboard() {
  const [predictions, setPredictions] = useState<PredictiveAnalysis | null>(
    null,
  );
  const [recommendations, setRecommendations] = useState<
    PersonalizedRecommendation[]
  >([]);
  const [userProfile, setUserProfile] =
    useState<FinancialBehaviorProfile | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("predictions");
  const [feedbackHistory, setFeedbackHistory] = useState<
    RecommendationFeedback[]
  >([]);

  useEffect(() => {
    initializeAI();
  }, []);

  const initializeAI = async () => {
    try {
      setLoading(true);
      await advancedAIEngine.initialize();
      await loadAIData();
    } catch (error) {
      logComponents.error("Erro ao inicializar IA:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIData = async () => {
    try {
      const [predictionsData, recommendationsData] = await Promise.all([
        advancedAIEngine.generateAdvancedPredictions(),
        advancedAIEngine.generatePersonalizedRecommendations(),
      ]);

      setPredictions(predictionsData);
      setRecommendations(recommendationsData);

      // Load user profile from localStorage
      const storedProfile = localStorage.getItem("sua-grana-ai-profile");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }

      // Generate insights from predictions
      generateInsights(predictionsData);

      // Load feedback history
      const storedFeedback = localStorage.getItem("sua-grana-ai-feedback");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (storedFeedback) {
        setFeedbackHistory(JSON.parse(storedFeedback));
      }
    } catch (error) {
      logComponents.error("Erro ao carregar dados da IA:", error);
    }
  };

  const generateInsights = (predictionsData: PredictiveAnalysis) => {
    const newInsights: AIInsight[] = [];

    // Cash flow insights
    if (predictionsData.cashFlowPrediction.nextMonth < 0) {
      newInsights.push({
        id: "negative-cashflow",
        type: "risk",
        title: "Fluxo de Caixa Negativo Previsto",
        description: `Previsão de déficit de ${formatCurrency(Math.abs(predictionsData.cashFlowPrediction.nextMonth))} no próximo mês`,
        confidence: predictionsData.cashFlowPrediction.confidence,
        impact: "high",
        actionable: true,
      });
    }

    // Spending anomalies
    if (predictionsData.spendingPatterns.anomalyDetection.length > 0) {
      const highestAnomaly =
        predictionsData.spendingPatterns.anomalyDetection[0];
      newInsights.push({
        id: "spending-anomaly",
        type: "pattern",
        title: "Padrão de Gasto Incomum Detectado",
        description: `Gasto anômalo de ${formatCurrency(highestAnomaly.amount)} em ${highestAnomaly.category}`,
        confidence: Math.min(95, highestAnomaly.anomalyScore),
        impact: "medium",
        actionable: true,
      });
    }

    // Goal achievement opportunities
    const highProbabilityGoals =
      predictionsData.goalAchievementProbability.filter(
        (g) => g.probability > 80,
      );
    if (highProbabilityGoals.length > 0) {
      newInsights.push({
        id: "goal-opportunity",
        type: "opportunity",
        title: "Metas com Alta Probabilidade de Sucesso",
        description: `${highProbabilityGoals.length} meta(s) com mais de 80% de chance de serem alcançadas`,
        confidence: 90,
        impact: "high",
        actionable: true,
      });
    }

    // Budget optimization opportunities
    if (predictionsData.budgetOptimization.potentialSavings > 0) {
      newInsights.push({
        id: "budget-optimization",
        type: "opportunity",
        title: "Oportunidade de Otimização de Orçamento",
        description: `Economia potencial de ${formatCurrency(predictionsData.budgetOptimization.potentialSavings)} identificada`,
        confidence: 85,
        impact: "medium",
        actionable: true,
      });
    }

    setInsights(newInsights);
  };

  const handleRecommendationFeedback = async (
    recommendationId: string,
    action: "accepted" | "rejected" | "modified",
    feedback?: string,
  ) => {
    const newFeedback: RecommendationFeedback = {
      recommendationId,
      action,
      feedback,
    };

    const updatedFeedback = [...feedbackHistory, newFeedback];
    setFeedbackHistory(updatedFeedback);
    localStorage.setItem(
      "sua-grana-ai-feedback",
      JSON.stringify(updatedFeedback),
    );

    // Update AI engine with feedback
    await advancedAIEngine.updateUserProfile([newFeedback]);

    // Remove recommendation from list if accepted
    if (action === "accepted") {
      setRecommendations((prev) =>
        prev.filter((r) => r.id !== recommendationId),
      );
    }
  };

  const refreshAIData = async () => {
    await loadAIData();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityBadgeColor = (priority: number) => {
    if (priority >= 80) return "bg-red-100 text-red-800";
    if (priority >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Analisando dados financeiros com IA...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Assistente Financeiro IA</h1>
            <p className="text-gray-600">
              Análises preditivas e recomendações personalizadas
            </p>
          </div>
        </div>
        <Button onClick={refreshAIData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* User Profile Summary */}
      {userProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Seu Perfil Financeiro</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Personalidade</div>
                <Badge variant="outline" className="mt-1">
                  {userProfile.spendingPersonality === "saver"
                    ? "Poupador"
                    : userProfile.spendingPersonality === "spender"
                      ? "Gastador"
                      : userProfile.spendingPersonality === "balanced"
                        ? "Equilibrado"
                        : userProfile.spendingPersonality === "impulsive"
                          ? "Impulsivo"
                          : "Estratégico"}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Tolerância ao Risco</div>
                <Badge variant="outline" className="mt-1">
                  {userProfile.riskTolerance === "conservative"
                    ? "Conservador"
                    : userProfile.riskTolerance === "moderate"
                      ? "Moderado"
                      : "Agressivo"}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Estágio de Vida</div>
                <Badge variant="outline" className="mt-1">
                  {userProfile.lifeStage === "student"
                    ? "Estudante"
                    : userProfile.lifeStage === "young_professional"
                      ? "Jovem Profissional"
                      : userProfile.lifeStage === "family"
                        ? "Família"
                        : userProfile.lifeStage === "pre_retirement"
                          ? "Pré-aposentadoria"
                          : "Aposentado"}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Conhecimento</div>
                <Badge variant="outline" className="mt-1">
                  {userProfile.financialKnowledge === "beginner"
                    ? "Iniciante"
                    : userProfile.financialKnowledge === "intermediate"
                      ? "Intermediário"
                      : "Avançado"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {(insights || []).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(insights || []).slice(0, 3).map((insight) => (
            <Alert
              key={insight.id}
              className={`border-l-4 ${
                insight.type === "risk"
                  ? "border-l-red-500"
                  : insight.type === "opportunity"
                    ? "border-l-green-500"
                    : insight.type === "prediction"
                      ? "border-l-blue-500"
                      : "border-l-yellow-500"
              }`}
            >
              <div className="flex items-start space-x-2">
                {insight.type === "risk" && (
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                )}
                {insight.type === "opportunity" && (
                  <Lightbulb className="h-4 w-4 text-green-500 mt-0.5" />
                )}
                {insight.type === "prediction" && (
                  <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                )}
                {insight.type === "pattern" && (
                  <BarChart3 className="h-4 w-4 text-yellow-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertTitle className="text-sm font-medium">
                    {insight.title}
                  </AlertTitle>
                  <AlertDescription className="text-xs mt-1">
                    {insight.description}
                  </AlertDescription>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}
                    >
                      {insight.confidence}% confiança
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getImpactColor(insight.impact)}`}
                    >
                      {insight.impact === "high"
                        ? "Alto impacto"
                        : insight.impact === "medium"
                          ? "Médio impacto"
                          : "Baixo impacto"}
                    </Badge>
                  </div>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="patterns">Padrões</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
        </TabsList>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {predictions && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cash Flow Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="h-5 w-5" />
                    <span>Previsão de Fluxo de Caixa</span>
                  </CardTitle>
                  <CardDescription>
                    Projeções baseadas em análise preditiva avançada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Próximo Mês</div>
                      <div
                        className={`text-lg font-bold ${
                          predictions.cashFlowPrediction.nextMonth >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(
                          predictions.cashFlowPrediction.nextMonth,
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">3 Meses</div>
                      <div
                        className={`text-lg font-bold ${
                          predictions.cashFlowPrediction.next3Months >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(
                          predictions.cashFlowPrediction.next3Months,
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">6 Meses</div>
                      <div
                        className={`text-lg font-bold ${
                          predictions.cashFlowPrediction.next6Months >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(
                          predictions.cashFlowPrediction.next6Months,
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Confiança da Previsão
                      </span>
                      <span
                        className={`text-sm font-medium ${getConfidenceColor(predictions.cashFlowPrediction.confidence)}`}
                      >
                        {predictions.cashFlowPrediction.confidence}%
                      </span>
                    </div>
                    <Progress
                      value={predictions.cashFlowPrediction.confidence}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">
                      Fatores de Influência:
                    </h4>
                    {predictions.cashFlowPrediction.factors.map(
                      (factor, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{factor.factor}</span>
                          <span
                            className={
                              factor.impact >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {factor.impact >= 0 ? "+" : ""}
                            {factor.impact.toFixed(1)}%
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Investment Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Recomendações de Investimento</span>
                  </CardTitle>
                  <CardDescription>
                    Sugestões personalizadas baseadas no seu perfil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictions.investmentRecommendations.map(
                      (investment, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{investment.type}</h4>
                            <Badge
                              variant="outline"
                              className={`${
                                investment.riskLevel === "low"
                                  ? "bg-green-100 text-green-800"
                                  : investment.riskLevel === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {investment.riskLevel === "low"
                                ? "Baixo Risco"
                                : investment.riskLevel === "medium"
                                  ? "Médio Risco"
                                  : "Alto Risco"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Alocação:</span>
                              <span className="ml-2 font-medium">
                                {investment.allocation}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                Retorno Esperado:
                              </span>
                              <span className="ml-2 font-medium text-green-600">
                                {investment.expectedReturn}% a.a.
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            {investment.reasoning}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {investment.timeHorizon}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {recommendations.map((recommendation) => (
              <Card key={recommendation.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {recommendation.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {recommendation.description}
                      </CardDescription>
                    </div>
                    <Badge
                      className={getPriorityBadgeColor(recommendation.priority)}
                    >
                      Prioridade {recommendation.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Por que esta recomendação?
                    </h4>
                    <p className="text-sm text-blue-800">
                      {recommendation.personalizedReason}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Impacto Financeiro:</span>
                      <div className="font-medium text-green-600">
                        {formatCurrency(recommendation.impact.financial)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">
                        Tempo para Ver Resultado:
                      </span>
                      <div className="font-medium">
                        {recommendation.impact.timeToSee}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Plano de Ação:</h4>
                    {recommendation.actionPlan.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 text-sm"
                      >
                        <div className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <div>{step.action}</div>
                          <div className="text-gray-500 text-xs">
                            {step.timeframe} •
                            <span
                              className={`${
                                step.difficulty === "easy"
                                  ? "text-green-600"
                                  : step.difficulty === "medium"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {step.difficulty === "easy"
                                ? "Fácil"
                                : step.difficulty === "medium"
                                  ? "Médio"
                                  : "Difícil"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm ${getConfidenceColor(recommendation.impact.confidence)}`}
                      >
                        {recommendation.impact.confidence}% confiança
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleRecommendationFeedback(
                            recommendation.id,
                            "rejected",
                          )
                        }
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Não Útil
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleRecommendationFeedback(
                            recommendation.id,
                            "accepted",
                          )
                        }
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          {predictions && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spending Anomalies */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Anomalias de Gastos</span>
                  </CardTitle>
                  <CardDescription>
                    Gastos incomuns detectados pela IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictions.spendingPatterns.anomalyDetection
                      .slice(0, 5)
                      .map((anomaly, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <div className="font-medium">
                              {formatCurrency(anomaly.amount)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {anomaly.category}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(anomaly.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-red-600">
                              {anomaly.anomalyScore.toFixed(0)}% acima
                            </div>
                            <div className="text-xs text-gray-500">
                              {anomaly.reason}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Padrões Semanais</span>
                  </CardTitle>
                  <CardDescription>
                    Análise de gastos por dia da semana
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {predictions.spendingPatterns.weeklyPatterns.map(
                      (pattern, index) => {
                        const dayNames = [
                          "Dom",
                          "Seg",
                          "Ter",
                          "Qua",
                          "Qui",
                          "Sex",
                          "Sáb",
                        ];
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 text-sm font-medium">
                                {dayNames[pattern.dayOfWeek]}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">
                                  {formatCurrency(pattern.averageSpending)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {pattern.peakCategories
                                    .slice(0, 2)
                                    .join(", ")}
                                </div>
                              </div>
                            </div>
                            <div className="w-20">
                              <Progress
                                value={
                                  (pattern.averageSpending /
                                    Math.max(
                                      ...predictions.spendingPatterns.weeklyPatterns.map(
                                        (p) => p.averageSpending,
                                      ),
                                    )) *
                                  100
                                }
                                className="h-2"
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          {predictions && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {predictions.goalAchievementProbability.map((goal, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{goal.goalName}</span>
                      <Badge
                        className={`${
                          goal.probability >= 80
                            ? "bg-green-100 text-green-800"
                            : goal.probability >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {goal.probability.toFixed(0)}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progresso Atual</span>
                        <span>{goal.currentProgress.toFixed(1)}%</span>
                      </div>
                      <Progress value={goal.currentProgress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">
                          Contribuição Mensal:
                        </span>
                        <div className="font-medium">
                          {formatCurrency(goal.requiredMonthlyContribution)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Previsão:</span>
                        <div className="font-medium">
                          {new Date(goal.estimatedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {goal.riskFactors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Fatores de Risco:
                        </h4>
                        <div className="space-y-1">
                          {goal.riskFactors.map((risk, riskIndex) => (
                            <div
                              key={riskIndex}
                              className="flex items-center space-x-2 text-xs"
                            >
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              <span className="text-gray-600">{risk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
