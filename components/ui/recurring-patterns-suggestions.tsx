"use client";

import React, { useState, useEffect, useCallback } from "react";
import { logComponents } from "../../lib/logger";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Badge } from "./badge";
import { Separator } from "./separator";
import {
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  X,
  Lightbulb,
  Calendar,
  DollarSign,
} from "lucide-react";
import { smartSuggestions } from "../../lib/smart-suggestions";
import { useTransactions } from "../../contexts/unified-context";
import { toast } from "../../hooks/use-toast";

interface RecurringPattern {
  pattern: string;
  frequency: number;
  suggestion: string;
}

interface RecurringPatternsSuggestionsProps {
  onCreateRecurring?: (pattern: string) => void;
  className?: string;
}

export function RecurringPatternsSuggestions({
  onCreateRecurring,
  className = "",
}: RecurringPatternsSuggestionsProps) {
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissedPatterns, setDismissedPatterns] = useState<Set<string>>(
    new Set(),
  );
  const [showAll, setShowAll] = useState(false);
  const { data: transactions = [] } = useTransactions();

  // Carrega padrões dispensados do localStorage apenas uma vez
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const dismissed = localStorage.getItem("dismissed-recurring-patterns");
    if (dismissed) {
      try {
        setDismissedPatterns(new Set(JSON.parse(dismissed)));
      } catch (error) {
        logComponents.error("Erro ao carregar padrões dispensados:", error);
        // Se houver erro no JSON, limpa o localStorage
        localStorage.removeItem("dismissed-recurring-patterns");
      }
    }
  }, []); // Executa apenas uma vez

  const loadPatterns = useCallback(async () => {
    setIsLoading(true);
    try {
      const detectedPatterns = smartSuggestions.detectRecurringPatterns(transactions);
      setPatterns(detectedPatterns);
    } catch (error) {
      logComponents.error("Erro ao detectar padrões recorrentes:", error);
      toast({
        title: "Erro ao carregar sugestões",
        description: "Não foi possível detectar padrões recorrentes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [transactions]);

  // Detecta padrões quando as transações mudarem
  useEffect(() => {
    if (transactions.length > 0) {
      loadPatterns();
    }
  }, [transactions, loadPatterns]);

  const handleDismissPattern = (pattern: string) => {
    const newDismissed = new Set([...dismissedPatterns, pattern]);
    setDismissedPatterns(newDismissed);
    localStorage.setItem(
      "dismissed-recurring-patterns",
      JSON.stringify(Array.from(newDismissed)),
    );

    toast({
      title: "Sugestão dispensada",
      description: "Esta sugestão não será mais exibida.",
    });
  };

  const handleCreateRecurring = (pattern: string) => {
    if (onCreateRecurring) {
      onCreateRecurring(pattern);
    }

    toast({
      title: "Transação recorrente criada",
      description: `Padrão "${pattern}" configurado como recorrente.`,
    });
  };

  const visiblePatterns = patterns.filter(
    (p) => !dismissedPatterns.has(p.pattern),
  );
  const displayedPatterns = showAll
    ? visiblePatterns
    : visiblePatterns.slice(0, 3);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Analisando padrões...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (visiblePatterns.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Padrões Recorrentes
          </CardTitle>
          <CardDescription>
            Nenhum padrão recorrente detectado ainda. Continue registrando
            transações para receber sugestões inteligentes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Sugestões de Automação
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadPatterns}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </CardTitle>
        <CardDescription>
          Detectamos padrões recorrentes em suas transações. Considere
          automatizá-los.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {displayedPatterns.map((pattern, index) => (
          <div key={pattern.pattern} className="space-y-3">
            <div className="flex items-start justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800 truncate">
                    {pattern.pattern}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-blue-700 bg-blue-100"
                  >
                    {pattern.frequency}x
                  </Badge>
                </div>

                <p className="text-sm text-blue-700">{pattern.suggestion}</p>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleCreateRecurring(pattern.pattern)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Criar Recorrente
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissPattern(pattern.pattern)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Dispensar
                  </Button>
                </div>
              </div>
            </div>

            {index < displayedPatterns.length - 1 && <Separator />}
          </div>
        ))}

        {visiblePatterns.length > 3 && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? "Mostrar menos"
                : `Ver mais ${visiblePatterns.length - 3} sugestões`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecurringPatternsSuggestions;
