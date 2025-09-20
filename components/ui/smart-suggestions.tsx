"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../../lib/logger";
import { Button } from "./button";
import { Badge } from "./badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Separator } from "./separator";
import {
  Lightbulb,
  TrendingUp,
  Tag as TagIcon,
  CheckCircle,
  X,
  Sparkles,
  Brain,
} from "lucide-react";
import {
  smartSuggestions,
  type SmartSuggestion,
} from "../../lib/smart-suggestions";
import { toast } from "sonner";

interface SmartSuggestionsProps {
  description: string;
  onCategorySelect: (category: string) => void;
  onTagsSelect: (tags: string[]) => void;
  onAutoNoteSelect?: (note: string) => void;
  currentCategory?: string;
  currentTags?: string[];
  className?: string;
}

export function SmartSuggestionsComponent({
  description,
  onCategorySelect,
  onTagsSelect,
  onAutoNoteSelect,
  currentCategory,
  currentTags = [],
  className = "",
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(
    new Set(),
  );
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (description && description.length >= 3) {
      setIsLoading(true);

      // Pequeno delay para evitar muitas chamadas durante a digitação
      const timer = setTimeout(() => {
        try {
          const newSuggestions = smartSuggestions.getSuggestions(description);
          setSuggestions(newSuggestions);
          setAppliedSuggestions(new Set());
        } catch (error) {
          logComponents.error("Erro ao obter sugestões:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setAppliedSuggestions(new Set());
    }
  }, [description]);

  const handleApplySuggestion = (
    suggestion: SmartSuggestion,
    index: number,
  ) => {
    try {
      // Aplica categoria se sugerida e diferente da atual
      if (suggestion.category && suggestion.category !== currentCategory) {
        onCategorySelect(suggestion.category);
      }

      // Aplica tags se sugeridas e não já presentes
      if (suggestion.tags && suggestion.tags.length > 0) {
        const newTags = suggestion.tags.filter(
          (tag) => !currentTags.includes(tag),
        );
        if (newTags.length > 0) {
          onTagsSelect([...currentTags, ...newTags]);
        }
      }

      // Aplica observação automática se disponível
      if (suggestion.autoNote && onAutoNoteSelect) {
        onAutoNoteSelect(suggestion.autoNote);
      }

      // Marca como aplicada
      setAppliedSuggestions((prev) => new Set([...prev, index]));

      toast.success("Sugestão aplicada com sucesso!", {
        description: suggestion.reason,
      });
    } catch (error) {
      logComponents.error("Erro ao aplicar sugestão:", error);
      toast.error("Erro ao aplicar sugestão");
    }
  };

  const handleApplyAllSuggestions = () => {
    try {
      // Aplica a categoria da sugestão com maior confiança
      const bestCategorySuggestion = suggestions
        .filter((s) => s.category && s.category !== currentCategory)
        .sort((a, b) => b.confidence - a.confidence)[0];

      if (bestCategorySuggestion) {
        onCategorySelect(bestCategorySuggestion.category!);
      }

      // Coleta todas as tags sugeridas (sem duplicatas)
      const allSuggestedTags = [
        ...new Set(suggestions.flatMap((s) => s.tags || [])),
      ].filter((tag) => !currentTags.includes(tag));

      if (allSuggestedTags.length > 0) {
        onTagsSelect([...currentTags, ...allSuggestedTags]);
      }

      // Aplica a observação automática da sugestão com maior confiança
      const bestAutoNoteSuggestion = suggestions
        .filter((s) => s.autoNote)
        .sort((a, b) => b.confidence - a.confidence)[0];

      if (
        bestAutoNoteSuggestion &&
        bestAutoNoteSuggestion.autoNote &&
        onAutoNoteSelect
      ) {
        onAutoNoteSelect(bestAutoNoteSuggestion.autoNote);
      }

      // Marca todas como aplicadas
      setAppliedSuggestions(new Set(suggestions.map((_, index) => index)));

      toast.success("Todas as sugestões foram aplicadas!", {
        description: `${suggestions.length} sugestões processadas`,
      });
    } catch (error) {
      logComponents.error("Erro ao aplicar todas as sugestões:", error);
      toast.error("Erro ao aplicar sugestões");
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8)
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
    if (confidence >= 0.6)
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
    return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return "Alta confiança";
    if (confidence >= 0.6) return "Média confiança";
    return "Baixa confiança";
  };

  if (!description || description.length < 3) {
    return (
      <Card className={`border-dashed border-gray-300 ${className}`}>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center text-gray-500">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Digite uma descrição para ver sugestões inteligentes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-6">
          <div className="text-center">
            <Sparkles className="w-6 h-6 mx-auto mb-2 animate-pulse text-blue-500" />
            <p className="text-sm text-gray-600">
              Analisando e gerando sugestões...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardContent className="flex items-center justify-center py-4">
          <div className="text-center text-gray-500">
            <Lightbulb className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Nenhuma sugestão encontrada para esta descrição
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-blue-200 bg-blue-50/30 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">
              Sugestões Inteligentes
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs"
            >
              {showDetails ? "Ocultar" : "Detalhes"}
            </Button>
            {suggestions.length > 1 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleApplyAllSuggestions}
                className="text-xs bg-blue-600 hover:bg-blue-700"
                disabled={appliedSuggestions.size === suggestions.length}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Aplicar Todas
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-blue-700">
          Baseado em {suggestions.length} sugestão
          {suggestions.length > 1 ? "ões" : ""} encontrada
          {suggestions.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const isApplied = appliedSuggestions.has(index);

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                isApplied
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {suggestion.category && (
                      <Badge variant="secondary" className="text-xs">
                        📁 {suggestion.category}
                      </Badge>
                    )}

                    {suggestion.tags && suggestion.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <TagIcon className="w-3 h-3 text-gray-500" />
                        {suggestion.tags.map((tag, tagIndex) => (
                          <Badge
                            key={tagIndex}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Badge
                      className={`text-xs border ${getConfidenceColor(suggestion.confidence)}`}
                    >
                      {getConfidenceText(suggestion.confidence)} (
                      {Math.round(suggestion.confidence * 100)}%)
                    </Badge>
                  </div>

                  {showDetails && (
                    <div className="space-y-1 mt-1">
                      <p className="text-xs text-gray-600">
                        💡 {suggestion.reason}
                      </p>
                      {suggestion.autoNote && (
                        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                          📝 <strong>Observação sugerida:</strong>{" "}
                          {suggestion.autoNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  variant={isApplied ? "secondary" : "default"}
                  size="sm"
                  onClick={() => handleApplySuggestion(suggestion, index)}
                  disabled={isApplied}
                  className={`text-xs shrink-0 ${
                    isApplied
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aplicado
                    </>
                  ) : (
                    "Aplicar"
                  )}
                </Button>
              </div>
            </div>
          );
        })}

        {showDetails && suggestions.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="text-xs text-gray-500 space-y-1">
              <p className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                As sugestões são baseadas em padrões de transações anteriores e
                regras inteligentes
              </p>
              <p>💡 Quanto maior a confiança, mais precisa é a sugestão</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SmartSuggestionsComponent;
