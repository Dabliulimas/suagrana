"use client";

export const dynamic = "force-dynamic";

// 🎯 SISTEMA SIMPLIFICADO - Redirecionamento para página unificada
// Cartões agora são gerenciados junto com Contas em /accounts

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModernAppLayout } from "@/components/modern-app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowRight } from "lucide-react";

export default function CardsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionamento automático após 3 segundos
    const timer = setTimeout(() => {
      router.push("/accounts");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleRedirect = () => {
    router.push("/accounts");
  };

  return (
    <ModernAppLayout
      title="Cartões - Redirecionando"
      subtitle="Sistema Simplificado - Contas e Cartões Unificados"
    >
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">🎯 Sistema Simplificado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              **Cartões** agora são gerenciados junto com **Contas** na página unificada 
              <strong>"Contas & Cartões"</strong>.
            </p>
            <p className="text-sm text-gray-600">
              Redirecionando automaticamente em 3 segundos...
            </p>
            <Button 
              onClick={handleRedirect} 
              className="w-full" 
              size="lg"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Ir para Contas & Cartões
            </Button>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-medium text-blue-800">
                📝 Todas as funcionalidades mantidas:
              </p>
              <ul className="text-blue-700 mt-2 text-left space-y-1">
                <li>• Gerenciamento de cartões</li>
                <li>• Faturas e limites</li>
                <li>• Histórico completo</li>
                <li>• + Contas bancárias em um só lugar!</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernAppLayout>
  );
}
