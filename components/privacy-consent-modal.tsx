"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Shield,
  Eye,
  BarChart3,
  Download,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { privacyManager, type PrivacySettings } from "../lib/privacy-manager";
import { authService } from "../lib/auth";
import { toast } from "sonner";

interface PrivacyConsentModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  isFirstTime?: boolean;
}

export function PrivacyConsentModal({
  open,
  onClose,
  userId,
  isFirstTime = false,
}: PrivacyConsentModalProps) {
  const [settings, setSettings] = useState<Partial<PrivacySettings>>({
    dataProcessingConsent: false,
    marketingConsent: false,
    analyticsConsent: false,
    dataRetentionPeriod: 2555, // 7 years
    allowDataExport: true,
    allowDataDeletion: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("consent");

  useEffect(() => {
    if (userId) {
      const existingSettings = privacyManager.getPrivacySettings(userId);
      if (existingSettings) {
        setSettings(existingSettings);
      }
    }
  }, [userId]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const settingsToSave = {
        ...settings,
        userId,
        consentDate: new Date().toISOString(),
      };

      privacyManager.savePrivacySettings(settingsToSave as any);

      toast.success("Configurações de privacidade salvas com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar configurações de privacidade");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const result = await privacyManager.exportUserData(userId);
      if (result.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meus-dados-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Dados exportados com sucesso!");
      } else {
        toast.error(result.error || "Erro ao exportar dados");
      }
    } catch (error) {
      toast.error("Erro ao exportar dados");
    }
  };

  const handleDeleteData = async () => {
    if (
      !confirm(
        "Tem certeza que deseja excluir todos os seus dados? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    try {
      const result = await privacyManager.deleteUserData(userId);
      if (result.success) {
        toast.success(`Dados excluídos: ${result.deleted.join(", ")}`);
        // Logout user after data deletion
        authService.clearCurrentSession();
        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao excluir dados");
      }
    } catch (error) {
      toast.error("Erro ao excluir dados");
    }
  };

  const retentionPolicies = privacyManager.getRetentionPolicies();
  const consentHistory = privacyManager.getConsentHistory(userId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            {isFirstTime
              ? "Configurações de Privacidade"
              : "Gerenciar Privacidade"}
          </DialogTitle>
        </DialogHeader>

        {isFirstTime && (
          <Alert className="mb-4">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Para usar o SuaGrana, precisamos do seu consentimento para
              processar seus dados financeiros. Você pode alterar essas
              configurações a qualquer momento.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="consent">Consentimentos</TabsTrigger>
            <TabsTrigger value="retention">Retenção</TabsTrigger>
            <TabsTrigger value="rights">Seus Direitos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="consent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-600" />
                  Processamento de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Dados Financeiros</Label>
                    <p className="text-sm text-gray-600">
                      Necessário para funcionalidades básicas como transações,
                      contas e relatórios.
                    </p>
                  </div>
                  <Switch
                    checked={settings.dataProcessingConsent}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        dataProcessingConsent: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">
                      Comunicações de Marketing
                    </Label>
                    <p className="text-sm text-gray-600">
                      Receber emails sobre novos recursos, dicas financeiras e
                      ofertas especiais.
                    </p>
                  </div>
                  <Switch
                    checked={settings.marketingConsent}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, marketingConsent: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="font-medium">Analytics e Melhorias</Label>
                    <p className="text-sm text-gray-600">
                      Dados de uso anônimos para melhorar a experiência do
                      usuário.
                    </p>
                  </div>
                  <Switch
                    checked={settings.analyticsConsent}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, analyticsConsent: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retention" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Políticas de Retenção de Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {retentionPolicies.map((policy, index) => (
                    <div
                      key={`retention-${policy.dataType}-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium capitalize">
                          {policy.dataType.replace("_", " ")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {policy.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {policy.retentionPeriod} dias
                        </Badge>
                        {policy.autoDelete && (
                          <Badge variant="secondary" className="ml-2">
                            Auto-exclusão
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Seus Direitos de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Exportar Dados</Label>
                      <Switch
                        checked={settings.allowDataExport}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, allowDataExport: checked })
                        }
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Permite baixar uma cópia de todos os seus dados.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportData}
                      disabled={!settings.allowDataExport}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Meus Dados
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Excluir Dados</Label>
                      <Switch
                        checked={settings.allowDataDeletion}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            allowDataDeletion: checked,
                          })
                        }
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Permite excluir permanentemente seus dados.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteData}
                      disabled={!settings.allowDataDeletion}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Meus Dados
                    </Button>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Importante:</strong> Alguns dados financeiros podem
                    ser mantidos por períodos legais obrigatórios, mesmo após
                    solicitação de exclusão, conforme exigido pela legislação
                    fiscal.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Histórico de Consentimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {consentHistory.length > 0 ? (
                      consentHistory.map((consent, index) => (
                        <div
                          key={`consent-${consent.consentType}-${consent.timestamp}-${index}`}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">
                              {consent.consentType.replace("_", " ")}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(consent.timestamp).toLocaleString(
                                "pt-BR",
                              )}
                            </p>
                          </div>
                          <Badge
                            variant={consent.granted ? "default" : "secondary"}
                          >
                            {consent.granted ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {consent.granted ? "Concedido" : "Negado"}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          Nenhum histórico de consentimento encontrado
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {isFirstTime ? "Cancelar" : "Fechar"}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
