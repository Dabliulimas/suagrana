"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Plane,
  DollarSign,
  Route,
  FileText,
  CheckSquare,
  BarChart3,
  Settings,
  Calendar,
  Camera,
  Share2,
  TrendingUp,
  CreditCard,
  ShoppingCart,
} from "lucide-react";
import type { Trip } from "../lib/storage";
import { TripChecklist } from "./trip-checklist";
import { TripSettings } from "./trip-settings";
import { TripOverview } from "./trip-overview";
import { TripItinerary } from "./trip-itinerary";
import { TripDocuments } from "./trip-documents";
import { TripExpenses } from "./trip-expenses";
import { TripReports } from "./trip-reports";
import { TripSharing } from "./trip-sharing";
import { TripCurrencyExchange } from "./trip-currency-exchange";
import { TripShoppingList } from "./trip-shopping-list";

interface TripDetailsProps {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

export function TripDetails({ trip, onUpdate }: TripDetailsProps) {
  const tabs = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "itinerary", label: "Roteiro", icon: Calendar },
    { id: "documents", label: "Documentos", icon: FileText },
    { id: "expenses", label: "Gastos", icon: DollarSign },
    { id: "exchange", label: "Câmbio", icon: CreditCard },
    { id: "shopping", label: "Compras", icon: ShoppingCart },
    { id: "reports", label: "Relatórios", icon: TrendingUp },
    { id: "sharing", label: "Compartilhar", icon: Share2 },
    { id: "checklist", label: "Checklist", icon: CheckSquare },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  const [activeTab, setActiveTab] = useState("overview");

  const handleUpdate = () => {
    // TripChecklist doesn't need trip parameter, just triggers update
    onUpdate(trip);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full space-y-4"
    >
      <TabsList className="grid w-full grid-cols-10 dark:bg-gray-800 dark:border-gray-700">
        <TabsTrigger
          value="overview"
          className="flex items-center gap-2 dark:text-gray-300 dark:hover:text-white dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
        >
          <BarChart3 className="w-4 h-4" />
          Visão Geral
        </TabsTrigger>
        <TabsTrigger
          value="itinerary"
          className="flex items-center gap-2 dark:text-gray-300 dark:hover:text-white dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
        >
          <Route className="w-4 h-4" />
          Roteiro
        </TabsTrigger>
        <TabsTrigger
          value="documents"
          className="flex items-center gap-2 dark:text-gray-300 dark:hover:text-white dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
        >
          <FileText className="w-4 h-4" />
          Documentos
        </TabsTrigger>
        <TabsTrigger
          value="expenses"
          className="flex items-center gap-2 dark:text-gray-300 dark:hover:text-white dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
        >
          <DollarSign className="w-4 h-4" />
          Gastos
        </TabsTrigger>
        <TabsTrigger
          value="exchange"
          className="flex items-center gap-2 dark:text-gray-300 dark:hover:text-white dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
        >
          <CreditCard className="w-4 h-4" />
          Câmbio
        </TabsTrigger>
        <TabsTrigger
          value="shopping"
          className="flex items-center gap-2 dark:text-gray-300 dark:hover:text-white dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
        >
          <ShoppingCart className="w-4 h-4" />
          Compras
        </TabsTrigger>
        <TabsTrigger
          value="reports"
          className="flex items-center gap-2 dark:text-gray-300 dark:hover:text-white dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
        >
          <TrendingUp className="w-4 h-4" />
          Relatórios
        </TabsTrigger>
        <TabsTrigger
          value="sharing"
          className="flex items-center gap-2 dark:text-gray-300 dark:hover:text-white dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
        >
          <Share2 className="w-4 h-4" />
          Compartilhar
        </TabsTrigger>
        <TabsTrigger
          value="checklist"
          className="flex items-center gap-2 dark:text-gray-300 dark:hover:text-white dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
        >
          <CheckSquare className="w-4 h-4" />
          Checklist
        </TabsTrigger>
        <TabsTrigger
          value="settings"
          className="flex items-center gap-2 dark:text-gray-300 dark:hover:text-white dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
        >
          <Settings className="w-4 h-4" />
          Configurações
        </TabsTrigger>
      </TabsList>
      <div className="rounded-md border dark:border-gray-700 dark:bg-gray-800">
        <TabsContent value="overview" className="space-y-4 p-4">
          <TripOverview trip={trip} />
        </TabsContent>
        <TabsContent value="itinerary" className="space-y-4 p-4">
          <TripItinerary trip={trip} />
        </TabsContent>
        <TabsContent value="documents" className="space-y-4 p-4">
          <TripDocuments trip={trip} />
        </TabsContent>
        <TabsContent value="expenses" className="space-y-4 p-4">
          <TripExpenses trip={trip} />
        </TabsContent>
        <TabsContent value="exchange" className="space-y-4 p-4">
          <TripCurrencyExchange trip={trip} onUpdate={onUpdate} />
        </TabsContent>
        <TabsContent value="shopping" className="space-y-4 p-4">
          <TripShoppingList trip={trip} onUpdate={onUpdate} />
        </TabsContent>
        <TabsContent value="reports" className="space-y-4 p-4">
          <TripReports trip={trip} onUpdate={onUpdate} />
        </TabsContent>
        <TabsContent value="sharing" className="space-y-4 p-4">
          <TripSharing trip={trip} onUpdate={onUpdate} />
        </TabsContent>
        <TabsContent value="checklist">
          <TripChecklist trip={trip} onUpdate={handleUpdate} />
        </TabsContent>
        <TabsContent value="settings" className="space-y-4 p-4">
          <TripSettings trip={trip} onUpdate={() => onUpdate(trip)} />
        </TabsContent>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Ações rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => setActiveTab("itinerary")}
          >
            <Route className="w-4 h-4 mr-2" />
            Ver Roteiro
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => setActiveTab("expenses")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver Gastos
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => setActiveTab("photos")}
          >
            <Camera className="w-4 h-4 mr-2" />
            Ver Fotos
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => setActiveTab("checklist")}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Ver Checklist
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => setActiveTab("shopping")}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Lista de Compras
          </Button>
        </CardContent>
      </Card>
    </Tabs>
  );
}
