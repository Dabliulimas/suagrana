"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/utils/logger";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Eye,
  Filter,
} from "lucide-react";
import { storage, type Trip } from "../lib/storage/storage";
import { useToast } from "../hooks/use-toast";
import { TripModal } from "./features/travel/trip-modal";
import { useClientOnly } from "../hooks/use-client-only";
import { useRouter } from "next/navigation";
import {
  CustomDateFilter,
  filterByPeriod,
} from "./ui/custom-date-filter";
import { useAccounts, useTransactions } from "../contexts/unified-context";

export function TravelExpenses() {
  const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showTripModal, setShowTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const isClient = useClientOnly();
  const { toast } = useToast();
  const router = useRouter();

  // Financial context state
  const [financialContext, setFinancialContext] = useState<any>(null);

  // Load financial context only on client side
  useEffect(() => {
    if (isClient) {
      try {
        // Financial context is available but not used in travel expenses for now
        console.log(
          "Financial context available but not used in travel expenses",
        );
      } catch (error) {
        console.warn("Financial context not available:", error);
      }
    }
  }, [isClient]);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = () => {
    setTrips(storage.getTrips());
  };

  // Filter trips by date period
  const getFilteredTrips = () => {
    const allTrips = trips;

    if (selectedPeriod === "all") return allTrips;

    // Convert trips to have date field for filtering
    const tripsWithDate = allTrips.map((trip) => ({
      ...trip,
      date: trip.startDate, // Use start date for filtering
    }));

    const filtered = filterByPeriod(
      tripsWithDate,
      selectedPeriod,
      customStartDate,
      customEndDate,
    );
    return filtered;
  };

  const handleSave = () => {
    loadTrips();
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setShowTripModal(true);
  };

  const handleDelete = async (trip: Trip) => {
    if (confirm(`Tem certeza que deseja excluir a viagem "${trip.name}"?`)) {
      try {
        // Financial context not available in this component
        // Trip deletion handled by storage only

        // Clean up related data
        localStorage.removeItem(`trip-documents-${trip.id}`);
        localStorage.removeItem(`trip-checklist-${trip.id}`);
        localStorage.removeItem(`itinerary-${trip.id}`);

        // Also remove from storage
        storage.deleteTrip(trip.id);
        loadTrips();

        toast({
          title: "Sucesso",
          description: "Viagem excluída com sucesso!",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir viagem",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewTrip = (trip: Trip) => {
    router.push(`/travel/${trip.id}`);
  };

  const updateTripStatus = (trip: Trip) => {
    const today = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    let newStatus: Trip["status"];
    if (today < startDate) {
      newStatus = "planned";
    } else if (today >= startDate && today <= endDate) {
      newStatus = "active";
    } else {
      newStatus = "completed";
    }

    if (newStatus !== trip.status) {
      storage.updateTrip(trip.id, { status: newStatus });
      loadTrips();
    }
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

  const getDaysUntilTrip = (startDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTripDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getBudgetProgress = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const filteredTrips = getFilteredTrips();

  const groupedTrips = {
    planned: filteredTrips.filter((t) => t.status === "planned"),
    active: filteredTrips.filter((t) => t.status === "active"),
    completed: filteredTrips.filter((t) => t.status === "completed"),
  };

  // Auto-update trip statuses
  useEffect(() => {
    trips.forEach(updateTripStatus);
  }, [trips]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Controle de Viagens
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Planeje e acompanhe suas viagens
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button
            onClick={() => setShowTripModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Viagem
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <CustomDateFilter
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomStartDateChange={setCustomStartDate}
              onCustomEndDateChange={setCustomEndDate}
              className="mb-4"
            />
          </CardContent>
        </Card>
      )}

      {trips.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Plane className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma viagem planejada
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Comece planejando sua próxima aventura!
            </p>
            <Button
              onClick={() => setShowTripModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Planejar Primeira Viagem
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">
              Em Andamento ({groupedTrips.active.length})
            </TabsTrigger>
            <TabsTrigger value="planned">
              Planejadas ({groupedTrips.planned.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Concluídas ({groupedTrips.completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {groupedTrips.active.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma viagem em andamento
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {groupedTrips.active.map((trip) => (
                  <Card
                    key={trip.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewTrip(trip)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Plane className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            {trip.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusColor(trip.status)}>
                              {getStatusText(trip.status)}
                            </Badge>
                            <Badge variant="outline">
                              {getTripDuration(trip.startDate, trip.endDate)}{" "}
                              dias
                            </Badge>
                          </div>
                        </div>
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTrip(trip)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(trip)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{trip.destination}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString("pt-BR")}{" "}
                          - {new Date(trip.endDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Users className="w-4 h-4" />
                        <span>
                          {trip.participants.length} participante
                          {trip.participants.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Orçamento</span>
                          <span className="text-sm">
                            {trip.currency} {trip.spent.toFixed(2)} /{" "}
                            {trip.budget.toFixed(2)}
                          </span>
                        </div>
                        <Progress
                          value={getBudgetProgress(trip.spent, trip.budget)}
                          className="h-2"
                        />
                        {trip.spent > trip.budget && (
                          <div className="flex items-center gap-1 text-red-600 text-sm">
                            <AlertCircle className="w-3 h-3" />
                            Orçamento excedido
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="planned" className="space-y-4">
            {groupedTrips.planned.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma viagem planejada
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {groupedTrips.planned.map((trip) => {
                  const daysUntil = getDaysUntilTrip(trip.startDate);
                  return (
                    <Card
                      key={trip.id}
                      className="border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleViewTrip(trip)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <Plane className="w-5 h-5 text-blue-600" />
                              {trip.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getStatusColor(trip.status)}>
                                {getStatusText(trip.status)}
                              </Badge>
                              <Badge variant="outline">
                                {getTripDuration(trip.startDate, trip.endDate)}{" "}
                                dias
                              </Badge>
                              {daysUntil > 0 && (
                                <Badge variant="outline">
                                  {daysUntil} dia{daysUntil > 1 ? "s" : ""}{" "}
                                  restante{daysUntil > 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div
                            className="flex gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTrip(trip)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(trip)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(trip)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <MapPin className="w-4 h-4" />
                          <span>{trip.destination}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(trip.startDate).toLocaleDateString(
                              "pt-BR",
                            )}{" "}
                            -{" "}
                            {new Date(trip.endDate).toLocaleDateString("pt-BR")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Users className="w-4 h-4" />
                          <span>
                            {trip.participants.length} participante
                            {trip.participants.length > 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            Orçamento: {trip.currency} {trip.budget.toFixed(2)}
                          </span>
                        </div>

                        {trip.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {trip.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {groupedTrips.completed.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma viagem concluída
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {groupedTrips.completed.map((trip) => (
                  <Card
                    key={trip.id}
                    className="border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewTrip(trip)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <Plane className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            {trip.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusColor(trip.status)}>
                              {getStatusText(trip.status)}
                            </Badge>
                            <Badge variant="outline">
                              {getTripDuration(trip.startDate, trip.endDate)}{" "}
                              dias
                            </Badge>
                          </div>
                        </div>
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTrip(trip)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(trip)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span>{trip.destination}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(trip.startDate).toLocaleDateString("pt-BR")}{" "}
                          - {new Date(trip.endDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Gasto Total
                          </span>
                          <span className="text-sm font-medium">
                            {trip.currency} {trip.spent.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Orçamento
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {trip.currency} {trip.budget.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {trip.spent <= trip.budget ? "Economia" : "Excesso"}
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              trip.spent <= trip.budget
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {trip.currency}{" "}
                            {Math.abs(trip.budget - trip.spent).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Modals */}
      {showTripModal && (
        <TripModal
          open={showTripModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowTripModal(false);
              setEditingTrip(null);
              // Recarregar trips após fechar modal
              loadTrips();
            }
          }}
          trip={editingTrip || undefined}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
