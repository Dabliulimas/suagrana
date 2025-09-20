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
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
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
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import {
  Settings,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  BarChart3,
  Target,
  CreditCard,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FinancialSettings {
  // Appearance
  theme: "light" | "dark" | "system";
  currency: string;
  language: string;
  dateFormat: string;
  numberFormat: string;

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationFrequency: "immediate" | "daily" | "weekly";

  // Privacy & Security
  dataEncryption: boolean;
  biometricAuth: boolean;
  sessionTimeout: number;
  dataRetention: number;

  // Features
  enableBudgetTracking: boolean;
  enableGoalTracking: boolean;
  enableInvestmentTracking: boolean;
  enableCategoryAnalysis: boolean;
  enablePredictiveAnalysis: boolean;
  enableAutomation: boolean;

  // Data Management
  autoBackup: boolean;
  backupFrequency: "daily" | "weekly" | "monthly";
  cloudSync: boolean;

  // Display
  showBalances: boolean;
  showPercentages: boolean;
  compactView: boolean;
  animationsEnabled: boolean;
}

interface SettingsManagerProps {
  className?: string;
}

const defaultSettings: FinancialSettings = {
  theme: "system",
  currency: "BRL",
  language: "pt-BR",
  dateFormat: "DD/MM/YYYY",
  numberFormat: "pt-BR",
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  notificationFrequency: "immediate",
  dataEncryption: true,
  biometricAuth: false,
  sessionTimeout: 30,
  dataRetention: 365,
  enableBudgetTracking: true,
  enableGoalTracking: true,
  enableInvestmentTracking: true,
  enableCategoryAnalysis: true,
  enablePredictiveAnalysis: true,
  enableAutomation: true,
  autoBackup: true,
  backupFrequency: "weekly",
  cloudSync: true,
  showBalances: true,
  showPercentages: true,
  compactView: false,
  animationsEnabled: true,
};

const FinancialSettingsManager: React.FC<SettingsManagerProps> = ({
  className,
}) => {
  const router = useRouter();
  const [settings, setSettings] = useState<FinancialSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const savedSettings = localStorage.getItem("financial-settings");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      logComponents.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      localStorage.setItem("financial-settings", JSON.stringify(settings));
      setHasChanges(false);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      logComponents.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.info("Configurações restauradas para o padrão");
  };

  const updateSetting = <K extends keyof FinancialSettings>(
    key: K,
    value: FinancialSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "financial-settings.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Configurações exportadas!");
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...importedSettings });
        setHasChanges(true);
        toast.success("Configurações importadas!");
      } catch (error) {
        toast.error("Erro ao importar configurações");
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações do Sistema
          </h2>
          <p className="text-gray-600">
            Personalize sua experiência financeira
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600">
              Alterações não salvas
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showAdvanced ? "Ocultar" : "Mostrar"} Avançadas
          </Button>
          <Button onClick={saveSettings} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="features">Recursos</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Aparência e Localização
              </CardTitle>
              <CardDescription>
                Configure o tema, idioma e formatos de exibição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme">Tema</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: any) =>
                      updateSetting("theme", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Claro
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Escuro
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Sistema
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => updateSetting("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">Dolar Americano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">Libra Esterlina (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => updateSetting("language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Portugues (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Espanol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFormat">Formato de Data</Label>
                  <Select
                    value={settings.dateFormat}
                    onValueChange={(value) =>
                      updateSetting("dateFormat", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                      <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Opções de Exibição</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showBalances">Mostrar Saldos</Label>
                      <p className="text-sm text-gray-600">
                        Exibir valores nas contas
                      </p>
                    </div>
                    <Switch
                      id="showBalances"
                      checked={settings.showBalances}
                      onCheckedChange={(checked) =>
                        updateSetting("showBalances", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showPercentages">
                        Mostrar Percentuais
                      </Label>
                      <p className="text-sm text-gray-600">
                        Exibir % nos gráficos
                      </p>
                    </div>
                    <Switch
                      id="showPercentages"
                      checked={settings.showPercentages}
                      onCheckedChange={(checked) =>
                        updateSetting("showPercentages", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="compactView">Visualização Compacta</Label>
                      <p className="text-sm text-gray-600">
                        Interface mais densa
                      </p>
                    </div>
                    <Switch
                      id="compactView"
                      checked={settings.compactView}
                      onCheckedChange={(checked) =>
                        updateSetting("compactView", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="animationsEnabled">Animações</Label>
                      <p className="text-sm text-gray-600">Efeitos visuais</p>
                    </div>
                    <Switch
                      id="animationsEnabled"
                      checked={settings.animationsEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting("animationsEnabled", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como e quando receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <div>
                      <Label htmlFor="emailNotifications">Email</Label>
                      <p className="text-sm text-gray-600">Receber por email</p>
                    </div>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting("emailNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <div>
                      <Label htmlFor="pushNotifications">Push</Label>
                      <p className="text-sm text-gray-600">
                        Notificações no dispositivo
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting("pushNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <div>
                      <Label htmlFor="smsNotifications">SMS</Label>
                      <p className="text-sm text-gray-600">
                        Mensagens de texto
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) =>
                      updateSetting("smsNotifications", checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="notificationFrequency">Frequência</Label>
                <Select
                  value={settings.notificationFrequency}
                  onValueChange={(value: any) =>
                    updateSetting("notificationFrequency", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Imediata</SelectItem>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacidade e Segurança
              </CardTitle>
              <CardDescription>
                Configure opções de segurança e privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <div>
                      <Label htmlFor="dataEncryption">
                        Criptografia de Dados
                      </Label>
                      <p className="text-sm text-gray-600">
                        Proteger dados localmente
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="dataEncryption"
                    checked={settings.dataEncryption}
                    onCheckedChange={(checked) =>
                      updateSetting("dataEncryption", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <div>
                      <Label htmlFor="biometricAuth">
                        Autenticação Biométrica
                      </Label>
                      <p className="text-sm text-gray-600">
                        Usar impressão digital/Face ID
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="biometricAuth"
                    checked={settings.biometricAuth}
                    onCheckedChange={(checked) =>
                      updateSetting("biometricAuth", checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">
                    Timeout da Sessão (min)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="120"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      updateSetting("sessionTimeout", parseInt(e.target.value))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="dataRetention">
                    Retenção de Dados (dias)
                  </Label>
                  <Input
                    id="dataRetention"
                    type="number"
                    min="30"
                    max="3650"
                    value={settings.dataRetention}
                    onChange={(e) =>
                      updateSetting("dataRetention", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Recursos do Sistema
              </CardTitle>
              <CardDescription>
                Ative ou desative funcionalidades específicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <div>
                      <Label htmlFor="enableBudgetTracking">
                        Controle de Orçamento
                      </Label>
                      <p className="text-sm text-gray-600">
                        Acompanhar gastos por categoria
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="enableBudgetTracking"
                    checked={settings.enableBudgetTracking}
                    onCheckedChange={(checked) =>
                      updateSetting("enableBudgetTracking", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <div>
                      <Label htmlFor="enableGoalTracking">
                        Metas Financeiras
                      </Label>
                      <p className="text-sm text-gray-600">
                        Definir e acompanhar objetivos
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="enableGoalTracking"
                    checked={settings.enableGoalTracking}
                    onCheckedChange={(checked) =>
                      updateSetting("enableGoalTracking", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <div>
                      <Label htmlFor="enableInvestmentTracking">
                        Investimentos
                      </Label>
                      <p className="text-sm text-gray-600">
                        Acompanhar carteira de investimentos
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="enableInvestmentTracking"
                    checked={settings.enableInvestmentTracking}
                    onCheckedChange={(checked) =>
                      updateSetting("enableInvestmentTracking", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <div>
                      <Label htmlFor="enableCategoryAnalysis">
                        Análise por Categoria
                      </Label>
                      <p className="text-sm text-gray-600">
                        Relatórios detalhados por categoria
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="enableCategoryAnalysis"
                    checked={settings.enableCategoryAnalysis}
                    onCheckedChange={(checked) =>
                      updateSetting("enableCategoryAnalysis", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <div>
                      <Label htmlFor="enablePredictiveAnalysis">
                        Análise Preditiva
                      </Label>
                      <p className="text-sm text-gray-600">
                        Previsões e insights inteligentes
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="enablePredictiveAnalysis"
                    checked={settings.enablePredictiveAnalysis}
                    onCheckedChange={(checked) =>
                      updateSetting("enablePredictiveAnalysis", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <div>
                      <Label htmlFor="enableAutomation">Automação</Label>
                      <p className="text-sm text-gray-600">
                        Transações e alertas automáticos
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="enableAutomation"
                    checked={settings.enableAutomation}
                    onCheckedChange={(checked) =>
                      updateSetting("enableAutomation", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gerenciamento de Dados
              </CardTitle>
              <CardDescription>
                Configure backup, sincronização e importação/exportação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoBackup">Backup Automático</Label>
                    <p className="text-sm text-gray-600">
                      Fazer backup dos dados automaticamente
                    </p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) =>
                      updateSetting("autoBackup", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="cloudSync">Sincronização na Nuvem</Label>
                    <p className="text-sm text-gray-600">
                      Sincronizar dados entre dispositivos
                    </p>
                  </div>
                  <Switch
                    id="cloudSync"
                    checked={settings.cloudSync}
                    onCheckedChange={(checked) =>
                      updateSetting("cloudSync", checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="backupFrequency">Frequência do Backup</Label>
                <Select
                  value={settings.backupFrequency}
                  onValueChange={(value: any) =>
                    updateSetting("backupFrequency", value)
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

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Importar/Exportar</h4>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={exportSettings}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Configurações
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importSettings}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Configurações
                    </Button>
                  </div>
                </div>
              </div>

              {showAdvanced && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Zona de Perigo
                    </h4>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        As ações abaixo são irreversíveis. Use com cuidado.
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button variant="destructive" onClick={resetSettings}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restaurar Padrões
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialSettingsManager;
