"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import {
  Settings,
  Brain,
  Zap,
  Bell,
  Target,
  TrendingUp,
  Shield,
  Database,
  Cpu,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Info,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import smartBudgetEngine, {
  type SmartBudgetConfig,
} from "../lib/financial/smart-budget-engine";

interface AdvancedConfig extends SmartBudgetConfig {
  // Configurações de Machine Learning
  mlSettings: {
    learningRate: number;
    confidenceThreshold: number;
    trainingDataSize: number;
    modelUpdateFrequency: "daily" | "weekly" | "monthly";
    featureSelection: string[];
  };

  // Configurações de Alertas
  alertSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    alertCooldown: number; // minutos
    criticalAlertThreshold: number;
    warningAlertThreshold: number;
  };

  // Configurações de Automação
  automationSettings: {
    autoCategorizationEnabled: boolean;
    autoBudgetAdjustment: boolean;
    smartRebalancing: boolean;
    seasonalAdjustments: boolean;
    inflationAdjustment: boolean;
    goalBasedOptimization: boolean;
  };

  // Configurações de Privacidade
  privacySettings: {
    dataRetentionDays: number;
    anonymizeData: boolean;
    shareAnalytics: boolean;
    exportDataEnabled: boolean;
    deleteHistoryEnabled: boolean;
  };

  // Configurações de Performance
  performanceSettings: {
    cacheEnabled: boolean;
    batchProcessing: boolean;
    realTimeUpdates: boolean;
    backgroundSync: boolean;
    compressionEnabled: boolean;
  };
}

const defaultAdvancedConfig: AdvancedConfig = {
  autoAdjustEnabled: true,
  alertFrequency: "realtime",
  learningEnabled: true,
  predictiveAnalysis: true,
  anomalyDetection: true,
  smartRecommendations: true,
  mlSettings: {
    learningRate: 0.01,
    confidenceThreshold: 75,
    trainingDataSize: 1000,
    modelUpdateFrequency: "weekly",
    featureSelection: ["amount", "description", "merchant", "category", "time"],
  },
  alertSettings: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    alertCooldown: 30,
    criticalAlertThreshold: 95,
    warningAlertThreshold: 80,
  },
  automationSettings: {
    autoCategorizationEnabled: true,
    autoBudgetAdjustment: true,
    smartRebalancing: true,
    seasonalAdjustments: true,
    inflationAdjustment: false,
    goalBasedOptimization: true,
  },
  privacySettings: {
    dataRetentionDays: 365,
    anonymizeData: true,
    shareAnalytics: false,
    exportDataEnabled: true,
    deleteHistoryEnabled: true,
  },
  performanceSettings: {
    cacheEnabled: true,
    batchProcessing: true,
    realTimeUpdates: true,
    backgroundSync: true,
    compressionEnabled: true,
  },
};

export default function SmartBudgetConfig() {
  const [config, setConfig] = useState<AdvancedConfig>(defaultAdvancedConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    aiEngine: "online",
    database: "online",
    notifications: "online",
    automation: "online",
  });

  useEffect(() => {
    loadConfig();
    checkSystemStatus();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const savedConfig = await smartBudgetEngine.getConfig();

      // Merge com configurações avançadas padrão
      const mergedConfig = {
        ...defaultAdvancedConfig,
        ...savedConfig,
      };

      setConfig(mergedConfig);
    } catch (error) {
      logComponents.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const checkSystemStatus = async () => {
    // Simular verificação de status do sistema
    try {
      // Em uma implementação real, isso faria chamadas para verificar cada serviço
      setSystemStatus({
        aiEngine: "online",
        database: "online",
        notifications: "online",
        automation: "online",
      });
    } catch (error) {
      logComponents.error("Erro ao verificar status do sistema:", error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      await smartBudgetEngine.updateConfig(config);
      setHasChanges(false);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      logComponents.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetConfig = () => {
    setConfig(defaultAdvancedConfig);
    setHasChanges(true);
    toast.info("Configurações resetadas para os valores padrão");
  };

  const updateConfig = (
    section: keyof AdvancedConfig,
    key: string,
    value: any,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const updateBasicConfig = (key: keyof SmartBudgetConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "offline":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "offline":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configurações Avançadas</h1>
          <p className="text-gray-600">
            Configure o sistema de orçamento inteligente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleResetConfig}
            disabled={isSaving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button onClick={handleSaveConfig} disabled={!hasChanges || isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(systemStatus.aiEngine)}
              <div>
                <p className="font-medium">Motor de IA</p>
                <p
                  className={`text-sm ${getStatusColor(systemStatus.aiEngine)}`}
                >
                  {systemStatus.aiEngine === "online" ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(systemStatus.database)}
              <div>
                <p className="font-medium">Banco de Dados</p>
                <p
                  className={`text-sm ${getStatusColor(systemStatus.database)}`}
                >
                  {systemStatus.database === "online" ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(systemStatus.notifications)}
              <div>
                <p className="font-medium">Notificações</p>
                <p
                  className={`text-sm ${getStatusColor(systemStatus.notifications)}`}
                >
                  {systemStatus.notifications === "online"
                    ? "Online"
                    : "Offline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(systemStatus.automation)}
              <div>
                <p className="font-medium">Automação</p>
                <p
                  className={`text-sm ${getStatusColor(systemStatus.automation)}`}
                >
                  {systemStatus.automation === "online" ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Você tem alterações não salvas. Clique em "Salvar" para aplicar as
            mudanças.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="ml">Machine Learning</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="privacy">Privacidade</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Ajuste Automático de Orçamento</Label>
                    <Switch
                      checked={config.autoAdjustEnabled}
                      onCheckedChange={(checked) =>
                        updateBasicConfig("autoAdjustEnabled", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Aprendizado de Máquina</Label>
                    <Switch
                      checked={config.learningEnabled}
                      onCheckedChange={(checked) =>
                        updateBasicConfig("learningEnabled", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Análise Preditiva</Label>
                    <Switch
                      checked={config.predictiveAnalysis}
                      onCheckedChange={(checked) =>
                        updateBasicConfig("predictiveAnalysis", checked)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Detecção de Anomalias</Label>
                    <Switch
                      checked={config.anomalyDetection}
                      onCheckedChange={(checked) =>
                        updateBasicConfig("anomalyDetection", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Recomendações Inteligentes</Label>
                    <Switch
                      checked={config.smartRecommendations}
                      onCheckedChange={(checked) =>
                        updateBasicConfig("smartRecommendations", checked)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequência de Alertas</Label>
                    <Select
                      value={config.alertFrequency}
                      onValueChange={(value: any) =>
                        updateBasicConfig("alertFrequency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Tempo Real</SelectItem>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ml" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Configurações de Machine Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Taxa de Aprendizado</Label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      max="1"
                      value={config.mlSettings.learningRate}
                      onChange={(e) =>
                        updateConfig(
                          "mlSettings",
                          "learningRate",
                          Number(e.target.value),
                        )
                      }
                    />
                    <p className="text-sm text-gray-600">
                      Controla a velocidade de aprendizado do modelo
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Limite de Confiança (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={config.mlSettings.confidenceThreshold}
                      onChange={(e) =>
                        updateConfig(
                          "mlSettings",
                          "confidenceThreshold",
                          Number(e.target.value),
                        )
                      }
                    />
                    <p className="text-sm text-gray-600">
                      Confiança mínima para aplicar sugestões automáticas
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tamanho dos Dados de Treinamento</Label>
                    <Input
                      type="number"
                      min="100"
                      max="10000"
                      value={config.mlSettings.trainingDataSize}
                      onChange={(e) =>
                        updateConfig(
                          "mlSettings",
                          "trainingDataSize",
                          Number(e.target.value),
                        )
                      }
                    />
                    <p className="text-sm text-gray-600">
                      Número de transações usadas para treinar o modelo
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequência de Atualização do Modelo</Label>
                    <Select
                      value={config.mlSettings.modelUpdateFrequency}
                      onValueChange={(value: any) =>
                        updateConfig(
                          "mlSettings",
                          "modelUpdateFrequency",
                          value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Notificações por Email</Label>
                    <Switch
                      checked={config.alertSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "alertSettings",
                          "emailNotifications",
                          checked,
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Notificações Push</Label>
                    <Switch
                      checked={config.alertSettings.pushNotifications}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "alertSettings",
                          "pushNotifications",
                          checked,
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Notificações por SMS</Label>
                    <Switch
                      checked={config.alertSettings.smsNotifications}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "alertSettings",
                          "smsNotifications",
                          checked,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cooldown de Alertas (minutos)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="1440"
                      value={config.alertSettings.alertCooldown}
                      onChange={(e) =>
                        updateConfig(
                          "alertSettings",
                          "alertCooldown",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Limite para Alerta Crítico (%)</Label>
                    <Input
                      type="number"
                      min="50"
                      max="100"
                      value={config.alertSettings.criticalAlertThreshold}
                      onChange={(e) =>
                        updateConfig(
                          "alertSettings",
                          "criticalAlertThreshold",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Limite para Alerta de Aviso (%)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="95"
                      value={config.alertSettings.warningAlertThreshold}
                      onChange={(e) =>
                        updateConfig(
                          "alertSettings",
                          "warningAlertThreshold",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configurações de Automação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Categorização Automática</Label>
                    <Switch
                      checked={
                        config.automationSettings.autoCategorizationEnabled
                      }
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "automationSettings",
                          "autoCategorizationEnabled",
                          checked,
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Ajuste Automático de Orçamento</Label>
                    <Switch
                      checked={config.automationSettings.autoBudgetAdjustment}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "automationSettings",
                          "autoBudgetAdjustment",
                          checked,
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Rebalanceamento Inteligente</Label>
                    <Switch
                      checked={config.automationSettings.smartRebalancing}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "automationSettings",
                          "smartRebalancing",
                          checked,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Ajustes Sazonais</Label>
                    <Switch
                      checked={config.automationSettings.seasonalAdjustments}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "automationSettings",
                          "seasonalAdjustments",
                          checked,
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Ajuste por Inflação</Label>
                    <Switch
                      checked={config.automationSettings.inflationAdjustment}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "automationSettings",
                          "inflationAdjustment",
                          checked,
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Otimização Baseada em Metas</Label>
                    <Switch
                      checked={config.automationSettings.goalBasedOptimization}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "automationSettings",
                          "goalBasedOptimization",
                          checked,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Retenção de Dados (dias)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="3650"
                      value={config.privacySettings.dataRetentionDays}
                      onChange={(e) =>
                        updateConfig(
                          "privacySettings",
                          "dataRetentionDays",
                          Number(e.target.value),
                        )
                      }
                    />
                    <p className="text-sm text-gray-600">
                      Tempo que os dados são mantidos no sistema
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Anonimizar Dados</Label>
                    <Switch
                      checked={config.privacySettings.anonymizeData}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "privacySettings",
                          "anonymizeData",
                          checked,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Compartilhar Analytics</Label>
                    <Switch
                      checked={config.privacySettings.shareAnalytics}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "privacySettings",
                          "shareAnalytics",
                          checked,
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Permitir Exportação</Label>
                    <Switch
                      checked={config.privacySettings.exportDataEnabled}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "privacySettings",
                          "exportDataEnabled",
                          checked,
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Permitir Exclusão de Histórico</Label>
                    <Switch
                      checked={config.privacySettings.deleteHistoryEnabled}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "privacySettings",
                          "deleteHistoryEnabled",
                          checked,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Configurações de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Cache Habilitado</Label>
                    <Switch
                      checked={config.performanceSettings.cacheEnabled}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "performanceSettings",
                          "cacheEnabled",
                          checked,
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Processamento em Lote</Label>
                    <Switch
                      checked={config.performanceSettings.batchProcessing}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "performanceSettings",
                          "batchProcessing",
                          checked,
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Atualizações em Tempo Real</Label>
                    <Switch
                      checked={config.performanceSettings.realTimeUpdates}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "performanceSettings",
                          "realTimeUpdates",
                          checked,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Sincronização em Background</Label>
                    <Switch
                      checked={config.performanceSettings.backgroundSync}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "performanceSettings",
                          "backgroundSync",
                          checked,
                        )
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Compressão Habilitada</Label>
                    <Switch
                      checked={config.performanceSettings.compressionEnabled}
                      onCheckedChange={(checked) =>
                        updateConfig(
                          "performanceSettings",
                          "compressionEnabled",
                          checked,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
