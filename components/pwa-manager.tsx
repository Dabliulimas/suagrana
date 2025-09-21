"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Smartphone,
  Download,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  RefreshCw,
  X,
  Chrome,
  Safari,
  Firefox,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { pushNotificationService } from "../lib/push-notification-service";

interface PWAManagerProps {
  onInstallPrompt?: () => void;
}

export function PWAManager({ onInstallPrompt }: PWAManagerProps) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (typeof window === "undefined") return;
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    // Check online status
    const updateOnlineStatus = () => {
      if (typeof window === "undefined" || typeof navigator === "undefined") return;
      setIsOnline(navigator.onLine);
    };

    // Check notification permission
    const checkNotificationPermission = () => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      setNotificationPermission(Notification.permission);
    };

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success("App instalado com sucesso!");
    };

    // Service Worker update detection
    const handleServiceWorkerUpdate = () => {
      setUpdateAvailable(true);
      toast.info("Nova versão disponível! Recarregue a página para atualizar.");
    };

    checkInstalled();
    updateOnlineStatus();
    checkNotificationPermission();

    // Event listeners
    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);
      window.addEventListener("online", updateOnlineStatus);
      window.addEventListener("offline", updateOnlineStatus);
    }

    // Service Worker registration and update detection
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.addEventListener(
            "updatefound",
            handleServiceWorkerUpdate,
          );
        })
        .catch((error) => {
          logComponents.error("Service Worker registration failed:", error);
        });
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt,
        );
        window.removeEventListener("appinstalled", handleAppInstalled);
        window.removeEventListener("online", updateOnlineStatus);
        window.removeEventListener("offline", updateOnlineStatus);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      const result = await deferredPrompt.prompt();
      if (result.outcome === "accepted") {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      logComponents.error("Install prompt failed:", error);
      toast.error("Erro ao instalar o app");
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notificações não são suportadas neste navegador");
      return;
    }

    try {
      const permission = await pushNotificationService.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        toast.success("Permissão de notificação concedida!");

        // Inicializar o serviço de notificações push
        await pushNotificationService.initialize();

        // Agendar uma notificação de boas-vindas
        const welcomeTime = new Date();
        welcomeTime.setSeconds(welcomeTime.getSeconds() + 3);

        pushNotificationService.scheduleNotification({
          payload: {
            title: "🎉 SuaGrana - Bem-vindo!",
            body: "Você receberá notificações importantes sobre suas finanças.",
            icon: "/icon-192.png",
            tag: "welcome",
            data: { type: "welcome" },
          },
          scheduledFor: welcomeTime,
        });
      } else {
        toast.error("Permissão de notificação negada");
      }
    } catch (error) {
      logComponents.error("Erro ao solicitar permissão de notificação:", error);
      toast.error("Erro ao solicitar permissão de notificação");
    }
  };

  const scheduleNotification = (
    title: string,
    body: string,
    delay: number = 0,
  ) => {
    if (notificationPermission !== "granted") return;

    setTimeout(() => {
      new Notification(title, {
        body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "financial-reminder",
        requireInteraction: true,
      });
    }, delay);
  };

  const getInstallInstructions = () => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';

    if (userAgent.includes("chrome") && !userAgent.includes("edg")) {
      return {
        browser: "Chrome",
        steps: [
          "Clique no ícone de menu (⋮) no canto superior direito",
          'Selecione "Instalar Finanças App"',
          'Clique em "Instalar" na janela que aparecer',
        ],
      };
    } else if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
      return {
        browser: "Safari",
        steps: [
          "Toque no ícone de compartilhar (□↗)",
          'Role para baixo e toque em "Adicionar à Tela de Início"',
          'Toque em "Adicionar" no canto superior direito',
        ],
      };
    } else if (userAgent.includes("firefox")) {
      return {
        browser: "Firefox",
        steps: [
          "Clique no ícone de menu (☰) no canto superior direito",
          'Selecione "Instalar"',
          'Clique em "Instalar" na janela que aparecer',
        ],
      };
    } else {
      return {
        browser: "Navegador",
        steps: [
          'Procure pela opção "Instalar" ou "Adicionar à tela inicial" no menu do navegador',
          "Siga as instruções para instalar o app",
        ],
      };
    }
  };

  return (
    <>
      {/* Install Banner */}
      {isInstallable && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Download className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">Instalar App</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Instale o app para acesso rápido e notificações
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleInstallClick}>
                      Instalar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowInstallDialog(true)}
                    >
                      Instruções
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsInstallable(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-orange-100 border-b border-orange-200">
          <div className="container px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-orange-800">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">
                Você está offline. Algumas funcionalidades podem estar
                limitadas.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Update Banner */}
      {updateAvailable && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-green-100 border-b border-green-200">
          <div className="container px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-800">
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Nova versão disponível!
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUpdateAvailable(false)}
              >
                Dispensar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Install Instructions Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Como Instalar o App</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              Instruções para {getInstallInstructions().browser}
            </div>

            <ol className="space-y-2">
              {getInstallInstructions().steps.map((step, index) => (
                <li
                  key={`install-step-${index}`}
                  className="flex gap-3 text-sm"
                >
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Após a instalação, você poderá acessar o app diretamente da sua
                tela inicial e receber notificações importantes sobre suas
                finanças.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
