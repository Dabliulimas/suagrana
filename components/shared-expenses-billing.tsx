"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { DatePicker } from "./ui/date-picker";
import { BackButton } from "./back-button";
import { useAccounts, useTransactions, useContacts } from "../contexts/unified-context";
import {
  storage,
  type Transaction,
  type Contact,
  type BillingPayment,
  type Trip,
  type Account,
} from "../lib/storage";
import {
  Receipt,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  CreditCard,
  Calendar,
  AlertTriangle,
  Plane,
  MapPin,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";

interface SharedExpensesBillingProps {
  onUpdate?: () => void;
}

interface BillingItem {
  id: string;
  transactionId: string;
  userEmail: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  isPaid: boolean;
  paidDate?: string;
  dueDate?: string;
  month: string;
  year: number;
}

interface MonthlyBill {
  userEmail: string;
  month: string;
  year: number;
  items: BillingItem[];
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: "open" | "closed" | "overdue";
  closingDate: string;
}

export function SharedExpensesBilling({
  onUpdate,
}: SharedExpensesBillingProps) {
  const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  const { transactions: unifiedTransactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const { contacts: unifiedContacts } = useContacts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [localAccounts, setLocalAccounts] = useState<Account[]>([]);
  const [billingPayments, setBillingPayments] = useState<BillingPayment[]>([]);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBillingItem, setSelectedBillingItem] =
    useState<BillingItem | null>(null);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentAccount, setPaymentAccount] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const sharedTransactions = unifiedTransactions.filter(
      (t) => t.type === "shared",
    );
    setTransactions(sharedTransactions);
    setContacts(unifiedContacts);
    setTrips(storage.getTrips());
    setLocalAccounts(accounts);

    const payments = storage.getBillingPayments();
    setBillingPayments(payments);

    generateBillingItems(sharedTransactions, payments);
  };

  const generateBillingItems = (
    sharedTransactions: Transaction[],
    payments: BillingPayment[],
  ) => {
    const items: BillingItem[] = [];

    sharedTransactions.forEach((transaction) => {
      const sharedWith = transaction.sharedWith || [];

      sharedWith.forEach((memberId) => {
        // Encontrar membro pelo ID para obter o email
        const member = contacts.find((c) => c.id === memberId);
        const memberEmail = member?.email || memberId;
        const payment = payments.find(
          (p) =>
            p.transactionId === transaction.id && p.userEmail === memberEmail,
        );
        const date = new Date(transaction.date);
        const month = date.toISOString().slice(0, 7); // YYYY-MM
        const totalParticipants = sharedWith.length + 1;
        const amountPerPerson =
          Math.abs(transaction.amount) / totalParticipants;

        // Calcular data de vencimento (10 dias após o fechamento do mês)
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 10);
        const dueDate = nextMonth.toISOString().split("T")[0];

        items.push({
          id: payment?.id || `${transaction.id}-${memberEmail}`,
          transactionId: transaction.id,
          userEmail: memberEmail,
          amount: payment?.amount || amountPerPerson,
          description: transaction.description,
          date: transaction.date,
          category: transaction.category,
          isPaid: payment?.isPaid || false,
          paidDate: payment?.paidDate,
          dueDate: payment?.dueDate || dueDate,
          month,
          year: date.getFullYear(),
        });
      });
    });

    setBillingItems(items);
  };

  const separateTransactionsByTrip = () => {
    const regularTransactions: BillingItem[] = [];
    const tripTransactions: Record<string, BillingItem[]> = {};

    billingItems.forEach((item) => {
      const transaction = transactions.find((t) => t.id === item.transactionId);
      if (transaction?.tripId) {
        if (!tripTransactions[transaction.tripId]) {
          tripTransactions[transaction.tripId] = [];
        }
        tripTransactions[transaction.tripId].push(item);
      } else {
        regularTransactions.push(item);
      }
    });

    return { regularTransactions, tripTransactions };
  };

  const getTripInfo = (tripId: string) => {
    return trips.find((trip) => trip.id === tripId);
  };

  const generateMonthlyBills = (): MonthlyBill[] => {
    // Gerar faturas mensais automaticamente
    storage.generateMonthlyBills();

    const billsMap: Record<string, MonthlyBill> = {};

    billingItems.forEach((item) => {
      const key = `${item.userEmail}-${item.month}`;

      if (!billsMap[key]) {
        const closingDate = new Date(
          item.year,
          parseInt(item.month.split("-")[1]),
          0,
        ); // Último dia do mês
        const dueDate = new Date(
          item.year,
          parseInt(item.month.split("-")[1]),
          10,
        ); // Dia 10 do próximo mês
        const today = new Date();

        let status: "open" | "closed" | "overdue" = "open";
        if (today > dueDate) {
          status = "overdue";
        } else if (today > closingDate) {
          status = "closed";
        }

        billsMap[key] = {
          userEmail: item.userEmail,
          month: item.month,
          year: item.year,
          items: [],
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          dueDate: dueDate.toISOString().split("T")[0],
          status,
          closingDate: closingDate.toISOString().split("T")[0],
        };
      }

      billsMap[key].items.push(item);
      billsMap[key].totalAmount += item.amount;

      if (item.isPaid) {
        billsMap[key].paidAmount += item.amount;
      } else {
        billsMap[key].pendingAmount += item.amount;
      }
    });

    return Object.values(billsMap).sort((a, b) => {
      if (a.month !== b.month) return b.month.localeCompare(a.month);
      return a.userEmail.localeCompare(b.userEmail);
    });
  };

  const getContactByEmail = (email: string) => {
    return contacts.find((c) => c.email === email);
  };

  const getFilteredBillingItems = () => {
    let filtered = billingItems;

    if (selectedMonth !== "all") {
      filtered = filtered.filter((item) => item.month === selectedMonth);
    }

    if (selectedYear !== "all") {
      filtered = filtered.filter(
        (item) => item.year === parseInt(selectedYear),
      );
    }

    if (selectedUser !== "all") {
      filtered = filtered.filter((item) => item.userEmail === selectedUser);
    }

    // Filtrar por tipo (regular/viagem)
    if (selectedTab !== "all") {
      const { regularTransactions, tripTransactions } =
        separateTransactionsByTrip();

      if (selectedTab === "regular") {
        const regularIds = regularTransactions.map((item) => item.id);
        filtered = filtered.filter((item) => regularIds.includes(item.id));
      } else if (selectedTab === "travel") {
        const tripIds = Object.values(tripTransactions)
          .flat()
          .map((item) => item.id);
        filtered = filtered.filter((item) => tripIds.includes(item.id));
      }
    }

    return filtered;
  };

  const getBillingByUser = () => {
    const filtered = getFilteredBillingItems();
    const grouped: Record<string, BillingItem[]> = {};

    filtered.forEach((item) => {
      if (!grouped[item.userEmail]) {
        grouped[item.userEmail] = [];
      }
      grouped[item.userEmail].push(item);
    });

    return grouped;
  };

  const getUserTotals = (userEmail: string) => {
    const userItems = billingItems.filter(
      (item) => item.userEmail === userEmail,
    );
    const total = userItems.reduce((sum, item) => sum + item.amount, 0);
    const paid = userItems
      .filter((item) => item.isPaid)
      .reduce((sum, item) => sum + item.amount, 0);
    const pending = total - paid;

    return { total, paid, pending, count: userItems.length };
  };

  const getMonthTotals = () => {
    const filtered = getFilteredBillingItems();
    const total = filtered.reduce((sum, item) => sum + item.amount, 0);
    const paid = filtered
      .filter((item) => item.isPaid)
      .reduce((sum, item) => sum + item.amount, 0);
    const pending = total - paid;

    return { total, paid, pending, count: filtered.length };
  };

  // NOVA FUNÇÃO: Análise por Categoria
  const getCategoryAnalysis = () => {
    const filtered = getFilteredBillingItems();
    const categoryTotals: Record<string, { total: number; paid: number; pending: number; count: number }> = {};

    filtered.forEach((item) => {
      const category = item.category || 'Sem Categoria';
      
      if (!categoryTotals[category]) {
        categoryTotals[category] = { total: 0, paid: 0, pending: 0, count: 0 };
      }

      categoryTotals[category].total += item.amount;
      categoryTotals[category].count += 1;
      
      if (item.isPaid) {
        categoryTotals[category].paid += item.amount;
      } else {
        categoryTotals[category].pending += item.amount;
      }
    });

    // Ordenar por total decrescente
    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: filtered.length > 0 ? (data.total / getMonthTotals().total) * 100 : 0
      }));

    return sortedCategories;
  };

  // NOVA FUNÇÃO: Comparação com Mês Anterior
  const getCategoryComparison = () => {
    const currentMonth = selectedMonth === 'all' ? new Date().toISOString().slice(0, 7) : selectedMonth;
    const previousMonth = new Date(currentMonth + '-01');
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const prevMonthString = previousMonth.toISOString().slice(0, 7);

    const currentMonthItems = billingItems.filter(item => item.month === currentMonth);
    const previousMonthItems = billingItems.filter(item => item.month === prevMonthString);

    const currentCategories: Record<string, number> = {};
    const previousCategories: Record<string, number> = {};

    currentMonthItems.forEach(item => {
      const category = item.category || 'Sem Categoria';
      currentCategories[category] = (currentCategories[category] || 0) + item.amount;
    });

    previousMonthItems.forEach(item => {
      const category = item.category || 'Sem Categoria';
      previousCategories[category] = (previousCategories[category] || 0) + item.amount;
    });

    const comparison = Object.keys({ ...currentCategories, ...previousCategories }).map(category => {
      const current = currentCategories[category] || 0;
      const previous = previousCategories[category] || 0;
      const difference = current - previous;
      const percentageChange = previous > 0 ? (difference / previous) * 100 : current > 0 ? 100 : 0;

      return {
        category,
        current,
        previous,
        difference,
        percentageChange
      };
    }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    return { comparison, currentMonth, previousMonth: prevMonthString };
  };

  const handleMarkAsPaid = (billingId: string) => {
    const billingItem = billingItems.find((item) => item.id === billingId);
    if (billingItem) {
      setSelectedBillingItem(billingItem);
      setPaymentModalOpen(true);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedBillingItem || !paymentAccount) {
      toast.error("Por favor, selecione uma conta para receber o pagamento");
      return;
    }

    const payment = billingPayments.find(
      (p) => p.id === selectedBillingItem.id,
    );
    if (payment) {
      storage.updateBillingPayment(selectedBillingItem.id, {
        isPaid: true,
        paidDate: paymentDate,
      });
    }

    // Adicionar transação de entrada na conta selecionada
    const newTransactionData = {
      amount: selectedBillingItem.amount,
      description: `Recebimento: ${selectedBillingItem.description}`,
      category: "Recebimentos",
      date: paymentDate,
      type: "income" as const,
      account: paymentAccount === "cash" ? "Dinheiro" : paymentAccount,
      notes: `Pagamento de fatura compartilhada - ${getContactByEmail(selectedBillingItem.userEmail)?.name || selectedBillingItem.userEmail}`,
    };

    storage.saveTransaction(newTransactionData);

    // Atualizar saldo da conta
    const account = localAccounts.find((acc) => acc.id === paymentAccount);
    if (account) {
      await updateAccount(paymentAccount, {
        balance: account.balance + selectedBillingItem.amount,
      });
    }

    setBillingItems((prev) =>
      prev.map((item) =>
        item.id === selectedBillingItem.id
          ? { ...item, isPaid: true, paidDate: paymentDate }
          : item,
      ),
    );

    toast.success("Pagamento registrado com sucesso!");
    setPaymentModalOpen(false);
    setSelectedBillingItem(null);
    setPaymentAccount("");
    onUpdate?.();
  };

  const handleMarkAsUnpaid = (billingId: string) => {
    const payment = billingPayments.find((p) => p.id === billingId);
    if (payment) {
      storage.updateBillingPayment(billingId, {
        isPaid: false,
        paidDate: undefined,
      });
    }

    setBillingItems((prev) =>
      prev.map((item) =>
        item.id === billingId
          ? { ...item, isPaid: false, paidDate: undefined }
          : item,
      ),
    );
    toast.success("Pagamento desmarcado!");
    onUpdate?.();
  };

  const handleExportBilling = () => {
    const filtered = getFilteredBillingItems();
    const csvContent = [
      [
        "Nome",
        "Email",
        "Descrição",
        "Categoria",
        "Valor",
        "Data",
        "Status",
        "Data Pagamento",
      ].join(","),
      ...filtered.map((item) => {
        const contact = getContactByEmail(item.userEmail);
        return [
          contact?.name || item.userEmail,
          item.userEmail,
          item.description,
          item.category,
          `R$ ${item.amount.toFixed(2)}`,
          new Date(item.date).toLocaleDateString("pt-BR"),
          item.isPaid ? "Pago" : "Pendente",
          item.paidDate
            ? new Date(item.paidDate).toLocaleDateString("pt-BR")
            : "",
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `faturas-${selectedMonth}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Relatório exportado com sucesso!");
  };

  const getUniqueUsers = () => {
    // Buscar todos os membros da família (contatos) além dos usuários com faturas
    const billingUsers = Array.from(
      new Set(billingItems.map((item) => item.userEmail)),
    );
    const familyMembers = contacts.map((contact) => contact.email);
    const allUsers = Array.from(new Set([...billingUsers, ...familyMembers]));
    return allUsers;
  };

  const getUniqueMonths = () => {
    if (billingItems.length === 0) {
      // Se não há dados, gerar os últimos 12 meses
      const months = [];
      const currentDate = new Date();
      for (let i = 0; i < 12; i++) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1,
        );
        months.push(date.toISOString().slice(0, 7));
      }
      return months;
    }
    const months = Array.from(new Set(billingItems.map((item) => item.month)))
      .sort()
      .reverse();
    return months;
  };

  const getUniqueYears = () => {
    if (billingItems.length === 0) {
      // Se não há dados, gerar os últimos 3 anos
      const currentYear = new Date().getFullYear();
      return [currentYear, currentYear - 1, currentYear - 2];
    }
    const years = Array.from(new Set(billingItems.map((item) => item.year)))
      .sort()
      .reverse();
    return years;
  };

  const monthTotals = getMonthTotals();
  const monthlyBills = generateMonthlyBills();
  const { regularTransactions, tripTransactions } =
    separateTransactionsByTrip();
  const categoryAnalysis = getCategoryAnalysis();
  const categoryComparison = getCategoryComparison();

  const handlePayFullBill = (bill: MonthlyBill) => {
    bill.items.forEach((item) => {
      if (!item.isPaid) {
        handleMarkAsPaid(item.id);
      }
    });
    toast.success(`Fatura de ${bill.month} paga integralmente!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "closed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Em Aberto";
      case "closed":
        return "Fechada";
      case "overdue":
        return "Vencida";
      default:
        return "Desconhecido";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Faturas Compartilhadas
          </h2>
          <p className="text-gray-600">
            Sistema de faturamento mensal para despesas compartilhadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportBilling}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Mês</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {getUniqueMonths().map((month) => (
                    <SelectItem key={month} value={month}>
                      {new Date(month + "-01").toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ano</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {getUniqueYears().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Usuário</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {getUniqueUsers().map((email) => {
                    const contact = getContactByEmail(email);
                    return (
                      <SelectItem key={email} value={email}>
                        {contact?.name || email}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para separar gastos regulares e de viagem */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Todos
          </TabsTrigger>
          <TabsTrigger value="regular" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Gastos Regulares
          </TabsTrigger>
          <TabsTrigger value="travel" className="flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Gastos de Viagem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total</span>
                </div>
                <p className="text-2xl font-bold">
                  R${" "}
                  {monthTotals.total.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Pago</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  R${" "}
                  {monthTotals.paid.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Pendente</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  R${" "}
                  {monthTotals.pending.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Itens</span>
                </div>
                <p className="text-2xl font-bold">{monthTotals.count}</p>
              </CardContent>
            </Card>
          </div>

          {/* NOVA SEÇÃO: Análise por Categoria */}
          {categoryAnalysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  Análise de Gastos por Categoria
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Veja quanto você gastou em cada categoria {selectedMonth !== 'all' ? `em ${new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` : 'no período selecionado'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryAnalysis.map((category, index) => {
                    const progressPercentage = monthTotals.total > 0 ? (category.total / monthTotals.total) * 100 : 0;
                    
                    return (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }} />
                            <span className="font-medium">{category.category}</span>
                            <Badge variant="outline" className="text-xs">
                              {category.count} {category.count === 1 ? 'item' : 'itens'}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              R$ {category.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {category.percentage.toFixed(1)}% do total
                            </p>
                          </div>
                        </div>
                        
                        {/* Barra de Progresso */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              backgroundColor: `hsl(${index * 45}, 70%, 50%)`,
                              width: `${progressPercentage}%` 
                            }}
                          />
                        </div>
                        
                        {/* Detalhes Pago/Pendente */}
                        <div className="flex justify-between text-sm text-muted-foreground pl-5">
                          <span className="text-green-600">
                            Pago: R$ {category.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-orange-600">
                            Pendente: R$ {category.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* NOVA SEÇÃO: Comparação com Mês Anterior */}
          {selectedMonth !== 'all' && categoryComparison.comparison.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  Comparação com Mês Anterior
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Compare seus gastos de {new Date(categoryComparison.currentMonth + '-01').toLocaleDateString('pt-BR', { month: 'long' })} 
                  vs {new Date(categoryComparison.previousMonth + '-01').toLocaleDateString('pt-BR', { month: 'long' })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryComparison.comparison.filter(comp => comp.current > 0 || comp.previous > 0).map((comp) => (
                    <div key={comp.category} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{comp.category}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Atual: R$ {comp.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span>Anterior: R$ {comp.previous.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${comp.difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {comp.difference >= 0 ? '+' : ''}R$ {comp.difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs ${comp.percentageChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {comp.percentageChange >= 0 ? '+' : ''}{comp.percentageChange.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="regular" className="space-y-6">
          {/* Resumo Gastos Regulares */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Regular</span>
                </div>
                <p className="text-2xl font-bold">
                  R${" "}
                  {regularTransactions
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Pago</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  R${" "}
                  {regularTransactions
                    .filter((item) => item.isPaid)
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Pendente</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  R${" "}
                  {regularTransactions
                    .filter((item) => !item.isPaid)
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Itens</span>
                </div>
                <p className="text-2xl font-bold">
                  {regularTransactions.length}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="travel" className="space-y-6">
          {/* Resumo Gastos de Viagem */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Viagens</span>
                </div>
                <p className="text-2xl font-bold">
                  R${" "}
                  {Object.values(tripTransactions)
                    .flat()
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Pago</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  R${" "}
                  {Object.values(tripTransactions)
                    .flat()
                    .filter((item) => item.isPaid)
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Pendente</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  R${" "}
                  {Object.values(tripTransactions)
                    .flat()
                    .filter((item) => !item.isPaid)
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Viagens</span>
                </div>
                <p className="text-2xl font-bold">
                  {Object.keys(tripTransactions).length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gastos por Viagem */}
          {Object.keys(tripTransactions).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Gastos por Viagem
              </h3>
              {Object.entries(tripTransactions).map(([tripId, items]) => {
                const trip = getTripInfo(tripId);
                const tripTotal = items.reduce(
                  (sum, item) => sum + item.amount,
                  0,
                );
                const tripPaid = items
                  .filter((item) => item.isPaid)
                  .reduce((sum, item) => sum + item.amount, 0);
                const tripPending = tripTotal - tripPaid;

                return (
                  <Card key={tripId}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        {trip?.name || `Viagem ${tripId}`}
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Users className="w-3 h-3" />
                          {items.length} itens
                        </Badge>
                      </CardTitle>
                      {trip && (
                        <p className="text-sm text-gray-500">
                          {new Date(trip.startDate).toLocaleDateString("pt-BR")}{" "}
                          - {new Date(trip.endDate).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="font-semibold">
                            R${" "}
                            {tripTotal.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Pago</p>
                          <p className="font-semibold text-green-600">
                            R${" "}
                            {tripPaid.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Pendente</p>
                          <p className="font-semibold text-orange-600">
                            R${" "}
                            {tripPending.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Faturas Mensais */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Faturas Mensais
        </h3>

        {monthlyBills.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">
                Nenhuma fatura encontrada para os filtros selecionados
              </p>
            </CardContent>
          </Card>
        ) : (
          monthlyBills.map((bill) => {
            const contact = getContactByEmail(bill.userEmail);
            const isOverdue =
              bill.status === "overdue" && bill.pendingAmount > 0;

            return (
              <Card
                key={`${bill.userEmail}-${bill.month}`}
                className={isOverdue ? "border-red-200" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {contact?.name.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {contact?.name || bill.userEmail}
                          <Badge className={getStatusColor(bill.status)}>
                            {getStatusText(bill.status)}
                          </Badge>
                          {isOverdue && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </CardTitle>
                        <p className="text-sm text-gray-500 flex items-center gap-4">
                          <span>{bill.userEmail}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(bill.month + "-01").toLocaleDateString(
                              "pt-BR",
                              {
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        R${" "}
                        {bill.totalAmount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        Vence em{" "}
                        {new Date(bill.dueDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Resumo da Fatura */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-semibold">
                        R${" "}
                        {bill.totalAmount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Pago</p>
                      <p className="font-semibold text-green-600">
                        R${" "}
                        {bill.paidAmount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Pendente</p>
                      <p
                        className={`font-semibold ${isOverdue ? "text-red-600" : "text-orange-600"}`}
                      >
                        R${" "}
                        {bill.pendingAmount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  {bill.pendingAmount > 0 && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePayFullBill(bill)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Pagar Fatura Completa
                      </Button>
                      <Button variant="outline">Ver Detalhes</Button>
                    </div>
                  )}

                  {/* Itens da Fatura */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">
                      Itens da Fatura ({bill.items.length})
                    </h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {bill.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2 border rounded ${
                            item.isPaid
                              ? "bg-green-50 border-green-200"
                              : "bg-orange-50 border-orange-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {!item.isPaid && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleMarkAsPaid(item.id)}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Marcar como Pago
                              </Button>
                            )}
                            {item.isPaid && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleMarkAsUnpaid(item.id)}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Desmarcar
                              </Button>
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                {item.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.category} •{" "}
                                {new Date(item.date).toLocaleDateString(
                                  "pt-BR",
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-sm font-semibold ${item.isPaid ? "text-green-600" : "text-orange-600"}`}
                            >
                              R${" "}
                              {item.amount.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                            <Badge
                              variant={item.isPaid ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {item.isPaid ? "Pago" : "Pendente"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal de Pagamento */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Marcar como Pago
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBillingItem && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedBillingItem.description}</p>
                <p className="text-sm text-gray-600">
                  Valor: R${" "}
                  {selectedBillingItem.amount.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  Devedor:{" "}
                  {getContactByEmail(selectedBillingItem.userEmail)?.name ||
                    selectedBillingItem.userEmail}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="payment-date">Data do Pagamento</Label>
              <DatePicker
                id="payment-date"
                value={paymentDate}
                onChange={(value) => setPaymentDate(value)}
                placeholder="Selecionar data do pagamento"
                maxDate={new Date()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-account">
                Conta que Recebeu o Dinheiro
              </Label>
              <Select value={paymentAccount} onValueChange={setPaymentAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {account.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPaymentModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleConfirmPayment}
              >
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
