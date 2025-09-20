"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Search,
  Bell,
  Settings,
  User,
  Menu,
  Plus,
  Command,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { useSafeTheme } from "../hooks/use-safe-theme";
import { useGlobalModal } from "../contexts/ui/global-modal-context";
import { NewTransactionButton } from "./new-transaction-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { EnhancedNotificationSystem } from "./enhanced-notification-system";
import { UserSettingsModal } from "./modals/user-settings-modal";

interface EnhancedHeaderProps {
  onOpenSidebar?: () => void;
  title?: string;
  subtitle?: string;
}

export function EnhancedHeader({
  onOpenSidebar,
  title,
  subtitle,
}: EnhancedHeaderProps) {
  const [searchShortcut, setSearchShortcut] = useState("Ctrl+K");
  const [showUserSettings, setShowUserSettings] = useState(false);
  const { openGlobalSearch } = useGlobalModal();
  const router = useRouter();
  const {
    settings: { theme, colorfulIcons } = {},
    toggleTheme,
  } = useSafeTheme();

  useEffect(() => {
    // Detect OS for keyboard shortcut display
    const isMac =
      typeof window !== "undefined" &&
      navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    setSearchShortcut(isMac ? "⌘K" : "Ctrl+K");

    // Global keyboard shortcut for search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openGlobalSearch();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [openGlobalSearch]);

  // Removido o estado de loading para evitar problemas de hidratação

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 w-full">
          {/* Left side - Menu and Title */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground"
              onClick={onOpenSidebar}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden md:block">
              <h1 className="text-xl font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <button
                  className="w-full justify-start text-muted-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
                  onClick={openGlobalSearch}
                >
                  <Search
                    className={`mr-2 h-4 w-4 ${colorfulIcons ? "text-blue-600 dark:text-blue-400" : ""}`}
                  />
                  <span className="hidden sm:inline">
                    Buscar transacoes, metas, viagens...
                  </span>
                  <span className="sm:hidden">Buscar...</span>
                  <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    {searchShortcut}
                  </kbd>
                </button>
              </div>
              <NewTransactionButton
                variant="default"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
              />
            </div>
          </div>

          {/* Right side - Actions and User */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <EnhancedNotificationSystem />

            {/* Theme Toggle */}
            <button
              className="hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 border border-input bg-background text-foreground dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              onClick={toggleTheme}
            >
              <Sun
                className={`h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 ${colorfulIcons ? "text-yellow-500 dark:text-yellow-400" : ""}`}
              />
              <Moon
                className={`absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 ${colorfulIcons ? "text-blue-600 dark:text-blue-400" : ""}`}
              />
              <span className="sr-only">Toggle theme</span>
            </button>

            {/* User Settings */}
            <div className="relative">
              <button
                onClick={() => setShowUserSettings(true)}
                className="hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 relative border border-input bg-background text-foreground dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                <User
                  className={`h-4 w-4 ${colorfulIcons ? "text-green-600 dark:text-green-400" : ""}`}
                />
                <span className="sr-only">User settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile title */}
        <div className="md:hidden px-4 pb-3">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </header>

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={showUserSettings}
        onClose={() => setShowUserSettings(false)}
      />
    </>
  );
}
