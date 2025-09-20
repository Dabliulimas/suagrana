"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { useSafeTheme } from "../../hooks/use-safe-theme";
import { useNotifications } from "../../contexts/notification-context";
import {
  User,
  Palette,
  Bell,
  Shield,
  Database,
  Monitor,
  Sun,
  Moon,
  Smartphone,
  Eye,
  Volume2,
  Accessibility,
} from "lucide-react";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { settings, updateSettings, resetSettings, toggleTheme } =
    useSafeTheme();
  const { clearAllNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState("appearance");

  const handleSave = () => {
    // Settings are automatically saved via updateSettings
    onClose();
  };

  const handleReset = () => {
    if (
      confirm("Tem certeza que deseja restaurar todas as configurações padrão?")
    ) {
      resetSettings();
      clearAllNotifications();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Configurações do Usuário
          </DialogTitle>
          <DialogDescription>
            Personalize sua experiência no SuaGrana
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Aparência</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger
              value="accessibility"
              className="flex items-center gap-2"
            >
              <Accessibility className="w-4 h-4" />
              <span className="hidden sm:inline">Acessibilidade</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tema e Aparência</h3>

              {/* Theme Selection */}
              <div className="space-y-2">
                <Label>Tema</Label>
                <div className="flex gap-2">
                  <Button
                    variant={settings.theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSettings({ theme: "light" })}
                    className="flex items-center gap-2"
                  >
                    <Sun className="w-4 h-4" />
                    Claro
                  </Button>
                  <Button
                    variant={settings.theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSettings({ theme: "dark" })}
                    className="flex items-center gap-2"
                  >
                    <Moon className="w-4 h-4" />
                    Escuro
                  </Button>
                  <Button
                    variant={
                      settings.theme === "system" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => updateSettings({ theme: "system" })}
                    className="flex items-center gap-2"
                  >
                    <Monitor className="w-4 h-4" />
                    Sistema
                  </Button>
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <Label htmlFor="accent-color">Cor de Destaque</Label>
                <Select
                  value={settings.accentColor}
                  onValueChange={(value) =>
                    updateSettings({ accentColor: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Azul</SelectItem>
                    <SelectItem value="green">Verde</SelectItem>
                    <SelectItem value="purple">Roxo</SelectItem>
                    <SelectItem value="orange">Laranja</SelectItem>
                    <SelectItem value="red">Vermelho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <Label htmlFor="font-size">Tamanho da Fonte</Label>
                <Select
                  value={settings.fontSize}
                  onValueChange={(value) =>
                    updateSettings({ fontSize: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequena</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Visual Options */}
              <div className="space-y-4">
                <h4 className="font-medium">Opções Visuais</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ícones Coloridos</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar cores nos ícones da interface
                    </p>
                  </div>
                  <Switch
                    checked={settings.colorfulIcons}
                    onCheckedChange={(checked) =>
                      updateSettings({ colorfulIcons: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Compacto</Label>
                    <p className="text-sm text-muted-foreground">
                      Interface mais densa com menos espaçamento
                    </p>
                  </div>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={(checked) =>
                      updateSettings({ compactMode: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar Avatares</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir avatares em contatos e perfis
                    </p>
                  </div>
                  <Switch
                    checked={settings.showAvatars}
                    onCheckedChange={(checked) =>
                      updateSettings({ showAvatars: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Animações</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilitar animações e transições
                    </p>
                  </div>
                  <Switch
                    checked={settings.animations}
                    onCheckedChange={(checked) =>
                      updateSettings({ animations: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Configurações de Notificação
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações de Transações</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações quando transações forem adicionadas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lembretes de Metas</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber lembretes sobre o progresso das metas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Orçamento</Label>
                    <p className="text-sm text-muted-foreground">
                      Ser notificado quando ultrapassar limites de orçamento
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lembretes de Contas</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber lembretes de vencimento de contas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={clearAllNotifications}
                  className="w-full"
                >
                  Limpar Todas as Notificações
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Accessibility Settings */}
          <TabsContent value="accessibility" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Acessibilidade</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alto Contraste</Label>
                    <p className="text-sm text-muted-foreground">
                      Aumentar o contraste para melhor visibilidade
                    </p>
                  </div>
                  <Switch
                    checked={settings.highContrast}
                    onCheckedChange={(checked) =>
                      updateSettings({ highContrast: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reduzir Movimento</Label>
                    <p className="text-sm text-muted-foreground">
                      Minimizar animações e efeitos de movimento
                    </p>
                  </div>
                  <Switch
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) =>
                      updateSettings({ reducedMotion: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Barra Lateral Recolhida</Label>
                    <p className="text-sm text-muted-foreground">
                      Manter a barra lateral recolhida por padrão
                    </p>
                  </div>
                  <Switch
                    checked={settings.sidebarCollapsed}
                    onCheckedChange={(checked) =>
                      updateSettings({ sidebarCollapsed: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Data Settings */}
          <TabsContent value="data" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Gerenciamento de Dados</h3>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Backup de Dados</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Faça backup dos seus dados financeiros
                  </p>
                  <Button variant="outline" size="sm">
                    <Database className="w-4 h-4 mr-2" />
                    Exportar Dados
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Importar Dados</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Restaurar dados de um backup anterior
                  </p>
                  <Button variant="outline" size="sm">
                    <Database className="w-4 h-4 mr-2" />
                    Importar Dados
                  </Button>
                </div>

                <Separator />

                <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <h4 className="font-medium mb-2 text-red-800 dark:text-red-200">
                    Zona de Perigo
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                    Estas ações não podem ser desfeitas
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Restaurar Configurações Padrão
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Limpar Todos os Dados
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Configurações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
