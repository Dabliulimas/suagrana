"use client";
import type { Trip } from "../lib/storage";
import { TripExpenseReport } from "./trip-expense-report";

interface TripExpensesProps {
  trip: Trip;
}

export function TripExpenses({ trip }: TripExpensesProps) {
  return (
    <div className="space-y-6">
      <TripExpenseReport trip={trip} onUpdate={() => {}} />
    </div>
  );
}
