"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Wallet,
  DollarSign,
  Target,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface FirstTimeSetupProps {
  onComplete: () => void;
}

export function FirstTimeSetup({ onComplete }: FirstTimeSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Verificar se é primeira vez
    const hasSeenOnboarding = localStorage.getItem("sua-grana-onboarding-completed");
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  const steps = [
    {
      title: "Bem-vindo ao SuaGrana! 🎉",
      description: "Seu assistente financeiro pessoal completo",
      icon: <Sparkles className="w-8 h-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-center text-gray-600">
            Em apenas <strong>2 minutos</strong> você terá seu controle financeiro funcionando!
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Transações</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Metas</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium">Compartilhadas</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Wallet className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <p className="text-sm font-medium">Investimentos</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "📱 Como funciona",
      description: "Interface simples e intuitiva",
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="font-bold text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium">Adicione suas contas</p>
                <p className="text-sm text-gray-600">Banco, carteira, cartões...</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="font-bold text-green-600">2</span>
              </div>
              <div>
                <p className="font-medium">Registre transações</p>
                <p className="text-sm text-gray-600">Receitas e gastos em segundos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="font-bold text-purple-600">3</span>
              </div>
              <div>
                <p className="font-medium">Acompanhe resultados</p>
                <p className="text-sm text-gray-600">Relatórios automáticos e insights</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🎯 Funcionalidades Especiais",
      description: "O que torna o SuaGrana único",
      icon: <Target className="w-8 h-8 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="p-3 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-600">Despesas Compartilhadas</span>
              </div>
              <p className="text-sm text-gray-600">
                Divida contas com família/amigos por porcentagem ou valor
              </p>
            </div>
            <div className="p-3 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-600">Metas Inteligentes</span>
              </div>
              <p className="text-sm text-gray-600">
                Defina objetivos e acompanhe progresso automaticamente
              </p>
            </div>
            <div className="p-3 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-600">Controle de Viagens</span>
              </div>
              <p className="text-sm text-gray-600">
                Gerencie gastos de viagem com conversão de moeda
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🚀 Pronto para começar!",
      description: "Tudo configurado para seu sucesso financeiro",
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      content: (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Você está pronto!</h3>
            <p className="text-gray-600 mb-4">
              Comece criando sua primeira transação ou configurando uma conta bancária.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary">✨ Interface simples</Badge>
              <Badge variant="secondary">📱 Fácil de usar</Badge>
              <Badge variant="secondary">🔒 Seguro</Badge>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem("sua-grana-onboarding-completed", "true");
    setIsOpen(false);
    onComplete();
    toast.success("🎉 Bem-vindo ao SuaGrana! Vamos começar?");
  };

  const handleSkip = () => {
    localStorage.setItem("sua-grana-onboarding-completed", "true");
    setIsOpen(false);
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" hideClose>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            {currentStepData.icon}
          </div>
          <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
          <p className="text-muted-foreground">{currentStepData.description}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{currentStep + 1} de {steps.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="min-h-[200px]">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              className="text-gray-500"
            >
              Pular tutorial
            </Button>
            
            <Button onClick={handleNext} className="flex items-center gap-2">
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Começar a usar!
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para controlar o onboarding
export function useFirstTimeSetup() {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("sua-grana-onboarding-completed");
    setShouldShowOnboarding(!hasSeenOnboarding);
  }, []);

  const markOnboardingComplete = () => {
    setShouldShowOnboarding(false);
  };

  return {
    shouldShowOnboarding,
    markOnboardingComplete,
  };
}
