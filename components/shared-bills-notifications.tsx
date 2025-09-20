"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AlertTriangle, X, CreditCard, Calendar } from "lucide-react";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";

interface OverdueBill {
  userEmail: string;
  userName: string;
  month: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
}

export function SharedBillsNotifications() {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [overdueBills, setOverdueBills] = useState<OverdueBill[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    loadOverdueBills();
  }, []);

  const loadOverdueBills = () => {
    try {
      const billingPayments = storage.getBillingPayments();
      let familyMembers: Array<{ id: string; name: string; email?: string }> =
        [];
      try {
        const saved = localStorage.getItem("familyMembers");
        if (typeof window === "undefined") return;
        const parsed = saved ? JSON.parse(saved) : [];
        if (Array.isArray(parsed)) familyMembers = parsed;
      } catch {}
      const today = new Date();

      const overdueMap: Record<string, OverdueBill> = {};

      billingPayments.forEach((payment) => {
        if (!payment.isPaid && payment.dueDate) {
          const dueDate = new Date(payment.dueDate);
          if (today > dueDate) {
            const contact = familyMembers.find(
              (c) =>
                c.email === payment.userEmail || c.name === payment.userEmail,
            );
            const month = dueDate.toISOString().slice(0, 7);
            const key = `${payment.userEmail}-${month}`;
            const daysOverdue = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (!overdueMap[key]) {
              overdueMap[key] = {
                userEmail: payment.userEmail,
                userName: contact?.name || payment.userEmail,
                month,
                amount: 0,
                dueDate: payment.dueDate,
                daysOverdue,
              };
            }

            overdueMap[key].amount += payment.amount;
          }
        }
      });

      const overdue = Object.values(overdueMap).filter(
        (bill) => !dismissed.includes(`${bill.userEmail}-${bill.month}`),
      );
      setOverdueBills(overdue);
    } catch (error) {
      logComponents.error("Error loading overdue bills:", error);
      setOverdueBills([]);
    }
  };

  const handleDismiss = (userEmail: string, month: string) => {
    const key = `${userEmail}-${month}`;
    setDismissed((prev) => [...prev, key]);
    setOverdueBills((prev) =>
      prev.filter((bill) => `${bill.userEmail}-${bill.month}` !== key),
    );
  };

  const handleViewBills = () => {
    window.location.href = "/shared-billing";
  };

  if (overdueBills.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {overdueBills.map((bill) => (
        <Card
          key={`${bill.userEmail}-${bill.month}`}
          className="border-red-200 bg-red-50"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-900">Fatura Vencida</p>
                  <p className="text-sm text-red-700">
                    {bill.userName} •{" "}
                    {new Date(bill.month + "-01").toLocaleDateString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-red-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Venceu em{" "}
                      {new Date(bill.dueDate).toLocaleDateString("pt-BR")}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {bill.daysOverdue} dias em atraso
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    R${" "}
                    {bill.amount.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                    onClick={handleViewBills}
                  >
                    <CreditCard className="w-4 h-4 mr-1" />
                    Ver Fatura
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-100"
                    onClick={() => handleDismiss(bill.userEmail, bill.month)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
