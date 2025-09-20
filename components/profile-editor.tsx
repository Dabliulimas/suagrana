"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { User, Mail, Phone, Palette, Globe, Bell } from "lucide-react";
import { type UserProfile, type UserPreferences } from "../lib/data-layer/types";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { storage } from "../lib/storage/storage";
import { toast } from "sonner";

interface ProfileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated?: () => void;
}

export function ProfileEditor({
  open,
  onOpenChange,
  onProfileUpdated,
}: ProfileEditorProps) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    currency: "BRL",
    language: "pt-BR",
    theme: "system" as const,
    notifications: {
      billing: true,
      goal: true,
      investments: true,
      general: true,
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = () => {
    try {
      const existingProfile = storage.getUserProfile();
      if (existingProfile) {
        setProfile(existingProfile);
        setFormData({
          name: existingProfile.name,
          email: existingProfile.email,
          phone: existingProfile.phone || "",
          avatar: existingProfile.avatar || "",
        });
        setPreferences(existingProfile.preferences);
      } else {
        // Set default values for new profile
        setFormData({
          name: "",
          email: "",
          phone: "",
          avatar: "",
        });
      }
    } catch (error) {
      logComponents.error("Error loading profile:", error);
      toast.error("Erro ao carregar perfil");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name.trim()) {
        toast.error("Nome é obrigatório");
        return;
      }

      if (!formData.email.trim()) {
        toast.error("Email é obrigatório");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error("Por favor, insira um email válido");
        return;
      }

      const profileData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        avatar: formData.avatar.trim() || undefined,
        preferences,
      };

      if (profile) {
        storage.updateUserProfile(profileData);
        toast.success("Perfil atualizado com sucesso!");
      } else {
        storage.saveUserProfile(profileData);
        toast.success("Perfil criado com sucesso!");
      }

      onProfileUpdated?.();
      onOpenChange(false);
    } catch (error) {
      logComponents.error("Error saving profile:", error);
      toast.error("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNotificationChange = (
    key: keyof UserPreferences["notifications"],
    value: boolean,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            {profile ? "Editar Perfil" : "Criar Perfil"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Foto do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={formData.avatar} />
                <AvatarFallback className="text-lg">
                  {formData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar">URL da Foto</Label>
                <Input
                  id="avatar"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={formData.avatar}
                  onChange={(e) =>
                    setFormData({ ...formData, avatar: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Preferências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currency">Moeda Padrão</Label>
                <Select
                  value={preferences.currency}
                  onValueChange={(value) =>
                    handlePreferenceChange("currency", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                    <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">Libra Esterlina (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language">Idioma</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) =>
                    handlePreferenceChange("language", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="theme">Tema</Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) =>
                    handlePreferenceChange("theme", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="billing-notifications">
                  Cobrança e Faturas
                </Label>
                <input
                  id="billing-notifications"
                  type="checkbox"
                  checked={preferences.notifications.billing}
                  onChange={(e) =>
                    handleNotificationChange("billing", e.target.checked)
                  }
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="goal-notifications">Metas Financeiras</Label>
                <input
                  id="goal-notifications"
                  type="checkbox"
                  checked={preferences.notifications.goal}
                  onChange={(e) =>
                    handleNotificationChange("goal", e.target.checked)
                  }
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="investment-notifications">Investimentos</Label>
                <input
                  id="investment-notifications"
                  type="checkbox"
                  checked={preferences.notifications.investments}
                  onChange={(e) =>
                    handleNotificationChange("investments", e.target.checked)
                  }
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="general-notifications">Geral</Label>
                <input
                  id="general-notifications"
                  type="checkbox"
                  checked={preferences.notifications.general}
                  onChange={(e) =>
                    handleNotificationChange("general", e.target.checked)
                  }
                  className="rounded"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Salvando..."
                : profile
                  ? "Atualizar Perfil"
                  : "Criar Perfil"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
