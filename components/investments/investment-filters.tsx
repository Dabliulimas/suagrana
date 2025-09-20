"use client";

import React from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { useInvestments } from "../../contexts/unified-context";
import { AssetType } from "../../lib/types/investments";
import { useSafeTheme } from "../../hooks/use-safe-theme";

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: "stock", label: "Ações" },
  { value: "fii", label: "Fundos Imobiliários" },
  { value: "etf", label: "ETFs" },
  { value: "crypto", label: "Criptomoedas" },
  { value: "fixed_income", label: "Renda Fixa" },
  { value: "fund", label: "Fundos de Investimento" },
  { value: "bdr", label: "BDRs" },
  { value: "option", label: "Opções" },
  { value: "future", label: "Futuros" },
  { value: "other", label: "Outros" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "closed", label: "Zerados" },
];

export function InvestmentFilters() {
  const { investments } = useInvestments();
  const { settings } = useSafeTheme();

  // Mock temporário para filtros
  const filters = { status: "active" };
  const brokers = [];

  const handleFilterChange = (key: string, value: string | undefined) => {
    // Implementação temporária - não faz nada por enquanto
    console.log("Filter change:", key, value);
  };

  const clearFilters = () => {
    // Implementação temporária - não faz nada por enquanto
    console.log("Clear filters");
  };

  const hasActiveFilters = false; // Temporário

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            <X
              className={`h-4 w-4 mr-1 ${settings.colorfulIcons ? "text-red-500" : ""}`}
            />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Busca por nome/ticker */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Nome ou ticker..."
            value={filters.searchTerm || ""}
            onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
          />
        </div>

        {/* Tipo de Ativo */}
        <div className="space-y-2">
          <Label>Tipo de Ativo</Label>
          <Select
            value={filters.assetType || ""}
            onValueChange={(value) => handleFilterChange("assetType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os tipos</SelectItem>
              {ASSET_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Corretora */}
        <div className="space-y-2">
          <Label>Corretora</Label>
          <Select
            value={filters.brokerId || ""}
            onValueChange={(value) => handleFilterChange("brokerId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as corretoras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as corretoras</SelectItem>
              {brokers.map((broker) => (
                <SelectItem key={broker.id} value={broker.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: broker.color }}
                    />
                    {broker.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status || "active"}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Indicadores de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.searchTerm && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
              <span>Busca: {filters.searchTerm}</span>
              <button
                onClick={() => handleFilterChange("searchTerm", undefined)}
                className="hover:bg-primary/20 rounded p-0.5"
              >
                <X
                  className={`h-3 w-3 ${settings.colorfulIcons ? "text-red-500" : ""}`}
                />
              </button>
            </div>
          )}

          {filters.assetType && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
              <span>
                Tipo:{" "}
                {
                  ASSET_TYPE_OPTIONS.find(
                    (opt) => opt.value === filters.assetType,
                  )?.label
                }
              </span>
              <button
                onClick={() => handleFilterChange("assetType", undefined)}
                className="hover:bg-primary/20 rounded p-0.5"
              >
                <X
                  className={`h-3 w-3 ${settings.colorfulIcons ? "text-red-500" : ""}`}
                />
              </button>
            </div>
          )}

          {filters.brokerId && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
              <span>
                Corretora:{" "}
                {brokers.find((b) => b.id === filters.brokerId)?.name}
              </span>
              <button
                onClick={() => handleFilterChange("brokerId", undefined)}
                className="hover:bg-primary/20 rounded p-0.5"
              >
                <X
                  className={`h-3 w-3 ${settings.colorfulIcons ? "text-red-500" : ""}`}
                />
              </button>
            </div>
          )}

          {filters.status && filters.status !== "active" && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
              <span>
                Status:{" "}
                {
                  STATUS_OPTIONS.find((opt) => opt.value === filters.status)
                    ?.label
                }
              </span>
              <button
                onClick={() => handleFilterChange("status", "active")}
                className="hover:bg-primary/20 rounded p-0.5"
              >
                <X
                  className={`h-3 w-3 ${settings.colorfulIcons ? "text-red-500" : ""}`}
                />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
