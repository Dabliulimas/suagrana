"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useTransactionsApi } from "../../hooks/use-transactions-api";
import { useAccounts } from "../../contexts/unified-context";
import { apiClient } from "../../lib/api-client";
import {
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";

export function ApiIntegrationDemo() {
  const [authStatus, setAuthStatus] = useState<
    "checking" | "authenticated" | "unauthenticated"
  >("checking");
  const [testResults, setTestResults] = useState<{
    connection: "pending" | "success" | "error" | null;
    login: "pending" | "success" | "error" | null;
    mockTransactions: "pending" | "success" | "error" | null;
    mockAccounts: "pending" | "success" | "error" | null;
    sync: "pending" | "success" | "error" | null;
  }>({
    connection: null,
    login: null,
    mockTransactions: null,
    mockAccounts: null,
    sync: null,
  });

  // TEMPORARIAMENTE DESABILITADO: Hooks de API que causam erros 401
  // const transactionsOnline = useTransactionsApi({
  //   enableSync: false, // Desabilitado para evitar requisições automáticas para rotas protegidas
  //   fallbackToLocal: true,
  //   autoRefresh: false
  // })

  // const accountsOnline = useAccountsApi({
  //   enableSync: false, // Desabilitado para evitar requisições automáticas para rotas protegidas
  //   fallbackToLocal: true,
  //   autoRefresh: false
  // })

  // const transactionsOffline = useTransactionsApi({
  //   enableSync: false,
  //   fallbackToLocal: true,
  //   autoRefresh: false
  // })

  // const accountsOffline = useAccountsApi({
  //   enableSync: false,
  //   fallbackToLocal: true,
  //   autoRefresh: false
  // })

  // Demo desabilitado em produção

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Integration Demo</h1>
      <p className="text-muted-foreground">
        Este demo foi temporariamente desabilitado para evitar erros de
        autenticação.
      </p>
    </div>
  );
}
