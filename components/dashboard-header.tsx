"use client";

import { useState } from "react";
import { useSafeTheme } from "../hooks/use-safe-theme";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Bell, User, LogOut, Shield, Settings } from "lucide-react";
import { useAuth } from "./enhanced-auth-provider";
import { AdminPanel } from "./admin-panel";
import { toast } from "sonner";

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { settings } = useSafeTheme();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [notificationCount] = useState(0);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
    } catch (error) {
      toast.error("Erro no logout");
    }
  };

  return (
    <>
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">SuaGrana</h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Controle Financeiro v2.0
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative border border-input bg-background text-foreground dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              <Bell
                className={`h-5 w-5 ${settings.colorfulIcons ? "text-blue-600 dark:text-blue-400" : ""}`}
              />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>

            {/* Admin Panel Access */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdminPanel(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 border border-input bg-background dark:border-gray-600 dark:bg-gray-800"
              >
                <Shield
                  className={`h-5 w-5 ${settings.colorfulIcons ? "text-red-600 dark:text-red-400" : ""}`}
                />
              </Button>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 border border-input bg-background text-foreground dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  <User
                    className={`h-5 w-5 ${settings.colorfulIcons ? "text-green-600 dark:text-green-400" : ""}`}
                  />
                  <span className="hidden md:inline">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user?.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-600">{user?.email}</p>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        User
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Demo
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings
                    className={`mr-2 h-4 w-4 ${settings.colorfulIcons ? "text-gray-600 dark:text-gray-400" : ""}`}
                  />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowAdminPanel(true)}
                  className="text-red-600"
                >
                  <Shield
                    className={`mr-2 h-4 w-4 ${settings.colorfulIcons ? "text-red-600 dark:text-red-400" : ""}`}
                  />
                  Painel Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut
                    className={`mr-2 h-4 w-4 ${settings.colorfulIcons ? "text-red-600 dark:text-red-400" : ""}`}
                  />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
    </>
  );
}
