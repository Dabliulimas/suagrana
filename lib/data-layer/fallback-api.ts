/**
 * Fallback API para quando o backend não estiver disponível
 */

import { Contact, Transaction, Account, Goal } from "./types";

// Simulação de dados para desenvolvimento
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@exemplo.com",
    phone: "(11) 99999-9999",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@exemplo.com",
    phone: "(11) 88888-8888",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockTransactions: Transaction[] = [];
const mockAccounts: Account[] = [];
const mockGoals: Goal[] = [];

export class FallbackAPI {
  static async getContacts(): Promise<Contact[]> {
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...mockContacts];
  }

  static async createContact(
    data: Omit<Contact, "id" | "createdAt" | "updatedAt">,
  ): Promise<Contact> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newContact: Contact = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockContacts.push(newContact);
    return newContact;
  }

  static async updateContact(
    id: string,
    data: Partial<Contact>,
  ): Promise<Contact> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = mockContacts.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Contact not found");

    mockContacts[index] = {
      ...mockContacts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return mockContacts[index];
  }

  static async deleteContact(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = mockContacts.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Contact not found");

    mockContacts.splice(index, 1);
  }

  // Adicionar outros métodos conforme necessário
  static async getTransactions(): Promise<Transaction[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...mockTransactions];
  }

  static async getAccounts(): Promise<Account[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...mockAccounts];
  }

  static async getGoals(): Promise<Goal[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...mockGoals];
  }
}
