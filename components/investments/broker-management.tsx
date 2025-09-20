"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Building2,
  Plus,
  Edit,
  MoreHorizontal,
  Palette,
  Check,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useInvestments } from "../../contexts/unified-context";
import { Broker } from "../../lib/types/investments";
import { toast } from "sonner";
import { useSafeTheme } from "../../hooks/use-safe-theme";

interface BrokerManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
  "#FF6B35",
  "#8A05BE",
  "#00D4AA",
  "#1E3A8A",
  "#FFD700",
  "#EC7000",
  "#0066CC",
  "#FF8C00",
  "#FF4444",
  "#4A90E2",
  "#FFD23F",
  "#00C851",
  "#6F42C1",
  "#E83E8C",
  "#20C997",
  "#FD7E14",
  "#6610F2",
  "#E91E63",
  "#795548",
  "#607D8B",
];

export function BrokerManagement({
  open,
  onOpenChange,
}: BrokerManagementProps) {
  const { state, addCustomBroker, updateBroker } = useInvestments();
  const { settings } = useSafeTheme();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const { brokers } = state;
  const defaultBrokers = brokers.filter((broker) => !broker.isCustom);
  const customBrokers = brokers.filter((broker) => broker.isCustom);

  const resetForm = () => {
    setName("");
    setSelectedColor(PRESET_COLORS[0]);
    setEditingBroker(null);
    setShowAddForm(false);
  };

  const handleAddBroker = async () => {
    if (!name.trim()) {
      toast.error("Nome da corretora é obrigatório");
      return;
    }

    // Verificar se já existe uma corretora com o mesmo nome
    const existingBroker = brokers.find(
      (broker) => broker.name.toLowerCase() === name.trim().toLowerCase(),
    );

    if (existingBroker) {
      toast.error("Já existe uma corretora com este nome");
      return;
    }

    setLoading(true);
    try {
      await addCustomBroker(name.trim(), selectedColor);
      resetForm();
      toast.success("Corretora adicionada com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar corretora");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBroker = (broker: Broker) => {
    setEditingBroker(broker);
    setName(broker.name);
    setSelectedColor(broker.color);
    setShowAddForm(true);
  };

  const handleUpdateBroker = async () => {
    if (!editingBroker || !name.trim()) {
      toast.error("Nome da corretora é obrigatório");
      return;
    }

    // Verificar se já existe uma corretora com o mesmo nome (exceto a atual)
    const existingBroker = brokers.find(
      (broker) =>
        broker.id !== editingBroker.id &&
        broker.name.toLowerCase() === name.trim().toLowerCase(),
    );

    if (existingBroker) {
      toast.error("Já existe uma corretora com este nome");
      return;
    }

    setLoading(true);
    try {
      await updateBroker(editingBroker.id, {
        name: name.trim(),
        color: selectedColor,
      });
      resetForm();
      toast.success("Corretora atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar corretora");
    } finally {
      setLoading(false);
    }
  };

  const getBrokerStats = (brokerId: string) => {
    const investments = state.investments.filter(
      (inv) => inv.brokerId === brokerId,
    );
    const activeInvestments = investments.filter(
      (inv) => inv.status === "active",
    );
    const totalValue = activeInvestments.reduce((sum, inv) => {
      return sum + (inv.currentValue || inv.totalInvested);
    }, 0);

    return {
      totalInvestments: investments.length,
      activeInvestments: activeInvestments.length,
      totalValue,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2
              className={cn(
                "h-5 w-5",
                settings.colorfulIcons
                  ? "text-orange-600"
                  : "text-muted-foreground",
              )}
            />
            Gerenciar Corretoras
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Botão Adicionar */}
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Gerencie as corretoras disponíveis para suas operações
            </p>
            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
              <Plus
                className={cn(
                  "h-4 w-4 mr-2",
                  settings.colorfulIcons ? "text-green-500" : "",
                )}
              />
              Adicionar Corretora
            </Button>
          </div>

          {/* Formulário de Adicionar/Editar */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingBroker
                    ? "Editar Corretora"
                    : "Nova Corretora Personalizada"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="brokerName">Nome da Corretora *</Label>
                    <Input
                      id="brokerName"
                      placeholder="Ex: Minha Corretora"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cor de Identificação *</Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            selectedColor === color
                              ? "border-gray-900 scale-110"
                              : "border-gray-300 hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {selectedColor === color && (
                            <Check
                              className={cn(
                                "h-4 w-4 text-white mx-auto",
                                settings.colorfulIcons ? "" : "",
                              )}
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Preview */}
                    <div className="flex items-center gap-2 p-2 border rounded-md">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: selectedColor }}
                      />
                      <span className="text-sm">
                        {name || "Nome da Corretora"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={resetForm}>
                    <X
                      className={cn(
                        "h-4 w-4 mr-2",
                        settings.colorfulIcons ? "text-red-500" : "",
                      )}
                    />
                    Cancelar
                  </Button>
                  <Button
                    onClick={
                      editingBroker ? handleUpdateBroker : handleAddBroker
                    }
                    disabled={loading || !name.trim()}
                  >
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    )}
                    {editingBroker ? "Atualizar" : "Adicionar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Corretoras Padrão */}
          <div>
            <h3 className="text-lg font-medium mb-4">
              Corretoras Tradicionais
            </h3>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Corretora</TableHead>
                      <TableHead className="text-center">
                        Investimentos
                      </TableHead>
                      <TableHead className="text-center">Ativos</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaultBrokers.map((broker) => {
                      const stats = getBrokerStats(broker.id);
                      return (
                        <TableRow key={broker.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: broker.color }}
                              />
                              <span className="font-medium">{broker.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                Padrão
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {stats.totalInvestments}
                          </TableCell>
                          <TableCell className="text-center">
                            {stats.activeInvestments}
                          </TableCell>
                          <TableCell className="text-right">
                            R${" "}
                            {stats.totalValue.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal
                                    className={cn(
                                      "h-4 w-4",
                                      settings.colorfulIcons
                                        ? "text-gray-600"
                                        : "",
                                    )}
                                  />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditBroker(broker)}
                                >
                                  <Palette
                                    className={cn(
                                      "h-4 w-4 mr-2",
                                      settings.colorfulIcons
                                        ? "text-purple-500"
                                        : "",
                                    )}
                                  />
                                  Alterar cor
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Corretoras Personalizadas */}
          {customBrokers.length > 0 && (
            <div>
              <Separator />
              <h3 className="text-lg font-medium mb-4 mt-6">
                Corretoras Personalizadas
              </h3>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Corretora</TableHead>
                        <TableHead className="text-center">
                          Investimentos
                        </TableHead>
                        <TableHead className="text-center">Ativos</TableHead>
                        <TableHead className="text-right">
                          Valor Total
                        </TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customBrokers.map((broker) => {
                        const stats = getBrokerStats(broker.id);
                        return (
                          <TableRow key={broker.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: broker.color }}
                                />
                                <span className="font-medium">
                                  {broker.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  Personalizada
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {stats.totalInvestments}
                            </TableCell>
                            <TableCell className="text-center">
                              {stats.activeInvestments}
                            </TableCell>
                            <TableCell className="text-right">
                              R${" "}
                              {stats.totalValue.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal
                                      className={cn(
                                        "h-4 w-4",
                                        settings.colorfulIcons
                                          ? "text-gray-600"
                                          : "",
                                      )}
                                    />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEditBroker(broker)}
                                  >
                                    <Edit
                                      className={cn(
                                        "h-4 w-4 mr-2",
                                        settings.colorfulIcons
                                          ? "text-blue-500"
                                          : "",
                                      )}
                                    />
                                    Editar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Informações */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Corretoras Tradicionais:</strong> Pré-configuradas com
                  as principais corretoras do mercado brasileiro.
                </p>
                <p>
                  <strong>Corretoras Personalizadas:</strong> Adicione suas
                  próprias corretoras ou instituições financeiras.
                </p>
                <p>
                  <strong>Dica:</strong> Use cores diferentes para facilitar a
                  identificação visual de cada corretora.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
