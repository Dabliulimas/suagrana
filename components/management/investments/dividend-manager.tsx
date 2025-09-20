"use client";

import React, { useState } from "react";
import { generateStableId } from "../../../lib/utils/stable-id";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { DatePicker } from "../../ui/date-picker";
import { Calendar, DollarSign, TrendingUp } from "lucide-react";

interface Dividend {
  id: string;
  symbol: string;
  amount: number;
  date: string;
  type: "dividend" | "jcp";
}

interface DividendManagerProps {
  investments?: any[];
  onUpdate?: () => void;
}

export function DividendManager({
  investments = [],
  onUpdate,
}: DividendManagerProps) {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [newDividend, setNewDividend] = useState({
    symbol: "",
    amount: "",
    date: "",
    type: "dividend" as const,
  });

  const handleAddDividend = () => {
    if (!newDividend.symbol || !newDividend.amount || !newDividend.date) return;

    const dividend: Dividend = {
      id: generateStableId("dividend"),
      symbol: newDividend.symbol,
      amount: parseFloat(newDividend.amount),
      date: newDividend.date,
      type: newDividend.type,
    };

    setDividends((prev) => [...prev, dividend]);
    setNewDividend({ symbol: "", amount: "", date: "", type: "dividend" });
    onUpdate?.();
  };

  const totalDividends = dividends.reduce((sum, div) => sum + div.amount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gerenciador de Dividendos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="symbol">Símbolo</Label>
              <Input
                id="symbol"
                value={newDividend.symbol}
                onChange={(e) =>
                  setNewDividend((prev) => ({
                    ...prev,
                    symbol: e.target.value,
                  }))
                }
                placeholder="PETR4"
              />
            </div>
            <div>
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={newDividend.amount}
                onChange={(e) =>
                  setNewDividend((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                placeholder="0.50"
              />
            </div>
            <div>
              <Label htmlFor="date">Data</Label>
              <DatePicker
                id="date"
                value={newDividend.date}
                onChange={(value) =>
                  setNewDividend((prev) => ({ ...prev, date: value }))
                }
                placeholder="Selecionar data"
                maxDate={new Date()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddDividend} className="w-full">
                Adicionar
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              Total recebido: R$ {totalDividends.toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            {dividends.map((dividend) => (
              <div
                key={dividend.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{dividend.symbol}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(dividend.date).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    R$ {dividend.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {dividend.type}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {dividends.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum dividendo registrado ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DividendManager;
