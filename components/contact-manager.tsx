"use client";

import React, { useState } from "react";
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
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Search,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useContacts, useAccounts } from "../contexts/unified-context";
import type { Contact } from "../lib/data-layer/types";

interface ContactManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated?: (contact: Contact) => void;
  onContactSelected?: (contact: Contact) => void;
  selectionMode?: boolean;
  selectedContacts?: string[];
}

export function ContactManager({
  isOpen,
  onClose,
  onContactCreated,
  onContactSelected,
  selectionMode = false,
  selectedContacts = [],
}: ContactManagerProps) {
  const {
    contacts,
    isLoading,
    error,
    create,
    update,
    delete: deleteContact,
  } = useContacts();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddContact = async () => {
    if (!newContact.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!newContact.email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newContact.email)) {
      toast.error("Email inválido");
      return;
    }

    // Check if email already exists
    const existingContact = contacts.find((c) => c.email === newContact.email);
    if (existingContact) {
      toast.error("Já existe um contato com este email");
      return;
    }

    try {
      const createdContact = await create(newContact);

      if (createdContact && onContactCreated) {
        onContactCreated(createdContact);
      }

      setNewContact({ name: "", email: "", phone: "" });
      setShowAddForm(false);
    } catch (error) {
      logComponents.error("Error adding contact:", error);
      toast.error("Erro ao adicionar contato");
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setNewContact({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
    });
    setShowAddForm(true);
  };

  const handleUpdateContact = async () => {
    if (!editingContact) return;

    if (!newContact.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!newContact.email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newContact.email)) {
      toast.error("Email inválido");
      return;
    }

    // Check if email already exists (excluding current contact)
    const existingContact = contacts.find(
      (c) => c.email === newContact.email && c.id !== editingContact.id,
    );
    if (existingContact) {
      toast.error("Já existe um contato com este email");
      return;
    }

    try {
      await update(editingContact.id, newContact);
      setEditingContact(null);
      setNewContact({ name: "", email: "", phone: "" });
      setShowAddForm(false);
    } catch (error) {
      logComponents.error("Error updating contact:", error);
      toast.error("Erro ao atualizar contato");
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (
      confirm(`Tem certeza que deseja excluir o contato "${contact.name}"?`)
    ) {
      try {
        await deleteContact(contact.id);
      } catch (error) {
        logComponents.error("Error deleting contact:", error);
        toast.error("Erro ao excluir contato");
      }
    }
  };

  const handleContactSelect = (contact: Contact) => {
    if (onContactSelected) {
      onContactSelected(contact);
    }
  };

  const getContactInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleClose = () => {
    setEditingContact(null);
    setNewContact({ name: "", email: "", phone: "" });
    setShowAddForm(false);
    setSearchTerm("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {selectionMode ? "Selecionar Contato" : "Gerenciar Contatos"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search and Add Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Novo Contato
            </Button>
          </div>

          {/* Add/Edit Contact Form */}
          {showAddForm && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-medium mb-4">
                {editingContact ? "Editar Contato" : "Novo Contato"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) =>
                      setNewContact((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingContact(null);
                    setNewContact({ name: "", email: "", phone: "" });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={
                    editingContact ? handleUpdateContact : handleAddContact
                  }
                >
                  {editingContact ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </div>
          )}

          {/* Contacts List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Contatos</Label>
              <Badge variant="secondary">
                {filteredContacts.length} contato(s)
              </Badge>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm
                  ? "Nenhum contato encontrado"
                  : "Nenhum contato cadastrado"}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                      selectionMode ? "cursor-pointer" : ""
                    } ${
                      selectedContacts.includes(contact.id)
                        ? "bg-primary/10 border-primary"
                        : ""
                    }`}
                    onClick={() =>
                      selectionMode && handleContactSelect(contact)
                    }
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getContactInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="font-medium">{contact.name}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {!selectionMode && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContact(contact)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {selectionMode && selectedContacts.includes(contact.id) && (
                      <Badge variant="default">Selecionado</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              {selectionMode ? "Cancelar" : "Fechar"}
            </Button>
            {selectionMode && (
              <Button onClick={handleClose}>Confirmar Seleção</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ContactManager;
