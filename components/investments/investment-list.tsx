"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Eye,
  Plus,
  Minus,
  Building2,
  Calendar,
} from "lucide-react";
import { Investment, AssetType } from "../../lib/types/investments";
import {
  formatCurrency,
  formatPercentage,
  calculateCurrentValue,
} from "../../lib/utils/investment-calculations";
import { useInvestments } from "../../contexts/unified-context";
import { useSafeTheme } from "../../hooks/use-safe-theme";

interface InvestmentListProps {
  investments: Investment[];
}

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  stock: "Ação",
  fii: "FII",
  etf: "ETF",
  crypto: "Crypto",
  fixed_income: "Renda Fixa",
  fund: "Fundo",
  bdr: "BDR",
  option: "Opção",
  future: "Futuro",
  other: "Outro",
};

const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  stock: "bg-blue-100 text-blue-800",
  fii: "bg-green-100 text-green-800",
  etf: "bg-purple-100 text-purple-800",
  crypto: "bg-orange-100 text-orange-800",
  fixed_income: "bg-gray-100 text-gray-800",
  fund: "bg-indigo-100 text-indigo-800",
  bdr: "bg-pink-100 text-pink-800",
  option: "bg-yellow-100 text-yellow-800",
  future: "bg-red-100 text-red-800",
  other: "bg-slate-100 text-slate-800",
};

export function InvestmentList({ investments }: InvestmentListProps) {
  const { investments: allInvestments } = useInvestments();
  const { settings } = useSafeTheme();
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const getBrokerName = (brokerId: string) => {
    return "Corretora";
  };

  const getBrokerColor = (brokerId: string) => {
    return "#6B7280";
  };

  if (investments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Building2
                className={`h-8 w-8 ${settings.colorfulIcons ? "text-orange-600" : "text-muted-foreground"}`}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium">
                Nenhum investimento encontrado
              </h3>
              <p className="text-muted-foreground">
                Comece sua jornada de investimentos fazendo sua primeira compra
              </p>
            </div>
            <Button>
              <Plus
                className={`h-4 w-4 mr-2 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
              />
              Fazer primeira compra
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === "cards") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {investments.map((investment) => {
          const profitLoss = investment.profitLoss || 0;
          const profitLossPercentage = investment.profitLossPercentage || 0;
          const isProfit = profitLoss >= 0;

          return (
            <Card
              key={investment.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {investment.identifier}
                    </CardTitle>
                    {investment.name && (
                      <p className="text-sm text-muted-foreground">
                        {investment.name}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye
                          className={`h-4 w-4 mr-2 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                        />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Plus
                          className={`h-4 w-4 mr-2 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                        />
                        Comprar mais
                      </DropdownMenuItem>
                      {investment.status === "active" && (
                        <DropdownMenuItem>
                          <Minus
                            className={`h-4 w-4 mr-2 ${settings.colorfulIcons ? "text-red-600" : "text-muted-foreground"}`}
                          />
                          Vender
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={ASSET_TYPE_COLORS[investment.assetType]}>
                    {ASSET_TYPE_LABELS[investment.assetType]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getBrokerName(investment.brokerId)}
                  </Badge>
                  {investment.status === "closed" && (
                    <Badge variant="secondary">Zerado</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quantidade</p>
                    <p className="font-medium">
                      {(investment.totalQuantity || 0).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Preço Médio</p>
                    <p className="font-medium">
                      {formatCurrency(investment.averagePrice || 0)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Investido</p>
                    <p className="font-medium">
                      {formatCurrency(investment.totalInvested || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Atual</p>
                    <p className="font-medium">
                      {formatCurrency(calculateCurrentValue(investment))}
                    </p>
                  </div>
                </div>

                {investment.status === "active" && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Resultado
                      </span>
                      <div
                        className={`flex items-center gap-1 text-sm font-medium ${
                          isProfit ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isProfit ? (
                          <TrendingUp
                            className={`h-3 w-3 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                          />
                        ) : (
                          <TrendingDown
                            className={`h-3 w-3 ${settings.colorfulIcons ? "text-red-600" : "text-muted-foreground"}`}
                          />
                        )}
                        <span>{formatCurrency(Math.abs(profitLoss))}</span>
                        <span className="text-xs">
                          ({formatPercentage(profitLossPercentage)})
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Carteira de Investimentos</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              Tabela
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              Cards
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ativo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Corretora</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Preço Médio</TableHead>
                <TableHead className="text-right">Investido</TableHead>
                <TableHead className="text-right">Valor Atual</TableHead>
                <TableHead className="text-right">Resultado</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((investment) => {
                const profitLoss = investment.profitLoss || 0;
                const profitLossPercentage =
                  investment.profitLossPercentage || 0;
                const isProfit = profitLoss >= 0;

                return (
                  <TableRow key={investment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {investment.identifier}
                        </div>
                        {investment.name && (
                          <div className="text-sm text-muted-foreground">
                            {investment.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={ASSET_TYPE_COLORS[investment.assetType]}
                      >
                        {ASSET_TYPE_LABELS[investment.assetType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: getBrokerColor(
                              investment.brokerId,
                            ),
                          }}
                        />
                        <span className="text-sm">
                          {getBrokerName(investment.brokerId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {(investment.totalQuantity || 0).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(investment.averagePrice || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(investment.totalInvested || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(calculateCurrentValue(investment))}
                    </TableCell>
                    <TableCell className="text-right">
                      {investment.status === "active" ? (
                        <div
                          className={`flex items-center justify-end gap-1 ${
                            isProfit ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isProfit ? (
                            <TrendingUp
                              className={`h-3 w-3 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                            />
                          ) : (
                            <TrendingDown
                              className={`h-3 w-3 ${settings.colorfulIcons ? "text-red-600" : "text-muted-foreground"}`}
                            />
                          )}
                          <span className="text-sm font-medium">
                            {formatCurrency(Math.abs(profitLoss))}
                          </span>
                          <span className="text-xs">
                            ({formatPercentage(profitLossPercentage)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          investment.status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {investment.status === "active" ? "Ativo" : "Zerado"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal
                              className={`h-4 w-4 ${settings.colorfulIcons ? "text-gray-600" : "text-muted-foreground"}`}
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye
                              className={`h-4 w-4 mr-2 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                            />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Plus
                              className={`h-4 w-4 mr-2 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                            />
                            Comprar mais
                          </DropdownMenuItem>
                          {investment.status === "active" && (
                            <DropdownMenuItem>
                              <Minus
                                className={`h-4 w-4 mr-2 ${settings.colorfulIcons ? "text-red-600" : "text-muted-foreground"}`}
                              />
                              Vender
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Calendar
                              className={`h-4 w-4 mr-2 ${settings.colorfulIcons ? "text-purple-600" : "text-muted-foreground"}`}
                            />
                            Ver histórico
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
