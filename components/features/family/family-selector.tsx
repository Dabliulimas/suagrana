"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../../../lib/logger";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Users, Plus, Search, Check, X, Heart } from "lucide-react";
import { toast } from "sonner";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  color: string;
}

interface FamilySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMembers?: string[];
  onSelectionChange?: (memberIds: string[]) => void;
  onFamilyMemberCreated?: () => void;
}

export function FamilySelector({
  open,
  onOpenChange,
  selectedMembers = [],
  onSelectionChange,
  onFamilyMemberCreated,
}: FamilySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: "",
    relationship: "",
    color: "#3B82F6",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load family members from localStorage
  const loadFamilyMembers = () => {
    try {
      const saved = localStorage.getItem("familyMembers");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      const parsed = saved ? JSON.parse(saved) : [];
      setFamilyMembers(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      logComponents.error("Error loading family members:", error);
      setFamilyMembers([]);
    }
  };

  useEffect(() => {
    if (open) {
      loadFamilyMembers();
    }
  }, [open]);

  // Filter family members based on search term
  const filteredMembers = familyMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.relationship.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle member selection
  const handleMemberToggle = (memberId: string) => {
    const newSelection = selectedMembers.includes(memberId)
      ? selectedMembers.filter((id) => id !== memberId)
      : [...selectedMembers, memberId];

    onSelectionChange?.(newSelection);
  };

  // Handle adding new family member
  const handleAddMember = async () => {
    if (!newMemberForm.name.trim() || !newMemberForm.relationship) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsLoading(true);
    try {
      const newMember: FamilyMember = {
        id: Date.now().toString(),
        name: newMemberForm.name.trim(),
        relationship: newMemberForm.relationship,
        color: newMemberForm.color,
      };

      const updatedMembers = [...familyMembers, newMember];
      localStorage.setItem("familyMembers", JSON.stringify(updatedMembers));
      setFamilyMembers(updatedMembers);

      // Reset form
      setNewMemberForm({
        name: "",
        relationship: "",
        color: "#3B82F6",
      });
      setShowAddForm(false);

      toast.success("Membro da família adicionado com sucesso!");
      onFamilyMemberCreated?.();
    } catch (error) {
      logComponents.error("Error adding family member:", error);
      toast.error("Erro ao adicionar membro da família");
    } finally {
      setIsLoading(false);
    }
  };

  const relationshipOptions = [
    { value: "Pai", label: "Pai" },
    { value: "Mãe", label: "Mãe" },
    { value: "Filho", label: "Filho" },
    { value: "Filha", label: "Filha" },
    { value: "Cônjuge", label: "Cônjuge" },
    { value: "Irmão", label: "Irmão" },
    { value: "Irmã", label: "Irmã" },
    { value: "Avô", label: "Avô" },
    { value: "Avó", label: "Avó" },
    { value: "Tio", label: "Tio" },
    { value: "Tia", label: "Tia" },
    { value: "Primo", label: "Primo" },
    { value: "Prima", label: "Prima" },
    { value: "Outro", label: "Outro" },
  ];

  const colorOptions = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Selecionar Membros da Família
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar membros da família..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Add new member button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {selectedMembers.length} membro(s) selecionado(s)
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Membro
            </Button>
          </div>

          {/* Add member form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Novo Membro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="member-name">Nome *</Label>
                  <Input
                    id="member-name"
                    value={newMemberForm.name}
                    onChange={(e) =>
                      setNewMemberForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div>
                  <Label htmlFor="member-relationship">Parentesco *</Label>
                  <Select
                    value={newMemberForm.relationship}
                    onValueChange={(value) =>
                      setNewMemberForm((prev) => ({
                        ...prev,
                        relationship: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parentesco" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cor do Avatar</Label>
                  <div className="flex gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          newMemberForm.color === color
                            ? "border-gray-800"
                            : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          setNewMemberForm((prev) => ({ ...prev, color }))
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddMember}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Adicionando..." : "Adicionar"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Family members list */}
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {familyMembers.length === 0
                  ? "Nenhum membro cadastrado"
                  : "Nenhum resultado encontrado"}
              </h3>
              <p className="text-gray-500 mb-4">
                {familyMembers.length === 0
                  ? "Adicione membros da sua família para incluí-los nas viagens"
                  : "Tente ajustar os termos de busca"}
              </p>
              {familyMembers.length === 0 && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Membro
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredMembers.map((member) => {
                const isSelected = selectedMembers.includes(member.id);
                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleMemberToggle(member.id)}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-500">
                        {member.relationship}
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast.success(
                  `${selectedMembers.length} membro(s) selecionado(s)!`,
                );
                onOpenChange(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirmar Seleção
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
