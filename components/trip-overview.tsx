"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Route,
} from "lucide-react";
import type { Trip } from "../lib/storage";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";

interface TripOverviewProps {
  trip: Trip;
}

export function TripOverview({ trip }: TripOverviewProps) {
  const { transactions } = useTransactions();
  const [expenses, setExpenses] = useState(0);
  const [documentsProgress, setDocumentsProgress] = useState(0);
  const [checklistProgress, setChecklistProgress] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);
  const [itineraryCount, setItineraryCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && transactions.length >= 0) {
      loadTripData();
    }
  }, [trip.id, isMounted, transactions]);

  const loadTripData = () => {
    // Carregar gastos
    const tripExpenses = transactions.filter((t) => (t as any).tripId === trip.id);
    const totalExpenses = tripExpenses.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0,
    );
    setExpenses(totalExpenses);

    // Carregar progresso dos documentos
    const documents = JSON.parse(
      localStorage.getItem(`trip-documents-${trip.id}`) || "[]",
    );
    if (typeof window === "undefined") return;
    const requiredDocs = documents.filter((d: any) => d.required);
    const completedDocs = requiredDocs.filter((d: any) => d.completed);
    const docsProgress =
      requiredDocs.length > 0
        ? (completedDocs.length / requiredDocs.length) * 100
        : 0;
    setDocumentsProgress(docsProgress);

    // Carregar progresso do checklist
    const checklist = JSON.parse(
      localStorage.getItem(`trip-checklist-${trip.id}`) || "[]",
    );
    if (typeof window === "undefined") return;
    const completedItems = checklist.filter((item: any) => item.completed);
    const checkProgress =
      checklist.length > 0
        ? (completedItems.length / checklist.length) * 100
        : 0;
    setChecklistProgress(checkProgress);

    // Carregar fotos
    const photos = JSON.parse(
      localStorage.getItem(`trip-photos-${trip.id}`) || "[]",
    );
    if (typeof window === "undefined") return;
    setPhotosCount(photos.length);

    // Carregar itinerário
    const itinerary = JSON.parse(
      localStorage.getItem(`itinerary-${trip.id}`) || "[]",
    );
    if (typeof window === "undefined") return;
    setItineraryCount(itinerary.length);
  };

  const getStatusColor = (status: Trip["status"]) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Trip["status"]) => {
    switch (status) {
      case "planned":
        return "Planejada";
      case "active":
        return "Em Andamento";
      case "completed":
        return "Concluída";
      default:
        return "Desconhecido";
    }
  };

  const getTripDuration = () => {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getDaysUntilTrip = () => {
    const today = new Date();
    const start = new Date(trip.startDate);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBudgetProgress = () => {
    return Math.min((expenses / trip.budget) * 100, 100);
  };

  const daysUntil = getDaysUntilTrip();
  const duration = getTripDuration();
  const budgetProgress = getBudgetProgress();

  return (
    <div className="space-y-6">
      {/* Header da Viagem */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Plane className="w-8 h-8 text-blue-600" />
                {trip.name}
              </CardTitle>
              <div className="flex items-center gap-4 mt-3">
                <Badge
                  className={getStatusColor(trip.status)}
                  variant="secondary"
                >
                  {getStatusText(trip.status)}
                </Badge>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{trip.destination}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>{duration} dias</span>
                </div>
              </div>
            </div>
            {trip.status === "planned" && daysUntil > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {daysUntil}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  dias restantes
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <div className="font-medium">Período</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(trip.startDate).toLocaleDateString("pt-BR")} -{" "}
                  {new Date(trip.endDate).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <div className="font-medium">Participantes</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {trip.participants.length} pessoa
                  {trip.participants.length > 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <div className="font-medium">Orçamento</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {trip.currency} {trip.budget.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          {trip.description && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-gray-700">{trip.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gasto</p>
                <p className="text-xl font-bold text-red-600">
                  {trip.currency} {expenses.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Documentos</p>
                <p className="text-xl font-bold text-blue-600">
                  {documentsProgress.toFixed(0)}%
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Checklist</p>
                <p className="text-xl font-bold text-green-600">
                  {checklistProgress.toFixed(0)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Roteiro</p>
                <p className="text-xl font-bold text-purple-600">
                  {itineraryCount} itens
                </p>
              </div>
              <Route className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso do Orçamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Controle de Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Progresso dos Gastos</span>
            <span className="text-sm text-gray-600">
              {trip.currency} {expenses.toFixed(2)} / {trip.budget.toFixed(2)}
            </span>
          </div>
          <Progress value={budgetProgress} className="h-3" />
          <div className="flex justify-between text-sm">
            <span
              className={
                budgetProgress > 100 ? "text-red-600" : "text-gray-600"
              }
            >
              {budgetProgress.toFixed(1)}% utilizado
            </span>
            <span
              className={
                expenses > trip.budget ? "text-red-600" : "text-green-600"
              }
            >
              {expenses <= trip.budget
                ? "Dentro do orçamento"
                : `Excedeu em ${trip.currency} ${(expenses - trip.budget).toFixed(2)}`}
            </span>
          </div>
          {expenses > trip.budget && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">Atenção: Orçamento excedido!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progresso das Tarefas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Progresso</span>
                <span className="text-sm text-gray-600">
                  {documentsProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={documentsProgress} className="h-2" />
              <p className="text-sm text-gray-600">
                {documentsProgress === 100
                  ? "Todos os documentos prontos!"
                  : "Alguns documentos ainda precisam ser preparados"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Progresso</span>
                <span className="text-sm text-gray-600">
                  {checklistProgress.toFixed(0)}%
                </span>
              </div>
              <Progress value={checklistProgress} className="h-2" />
              <p className="text-sm text-gray-600">
                {checklistProgress === 100
                  ? "Checklist completo!"
                  : "Ainda há itens pendentes no checklist"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participantes da Viagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {trip.participants.map((participant, index) => (
              <div
                key={`participant-${participant}-${index}`}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {participant === "Você"
                      ? "EU"
                      : participant
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{participant}</span>
                {participant === "Você" && (
                  <Badge variant="outline" className="text-xs">
                    Organizador
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
