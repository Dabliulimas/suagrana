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
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Brain,
  Settings,
  Target,
  TrendingUp,
  Shield,
  Bell,
  Zap,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Save,
  RotateCcw,
  Info,
} from "lucide-react";
import { advancedAIEngine } from "../lib/financial/advanced-ai-engine";

interface AIPreferences {
  // Analysis Settings
  analysisFrequency: "daily" | "weekly" | "monthly";
  predictionHorizon: 1 | 3 | 6 | 12; // months
  confidenceThreshold: number; // 0-100

  // Notification Settings
  enablePredictiveAlerts: boolean;
  enableSpendingAnomalies: boolean;
  enableGoalReminders: boolean;
  enableInvestmentSuggestions: boolean;

  // Recommendation Settings
  riskTolerance: "conservative" | "moderate" | "aggressive";
  recommendationStyle: "detailed" | "concise" | "actionable";
  maxRecommendationsPerDay: number;

  // Learning Settings
  enablePersonalization: boolean;
  trackBehaviorPatterns: boolean;
  adaptToFeedback: boolean;

  // Privacy Settings
  dataRetentionDays: number;
  shareAnonymousData: boolean;
  enableCloudSync: boolean;
}

interface AIModelSettings {
  cashFlowModel: {
    enabled: boolean;
    sensitivity: number; // 0-100
    lookbackPeriod: number; // days
  };
  spendingAnalysis: {
    enabled: boolean;
    anomalyThreshold: number; // 0-100
    categoryWeighting: boolean;
  };
  goalPrediction: {
    enabled: boolean;
    optimismBias: number; // -50 to 50
    includeExternalFactors: boolean;
  };
  investmentAnalysis: {
    enabled: boolean;
    marketDataIntegration: boolean;
    riskAdjustment: number; // 0-100
  };
}

const defaultPreferences: AIPreferences = {
  analysisFrequency: "weekly",
  predictionHorizon: 3,
  confidenceThreshold: 70,
  enablePredictiveAlerts: true,
  enableSpendingAnomalies: true,
  enableGoalReminders: true,
  enableInvestmentSuggestions: true,
  riskTolerance: "moderate",
  recommendationStyle: "actionable",
  maxRecommendationsPerDay: 5,
  enablePersonalization: true,
  trackBehaviorPatterns: true,
  adaptToFeedback: true,
  dataRetentionDays: 365,
  shareAnonymousData: false,
  enableCloudSync: true,
};

const defaultModelSettings: AIModelSettings = {
  cashFlowModel: {
    enabled: true,
    sensitivity: 75,
    lookbackPeriod: 90,
  },
  spendingAnalysis: {
    enabled: true,
    anomalyThreshold: 80,
    categoryWeighting: true,
  },
  goalPrediction: {
    enabled: true,
    optimismBias: 0,
    includeExternalFactors: true,
  },
  investmentAnalysis: {
    enabled: true,
    marketDataIntegration: false,
    riskAdjustment: 50,
  },
};

export default function AISettings() {
  const [preferences, setPreferences] =
    useState<AIPreferences>(defaultPreferences);
  const [modelSettings, setModelSettings] =
    useState<AIModelSettings>(defaultModelSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load from localStorage
      const storedPreferences = localStorage.getItem(
        "sua-grana-ai-preferences",
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      const storedModelSettings = localStorage.getItem(
        "sua-grana-ai-model-settings",
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      const storedLastSaved = localStorage.getItem(
        "sua-grana-ai-settings-last-saved",
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;

      if (storedPreferences) {
        setPreferences({
          ...defaultPreferences,
          ...JSON.parse(storedPreferences),
        });
      }

      if (storedModelSettings) {
        setModelSettings({
          ...defaultModelSettings,
          ...JSON.parse(storedModelSettings),
        });
      }

      if (storedLastSaved) {
        setLastSaved(new Date(storedLastSaved));
      }
    } catch (error) {
      logComponents.error("Erro ao carregar configurações:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Save to localStorage
      localStorage.setItem(
        "sua-grana-ai-preferences",
        JSON.stringify(preferences),
      );
      localStorage.setItem(
        "sua-grana-ai-model-settings",
        JSON.stringify(modelSettings),
      );
      localStorage.setItem(
        "sua-grana-ai-settings-last-saved",
        new Date().toISOString(),
      );

      // Update AI engine configuration
      await advancedAIEngine.updateConfiguration({
        preferences,
        modelSettings,
      });

      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      logComponents.error("Erro ao salvar configurações:", error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences(defaultPreferences);
    setModelSettings(defaultModelSettings);
    setHasChanges(true);
  };

  const updatePreferences = (updates: Partial<AIPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateModelSettings = (updates: Partial<AIModelSettings>) => {
    setModelSettings((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando configurações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configurações de IA</h1>
            <p className="text-gray-600">
              Personalize o comportamento do assistente financeiro
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Salvo em {lastSaved.toLocaleString()}
            </span>
          )}
          <Button onClick={resetToDefaults} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </Button>
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || saving}
            size="sm"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Você tem alterações não salvas. Clique em "Salvar" para aplicar as
            configurações.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="models">Modelos IA</TabsTrigger>
          <TabsTrigger value="privacy">Privacidade</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Analysis Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Configurações de Análise</span>
                </CardTitle>
                <CardDescription>
                  Configure como a IA analisa seus dados financeiros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Frequência de Análise</Label>
                  <Select
                    value={preferences.analysisFrequency}
                    onValueChange={(value: "daily" | "weekly" | "monthly") =>
                      updatePreferences({ analysisFrequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Horizonte de Previsão</Label>
                  <Select
                    value={preferences.predictionHorizon.toString()}
                    onValueChange={(value) =>
                      updatePreferences({
                        predictionHorizon: parseInt(value) as 1 | 3 | 6 | 12,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mês</SelectItem>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Limite de Confiança Mínimo:{" "}
                    {preferences.confidenceThreshold}%
                  </Label>
                  <Slider
                    value={[preferences.confidenceThreshold]}
                    onValueChange={([value]) =>
                      updatePreferences({ confidenceThreshold: value })
                    }
                    max={100}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Apenas previsões com confiança acima deste valor serão
                    exibidas
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recommendation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Recomendações</span>
                </CardTitle>
                <CardDescription>
                  Personalize como recebe recomendações financeiras
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tolerância ao Risco</Label>
                  <Select
                    value={preferences.riskTolerance}
                    onValueChange={(
                      value: "conservative" | "moderate" | "aggressive",
                    ) => updatePreferences({ riskTolerance: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservador</SelectItem>
                      <SelectItem value="moderate">Moderado</SelectItem>
                      <SelectItem value="aggressive">Agressivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estilo de Recomendação</Label>
                  <Select
                    value={preferences.recommendationStyle}
                    onValueChange={(
                      value: "detailed" | "concise" | "actionable",
                    ) => updatePreferences({ recommendationStyle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">Detalhado</SelectItem>
                      <SelectItem value="concise">Conciso</SelectItem>
                      <SelectItem value="actionable">Focado em Ação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Máximo de Recomendações por Dia:{" "}
                    {preferences.maxRecommendationsPerDay}
                  </Label>
                  <Slider
                    value={[preferences.maxRecommendationsPerDay]}
                    onValueChange={([value]) =>
                      updatePreferences({ maxRecommendationsPerDay: value })
                    }
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Learning Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Aprendizado</span>
                </CardTitle>
                <CardDescription>
                  Configure como a IA aprende com seu comportamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Personalização Ativa</Label>
                    <p className="text-xs text-gray-500">
                      Permite que a IA se adapte ao seu perfil financeiro
                    </p>
                  </div>
                  <Switch
                    checked={preferences.enablePersonalization}
                    onCheckedChange={(checked) =>
                      updatePreferences({ enablePersonalization: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rastreamento de Padrões</Label>
                    <p className="text-xs text-gray-500">
                      Analisa seus hábitos para melhorar previsões
                    </p>
                  </div>
                  <Switch
                    checked={preferences.trackBehaviorPatterns}
                    onCheckedChange={(checked) =>
                      updatePreferences({ trackBehaviorPatterns: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Adaptação por Feedback</Label>
                    <p className="text-xs text-gray-500">
                      Melhora recomendações baseado em suas avaliações
                    </p>
                  </div>
                  <Switch
                    checked={preferences.adaptToFeedback}
                    onCheckedChange={(checked) =>
                      updatePreferences({ adaptToFeedback: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Configurações de Notificação</span>
              </CardTitle>
              <CardDescription>
                Escolha quais tipos de alertas inteligentes deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas Preditivos</Label>
                      <p className="text-xs text-gray-500">
                        Notificações sobre tendências futuras detectadas
                      </p>
                    </div>
                    <Switch
                      checked={preferences.enablePredictiveAlerts}
                      onCheckedChange={(checked) =>
                        updatePreferences({ enablePredictiveAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Anomalias de Gastos</Label>
                      <p className="text-xs text-gray-500">
                        Alertas quando gastos fogem do padrão normal
                      </p>
                    </div>
                    <Switch
                      checked={preferences.enableSpendingAnomalies}
                      onCheckedChange={(checked) =>
                        updatePreferences({ enableSpendingAnomalies: checked })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lembretes de Metas</Label>
                      <p className="text-xs text-gray-500">
                        Notificações sobre progresso e prazos de metas
                      </p>
                    </div>
                    <Switch
                      checked={preferences.enableGoalReminders}
                      onCheckedChange={(checked) =>
                        updatePreferences({ enableGoalReminders: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sugestões de Investimento</Label>
                      <p className="text-xs text-gray-500">
                        Recomendações baseadas em análise de mercado
                      </p>
                    </div>
                    <Switch
                      checked={preferences.enableInvestmentSuggestions}
                      onCheckedChange={(checked) =>
                        updatePreferences({
                          enableInvestmentSuggestions: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Models Settings */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Modelo de Fluxo de Caixa</span>
                  </div>
                  <Switch
                    checked={modelSettings.cashFlowModel.enabled}
                    onCheckedChange={(checked) =>
                      updateModelSettings({
                        cashFlowModel: {
                          ...modelSettings.cashFlowModel,
                          enabled: checked,
                        },
                      })
                    }
                  />
                </CardTitle>
                <CardDescription>
                  Previsões de entrada e saída de dinheiro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Sensibilidade: {modelSettings.cashFlowModel.sensitivity}%
                  </Label>
                  <Slider
                    value={[modelSettings.cashFlowModel.sensitivity]}
                    onValueChange={([value]) =>
                      updateModelSettings({
                        cashFlowModel: {
                          ...modelSettings.cashFlowModel,
                          sensitivity: value,
                        },
                      })
                    }
                    max={100}
                    min={0}
                    step={5}
                    disabled={!modelSettings.cashFlowModel.enabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Período de Análise:{" "}
                    {modelSettings.cashFlowModel.lookbackPeriod} dias
                  </Label>
                  <Slider
                    value={[modelSettings.cashFlowModel.lookbackPeriod]}
                    onValueChange={([value]) =>
                      updateModelSettings({
                        cashFlowModel: {
                          ...modelSettings.cashFlowModel,
                          lookbackPeriod: value,
                        },
                      })
                    }
                    max={365}
                    min={30}
                    step={30}
                    disabled={!modelSettings.cashFlowModel.enabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Spending Analysis Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Análise de Gastos</span>
                  </div>
                  <Switch
                    checked={modelSettings.spendingAnalysis.enabled}
                    onCheckedChange={(checked) =>
                      updateModelSettings({
                        spendingAnalysis: {
                          ...modelSettings.spendingAnalysis,
                          enabled: checked,
                        },
                      })
                    }
                  />
                </CardTitle>
                <CardDescription>
                  Detecção de padrões e anomalias nos gastos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Limite de Anomalia:{" "}
                    {modelSettings.spendingAnalysis.anomalyThreshold}%
                  </Label>
                  <Slider
                    value={[modelSettings.spendingAnalysis.anomalyThreshold]}
                    onValueChange={([value]) =>
                      updateModelSettings({
                        spendingAnalysis: {
                          ...modelSettings.spendingAnalysis,
                          anomalyThreshold: value,
                        },
                      })
                    }
                    max={100}
                    min={50}
                    step={5}
                    disabled={!modelSettings.spendingAnalysis.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ponderação por Categoria</Label>
                    <p className="text-xs text-gray-500">
                      Considera importância relativa das categorias
                    </p>
                  </div>
                  <Switch
                    checked={modelSettings.spendingAnalysis.categoryWeighting}
                    onCheckedChange={(checked) =>
                      updateModelSettings({
                        spendingAnalysis: {
                          ...modelSettings.spendingAnalysis,
                          categoryWeighting: checked,
                        },
                      })
                    }
                    disabled={!modelSettings.spendingAnalysis.enabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Goal Prediction Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Previsão de Metas</span>
                  </div>
                  <Switch
                    checked={modelSettings.goalPrediction.enabled}
                    onCheckedChange={(checked) =>
                      updateModelSettings({
                        goalPrediction: {
                          ...modelSettings.goalPrediction,
                          enabled: checked,
                        },
                      })
                    }
                  />
                </CardTitle>
                <CardDescription>
                  Probabilidade de alcançar objetivos financeiros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Viés de Otimismo:{" "}
                    {modelSettings.goalPrediction.optimismBias > 0 ? "+" : ""}
                    {modelSettings.goalPrediction.optimismBias}%
                  </Label>
                  <Slider
                    value={[modelSettings.goalPrediction.optimismBias]}
                    onValueChange={([value]) =>
                      updateModelSettings({
                        goalPrediction: {
                          ...modelSettings.goalPrediction,
                          optimismBias: value,
                        },
                      })
                    }
                    max={50}
                    min={-50}
                    step={5}
                    disabled={!modelSettings.goalPrediction.enabled}
                  />
                  <p className="text-xs text-gray-500">
                    Ajusta previsões para ser mais otimista (+) ou pessimista
                    (-)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Fatores Externos</Label>
                    <p className="text-xs text-gray-500">
                      Considera inflação, juros e outros fatores econômicos
                    </p>
                  </div>
                  <Switch
                    checked={
                      modelSettings.goalPrediction.includeExternalFactors
                    }
                    onCheckedChange={(checked) =>
                      updateModelSettings({
                        goalPrediction: {
                          ...modelSettings.goalPrediction,
                          includeExternalFactors: checked,
                        },
                      })
                    }
                    disabled={!modelSettings.goalPrediction.enabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Investment Analysis Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Análise de Investimentos</span>
                  </div>
                  <Switch
                    checked={modelSettings.investmentAnalysis.enabled}
                    onCheckedChange={(checked) =>
                      updateModelSettings({
                        investmentAnalysis: {
                          ...modelSettings.investmentAnalysis,
                          enabled: checked,
                        },
                      })
                    }
                  />
                </CardTitle>
                <CardDescription>
                  Recomendações de portfólio e alocação de ativos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Integração com Dados de Mercado</Label>
                    <p className="text-xs text-gray-500">
                      Usa dados em tempo real para recomendações
                    </p>
                  </div>
                  <Switch
                    checked={
                      modelSettings.investmentAnalysis.marketDataIntegration
                    }
                    onCheckedChange={(checked) =>
                      updateModelSettings({
                        investmentAnalysis: {
                          ...modelSettings.investmentAnalysis,
                          marketDataIntegration: checked,
                        },
                      })
                    }
                    disabled={!modelSettings.investmentAnalysis.enabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Ajuste de Risco:{" "}
                    {modelSettings.investmentAnalysis.riskAdjustment}%
                  </Label>
                  <Slider
                    value={[modelSettings.investmentAnalysis.riskAdjustment]}
                    onValueChange={([value]) =>
                      updateModelSettings({
                        investmentAnalysis: {
                          ...modelSettings.investmentAnalysis,
                          riskAdjustment: value,
                        },
                      })
                    }
                    max={100}
                    min={0}
                    step={5}
                    disabled={!modelSettings.investmentAnalysis.enabled}
                  />
                  <p className="text-xs text-gray-500">
                    0% = Muito conservador, 100% = Muito agressivo
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Configurações de Privacidade</span>
              </CardTitle>
              <CardDescription>
                Controle como seus dados são armazenados e utilizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Retenção de Dados: {preferences.dataRetentionDays} dias
                    </Label>
                    <Slider
                      value={[preferences.dataRetentionDays]}
                      onValueChange={([value]) =>
                        updatePreferences({ dataRetentionDays: value })
                      }
                      max={1095} // 3 years
                      min={30}
                      step={30}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Dados de análise são automaticamente removidos após este
                      período
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compartilhar Dados Anônimos</Label>
                      <p className="text-xs text-gray-500">
                        Ajuda a melhorar os modelos de IA (dados não
                        identificáveis)
                      </p>
                    </div>
                    <Switch
                      checked={preferences.shareAnonymousData}
                      onCheckedChange={(checked) =>
                        updatePreferences({ shareAnonymousData: checked })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sincronização na Nuvem</Label>
                      <p className="text-xs text-gray-500">
                        Sincroniza configurações entre dispositivos
                      </p>
                    </div>
                    <Switch
                      checked={preferences.enableCloudSync}
                      onCheckedChange={(checked) =>
                        updatePreferences({ enableCloudSync: checked })
                      }
                    />
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Todos os dados são criptografados e processados
                      localmente. Nenhuma informação financeira sensível é
                      enviada para servidores externos.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
