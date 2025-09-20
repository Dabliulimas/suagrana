"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ModernAppLayout } from "@/components/modern-app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

const PerformanceSettingsPage: React.FC = () => {
  return (
    <ModernAppLayout
      title="Performance do Sistema"
      subtitle="Monitore e otimize a performance da aplicação"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Configurações
            </Button>
          </Link>
        </div>

        {/* Performance Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Dashboard de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Dashboard de performance em desenvolvimento...</p>
          </CardContent>
        </Card>
      </div>
    </ModernAppLayout>
  );
};

export default PerformanceSettingsPage;
