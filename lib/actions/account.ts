"use server";

import { enhancedStorage } from "@/lib/enhanced-storage";
import { logComponents } from "../logger";
import { auditLog } from "@/lib/audit";
import type { Account } from "@/lib/types";

export async function deleteAccount(accountId: string) {
  try {
    // Log da ação para auditoria
    await auditLog.log({
      action: "DELETE_ACCOUNT",
      userId: "current-user", // TODO: pegar do contexto de auth
      details: { entityType: "account", entityId: accountId, accountId },
    });

    // Buscar todas as contas
    const accounts =
      (await enhancedStorage.getItem<Account[]>("accounts")) || [];

    // Filtrar removendo a conta
    const updatedAccounts = accounts.filter(
      (account) => account.id !== accountId,
    );

    // Salvar as contas atualizadas
    await enhancedStorage.setItem("accounts", updatedAccounts);

    return { success: true };
  } catch (error) {
    logComponents.error("Erro ao deletar conta:", error);
    throw new Error("Falha ao deletar conta");
  }
}

export async function createAccount(accountData: Omit<Account, "id">) {
  try {
    const newAccount: Account = {
      ...accountData,
      id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Log da ação
    await auditLog.log({
      action: "CREATE_ACCOUNT",
      userId: "current-user",
      details: {
        entityType: "account",
        entityId: newAccount.id,
        accountName: newAccount.name,
        bank: newAccount.bank,
      },
    });

    // Buscar contas existentes
    const accounts =
      (await enhancedStorage.getItem<Account[]>("accounts")) || [];

    // Adicionar nova conta
    accounts.push(newAccount);

    // Salvar
    await enhancedStorage.setItem("accounts", accounts);

    return { success: true, account: newAccount };
  } catch (error) {
    logComponents.error("Erro ao criar conta:", error);
    throw new Error("Falha ao criar conta");
  }
}

export async function updateAccount(
  accountId: string,
  updates: Partial<Account>,
) {
  try {
    // Log da ação
    await auditLog.log({
      action: "UPDATE_ACCOUNT",
      userId: "current-user",
      details: { entityType: "account", entityId: accountId, updates },
    });

    // Buscar contas
    const accounts =
      (await enhancedStorage.getItem<Account[]>("accounts")) || [];

    // Encontrar e atualizar a conta
    const accountIndex = accounts.findIndex(
      (account) => account.id === accountId,
    );
    if (accountIndex === -1) {
      throw new Error("Conta não encontrada");
    }

    accounts[accountIndex] = { ...accounts[accountIndex], ...updates };

    // Salvar
    await enhancedStorage.setItem("accounts", accounts);

    return { success: true, account: accounts[accountIndex] };
  } catch (error) {
    logComponents.error("Erro ao atualizar conta:", error);
    throw new Error("Falha ao atualizar conta");
  }
}
