"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Camera,
  Utensils,
  Building,
  Navigation,
  MapPin,
  Plus,
  Clock,
  DollarSign,
} from "lucide-react";
import type { Trip } from "../lib/storage";
import { toast } from "sonner";

interface QuickItineraryCreatorProps {
  trip: Trip;
  selectedDate: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface QuickItem {
  title: string;
  type: "attraction" | "restaurant" | "hotel" | "transport" | "activity";
  time?: string;
  location?: string;
  cost?: number;
}

const quickTemplates = [
  { title: "Café da manhã", type: "restaurant" as const, time: "08:00" },
  { title: "Check-in hotel", type: "hotel" as const, time: "15:00" },
  { title: "Almoço", type: "restaurant" as const, time: "12:00" },
  { title: "Jantar", type: "restaurant" as const, time: "19:00" },
  { title: "Transporte", type: "transport" as const },
  { title: "Passeio turístico", type: "attraction" as const, time: "10:00" },
  { title: "Atividade livre", type: "activity" as const, time: "14:00" },
  { title: "Check-out hotel", type: "hotel" as const, time: "11:00" },
];

const getTypeIcon = (type: QuickItem["type"]) => {
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
  }
};

const getTypeColor = (type: QuickItem["type"]) => {
  switch (type) {
    case "attraction":
      return "bg-blue-100 text-blue-800";
    case "restaurant":
      return "bg-green-100 text-green-800";
    case "hotel":
      return "bg-purple-100 text-purple-800";
    case "transport":
      return "bg-orange-100 text-orange-800";
    case "activity":
      return "bg-pink-100 text-pink-800";
  }
};

export function QuickItineraryCreator({
  trip,
  selectedDate,
  onClose,
  onUpdate,
}: QuickItineraryCreatorProps) {
  const [items, setItems] = useState<QuickItem[]>([]);
  const [customTitle, setCustomTitle] = useState("");
  const [customType, setCustomType] = useState<QuickItem["type"]>("attraction");

  const addTemplate = (template: (typeof quickTemplates)[0]) => {
    setItems([...items, { ...template }]);
  };

  const addCustomItem = () => {
    if (!customTitle.trim()) return;

    setItems([
      ...items,
      {
        title: customTitle,
        type: customType,
      },
    ]);
    setCustomTitle("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuickItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const saveItinerary = () => {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um item ao roteiro");
      return;
    }

    try {
      const existingItinerary = JSON.parse(
        localStorage.getItem(`itinerary_${trip.id}`) || "[]",
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      const maxOrder = existingItinerary.reduce(
        (max: number, item: any) => Math.max(max, item.order || 0),
        0,
      );

      const newItems = items.map((item, index) => ({
        id: `${Date.now()}_${index}`,
        date: selectedDate,
        title: item.title,
        description: "",
        location: item.location || "",
        type: item.type,
        time: item.time,
        cost: item.cost,
        duration: undefined,
        notes: "",
        order: maxOrder + index + 1,
        createdAt: new Date().toISOString(),
      }));

      const updatedItinerary = [...existingItinerary, ...newItems];
      localStorage.setItem(
        `itinerary_${trip.id}`,
        JSON.stringify(updatedItinerary),
      );

      toast.success(`${items.length} item(s) adicionado(s) ao roteiro!`);
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar roteiro");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Criação Rápida -{" "}
            {new Date(selectedDate).toLocaleDateString("pt-BR")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Templates Rápidos */}
          <div>
            <h3 className="font-medium mb-3">Templates Rápidos</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => addTemplate(template)}
                  className="justify-start h-auto p-3"
                >
                  <div className="flex items-center gap-2">
                    {getTypeIcon(template.type)}
                    <div className="text-left">
                      <div className="font-medium text-sm">
                        {template.title}
                      </div>
                      {template.time && (
                        <div className="text-xs text-gray-500">
                          {template.time}
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Item Personalizado */}
          <div>
            <h3 className="font-medium mb-3">Adicionar Item Personalizado</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Nome da atividade..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addCustomItem()}
                className="flex-1"
              />
              <select
                value={customType}
                onChange={(e) =>
                  setCustomType(e.target.value as QuickItem["type"])
                }
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="attraction">Atração</option>
                <option value="restaurant">Restaurante</option>
                <option value="hotel">Hotel</option>
                <option value="transport">Transporte</option>
                <option value="activity">Atividade</option>
              </select>
              <Button onClick={addCustomItem} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Lista de Itens */}
          {items.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">
                Itens do Roteiro ({items.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {items.map((item, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge className={getTypeColor(item.type)}>
                          {getTypeIcon(item.type)}
                        </Badge>
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <Input
                                type="time"
                                value={item.time || ""}
                                onChange={(e) =>
                                  updateItem(index, "time", e.target.value)
                                }
                                className="h-6 text-xs w-20 p-1"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <Input
                                placeholder="Local"
                                value={item.location || ""}
                                onChange={(e) =>
                                  updateItem(index, "location", e.target.value)
                                }
                                className="h-6 text-xs w-24 p-1"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-gray-400" />
                              <Input
                                type="number"
                                placeholder="R$"
                                value={item.cost || ""}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "cost",
                                    parseFloat(e.target.value) || undefined,
                                  )
                                }
                                className="h-6 text-xs w-16 p-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={saveItinerary} disabled={items.length === 0}>
              Salvar Roteiro ({items.length}{" "}
              {items.length === 1 ? "item" : "itens"})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
