"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModernAppLayout } from "@/components/modern-app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, ArrowRight } from "lucide-react";

export default function DebtsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to advanced dashboard with analysis tab
    const timer = setTimeout(() => {
      router.push("/advanced-dashboard?tab=analysis");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ModernAppLayout
      title="Análise de Dívidas"
      subtitle="Redirecionando para análises avançadas"
    >
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <Card className="text-center p-8 max-w-md">
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <BarChart3 className="w-16 h-16 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold">Análise Financeira</h1>
            <p className="text-muted-foreground">
              Esta funcionalidade foi movida para o Dashboard de Análises.
              Redirecionando automaticamente...
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <span>Indo para Análises</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernAppLayout>
  );
}
