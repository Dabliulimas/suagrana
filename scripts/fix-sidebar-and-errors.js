#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Cores para output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`\n🔧 ${description}...`, "cyan");
    execSync(command, { stdio: "inherit", cwd: process.cwd() });
    log(`✅ ${description} - Concluído`, "green");
    return true;
  } catch (error) {
    log(`❌ ${description} - Erro: ${error.message}`, "red");
    return false;
  }
}

function writeFile(filePath, content, description) {
  try {
    log(`\n📝 ${description}...`, "cyan");
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, "utf8");
    log(`✅ ${description} - Concluído`, "green");
    return true;
  } catch (error) {
    log(`❌ ${description} - Erro: ${error.message}`, "red");
    return false;
  }
}

function updateFile(filePath, searchReplace, description) {
  try {
    log(`\n🔄 ${description}...`, "cyan");
    if (!fs.existsSync(filePath)) {
      log(`❌ Arquivo não encontrado: ${filePath}`, "red");
      return false;
    }

    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    searchReplace.forEach(({ search, replace }) => {
      if (content.includes(search)) {
        content = content.replace(search, replace);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      log(`✅ ${description} - Concluído`, "green");
      return true;
    } else {
      log(`ℹ️ ${description} - Nenhuma alteração necessária`, "yellow");
      return true;
    }
  } catch (error) {
    log(`❌ ${description} - Erro: ${error.message}`, "red");
    return false;
  }
}

// Função principal
async function fixSidebarAndErrors() {
  log("🚀 Iniciando correção da sidebar e erros restantes...", "bright");

  const results = [];

  // 1. Corrigir problema da sidebar - Verificar se o layout está usando a sidebar corretamente
  const sidebarFix = `"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ArrowUpDown,
  Wallet,
  CreditCard,
  TrendingUp,
  Target,
  Calculator,
  Plane,
  Users,
  UserCheck,
  DollarSign,
  BarChart3,
  Calendar,
  Brain,
  Settings,
  PiggyBank,
  Menu,
  X,
} from "lucide-react";
import { EnhancedHeader } from "@/components/enhanced-header";
import { GlobalModals } from "@/components/global-modals";
import { cn } from "@/lib/utils";
import { useSafeTheme } from "@/hooks/use-safe-theme";

interface ModernAppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home, color: "text-blue-600" },
  {
    title: "Transações",
    url: "/transactions",
    icon: ArrowUpDown,
    color: "text-green-600",
  },
  { title: "Contas", url: "/accounts", icon: Wallet, color: "text-purple-600" },
  { title: "Cartões", url: "/cards", icon: CreditCard, color: "text-red-600" },
  {
    title: "Investimentos",
    url: "/investments",
    icon: TrendingUp,
    color: "text-emerald-600",
  },
  { title: "Metas", url: "/goals", icon: Target, color: "text-orange-600" },
  {
    title: "Orçamento",
    url: "/budget",
    icon: Calculator,
    color: "text-indigo-600",
  },
  { title: "Viagens", url: "/travel", icon: Plane, color: "text-sky-600" },
  {
    title: "Compartilhadas",
    url: "/shared",
    icon: Users,
    color: "text-pink-600",
  },
  { title: "Família", url: "/family", icon: UserCheck, color: "text-teal-600" },
  {
    title: "Fluxo de Caixa",
    url: "/cash-flow",
    icon: DollarSign,
    color: "text-yellow-600",
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
    color: "text-violet-600",
  },
  {
    title: "Contas/Lembretes",
    url: "/bills-reminders",
    icon: Calendar,
    color: "text-rose-600",
  },
  {
    title: "Análises",
    url: "/advanced-dashboard",
    icon: Brain,
    color: "text-cyan-600",
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    color: "text-gray-600",
  },
];

export function ModernAppLayout({
  children,
  title,
  subtitle,
}: ModernAppLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { settings, isMounted: themeIsMounted } = useSafeTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Loading state durante SSR
  if (!isMounted || !themeIsMounted) {
    return (
      <div className="flex h-screen w-full bg-background">
        <div className="w-64 bg-card border-r border-border" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-card border-b border-border" />
          <main className="flex-1 w-full overflow-auto">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PiggyBank
                className={cn(
                  "h-4 w-4",
                  settings?.colorfulIcons
                    ? "text-green-600"
                    : "text-primary-foreground",
                )}
              />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">SuaGrana</h1>
              <p className="text-xs text-muted-foreground">
                Controle Financeiro
              </p>
            </div>
          </div>
          {/* Close button */}
          <button
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.url;
              return (
                <li key={item.url}>
                  <Link
                    href={item.url}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4",
                        settings?.colorfulIcons
                          ? item.color
                          : "text-muted-foreground",
                      )}
                    />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Header */}
        <EnhancedHeader
          title={title}
          subtitle={subtitle}
          onOpenSidebar={toggleSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 w-full overflow-auto">{children}</main>
      </div>

      {/* Global Modals */}
      <GlobalModals />
    </div>
  );
}

export default ModernAppLayout;`;

  results.push(
    writeFile(
      "components/modern-app-layout.tsx",
      sidebarFix,
      "Corrigindo layout da sidebar",
    ),
  );

  // 2. Corrigir hook useSafeTheme para melhor tratamento de erros
  const safethemeHookFix = `"use client";

import { useState, useEffect, useCallback } from "react";

// Configurações padrão para evitar erros durante SSR
const defaultSettings = {
  theme: "light" as const,
  accentColor: "blue" as const,
  fontSize: "medium" as const,
  compactMode: false,
  animations: true,
  highContrast: false,
  reducedMotion: false,
  sidebarCollapsed: false,
  showAvatars: true,
  colorfulIcons: true,
};

type ThemeSettings = typeof defaultSettings;

export function useSafeTheme() {
  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Detectar preferência do sistema
  const getSystemTheme = useCallback(() => {
    if (typeof window === "undefined") return "light";
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Carrega as configurações do localStorage
    try {
      const savedSettings = localStorage.getItem("suagrana-theme-settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const mergedSettings = { ...defaultSettings, ...parsed };
        setSettings(mergedSettings);
        applyTheme(mergedSettings);
      } else {
        // Se não há configurações salvas, usar preferência do sistema
        const systemTheme = getSystemTheme();
        const initialSettings = { ...defaultSettings, theme: systemTheme };
        setSettings(initialSettings);
        applyTheme(initialSettings);
      }
    } catch (error) {
      console.warn("Error loading theme settings from localStorage:", error);
      applyTheme(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [isMounted, getSystemTheme]);

  // Aplicar tema ao DOM
  const applyTheme = useCallback((themeSettings: ThemeSettings) => {
    if (typeof window === "undefined") return;

    try {
      const root = document.documentElement;

      // Aplicar classe de tema
      root.classList.remove("light", "dark");
      root.classList.add(themeSettings.theme);

      // Aplicar outras configurações CSS
      root.style.setProperty("--font-size", themeSettings.fontSize);
      root.style.setProperty("--accent-color", themeSettings.accentColor);

      if (themeSettings.highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }

      if (themeSettings.reducedMotion) {
        root.classList.add("reduced-motion");
      } else {
        root.classList.remove("reduced-motion");
      }
    } catch (error) {
      console.warn("Error applying theme:", error);
    }
  }, []);

  const updateSettings = useCallback(
    (newSettings: Partial<ThemeSettings>) => {
      if (!isMounted) return;

      setSettings((prevSettings) => {
        const updated = { ...prevSettings, ...newSettings };

        try {
          localStorage.setItem(
            "suagrana-theme-settings",
            JSON.stringify(updated),
          );
          applyTheme(updated);
        } catch (error) {
          console.warn("Error saving theme settings to localStorage:", error);
        }

        return updated;
      });
    },
    [isMounted, applyTheme],
  );

  const resetSettings = useCallback(() => {
    if (!isMounted) return;

    try {
      localStorage.removeItem("suagrana-theme-settings");
      setSettings(defaultSettings);
      applyTheme(defaultSettings);
    } catch (error) {
      console.warn("Error resetting theme settings:", error);
    }
  }, [isMounted, applyTheme]);

  const toggleTheme = useCallback(() => {
    if (!isMounted) return;

    const newTheme = settings.theme === "light" ? "dark" : "light";
    updateSettings({ theme: newTheme });
  }, [isMounted, settings.theme, updateSettings]);

  // Escutar mudanças na preferência do sistema
  useEffect(() => {
    if (!isMounted) return;

    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e: MediaQueryListEvent) => {
        // Só atualizar se não há configuração manual salva
        try {
          const savedSettings = localStorage.getItem("suagrana-theme-settings");
          if (!savedSettings) {
            const systemTheme = e.matches ? "dark" : "light";
            updateSettings({ theme: systemTheme });
          }
        } catch (error) {
          console.warn("Error handling system theme change:", error);
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } catch (error) {
      console.warn("Error setting up system theme listener:", error);
    }
  }, [isMounted, updateSettings]);

  // Retornar configurações padrão durante SSR ou loading
  if (!isMounted || isLoading) {
    return {
      settings: defaultSettings,
      updateSettings: () => {},
      resetSettings: () => {},
      toggleTheme: () => {},
      isMounted: false,
      isLoading: true,
    };
  }

  return {
    settings,
    updateSettings,
    resetSettings,
    toggleTheme,
    isMounted: true,
    isLoading: false,
  };
}

export type { ThemeSettings };`;

  results.push(
    writeFile(
      "hooks/use-safe-theme.ts",
      safethemeHookFix,
      "Corrigindo hook useSafeTheme",
    ),
  );

  // 3. Corrigir componentes com problemas de importação
  results.push(
    updateFile(
      "components/enhanced-header.tsx",
      [
        {
          search:
            "const {\n    settings: { theme, colorfulIcons },\n    toggleTheme,\n  } = useSafeTheme();",
          replace:
            "const {\n    settings: { theme, colorfulIcons } = {},\n    toggleTheme,\n    isMounted: themeIsMounted\n  } = useSafeTheme();",
        },
      ],
      "Corrigindo enhanced-header para melhor tratamento de settings",
    ),
  );

  // 4. Corrigir problemas de contexto
  const contextFix = `"use client";

import { ReactNode } from "react";
import { ThemeProviderWrapper } from "@/components/theme-provider-wrapper";
import { UnifiedProvider } from "@/contexts/unified-context";
import { GlobalModalProvider } from "@/contexts/ui/global-modal-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { ErrorBoundary } from "react-error-boundary";

interface ClientProvidersProps {
  children: ReactNode;
}

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-destructive mb-4">Algo deu errado!</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button 
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ReactQueryProvider>
        <ThemeProviderWrapper>
          <NotificationProvider>
            <UnifiedProvider>
              <GlobalModalProvider>{children}</GlobalModalProvider>
            </UnifiedProvider>
          </NotificationProvider>
        </ThemeProviderWrapper>
      </ReactQueryProvider>
    </ErrorBoundary>
  );
}`;

  results.push(
    writeFile(
      "components/client-providers.tsx",
      contextFix,
      "Adicionando ErrorBoundary aos providers",
    ),
  );

  // 5. Instalar dependências necessárias
  results.push(
    execCommand(
      "npm install react-error-boundary",
      "Instalando react-error-boundary",
    ),
  );

  // 6. Corrigir problemas de TypeScript
  results.push(
    execCommand(
      "npx tsc --noEmit --skipLibCheck",
      "Verificando tipos TypeScript",
    ),
  );

  // 7. Corrigir problemas de ESLint
  results.push(
    execCommand(
      "npx eslint . --fix --ext .ts,.tsx,.js,.jsx",
      "Corrigindo problemas de ESLint",
    ),
  );

  // 8. Formatar código
  results.push(
    execCommand(
      'npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"',
      "Formatando código com Prettier",
    ),
  );

  // 9. Executar testes específicos para componentes
  results.push(
    execCommand(
      'npm test -- --testPathPattern="(sidebar|layout|theme)" --passWithNoTests',
      "Executando testes de componentes de layout",
    ),
  );

  // 10. Build de verificação
  results.push(execCommand("npm run build", "Verificando build do projeto"));

  // Resumo dos resultados
  const successful = results.filter(Boolean).length;
  const total = results.length;

  log("\n📊 RESUMO DA CORREÇÃO:", "bright");
  log(
    `✅ Sucessos: ${successful}/${total}`,
    successful === total ? "green" : "yellow",
  );

  if (successful === total) {
    log("\n🎉 Todas as correções foram aplicadas com sucesso!", "green");
    log("\n📋 Próximos passos recomendados:", "cyan");
    log("1. Reiniciar o servidor de desenvolvimento (npm run dev)", "blue");
    log("2. Verificar se a sidebar está funcionando corretamente", "blue");
    log("3. Testar a navegação entre páginas", "blue");
    log("4. Verificar se os temas estão funcionando", "blue");
  } else {
    log("\n⚠️ Algumas correções falharam. Verifique os logs acima.", "yellow");
  }
}

// Executar o script
fixSidebarAndErrors().catch((error) => {
  log(`\n💥 Erro fatal: ${error.message}`, "red");
  process.exit(1);
});
