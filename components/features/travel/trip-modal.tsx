"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../../../lib/logger";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Textarea } from "../../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import {
  Plane,
  Plus,
  X,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  CalendarIcon,
} from "lucide-react";
import { storage, type Trip } from "../../../lib/storage/storage";
import { useToast } from "../../../hooks/use-toast";
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  validateBRDate,
  getCurrentDateBR,
} from "../../../lib/utils/date-utils";
import { useTrips } from "../../../contexts/unified-context";
import { Calendar as CalendarComponent } from "../../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: Trip;
  onSave?: () => void;
}

export function TripModal({ open, onOpenChange, trip, onSave }: TripModalProps) {
  const { toast } = useToast();

  // Estado de montagem para evitar problemas de hidratação
  const [isMounted, setIsMounted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    startDate: getCurrentDateBR(),
    endDate: getCurrentDateBR(),
    budget: "",
    currency: "BRL",
    participants: ["Você"],
    description: "",
    accommodation: "",
    transportation: "",
    activities: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showFamilySelector, setShowFamilySelector] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  // Use unified trip system
  const { create: createTrip, update: updateTrip } = useTrips();

  // Carregar membros da família
  const loadFamilyMembers = () => {
    try {
      const saved = localStorage.getItem("familyMembers");
      if (typeof window === "undefined") return;
      const allFamilyMembers = saved ? JSON.parse(saved) : [];
      setFamilyMembers(Array.isArray(allFamilyMembers) ? allFamilyMembers : []);
    } catch (error) {
      logComponents.error("Error loading family members:", error);
      setFamilyMembers([]);
    }
  };

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  useEffect(() => {
    if (trip) {
      setFormData({
        name: trip.name,
        destination: trip.destination,
        startDate: convertISODateToBR(trip.startDate),
        endDate: convertISODateToBR(trip.endDate),
        budget: trip.budget.toString(),
        currency: trip.currency,
        participants: trip.participants,
        description: trip.description || "",
        accommodation: "",
        transportation: "",
        activities: "",
      });
    }
  }, [trip]);

  const currencies = [
    { value: "BRL", label: "Real (R$)" },
    { value: "USD", label: "Dólar ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "Libra (£)" },
  ];

  const removeParticipant = (participant: string) => {
    if (participant !== "Você") {
      setFormData({
        ...formData,
        participants: formData.participants.filter((p) => p !== participant),
      });
    }
  };

  const addFamilyMember = (memberName: string) => {
    if (!formData.participants.includes(memberName)) {
      setFormData({
        ...formData,
        participants: [...formData.participants, memberName],
      });
    }
  };

  // Definir estado de montagem após hidratação
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {


      // Validação de datas
      if (!validateBRDate(formData.startDate)) {

        toast({
          title: "Erro",
          description:
            "Por favor, insira uma data de início válida no formato dd/mm/aaaa",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!validateBRDate(formData.endDate)) {

        toast({
          title: "Erro",
          description:
            "Por favor, insira uma data de fim válida no formato dd/mm/aaaa",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const budget = Number.parseFloat(formData.budget);


      if (isNaN(budget) || budget <= 0) {

        toast({
          title: "Erro",
          description: "Por favor, insira um orçamento válido",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Converter datas para ISO para comparação
      const startDateISO = convertBRDateToISO(formData.startDate);
      const endDateISO = convertBRDateToISO(formData.endDate);


      if (new Date(startDateISO) >= new Date(endDateISO)) {

        toast({
          title: "Erro",
          description: "A data de início deve ser anterior à data de fim",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const tripData = {
        name: formData.name,
        destination: formData.destination,
        startDate: convertBRDateToISO(formData.startDate),
        endDate: convertBRDateToISO(formData.endDate),
        budget,
        currency: formData.currency,
        participants: formData.participants,
        description: formData.description,
        status: trip?.status || ("planned" as const),
        spent: trip?.spent || 0,
      };



      if (trip) {
        console.log('Atualizando viagem:', trip.id, tripData);
        await updateTrip(trip.id, tripData);
        // Atualizar também no storage para compatibilidade
        storage.updateTrip(trip.id, {
          ...tripData,
          spent: trip.spent
        });
        console.log('Viagem atualizada com sucesso');
        toast({
          title: "Sucesso",
          description: "Viagem atualizada com sucesso!",
        });
      } else {
        console.log('Criando nova viagem:', tripData);
        const newTrip = await createTrip(tripData);
        console.log('Viagem criada via contexto:', newTrip);
        
        // Salvar também no storage para compatibilidade  
        // Se newTrip já tem id, significa que foi salvo com sucesso
        // Vamos usar uma implementação diferente para evitar duplicação de IDs
        const compatibleTrip = {
          ...tripData,
          id: newTrip.id,
          spent: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log('Salvando viagem no storage:', compatibleTrip);
        
        // Usar direct localStorage para evitar problema com saveTrip
        const existingTrips = storage.getTrips();
        const tripExists = existingTrips.some(t => t.id === newTrip.id);
        if (!tripExists) {
          existingTrips.push(compatibleTrip);
          localStorage.setItem('sua-grana-trips', JSON.stringify(existingTrips));
          console.log('Viagem adicionada diretamente ao localStorage');
        } else {
          console.log('Viagem já existe no storage, pulando duplicação');
        }
        console.log('Viagem salva no storage');
        
        toast({
          title: "Sucesso",
          description: "Viagem criada com sucesso!",
        });
      }


      // Chamar callback se fornecido
      if (onSave) {
        onSave();
      }
      
      onOpenChange(false);
    } catch (error) {
      logComponents.error("Erro no handleSubmit:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar viagem",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDuration = () => {
    if (
      formData.startDate &&
      formData.endDate &&
      validateBRDate(formData.startDate) &&
      validateBRDate(formData.endDate)
    ) {
      try {
        const startISO = convertBRDateToISO(formData.startDate);
        const endISO = convertBRDateToISO(formData.endDate);
        const start = new Date(startISO);
        const end = new Date(endISO);
        // Adiciona 1 para incluir o dia final no cálculo
        const days =
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1;
        return days > 0 ? `${days} dia${days > 1 ? "s" : ""}` : "";
      } catch {
        return "";
      }
    }
    return "";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-blue-600" />
              {trip ? "Editar Viagem" : "Planejar Nova Viagem"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Informações Básicas
              </h3>

              <div>
                <Label htmlFor="name">Nome da Viagem *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Férias em Paris, Final de semana em Gramado..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="destination">Destino *</Label>
                <Input
                  id="destination"
                  placeholder="Ex: Paris, França"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva sua viagem, objetivos, pontos de interesse..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Datas */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Período da Viagem
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Popover
                    open={showStartCalendar}
                    onOpenChange={setShowStartCalendar}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate || "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 z-[9999]"
                      align="start"
                    >
                      {isMounted && (
                        <CalendarComponent
                          mode="single"
                          selected={
                            formData.startDate
                              ? new Date(convertBRDateToISO(formData.startDate))
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const brDate = format(date, "dd/MM/yyyy", {
                                locale: ptBR,
                              });
                              setFormData({ ...formData, startDate: brDate });
                            }
                            setShowStartCalendar(false);
                          }}
                          disabled={(date) => {
                            if (
                              formData.endDate &&
                              validateBRDate(formData.endDate)
                            ) {
                              const endDate = new Date(
                                convertBRDateToISO(formData.endDate),
                              );
                              return date > endDate;
                            }
                            return false;
                          }}
                          initialFocus
                        />
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="endDate">Data de Fim *</Label>
                  <Popover
                    open={showEndCalendar}
                    onOpenChange={setShowEndCalendar}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate || "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 z-[9999]"
                      align="start"
                    >
                      {isMounted && (
                        <CalendarComponent
                          mode="single"
                          selected={
                            formData.endDate
                              ? new Date(convertBRDateToISO(formData.endDate))
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              const brDate = format(date, "dd/MM/yyyy", {
                                locale: ptBR,
                              });
                              setFormData({ ...formData, endDate: brDate });
                            }
                            setShowEndCalendar(false);
                          }}
                          disabled={(date) => {
                            if (
                              formData.startDate &&
                              validateBRDate(formData.startDate)
                            ) {
                              const startDate = new Date(
                                convertBRDateToISO(formData.startDate),
                              );
                              return date < startDate;
                            }
                            return false;
                          }}
                          initialFocus
                        />
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {getDuration() && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Duração da Viagem
                  </p>
                  <p className="text-sm text-blue-600">{getDuration()}</p>
                </div>
              )}
            </div>

            {/* Orçamento */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Orçamento
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Orçamento Total *</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies
                        .filter(
                          (currency) =>
                            currency.value && currency.value.trim() !== "",
                        )
                        .map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Participantes */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Participantes da Família
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFamilySelector(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar da Família
                </Button>
              </div>

              {/* Lista de membros da família disponíveis */}
              {familyMembers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Membros da família disponíveis:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {familyMembers.map((member) => (
                      <Button
                        key={member.id || member.name}
                        type="button"
                        variant={
                          formData.participants.includes(member.name)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          if (formData.participants.includes(member.name)) {
                            removeParticipant(member.name);
                          } else {
                            addFamilyMember(member.name);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="w-4 h-4">
                          <AvatarFallback
                            className="text-xs"
                            style={{
                              backgroundColor: member.color || "#3B82F6",
                            }}
                          >
                            {member.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Participantes selecionados */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Participantes selecionados:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.participants.map((participant) => (
                    <Badge
                      key={participant}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">
                          {participant === "Você"
                            ? "EU"
                            : participant
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {participant}
                      {participant !== "Você" && (
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-600"
                          onClick={() => removeParticipant(participant)}
                        />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {familyMembers.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum membro da família encontrado</p>
                  <p className="text-xs">
                    Vá para a página Família para adicionar membros
                  </p>
                </div>
              )}
            </div>

            {/* Planejamento Detalhado */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">
                Planejamento Detalhado (Opcional)
              </h3>

              <div>
                <Label htmlFor="accommodation">Hospedagem</Label>
                <Textarea
                  id="accommodation"
                  placeholder="Hotéis, pousadas, Airbnb..."
                  value={formData.accommodation}
                  onChange={(e) =>
                    setFormData({ ...formData, accommodation: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="transportation">Transporte</Label>
                <Textarea
                  id="transportation"
                  placeholder="Voos, ônibus, aluguel de carro..."
                  value={formData.transportation}
                  onChange={(e) =>
                    setFormData({ ...formData, transportation: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="activities">
                  Atividades e Pontos Turísticos
                </Label>
                <Textarea
                  id="activities"
                  placeholder="Museus, restaurantes, passeios..."
                  value={formData.activities}
                  onChange={(e) =>
                    setFormData({ ...formData, activities: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading
                  ? "Salvando..."
                  : `${trip ? "Atualizar" : "Criar"} Viagem`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para adicionar novo membro da família */}
      {showFamilySelector && (
        <Dialog open={showFamilySelector} onOpenChange={setShowFamilySelector}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Adicionar Membro da Família</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Para adicionar novos membros da família, vá para a página{" "}
                <strong>Família</strong> no menu principal.
              </p>
              <div className="flex justify-end">
                <Button onClick={() => setShowFamilySelector(false)}>
                  Entendi
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
