"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Shield, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AdminDashboard } from "./admin-dashboard";

interface AdminAuthProps {
  onAuthSuccess: () => void;
}

export function AdminAuth({ onAuthSuccess }: AdminAuthProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar se já está autenticado ao carregar
  useEffect(() => {
    const adminSession = localStorage.getItem('sua-grana-admin-session');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        
        if (expiresAt > now) {
          setIsAuthenticated(true);
          onAuthSuccess();
        } else {
          // Sessão expirada
          localStorage.removeItem('sua-grana-admin-session');
        }
      } catch (error) {
        localStorage.removeItem('sua-grana-admin-session');
      }
    }
  }, [onAuthSuccess]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === "834702") {
      setLoading(true);
      
      // Salvar sessão admin no localStorage
      const adminSession = {
        isAdmin: true,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas
      };
      
      localStorage.setItem('sua-grana-admin-session', JSON.stringify(adminSession));
      
      // Log de acesso
      const accessLog = JSON.parse(localStorage.getItem('sua-grana-admin-logs') || '[]');
      accessLog.push({
        id: `log_${Date.now()}`,
        action: 'admin_login',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'localhost',
      });
      localStorage.setItem('sua-grana-admin-logs', JSON.stringify(accessLog));
      
      setTimeout(() => {
        setLoading(false);
        toast.success("Acesso administrativo concedido");
        setIsAuthenticated(true);
        onAuthSuccess();
      }, 1000);
    } else {
      toast.error("Senha incorreta");
      setPassword("");
      
      // Log de tentativa de acesso negada
      const accessLog = JSON.parse(localStorage.getItem('sua-grana-admin-logs') || '[]');
      accessLog.push({
        id: `log_${Date.now()}`,
        action: 'admin_failed_login',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'localhost',
      });
      localStorage.setItem('sua-grana-admin-logs', JSON.stringify(accessLog));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sua-grana-admin-session');
    setIsAuthenticated(false);
    
    // Log de logout
    const accessLog = JSON.parse(localStorage.getItem('sua-grana-admin-logs') || '[]');
    accessLog.push({
      id: `log_${Date.now()}`,
      action: 'admin_logout',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: 'localhost',
    });
    localStorage.setItem('sua-grana-admin-logs', JSON.stringify(accessLog));
    
    toast.success('Sessão administrativa encerrada');
  };

  // Se está autenticado, mostrar o dashboard
  if (isAuthenticated) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Caso contrário, mostrar tela de login
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Área Administrativa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acesso restrito ao sistema de administração
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha de Administrador</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Digite a senha administrativa..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verificando..." : "Acessar Painel Admin"}
            </Button>

            <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Área Restrita</p>
                  <p className="text-yellow-700">
                    Este é o painel administrativo do sistema. Acesso apenas para administradores autorizados.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
