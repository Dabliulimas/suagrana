"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  BookOpen,
  Trophy,
  Star,
  Clock,
  Users,
  CheckCircle,
  Lock,
  Play,
  Award,
  Target,
  TrendingUp,
  Lightbulb,
  Brain,
  Zap,
  Gift,
  Calendar,
  MessageCircle,
  ThumbsUp,
  Share2,
  Download,
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  level: "iniciante" | "intermediario" | "avancado";
  duration: string;
  lessons: number;
  progress: number;
  rating: number;
  students: number;
  category: string;
  instructor: string;
  thumbnail: string;
  isLocked: boolean;
  points: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: "comum" | "raro" | "epico" | "lendario";
}

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  difficulty: "facil" | "medio" | "dificil";
  likes: number;
  isLiked: boolean;
  author: string;
  publishedAt: string;
  tags: string[];
}

interface UserStats {
  totalPoints: number;
  level: number;
  coursesCompleted: number;
  achievementsUnlocked: number;
  streak: number;
  rank: string;
  nextLevelPoints: number;
}

const FinancialEducationHub: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("courses");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 2450,
    level: 8,
    coursesCompleted: 12,
    achievementsUnlocked: 18,
    streak: 7,
    rank: "Investidor Experiente",
    nextLevelPoints: 550,
  });

  // Sample courses data
  const courses: Course[] = [
    {
      id: "course1",
      title: "Fundamentos do Orçamento Pessoal",
      description:
        "Aprenda a criar e gerenciar seu orçamento pessoal de forma eficiente",
      level: "iniciante",
      duration: "2h 30min",
      lessons: 8,
      progress: 100,
      rating: 4.8,
      students: 1250,
      category: "Orçamento",
      instructor: "Ana Silva",
      thumbnail: "/course1.jpg",
      isLocked: false,
      points: 150,
    },
    {
      id: "course2",
      title: "Investimentos para Iniciantes",
      description:
        "Descubra o mundo dos investimentos e comece a fazer seu dinheiro trabalhar para você",
      level: "iniciante",
      duration: "3h 15min",
      lessons: 12,
      progress: 75,
      rating: 4.9,
      students: 2100,
      category: "Investimentos",
      instructor: "Carlos Mendes",
      thumbnail: "/course2.jpg",
      isLocked: false,
      points: 200,
    },
    {
      id: "course3",
      title: "Estratégias Avançadas de Investimento",
      description:
        "Técnicas avançadas para maximizar seus retornos e diversificar sua carteira",
      level: "avancado",
      duration: "4h 45min",
      lessons: 16,
      progress: 0,
      rating: 4.7,
      students: 850,
      category: "Investimentos",
      instructor: "Roberto Lima",
      thumbnail: "/course3.jpg",
      isLocked: false,
      points: 350,
    },
    {
      id: "course4",
      title: "Planejamento de Aposentadoria",
      description:
        "Como planejar e garantir uma aposentadoria tranquila e confortável",
      level: "intermediario",
      duration: "3h 30min",
      lessons: 10,
      progress: 0,
      rating: 4.6,
      students: 920,
      category: "Planejamento",
      instructor: "Maria Santos",
      thumbnail: "/course4.jpg",
      isLocked: true,
      points: 250,
    },
    {
      id: "course5",
      title: "Educação Financeira para Famílias",
      description:
        "Ensine educação financeira para toda a família e construa um futuro próspero",
      level: "intermediario",
      duration: "2h 45min",
      lessons: 9,
      progress: 30,
      rating: 4.8,
      students: 1100,
      category: "Família",
      instructor: "João Oliveira",
      thumbnail: "/course5.jpg",
      isLocked: false,
      points: 180,
    },
    {
      id: "course6",
      title: "Empreendedorismo e Finanças",
      description: "Gestão financeira para empreendedores e pequenos negócios",
      level: "avancado",
      duration: "5h 20min",
      lessons: 20,
      progress: 0,
      rating: 4.9,
      students: 650,
      category: "Empreendedorismo",
      instructor: "Patricia Costa",
      thumbnail: "/course6.jpg",
      isLocked: true,
      points: 400,
    },
  ];

  // Sample achievements
  const achievements: Achievement[] = [
    {
      id: "ach1",
      title: "Primeiro Passo",
      description: "Complete seu primeiro curso",
      icon: "🎯",
      points: 50,
      unlocked: true,
      unlockedAt: "2024-01-15",
      rarity: "comum",
    },
    {
      id: "ach2",
      title: "Estudante Dedicado",
      description: "Estude por 7 dias consecutivos",
      icon: "📚",
      points: 100,
      unlocked: true,
      unlockedAt: "2024-01-22",
      rarity: "raro",
    },
    {
      id: "ach3",
      title: "Mestre dos Investimentos",
      description: "Complete todos os cursos de investimentos",
      icon: "💎",
      points: 300,
      unlocked: false,
      rarity: "epico",
    },
    {
      id: "ach4",
      title: "Guru Financeiro",
      description: "Alcance o nível 10",
      icon: "👑",
      points: 500,
      unlocked: false,
      rarity: "lendario",
    },
    {
      id: "ach5",
      title: "Compartilhador",
      description: "Compartilhe 5 dicas com a comunidade",
      icon: "🤝",
      points: 75,
      unlocked: true,
      unlockedAt: "2024-01-28",
      rarity: "comum",
    },
    {
      id: "ach6",
      title: "Maratonista",
      description: "Complete 3 cursos em uma semana",
      icon: "🏃",
      points: 200,
      unlocked: false,
      rarity: "raro",
    },
  ];

  // Sample tips
  const tips: Tip[] = [
    {
      id: "tip1",
      title: "Regra dos 50-30-20",
      content:
        "Divida sua renda em: 50% necessidades, 30% desejos, 20% poupança e investimentos. Esta regra simples ajuda a manter o equilíbrio financeiro.",
      category: "Orçamento",
      difficulty: "facil",
      likes: 245,
      isLiked: true,
      author: "Ana Silva",
      publishedAt: "2024-01-20",
      tags: ["orçamento", "poupança", "planejamento"],
    },
    {
      id: "tip2",
      title: "Diversificação de Investimentos",
      content:
        "Nunca coloque todos os ovos na mesma cesta. Diversifique seus investimentos entre diferentes classes de ativos para reduzir riscos.",
      category: "Investimentos",
      difficulty: "medio",
      likes: 189,
      isLiked: false,
      author: "Carlos Mendes",
      publishedAt: "2024-01-18",
      tags: ["investimentos", "diversificação", "risco"],
    },
    {
      id: "tip3",
      title: "Fundo de Emergência",
      content:
        "Mantenha de 3 a 6 meses de gastos em uma reserva de emergência. Isso te protegerá de imprevistos financeiros.",
      category: "Planejamento",
      difficulty: "facil",
      likes: 312,
      isLiked: true,
      author: "Maria Santos",
      publishedAt: "2024-01-15",
      tags: ["emergência", "segurança", "planejamento"],
    },
    {
      id: "tip4",
      title: "Juros Compostos",
      content:
        'Einstein chamou os juros compostos de "oitava maravilha do mundo". Comece a investir cedo para aproveitar o poder do tempo.',
      category: "Investimentos",
      difficulty: "medio",
      likes: 156,
      isLiked: false,
      author: "Roberto Lima",
      publishedAt: "2024-01-12",
      tags: ["juros compostos", "tempo", "investimentos"],
    },
    {
      id: "tip5",
      title: "Controle de Gastos",
      content:
        "Use a técnica dos 24 horas: antes de fazer uma compra não planejada, espere 24 horas. Isso evita compras por impulso.",
      category: "Orçamento",
      difficulty: "facil",
      likes: 278,
      isLiked: true,
      author: "João Oliveira",
      publishedAt: "2024-01-10",
      tags: ["controle", "gastos", "disciplina"],
    },
  ];

  const categories = [
    "all",
    "Orçamento",
    "Investimentos",
    "Planejamento",
    "Família",
    "Empreendedorismo",
  ];

  const filteredCourses =
    selectedCategory === "all"
      ? courses
      : courses.filter((course) => course.category === selectedCategory);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "iniciante":
        return "bg-green-100 text-green-800";
      case "intermediario":
        return "bg-yellow-100 text-yellow-800";
      case "avancado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "comum":
        return "border-gray-300 bg-gray-50";
      case "raro":
        return "border-blue-300 bg-blue-50";
      case "epico":
        return "border-purple-300 bg-purple-50";
      case "lendario":
        return "border-yellow-300 bg-yellow-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "facil":
        return "text-green-600";
      case "medio":
        return "text-yellow-600";
      case "dificil":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const handleLikeTip = (tipId: string) => {
    // Simulate like functionality
    console.log(`Liked tip: ${tipId}`);
  };

  const handleShareTip = (tipId: string) => {
    // Simulate share functionality
    console.log(`Shared tip: ${tipId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header with User Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Centro de Educação Financeira
            </h1>
            <p className="text-blue-100">
              Desenvolva suas habilidades financeiras com cursos, dicas e
              gamificação
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{userStats.totalPoints}</div>
              <div className="text-sm text-blue-100">Pontos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Nível {userStats.level}</div>
              <div className="text-sm text-blue-100">{userStats.rank}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{userStats.streak}</div>
              <div className="text-sm text-blue-100">Dias seguidos</div>
            </div>
          </div>
        </div>

        {/* Progress to next level */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso para o próximo nível</span>
            <span>{userStats.nextLevelPoints} pontos restantes</span>
          </div>
          <Progress
            value={(userStats.totalPoints % 1000) / 10}
            className="h-2 bg-blue-500"
          />
        </div>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="tips">Dicas</TabsTrigger>
          <TabsTrigger value="community">Comunidade</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === "all" ? "Todos" : category}
              </Button>
            ))}
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="relative overflow-hidden">
                {course.isLocked && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-gray-500">
                      <Lock className="h-3 w-3 mr-1" />
                      Bloqueado
                    </Badge>
                  </div>
                )}
                <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-white" />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <Badge className={getLevelColor(course.level)}>
                      {course.level}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.students}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {course.rating}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Trophy className="h-4 w-4" />
                        {course.points} pontos
                      </div>
                    </div>

                    {course.progress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    )}

                    <Button
                      className="w-full"
                      disabled={course.isLocked}
                      variant={course.progress > 0 ? "outline" : "default"}
                    >
                      {course.isLocked ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Bloqueado
                        </>
                      ) : course.progress > 0 ? (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Continuar
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Curso
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`${getRarityColor(achievement.rarity)} ${!achievement.unlocked ? "opacity-60" : ""}`}
              >
                <CardHeader className="text-center">
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={`capitalize ${getRarityColor(achievement.rarity)}`}
                    >
                      {achievement.rarity}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Trophy className="h-4 w-4" />
                      {achievement.points} pontos
                    </div>
                  </div>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="mt-3 text-xs text-gray-500">
                      Desbloqueado em{" "}
                      {new Date(achievement.unlockedAt).toLocaleDateString(
                        "pt-BR",
                      )}
                    </div>
                  )}
                  {achievement.unlocked ? (
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mt-2" />
                  ) : (
                    <Lock className="h-6 w-6 text-gray-400 mx-auto mt-2" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          <div className="space-y-4">
            {tips.map((tip) => (
              <Card key={tip.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {tip.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <Badge variant="outline">{tip.category}</Badge>
                        <span
                          className={`flex items-center gap-1 ${getDifficultyColor(tip.difficulty)}`}
                        >
                          <Target className="h-4 w-4" />
                          {tip.difficulty}
                        </span>
                        <span>por {tip.author}</span>
                        <span>
                          {new Date(tip.publishedAt).toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{tip.content}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {tip.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLikeTip(tip.id)}
                        className={tip.isLiked ? "text-red-600" : ""}
                      >
                        <ThumbsUp
                          className={`h-4 w-4 mr-1 ${tip.isLiked ? "fill-current" : ""}`}
                        />
                        {tip.likes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareTip(tip.id)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Compartilhar
                      </Button>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Ranking da Comunidade
                </CardTitle>
                <CardDescription>Top usuários da semana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Ana Silva", points: 3250, position: 1 },
                    { name: "Carlos Mendes", points: 2890, position: 2 },
                    { name: "Você", points: 2450, position: 3 },
                    { name: "Maria Santos", points: 2100, position: 4 },
                    { name: "João Oliveira", points: 1950, position: 5 },
                  ].map((user) => (
                    <div
                      key={user.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            user.position === 1
                              ? "bg-yellow-400 text-yellow-900"
                              : user.position === 2
                                ? "bg-gray-300 text-gray-700"
                                : user.position === 3
                                  ? "bg-orange-400 text-orange-900"
                                  : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {user.position}
                        </div>
                        <div>
                          <div
                            className={`font-medium ${user.name === "Você" ? "text-blue-600" : ""}`}
                          >
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {user.points} pontos
                          </div>
                        </div>
                      </div>
                      {user.position <= 3 && (
                        <Trophy
                          className={`h-5 w-5 ${
                            user.position === 1
                              ? "text-yellow-500"
                              : user.position === 2
                                ? "text-gray-400"
                                : "text-orange-500"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
                <CardDescription>
                  O que está acontecendo na comunidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      user: "Ana Silva",
                      action: "completou o curso",
                      target: "Investimentos para Iniciantes",
                      time: "2h atrás",
                    },
                    {
                      user: "Carlos Mendes",
                      action: "desbloqueou a conquista",
                      target: "Mestre dos Investimentos",
                      time: "4h atrás",
                    },
                    {
                      user: "Maria Santos",
                      action: "compartilhou a dica",
                      target: "Regra dos 50-30-20",
                      time: "6h atrás",
                    },
                    {
                      user: "João Oliveira",
                      action: "iniciou o curso",
                      target: "Planejamento de Aposentadoria",
                      time: "8h atrás",
                    },
                    {
                      user: "Patricia Costa",
                      action: "alcançou o nível",
                      target: "10",
                      time: "1 dia atrás",
                    },
                  ].map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {activity.user
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium">{activity.user}</span>{" "}
                          {activity.action}{" "}
                          <span className="font-medium">{activity.target}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialEducationHub;
