"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacySettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Configurações
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Configurações de Privacidade
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas configurações de privacidade
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Privacidade</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Configurações de privacidade em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
}
