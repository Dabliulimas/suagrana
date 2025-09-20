"use client";

import { memo, useState, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { useDebouncedCallback } from "../hooks/use-debounce";

interface OptimizedTextareaProps
  extends Omit<React.ComponentProps<typeof Textarea>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export const OptimizedTextarea = memo(function OptimizedTextarea({
  value,
  onChange,
  debounceMs = 500,
  ...props
}: OptimizedTextareaProps) {
  const [localValue, setLocalValue] = useState(value);

  const debouncedOnChange = useDebouncedCallback(onChange, debounceMs);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  return <Textarea {...props} value={localValue} onChange={handleChange} />;
});
