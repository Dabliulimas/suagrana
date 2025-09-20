"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Users, Plus, X, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: "adult" | "child";
  selected: boolean;
}

interface FamilySelectorProps {
  selectedMembers: string[];
  onSelectionChange: (memberIds: string[]) => void;
  maxSelection?: number;
  allowAddNew?: boolean;
}

export function FamilySelector({
  selectedMembers,
  onSelectionChange,
  maxSelection,
  allowAddNew = true,
}: FamilySelectorProps) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "adult" as "adult" | "child",
  });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/contacts");
        const d = r.ok ? await r.json() : { contacts: [] };
        setMembers(d.contacts || []);
      } catch {}
    })();
  }, []);

  const loadFamilyMembers = () => {
    const savedMembers = localStorage.getItem("family-members");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (savedMembers) {
      const parsed = JSON.parse(savedMembers);
      setMembers(
        parsed.map((member: any) => ({
          ...member,
          selected: selectedMembers.includes(member.id),
        })),
      );
    } else {
      // Membros padrão
      const defaultMembers: FamilyMember[] = [
        {
          id: "1",
          name: "Você",
          email: "voce@email.com",
          role: "adult",
          selected: selectedMembers.includes("1"),
        },
        {
          id: "2",
          name: "Cônjuge",
          email: "conjuge@email.com",
          role: "adult",
          selected: selectedMembers.includes("2"),
        },
      ];
      setMembers(defaultMembers);
    }
  };

  const saveFamilyMembers = (updatedMembers: FamilyMember[]) => {
    const membersToSave = updatedMembers.map(
      ({ selected, ...member }) => member,
    );
    localStorage.setItem("family-members", JSON.stringify(membersToSave));
  };

  const toggleMemberSelection = (memberId: string) => {
    const updatedMembers = members.map((member) => {
      if (member.id === memberId) {
        const newSelected = !member.selected;

        // Verificar limite máximo
        if (newSelected && maxSelection) {
          const currentSelected = members.filter((m) => m.selected).length;
          if (currentSelected >= maxSelection) {
            toast.error(
              `Máximo de ${maxSelection} membros podem ser selecionados`,
            );
            return member;
          }
        }

        return { ...member, selected: newSelected };
      }
      return member;
    });

    setMembers(updatedMembers);

    const selectedIds = updatedMembers
      .filter((member) => member.selected)
      .map((member) => member.id);

    onSelectionChange(selectedIds);
  };

  const addNewMember = () => {
    if (!newMember.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const member: FamilyMember = {
      id: Date.now().toString(),
      name: newMember.name.trim(),
      email: newMember.email.trim() || undefined,
      phone: newMember.phone.trim() || undefined,
      role: newMember.role,
      selected: false,
    };

    const updatedMembers = [...members, member];
    setMembers(updatedMembers);
    saveFamilyMembers(updatedMembers);

    setNewMember({ name: "", email: "", phone: "", role: "adult" });
    setShowAddForm(false);

    toast.success("Membro adicionado com sucesso!");
  };

  const removeMember = (memberId: string) => {
    const updatedMembers = members.filter((member) => member.id !== memberId);
    setMembers(updatedMembers);
    saveFamilyMembers(updatedMembers);

    // Atualizar seleção se o membro removido estava selecionado
    const selectedIds = updatedMembers
      .filter((member) => member.selected)
      .map((member) => member.id);

    onSelectionChange(selectedIds);
    toast.success("Membro removido");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedCount = members.filter((member) => member.selected).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <Label className="text-base font-medium">Membros da Família</Label>
          {selectedCount > 0 && (
            <Badge variant="secondary">
              {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {allowAddNew && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Formulário para adicionar novo membro */}
      {showAddForm && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="memberName">Nome *</Label>
              <Input
                id="memberName"
                value={newMember.name}
                onChange={(e) =>
                  setNewMember((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nome do membro"
              />
            </div>

            <div>
              <Label htmlFor="memberRole">Tipo</Label>
              <select
                id="memberRole"
                value={newMember.role}
                onChange={(e) =>
                  setNewMember((prev) => ({
                    ...prev,
                    role: e.target.value as "adult" | "child",
                  }))
                }
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="adult">Adulto</option>
                <option value="child">Criança</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="memberEmail">Email</Label>
              <Input
                id="memberEmail"
                type="email"
                value={newMember.email}
                onChange={(e) =>
                  setNewMember((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="memberPhone">Telefone</Label>
              <Input
                id="memberPhone"
                value={newMember.phone}
                onChange={(e) =>
                  setNewMember((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" onClick={addNewMember} size="sm">
              Adicionar Membro
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de membros */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum membro cadastrado</p>
            <p className="text-sm">
              Adicione membros da família para incluir na viagem
            </p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                member.selected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
              onClick={() => toggleMemberSelection(member.id)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar} />
                <AvatarFallback
                  className={
                    member.role === "child"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-green-100 text-green-600"
                  }
                >
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{member.name}</span>
                  <Badge
                    variant={member.role === "adult" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {member.role === "adult" ? "Adulto" : "Criança"}
                  </Badge>
                  {member.selected && (
                    <Badge variant="default" className="text-xs">
                      Selecionado
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  {member.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {member.id !== "1" && ( // Não permitir remover "Você"
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Remover ${member.name} da família?`)) {
                      removeMember(member.id);
                    }
                  }}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {maxSelection && (
        <div className="text-sm text-muted-foreground">
          Máximo de {maxSelection} membros podem ser selecionados
        </div>
      )}
    </div>
  );
}

export default FamilySelector;
