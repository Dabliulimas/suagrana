"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { BackButton } from "./back-button";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import {
  Receipt,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { logComponents } from "../lib/logger";
import { storage } from "../lib/storage";

interface MonthlyInvoice {
  month: string;
  year: number;
  monthLabel: string;
  items: InvoiceItem[];
  total: number;
  paid: number;
  pending: number;
  status: "paid" | "partial" | "pending" | "overdue";
}

interface InvoiceItem {
  id: string;
  transactionId: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  isPaid: boolean;
  paidDate?: string;
}

interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  relationship: string;
  color: string;
}

export function BillingInvoices() {
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { contacts } = useContacts();
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);

  useEffect(() => {
    try {
      // Use unified contacts system
      if (contacts.length > 0 && !selectedContact) {
        setSelectedContact(contacts[0].id);
      }
    } catch (error) {
      logComponents.error("Error loading contacts:", error);
    }
  }, [contacts]);

  useEffect(() => {
    if (selectedContact) {
      generateInvoices();
    }
  }, [selectedContact]);

  const generateInvoices = () => {
    const contact = contacts.find((c) => c.id === selectedContact);
    if (!contact) return;

    const sharedTransactions = transactions.filter(
      (t) => t.type === "shared" && t.sharedWith?.includes(contact.id),
    );

    // TODO: Migrate billing payments to unified system
    let billingPayments = [];
    try {
      if (storage?.getBillingPayments) {
        billingPayments = storage.getBillingPayments();
      }
    } catch (error) {
      logComponents.warn('Billing payments not available:', error);
    }

    const monthlyData: Record<string, MonthlyInvoice> = {};

    sharedTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${year}-${month}`;

      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: String(month),
          year,
          monthLabel: date.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          }),
          items: [],
          total: 0,
          paid: 0,
          pending: 0,
          status: "pending",
        };
      }

      const totalParticipants = (transaction.sharedWith?.length || 0) + 1;
      const personAmount = Math.abs(transaction.amount) / totalParticipants;

      const payment = billingPayments.find(
        (p) =>
          p.transactionId === transaction.id &&
          p.userEmail === (contact.email || contact.name),
      );

      const item: InvoiceItem = {
        id: payment?.id || `${transaction.id}-${contact.email || contact.name}`,
        transactionId: transaction.id,
        description: transaction.description,
        category: transaction.category,
        amount: personAmount,
        date: transaction.date,
        isPaid: payment?.isPaid || false,
        paidDate: payment?.paidDate,
      };

      monthlyData[key].items.push(item);
      monthlyData[key].total += personAmount;

      if (item.isPaid) {
        monthlyData[key].paid += personAmount;
      } else {
        monthlyData[key].pending += personAmount;
      }
    });

    Object.values(monthlyData).forEach((invoice) => {
      if (invoice.paid === invoice.total) {
        invoice.status = "paid";
      } else if (invoice.paid > 0) {
        invoice.status = "partial";
      } else {
        const invoiceDate = new Date(
          invoice.year,
          Number.parseInt(invoice.month) - 1,
          1,
        );
        const daysOld = Math.floor(
          (Date.now() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        invoice.status = daysOld > 30 ? "overdue" : "pending";
      }
    });

    const sortedInvoices = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return Number.parseInt(b.month) - Number.parseInt(a.month);
    });

    setInvoices(sortedInvoices);
  };

  const handleMarkAsPaid = (itemId: string) => {
    // TODO: Implement billing payments in unified system
    try {
      const payment = storage?.getBillingPayments()?.find((p: any) => p.id === itemId);
      if (payment && storage?.updateBillingPayment) {
        storage.updateBillingPayment(itemId, {
          isPaid: true,
          paidDate: new Date().toISOString(),
        });
      }
    } catch (error) {
      logComponents.warn('Error updating billing payment:', error);
    }

    generateInvoices();
    toast.success("Item marcado como pago!");
  };

  const handleMarkAsUnpaid = (itemId: string) => {
    // TODO: Implement billing payments in unified system
    try {
      const payment = storage?.getBillingPayments()?.find((p: any) => p.id === itemId);
      if (payment && storage?.updateBillingPayment) {
        storage.updateBillingPayment(itemId, {
          isPaid: false,
          paidDate: undefined,
        });
      }
    } catch (error) {
      logComponents.warn('Error updating billing payment:', error);
    }

    generateInvoices();
    toast.success("Item desmarcado!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "partial":
        return <Clock className="w-4 h-4" />;
      case "overdue":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Paga";
      case "partial":
        return "Parcial";
      case "overdue":
        return "Vencida";
      default:
        return "Pendente";
    }
  };

  const selectedContactData = contacts.find(
    (c) => c.id === selectedContact,
  );

  const availableYears = [...new Set(invoices.map((inv) => inv.year))].sort(
    (a, b) => b - a,
  );

  const availableMonths = selectedYear
    ? invoices
        .filter((inv) => inv.year === parseInt(selectedYear))
        .sort((a, b) => parseInt(b.month) - parseInt(a.month))
    : invoices.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return parseInt(b.month) - parseInt(a.month);
      });

  const filteredInvoices = invoices.filter((inv) => {
    if (
      selectedYear &&
      selectedYear !== "all" &&
      inv.year !== parseInt(selectedYear)
    )
      return false;
    if (selectedMonth && selectedMonth !== "all" && inv.month !== selectedMonth)
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h2 className="text-2xl font-bold">Faturas de Cobrança</h2>
          <p className="text-gray-600">
            Controle de faturas mensais como cartão de crédito
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Selecionar Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedContact} onValueChange={setSelectedContact}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um contato" />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback>
                        {contact.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{contact.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedContact && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Ano</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {availableYears
                      .filter((year) => year && !isNaN(year) && year > 0)
                      .map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium">Mês</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {availableMonths.map((invoice) => (
                      <SelectItem
                        key={`${invoice.year}-${invoice.month}`}
                        value={invoice.month}
                      >
                        {invoice.monthLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedContact && filteredInvoices.length > 0 && (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <Card key={`${invoice.year}-${invoice.month}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(invoice.status)}
                    {invoice.monthLabel}
                  </CardTitle>
                  <Badge className={getStatusColor(invoice.status)}>
                    {getStatusLabel(invoice.status)}
                  </Badge>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>Total: R$ {invoice.total.toFixed(2)}</span>
                  <span>Pago: R$ {invoice.paid.toFixed(2)}</span>
                  <span>Pendente: R$ {invoice.pending.toFixed(2)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.description}</div>
                        <div className="text-sm text-gray-600">
                          {item.category} •{" "}
                          {new Date(item.date).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          R$ {item.amount.toFixed(2)}
                        </span>
                        {item.isPaid ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Pago
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkAsUnpaid(item.id)}
                            >
                              Desmarcar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsPaid(item.id)}
                          >
                            Marcar como Pago
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedContact && filteredInvoices.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma fatura encontrada
            </h3>
            <p className="text-gray-600">
              Não há faturas para o contato selecionado no período especificado.
            </p>
          </CardContent>
        </Card>
      )}

      {!selectedContact && contacts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum contato cadastrado
            </h3>
            <p className="text-gray-600">
              Adicione membros da família para gerar faturas de cobrança.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
