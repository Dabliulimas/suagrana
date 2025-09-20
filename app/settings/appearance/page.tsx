"use client";

import { useState, useEffect } from "react";
import { useSafeTheme } from "@/hooks/use-safe-theme";
import { ModernAppLayout } from "@/components/modern-app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Palette,
  ArrowLeft,
  Save,
  Sun,
  Moon,
  Monitor,
  Eye,
  Layout,
  Type,
  Zap,
  Contrast,
  Accessibility,
} from "lucide-react";
import { toast } from "sonner";

export default function AppearancePage() {
  const { settings, updateSettings } = useSafeTheme();
  const [appearance, setAppearance] = useState(settings);

  useEffect(() => {
    setAppearance(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(appearance);
    toast.success("Configurações de aparência salvas com sucesso!");
  };

  const themeOptions = [
    {
      value: "light",
      label: "Claro",
      icon: Sun,
      description: "Tema claro para uso diurno",
    },
    {
      value: "dark",
      label: "Escuro",
      icon: Moon,
      description: "Tema escuro para uso noturno",
    },
    {
      value: "system",
      label: "Sistema",
      icon: Monitor,
      description: "Segue o tema do sistema",
    },
  ];

  const accentColors = [
    { value: "blue", label: "Azul", color: "#3B82F6" },
    { value: "green", label: "Verde", color: "#10B981" },
    { value: "purple", label: "Roxo", color: "#8B5CF6" },
    { value: "red", label: "Vermelho", color: "#EF4444" },
    { value: "orange", label: "Laranja", color: "#F59E0B" },
    { value: "pink", label: "Rosa", color: "#EC4899" },
  ];

  const fontSizes = [
    { value: "small", label: "Pequeno", size: "14px" },
    { value: "medium", label: "Médio", size: "16px" },
    { value: "large", label: "Grande", size: "18px" },
    { value: "extra-large", label: "Extra Grande", size: "20px" },
  ];

  return (
    <ModernAppLayout
      title="Aparência"
      subtitle="Personalize a interface e experiência visual do sistema"
    >
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="grid gap-6">
          {/* Tema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Tema
              </CardTitle>
              <CardDescription>
                Escolha entre tema claro, escuro ou automático
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={appearance.theme}
                onValueChange={(value) =>
                  setAppearance((prev) => ({
                    ...prev,
                    theme: value as "light" | "dark" | "system",
                  }))
                }
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {themeOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <option.icon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {option.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Cor de Destaque */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Cor de Destaque
              </CardTitle>
              <CardDescription>
                Escolha a cor principal para botões e elementos interativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() =>
                      setAppearance((prev) => ({
                        ...prev,
                        accentColor: color.value as
                          | "blue"
                          | "green"
                          | "purple"
                          | "red"
                          | "orange"
                          | "pink",
                      }))
                    }
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      appearance.accentColor === color.value
                        ? "border-gray-400 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: color.color }}
                    />
                    <span className="text-sm font-medium">{color.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tipografia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Tipografia
              </CardTitle>
              <CardDescription>
                Ajuste o tamanho da fonte para melhor legibilidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Tamanho da Fonte</Label>
                <RadioGroup
                  value={appearance.fontSize}
                  onValueChange={(value) =>
                    setAppearance((prev) => ({
                      ...prev,
                      fontSize: value as
                        | "small"
                        | "medium"
                        | "large"
                        | "extra-large",
                    }))
                  }
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {fontSizes.map((size) => (
                    <div
                      key={size.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem value={size.value} id={size.value} />
                      <Label htmlFor={size.value} className="cursor-pointer">
                        <div className="text-center p-3 border rounded-lg">
                          <p
                            style={{ fontSize: size.size }}
                            className="font-medium"
                          >
                            Aa
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {size.label}
                          </p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Layout e Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Layout e Interface
              </CardTitle>
              <CardDescription>
                Configure o comportamento e densidade da interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compact-mode">Modo Compacto</Label>
                  <p className="text-sm text-gray-500">
                    Interface mais densa com menos espaçamento
                  </p>
                </div>
                <Switch
                  id="compact-mode"
                  checked={appearance.compactMode}
                  onCheckedChange={(checked) =>
                    setAppearance((prev) => ({ ...prev, compactMode: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sidebar-collapsed">Sidebar Recolhida</Label>
                  <p className="text-sm text-gray-500">
                    Manter a barra lateral recolhida por padrão
                  </p>
                </div>
                <Switch
                  id="sidebar-collapsed"
                  checked={appearance.sidebarCollapsed}
                  onCheckedChange={(checked) =>
                    setAppearance((prev) => ({
                      ...prev,
                      sidebarCollapsed: checked,
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-avatars">Mostrar Avatares</Label>
                  <p className="text-sm text-gray-500">
                    Exibir fotos de perfil e avatares
                  </p>
                </div>
                <Switch
                  id="show-avatars"
                  checked={appearance.showAvatars}
                  onCheckedChange={(checked) =>
                    setAppearance((prev) => ({ ...prev, showAvatars: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="colorful-icons">Ícones Coloridos</Label>
                  <p className="text-sm text-gray-500">
                    Usar ícones coloridos em vez de monocromáticos
                  </p>
                </div>
                <Switch
                  id="colorful-icons"
                  checked={appearance.colorfulIcons}
                  onCheckedChange={(checked) =>
                    setAppearance((prev) => ({
                      ...prev,
                      colorfulIcons: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Animações e Efeitos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Animações e Efeitos
              </CardTitle>
              <CardDescription>
                Configure animações e transições visuais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="animations">Animações</Label>
                  <p className="text-sm text-gray-500">
                    Ativar transições e animações suaves
                  </p>
                </div>
                <Switch
                  id="animations"
                  checked={appearance.animations}
                  onCheckedChange={(checked) =>
                    setAppearance((prev) => ({ ...prev, animations: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reduced-motion">Movimento Reduzido</Label>
                  <p className="text-sm text-gray-500">
                    Reduzir animações para melhor acessibilidade
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={appearance.reducedMotion}
                  onCheckedChange={(checked) =>
                    setAppearance((prev) => ({
                      ...prev,
                      reducedMotion: checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Acessibilidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="w-5 h-5" />
                Acessibilidade
              </CardTitle>
              <CardDescription>
                Configurações para melhorar a acessibilidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="high-contrast">Alto Contraste</Label>
                  <p className="text-sm text-gray-500">
                    Aumentar o contraste para melhor visibilidade
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={appearance.highContrast}
                  onCheckedChange={(checked) =>
                    setAppearance((prev) => ({
                      ...prev,
                      highContrast: checked,
                    }))
                  }
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Dicas de Acessibilidade:
                </h4>
                <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                  <li>
                    • Use o modo de alto contraste se tiver dificuldades visuais
                  </li>
                  <li>
                    • Ative movimento reduzido se animações causam desconforto
                  </li>
                  <li>• Aumente o tamanho da fonte para melhor legibilidade</li>
                  <li>• Use o tema escuro em ambientes com pouca luz</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Visualização</CardTitle>
              <CardDescription>
                Prévia de como a interface ficará com suas configurações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{
                      backgroundColor: accentColors.find(
                        (c) => c.value === appearance.accentColor,
                      )?.color,
                    }}
                  />
                  <div>
                    <p
                      className={`font-medium ${appearance.fontSize === "small" ? "text-sm" : appearance.fontSize === "large" ? "text-lg" : appearance.fontSize === "extra-large" ? "text-xl" : "text-base"}`}
                    >
                      Exemplo de Texto
                    </p>
                    <p className="text-sm text-gray-500">
                      Subtítulo de exemplo
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size={appearance.compactMode ? "sm" : "default"}
                    style={{
                      backgroundColor: accentColors.find(
                        (c) => c.value === appearance.accentColor,
                      )?.color,
                    }}
                  >
                    Botão Principal
                  </Button>
                  <Button
                    variant="outline"
                    size={appearance.compactMode ? "sm" : "default"}
                  >
                    Botão Secundário
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </ModernAppLayout>
  );
}
