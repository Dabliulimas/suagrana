"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  ArrowLeft,
  ExternalLink,
  Mail,
  MessageCircle,
  Book,
  Shield,
  Heart,
  Star,
  Github,
  Globe,
  Smartphone,
  Monitor,
  Zap,
} from "lucide-react";

export default function AboutPage() {
  const features = [
    "Gestão completa de transações",
    "Categorização inteligente",
    "Relatórios avançados",
    "Despesas compartilhadas",
    "Controle de investimentos",
    "Metas financeiras",
    "Backup automático",
    "Segurança avançada",
  ];

  const supportChannels = [
    {
      name: "Central de Ajuda",
      description: "Documentação e tutoriais",
      icon: Book,
      action: "Acessar",
    },
    {
      name: "Email de Suporte",
      description: "suporte@suagrana.com",
      icon: Mail,
      action: "Enviar Email",
    },
    {
      name: "Chat ao Vivo",
      description: "Suporte em tempo real",
      icon: MessageCircle,
      action: "Iniciar Chat",
    },
  ];

  const systemInfo = {
    version: "2.0.0",
    buildNumber: "2025.08.27",
    releaseDate: "27 de Agosto de 2025",
    platform: "Web App",
    framework: "Next.js 14",
    database: "Local Storage",
    lastUpdate: "Hoje",
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Info className="w-6 h-6" />
            Sobre
          </h1>
          <p className="text-gray-600">
            Informações sobre o sistema, versão e suporte
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Sobre o SuaGrana */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">SG</span>
              </div>
              <div>
                <CardTitle className="text-2xl">SuaGrana</CardTitle>
                <CardDescription className="text-lg">
                  Sistema Completo de Controle Financeiro Pessoal
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              O SuaGrana é uma solução completa para gestão financeira pessoal,
              desenvolvida para ajudar você a ter controle total sobre suas
              finanças. Com recursos avançados de categorização, relatórios
              inteligentes e automação, oferecemos uma experiência profissional
              e intuitiva.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Informações da Versão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Informações da Versão
            </CardTitle>
            <CardDescription>
              Detalhes técnicos sobre a versão atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Versão:</span>
                  <Badge variant="default">{systemInfo.version}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Build:</span>
                  <span className="font-medium">{systemInfo.buildNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lançamento:</span>
                  <span className="font-medium">{systemInfo.releaseDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última Atualização:</span>
                  <span className="font-medium">{systemInfo.lastUpdate}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plataforma:</span>
                  <span className="font-medium">{systemInfo.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Framework:</span>
                  <span className="font-medium">{systemInfo.framework}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Armazenamento:</span>
                  <span className="font-medium">{systemInfo.database}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="default" className="bg-green-600">
                    Ativo
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Novidades da Versão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Novidades da Versão 2.0
            </CardTitle>
            <CardDescription>
              Principais recursos adicionados nesta versão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div>
                  <p className="font-medium">
                    Sistema de Gestão Financeira Avançada
                  </p>
                  <p className="text-sm text-gray-500">
                    Categorização inteligente, tags, membros da família e regras
                    automáticas
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div>
                  <p className="font-medium">Relatórios Profissionais</p>
                  <p className="text-sm text-gray-500">
                    Gráficos interativos, análises detalhadas e insights
                    financeiros
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div>
                  <p className="font-medium">
                    Sistema de Configurações Completo
                  </p>
                  <p className="text-sm text-gray-500">
                    Perfil, segurança, backup, aparência e privacidade
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div>
                  <p className="font-medium">Melhorias na Interface</p>
                  <p className="text-sm text-gray-500">
                    Design renovado, navegação otimizada e experiência
                    aprimorada
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div>
                  <p className="font-medium">Segurança Avançada</p>
                  <p className="text-sm text-gray-500">
                    Autenticação de dois fatores, gerenciamento de sessões e
                    criptografia
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suporte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Suporte e Ajuda
            </CardTitle>
            <CardDescription>
              Precisa de ajuda? Entre em contato conosco
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {supportChannels.map((channel, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <channel.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{channel.name}</p>
                      <p className="text-sm text-gray-500">
                        {channel.description}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    {channel.action}
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compatibilidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Compatibilidade
            </CardTitle>
            <CardDescription>
              Plataformas e navegadores suportados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Desktop
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Chrome 90+</li>
                  <li>• Firefox 88+</li>
                  <li>• Safari 14+</li>
                  <li>• Edge 90+</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Mobile
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• iOS Safari 14+</li>
                  <li>• Chrome Mobile 90+</li>
                  <li>• Samsung Internet 13+</li>
                  <li>• Firefox Mobile 88+</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Recursos
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• PWA (Progressive Web App)</li>
                  <li>• Offline Ready</li>
                  <li>• Responsive Design</li>
                  <li>• Touch Friendly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Licença e Créditos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Licença e Créditos
            </CardTitle>
            <CardDescription>
              Informações sobre licenciamento e tecnologias utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">SuaGrana v2.0</p>
                <p className="text-sm text-gray-500">
                  © 2025 - Todos os direitos reservados
                </p>
              </div>
              <Badge variant="outline">Proprietário</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium">Frontend</p>
                <p className="text-gray-500">Next.js, React, TypeScript</p>
              </div>
              <div>
                <p className="font-medium">UI/UX</p>
                <p className="text-gray-500">Tailwind CSS, Shadcn/ui</p>
              </div>
              <div>
                <p className="font-medium">Gráficos</p>
                <p className="text-gray-500">Recharts, Lucide Icons</p>
              </div>
              <div>
                <p className="font-medium">Armazenamento</p>
                <p className="text-gray-500">Local Storage, IndexedDB</p>
              </div>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-500">
                Desenvolvido com{" "}
                <Heart className="w-4 h-4 inline text-red-500" /> para ajudar
                você a ter controle total sobre suas finanças
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
