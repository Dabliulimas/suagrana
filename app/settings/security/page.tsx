"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ArrowLeft,
  Save,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function SecurityPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    loginAlerts: true,
    sessionTimeout: "30",
    biometric: false,
  });

  const [sessions] = useState([
    {
      id: "1",
      device: "Chrome - Windows",
      location: "Sao Paulo, SP",
      lastActive: "Agora",
      current: true,
    },
    {
      id: "2",
      device: "Safari - iPhone",
      location: "Sao Paulo, SP",
      lastActive: "2 horas atras",
      current: false,
    },
    {
      id: "3",
      device: "Firefox - Windows",
      location: "Rio de Janeiro, RJ",
      lastActive: "1 dia atras",
      current: false,
    },
  ]);

  const handleChangePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast.error("As senhas nao coincidem");
      return;
    }

    if (passwords.new.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    toast.success("Senha alterada com sucesso!");
    setPasswords({ current: "", new: "", confirm: "" });
  };

  const handleSaveSecurity = () => {
    toast.success("Configuracoes de seguranca salvas!");
  };

  const handleTerminateSession = (sessionId: string) => {
    toast.success("Sessao encerrada com sucesso!");
  };

  const handleTerminateAllSessions = () => {
    toast.success("Todas as outras sessoes foram encerradas!");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Seguranca
          </h1>
          <p className="text-gray-600">
            Gerencie senha, autenticacao e configuracoes de seguranca
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Mantenha sua conta segura com uma senha forte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) =>
                    setPasswords((prev) => ({
                      ...prev,
                      current: e.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwords.new}
                    onChange={(e) =>
                      setPasswords((prev) => ({ ...prev, new: e.target.value }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) =>
                      setPasswords((prev) => ({
                        ...prev,
                        confirm: e.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">
                Dicas para uma senha segura:
              </h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Use pelo menos 8 caracteres</li>
                <li>• Combine letras maiusculas e minusculas</li>
                <li>• Inclua numeros e simbolos</li>
                <li>• Evite informacoes pessoais</li>
              </ul>
            </div>

            <Button
              onClick={handleChangePassword}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        {/* Autenticacao de Dois Fatores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Autenticacao de Dois Fatores
            </CardTitle>
            <CardDescription>
              Adicione uma camada extra de seguranca a sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="two-factor">Autenticacao de Dois Fatores</Label>
                <p className="text-sm text-gray-500">
                  {security.twoFactor ? "Ativada" : "Desativada"} - Use um app
                  autenticador para gerar codigos
                </p>
              </div>
              <Switch
                id="two-factor"
                checked={security.twoFactor}
                onCheckedChange={(checked) =>
                  setSecurity((prev) => ({ ...prev, twoFactor: checked }))
                }
              />
            </div>

            {security.twoFactor && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    2FA Ativado
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  Sua conta esta protegida com autenticacao de dois fatores.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Ver Codigos de Backup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuracoes de Seguranca */}
        <Card>
          <CardHeader>
            <CardTitle>Configuracoes de Seguranca</CardTitle>
            <CardDescription>
              Configure alertas e comportamentos de seguranca
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="login-alerts">Alertas de Login</Label>
                <p className="text-sm text-gray-500">
                  Receba notificacoes sobre novos logins
                </p>
              </div>
              <Switch
                id="login-alerts"
                checked={security.loginAlerts}
                onCheckedChange={(checked) =>
                  setSecurity((prev) => ({ ...prev, loginAlerts: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="biometric">Autenticacao Biometrica</Label>
                <p className="text-sm text-gray-500">
                  Use impressao digital ou reconhecimento facial
                </p>
              </div>
              <Switch
                id="biometric"
                checked={security.biometric}
                onCheckedChange={(checked) =>
                  setSecurity((prev) => ({ ...prev, biometric: checked }))
                }
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="session-timeout">
                Timeout de Sessao (minutos)
              </Label>
              <Input
                id="session-timeout"
                type="number"
                value={security.sessionTimeout}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    sessionTimeout: e.target.value,
                  }))
                }
                className="w-32 mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Tempo para logout automatico por inatividade
              </p>
            </div>

            <Button
              onClick={handleSaveSecurity}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Configuracoes
            </Button>
          </CardContent>
        </Card>

        {/* Sessoes Ativas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Sessoes Ativas
            </CardTitle>
            <CardDescription>
              Gerencie dispositivos conectados a sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.device}</p>
                      {session.current && (
                        <Badge variant="default" className="text-xs">
                          Atual
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{session.location}</p>
                    <p className="text-xs text-gray-400">
                      {session.lastActive}
                    </p>
                  </div>
                </div>
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTerminateSession(session.id)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Encerrar
                  </Button>
                )}
              </div>
            ))}

            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleTerminateAllSessions}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Encerrar Todas as Outras Sessoes
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Isso ira desconectar todos os outros dispositivos da sua conta.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
