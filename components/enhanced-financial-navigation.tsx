"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSafeTheme } from "../hooks/use-safe-theme";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Home,
  TrendingUp,
  Wallet,
  CreditCard,
  Target,
  Calculator,
  PieChart,
  BarChart3,
  DollarSign,
  Users,
  Plane,
  Calendar,
  Bell,
  Settings,
  Brain,
  Shield,
  Building2,
  Briefcase,
  FileText,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Activity,
  BookOpen,
} from "lucide-react";

interface FinancialModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  category:
    | "essencial"
    | "gestao"
    | "analise"
    | "planejamento"
    | "colaborativo"
    | "sistema";
  status: "ativo" | "beta" | "novo" | "melhorado";
  priority: "alta" | "media" | "baixa";
  features: string[];
}

const financialModules: FinancialModule[] = [
  // Módulos Essenciais
  {
    id: "dashboard",
    title: "Bem-vindo de volta!",
    description: "Visão geral das suas finanças",
    icon: Home,
    href: "/",
    category: "essencial",
    status: "ativo",
    priority: "alta",
    features: [
      "Resumo financeiro",
      "Gráficos interativos",
      "Alertas importantes",
    ],
  },
  {
    id: "transactions",
    title: "Transações",
    description: "Gerencie todas as suas movimentações financeiras",
    icon: Activity,
    href: "/transactions",
    category: "essencial",
    status: "melhorado",
    priority: "alta",
    features: [
      "Categorização automática",
      "Filtros avançados",
      "Importação de extratos",
    ],
  },
  {
    id: "accounts",
    title: "Contas Bancárias",
    description: "Controle suas contas e saldos",
    icon: Building2,
    href: "/accounts",
    category: "essencial",
    status: "ativo",
    priority: "alta",
    features: ["Múltiplas contas", "Conciliação bancária", "Transferências"],
  },

  // Gestão Financeira
  {
    id: "budget",
    title: "Orçamento Inteligente",
    description: "Planeje e controle seus gastos mensais",
    icon: Calculator,
    href: "/budget",
    category: "gestao",
    status: "novo",
    priority: "alta",
    features: [
      "Orçamento por categoria",
      "Alertas de limite",
      "Projeções automáticas",
    ],
  },
  {
    id: "investments",
    title: "Investimentos",
    description: "Acompanhe sua carteira de investimentos",
    icon: TrendingUp,
    href: "/investments",
    category: "gestao",
    status: "ativo",
    priority: "media",
    features: [
      "Portfolio diversificado",
      "Rentabilidade",
      "Reserva de emergência",
    ],
  },
  {
    id: "goals",
    title: "Metas Financeiras",
    description: "Defina e acompanhe seus objetivos",
    icon: Target,
    href: "/goals",
    category: "gestao",
    status: "ativo",
    priority: "media",
    features: ["Metas personalizadas", "Progresso visual", "Simulações"],
  },
  {
    id: "bills",
    title: "Contas e Lembretes",
    description: "Nunca mais esqueça de pagar uma conta",
    icon: Calendar,
    href: "/bills-reminders",
    category: "gestao",
    status: "melhorado",
    priority: "alta",
    features: [
      "Contas recorrentes",
      "Lembretes inteligentes",
      "Histórico de pagamentos",
    ],
  },
  {
    id: "reminders",
    title: "Lembretes e Assinaturas",
    description: "Controle total de contas a pagar e assinaturas",
    icon: Bell,
    href: "/lembretes",
    category: "gestao",
    status: "novo",
    priority: "alta",
    features: [
      "Lembretes personalizados",
      "Controle de assinaturas",
      "Cálculo de gastos anuais",
    ],
  },

  // Análises Avançadas
  {
    id: "reports",
    title: "Relatórios Avançados",
    description: "Análises detalhadas dos seus padrões financeiros",
    icon: BarChart3,
    href: "/reports",
    category: "analise",
    status: "ativo",
    priority: "media",
    features: [
      "Relatórios personalizados",
      "Insights automáticos",
      "Exportação de dados",
    ],
  },
  {
    id: "cash-flow",
    title: "Fluxo de Caixa",
    description: "Previsões e projeções financeiras",
    icon: DollarSign,
    href: "/cash-flow",
    category: "analise",
    status: "novo",
    priority: "media",
    features: ["Projeções futuras", "Cenários", "Análise de tendências"],
  },
  {
    id: "advanced-dashboard",
    title: "Análises",
    description: "Ferramentas avançadas para análise financeira",
    icon: Brain,
    href: "/advanced-dashboard",
    category: "analise",
    status: "beta",
    priority: "baixa",
    features: ["IA financeira", "Automações", "Insights preditivos"],
  },
  {
    id: "ai-dashboard",
    title: "Assistente IA",
    description: "Análises preditivas e recomendações personalizadas",
    icon: Brain,
    href: "/ai-dashboard",
    category: "analise",
    status: "novo",
    priority: "alta",
    features: [
      "Previsões avançadas",
      "Recomendações IA",
      "Padrões inteligentes",
    ],
  },
  {
    id: "ai-settings",
    title: "Configurações IA",
    description: "Personalize o comportamento do assistente financeiro",
    icon: Zap,
    href: "/ai-settings",
    category: "analise",
    status: "novo",
    priority: "media",
    features: [
      "Modelos personalizados",
      "Preferências IA",
      "Controles avançados",
    ],
  },
  {
    id: "smart-budget",
    title: "Orçamento Inteligente",
    description: "Sistema avançado de orçamento com IA e automação",
    icon: Brain,
    href: "/smart-budget",
    category: "gestao",
    status: "novo",
    priority: "alta",
    features: [
      "IA para categorização",
      "Previsões automáticas",
      "Otimização de gastos",
    ],
  },
  {
    id: "smart-budget-config",
    title: "Config. Avançadas",
    description: "Configurações avançadas do sistema de orçamento",
    icon: Settings,
    href: "/smart-budget/config",
    category: "gestao",
    status: "novo",
    priority: "media",
    features: [
      "Parâmetros IA",
      "Regras personalizadas",
      "Automações avançadas",
    ],
  },
  {
    id: "smart-budget-performance",
    title: "Performance IA",
    description: "Análise de performance e métricas do sistema IA",
    icon: BarChart3,
    href: "/smart-budget/performance",
    category: "analise",
    status: "novo",
    priority: "media",
    features: [
      "Métricas de precisão",
      "Análise de tendências",
      "Otimização contínua",
    ],
  },
  {
    id: "enhanced-reports",
    title: "Relatórios Avançados",
    description: "Sistema completo de relatórios personalizados",
    icon: FileText,
    href: "/enhanced-reports",
    category: "analise",
    status: "novo",
    priority: "alta",
    features: [
      "Relatórios personalizados",
      "Exportação avançada",
      "Dashboards interativos",
    ],
  },
  {
    id: "ml-analytics",
    title: "Analytics com IA",
    description:
      "Dashboard avançado com machine learning e insights preditivos",
    icon: Brain,
    href: "/ml-analytics",
    category: "analise",
    status: "novo",
    priority: "alta",
    features: [
      "Detecção de anomalias",
      "Previsões financeiras",
      "Recomendações personalizadas",
    ],
  },
  {
    id: "data-visualization",
    title: "Visualização de Dados",
    description:
      "Ferramenta interativa para criar visualizações personalizadas",
    icon: BarChart3,
    href: "/data-visualization",
    category: "analise",
    status: "novo",
    priority: "alta",
    features: [
      "Gráficos interativos",
      "Filtros avançados",
      "Exportação múltipla",
    ],
  },
  {
    id: "executive",
    title: "Dashboard Executivo",
    description: "Visão estratégica e KPIs para tomada de decisões executivas",
    icon: Briefcase,
    href: "/executive",
    category: "analise",
    status: "novo",
    priority: "alta",
    features: [
      "Métricas estratégicas",
      "Metas corporativas",
      "Análise de riscos",
    ],
  },
  {
    id: "education",
    title: "Educação Financeira",
    description: "Centro completo de aprendizado com cursos e gamificação",
    icon: BookOpen,
    href: "/education",
    category: "planejamento",
    status: "novo",
    priority: "alta",
    features: [
      "Cursos interativos",
      "Sistema de conquistas",
      "Comunidade ativa",
    ],
  },

  // Planejamento
  {
    id: "travel",
    title: "Planejamento de Viagens",
    description: "Organize os gastos das suas viagens",
    icon: Plane,
    href: "/travel",
    category: "planejamento",
    status: "ativo",
    priority: "baixa",
    features: [
      "Orçamento de viagem",
      "Conversão de moedas",
      "Divisão de gastos",
    ],
  },

  // Colaborativo
  {
    id: "shared",
    title: "Despesas Compartilhadas",
    description: "Gerencie gastos em grupo",
    icon: Users,
    href: "/shared",
    category: "colaborativo",
    status: "ativo",
    priority: "media",
    features: ["Divisão automática", "Faturamento", "Histórico compartilhado"],
  },
  {
    id: "family",
    title: "Gestão Familiar",
    description: "Controle financeiro para toda a família",
    icon: Shield,
    href: "/family",
    category: "colaborativo",
    status: "ativo",
    priority: "media",
    features: ["Múltiplos usuários", "Permissões", "Relatórios familiares"],
  },

  // Sistema
  {
    id: "settings",
    title: "Configurações",
    description: "Personalize sua experiência",
    icon: Settings,
    href: "/settings",
    category: "sistema",
    status: "ativo",
    priority: "baixa",
    features: ["Preferências", "Segurança", "Backup"],
  },
];

const categoryConfig = {
  essencial: {
    title: "Essencial",
    description: "Funcionalidades básicas do dia a dia",
    color: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
  },
  gestao: {
    title: "Gestão Financeira",
    description: "Ferramentas para controle e planejamento",
    color:
      "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700",
    iconColor: "text-green-600 dark:text-green-400",
  },
  analise: {
    title: "Análises e Relatórios",
    description: "Insights e análises avançadas",
    color: "bg-purple-50 border-purple-200",
    iconColor: "text-purple-600",
  },
  planejamento: {
    title: "Planejamento",
    description: "Ferramentas para planejar o futuro",
    color: "bg-orange-50 border-orange-200",
    iconColor: "text-orange-600",
  },
  colaborativo: {
    title: "Colaborativo",
    description: "Recursos para compartilhar e colaborar",
    color: "bg-pink-50 border-pink-200",
    iconColor: "text-pink-600",
  },
  sistema: {
    title: "Sistema",
    description: "Configurações e preferências",
    color: "bg-gray-50 border-gray-200",
    iconColor: "text-gray-600",
  },
};

const statusConfig = {
  ativo: {
    label: "Ativo",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  beta: {
    label: "Beta",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  novo: {
    label: "Novo",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  melhorado: {
    label: "Melhorado",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
};

interface EnhancedFinancialNavigationProps {
  showCategories?: boolean;
  compactMode?: boolean;
}

export const EnhancedFinancialNavigation = memo(
  ({
    showCategories = true,
    compactMode = false,
  }: EnhancedFinancialNavigationProps) => {
    const pathname = usePathname();
    const { settings } = useSafeTheme();

    const modulesByCategory = useMemo(() => {
      return financialModules.reduce(
        (acc, module) => {
          if (!acc[module.category]) {
            acc[module.category] = [];
          }
          acc[module.category].push(module);
          return acc;
        },
        {} as Record<string, FinancialModule[]>,
      );
    }, []);

    const isActive = (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname.startsWith(href);
    };

    if (compactMode) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {financialModules.map((module) => {
            const Icon = module.icon;
            const config = categoryConfig[module.category];
            const status = statusConfig[module.status];

            return (
              <Link key={module.id} href={module.href}>
                <Card
                  className={`hover:shadow-md transition-all duration-200 ${
                    isActive(module.href) ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon
                          className={`h-5 w-5 ${settings.colorfulIcons ? config.iconColor : "text-muted-foreground"}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {module.title}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${status.color}`}
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      );
    }

    if (!showCategories) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {financialModules.map((module) => {
            const Icon = module.icon;
            const config = categoryConfig[module.category];
            const status = statusConfig[module.status];

            return (
              <Link key={module.id} href={module.href}>
                <Card
                  className={`hover:shadow-lg transition-all duration-200 ${
                    isActive(module.href) ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${config.color}`}>
                        <Icon
                          className={`h-6 w-6 ${settings.colorfulIcons ? config.iconColor : "text-muted-foreground"}`}
                        />
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {module.features.slice(0, 3).map((feature, index) => (
                        <li
                          key={index}
                          className="text-xs text-muted-foreground flex items-center gap-2"
                        >
                          <div className="w-1 h-1 bg-current rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {Object.entries(modulesByCategory).map(([category, modules]) => {
          const config =
            categoryConfig[category as keyof typeof categoryConfig];

          return (
            <div key={category}>
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-1">{config.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => {
                  const Icon = module.icon;
                  const status = statusConfig[module.status];

                  return (
                    <Link key={module.id} href={module.href}>
                      <Card
                        className={`hover:shadow-lg transition-all duration-200 ${
                          isActive(module.href) ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className={`p-3 rounded-lg ${config.color}`}>
                              <Icon
                                className={`h-6 w-6 ${settings.colorfulIcons ? config.iconColor : "text-muted-foreground"}`}
                              />
                            </div>
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">
                            {module.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {module.description}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {module.features.map((feature, index) => (
                              <li
                                key={index}
                                className="text-xs text-muted-foreground flex items-center gap-2"
                              >
                                <div className="w-1 h-1 bg-current rounded-full" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

EnhancedFinancialNavigation.displayName = "EnhancedFinancialNavigation";
