"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Database, Users, CreditCard, Target, Plane } from "lucide-react";

export function DataGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSampleData = async (type: string) => {
    setIsGenerating(true);
    
    try {
      // Simula geração de dados de teste
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      switch (type) {
        case 'transactions':
          toast.success('Transações de exemplo geradas com sucesso!');
          break;
        case 'accounts':
          toast.success('Contas de exemplo geradas com sucesso!');
          break;
        case 'goals':
          toast.success('Metas de exemplo geradas com sucesso!');
          break;
        case 'trips':
          toast.success('Viagens de exemplo geradas com sucesso!');
          break;
        default:
          toast.success('Dados de exemplo gerados com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao gerar dados de exemplo');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAllData = async () => {
    setIsGenerating(true);
    
    try {
      // Simula limpeza de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Todos os dados foram limpos com sucesso!');
    } catch (error) {
      toast.error('Erro ao limpar dados');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Gerador de Dados de Teste
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => generateSampleData('transactions')}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Gerar Transações
          </Button>
          
          <Button
            variant="outline"
            onClick={() => generateSampleData('accounts')}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Gerar Contas
          </Button>
          
          <Button
            variant="outline"
            onClick={() => generateSampleData('goals')}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Gerar Metas
          </Button>
          
          <Button
            variant="outline"
            onClick={() => generateSampleData('trips')}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <Plane className="h-4 w-4" />
            Gerar Viagens
          </Button>
        </div>
        
        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            onClick={clearAllData}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Processando...' : 'Limpar Todos os Dados'}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Use essas ferramentas apenas em ambiente de desenvolvimento para gerar dados de teste.
        </p>
      </CardContent>
    </Card>
  );
}