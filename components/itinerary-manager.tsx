"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  Edit,
  Trash2,
  Navigation,
  Camera,
  Utensils,
  Building,
  Copy,
  Star,
  Search,
  Filter,
} from "lucide-react";
import type { Trip } from "../lib/storage";
import { toast } from "sonner";
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  validateBRDate,
} from "../lib/utils/date-utils";
import { DatePicker } from "./ui/date-picker";

interface ItineraryItem {
  id: string;
  date: string; // Data obrigatória
  time?: string; // Horário opcional
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

interface ItineraryManagerProps {
  trip: Trip;
  onClose: () => void;
  onUpdate: () => void;
}

export function ItineraryManager({
  trip,
  onClose,
  onUpdate,
}: ItineraryManagerProps) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const startDate = new Date(trip.startDate);
    return startDate.toISOString().split("T")[0];
  });
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    title: "",
    description: "",
    location: "",
    type: "attraction" as ItineraryItem["type"],
    duration: "",
    cost: "",
    notes: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<ItineraryItem["type"] | "all">(
    "all",
  );
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadItinerary();
  }, [trip.id]);

  const loadItinerary = () => {
    const data = localStorage.getItem(`itinerary-${trip.id}`);
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (data) {
      setItinerary(JSON.parse(data));
    }
  };

  const saveItinerary = (items: ItineraryItem[]) => {
    localStorage.setItem(`itinerary-${trip.id}`, JSON.stringify(items));
    setItinerary(items);
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

  const getDayDate = (day: number) => {
    const start = new Date(trip.startDate);
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + day - 1);
    return dayDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const getItemsByDate = (date: string) => {
    return itinerary
      .filter((item) => item.date === date)
      .sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
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
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date && !editingItem) {
      setFormData({ ...formData, date: selectedDate });
    }

    if (!formData.title.trim() || !formData.date) {
      toast.error("Título e data são obrigatórios");
      return;
    }

    // Validar e converter data do formato brasileiro para ISO
    let isoDate: string;
    if (formData.date.includes("/")) {
      if (!validateBRDate(formData.date)) {
        toast.error("Data inválida. Use o formato dd/mm/aaaa");
        return;
      }
      isoDate = convertBRDateToISO(formData.date);
    } else {
      isoDate = formData.date;
    }

    const dayItems = getItemsByDate(isoDate);
    const newOrder = editingItem ? editingItem.order : dayItems.length + 1;

    const itemData: ItineraryItem = {
      id: editingItem?.id || Date.now().toString(),
      date: isoDate,
      time: formData.time || undefined,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      type: formData.type,
      duration: formData.duration
        ? Number.parseInt(formData.duration)
        : undefined,
      cost: formData.cost ? Number.parseFloat(formData.cost) : undefined,
      notes: formData.notes,
      order: newOrder,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
    };

    let updatedItinerary: ItineraryItem[];

    if (editingItem) {
      updatedItinerary = itinerary.map((item) =>
        item.id === editingItem.id ? itemData : item,
      );
    } else {
      updatedItinerary = [...itinerary, itemData];
    }

    // Reorganizar por horário
    const organizedItinerary = organizeByDateTime(updatedItinerary);
    saveItinerary(organizedItinerary);

    setFormData({
      date: "",
      time: "",
      title: "",
      description: "",
      location: "",
      type: "attraction",
      duration: "",
      cost: "",
      notes: "",
    });
    setEditingItem(null);
    setShowAddItem(false);

    toast.success(
      editingItem ? "Item atualizado!" : "Item adicionado ao roteiro!",
    );
  };

  const organizeByDateTime = (items: ItineraryItem[]) => {
    const itemsByDate = items.reduce(
      (acc, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
      },
      {} as Record<string, ItineraryItem[]>,
    );

    const organized: ItineraryItem[] = [];

    Object.keys(itemsByDate).forEach((date) => {
      const dateItems = itemsByDate[date];
      dateItems.sort((a, b) => {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
      dateItems.forEach((item, index) => {
        organized.push({ ...item, order: index + 1 });
      });
    });

    return organized;
  };

  const resetForm = () => {
    setFormData({
      date: convertISODateToBR(selectedDate),
      time: "",
      title: "",
      description: "",
      location: "",
      type: "attraction" as ItineraryItem["type"],
      duration: "",
      cost: "",
      notes: "",
    });
    setEditingItem(null);
  };

  const handleEdit = (item: ItineraryItem) => {
    setEditingItem(item);
    setFormData({
      date: convertISODateToBR(item.date),
      time: item.time || "",
      title: item.title,
      description: item.description,
      location: item.location,
      type: item.type,
      duration: item.duration?.toString() || "",
      cost: item.cost?.toString() || "",
      notes: item.notes || "",
    });
    setShowAddItem(true);
  };

  const handleDelete = (item: ItineraryItem) => {
    if (confirm(`Remover "${item.title}" do roteiro?`)) {
      const updatedItinerary = itinerary.filter((i) => i.id !== item.id);
      saveItinerary(updatedItinerary);
      toast.success("Item removido do roteiro!");
    }
  };

  const activityTemplates = [
    {
      type: "attraction" as const,
      title: "Museu Local",
      description: "Visita ao principal museu da cidade",
      duration: 2,
    },
    {
      type: "attraction" as const,
      title: "Centro Histórico",
      description: "Caminhada pelo centro histórico",
      duration: 3,
    },
    {
      type: "restaurant" as const,
      title: "Restaurante Típico",
      description: "Almoço com comida local",
      duration: 1.5,
    },
    {
      type: "restaurant" as const,
      title: "Café da Manhã",
      description: "Café da manhã no hotel ou padaria local",
      duration: 1,
    },
    {
      type: "activity" as const,
      title: "Passeio de Barco",
      description: "Tour de barco pela região",
      duration: 4,
    },
    {
      type: "activity" as const,
      title: "Trilha",
      description: "Caminhada em trilha natural",
      duration: 3,
    },
    {
      type: "transport" as const,
      title: "Transfer Hotel",
      description: "Deslocamento do/para hotel",
      duration: 0.5,
    },
    {
      type: "transport" as const,
      title: "Táxi/Uber",
      description: "Transporte urbano",
      duration: 0.5,
    },
  ];

  const handleUseTemplate = (template: (typeof activityTemplates)[0]) => {
    setFormData({
      ...formData,
      title: template.title,
      description: template.description,
      type: template.type,
      duration: template.duration.toString(),
      date: convertISODateToBR(selectedDate),
    });
    setShowTemplates(false);
    setShowAddItem(true);
  };

  const handleDuplicateItem = (item: ItineraryItem) => {
    setFormData({
      date: convertISODateToBR(selectedDate),
      time: "",
      title: `${item.title} (Cópia)`,
      description: item.description,
      location: item.location,
      type: item.type,
      duration: item.duration?.toString() || "",
      cost: item.cost?.toString() || "",
      notes: item.notes || "",
    });
    setShowAddItem(true);
  };

  const getFilteredItems = (date: string) => {
    let items = getItemsByDate(date);

    if (filterType !== "all") {
      items = items.filter((item) => item.type === filterType);
    }

    if (searchTerm) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return items;
  };

  const moveItem = (itemId: string, direction: "up" | "down") => {
    const item = itinerary.find((i) => i.id === itemId);
    if (!item) return;

    const dateItems = getItemsByDate(item.date);
    const currentIndex = dateItems.findIndex((i) => i.id === itemId);

    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === dateItems.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const swapItem = dateItems[newIndex];

    const updatedItinerary = itinerary.map((i) => {
      if (i.id === item.id) return { ...i, order: swapItem.order };
      if (i.id === swapItem.id) return { ...i, order: item.order };
      return i;
    });

    saveItinerary(updatedItinerary);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Roteiro - {trip.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedDate} onValueChange={setSelectedDate}>
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full grid-cols-7">
                {getDatesInRange().map((date) => (
                  <TabsTrigger key={date} value={date} className="text-xs">
                    {new Date(date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar atividades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(
                      e.target.value as ItineraryItem["type"] | "all",
                    )
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="attraction">Atrações</option>
                  <option value="restaurant">Restaurantes</option>
                  <option value="hotel">Hotéis</option>
                  <option value="transport">Transporte</option>
                  <option value="activity">Atividades</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplates(true)}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Templates
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowAddItem(true);
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          {getDatesInRange().map((date) => (
            <TabsContent
              key={date}
              value={date}
              className="max-h-[500px] overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium">
                      {new Date(date).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      })}
                    </h3>
                  </div>
                </div>

                {getFilteredItems(date).length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {getItemsByDate(date).length === 0
                          ? "Nenhum item no roteiro para esta data"
                          : "Nenhum item encontrado com os filtros aplicados"}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          resetForm();
                          setShowAddItem(true);
                        }}
                      >
                        Adicionar primeiro item
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {getFilteredItems(date).map((item, index) => (
                      <Card
                        key={item.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex flex-col items-center gap-2">
                                {item.time && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.time}
                                  </Badge>
                                )}
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveItem(item.id, "up")}
                                    disabled={index === 0}
                                    className="h-6 w-6 p-0"
                                  >
                                    ↑
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveItem(item.id, "down")}
                                    disabled={
                                      index ===
                                      getFilteredItems(date).length - 1
                                    }
                                    className="h-6 w-6 p-0"
                                  >
                                    ↓
                                  </Button>
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={getTypeColor(item.type)}>
                                    {getTypeIcon(item.type)}
                                    <span className="ml-1 capitalize">
                                      {item.type}
                                    </span>
                                  </Badge>
                                  {item.duration && (
                                    <Badge variant="outline">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {item.duration}min
                                    </Badge>
                                  )}
                                  {item.cost && (
                                    <Badge variant="outline">
                                      R$ {item.cost.toFixed(2)}
                                    </Badge>
                                  )}
                                </div>

                                <h4 className="font-medium text-lg">
                                  {item.title}
                                </h4>

                                {item.location && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {item.location}
                                  </p>
                                )}

                                {item.description && (
                                  <p className="text-sm text-gray-700 mt-2">
                                    {item.description}
                                  </p>
                                )}

                                {item.notes && (
                                  <p className="text-xs text-gray-500 mt-2 italic">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicateItem(item)}
                                title="Duplicar item"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                title="Editar item"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item)}
                                title="Excluir item"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>

      {/* Modal para adicionar/editar item */}
      {showAddItem && (
        <Dialog
          open={true}
          onOpenChange={() => {
            setShowAddItem(false);
            setEditingItem(null);
            setFormData({
              date: "",
              time: "",
              title: "",
              description: "",
              location: "",
              type: "attraction",
              duration: "",
              cost: "",
              notes: "",
            });
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem
                  ? "Editar Item"
                  : `Adicionar ao Dia ${selectedDate}`}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Data *</Label>
                  <DatePicker
                    value={
                      formData.date ? convertISODateToBR(formData.date) : ""
                    }
                    onChange={(value) => {
                      if (value && validateBRDate(value)) {
                        setFormData({
                          ...formData,
                          date: convertBRDateToISO(value),
                        });
                      } else {
                        setFormData({ ...formData, date: value || "" });
                      }
                    }}
                    placeholder="dd/mm/aaaa"
                    required
                    minDate={
                      trip.startDate
                        ? convertBRDateToISO(trip.startDate)
                        : undefined
                    }
                    maxDate={
                      trip.endDate
                        ? convertBRDateToISO(trip.endDate)
                        : undefined
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Visita ao Cristo Redentor"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  placeholder="Endereço ou nome do local"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Detalhes sobre a atividade..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duração (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="120"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Custo (R$)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Dicas, horários especiais, etc..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddItem(false);
                    setEditingItem(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingItem ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Templates */}
      {showTemplates && (
        <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Templates de Atividades</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {activityTemplates.map((template, index) => (
                <Card
                  key={index}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleUseTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Badge className={getTypeColor(template.type)}>
                          {getTypeIcon(template.type)}
                          <span className="ml-1 capitalize">
                            {template.type}
                          </span>
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {template.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {template.duration}h
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowTemplates(false)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
