"use client";

import { useEffect, useMemo, useState } from "react";
import { ModernAppLayout } from "@/components/modern-app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BackButton } from "@/components/back-button";
import { toast } from "sonner";

interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  color?: string;
}

function FamilyManagement() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [form, setForm] = useState({ name: "", email: "", color: "#3B82F6" });
  const initials = useMemo(
    () => (name: string) =>
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
    [],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("familyMembers");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      setMembers(saved ? JSON.parse(saved) : []);
    } catch {
      setMembers([]);
    }
  }, []);

  const saveMembers = (list: FamilyMember[]) => {
    localStorage.setItem("familyMembers", JSON.stringify(list));
    setMembers(list);
  };

  const addMember = () => {
    if (!form.name.trim()) {
      toast.error("Nome e obrigatorio");
      return;
    }
    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      color: form.color,
    };
    const updated = [newMember, ...members];
    saveMembers(updated);
    setForm({ name: "", email: "", color: "#3B82F6" });
    toast.success("Membro adicionado");
  };

  const removeMember = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    saveMembers(updated);
    toast.success("Membro removido");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Membro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Maria Silva"
              />
            </div>
            <div className="sm:col-span-1 lg:col-span-1">
              <Label>Email (opcional)</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="maria@exemplo.com"
              />
            </div>
            <div className="sm:col-span-1 lg:col-span-1">
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-12 h-10 p-1 flex-shrink-0"
                />
                <Input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="flex-1 min-w-0"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={addMember} className="w-full sm:w-auto">
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membros ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum membro cadastrado</p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="flex-shrink-0">
                    <AvatarFallback
                      style={{
                        backgroundColor: m.color || "#CBD5E1",
                        color: "#fff",
                      }}
                    >
                      {initials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{m.name}</p>
                    {m.email && (
                      <p className="text-xs text-gray-500 truncate">
                        {m.email}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="text-red-600 w-full sm:w-auto flex-shrink-0"
                  onClick={() => removeMember(m.id)}
                >
                  Remover
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function FamilyPage() {
  return (
    <ModernAppLayout
      title="Família"
      subtitle="Gerencie os membros da sua família"
    >
      <div className="p-4 md:p-6 space-y-6">
        <BackButton />
        <FamilyManagement />
      </div>
    </ModernAppLayout>
  );
}
