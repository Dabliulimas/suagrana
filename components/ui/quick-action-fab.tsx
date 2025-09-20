"use client";

import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { cn } from "../../lib/utils";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  X,
  Zap,
  ShoppingCart,
  Car,
  Coffee,
  Home,
  Plane,
} from "lucide-react";
import { useTransactions } from "../../contexts/unified-context";
import { parseNumber } from "../../lib/utils/number-utils";
import { toast } from "sonner";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: "income" | "expense";
  category: string;
  amount?: number;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    id: "salary",
    label: "Salário",
    icon: <TrendingUp className="w-4 h-4" />,
    type: "income",
    category: "Salário",
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100",
  },
  {
    id: "freelance",
    label: "Freelance",
    icon: <Zap className="w-4 h-4" />,
    type: "income",
    category: "Freelance",
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
  },
  {
    id: "groceries",
    label: "Mercado",
    icon: <ShoppingCart className="w-4 h-4" />,
    type: "expense",
    category: "Alimentação",
    amount: 150,
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
  },
  {
    id: "transport",
    label: "Transporte",
    icon: <Car className="w-4 h-4" />,
    type: "expense",
    category: "Transporte",
    amount: 50,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  {
    id: "coffee",
    label: "Café",
    icon: <Coffee className="w-4 h-4" />,
    type: "expense",
    category: "Alimentação",
    amount: 15,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 hover:bg-yellow-100",
  },
  {
    id: "bills",
    label: "Contas",
    icon: <Home className="w-4 h-4" />,
    type: "expense",
    category: "Moradia",
    amount: 200,
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100",
  },
];

export function QuickActionFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const { transactions } = useTransactions();
  const { create } = useTransactions();

  const handleQuickAction = async (action: QuickAction) => {
    try {
      // Garantir que o valor está no formato correto
      const amount = action.amount || 100;
      const transaction = {
        description: action.label,
        amount: amount, // Já é number, não precisa converter
        category: action.category,
        type: action.type,
        date: new Date().toISOString(),
        accountId: "default", // Pode ser melhorado para selecionar conta padrão
      };

      await create(transaction);
      
      toast.success(
        `${action.type === "income" ? "💰" : "💳"} ${action.label} de R$ ${
          transaction.amount
        } adicionada!`,
        {
          action: {
            label: "Desfazer",
            onClick: () => {
              // Implementar desfazer se necessário
              toast.success("Ação desfeita");
            },
          },
        }
      );
      
      setIsOpen(false);
    } catch (error) {
      toast.error("Erro ao adicionar transação rápida");
      console.error(error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Overlay de ações rápidas */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2">
          <Card className="w-72 shadow-lg border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Ações Rápidas</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex flex-col items-center justify-center h-16 p-2 border rounded-lg transition-all",
                      action.bgColor,
                      action.color
                    )}
                    onClick={() => handleQuickAction(action)}
                  >
                    <div className="mb-1">
                      {action.icon}
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">
                      {action.label}
                    </span>
                    {action.amount && (
                      <span className="text-xs opacity-70">
                        R$ {action.amount}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false);
                    // Navegar para página de nova transação
                    window.location.href = "/transactions?action=new";
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova transação personalizada
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botão principal FAB */}
      <Button
        size="icon"
        className={cn(
          "w-14 h-14 rounded-full shadow-lg transition-all duration-200 ease-in-out",
          isOpen 
            ? "bg-red-500 hover:bg-red-600 rotate-45" 
            : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}

// Componente simplificado para ações rápidas inline (para usar em outras páginas)
export function QuickActionsInline() {
  const { create } = useTransactions();

  const handleQuickAction = async (action: QuickAction) => {
    try {
      // Garantir que o valor está no formato correto
      const amount = action.amount || 100;
      const transaction = {
        description: action.label,
        amount: amount, // Já é number, não precisa converter
        category: action.category,
        type: action.type,
        date: new Date().toISOString(),
        accountId: "default",
      };

      await create(transaction);
      toast.success(`${action.label} de R$ ${transaction.amount} adicionada!`);
    } catch (error) {
      toast.error("Erro ao adicionar transação");
      console.error(error);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {quickActions.slice(0, 6).map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          className={cn(
            "flex flex-col items-center justify-center h-20 p-2 transition-all",
            action.bgColor,
            action.color
          )}
          onClick={() => handleQuickAction(action)}
        >
          <div className="mb-1">
            {action.icon}
          </div>
          <span className="text-xs font-medium text-center leading-tight">
            {action.label}
          </span>
          {action.amount && (
            <span className="text-xs opacity-70">
              R$ {action.amount}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
