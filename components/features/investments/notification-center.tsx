"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  Bell,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertTriangle,
  Target,
  RefreshCw,
} from "lucide-react";
import { useInvestments } from "../../../contexts/unified-context";
import { Investment, AssetType } from "../../../lib/types/investments";
import { formatCurrency, formatPercentage, formatDate } from "../../../lib/utils";
import { toast } from "sonner";

interface InvestmentAlert {
  id: string;
  investmentId: string;
  identifier: string;
  name: string;
  type:
    | "price_above"
    | "price_below"
    | "dividend_date"
    | "volume_spike"
    | "performance"
    | "rebalancing";
  condition: {
    value?: number;
    percentage?: number;
    date?: Date;
  };
  isActive: boolean;
  triggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  message: string;
  priority: "low" | "medium" | "high";
}

interface AlertFormData {
  investmentId: string;
  type: InvestmentAlert["type"];
  message: string;
  priority: InvestmentAlert["priority"];
}

const alertTypeConfig = {
  price_above: {
    label: "Preço Acima",
    icon: TrendingUp,
    color: "text-green-600",
  },
  price_below: {
    label: "Preço Abaixo",
    icon: TrendingDown,
    color: "text-red-600",
  },
  dividend_date: {
    label: "Data de Dividendo",
    icon: Calendar,
    color: "text-blue-600",
  },
  volume_spike: {
    label: "Pico de Volume",
    icon: DollarSign,
    color: "text-yellow-600",
  },
  performance: { label: "Performance", icon: Target, color: "text-purple-600" },
  rebalancing: {
    label: "Rebalanceamento",
    icon: RefreshCw,
    color: "text-indigo-600",
  },
};

export function InvestmentNotificationCenter() {
  const { state } = useInvestments();
  const [alerts, setAlerts] = useState<InvestmentAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<InvestmentAlert | null>(
    null,
  );
  const [formData, setFormData] = useState<AlertFormData>({
    investmentId: "",
    type: "price_above",
    message: "",
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);

  const activeAlerts = alerts.filter((alert) => alert.isActive);
  const triggeredAlerts = alerts.filter((alert) => alert.triggered);

  const handleCreateAlert = async () => {
    if (!formData.investmentId || !formData.message) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/investments/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Falha ao criar alerta");
      const data = await res.json();
      setAlerts((prev) =>
        Array.isArray(prev)
          ? [data.alert || data, ...prev]
          : [data.alert || data],
      );
      setShowForm(false);
      setFormData({
        investmentId: "",
        type: "price_above",
        message: "",
        priority: "medium",
      });
      toast.success("Alerta criado com sucesso!");
    } catch (e) {
      toast.error("Erro ao criar alerta");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/investments/alerts/${alertId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir alerta");
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
      toast.success("Alerta removido com sucesso!");
    } catch {
      toast.error("Erro ao remover alerta");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/investments/alerts");
        const data = res.ok ? await res.json() : { items: [] };
        setAlerts(Array.isArray(data.items) ? data.items : []);
      } catch {
        setAlerts([]);
      }
    })();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const AlertCard = ({ alert }: { alert: InvestmentAlert }) => {
    const config = alertTypeConfig[alert.type];
    const IconComponent = config.icon;

    return (
      <Card
        className={`transition-all duration-200 hover:shadow-md ${
          alert.triggered ? "border-green-200 bg-green-50" : "border-gray-200"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg bg-gray-100`}>
                <IconComponent className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900">
                    {alert.identifier}
                  </h4>
                  <Badge className={getPriorityColor(alert.priority)}>
                    {alert.priority === "high"
                      ? "Alta"
                      : alert.priority === "medium"
                        ? "Média"
                        : "Baixa"}
                  </Badge>
                  {alert.triggered && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Disparado
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{alert.name}</p>
                <p className="text-sm text-gray-700">{alert.message}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>Criado: {formatDate(alert.createdAt)}</span>
                  {alert.triggeredAt && (
                    <span>Disparado: {formatDate(alert.triggeredAt)}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingAlert(alert);
                  setFormData({
                    investmentId: alert.investmentId,
                    type: alert.type,
                    message: alert.message,
                    priority: alert.priority,
                  });
                  setShowForm(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteAlert(alert.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Alertas de Investimentos
          </h2>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Alerta</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                Alertas Ativos
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {activeAlerts.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                Disparados
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {triggeredAlerts.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {alerts.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAlert ? "Editar Alerta" : "Criar Novo Alerta"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investimento
                </label>
                <Input
                  placeholder="Ex: PETR4, VALE3"
                  value={formData.investmentId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      investmentId: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Alerta
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as InvestmentAlert["type"],
                    }))
                  }
                >
                  {Object.entries(alertTypeConfig).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <Input
                placeholder="Descreva o alerta"
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as InvestmentAlert["priority"],
                  }))
                }
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleCreateAlert} disabled={loading}>
                {loading
                  ? "Criando..."
                  : editingAlert
                    ? "Atualizar"
                    : "Criar Alerta"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingAlert(null);
                  setFormData({
                    investmentId: "",
                    type: "price_above",
                    message: "",
                    priority: "medium",
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Ativos ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="triggered">
            Disparados ({triggeredAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="all">Todos ({alerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum alerta ativo
                </h3>
                <p className="text-gray-600">
                  Crie seu primeiro alerta para monitorar seus investimentos.
                </p>
              </CardContent>
            </Card>
          ) : (
            activeAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          )}
        </TabsContent>

        <TabsContent value="triggered" className="space-y-4">
          {triggeredAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum alerta disparado
                </h3>
                <p className="text-gray-600">
                  Os alertas disparados aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            triggeredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum alerta criado
                </h3>
                <p className="text-gray-600">
                  Crie seu primeiro alerta para começar.
                </p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export with the same name for compatibility
