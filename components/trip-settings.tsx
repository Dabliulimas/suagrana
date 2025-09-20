"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { useAccounts, useTransactions } from "../contexts/unified-context";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import {
  Settings,
  Users,
  Trash2,
  Edit,
  Save,
  AlertTriangle,
  Download,
  Upload,
  Plus,
} from "lucide-react";
import { storage, type Trip, type Contact } from "../lib/storage/storage";
import { toast } from "sonner";
import { FamilySelector } from "./features/family/family-selector";
import {
  formatDateInput,
  convertBRDateToISO,
  convertISODateToBR,
  validateBRDate,
} from "../lib/utils/date-utils";
import { DatePicker } from "./ui/date-picker";

interface TripSettingsProps {
  trip: Trip;
  onUpdate: () => void;
}

export function TripSettings({ trip, onUpdate }: TripSettingsProps) {
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFamilyManager, setShowFamilyManager] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: trip.name,
    destination: trip.destination,
    startDate: convertISODateToBR(trip.startDate),
    endDate: convertISODateToBR(trip.endDate),
    budget: trip.budget.toString(),
    currency: trip.currency,
    description: trip.description || "",
    participants: trip.participants,
  });

  useEffect(() => {
    loadFamilyMembers(); // Always load family members when component mounts
  }, []);

  useEffect(() => {
    if (showFamilyManager) {
      loadFamilyMembers(); // Refresh family members when opening family manager
    }
  }, [showFamilyManager]);

  const loadFamilyMembers = () => {
    try {
      // Load family members from localStorage instead of contacts
      const saved = localStorage.getItem("familyMembers");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      const allFamilyMembers = saved ? JSON.parse(saved) : [];
      setFamilyMembers(Array.isArray(allFamilyMembers) ? allFamilyMembers : []);

      // Ensure participants is always an array of participant names
      if (!Array.isArray(formData.participants)) {
        console.warn(
          "Participants is not an array, converting:",
          formData.participants,
        );
        setFormData({ ...formData, participants: ["Você"] });
        storage.updateTrip(trip.id, { participants: ["Você"] });
        return;
      }

      // Clean up invalid participant names - keep names that exist in family members or "Você"
      const validParticipantNames = formData.participants.filter(
        (name) =>
          typeof name === "string" &&
          (name === "Você" ||
            allFamilyMembers.some((member: any) => member.name === name)),
      );

      if (validParticipantNames.length !== formData.participants.length) {
        console.log("Cleaning up invalid participant names:", {
          before: formData.participants,
          after: validParticipantNames,
        });
        setFormData({ ...formData, participants: validParticipantNames });
        storage.updateTrip(trip.id, { participants: validParticipantNames });
      }
    } catch (error) {
      logComponents.error("Error loading family members:", error);
      setFamilyMembers([]);
      // Ensure participants is still valid even on error
      if (!Array.isArray(formData.participants)) {
        setFormData({ ...formData, participants: ["Você"] });
      }
    }
  };

  const handleSave = () => {
    const budget = Number.parseFloat(formData.budget);
    if (isNaN(budget) || budget <= 0) {
      toast.error("Por favor, insira um orçamento válido");
      return;
    }

    // Validar datas
    if (!validateBRDate(formData.startDate)) {
      toast.error("Data de início inválida. Use o formato dd/mm/aaaa");
      return;
    }

    if (!validateBRDate(formData.endDate)) {
      toast.error("Data de fim inválida. Use o formato dd/mm/aaaa");
      return;
    }

    // Converter datas para ISO para comparação
    const startDateISO = convertBRDateToISO(formData.startDate);
    const endDateISO = convertBRDateToISO(formData.endDate);

    if (new Date(startDateISO) >= new Date(endDateISO)) {
      toast.error("A data de início deve ser anterior à data de fim");
      return;
    }

    storage.updateTrip(trip.id, {
      name: formData.name,
      destination: formData.destination,
      startDate: startDateISO,
      endDate: endDateISO,
      budget,
      currency: formData.currency,
      description: formData.description,
      participants: formData.participants,
    });

    setIsEditing(false);
    onUpdate();
    toast.success("Viagem atualizada com sucesso!");
  };

  const handleDelete = async () => {
    try {
      // Delete from storage
      storage.deleteTrip(trip.id);
      
      // Clear related data
      localStorage.removeItem(`trip-documents-${trip.id}`);
      localStorage.removeItem(`trip-photos-${trip.id}`);
      localStorage.removeItem(`itinerary-${trip.id}`);
      localStorage.removeItem(`trip-checklist-${trip.id}`);

      toast.success("Viagem excluída com sucesso!");
      // Redirect to travel page
      window.location.href = "/travel";
    } catch (error) {
      logComponents.error("Error deleting trip:", error);
      toast.error("Erro ao excluir viagem");
    }
  };

  const exportTripData = () => {
    const tripData = {
      trip,
      documents: JSON.parse(
        localStorage.getItem(`trip-documents-${trip.id}`) || "[]",
      ),
      photos: JSON.parse(
        localStorage.getItem(`trip-photos-${trip.id}`) || "[]",
      ),
      itinerary: JSON.parse(
        localStorage.getItem(`itinerary-${trip.id}`) || "[]",
      ),
      expenses: transactions.filter((t) => t.tripId === trip.id),
    };

    const blob = new Blob([JSON.stringify(tripData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${trip.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dados da viagem exportados!");
  };

  const addParticipant = () => {
    const name = prompt("Nome do participante:");
    if (name && name.trim()) {
      const updatedParticipants = [...formData.participants, name.trim()];
      setFormData({ ...formData, participants: updatedParticipants });

      // Save immediately to storage
      storage.updateTrip(trip.id, {
        participants: updatedParticipants,
      });
      onUpdate();
      toast.success("Participante adicionado com sucesso!");
    }
  };

  const removeParticipant = (index: number) => {
    if (formData.participants[index] === "Você") {
      toast.error("Você não pode se remover da viagem");
      return;
    }
    const updatedParticipants = formData.participants.filter(
      (_, i) => i !== index,
    );
    setFormData({ ...formData, participants: updatedParticipants });

    // Save immediately to storage
    storage.updateTrip(trip.id, {
      participants: updatedParticipants,
    });
    onUpdate();
    toast.success("Participante removido com sucesso!");
  };

  const handleSelectionChange = (memberIds: string[]) => {
    try {
      // Validate input
      if (!Array.isArray(memberIds)) {
        logComponents.error("Invalid memberIds provided:", memberIds);
        toast.error("Erro: dados inválidos recebidos");
        return;
      }

      // Convert family member IDs to names for consistency
      const familyMemberNames = memberIds
        .map((memberId) => {
          const member = familyMembers.find((c) => c.id === memberId);
          return member ? member.name : memberId;
        })
        .filter(
          (name) =>
            typeof name === "string" &&
            name.trim().length > 0 &&
            name !== "Você",
        );

      // Always include "Você" as the first participant and ensure uniqueness
      const updatedParticipants = [
        "Você",
        ...Array.from(new Set(familyMemberNames)),
      ];

      // Validate that trip exists
      if (!trip || !trip.id) {
        logComponents.error("Invalid trip data:", trip);
        toast.error("Erro: dados da viagem inválidos");
        return;
      }

      setFormData({ ...formData, participants: updatedParticipants });
      storage.updateTrip(trip.id, {
        participants: updatedParticipants,
      });
      onUpdate();
      toast.success("Membros da família atualizados com sucesso!");
      setShowFamilyManager(false); // Close modal after selection
    } catch (error) {
      logComponents.error("Error updating participants:", error);
      toast.error("Erro ao atualizar participantes. Tente novamente.");
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Trip Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Informações da Viagem
              </CardTitle>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Viagem</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">Destino</Label>
                    <Input
                      id="destination"
                      value={formData.destination}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destination: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <DatePicker
                      value={
                        formData.startDate
                          ? convertISODateToBR(formData.startDate)
                          : ""
                      }
                      onChange={(value) => {
                        if (value && validateBRDate(value)) {
                          setFormData({
                            ...formData,
                            startDate: convertBRDateToISO(value),
                          });
                        } else {
                          setFormData({ ...formData, startDate: value || "" });
                        }
                      }}
                      placeholder="dd/mm/aaaa"
                      maxDate={
                        formData.endDate
                          ? convertBRDateToISO(formData.endDate)
                          : undefined
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Data de Fim</Label>
                    <DatePicker
                      value={
                        formData.endDate
                          ? convertISODateToBR(formData.endDate)
                          : ""
                      }
                      onChange={(value) => {
                        if (value && validateBRDate(value)) {
                          setFormData({
                            ...formData,
                            endDate: convertBRDateToISO(value),
                          });
                        } else {
                          setFormData({ ...formData, endDate: value || "" });
                        }
                      }}
                      placeholder="dd/mm/aaaa"
                      minDate={
                        formData.startDate
                          ? convertBRDateToISO(formData.startDate)
                          : undefined
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Orçamento</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
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
                        <SelectItem value="BRL">Real (R$)</SelectItem>
                        <SelectItem value="USD">Dólar ($)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">Libra (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descreva sua viagem..."
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Nome
                    </Label>
                    <p className="text-lg font-medium">{trip.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Destino
                    </Label>
                    <p className="text-lg font-medium">{trip.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Período
                    </Label>
                    <p className="text-lg font-medium">
                      {new Date(trip.startDate).toLocaleDateString("pt-BR")} -{" "}
                      {new Date(trip.endDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Orçamento
                    </Label>
                    <p className="text-lg font-medium">
                      {trip.currency} {trip.budget.toFixed(2)}
                    </p>
                  </div>
                </div>

                {trip.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Descrição
                    </Label>
                    <p className="text-gray-700">{trip.description}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Participants Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participantes
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFamilyManager(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Adicionar/Remover Membros da Família
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!Array.isArray(formData.participants) ||
              formData.participants.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Nenhum participante adicionado
                </p>
              ) : (
                formData.participants.map((participantName) => {
                  // Find family member by name or show "Você" for self
                  const familyMember = familyMembers.find(
                    (c) => c.name === participantName,
                  );
                  const isYou = participantName === "Você";

                  return (
                    <div
                      key={participantName}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {participantName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{participantName}</span>
                          {familyMember && (
                            <p className="text-sm text-gray-500">
                              {familyMember.relationship}
                            </p>
                          )}
                          {isYou && (
                            <p className="text-sm text-gray-500">
                              Organizador da viagem
                            </p>
                          )}
                        </div>
                      </div>
                      {!isYou && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                `Tem certeza que deseja remover ${participantName} da viagem?`,
                              )
                            ) {
                              try {
                                const updatedParticipants =
                                  formData.participants.filter(
                                    (name) => name !== participantName,
                                  );
                                setFormData({
                                  ...formData,
                                  participants: updatedParticipants,
                                });
                                storage.updateTrip(trip.id, {
                                  participants: updatedParticipants,
                                });
                                onUpdate();
                                toast.success(
                                  "Participante removido com sucesso!",
                                );
                              } catch (error) {
                                logComponents.error("Error removing participant:", error,
                                );
                                toast.error(
                                  "Erro ao remover participante. Tente novamente.",
                                );
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={exportTripData}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Dados da Viagem
              </Button>
              <Button variant="outline" className="flex-1" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Importar Dados (Em breve)
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Exporte todos os dados da viagem (roteiro, documentos, fotos,
              gastos) para backup ou compartilhamento.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Ações irreversíveis. Tenha cuidado ao usar essas opções.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Viagem Permanentemente
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <Dialog open={true} onOpenChange={setShowDeleteModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Confirmar Exclusão
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <p>
                  Tem certeza que deseja excluir permanentemente a viagem{" "}
                  <strong>"{trip.name}"</strong>?
                </p>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Esta ação não pode ser desfeita!</strong> Todos os
                    dados relacionados serão perdidos:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                    <li>Roteiro e itinerários</li>
                    <li>Documentos e checklist</li>
                    <li>Fotos e galeria</li>
                    <li>Relatórios de gastos</li>
                    <li>Todas as configurações</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Permanentemente
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Family Selector for adding participants */}
        <FamilySelector
          open={showFamilyManager}
          onOpenChange={setShowFamilyManager}
          selectedMembers={trip.participants
            .map((participantName) => {
              const member = familyMembers.find(
                (c) => c.name === participantName,
              );
              return member ? member.id : participantName;
            })
            .filter((id) => id !== "Você")}
          onSelectionChange={handleSelectionChange}
          onFamilyMemberCreated={loadFamilyMembers}
        />
      </div>
    </>
  );
}
