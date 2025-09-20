"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSafeTheme } from "../hooks/use-safe-theme";
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
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
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
  {
    title: "Cartões",
    url: "/cards",
    icon: CreditCard,
    color: "text-orange-600",
  },
  {
    title: "Investimentos",
    url: "/investments",
    icon: TrendingUp,
    color: "text-emerald-600",
  },
  { title: "Metas", url: "/goals", icon: Target, color: "text-red-600" },
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

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { settings } = useSafeTheme();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${settings.colorfulIcons ? "bg-blue-600" : "bg-gray-600"} text-white`}
          >
            <PiggyBank className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">SuaGrana</h1>
            <p className="text-xs text-gray-500">Controle Financeiro</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.url;
              return (
                <li key={item.url}>
                  <Link
                    href={item.url}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 ${settings.colorfulIcons ? item.color : ""}`}
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
      <div className="flex-1">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
