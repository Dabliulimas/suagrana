"use client";

import { storage, type Transaction } from "./storage";

import { logComponents } from "./logger";
// Interface para sugestões inteligentes
export interface SmartSuggestion {
  category?: string;
  tags: string[];
  confidence: number;
  reason: string;
  autoNote?: string;
}

// Interface para padrões de transação
interface TransactionPattern {
  keywords: string[];
  category: string;
  tags: string[];
  frequency: number;
  lastUsed: string;
}

// Classe principal para sugestões inteligentes
export class SmartSuggestionsEngine {
  private patterns: TransactionPattern[] = [];
  private minConfidence = 0.6;
  private maxSuggestions = 5;

  constructor() {
    this.loadPatterns();
  }

  // Carrega padrões existentes do localStorage
  private loadPatterns(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("smart-patterns");
      if (stored) {
        this.patterns = JSON.parse(stored);
      }
    } catch (error) {
      logComponents.error("Erro ao carregar padrões:", error);
      this.patterns = [];
    }
  }

  // Salva padrões no localStorage
  private savePatterns(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("smart-patterns", JSON.stringify(this.patterns));
    } catch (error) {
      logComponents.error("Erro ao salvar padrões:", error);
    }
  }

  // Analisa transações históricas para criar padrões
  public analyzeHistoricalData(): void {
    const transactions = storage.getTransactions();
    const patternMap = new Map<string, TransactionPattern>();

    transactions.forEach((transaction) => {
      if (!transaction.description || !transaction.category) return;

      const keywords = this.extractKeywords(transaction.description);
      const key = `${transaction.category}-${keywords.join("-")}`;

      if (patternMap.has(key)) {
        const pattern = patternMap.get(key)!;
        pattern.frequency++;
        pattern.lastUsed = transaction.date;

        // Merge tags
        if (transaction.tags) {
          transaction.tags.forEach((tag) => {
            if (!pattern.tags.includes(tag)) {
              pattern.tags.push(tag);
            }
          });
        }
      } else {
        patternMap.set(key, {
          keywords,
          category: transaction.category,
          tags: transaction.tags || [],
          frequency: 1,
          lastUsed: transaction.date,
        });
      }
    });

    // Converte Map para Array e filtra padrões com frequência mínima
    this.patterns = Array.from(patternMap.values())
      .filter((pattern) => pattern.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 100); // Mantém apenas os 100 padrões mais frequentes

    this.savePatterns();
  }

  // Extrai palavras-chave relevantes da descrição
  private extractKeywords(description: string): string[] {
    const stopWords = [
      "de",
      "da",
      "do",
      "das",
      "dos",
      "em",
      "no",
      "na",
      "nos",
      "nas",
      "para",
      "por",
      "com",
      "sem",
      "sob",
      "sobre",
      "entre",
      "até",
      "a",
      "o",
      "as",
      "os",
      "um",
      "uma",
      "uns",
      "umas",
      "e",
      "ou",
      "mas",
      "que",
      "se",
      "quando",
      "onde",
      "como",
      "porque",
    ];

    return description
      .toLowerCase()
      .replace(/[^a-záàâãéèêíìîóòôõúùûç\s]/g, "") // Remove caracteres especiais
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5); // Máximo 5 palavras-chave
  }

  // Calcula similaridade entre duas listas de palavras-chave
  private calculateSimilarity(
    keywords1: string[],
    keywords2: string[],
  ): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const intersection = keywords1.filter((word) => keywords2.includes(word));
    const union = [...new Set([...keywords1, ...keywords2])];

    return intersection.length / union.length;
  }

  // Extrai valor monetário da descrição
  private extractAmountFromDescription(description: string): number | null {
    const amountRegex =
      /(?:r\$|rs|reais?)\s*(\d+(?:[.,]\d{2})?)|\b(\d+(?:[.,]\d{2})?)\s*(?:r\$|rs|reais?)/gi;
    const match = description.match(amountRegex);
    if (match) {
      const numStr = match[0].replace(/[^\d.,]/g, "").replace(",", ".");
      return parseFloat(numStr);
    }
    return null;
  }

  // Obtém contexto temporal para sugestões mais inteligentes
  private getTimeContext(): {
    period: string;
    isWeekend: boolean;
    isHoliday: boolean;
  } {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let period = "noite";
    if (hour >= 6 && hour < 12) period = "manhã";
    else if (hour >= 12 && hour < 18) period = "tarde";

    // Verificação básica de feriados (pode ser expandida)
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const isHoliday =
      (month === 12 && day === 25) ||
      (month === 1 && day === 1) ||
      (month === 9 && day === 7);

    return { period, isWeekend, isHoliday };
  }

  // Gera sugestões baseadas na descrição
  public getSuggestions(description: string): SmartSuggestion[] {
    if (!description || description.length < 3) {
      return [];
    }

    const inputKeywords = this.extractKeywords(description);
    const suggestions: SmartSuggestion[] = [];

    // Analisa padrões existentes (histórico do usuário)
    this.patterns.forEach((pattern) => {
      const similarity = this.calculateSimilarity(
        inputKeywords,
        pattern.keywords,
      );

      if (similarity >= this.minConfidence) {
        // Boost confidence for user patterns with recency factor
        const daysSinceLastUsed = Math.floor(
          (Date.now() - new Date(pattern.lastUsed).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const recencyBoost = Math.max(0.1, 1 - daysSinceLastUsed / 365); // Decay over a year
        const frequencyBoost = Math.min(0.3, pattern.frequency * 0.05); // Cap frequency boost
        const confidence = Math.min(
          similarity * (1 + frequencyBoost + recencyBoost),
          1,
        );

        suggestions.push({
          category: pattern.category,
          tags: pattern.tags,
          confidence: confidence + 0.2, // Boost user patterns over heuristics
          reason: `Baseado em ${pattern.frequency} transações similares (última: ${new Date(pattern.lastUsed).toLocaleDateString("pt-BR")})`,
          autoNote: this.generateAutoNote(
            description,
            pattern.category,
            pattern.tags,
          ),
        });
      }
    });

    // Sugestões baseadas em regras heurísticas (apenas se não há padrões suficientes do usuário)
    const userSuggestions = suggestions.filter((s) => s.confidence > 0.7);
    if (userSuggestions.length < 2) {
      const heuristicSuggestions = this.getHeuristicSuggestions(
        description,
        inputKeywords,
      );
      heuristicSuggestions.forEach((suggestion) => {
        suggestion.autoNote = this.generateAutoNote(
          description,
          suggestion.category,
          suggestion.tags,
        );
        // Lower confidence for heuristic suggestions when user has patterns
        if (userSuggestions.length > 0) {
          suggestion.confidence *= 0.8;
        }
      });
      suggestions.push(...heuristicSuggestions);
    }

    // Ordena por confiança e remove duplicatas, priorizando padrões do usuário
    return suggestions
      .sort((a, b) => {
        // First sort by confidence, then by whether it's a user pattern
        const aIsUserPattern = this.patterns.some(
          (p) => p.category === a.category,
        );
        const bIsUserPattern = this.patterns.some(
          (p) => p.category === b.category,
        );

        if (aIsUserPattern && !bIsUserPattern) return -1;
        if (!aIsUserPattern && bIsUserPattern) return 1;

        return b.confidence - a.confidence;
      })
      .slice(0, this.maxSuggestions)
      .filter(
        (suggestion, index, array) =>
          index === array.findIndex((s) => s.category === suggestion.category),
      );
  }

  // Sugestões baseadas em regras heurísticas aprimoradas
  private getHeuristicSuggestions(
    description: string,
    keywords: string[],
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const desc = description.toLowerCase();
    const amount = this.extractAmountFromDescription(desc);
    const timeContext = this.getTimeContext();

    // === ALIMENTAÇÃO ===
    // Restaurantes e estabelecimentos específicos
    if (
      keywords.some((k) =>
        [
          "restaurante",
          "lanchonete",
          "pizzaria",
          "hamburgueria",
          "sorveteria",
          "cafeteria",
          "padaria",
          "açaí",
          "sushi",
          "churrascaria",
        ].includes(k),
      ) ||
      desc.includes("restaurante") ||
      desc.includes("lanchonete") ||
      desc.includes("pizzaria") ||
      desc.includes("hamburgueria") ||
      desc.includes("ifood") ||
      desc.includes("uber eats") ||
      desc.includes("rappi") ||
      desc.includes("delivery")
    ) {
      suggestions.push({
        category: "Restaurante",
        tags: ["refeição", "alimentação", "estabelecimento"],
        confidence: 0.95,
        reason: "Detectado estabelecimento de alimentação específico",
      });
    }

    // Regras para alimentação - Lanches específicos
    if (
      keywords.some((k) =>
        [
          "cachorro",
          "quente",
          "xis",
          "hamburguer",
          "hambúrguer",
          "lanche",
          "sanduiche",
          "sanduíche",
          "hot",
          "dog",
        ].includes(k),
      ) ||
      desc.includes("cachorro quente") ||
      desc.includes("xis") ||
      desc.includes("hambúrguer") ||
      desc.includes("lanche")
    ) {
      suggestions.push({
        category: "Lanche",
        tags: ["lanche", "fast-food", "alimentação"],
        confidence: 0.9,
        reason: "Detectado tipo específico de lanche",
      });
    }

    // Regras para alimentação - Supermercado e compras - CATEGORIA ESPECÍFICA
    if (
      keywords.some((k) =>
        [
          "supermercado",
          "mercado",
          "compras",
          "feira",
          "hortifruti",
          "açougue",
          "carrefour",
          "extra",
          "pão",
          "açucar",
          "atacadão",
          "walmart",
          "big",
        ].includes(k),
      ) ||
      desc.includes("supermercado") ||
      desc.includes("mercado") ||
      desc.includes("feira") ||
      desc.includes("hortifruti") ||
      desc.includes("carrefour") ||
      desc.includes("extra") ||
      desc.includes("atacadão") ||
      desc.includes("walmart")
    ) {
      suggestions.push({
        category: "Supermercado", // CATEGORIA ESPECÍFICA PARA SUPERMERCADO
        tags: ["supermercado", "compras", "mantimentos", "alimentação"],
        confidence: 0.95,
        reason: "Detectado compra específica em supermercado/mercado",
      });
    }

    // Regras para alimentação - Ingredientes específicos
    if (
      keywords.some((k) =>
        [
          "feijao",
          "feijão",
          "arroz",
          "macarrao",
          "macarrão",
          "carne",
          "frango",
          "peixe",
          "verdura",
          "legume",
          "fruta",
        ].includes(k),
      ) ||
      desc.includes("feijão") ||
      desc.includes("feijao") ||
      desc.includes("arroz") ||
      desc.includes("carne") ||
      desc.includes("frango")
    ) {
      suggestions.push({
        category: "Alimentação",
        tags: ["ingredientes", "cozinha", "mantimentos"],
        confidence: 0.9,
        reason: "Detectado compra de ingredientes alimentares",
      });
    }

    // Regras para alimentação - Refeições
    if (
      keywords.some((k) =>
        [
          "almoço",
          "almoco",
          "jantar",
          "cafe",
          "café",
          "lanche",
          "breakfast",
          "brunch",
        ].includes(k),
      ) ||
      desc.includes("almoço") ||
      desc.includes("almoco") ||
      desc.includes("jantar") ||
      desc.includes("café") ||
      desc.includes("lanche")
    ) {
      suggestions.push({
        category: "Alimentação",
        tags: ["refeição", "alimentação", "fora de casa"],
        confidence: 0.9,
        reason: "Detectado gasto com refeição",
      });
    }

    // Regras para alimentação - Restaurantes e delivery
    if (
      keywords.some((k) =>
        [
          "restaurante",
          "lanchonete",
          "pizzaria",
          "hamburgueria",
          "sorveteria",
          "cafeteria",
          "bar",
        ].includes(k),
      ) ||
      desc.includes("restaurante") ||
      desc.includes("ifood") ||
      desc.includes("uber eats") ||
      desc.includes("rappi") ||
      desc.includes("pizza")
    ) {
      suggestions.push({
        category: "Alimentação",
        tags: ["restaurante", "delivery", "fora de casa"],
        confidence: 0.85,
        reason: "Detectado padrão de alimentação fora de casa",
      });
    }

    // === TRANSPORTE ===
    // Combustível e posto - CATEGORIA ESPECÍFICA
    if (
      keywords.some((k) =>
        [
          "combustivel",
          "combustível",
          "gasolina",
          "alcool",
          "álcool",
          "etanol",
          "diesel",
          "posto",
          "shell",
          "petrobras",
          "ipiranga",
          "br",
        ].includes(k),
      ) ||
      desc.includes("posto") ||
      desc.includes("gasolina") ||
      desc.includes("álcool") ||
      desc.includes("combustível") ||
      desc.includes("abastecimento")
    ) {
      const tags = ["combustível", "veículo"];
      if (amount && amount > 200) tags.push("tanque-cheio");
      suggestions.push({
        category: "Combustível", // CATEGORIA ESPECÍFICA PARA COMBUSTÍVEL
        tags: ["combustível", "posto", "carro"],
        confidence: 0.95,
        reason: "Detectado gasto específico com combustível",
      });
    }

    // Regras para transporte - Carro e manutenção
    if (
      keywords.some((k) =>
        [
          "carro",
          "veiculo",
          "veículo",
          "auto",
          "mecanico",
          "mecânico",
          "oficina",
          "pneu",
          "oleo",
          "óleo",
          "revisao",
          "revisão",
        ].includes(k),
      ) ||
      desc.includes("carro") ||
      desc.includes("veículo") ||
      desc.includes("mecânico") ||
      desc.includes("oficina") ||
      desc.includes("pneu")
    ) {
      suggestions.push({
        category: "Transporte",
        tags: ["carro", "manutenção", "veículo"],
        confidence: 0.9,
        reason: "Detectado gasto com carro ou manutenção",
      });
    }

    // Regras para transporte - Apps e táxi
    if (
      keywords.some((k) =>
        [
          "uber",
          "taxi",
          "99",
          "cabify",
          "onibus",
          "ônibus",
          "metro",
          "metrô",
          "trem",
        ].includes(k),
      ) ||
      desc.includes("uber") ||
      desc.includes("taxi") ||
      desc.includes("99") ||
      desc.includes("ônibus") ||
      desc.includes("metrô")
    ) {
      suggestions.push({
        category: "Transporte",
        tags: ["locomoção", "transporte público", "app"],
        confidence: 0.85,
        reason: "Detectado gasto com transporte",
      });
    }

    // Regras para transporte - Estacionamento e pedágio
    if (
      keywords.some((k) =>
        [
          "estacionamento",
          "pedagio",
          "pedágio",
          "zona azul",
          "vaga",
          "parking",
        ].includes(k),
      ) ||
      desc.includes("estacionamento") ||
      desc.includes("pedágio") ||
      desc.includes("zona azul")
    ) {
      suggestions.push({
        category: "Transporte",
        tags: ["estacionamento", "pedágio", "carro"],
        confidence: 0.85,
        reason: "Detectado gasto com estacionamento ou pedágio",
      });
    }

    // Regras para moradia - Contas básicas
    if (
      keywords.some((k) =>
        [
          "aluguel",
          "condominio",
          "condomínio",
          "energia",
          "luz",
          "agua",
          "água",
          "internet",
          "wifi",
          "gas",
          "gás",
        ].includes(k),
      ) ||
      desc.includes("aluguel") ||
      desc.includes("luz") ||
      desc.includes("água") ||
      desc.includes("internet") ||
      desc.includes("condomínio")
    ) {
      suggestions.push({
        category: "Moradia",
        tags: ["casa", "contas", "utilidades"],
        confidence: 0.9,
        reason: "Detectado gasto com contas da casa",
      });
    }

    // Regras para moradia - Manutenção e melhorias
    if (
      keywords.some((k) =>
        [
          "reforma",
          "pintura",
          "eletricista",
          "encanador",
          "marceneiro",
          "limpeza",
          "faxina",
          "jardinagem",
        ].includes(k),
      ) ||
      desc.includes("reforma") ||
      desc.includes("pintura") ||
      desc.includes("eletricista") ||
      desc.includes("encanador") ||
      desc.includes("limpeza")
    ) {
      suggestions.push({
        category: "Moradia",
        tags: ["manutenção", "reforma", "serviços"],
        confidence: 0.85,
        reason: "Detectado gasto com manutenção da casa",
      });
    }

    // Regras para saúde - Consultas e exames
    if (
      keywords.some((k) =>
        [
          "medico",
          "médico",
          "hospital",
          "consulta",
          "exame",
          "laboratorio",
          "laboratório",
          "clinica",
          "clínica",
        ].includes(k),
      ) ||
      desc.includes("médico") ||
      desc.includes("hospital") ||
      desc.includes("consulta") ||
      desc.includes("exame") ||
      desc.includes("clínica")
    ) {
      suggestions.push({
        category: "Saúde",
        tags: ["consulta", "médico", "exame"],
        confidence: 0.9,
        reason: "Detectado gasto com consultas médicas",
      });
    }

    // Regras para saúde - Farmácia e medicamentos
    if (
      keywords.some((k) =>
        [
          "farmacia",
          "farmácia",
          "medicamento",
          "remedio",
          "remédio",
          "vitamina",
          "suplemento",
          "drogaria",
        ].includes(k),
      ) ||
      desc.includes("farmácia") ||
      desc.includes("medicamento") ||
      desc.includes("remédio") ||
      desc.includes("drogaria")
    ) {
      suggestions.push({
        category: "Saúde",
        tags: ["medicamento", "farmácia", "saúde"],
        confidence: 0.9,
        reason: "Detectado gasto com medicamentos",
      });
    }

    // Regras para educação
    if (
      keywords.some((k) =>
        [
          "escola",
          "faculdade",
          "universidade",
          "curso",
          "livro",
          "material",
          "mensalidade",
          "matricula",
          "matrícula",
        ].includes(k),
      ) ||
      desc.includes("escola") ||
      desc.includes("curso") ||
      desc.includes("livro") ||
      desc.includes("mensalidade") ||
      desc.includes("faculdade")
    ) {
      suggestions.push({
        category: "Educação",
        tags: ["estudo", "curso", "material"],
        confidence: 0.9,
        reason: "Detectado gasto com educação",
      });
    }

    // === COMPRAS ===
    // Roupas e acessórios
    if (
      keywords.some((k) =>
        [
          "roupa",
          "camisa",
          "calca",
          "calça",
          "sapato",
          "tenis",
          "tênis",
          "bolsa",
          "acessorio",
          "acessório",
          "loja",
          "shopping",
          "moda",
        ].includes(k),
      ) ||
      desc.includes("roupa") ||
      desc.includes("camisa") ||
      desc.includes("sapato") ||
      desc.includes("tênis") ||
      desc.includes("loja")
    ) {
      suggestions.push({
        category: "Compras",
        tags: ["roupa", "vestuário", "acessórios"],
        confidence: 0.85,
        reason: "Detectado gasto com roupas e acessórios",
      });
    }

    // Regras para lazer - Streaming e entretenimento digital
    if (
      keywords.some((k) =>
        [
          "netflix",
          "spotify",
          "amazon",
          "disney",
          "streaming",
          "youtube",
          "apple",
          "music",
          "prime",
        ].includes(k),
      ) ||
      desc.includes("netflix") ||
      desc.includes("spotify") ||
      desc.includes("streaming") ||
      desc.includes("disney") ||
      desc.includes("youtube")
    ) {
      suggestions.push({
        category: "Lazer",
        tags: ["streaming", "entretenimento", "digital"],
        confidence: 0.9,
        reason: "Detectado gasto com streaming e entretenimento digital",
      });
    }

    // Regras para lazer - Atividades e eventos
    if (
      keywords.some((k) =>
        [
          "cinema",
          "teatro",
          "show",
          "evento",
          "festa",
          "bar",
          "balada",
          "viagem",
          "hotel",
          "pousada",
        ].includes(k),
      ) ||
      desc.includes("cinema") ||
      desc.includes("teatro") ||
      desc.includes("show") ||
      desc.includes("evento") ||
      desc.includes("viagem")
    ) {
      suggestions.push({
        category: "Lazer",
        tags: ["entretenimento", "evento", "diversão"],
        confidence: 0.85,
        reason: "Detectado gasto com entretenimento e eventos",
      });
    }

    // Regras para lazer - Esportes e academia
    if (
      keywords.some((k) =>
        [
          "academia",
          "ginasio",
          "ginásio",
          "esporte",
          "futebol",
          "natacao",
          "natação",
          "pilates",
          "yoga",
          "personal",
        ].includes(k),
      ) ||
      desc.includes("academia") ||
      desc.includes("esporte") ||
      desc.includes("futebol") ||
      desc.includes("natação") ||
      desc.includes("pilates")
    ) {
      suggestions.push({
        category: "Lazer",
        tags: ["esporte", "academia", "saúde"],
        confidence: 0.85,
        reason: "Detectado gasto com esportes e atividades físicas",
      });
    }

    // === TECNOLOGIA ===
    if (
      keywords.some((k) =>
        [
          "celular",
          "smartphone",
          "iphone",
          "samsung",
          "notebook",
          "computador",
          "tablet",
          "fone",
          "carregador",
          "cabo",
        ].includes(k),
      ) ||
      desc.includes("celular") ||
      desc.includes("smartphone") ||
      desc.includes("notebook") ||
      desc.includes("computador") ||
      desc.includes("tablet")
    ) {
      suggestions.push({
        category: "Tecnologia",
        tags: ["eletrônicos", "tecnologia", "gadgets"],
        confidence: 0.9,
        reason: "Detectado gasto com tecnologia e eletrônicos",
      });
    }

    // === BELEZA E CUIDADOS PESSOAIS ===
    if (
      keywords.some((k) =>
        [
          "salao",
          "salão",
          "cabelo",
          "manicure",
          "pedicure",
          "barbeiro",
          "estetica",
          "estética",
          "cosmetico",
          "cosmético",
          "perfume",
        ].includes(k),
      ) ||
      desc.includes("salão") ||
      desc.includes("cabelo") ||
      desc.includes("manicure") ||
      desc.includes("barbeiro") ||
      desc.includes("estética")
    ) {
      suggestions.push({
        category: "Beleza",
        tags: ["beleza", "cuidados pessoais", "estética"],
        confidence: 0.85,
        reason: "Detectado gasto com beleza e cuidados pessoais",
      });
    }

    // === PETS ===
    if (
      keywords.some((k) =>
        [
          "pet",
          "cachorro",
          "gato",
          "veterinario",
          "veterinário",
          "racao",
          "ração",
          "petshop",
          "banho",
          "tosa",
        ].includes(k),
      ) ||
      desc.includes("pet") ||
      desc.includes("cachorro") ||
      desc.includes("gato") ||
      desc.includes("veterinário") ||
      desc.includes("ração")
    ) {
      suggestions.push({
        category: "Pets",
        tags: ["animais", "pet", "cuidados"],
        confidence: 0.9,
        reason: "Detectado gasto com pets e animais",
      });
    }

    // === TRABALHO ===
    if (
      keywords.some((k) =>
        [
          "escritorio",
          "escritório",
          "material",
          "papelaria",
          "impressao",
          "impressão",
          "xerox",
          "correios",
          "sedex",
        ].includes(k),
      ) ||
      desc.includes("escritório") ||
      desc.includes("papelaria") ||
      desc.includes("impressão") ||
      desc.includes("correios") ||
      desc.includes("material")
    ) {
      suggestions.push({
        category: "Trabalho",
        tags: ["trabalho", "escritório", "material"],
        confidence: 0.8,
        reason: "Detectado gasto relacionado ao trabalho",
      });
    }

    // === IMPOSTOS E TAXAS ===
    if (
      keywords.some((k) =>
        [
          "imposto",
          "taxa",
          "multa",
          "ipva",
          "iptu",
          "ir",
          "receita",
          "federal",
          "cartorio",
          "cartório",
        ].includes(k),
      ) ||
      desc.includes("imposto") ||
      desc.includes("taxa") ||
      desc.includes("multa") ||
      desc.includes("ipva") ||
      desc.includes("iptu")
    ) {
      suggestions.push({
        category: "Impostos",
        tags: ["impostos", "taxas", "governo"],
        confidence: 0.95,
        reason: "Detectado gasto com impostos e taxas",
      });
    }

    return suggestions;
  }

  // Função para gerar observação automática
  public generateAutoNote(
    description: string,
    category?: string,
    tags: string[] = [],
  ): string {
    const desc = description.toLowerCase();
    const now = new Date();
    const timeOfDay = now.getHours();

    // Observações baseadas na categoria
    if (category) {
      switch (category.toLowerCase()) {
        case "alimentação":
          if (timeOfDay >= 6 && timeOfDay < 12) {
            return `Café da manhã - ${description}`;
          } else if (timeOfDay >= 12 && timeOfDay < 18) {
            return `Almoço - ${description}`;
          } else if (timeOfDay >= 18 && timeOfDay < 24) {
            return `Jantar - ${description}`;
          }
          return `Refeição - ${description}`;

        case "transporte":
          if (
            desc.includes("uber") ||
            desc.includes("99") ||
            desc.includes("taxi")
          ) {
            return `Transporte por aplicativo - ${description}`;
          } else if (
            desc.includes("gasolina") ||
            desc.includes("combustível") ||
            desc.includes("posto")
          ) {
            return `Abastecimento do veículo - ${description}`;
          }
          return `Despesa de transporte - ${description}`;

        case "saúde":
          if (
            desc.includes("farmácia") ||
            desc.includes("remédio") ||
            desc.includes("medicamento")
          ) {
            return `Medicamento - ${description}`;
          } else if (
            desc.includes("consulta") ||
            desc.includes("médico") ||
            desc.includes("dentista")
          ) {
            return `Consulta médica - ${description}`;
          }
          return `Despesa de saúde - ${description}`;

        case "moradia":
          if (desc.includes("luz") || desc.includes("energia")) {
            return `Conta de energia elétrica - ${description}`;
          } else if (desc.includes("água") || desc.includes("saneamento")) {
            return `Conta de água - ${description}`;
          } else if (desc.includes("internet") || desc.includes("wifi")) {
            return `Conta de internet - ${description}`;
          }
          return `Despesa da casa - ${description}`;

        case "lazer":
          if (
            desc.includes("netflix") ||
            desc.includes("spotify") ||
            desc.includes("streaming")
          ) {
            return `Assinatura de streaming - ${description}`;
          } else if (desc.includes("cinema") || desc.includes("filme")) {
            return `Entretenimento - ${description}`;
          } else if (desc.includes("academia") || desc.includes("esporte")) {
            return `Atividade física - ${description}`;
          }
          return `Atividade de lazer - ${description}`;

        case "tecnologia":
          if (desc.includes("celular") || desc.includes("smartphone")) {
            return `Equipamento móvel - ${description}`;
          } else if (desc.includes("notebook") || desc.includes("computador")) {
            return `Equipamento de informática - ${description}`;
          }
          return `Produto tecnológico - ${description}`;

        case "beleza":
          if (desc.includes("salão") || desc.includes("cabelo")) {
            return `Cuidados com cabelo - ${description}`;
          } else if (desc.includes("manicure") || desc.includes("pedicure")) {
            return `Cuidados com unhas - ${description}`;
          }
          return `Cuidados pessoais - ${description}`;

        case "pets":
          if (desc.includes("veterinário") || desc.includes("consulta")) {
            return `Cuidados veterinários - ${description}`;
          } else if (desc.includes("ração") || desc.includes("comida")) {
            return `Alimentação do pet - ${description}`;
          }
          return `Cuidados com pet - ${description}`;

        case "trabalho":
          if (desc.includes("material") || desc.includes("papelaria")) {
            return `Material de escritório - ${description}`;
          } else if (desc.includes("correios") || desc.includes("sedex")) {
            return `Serviços postais - ${description}`;
          }
          return `Despesa profissional - ${description}`;

        case "impostos":
          if (desc.includes("ipva")) {
            return `Imposto sobre veículo - ${description}`;
          } else if (desc.includes("iptu")) {
            return `Imposto predial - ${description}`;
          } else if (desc.includes("multa")) {
            return `Multa ou penalidade - ${description}`;
          }
          return `Obrigação fiscal - ${description}`;
      }
    }

    // Observações baseadas em tags
    if (tags.includes("recorrente")) {
      return `Despesa recorrente - ${description}`;
    }
    if (tags.includes("emergência")) {
      return `Despesa de emergência - ${description}`;
    }
    if (tags.includes("trabalho")) {
      return `Despesa profissional - ${description}`;
    }

    // Observação padrão
    return `Transação registrada em ${now.toLocaleDateString("pt-BR")} - ${description}`;
  }

  // Sistema de reconhecimento de padrões recorrentes
  public detectRecurringPatterns(transactions: any[]): {
    pattern: string;
    frequency: number;
    suggestion: string;
  }[] {
    if (!transactions || !Array.isArray(transactions)) {
      return [];
    }
    const recurringPatterns: Map<
      string,
      { count: number; dates: string[]; amounts: number[] }
    > = new Map();

    transactions.forEach((transaction) => {
      if (!transaction.description || !transaction.date) return;

      const normalizedDesc = transaction.description.toLowerCase().trim();
      const key = normalizedDesc;

      if (recurringPatterns.has(key)) {
        const pattern = recurringPatterns.get(key)!;
        pattern.count++;
        pattern.dates.push(transaction.date);
        if (transaction.amount)
          pattern.amounts.push(Math.abs(transaction.amount));
      } else {
        recurringPatterns.set(key, {
          count: 1,
          dates: [transaction.date],
          amounts: transaction.amount ? [Math.abs(transaction.amount)] : [],
        });
      }
    });

    // Identifica padrões com frequência >= 3 e sugere automação
    return Array.from(recurringPatterns.entries())
      .filter(([_, data]) => data.count >= 3)
      .map(([pattern, data]) => {
        const avgAmount =
          data.amounts.length > 0
            ? data.amounts.reduce((sum, amt) => sum + amt, 0) /
              data.amounts.length
            : 0;

        return {
          pattern,
          frequency: data.count,
          suggestion: `Detectado padrão recorrente: "${pattern}" (${data.count}x). Valor médio: R$ ${avgAmount.toFixed(2)}. Considere criar uma transação recorrente.`,
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  // Aprende com uma nova transação (versão melhorada)
  public learnFromTransaction(transaction: Partial<Transaction>): void {
    if (!transaction.description || !transaction.category) return;

    const keywords = this.extractKeywords(transaction.description);
    if (keywords.length === 0) return;

    // Procura por padrões similares (mesmo categoria e palavras-chave similares)
    const existingPattern = this.patterns.find((p) => {
      if (p.category !== transaction.category) return false;

      const similarity = this.calculateSimilarity(p.keywords, keywords);
      return similarity > 0.5; // Lower threshold for learning
    });

    if (existingPattern) {
      // Atualiza padrão existente
      existingPattern.frequency++;
      existingPattern.lastUsed =
        transaction.date || new Date().toISOString().split("T")[0];

      // Merge keywords (adiciona novas palavras-chave relevantes)
      keywords.forEach((keyword) => {
        if (!existingPattern.keywords.includes(keyword)) {
          existingPattern.keywords.push(keyword);
        }
      });

      // Merge tags
      if (transaction.tags) {
        transaction.tags.forEach((tag) => {
          if (!existingPattern.tags.includes(tag)) {
            existingPattern.tags.push(tag);
          }
        });
      }

      // Limita o número de keywords para evitar padrões muito genéricos
      if (existingPattern.keywords.length > 10) {
        existingPattern.keywords = existingPattern.keywords.slice(0, 10);
      }
    } else {
      // Cria novo padrão
      this.patterns.push({
        keywords,
        category: transaction.category,
        tags: transaction.tags || [],
        frequency: 1,
        lastUsed: transaction.date || new Date().toISOString().split("T")[0],
      });
    }

    // Procura por padrões conflitantes (mesmas palavras-chave, categorias diferentes)
    // e resolve dando prioridade ao mais recente e frequente
    this.resolveConflictingPatterns(keywords, transaction.category);

    // Mantém apenas os padrões mais relevantes
    this.patterns = this.patterns
      .sort((a, b) => {
        // Prioriza por frequência e recência
        const aScore =
          a.frequency +
          new Date(a.lastUsed).getTime() / (1000 * 60 * 60 * 24 * 365);
        const bScore =
          b.frequency +
          new Date(b.lastUsed).getTime() / (1000 * 60 * 60 * 24 * 365);
        return bScore - aScore;
      })
      .slice(0, 150); // Increased limit for better learning

    this.savePatterns();
  }

  // Resolve conflitos entre padrões com palavras-chave similares
  private resolveConflictingPatterns(
    keywords: string[],
    category: string,
  ): void {
    const conflictingPatterns = this.patterns.filter((p) => {
      if (p.category === category) return false;
      return this.calculateSimilarity(p.keywords, keywords) > 0.7;
    });

    conflictingPatterns.forEach((conflictPattern) => {
      const currentPattern = this.patterns.find(
        (p) =>
          p.category === category &&
          this.calculateSimilarity(p.keywords, keywords) > 0.5,
      );

      if (
        currentPattern &&
        currentPattern.frequency >= conflictPattern.frequency
      ) {
        // Remove o padrão conflitante menos frequente
        const index = this.patterns.indexOf(conflictPattern);
        if (index > -1) {
          this.patterns.splice(index, 1);
        }
      }
    });
  }

  // Obtém estatísticas dos padrões
  public getPatternStats(): {
    totalPatterns: number;
    avgFrequency: number;
    topCategories: string[];
  } {
    const totalPatterns = this.patterns.length;
    const avgFrequency =
      this.patterns.reduce((sum, p) => sum + p.frequency, 0) / totalPatterns ||
      0;

    const categoryCount = new Map<string, number>();
    this.patterns.forEach((p) => {
      categoryCount.set(
        p.category,
        (categoryCount.get(p.category) || 0) + p.frequency,
      );
    });

    const topCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);

    return { totalPatterns, avgFrequency, topCategories };
  }

  // Limpa padrões antigos (mais de 6 meses sem uso)
  public cleanOldPatterns(): void {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoffDate = sixMonthsAgo.toISOString().split("T")[0];

    this.patterns = this.patterns.filter(
      (pattern) => pattern.lastUsed >= cutoffDate || pattern.frequency >= 5,
    );

    this.savePatterns();
  }
}

// Instância singleton
export const smartSuggestions = new SmartSuggestionsEngine();

// Inicializa a análise de dados históricos
if (typeof window !== "undefined") {
  // Executa a análise após um pequeno delay para não bloquear a UI
  setTimeout(() => {
    smartSuggestions.analyzeHistoricalData();
  }, 1000);

  // Limpa padrões antigos uma vez por semana
  const lastCleanup = localStorage.getItem("last-pattern-cleanup");
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (!lastCleanup || new Date(lastCleanup) < oneWeekAgo) {
    smartSuggestions.cleanOldPatterns();
    localStorage.setItem("last-pattern-cleanup", new Date().toISOString());
  }
}
