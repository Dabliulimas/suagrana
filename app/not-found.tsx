"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Home, 
  Search, 
  ArrowLeft, 
  MapPin, 
  Clock,
  TrendingUp,
  CreditCard,
  Target,
  Plane,
  Users
} from "lucide-react";

// Links populares do sistema
const popularLinks = [
  { href: "/", label: "Dashboard", icon: Home, description: "Visão geral das finanças" },
  { href: "/transactions", label: "Transações", icon: CreditCard, description: "Controle de receitas e despesas" },
  { href: "/accounts", label: "Contas", icon: TrendingUp, description: "Gerenciar contas bancárias" },
  { href: "/investments", label: "Investimentos", icon: Target, description: "Portfolio de investimentos" },
  { href: "/goals", label: "Metas", icon: Target, description: "Objetivos financeiros" },
  { href: "/travel", label: "Viagens", icon: Plane, description: "Planejamento de viagens" },
  { href: "/shared", label: "Compartilhado", icon: Users, description: "Gastos compartilhados" },
];

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [countdown, setCountdown] = useState(10);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Filtrar links com base na busca
  const filteredLinks = popularLinks.filter(link =>
    link.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Countdown para redirecionamento automático
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoHome = () => {
    setIsRedirecting(true);
    router.push("/");
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirecionar para busca global (quando implementada)
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header da página 404 */}
          <div className="text-center mb-8">
            <div className="relative">
              <h1 className="text-8xl font-bold text-gray-200 dark:text-gray-700">404</h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="w-16 h-16 text-primary animate-bounce" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mt-4 mb-2">Página não encontrada</h2>
            <p className="text-muted-foreground text-lg">
              Parece que você se perdeu nas suas finanças! 
              <br />
              Vamos te ajudar a encontrar o caminho de volta.
            </p>
          </div>

          {/* Ações principais */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleGoBack} variant="outline" size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={handleGoHome} 
                  size="lg" 
                  disabled={isRedirecting}
                >
                  <Home className="w-4 h-4 mr-2" />
                  {isRedirecting ? "Redirecionando..." : "Ir para o Dashboard"}
                </Button>
              </div>
              
              {/* Contador de redirecionamento */}
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Redirecionamento automático em {countdown} segundos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Busca */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Procurar algo específico?
              </CardTitle>
              <CardDescription>
                Digite o que você está procurando e encontraremos para você
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Ex: transações, investimentos, metas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Links populares */}
          <Card>
            <CardHeader>
              <CardTitle>Páginas populares</CardTitle>
              <CardDescription>
                Talvez você estava procurando uma dessas funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(searchQuery ? filteredLinks : popularLinks).map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 block"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {link.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              
              {searchQuery && filteredLinks.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum resultado encontrado para "{searchQuery}"
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                    className="mt-2"
                  >
                    Limpar busca
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de ajuda */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Ainda não encontrou o que procurava?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="ghost" size="sm" asChild>
                <a href="mailto:suporte@suagrana.app">
                  Contatar Suporte
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/help">
                  Central de Ajuda
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Animação de fundo sutil */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}
