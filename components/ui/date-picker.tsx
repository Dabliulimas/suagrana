"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { Calendar } from "./calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../../lib/utils";
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  validateBRDate,
} from "../../lib/utils/date-utils";

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: (date: Date) => boolean;
  id?: string;
  name?: string;
}

export function DatePicker({
  value = "",
  onChange,
  selected,
  onSelect,
  placeholder = "Selecionar data",
  disabled = false,
  className,
  required = false,
  minDate,
  maxDate,
  disabledDates,
  id,
  name,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Converte valor para Date object para o calendário
  const getDateValue = (): Date | undefined => {
    // Se usando a nova interface selected/onSelect
    if (selected !== undefined) {
      return selected;
    }

    // Interface legacy value/onChange
    if (!value) return undefined;

    // Se o valor está no formato ISO (yyyy-mm-dd)
    if (value.includes("-") && value.length === 10) {
      return new Date(value + "T00:00:00");
    }

    // Se o valor está no formato BR (dd/mm/yyyy)
    if (value.includes("/") && validateBRDate(value)) {
      const isoDate = convertBRDateToISO(value);
      return isoDate ? new Date(isoDate + "T00:00:00") : undefined;
    }

    return undefined;
  };

  // Formata a data para exibição no botão
  const getDisplayValue = (): string => {
    const dateValue = getDateValue();
    if (!dateValue || isNaN(dateValue.getTime())) {
      return placeholder;
    }

    return format(dateValue, "dd/MM/yyyy", { locale: ptBR });
  };

  // Manipula seleção de data no calendário
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Nova interface selected/onSelect
      if (onSelect) {
        onSelect(date);
      }
      // Interface legacy value/onChange
      else if (onChange) {
        const isoDate = format(date, "yyyy-MM-dd");
        onChange(isoDate);
      }
      setIsOpen(false);
    }
  };

  // Função para determinar datas desabilitadas
  const isDateDisabled = (date: Date): boolean => {
    if (disabled) return true;

    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;

    if (disabledDates) return disabledDates(date);

    return false;
  };

  if (!isMounted) {
    return (
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground",
          className,
        )}
        disabled
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {placeholder}
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          name={name}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
          type="button"
          aria-required={required}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayValue()}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        style={{ zIndex: 9999 }}
      >
        <Calendar
          mode="single"
          selected={getDateValue()}
          onSelect={handleDateSelect}
          disabled={isDateDisabled}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}

// Componente de compatibilidade para inputs de data existentes
export function DateInput({
  value = "",
  onChange,
  placeholder = "dd/mm/aaaa",
  disabled = false,
  className,
  required = false,
  minDate,
  maxDate,
  disabledDates,
  id,
  name,
  showCalendar = true,
}: DatePickerProps & { showCalendar?: boolean }) {
  // Se showCalendar for false, usa input tradicional
  if (!showCalendar) {
    return (
      <input
        id={id}
        name={name}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const formatted = formatDateInput(e.target.value);
          onChange(formatted);
        }}
        maxLength={10}
        disabled={disabled}
        required={required}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      />
    );
  }

  // Usa o DatePicker por padrão
  return (
    <DatePicker
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      required={required}
      minDate={minDate}
      maxDate={maxDate}
      disabledDates={disabledDates}
      id={id}
      name={name}
    />
  );
}
