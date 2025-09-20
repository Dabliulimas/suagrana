"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Settings, Shield, Lock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AdminAccessProps {
  className?: string;
}

export function AdminAccess({ className }: AdminAccessProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
        action: 'login',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'localhost', // Em produção seria obtido do servidor
      });
      localStorage.setItem('sua-grana-admin-logs', JSON.stringify(accessLog));
      
      setTimeout(() => {
        setLoading(false);
        setShowDialog(false);
        setPassword("");
        toast.success("Acesso administrativo concedido");
        router.push("/admin");
      }, 1000);
    } else {
      toast.error("Senha incorreta");
      setPassword("");
      
      // Log de tentativa de acesso negada
      const accessLog = JSON.parse(localStorage.getItem('sua-grana-admin-logs') || '[]');
      accessLog.push({
        id: `log_${Date.now()}`,
        action: 'failed_login',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: 'localhost',
      });
      localStorage.setItem('sua-grana-admin-logs', JSON.stringify(accessLog));
    }
  };

  return (
    <>
      {/* Ícone discreto - apenas um ponto pequeno no canto */}
      <div 
        className={`fixed bottom-4 left-4 w-2 h-2 bg-gray-300 rounded-full opacity-20 hover:opacity-60 cursor-pointer transition-all duration-300 z-50 ${className}`}
        onClick={() => setShowDialog(true)}
        title="Admin Access"
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              Acesso Administrativo
            </DialogTitle>
            <DialogDescription>
              Área restrita do sistema. Digite a senha de administrador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Digite a senha..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Verificando..." : "Acessar"}
              </Button>
            </div>
          </form>

          <div className="text-xs text-gray-500 text-center mt-4">
            <div className="flex items-center justify-center gap-1">
              <Settings className="h-3 w-3" />
              Sistema protegido
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
