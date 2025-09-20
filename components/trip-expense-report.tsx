"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart3,
  Plus,
  Calendar,
  MapPin,
  Users,
  Download,
  AlertCircle,
  Target,
  Edit,
  Trash2,
  Filter,
  ChevronDown,
  Eye,
  ArrowUp,
  ArrowDown,
  CreditCard,
  Wallet,
} from "lucide-react";
import { type Trip, type Transaction } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { AddTransactionModal } from "./modals/transactions/add-transaction-modal";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Progress } from "./ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from "recharts";

interface TripExpenseReportProps {
  trip: Trip;
  onUpdate: () => void;
}

interface ExpenseCategory {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export function TripExpenseReport({ trip, onUpdate }: TripExpenseReportProps) {
  const { transactions, delete: deleteTransaction } = useTransactions();
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState<
    { type: "warning" | "danger"; message: string }[]
  >([]);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  useEffect(() => {
    generateReport();
  }, [trip.id, transactions]);

  const generateReport = () => {
    if (!transactions) return;
    const allTransactions = transactions;
    const tripExpenses = allTransactions.filter((t) => t.tripId === trip.id);
    setExpenses(tripExpenses);

    // Check budget alerts
    const alerts: { type: "warning" | "danger"; message: string }[] = [];
    const totalExpenses = tripExpenses.reduce(
      (sum, expense) => sum + Math.abs(expense.amount),
      0,
    );
    const spentPercentage = (totalExpenses / trip.budget) * 100;

    if (spentPercentage >= 100) {
      alerts.push({
        type: "danger",
        message: `Orçamento excedido em ${(spentPercentage - 100).toFixed(1)}%`,
      });
    } else if (spentPercentage >= 80) {
      alerts.push({
        type: "warning",
        message: `${spentPercentage.toFixed(1)}% do orçamento utilizado`,
      });
    }

    setBudgetAlerts(alerts);
  };

  const getExpensesByCategory = (): ExpenseCategory[] => {
    const categoryMap = new Map<string, { amount: number; count: number }>();

    expenses.forEach((expense) => {
      const current = categoryMap.get(expense.category) || {
        amount: 0,
        count: 0,
      };
      categoryMap.set(expense.category, {
        amount: current.amount + Math.abs(expense.amount),
        count: current.count + 1,
      });
    });

    const total = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.amount,
      0,
    );

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getExpensesByDay = () => {
    const dayMap = new Map<string, number>();

    expenses.forEach((expense) => {
      const date = new Date(expense.date).toLocaleDateString("pt-BR");
      const current = dayMap.get(date) || 0;
      dayMap.set(date, current + Math.abs(expense.amount));
    });

    return Array.from(dayMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort(
        (a, b) =>
          new Date(a.date.split("/").reverse().join("-")).getTime() -
          new Date(b.date.split("/").reverse().join("-")).getTime(),
      );
  };

  const getExpenseAnalysis = () => {
    const totalDays =
      Math.ceil(
        (new Date(trip.endDate).getTime() -
          new Date(trip.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;
    const dailyBudget = trip.budget / totalDays;
    const dailyAverage = getTotalExpenses() / totalDays;
    const remainingBudget = trip.budget - getTotalExpenses();
    const remainingDays = Math.ceil(
      (new Date(trip.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const suggestedDailySpend =
      remainingDays > 0 ? remainingBudget / remainingDays : 0;

    return {
      totalDays,
      dailyBudget,
      dailyAverage,
      remainingBudget,
      remainingDays: Math.max(0, remainingDays),
      suggestedDailySpend: Math.max(0, suggestedDailySpend),
    };
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + Math.abs(expense.amount), 0);
  };

  const getAverageDaily = () => {
    const days = getExpensesByDay();
    return days.length > 0 ? getTotalExpenses() / days.length : 0;
  };

  const getBiggestExpense = () => {
    return expenses.reduce(
      (max, expense) =>
        Math.abs(expense.amount) > Math.abs(max.amount) ? expense : max,
      expenses[0] || { amount: 0, description: "Nenhuma" },
    );
  };

  const handleAddExpense = () => {
    setShowAddExpense(true);
  };

  const handleExpenseAdded = () => {
    generateReport();
    onUpdate();
    setShowAddExpense(false);
    setEditingExpense(null);
    toast.success(
      editingExpense ? "Gasto atualizado!" : "Gasto adicionado à viagem!",
    );
  };

  const handleEditExpense = (expense: Transaction) => {
    setEditingExpense(expense);
    setShowAddExpense(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm("Tem certeza que deseja excluir este gasto?")) {
      await deleteTransaction(expenseId);
      generateReport();
      onUpdate();
      toast.success("Gasto excluído com sucesso!");
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const categories = getExpensesByCategory();
      const analysis = getExpenseAnalysis();

      // Title
      doc.setFontSize(20);
      doc.text(`Relatório de Viagem: ${trip.name}`, 20, 20);
      
      // Trip info
      doc.setFontSize(12);
      doc.text(`Destino: ${trip.destination}`, 20, 35);
      doc.text(`Período: ${trip.startDate} - ${trip.endDate}`, 20, 45);
      doc.text(`Orçamento: ${trip.currency} ${trip.budget.toFixed(2)}`, 20, 55);
      doc.text(`Total Gasto: ${trip.currency} ${getTotalExpenses().toFixed(2)}`, 20, 65);
      doc.text(`Restante: ${trip.currency} ${analysis.remainingBudget.toFixed(2)}`, 20, 75);
      doc.text(`Média Diária: ${trip.currency} ${getAverageDaily().toFixed(2)}`, 20, 85);

      // Categories table
      const categoriesData = categories.map(cat => [
        cat.name,
        cat.count.toString(),
        `${trip.currency} ${cat.amount.toFixed(2)}`,
        `${cat.percentage.toFixed(1)}%`
      ]);

      autoTable(doc, {
        head: [['Categoria', 'Transações', 'Valor', 'Percentual']],
        body: categoriesData,
        startY: 95,
        theme: 'grid',
      });

      // Transactions table
      const transactionsData = expenses.map(expense => [
        new Date(expense.date).toLocaleDateString('pt-BR'),
        expense.description,
        expense.category,
        `${trip.currency} ${Math.abs(expense.amount).toFixed(2)}`
      ]);

      autoTable(doc, {
        head: [['Data', 'Descrição', 'Categoria', 'Valor']],
        body: transactionsData,
        startY: doc.lastAutoTable.finalY + 10,
        theme: 'grid',
      });

      // Save PDF
      const fileName = `relatorio-${trip.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      doc.save(fileName);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar relatório em PDF');
    }
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Relatório de Viagem');
      
      // Trip information
      worksheet.addRow(['Relatório de Viagem']);
      worksheet.addRow([]);
      worksheet.addRow(['Viagem:', trip.name]);
      worksheet.addRow(['Destino:', trip.destination]);
      worksheet.addRow(['Período:', `${trip.startDate} - ${trip.endDate}`]);
      worksheet.addRow(['Orçamento:', `${trip.currency} ${trip.budget.toFixed(2)}`]);
      worksheet.addRow(['Total Gasto:', `${trip.currency} ${getTotalExpenses().toFixed(2)}`]);
      worksheet.addRow(['Restante:', `${trip.currency} ${getExpenseAnalysis().remainingBudget.toFixed(2)}`]);
      worksheet.addRow(['Média Diária:', `${trip.currency} ${getAverageDaily().toFixed(2)}`]);
      worksheet.addRow([]);
      
      // Categories section
      worksheet.addRow(['Gastos por Categoria']);
      worksheet.addRow(['Categoria', 'Transações', 'Valor', 'Percentual']);
      
      const categories = getExpensesByCategory();
      categories.forEach(cat => {
        worksheet.addRow([
          cat.name,
          cat.count,
          cat.amount,
          `${cat.percentage.toFixed(1)}%`
        ]);
      });
      
      worksheet.addRow([]);
      
      // Transactions section
      worksheet.addRow(['Todas as Transações']);
      worksheet.addRow(['Data', 'Descrição', 'Categoria', 'Valor', 'Conta', 'Notas']);
      
      expenses.forEach(expense => {
        worksheet.addRow([
          new Date(expense.date).toLocaleDateString('pt-BR'),
          expense.description,
          expense.category,
          Math.abs(expense.amount),
          expense.account,
          expense.notes || ''
        ]);
      });
      
      // Style the headers
      worksheet.getRow(1).font = { bold: true, size: 16 };
      worksheet.getRow(11).font = { bold: true };
      worksheet.getRow(12).font = { bold: true };
      worksheet.getRow(11 + categories.length + 3).font = { bold: true };
      worksheet.getRow(12 + categories.length + 3).font = { bold: true };
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });
      
      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${trip.name.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar relatório em Excel');
    }
  };

  const exportReportJSON = () => {
    const reportData = {
      trip: trip.name,
      destination: trip.destination,
      period: `${trip.startDate} - ${trip.endDate}`,
      budget: trip.budget,
      spent: getTotalExpenses(),
      remaining: trip.budget - getTotalExpenses(),
      categories: getExpensesByCategory(),
      dailyExpenses: getExpensesByDay(),
      expenses: expenses.map((e) => ({
        date: e.date,
        description: e.description,
        amount: e.amount,
        category: e.category,
        account: e.account,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${trip.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório JSON exportado!");
  };

  const categories = getExpensesByCategory();
  const dailyExpenses = getExpensesByDay();
  const totalExpenses = getTotalExpenses();
  const averageDaily = getAverageDaily();
  const biggestExpense = getBiggestExpense();

  return (
    <div className="space-y-6">
      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2">
          {budgetAlerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg flex items-center gap-2 ${
                alert.type === "danger"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-yellow-50 text-yellow-700 border border-yellow-200"
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold text-red-600">
                  {trip.currency} {totalExpenses.toFixed(2)}
                </p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        totalExpenses / trip.budget > 1
                          ? "bg-red-500"
                          : totalExpenses / trip.budget > 0.8
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min((totalExpenses / trip.budget) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((totalExpenses / trip.budget) * 100).toFixed(1)}% do
                    orçamento
                  </p>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Média Diária</p>
                <p className="text-2xl font-bold text-blue-600">
                  {trip.currency} {averageDaily.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Orçamento diário: {trip.currency}{" "}
                  {getExpenseAnalysis().dailyBudget.toFixed(2)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Maior Gasto</p>
                <p className="text-2xl font-bold text-orange-600">
                  {trip.currency} {Math.abs(biggestExpense.amount).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Restante</p>
                <p
                  className={`text-2xl font-bold ${
                    getExpenseAnalysis().remainingBudget >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {trip.currency}{" "}
                  {getExpenseAnalysis().remainingBudget.toFixed(2)}
                </p>
                {getExpenseAnalysis().remainingDays > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sugestão diária: {trip.currency}{" "}
                    {getExpenseAnalysis().suggestedDailySpend.toFixed(2)}
                  </p>
                )}
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Relatório Detalhado</h3>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Formato do Relatório</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportToPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportReportJSON}>
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAddExpense}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Gasto
          </Button>
        </div>
      </div>

      {/* Expense Management */}
      <Tabs defaultValue="transactions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category, index) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{category.name}</Badge>
                        <span className="text-sm text-gray-600">
                          {category.count} transaç
                          {category.count > 1 ? "ões" : "ão"}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {trip.currency} {category.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {category.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyExpenses.map((day, index) => (
                  <div
                    key={day.date}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{day.date}</span>
                    </div>
                    <span className="font-semibold">
                      {trip.currency} {day.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Nenhuma transação registrada
                    </p>
                    <Button onClick={handleAddExpense} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeira Transação
                    </Button>
                  </div>
                ) : (
                  expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{expense.description}</h4>
                          <Badge variant="outline">{expense.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(expense.date).toLocaleDateString("pt-BR")}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {expense.account}
                          </div>
                          {expense.sharedWith &&
                            expense.sharedWith.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Compartilhado
                              </div>
                            )}
                        </div>
                        {expense.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            {expense.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditExpense(expense)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="font-semibold text-red-600">
                          {trip.currency} {Math.abs(expense.amount).toFixed(2)}
                        </p>
                        {expense.myShare &&
                          expense.myShare !== expense.amount && (
                            <p className="text-sm text-gray-600">
                              Minha parte: {trip.currency}{" "}
                              {Math.abs(expense.myShare).toFixed(2)}
                            </p>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Expense Modal */}
      {showAddExpense && (
        <AddTransactionModal
          open={showAddExpense}
          onOpenChange={(open) => {
            setShowAddExpense(open);
            if (!open) {
              setEditingExpense(null);
            }
          }}
          onSave={handleExpenseAdded}
          editingTransaction={editingExpense}
          tripId={trip.id}
        />
      )}
    </div>
  );
}
