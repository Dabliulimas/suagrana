"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { DatePicker } from "./ui/date-picker";
interface Card {
  id: string;
  name: string;
  limit: number;
  availableLimit: number;
  invoice: number;
  dueDate: string;
}

interface CreateCardDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (card: Card) => void;
}

export function CreateCardDialog({
  open,
  onClose,
  onCreate,
}: CreateCardDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    limit: "",
    dueDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.limit || !formData.dueDate) {
      return;
    }

    const limit = Number.parseFloat(formData.limit);
    const newCard: Card = {
      id: Date.now().toString(),
      name: formData.name,
      limit: limit,
      availableLimit: limit,
      invoice: 0,
      dueDate: formData.dueDate,
    };

    onCreate(newCard);
    setFormData({ name: "", limit: "", dueDate: "" });
  };

  const handleClose = () => {
    setFormData({ name: "", limit: "", dueDate: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cartão</DialogTitle>
          <DialogDescription>
            Preencha as informações do seu cartão de crédito.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
                placeholder="Ex: Cartão Banco XYZ"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="limit" className="text-right">
                Limite
              </Label>
              <Input
                id="limit"
                type="number"
                step="0.01"
                min="0"
                value={formData.limit}
                onChange={(e) =>
                  setFormData({ ...formData, limit: e.target.value })
                }
                className="col-span-3"
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Vencimento
              </Label>
              <DatePicker
                id="dueDate"
                value={formData.dueDate}
                onChange={(value) =>
                  setFormData({ ...formData, dueDate: value })
                }
                placeholder="Selecionar vencimento"
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar Cartão</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
