"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DollarSign,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Edit,
} from "lucide-react";
import {
  useIncomeSettings,
  type IncomeSettings,
} from "../hooks/use-income-settings";

interface IncomeConfigurationProps {
  className?: string;
  showTrigger?: boolean;
}

export function IncomeConfiguration({
  className,
  showTrigger = true,
}: IncomeConfigurationProps) {
  const {
    incomeSettings,
    saveIncomeSettings,
    getTotalMonthlyIncome,
    getIncomeStatus,
  } = useIncomeSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] =
    useState<Partial<IncomeSettings>>(incomeSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const success = saveIncomeSettings(formData);
    if (success) {
      setIsOpen(false);
    }
    setIsSaving(false);
  };

  const status = getIncomeStatus();
  const totalIncome = getTotalMonthlyIncome();

  const ConfigurationForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthlyIncome">Renda Principal Mensal *</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="monthlyIncome"
              type="number"
              placeholder="0,00"
              className="pl-10"
              value={formData.monthlyIncome || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthlyIncome: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <p className="text-xs text-gray-500">Salário, aposentadoria, etc.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalIncome">Renda Adicional</Label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="additionalIncome"
              type="number"
              placeholder="0,00"
              className="pl-10"
              value={formData.additionalIncome || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  additionalIncome: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <p className="text-xs text-gray-500">
            Freelances, investimentos, etc.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Frequência da Renda Adicional</Label>
        <Select
          value={formData.incomeFrequency}
          onValueChange={(value: any) =>
            setFormData({ ...formData, incomeFrequency: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="biweekly">Quinzenal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isEstimated"
          checked={formData.isEstimated}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isEstimated: checked })
          }
        />
        <Label htmlFor="isEstimated">Esta é uma estimativa</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          placeholder="Adicione detalhes sobre sua renda..."
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      {(formData.monthlyIncome || 0) + (formData.additionalIncome || 0) > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>
              Renda Total Mensal: R${" "}
              {(
                (formData.monthlyIncome || 0) +
                (formData.additionalIncome || 0) *
                  (formData.incomeFrequency === "weekly"
                    ? 4.33
                    : formData.incomeFrequency === "biweekly"
                      ? 2.17
                      : 1)
              ).toFixed(2)}
            </strong>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  if (!showTrigger) {
    return (
      <div className={className}>
        <ConfigurationForm />
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Configuração de Renda
              </CardTitle>
              <Badge className={status.color}>{status.message}</Badge>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configurar Renda Mensal</DialogTitle>
                  <DialogDescription>
                    Configure sua renda para análises financeiras mais precisas
                    e recomendações personalizadas.
                  </DialogDescription>
                </DialogHeader>
                <ConfigurationForm />
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {totalIncome > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Renda Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totalIncome.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Renda Principal</p>
                  <p className="text-xl font-semibold text-blue-600">
                    R$ {incomeSettings.monthlyIncome.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Renda Adicional</p>
                  <p className="text-xl font-semibold text-purple-600">
                    R$ {(totalIncome - incomeSettings.monthlyIncome).toFixed(2)}
                  </p>
                </div>
              </div>

              {incomeSettings.isEstimated && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Valores estimados. Atualize com dados precisos para análises
                    mais confiáveis.
                  </AlertDescription>
                </Alert>
              )}

              {incomeSettings.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Observações:</p>
                  <p className="text-sm">{incomeSettings.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure sua renda mensal para obter análises financeiras
                personalizadas e recomendações inteligentes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
