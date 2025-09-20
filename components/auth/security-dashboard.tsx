"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../../lib/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Shield,
  Key,
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  Lock,
} from "lucide-react";
import { auditLogger, type AuditLog } from "../../lib/audit";
import { useAuth } from "./auth-provider";
import { transactionManager } from "../../lib/transaction-manager";

export function SecurityDashboard() {
  const { user, hasPermission } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<AuditLog[]>([]);
  const [integrityCheck, setIntegrityCheck] = useState<{
    valid: boolean;
    issues: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = () => {
    const logs = auditLogger.getLogs();
    const security = auditLogger.getSecurityEvents();

    setAuditLogs(logs.slice(0, 100)); // Last 100 events
    setSecurityEvents(security.slice(0, 50)); // Last 50 security events
  };

  const runIntegrityCheck = async () => {
    setIsLoading(true);
    try {
      const result = await transactionManager.performIntegrityCheck();
      setIntegrityCheck(result);
    } catch (error) {
      logComponents.error("Integrity check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAuditLogs = (format: "json" | "csv") => {
    const data = auditLogger.exportLogs(format);
    const blob = new Blob([data], {
      type: format === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: AuditLog["severity"]) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getSeverityIcon = (severity: AuditLog["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <Eye className="w-4 h-4" />;
      case "low":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (!hasPermission("admin") && !hasPermission("security:read")) {
    return (
      <div className="p-6">
        <Alert>
          <Lock className="w-4 h-4" />
          <AlertDescription>
            Você não tem permissão para acessar o painel de segurança.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel de Segurança</h1>
          <p className="text-gray-600">Monitoramento e auditoria do sistema</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => exportAuditLogs("json")} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar JSON
          </Button>
          <Button onClick={() => exportAuditLogs("csv")} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eventos Críticos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {securityEvents.filter((e) => e.severity === "critical").length}
            </div>
            <p className="text-xs text-gray-600">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logins Hoje</CardTitle>
            <Key className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {
                securityEvents.filter(
                  (e) =>
                    e.action === "USER_LOGIN" &&
                    new Date(e.timestamp).toDateString() ===
                      new Date().toDateString(),
                ).length
              }
            </div>
            <p className="text-xs text-gray-600">Sucessos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tentativas Falhadas
            </CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {securityEvents.filter((e) => e.action === "LOGIN_FAILED").length}
            </div>
            <p className="text-xs text-gray-600">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integridade</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {integrityCheck?.valid ? "OK" : integrityCheck ? "ERRO" : "?"}
            </div>
            <Button
              onClick={runIntegrityCheck}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="text-xs p-0 h-auto"
            >
              {isLoading ? "Verificando..." : "Verificar"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Integrity Check Results */}
      {integrityCheck && !integrityCheck.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">
                Problemas de integridade detectados:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {integrityCheck.issues.map((issue, index) => (
                  <li key={`issue-${issue}-${index}`} className="text-sm">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="audit" className="w-full">
        <TabsList>
          <TabsTrigger value="audit">Log de Auditoria</TabsTrigger>
          <TabsTrigger value="security">Eventos de Segurança</TabsTrigger>
          <TabsTrigger value="financial">Transações Financeiras</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log de Auditoria Completo</CardTitle>
              <CardDescription>
                Todos os eventos do sistema ordenados por data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant={getSeverityColor(log.severity)}>
                        {getSeverityIcon(log.severity)}
                        <span className="ml-1">
                          {log.severity.toUpperCase()}
                        </span>
                      </Badge>
                      <div>
                        <p className="font-medium">
                          {log.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(log.timestamp).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {log.userId
                          ? `Usuário: ${log.userId.slice(0, 8)}...`
                          : "Sistema"}
                      </p>
                      {log.ipAddress && (
                        <p className="text-xs text-gray-500">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Segurança</CardTitle>
              <CardDescription>
                Logins, falhas de autenticação e alterações de permissão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {securityEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {getSeverityIcon(event.severity)}
                      </Badge>
                      <div>
                        <p className="font-medium">
                          {event.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.timestamp).toLocaleString("pt-BR")}
                        </p>
                        {event.details &&
                          Object.keys(event.details).length > 0 && (
                            <p className="text-xs text-gray-500">
                              {JSON.stringify(event.details)}
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {event.userId
                          ? `Usuário: ${event.userId.slice(0, 8)}...`
                          : "Sistema"}
                      </p>
                      {event.ipAddress && (
                        <p className="text-xs text-gray-500">
                          IP: {event.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações Financeiras</CardTitle>
              <CardDescription>
                Histórico de todas as operações financeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogger.getFinancialEvents().map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="default">
                        <Activity className="w-4 h-4 mr-1" />
                        FINANCEIRO
                      </Badge>
                      <div>
                        <p className="font-medium">
                          {event.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.timestamp).toLocaleString("pt-BR")}
                        </p>
                        {event.details.amount && (
                          <p className="text-sm font-medium text-green-600">
                            R$ {event.details.amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {event.userId
                          ? `Usuário: ${event.userId.slice(0, 8)}...`
                          : "Sistema"}
                      </p>
                      {event.details.transactionId && (
                        <p className="text-xs text-gray-500">
                          ID: {event.details.transactionId.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
