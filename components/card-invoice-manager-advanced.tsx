"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Progress } from "./ui/progress";
import {
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { type Account, type Transaction } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";

interface CardInvoiceManagerAdvancedProps {
  card: Account;
  onClose: () => void;
}

interface InvoiceItem {
  transaction: Transaction;
  installmentInfo?: {
    current: number;
    total: number;
    remainingAmount: number;
  };
}

interface MonthlyInvoice {
  month: string;
  year: number;
  items: InvoiceItem[];
  total: number;
  dueDate: string;
  isPaid: boolean;
  status: "pending" | "due" | "overdue" | "paid";
  paymentDate?: string;
}

export function CardInvoiceManagerAdvanced({
  card,
  onClose,
}: CardInvoiceManagerAdvancedProps) {
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showInstallmentDetails, setShowInstallmentDetails] = useState(false);

  useEffect(() => {
    generateAdvancedInvoices();
  }, []);

  const generateAdvancedInvoices = () => {
    const transactions = transactions;
    const cardTransactions = transactions.filter(
      (t) => t.account === card.name && t.type === "expense",
    );

    // Generate invoices for 24 months (12 past + current + 11 future)
    const invoiceMap = new Map<string, InvoiceItem[]>();
    const currentDate = new Date();

    // Process each transaction and its installments
    cardTransactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const installments = transaction.installments || 1;
      const currentInstallment = transaction.currentInstallment || 1;
      const installmentAmount = Math.abs(transaction.amount) / installments;

      // Generate installment entries
      for (let i = 0; i < installments; i++) {
        const installmentDate = new Date(transactionDate);
        installmentDate.setMonth(installmentDate.getMonth() + i);

        const key = `${installmentDate.getFullYear()}-${installmentDate.getMonth()}`;

        if (!invoiceMap.has(key)) {
          invoiceMap.set(key, []);
        }

        const installmentInfo =
          installments > 1
            ? {
                current: i + 1,
                total: installments,
                remainingAmount: (installments - (i + 1)) * installmentAmount,
              }
            : undefined;

        invoiceMap.get(key)!.push({
          transaction: {
            ...transaction,
            amount: installmentAmount,
            currentInstallment: i + 1,
          },
          installmentInfo,
        });
      }
    });

    // Generate invoice list for 24 months
    const invoiceList: MonthlyInvoice[] = [];

    for (let i = -12; i <= 11; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1,
      );
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const items = invoiceMap.get(key) || [];

      const total = items.reduce(
        (sum, item) => sum + item.transaction.amount,
        0,
      );
      const dueDate = new Date(date.getFullYear(), date.getMonth() + 1, 10); // Due on 10th

      const status = getInvoiceStatus(dueDate, total);

      invoiceList.push({
        month: date.toLocaleDateString("pt-BR", { month: "long" }),
        year: date.getFullYear(),
        items,
        total,
        dueDate: dueDate.toISOString().split("T")[0],
        isPaid: status === "paid",
        status,
        paymentDate:
          status === "paid" ? dueDate.toISOString().split("T")[0] : undefined,
      });
    }

    setInvoices(invoiceList);
  };

  const getInvoiceStatus = (
    dueDate: Date,
    total: number,
  ): MonthlyInvoice["status"] => {
    if (total === 0) return "paid";

    const today = new Date();
    const diffDays = Math.floor(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < -30) return "paid"; // Assume old invoices are paid
    if (diffDays < 0) return "overdue";
    if (diffDays <= 7) return "due";
    return "pending";
  };

  const currentInvoice = invoices.find(
    (inv) =>
      inv.year === selectedYear &&
      inv.month ===
        new Date(selectedYear, selectedMonth).toLocaleDateString("pt-BR", {
          month: "long",
        }),
  );

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const getStatusBadge = (status: MonthlyInvoice["status"]) => {
    const statusConfig = {
      pending: { label: "Pendente", color: "bg-blue-100 text-blue-800" },
      due: { label: "Vence em breve", color: "bg-yellow-100 text-yellow-800" },
      overdue: { label: "Vencida", color: "bg-red-100 text-red-800" },
      paid: { label: "Paga", color: "bg-green-100 text-green-800" },
    };

    const config = statusConfig[status];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: MonthlyInvoice["status"]) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "due":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTotalInstallments = () => {
    return (
      currentInvoice?.items.filter((item) => item.installmentInfo).length || 0
    );
  };

  const getInstallmentSummary = () => {
    if (!currentInvoice) return null;

    const installmentItems = currentInvoice.items.filter(
      (item) => item.installmentInfo,
    );
    const totalInstallmentValue = installmentItems.reduce(
      (sum, item) => sum + item.transaction.amount,
      0,
    );

    return {
      count: installmentItems.length,
      totalValue: totalInstallmentValue,
      items: installmentItems,
    };
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Faturas Completas - {card.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="current" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">Fatura Atual</TabsTrigger>
            <TabsTrigger value="future">Próximas Faturas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-semibold capitalize">
                {new Date(selectedYear, selectedMonth).toLocaleDateString(
                  "pt-BR",
                  {
                    month: "long",
                    year: "numeric",
                  },
                )}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {currentInvoice && (
              <>
                {/* Invoice Summary */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-2xl">
                          R${" "}
                          {currentInvoice.total.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(currentInvoice.status)}
                          <span className="text-sm text-gray-600">
                            Vencimento:{" "}
                            {new Date(
                              currentInvoice.dueDate,
                            ).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {currentInvoice.paymentDate && (
                          <p className="text-sm text-green-600">
                            Pago em:{" "}
                            {new Date(
                              currentInvoice.paymentDate,
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        {getStatusBadge(currentInvoice.status)}
                        {card.creditLimit && (
                          <div className="text-sm text-gray-600">
                            <p>
                              Limite: R${" "}
                              {card.creditLimit.toLocaleString("pt-BR")}
                            </p>
                            <p>
                              Disponível: R${" "}
                              {(
                                card.creditLimit - currentInvoice.total
                              ).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {card.creditLimit && (
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Utilização do limite</span>
                          <span>
                            {(
                              (currentInvoice.total / card.creditLimit) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            (currentInvoice.total / card.creditLimit) * 100
                          }
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Installment Summary */}
                {getTotalInstallments() > 0 && (
                  <Card className="bg-orange-50 border-orange-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>Parcelamentos Ativos</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setShowInstallmentDetails(!showInstallmentDetails)
                          }
                        >
                          {showInstallmentDetails ? "Ocultar" : "Ver"} Detalhes
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">
                            Parcelamentos este mês
                          </p>
                          <p className="font-semibold">
                            {getTotalInstallments()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            Valor em parcelamentos
                          </p>
                          <p className="font-semibold">
                            R${" "}
                            {getInstallmentSummary()?.totalValue.toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 },
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Transações ({currentInvoice.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentInvoice.items.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Nenhuma transação neste período
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {currentInvoice.items
                          .sort(
                            (a, b) =>
                              new Date(b.transaction.date).getTime() -
                              new Date(a.transaction.date).getTime(),
                          )
                          .map((item, index) => (
                            <div
                              key={`${item.transaction.id}-${index}`}
                              className="flex justify-between items-center p-3 border rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium">
                                  {item.transaction.description}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {new Date(
                                      item.transaction.date,
                                    ).toLocaleDateString("pt-BR")}
                                  </span>
                                  <span>•</span>
                                  <span>{item.transaction.category}</span>
                                </div>
                                {item.installmentInfo && (
                                  <div className="mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {item.installmentInfo.current}/
                                      {item.installmentInfo.total}x
                                    </Badge>
                                    {showInstallmentDetails && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Restam: R${" "}
                                        {item.installmentInfo.remainingAmount.toFixed(
                                          2,
                                        )}{" "}
                                        em{" "}
                                        {item.installmentInfo.total -
                                          item.installmentInfo.current}{" "}
                                        parcelas
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-red-600">
                                  R${" "}
                                  {item.transaction.amount.toLocaleString(
                                    "pt-BR",
                                    { minimumFractionDigits: 2 },
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="future" className="space-y-4">
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">
                Próximas Faturas (12 meses)
              </h3>
              {invoices
                .filter((inv) => new Date(inv.dueDate) > new Date())
                .slice(0, 12)
                .map((invoice, index) => (
                  <Card
                    key={`future-invoice-${invoice.month}-${invoice.year}-${index}`}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold capitalize">
                            {invoice.month} {invoice.year}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Vencimento:{" "}
                            {new Date(invoice.dueDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {invoice.items.length} transações
                            {invoice.items.filter((i) => i.installmentInfo)
                              .length > 0 &&
                              ` • ${invoice.items.filter((i) => i.installmentInfo).length} parcelamentos`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            R${" "}
                            {invoice.total.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">
                Histórico de Faturas (12 meses anteriores)
              </h3>
              {invoices
                .filter((inv) => new Date(inv.dueDate) <= new Date())
                .slice(-12)
                .reverse()
                .map((invoice, index) => (
                  <Card
                    key={`history-invoice-${invoice.month}-${invoice.year}-${index}`}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold capitalize">
                            {invoice.month} {invoice.year}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Vencimento:{" "}
                            {new Date(invoice.dueDate).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                          {invoice.paymentDate && (
                            <p className="text-sm text-green-600">
                              Pago em:{" "}
                              {new Date(invoice.paymentDate).toLocaleDateString(
                                "pt-BR",
                              )}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            {invoice.items.length} transações
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            R${" "}
                            {invoice.total.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
