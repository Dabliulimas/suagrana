"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModernAppLayout } from "@/components/modern-app-layout";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminAuth } from "@/components/admin/admin-auth";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe sessão admin válida
    const checkAdminSession = () => {
      try {
        const adminSession = localStorage.getItem('sua-grana-admin-session');
        if (adminSession) {
          const session = JSON.parse(adminSession);
          const now = new Date();
          const expiresAt = new Date(session.expiresAt);
          
          if (session.isAdmin && now < expiresAt) {
            setIsAuthenticated(true);
          } else {
            // Sessão expirada
            localStorage.removeItem('sua-grana-admin-session');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão admin:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminSession();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('sua-grana-admin-session');
    
    // Log de logout
    const accessLog = JSON.parse(localStorage.getItem('sua-grana-admin-logs') || '[]');
    accessLog.push({
      id: `log_${Date.now()}`,
      action: 'logout',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      ip: 'localhost',
    });
    localStorage.setItem('sua-grana-admin-logs', JSON.stringify(accessLog));
    
    setIsAuthenticated(false);
    router.push('/');
  };

  if (loading) {
    return (
      <ModernAppLayout title="Admin" subtitle="Área Administrativa">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ModernAppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <ModernAppLayout title="Admin" subtitle="Área Administrativa">
        <AdminAuth onAuthSuccess={handleAuthSuccess} />
      </ModernAppLayout>
    );
  }

  return (
    <ModernAppLayout title="Admin" subtitle="Painel Administrativo">
      <AdminDashboard onLogout={handleLogout} />
    </ModernAppLayout>
  );
}
