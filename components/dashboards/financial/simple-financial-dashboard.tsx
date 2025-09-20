"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { useSafeTheme } from "../../../hooks/use-safe-theme";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  CreditCard,
  Plus,
  Eye,
} from "lucide-react";

export function SimpleFinancialDashboard() {
  const { settings } = useSafeTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Suas últimas movimentações financeiras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp
                    className={`h-4 w-4 ${isMounted && settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                  />
                </div>
                <div>
                  <p className="font-medium">Salário</p>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">+R$ 5.000,00</p>
                <Badge variant="secondary">Receita</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Supermercado</p>
                  <p className="text-sm text-muted-foreground">Ontem</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-red-600">-R$ 250,00</p>
                <Badge variant="outline">Despesa</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Investimento</p>
                  <p className="text-sm text-muted-foreground">2 dias atrás</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-blue-600">-R$ 1.000,00</p>
                <Badge variant="secondary">Investimento</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Metas Financeiras</CardTitle>
          <CardDescription>
            Acompanhe o progresso das suas metas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Reserva de Emergência</span>
                <span className="text-sm text-muted-foreground">
                  R$ 8.000 / R$ 10.000
                </span>
              </div>
              <Progress value={80} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Viagem para Europa</span>
                <span className="text-sm text-muted-foreground">
                  R$ 3.500 / R$ 15.000
                </span>
              </div>
              <Progress value={23} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Novo Carro</span>
                <span className="text-sm text-muted-foreground">
                  R$ 12.000 / R$ 50.000
                </span>
              </div>
              <Progress value={24} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SimpleFinancialDashboard;
