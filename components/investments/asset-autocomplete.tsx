"use client";

import React, { useState, useEffect, useMemo } from "react";
import { logComponents } from "../../lib/logger";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Globe,
  TrendingUp,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  ASSETS_DATABASE,
  searchAssets,
  addCustomAsset,
  type AssetData,
  type AssetType,
  getAssetByTicker,
} from "../../lib/data/assets-database";
import { toast } from "sonner";
import { Card, CardContent } from "../ui/card";
import { useRef } from "react";
import { useSafeTheme } from "../../hooks/use-safe-theme";

interface AssetAutocompleteProps {
  value?: string;
  onAssetSelect: (asset: AssetData | null) => void;
  onCustomAssetCreate?: (
    ticker: string,
    name: string,
    assetType: AssetType,
  ) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  stock: "Ação",
  fii: "FII",
  etf: "ETF",
  crypto: "Cripto",
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
  bdr: "bg-red-100 text-red-800",
  option: "bg-yellow-100 text-yellow-800",
  future: "bg-pink-100 text-pink-800",
  other: "bg-slate-100 text-slate-800",
};

export function AssetAutocomplete({
  value = "",
  onAssetSelect,
  onCustomAssetCreate,
  placeholder = "Digite o ticker ou nome do ativo...",
  disabled = false,
  className,
}: AssetAutocompleteProps) {
  const { settings } = useSafeTheme();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [localResults, setLocalResults] = useState<AssetData[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Atualizar valor quando prop value mudar
  useEffect(() => {
    setInputValue(value);
    if (value) {
      const asset = getAssetByTicker(value);
      setSelectedAsset(asset || null);
    } else {
      setSelectedAsset(null);
    }
  }, [value]);

  // Buscar ativos quando input mudar
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (inputValue.length >= 2) {
      setIsLoading(true);

      searchTimeoutRef.current = setTimeout(() => {
        // Search local database
        const localAssets = searchAssets(inputValue, 8);
        setLocalResults(localAssets);
        setShowCreateOption(localAssets.length === 0 && inputValue.length >= 3);
        setIsLoading(false);
      }, 300);
    } else {
      setLocalResults([]);
      setShowCreateOption(false);
      setIsLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [inputValue]);

  const handleAssetSelect = (asset: AssetData) => {
    setSelectedAsset(asset);
    setInputValue(asset.ticker);
    setOpen(false);
    onAssetSelect(asset);
  };


  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);

    // Se limpar o input, resetar seleção
    if (!newValue) {
      setSelectedAsset(null);
      onAssetSelect(null);
    }
  };

  const handleCreateCustomAsset = () => {
    if (onCustomAssetCreate && inputValue.length >= 3) {
      // Por padrão, criar como ação, mas permitir que o usuário mude depois
      onCustomAssetCreate(
        inputValue.toUpperCase(),
        inputValue.toUpperCase(),
        "stock",
      );
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && localResults.length > 0) {
      e.preventDefault();
      handleAssetSelect(localResults[0]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10"
            disabled={disabled}
          >
            <div className="flex items-center gap-2 flex-1 text-left">
              {selectedAsset ? (
                <>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      ASSET_TYPE_COLORS[selectedAsset.assetType],
                    )}
                  >
                    {ASSET_TYPE_LABELS[selectedAsset.assetType]}
                  </Badge>
                  <span className="font-medium">{selectedAsset.ticker}</span>
                  <span className="text-muted-foreground text-sm truncate">
                    {selectedAsset.name}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown
              className={cn(
                "ml-2 h-4 w-4 shrink-0 opacity-50",
                settings.colorfulIcons ? "text-blue-500" : "",
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar ativo..."
              value={inputValue}
              onValueChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-500">
                    Buscando...
                  </span>
                </div>
              ) : (
                <>
                  {/* Local Assets */}
                  {localResults.length > 0 && (
                    <CommandGroup heading="Ativos Brasileiros">
                      {localResults.map((asset) => (
                        <CommandItem
                          key={asset.id}
                          value={asset.ticker}
                          onSelect={() => handleAssetSelect(asset)}
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {asset.ticker}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-xs",
                                    ASSET_TYPE_COLORS[asset.assetType],
                                  )}
                                >
                                  {ASSET_TYPE_LABELS[asset.assetType]}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {asset.name}
                              </p>
                              {asset.sector && (
                                <p className="text-xs text-gray-400">
                                  {asset.sector}
                                </p>
                              )}
                            </div>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedAsset?.ticker === asset.ticker
                                ? "opacity-100"
                                : "opacity-0",
                              settings.colorfulIcons ? "text-green-500" : "",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* International Stocks */}
                  {internationalResults.length > 0 && (
                    <CommandGroup heading="Ações Internacionais">
                      {internationalResults.map((stock) => (
                        <CommandItem
                          key={stock.symbol}
                          value={stock.symbol}
                          onSelect={() => handleInternationalAssetSelect(stock)}
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <Globe
                              className={cn(
                                "w-4 h-4",
                                settings.colorfulIcons
                                  ? "text-blue-500"
                                  : "text-muted-foreground",
                              )}
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {stock.symbol}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {stock.region === "United States"
                                    ? "EUA"
                                    : stock.region}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {stock.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {stock.currency}
                              </p>
                            </div>
                          </div>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedAsset?.ticker === stock.symbol
                                ? "opacity-100"
                                : "opacity-0",
                              settings.colorfulIcons ? "text-green-500" : "",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {/* No Results */}
                  {localResults.length === 0 &&
                    internationalResults.length === 0 &&
                    inputValue &&
                    inputValue.length >= 2 &&
                    !isLoading && (
                      <CommandEmpty>
                        <div className="text-center py-6">
                          <Search
                            className={cn(
                              "mx-auto h-8 w-8 mb-2",
                              settings.colorfulIcons
                                ? "text-blue-500"
                                : "text-gray-400",
                            )}
                          />
                          <p className="text-sm text-gray-500 mb-2">
                            Nenhum ativo encontrado
                          </p>
                          <p className="text-xs text-gray-400 mb-3">
                            Tente buscar por ticker (ex: PETR4, AAPL) ou nome da
                            empresa
                          </p>
                          {showCreateOption && onCustomAssetCreate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCreateCustomAsset}
                              className="mt-2"
                            >
                              <Plus
                                className={cn(
                                  "w-4 h-4 mr-2",
                                  settings.colorfulIcons
                                    ? "text-green-500"
                                    : "",
                                )}
                              />
                              Criar ativo personalizado
                            </Button>
                          )}
                        </div>
                      </CommandEmpty>
                    )}

                  {/* Initial State */}
                  {(!inputValue || inputValue.length < 2) && (
                    <div className="text-center py-6">
                      <Search
                        className={cn(
                          "mx-auto h-8 w-8 mb-2",
                          settings.colorfulIcons
                            ? "text-blue-500"
                            : "text-gray-400",
                        )}
                      />
                      <p className="text-sm text-gray-500 mb-1">
                        Digite pelo menos 2 caracteres para buscar
                      </p>
                      <p className="text-xs text-gray-400">
                        Busque ações brasileiras (PETR4, VALE3) ou
                        internacionais (AAPL, MSFT)
                      </p>
                    </div>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Informações do ativo selecionado */}
      {selectedAsset && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp
                  className={cn(
                    "h-4 w-4",
                    settings.colorfulIcons
                      ? "text-green-600"
                      : "text-muted-foreground",
                  )}
                />
                <span className="text-sm font-medium">
                  {selectedAsset.name}
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  ASSET_TYPE_COLORS[selectedAsset.assetType],
                )}
              >
                {ASSET_TYPE_LABELS[selectedAsset.assetType]}
              </Badge>
            </div>
            {selectedAsset.sector && (
              <p className="text-xs text-muted-foreground mt-1">
                Setor: {selectedAsset.sector}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
