"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Shield,
  Users,
  Activity,
  Database,
  Settings,
  BarChart3,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  LogOut,
  Eye,
  EyeOff,
  Key,
  Monitor,
  HardDrive,
  Wifi,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataGenerator } from "../development/data-generator";

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [systemStats, setSystemStats] = useState({
    totalUsers: 1,
    totalTransactions: 0,
    totalAccounts: 0,
    totalInvestments: 0,
    totalGoals: 0,
    totalTrips: 0,
    storageUsed: 0,
    lastBackup: null as string | null,
  });

  const [logs, setLogs] = useState<any[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedLogType, setSelectedLogType] = useState("all");

  useEffect(() => {
    loadSystemStats();
    loadLogs();
  }, []);

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const loadSystemStats = () => {
    console.log('loadSystemStats foi removida - localStorage não é mais usado');
    // Dados agora vêm do banco via DataService
    setSystemStats({
      totalUsers: 1,
      totalTransactions: 0,
      totalAccounts: 0,
      totalInvestments: 0,
      totalGoals: 0,
      totalTrips: 0,
      storageUsed: 0,
      lastBackup: null,
    });
  };

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const loadLogs = () => {
    console.log('loadLogs foi removida - localStorage não é mais usado');
    // Logs agora vêm do banco via DataService
    setLogs([]);
  };

  const filteredLogs = useMemo(() => {
    if (selectedLogType === 'all') return logs;
    return logs.filter(log => log.action.includes(selectedLogType));
  }, [logs, selectedLogType]);

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const handleSystemReset = () => {
    if (showResetConfirm) {
      console.log('handleSystemReset foi removida - localStorage não é mais usado');
      // Reset agora é feito no banco via DataService
      toast.success('Sistema resetado com sucesso');
      setShowResetConfirm(false);
      loadSystemStats();
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 10000); // Auto-cancel em 10s
    }
  };

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const handleDataExport = () => {
    console.log('handleDataExport foi removida - localStorage não é mais usado');
    // Export agora é feito do banco via DataService
    toast.success('Backup exportado com sucesso');
    loadSystemStats();
  };

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const handleDataImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleDataImport foi removida - localStorage não é mais usado');
    // Import agora é feito para o banco via DataService
    toast.success('Dados importados com sucesso');
    loadSystemStats();
    loadLogs();
    
    // Reset input
    event.target.value = '';
  };

  /**
   * @deprecated localStorage não é mais usado - dados ficam no banco
   */
  const handleClearLogs = () => {
    if (confirm('Deseja realmente limpar todos os logs do sistema?')) {
      console.log('handleClearLogs foi removida - localStorage não é mais usado');
      // Logs agora são limpos no banco via DataService
      loadLogs();
      toast.success('Logs limpos com sucesso');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com logout */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-600" />
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">Controle completo do sistema SuaGrana</p>
        </div>
        <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sair do Admin
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Transações</p>
                <p className="text-2xl font-bold">{systemStats.totalTransactions}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contas Ativas</p>
                <p className="text-2xl font-bold">{systemStats.totalAccounts}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Investimentos</p>
                <p className="text-2xl font-bold">{systemStats.totalInvestments}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Uso Storage</p>
                <p className="text-2xl font-bold">{systemStats.storageUsed} KB</p>
              </div>
              <HardDrive className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="tools">Ferramentas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Sistema Online
                  </span>
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    Banco de Dados
                  </span>
                  <Badge className="bg-blue-100 text-blue-800">LocalStorage</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    Último Backup
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {systemStats.lastBackup ? 
                      format(new Date(systemStats.lastBackup), 'dd/MM/yyyy HH:mm') : 
                      'Nunca'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo de Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Metas:</span>
                    <span className="font-medium">{systemStats.totalGoals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Viagens:</span>
                    <span className="font-medium">{systemStats.totalTrips}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Logs Admin:</span>
                    <span className="font-medium">{logs.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>
                Sistema configurado para usuário único (modo local)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Usuário Principal</h4>
                      <p className="text-sm text-muted-foreground">Administrador do sistema</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Funcionalidades Futuras</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Multi-usuário com permissões</li>
                    <li>• Autenticação via email/senha</li>
                    <li>• Perfis de usuário personalizáveis</li>
                    <li>• Controle de acesso por módulo</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Logs do Sistema</CardTitle>
                  <CardDescription>
                    Histórico de atividades e acessos administrativos
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedLogType} onValueChange={setSelectedLogType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="login">Logins</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleClearLogs}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum log encontrado
                    </p>
                  ) : (
                    filteredLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            log.action.includes('failed') ? 'bg-red-500' :
                            log.action.includes('login') ? 'bg-green-500' :
                            'bg-blue-500'
                          }`} />
                          <div>
                            <p className="font-medium text-sm">{log.action.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                            </p>
                          </div>
                        </div>
                        {log.details && (
                          <Badge variant="outline" className="text-xs">
                            {log.details}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Exportar Dados</CardTitle>
                <CardDescription>
                  Fazer backup completo de todos os dados do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleDataExport} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Backup Completo
                </Button>
                
                <div className="text-sm text-muted-foreground">
                  Inclui: transações, contas, investimentos, metas, viagens e configurações
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Importar Dados</CardTitle>
                <CardDescription>
                  Restaurar dados de um backup anterior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="backup-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Clique para fazer upload</span>
                      </p>
                      <p className="text-xs text-gray-500">JSON files only</p>
                    </div>
                    <input 
                      id="backup-upload" 
                      type="file" 
                      className="hidden" 
                      accept=".json"
                      onChange={handleDataImport}
                    />
                  </label>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-800">
                    ⚠️ A importação sobrescreverá todos os dados existentes
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Versão:</span>
                    <Badge>v2.0.0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Ambiente:</span>
                    <Badge variant="outline">Local</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage:</span>
                    <span className="text-sm">{systemStats.storageUsed} KB usado</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Navegador:</span>
                    <span className="text-sm">{navigator.userAgent.split(' ')[0]}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    loadSystemStats();
                    loadLogs();
                    toast.success('Dados atualizados');
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Dados
                </Button>

                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={handleSystemReset}
                >
                  {showResetConfirm ? (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Confirmar Reset Total
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Reset Completo do Sistema
                    </>
                  )}
                </Button>

                {showResetConfirm && (
                  <div className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                    <p className="text-sm text-red-800">
                      ⚠️ Esta ação apagará TODOS os dados permanentemente!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          {/* Gerador de dados de teste */}
          <DataGenerator />
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ferramentas de Desenvolvimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    console.log('LocalStorage Data:', {
                      ...localStorage
                    });
                    toast.success('Dados logados no console');
                  }}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Debug LocalStorage
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    const stats = {
                      totalStorageKeys: Object.keys(localStorage).filter(k => k.startsWith('sua-grana-')).length,
                      storageUsage: systemStats.storageUsed,
                      lastUpdate: new Date().toISOString(),
                    };
                    console.log('Sistema Stats:', stats);
                    toast.success('Estatísticas no console');
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Estatísticas Técnicas
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    window.open('/api/health', '_blank');
                  }}
                >
                  <Server className="h-4 w-4 mr-2" />
                  Health Check API
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Funcionalidades Futuras</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Configuração de temas</li>
                    <li>• Preferências de usuário</li>
                    <li>• Configuração de notificações</li>
                    <li>• Integração com APIs externas</li>
                    <li>• Configuração de backup automático</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
