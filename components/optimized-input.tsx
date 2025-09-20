"use client";

import { memo, useState, useEffect } from "react";
import { Input } from "./ui/input";
import { useDebouncedCallback } from "../hooks/use-debounce";

interface OptimizedInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export const OptimizedInput = memo(function OptimizedInput({
  value,
  onChange,
  debounceMs = 300,
  ...props
}: OptimizedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  const debouncedOnChange = useDebouncedCallback(onChange, debounceMs);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  return <Input {...props} value={localValue} onChange={handleChange} />;
});
