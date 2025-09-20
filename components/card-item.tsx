"use client";

import { Button } from "./ui/button";

interface Card {
  id: string;
  name: string;
  limit: number;
  availableLimit: number;
  invoice: number;
  dueDate: string;
}
import {
  Card as UICard,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Progress } from "./ui/progress";
import { CreditCard, Calendar, DollarSign } from "lucide-react";

interface CardItemProps {
  card: Card;
  onManageInvoices: () => void;
  manageInvoicesText: string;
}

export function CardItem({
  card,
  onManageInvoices,
  manageInvoicesText,
}: CardItemProps) {
  const usedPercentage =
    ((card.limit - card.availableLimit) / card.limit) * 100;
  const invoicePercentage = (card.invoice / card.limit) * 100;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <UICard className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          {card.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Limite Disponível</span>
            <span className="font-medium">
              {formatCurrency(card.availableLimit)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Limite Total</span>
            <span className="font-medium">{formatCurrency(card.limit)}</span>
          </div>
          <Progress value={usedPercentage} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {usedPercentage.toFixed(1)}% utilizado
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Fatura Atual</span>
            </div>
            <span className="font-medium text-red-600">
              {formatCurrency(card.invoice)}
            </span>
          </div>
          <Progress value={invoicePercentage} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Vencimento</span>
          </div>
          <span className="font-medium">{formatDate(card.dueDate)}</span>
        </div>

        <Button
          onClick={onManageInvoices}
          className="w-full bg-transparent"
          variant="outline"
        >
          {manageInvoicesText}
        </Button>
      </CardContent>
    </UICard>
  );
}
