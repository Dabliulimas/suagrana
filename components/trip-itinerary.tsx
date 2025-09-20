"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/utils/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Plus,
  Route,
  MapPin,
  Clock,
  Camera,
  Utensils,
  Building,
  Navigation,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { Trip } from "@/lib/storage";
import { ItineraryManager } from "./itinerary-manager";
import { QuickItineraryCreator } from "./quick-itinerary-creator";

interface ItineraryItem {
  id: string;
  date: string;
  time?: string;
  title: string;
  description: string;
  location: string;
  type: "attraction" | "restaurant" | "hotel" | "transport" | "activity";
  duration?: number;
  cost?: number;
  notes?: string;
  order: number;
  createdAt: string;
}

interface TripItineraryProps {
  trip: Trip;
  onUpdate?: () => void;
}

export function TripItinerary({ trip, onUpdate }: TripItineraryProps) {
  const [showItineraryManager, setShowItineraryManager] = useState(false);
  const [showQuickCreator, setShowQuickCreator] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const startDate = new Date(trip.startDate);
    return startDate.toISOString().split("T")[0];
  });
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadItinerary();
    }
  }, [trip.id, isMounted]);

  const loadItinerary = () => {
    const data = localStorage.getItem(`itinerary-${trip.id}`);
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (data) {
      setItinerary(JSON.parse(data));
    }
  };

  const getTypeIcon = (type: ItineraryItem["type"]) => {
    switch (type) {
      case "attraction":
        return <Camera className="w-4 h-4" />;
      case "restaurant":
        return <Utensils className="w-4 h-4" />;
      case "hotel":
        return <Building className="w-4 h-4" />;
      case "transport":
        return <Navigation className="w-4 h-4" />;
      case "activity":
        return <MapPin className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: ItineraryItem["type"]) => {
    switch (type) {
      case "attraction":
        return "bg-blue-100 text-blue-800";
      case "restaurant":
        return "bg-orange-100 text-orange-800";
      case "hotel":
        return "bg-purple-100 text-purple-800";
      case "transport":
        return "bg-green-100 text-green-800";
      case "activity":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDatesInRange = () => {
    const start = new Date(trip.startDate + "T00:00:00");
    const end = new Date(trip.endDate + "T00:00:00");
    const dates = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split("T")[0]);
    }

    return dates;
  };

  const getItemsByDate = (date: string) => {
    return itinerary
      .filter((item) => item.date === date)
      .sort((a, b) => {
        // Primeiro ordena por order, depois por time
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const handleEditItem = (item: ItineraryItem) => {
    setShowItineraryManager(true);
  };

  const handleDeleteItem = (itemId: string) => {
    // DEPRECADO: localStorage será removido em favor do dataService
    console.warn('DEPRECATED: trip-itinerary localStorage - Use dataService instead');
    const updatedItinerary = itinerary.filter((item) => item.id !== itemId);
    localStorage.setItem(
      `itinerary-${trip.id}`,
      JSON.stringify(updatedItinerary),
    );
    setItinerary(updatedItinerary);
    onUpdate?.();
  };

  const moveItemUp = (itemId: string, date: string) => {
    const dayItems = getItemsByDate(date);
    const itemIndex = dayItems.findIndex((item) => item.id === itemId);

    if (itemIndex > 0) {
      const updatedItinerary = [...itinerary];
      const currentItem = updatedItinerary.find((item) => item.id === itemId);
      const previousItem = dayItems[itemIndex - 1];
      const prevItem = updatedItinerary.find(
        (item) => item.id === previousItem.id,
      );

      if (currentItem && prevItem) {
        // Troca as ordens
        const tempOrder = currentItem.order;
        currentItem.order = prevItem.order;
        prevItem.order = tempOrder;

        // DEPRECADO: localStorage será removido em favor do dataService
        localStorage.setItem(
          `itinerary-${trip.id}`,
          JSON.stringify(updatedItinerary),
        );
        setItinerary(updatedItinerary);
        onUpdate?.();
      }
    }
  };

  const moveItemDown = (itemId: string, date: string) => {
    const dayItems = getItemsByDate(date);
    const itemIndex = dayItems.findIndex((item) => item.id === itemId);

    if (itemIndex < dayItems.length - 1) {
      const updatedItinerary = [...itinerary];
      const currentItem = updatedItinerary.find((item) => item.id === itemId);
      const nextItem = dayItems[itemIndex + 1];
      const nextItemFull = updatedItinerary.find(
        (item) => item.id === nextItem.id,
      );

      if (currentItem && nextItemFull) {
        // Troca as ordens
        const tempOrder = currentItem.order;
        currentItem.order = nextItemFull.order;
        nextItemFull.order = tempOrder;

        localStorage.setItem(
          `itinerary-${trip.id}`,
          JSON.stringify(updatedItinerary),
        );
        setItinerary(updatedItinerary);
        onUpdate?.();
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Roteiro da Viagem
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowQuickCreator(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criação Rápida
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowItineraryManager(true)}
              >
                Gerenciar Completo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {getDatesInRange().map((date) => {
              const dayItems = getItemsByDate(date);
              const dayNumber = getDatesInRange().indexOf(date) + 1;
              
              return (
                <div key={date} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg capitalize flex items-center gap-2">
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        Dia {dayNumber}
                      </Badge>
                      {formatDate(date)}
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDate(date);
                        setShowQuickCreator(true);
                      }}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  
                  {dayItems.length === 0 ? (
                    <Card className="p-4 border-dashed border-gray-300">
                      <div className="text-center py-4 text-gray-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma atividade planejada para este dia</p>
                        <p className="text-xs text-gray-400">Clique em "Adicionar" para começar a planejar</p>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {dayItems.map((item, index) => (
                        <Card key={item.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getTypeColor(item.type)}>
                                  {getTypeIcon(item.type)}
                                  <span className="ml-1 capitalize">
                                    {item.type}
                                  </span>
                                </Badge>
                                {item.time && (
                                  <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {item.time}
                                  </div>
                                )}
                                {item.duration && (
                                  <span className="text-sm text-gray-500">
                                    {item.duration}h
                                  </span>
                                )}
                              </div>
                              <h5 className="font-medium mb-1">{item.title}</h5>
                              {item.location && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                                  <MapPin className="w-3 h-3" />
                                  {item.location}
                                </div>
                              )}
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {item.description}
                                </p>
                              )}
                              {item.cost && (
                                <div className="text-sm font-medium text-green-600">
                                  R$ {item.cost.toFixed(2)}
                                </div>
                              )}
                              {item.notes && (
                                <p className="text-xs text-gray-500 mt-2 italic">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 ml-4">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveItemUp(item.id, item.date)}
                                  disabled={index === 0}
                                  className="h-6 w-6 p-0"
                                  title="Mover para cima"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    moveItemDown(item.id, item.date)
                                  }
                                  disabled={index === dayItems.length - 1}
                                  className="h-6 w-6 p-0"
                                  title="Mover para baixo"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditItem(item)}
                                  className="h-6 w-6 p-0"
                                  title="Editar"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Mostrar mensagem inicial apenas se não há nenhum item em nenhum dia */}
          {itinerary.length === 0 && (
            <div className="text-center py-8 border-t border-gray-200 mt-6">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Comece a planejar sua viagem!
              </h3>
              <p className="text-gray-500 mb-6">
                Use os botões "Adicionar" em cada dia ou as opções abaixo para começar
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => setShowQuickCreator(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criação Rápida
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowItineraryManager(true)}
                >
                  Gerenciar Completo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showItineraryManager && (
        <ItineraryManager
          trip={trip}
          onClose={() => setShowItineraryManager(false)}
          onUpdate={() => {
            loadItinerary();
            onUpdate?.();
          }}
        />
      )}

      {showQuickCreator && (
        <QuickItineraryCreator
          trip={trip}
          selectedDate={selectedDate}
          onClose={() => setShowQuickCreator(false)}
          onUpdate={() => {
            loadItinerary();
            onUpdate?.();
          }}
        />
      )}
    </div>
  );
}
