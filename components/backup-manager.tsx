"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { useToast } from "../hooks/use-toast";
import {
  Download,
  Upload,
  Cloud,
  HardDrive,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { localDataService } from "../lib/services/local-data-service";

interface BackupData {
  accounts: any[];
  transactions: any[];
  goals: any[];
  trips: any[];
  investments: any[];
  settings: any;
  timestamp: string;
  version: string;
}

export function BackupManager() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const { toast } = useToast();

  const exportData = async () => {
    setIsExporting(true);
    try {
      const backupData: BackupData = localDataService.getDataExport();

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `suagrana-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLastBackup(new Date().toLocaleString());
      toast({
        title: "Backup criado com sucesso",
        description: "Seus dados foram exportados com segurança.",
      });
    } catch (error) {
      toast({
        title: "Erro ao criar backup",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);

      // Validar estrutura do backup
      if (!backupData.timestamp || !backupData.version) {
        throw new Error("Arquivo de backup inválido");
      }

      // Restaurar dados
      localDataService.importData(backupData);

      toast({
        title: "Backup restaurado com sucesso",
        description: "Seus dados foram importados. A página será recarregada.",
      });

      // Recarregar página após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast({
        title: "Erro ao restaurar backup",
        description: "Arquivo inválido ou corrompido.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Limpar input
      event.target.value = "";
    }
  };

  const getDataSize = () => {
    return localDataService.getDataSize();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup Local
          </CardTitle>
          <CardDescription>
            Exporte e importe seus dados financeiros com segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Informações do Sistema</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  Tamanho dos dados:{" "}
                  <Badge variant="outline">{getDataSize()}</Badge>
                </div>
                {lastBackup && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Último backup: {lastBackup}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Ações de Backup</h4>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={exportData}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isExporting ? "Exportando..." : "Exportar Dados"}
                </Button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isImporting}
                  />
                  <Button
                    variant="outline"
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isImporting ? "Importando..." : "Importar Dados"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Importante:
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Ao importar um backup, todos os dados atuais serão
                  substituídos. Certifique-se de fazer um backup dos dados
                  atuais antes de importar.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
