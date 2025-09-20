"use client";

import React, { useState } from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { Calendar } from "./calendar";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomDateFilterProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomStartDateChange: (date: Date | undefined) => void;
  onCustomEndDateChange: (date: Date | undefined) => void;
  className?: string;
  showCustomDateInputs?: boolean;
}

const periodOptions = [
  { value: "all", label: "Todos os períodos" },
  { value: "current-month", label: "Mês atual" },
  { value: "last-month", label: "Mês passado" },
  { value: "current-year", label: "Ano atual" },
  { value: "last-year", label: "Ano passado" },
  { value: "last-30-days", label: "Últimos 30 dias" },
  { value: "last-3-months", label: "Últimos 3 meses" },
  { value: "last-6-months", label: "Últimos 6 meses" },
  { value: "custom", label: "Período personalizado" },
];

export function CustomDateFilter({
  selectedPeriod,
  onPeriodChange,
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
  className = "",
  showCustomDateInputs = true,
}: CustomDateFilterProps) {
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const clearCustomDates = () => {
    onCustomStartDateChange(undefined);
    onCustomEndDateChange(undefined);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Period Selector */}
      <div className="flex items-center gap-4">
        <Select value={selectedPeriod} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Range Selector */}
      {selectedPeriod === "custom" && showCustomDateInputs && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium whitespace-nowrap">
                  De:
                </span>
                <Popover
                  open={showStartCalendar}
                  onOpenChange={setShowStartCalendar}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-40 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate
                        ? format(customStartDate, "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        onCustomStartDateChange(date);
                        setShowStartCalendar(false);
                      }}
                      disabled={(date) =>
                        date > new Date() ||
                        Boolean(customEndDate && date > customEndDate)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium whitespace-nowrap">
                  Até:
                </span>
                <Popover
                  open={showEndCalendar}
                  onOpenChange={setShowEndCalendar}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-40 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate
                        ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR })
                        : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date) => {
                        onCustomEndDateChange(date);
                        setShowEndCalendar(false);
                      }}
                      disabled={(date) =>
                        date > new Date() ||
                        Boolean(customStartDate && date < customStartDate)
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {(customStartDate || customEndDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCustomDates}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Utility function to filter data by period
export function filterByPeriod<T extends { date: string }>(
  data: T[],
  period: string,
  customStartDate?: Date,
  customEndDate?: Date,
): T[] {
  if (period === "all") return data;

  const now = new Date();

  if (period === "custom" && customStartDate && customEndDate) {
    return data.filter((item) => {
      const itemDate = new Date(item.date);
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    });
  }

  return data.filter((item) => {
    const itemDate = new Date(item.date);

    switch (period) {
      case "current-month":
        return (
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );

      case "last-month":
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear =
          now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return (
          itemDate.getMonth() === lastMonth &&
          itemDate.getFullYear() === lastMonthYear
        );

      case "current-year":
        return itemDate.getFullYear() === now.getFullYear();

      case "last-year":
        return itemDate.getFullYear() === now.getFullYear() - 1;

      case "last-30-days":
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        return itemDate >= thirtyDaysAgo;

      case "last-3-months":
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return itemDate >= threeMonthsAgo;

      case "last-6-months":
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return itemDate >= sixMonthsAgo;

      default:
        return true;
    }
  });
}
