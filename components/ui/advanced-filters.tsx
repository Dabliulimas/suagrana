"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { DatePicker } from "./date-picker";
import { Checkbox } from "./checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import {
  Filter,
  Search,
  Calendar,
  Tag,
  DollarSign,
  Users,
  X,
  RotateCcw,
  ChevronDown,
  SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface AmountRange {
  min: number | null;
  max: number | null;
}

interface AdvancedFiltersProps {
  // Dados para filtrar
  data: any[];
  
  // Configurações de filtros disponíveis
  enableSearch?: boolean;
  enableDateRange?: boolean;
  enableAmountRange?: boolean;
  enableCategory?: boolean;
  enableType?: boolean;
  enableStatus?: boolean;
  enableCustomFilters?: boolean;
  
  // Opções customizadas
  categories?: FilterOption[];
  types?: FilterOption[];
  statuses?: FilterOption[];
  customFilters?: {
    key: string;
    label: string;
    options: FilterOption[];
  }[];
  
  // Callbacks
  onFiltersChange: (filteredData: any[], activeFilters: any) => void;
  
  // Configurações visuais
  title?: string;
  showFilterCount?: boolean;
  compactMode?: boolean;
  className?: string;
}

export function AdvancedFilters({
  data = [],
  enableSearch = true,
  enableDateRange = true,
  enableAmountRange = false,
  enableCategory = true,
  enableType = true,
  enableStatus = false,
  enableCustomFilters = false,
  categories = [],
  types = [],
  statuses = [],
  customFilters = [],
  onFiltersChange,
  title = "Filtros Avançados",
  showFilterCount = true,
  compactMode = false,
  className = "",
}: AdvancedFiltersProps) {
  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [amountRange, setAmountRange] = useState<AmountRange>({ min: null, max: null });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [customFilterValues, setCustomFilterValues] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);

  // Gerar opções automaticamente se não fornecidas
  const autoCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    
    const categoryMap = new Map<string, number>();
    data.forEach(item => {
      const category = item.category || "Sem Categoria";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries()).map(([value, count]) => ({
      value,
      label: value,
      count
    })).sort((a, b) => b.count - a.count);
  }, [data, categories]);

  const autoTypes = useMemo(() => {
    if (types.length > 0) return types;
    
    const typeMap = new Map<string, number>();
    data.forEach(item => {
      const type = item.type || "Outro";
      const label = {
        'income': 'Receita',
        'expense': 'Despesa', 
        'transfer': 'Transferência',
        'shared': 'Compartilhada'
      }[type] || type;
      
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    
    return Array.from(typeMap.entries()).map(([value, count]) => {
      const label = {
        'income': 'Receita',
        'expense': 'Despesa',
        'transfer': 'Transferência', 
        'shared': 'Compartilhada'
      }[value] || value;
      
      return { value, label, count };
    }).sort((a, b) => b.count - a.count);
  }, [data, types]);

  const autoStatuses = useMemo(() => {
    if (statuses.length > 0) return statuses;
    
    const statusMap = new Map<string, number>();
    data.forEach(item => {
      const status = item.status || item.isPaid ? 'paid' : 'pending' || "active";
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    return Array.from(statusMap.entries()).map(([value, count]) => {
      const label = {
        'active': 'Ativo',
        'inactive': 'Inativo',
        'paid': 'Pago',
        'pending': 'Pendente',
        'completed': 'Concluído',
        'cancelled': 'Cancelado'
      }[value] || value;
      
      return { value, label, count };
    }).sort((a, b) => b.count - a.count);
  }, [data, statuses]);

  // Função principal de filtragem
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Filtro de busca
    if (enableSearch && searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.description || item.name || item.title || "")
          .toLowerCase()
          .includes(searchLower) ||
        (item.category || "").toLowerCase().includes(searchLower) ||
        (item.notes || "").toLowerCase().includes(searchLower)
      );
    }

    // Filtro de data
    if (enableDateRange && (dateRange.from || dateRange.to)) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date || item.createdAt);
        let matchesDate = true;
        
        if (dateRange.from) {
          matchesDate = matchesDate && itemDate >= dateRange.from;
        }
        
        if (dateRange.to) {
          const endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          matchesDate = matchesDate && itemDate <= endDate;
        }
        
        return matchesDate;
      });
    }

    // Filtro de valor
    if (enableAmountRange && (amountRange.min !== null || amountRange.max !== null)) {
      filtered = filtered.filter(item => {
        const amount = Math.abs(item.amount || item.value || 0);
        let matchesAmount = true;
        
        if (amountRange.min !== null) {
          matchesAmount = matchesAmount && amount >= amountRange.min;
        }
        
        if (amountRange.max !== null) {
          matchesAmount = matchesAmount && amount <= amountRange.max;
        }
        
        return matchesAmount;
      });
    }

    // Filtro de categoria
    if (enableCategory && selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filtro de tipo
    if (enableType && selectedType !== "all") {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Filtro de status
    if (enableStatus && selectedStatus !== "all") {
      filtered = filtered.filter(item => {
        const status = item.status || (item.isPaid ? 'paid' : 'pending');
        return status === selectedStatus;
      });
    }

    // Filtros customizados
    if (enableCustomFilters) {
      customFilters.forEach(filter => {
        const value = customFilterValues[filter.key];
        if (value && value !== "all") {
          filtered = filtered.filter(item => item[filter.key] === value);
        }
      });
    }

    return filtered;
  }, [
    data, 
    searchTerm, 
    dateRange, 
    amountRange, 
    selectedCategory, 
    selectedType, 
    selectedStatus, 
    customFilterValues,
    enableSearch,
    enableDateRange,
    enableAmountRange,
    enableCategory,
    enableType,
    enableStatus,
    enableCustomFilters,
    customFilters
  ]);

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (dateRange.from || dateRange.to) count++;
    if (amountRange.min !== null || amountRange.max !== null) count++;
    if (selectedCategory !== "all") count++;
    if (selectedType !== "all") count++;
    if (selectedStatus !== "all") count++;
    
    customFilters.forEach(filter => {
      if (customFilterValues[filter.key] && customFilterValues[filter.key] !== "all") {
        count++;
      }
    });
    
    return count;
  }, [
    searchTerm, 
    dateRange, 
    amountRange, 
    selectedCategory, 
    selectedType, 
    selectedStatus, 
    customFilterValues,
    customFilters
  ]);

  // Callback quando filtros mudam
  useEffect(() => {
    const activeFilters = {
      searchTerm,
      dateRange,
      amountRange,
      selectedCategory,
      selectedType,
      selectedStatus,
      customFilterValues,
      count: activeFiltersCount
    };
    
    onFiltersChange(filteredData, activeFilters);
  }, [searchTerm, dateRange, amountRange, selectedCategory, selectedType, selectedStatus, customFilterValues, activeFiltersCount]); // Removido onFiltersChange e filteredData das dependências

  // Função para limpar filtros
  const clearAllFilters = () => {
    setSearchTerm("");
    setDateRange({ from: null, to: null });
    setAmountRange({ min: null, max: null });
    setSelectedCategory("all");
    setSelectedType("all"); 
    setSelectedStatus("all");
    setCustomFilterValues({});
  };

  const hasActiveFilters = activeFiltersCount > 0;

  if (compactMode) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <FilterContent />
            </PopoverContent>
          </Popover>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          )}
          
          {showFilterCount && (
            <Badge variant="outline">
              {filteredData.length} {filteredData.length === 1 ? 'item' : 'itens'}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  function FilterContent() {
    return (
      <div className="space-y-4">
        {/* Busca */}
        {enableSearch && (
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Digite para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Filtros em linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categoria */}
          {enableCategory && autoCategories.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {autoCategories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{category.label}</span>
                        {category.count && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {category.count}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tipo */}
          {enableType && autoTypes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {autoTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{type.label}</span>
                        {type.count && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {type.count}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status */}
          {enableStatus && autoStatuses.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {autoStatuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{status.label}</span>
                        {status.count && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {status.count}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Filtro de data */}
        {enableDateRange && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Período</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">De</Label>
                <DatePicker
                  value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ""}
                  onChange={(value) => setDateRange(prev => ({ ...prev, from: value ? new Date(value) : null }))}
                  placeholder="Data inicial"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Até</Label>
                <DatePicker
                  value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ""}
                  onChange={(value) => setDateRange(prev => ({ ...prev, to: value ? new Date(value) : null }))}
                  placeholder="Data final"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filtro de valor */}
        {enableAmountRange && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Faixa de Valor</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mínimo</Label>
                <Input
                  type="number"
                  placeholder="R$ 0"
                  value={amountRange.min || ""}
                  onChange={(e) => setAmountRange(prev => ({ 
                    ...prev, 
                    min: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Máximo</Label>
                <Input
                  type="number"
                  placeholder="R$ 999999"
                  value={amountRange.max || ""}
                  onChange={(e) => setAmountRange(prev => ({ 
                    ...prev, 
                    max: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filtros customizados */}
        {enableCustomFilters && customFilters.map(filter => (
          <div key={filter.key} className="space-y-2">
            <Label className="text-sm font-medium">{filter.label}</Label>
            <Select 
              value={customFilterValues[filter.key] || "all"} 
              onValueChange={(value) => setCustomFilterValues(prev => ({ ...prev, [filter.key]: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filter.options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-4 h-4" />
            {title}
            {hasActiveFilters && (
              <Badge variant="secondary">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {showFilterCount && (
              <Badge variant="outline">
                {filteredData.length} {filteredData.length === 1 ? 'resultado' : 'resultados'}
              </Badge>
            )}
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(!isOpen)}
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="pt-0">
          <FilterContent />
        </CardContent>
      )}
    </Card>
  );
}
