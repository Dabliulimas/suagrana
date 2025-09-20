"use client";

import React, { useState, useEffect, useMemo } from "react";
import { logComponents } from "../../lib/logger";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { toast } from "sonner";
import { Separator } from "./separator";
import { CardHeader, CardTitle, CardDescription } from "./card";
import {
  Lightbulb,
  TrendingUp,
  Calendar,
  Zap,
  Sparkles,
  Repeat,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Clock,
  Tag,
} from "lucide-react";
import { type AutoFillSuggestion } from "../../lib/auto-fill-engine";
import { useAutoFill } from "../../hooks/use-auto-fill";
import { useDebouncedCallback } from "../../hooks/use-debounce";

interface AutoFillSuggestionsProps {
  description: string;
  onApplySuggestion?: (suggestion: AutoFillSuggestion) => void;
  onDescriptionChange?: (description: string) => void;
  className?: string;
  maxSuggestions?: number;
}

export function AutoFillSuggestions({
  description,
  onApplySuggestion,
  onDescriptionChange,
  className = "",
  maxSuggestions = 5,
}: AutoFillSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AutoFillSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedSuggestion, setAppliedSuggestion] = useState<string | null>(
    null,
  );
  const [showDetails, setShowDetails] = useState(false);
  const { getSuggestions } = useAutoFill();

  // Debounce otimizado para melhor responsividade
  const debouncedGetSuggestions = useDebouncedCallback((desc: string) => {
    if (desc.length >= 2) {
      setIsLoading(true);
      try {
        // Usa requestAnimationFrame para não bloquear a UI
        requestAnimationFrame(() => {
          const newSuggestions = getSuggestions(desc);
          setSuggestions(newSuggestions.slice(0, maxSuggestions));
          setIsLoading(false);
        });
      } catch (error) {
        logComponents.error("Erro ao obter sugestões:", error);
        setSuggestions([]);
        setIsLoading(false);
      }
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, 150); // Reduzido de 300ms para 150ms para melhor responsividade

  useEffect(() => {
    debouncedGetSuggestions(description);
  }, [description, debouncedGetSuggestions]);

  const handleApplySuggestion = (suggestion: AutoFillSuggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
      setAppliedSuggestion(suggestion.description);

      toast.success("Sugestão aplicada", {
        description: `Dados preenchidos automaticamente para "${suggestion.description}"`,
      });

      // Reset após 3 segundos
      setTimeout(() => setAppliedSuggestion(null), 3000);
    }
  };

  const handleUseDescription = (suggestionDesc: string) => {
    if (onDescriptionChange) {
      onDescriptionChange(suggestionDesc);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-100";
    if (confidence >= 0.6) return "text-blue-600 bg-blue-100";
    if (confidence >= 0.4) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };

  const getRecurringBadge = (suggestion: AutoFillSuggestion) => {
    if (!suggestion.isRecurring) return null;

    const patternLabels = {
      weekly: "Semanal",
      monthly: "Mensal",
      yearly: "Anual",
    };

    return (
      <Badge
        variant="outline"
        className="text-purple-600 border-purple-200 bg-purple-50"
      >
        <Repeat className="w-3 h-3 mr-1" />
        {suggestion.recurringPattern
          ? patternLabels[suggestion.recurringPattern]
          : "Recorrente"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Analisando padrões...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            Sugestões Inteligentes
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? "Menos detalhes" : "Mais detalhes"}
          </Button>
        </CardTitle>
        <CardDescription className="text-sm">
          Baseado em {suggestions[0]?.frequency || 0} transações similares
          anteriores
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={`${suggestion.description}-${index}`} className="space-y-2">
            <div className="flex items-start justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-sm transition-shadow">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-blue-900 truncate max-w-[200px]">
                    {suggestion.description}
                  </span>

                  <Badge
                    variant="secondary"
                    className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}
                  >
                    {Math.round(suggestion.confidence * 100)}% confiança
                  </Badge>

                  {getRecurringBadge(suggestion)}

                  <Badge variant="outline" className="text-xs">
                    {suggestion.frequency}x usado
                  </Badge>
                </div>

                {showDetails && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Valor médio: {formatCurrency(suggestion.averageAmount)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Último uso:{" "}
                      {new Date(suggestion.lastUsed).toLocaleDateString(
                        "pt-BR",
                      )}
                    </div>
                    {suggestion.nextExpectedDate && (
                      <div className="flex items-center gap-1 col-span-2">
                        <Clock className="w-3 h-3" />
                        Próxima esperada:{" "}
                        {new Date(
                          suggestion.nextExpectedDate,
                        ).toLocaleDateString("pt-BR")}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleApplySuggestion(suggestion)}
                    disabled={appliedSuggestion === suggestion.description}
                    className="bg-blue-600 hover:bg-blue-700 text-xs h-7"
                  >
                    {appliedSuggestion === suggestion.description ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aplicado
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-1" />
                        Preencher Tudo
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUseDescription(suggestion.description)}
                    className="text-blue-600 hover:text-blue-800 text-xs h-7"
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Usar Descrição
                  </Button>
                </div>

                {showDetails && (
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    <span className="text-xs text-blue-600">Categoria:</span>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.category}
                    </Badge>
                    {suggestion.tags.length > 0 && (
                      <>
                        <span className="text-xs text-blue-600 ml-2">
                          Tags:
                        </span>
                        {suggestion.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            <Tag className="w-2 h-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {suggestion.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{suggestion.tags.length - 3} mais
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {index < suggestions.length - 1 && <Separator />}
          </div>
        ))}

        {showDetails && (
          <>
            <Separator className="my-3" />
            <div className="text-xs text-gray-500 space-y-1">
              <p className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Sugestões baseadas em padrões de receitas anteriores
              </p>
              <p>💡 Maior confiança = padrão mais consistente e frequente</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Função de debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default AutoFillSuggestions;
