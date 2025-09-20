"use client";

import { useState, useEffect } from "react";

export function useClientDate() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    // Only set the date on the client side to avoid hydration mismatch
    setCurrentDate(new Date());
  }, []);

  return currentDate;
}

export function useFormattedDate(options?: Intl.DateTimeFormatOptions) {
  const date = useClientDate();

  if (!date) {
    // Return null during SSR or if date is not available yet
    return null;
  }

  return date.toLocaleDateString("pt-BR", options);
}
