import React from "react";

/**
 * Bundle Optimizer
 * Configurações avançadas para otimização de bundle e redução de memória
 */

// Configuração de imports otimizados
export const OPTIMIZED_IMPORTS = {
  // Lucide React - importa apenas ícones específicos
  "lucide-react": [
    "Home",
    "Settings",
    "User",
    "Bell",
    "Search",
    "Menu",
    "X",
    "ChevronDown",
    "ChevronUp",
    "ChevronLeft",
    "ChevronRight",
    "Plus",
    "Minus",
    "Edit",
    "Trash2",
    "Save",
    "Download",
    "Upload",
    "Eye",
    "EyeOff",
    "Lock",
    "Unlock",
    "Check",
    "AlertCircle",
    "Info",
    "HelpCircle",
    "Calendar",
    "Clock",
    "DollarSign",
    "TrendingUp",
    "TrendingDown",
    "BarChart3",
    "PieChart",
    "Activity",
    "Target",
    "CreditCard",
    "Wallet",
    "Building2",
    "Car",
    "Home as HomeIcon",
    "Plane",
    "ShoppingCart",
    "Coffee",
    "Fuel",
    "Utensils",
    "Film",
    "Gamepad2",
    "RefreshCw",
    "Database",
    "Image",
    "Cpu",
  ],

  // Radix UI - importa apenas componentes utilizados
  "@radix-ui/react-dialog": [
    "Dialog",
    "DialogContent",
    "DialogHeader",
    "DialogTitle",
    "DialogTrigger",
  ],
  "@radix-ui/react-select": [
    "Select",
    "SelectContent",
    "SelectItem",
    "SelectTrigger",
    "SelectValue",
  ],
  "@radix-ui/react-switch": ["Switch"],
  "@radix-ui/react-tabs": ["Tabs", "TabsContent", "TabsList", "TabsTrigger"],
  "@radix-ui/react-radio-group": ["RadioGroup", "RadioGroupItem"],
  "@radix-ui/react-checkbox": ["Checkbox"],
  "@radix-ui/react-slider": ["Slider"],
  "@radix-ui/react-progress": ["Progress"],
  "@radix-ui/react-toast": ["Toast", "ToastProvider", "ToastViewport"],

  // Recharts - importa apenas componentes de gráfico utilizados
  recharts: [
    "LineChart",
    "BarChart",
    "PieChart",
    "AreaChart",
    "XAxis",
    "YAxis",
    "CartesianGrid",
    "Tooltip",
    "Legend",
    "ResponsiveContainer",
    "Line",
    "Bar",
    "Area",
    "Pie",
    "Cell",
  ],

  // Date-fns - importa apenas funções utilizadas
  "date-fns": [
    "format",
    "parseISO",
    "startOfMonth",
    "endOfMonth",
    "startOfYear",
    "endOfYear",
    "subMonths",
    "addMonths",
    "subYears",
    "addYears",
    "isAfter",
    "isBefore",
    "isEqual",
    "differenceInDays",
    "differenceInMonths",
  ],

  // React Hook Form
  "react-hook-form": [
    "useForm",
    "Controller",
    "FormProvider",
    "useFormContext",
  ],

  // Zod
  zod: ["z"],
};

// Configuração de chunks otimizados
export const CHUNK_OPTIMIZATION = {
  // Chunks principais
  framework: {
    test: /[\/]node_modules[\/](react|react-dom)[\/]/,
    name: "framework",
    priority: 40,
    chunks: "all" as const,
    maxSize: 100000,
    enforce: true,
  },

  // UI Components
  ui: {
    test: /[\/]node_modules[\/](@radix-ui|lucide-react|sonner)[\/]/,
    name: "ui",
    priority: 30,
    chunks: "all" as const,
    maxSize: 80000,
  },

  // Charts e visualizações
  charts: {
    test: /[\/]node_modules[\/](recharts|d3)[\/]/,
    name: "charts",
    priority: 25,
    chunks: "all" as const,
    maxSize: 120000,
  },

  // Forms e validação
  forms: {
    test: /[\/]node_modules[\/](react-hook-form|@hookform|zod)[\/]/,
    name: "forms",
    priority: 20,
    chunks: "all" as const,
    maxSize: 60000,
  },

  // Utilitários
  utils: {
    test: /[\/]node_modules[\/](date-fns|lodash|clsx|class-variance-authority|tailwind-merge)[\/]/,
    name: "utils",
    priority: 15,
    chunks: "all" as const,
    maxSize: 50000,
  },

  // Vendors gerais
  vendor: {
    test: /[\/]node_modules[\/]/,
    name: "vendors",
    priority: 10,
    chunks: "all" as const,
    maxSize: 150000,
  },

  // Código comum da aplicação
  common: {
    name: "common",
    minChunks: 2,
    chunks: "all" as const,
    enforce: true,
    priority: 5,
    maxSize: 80000,
  },
};

// Configuração de tree shaking
export const TREE_SHAKING_CONFIG = {
  // Pacotes que são seguros para tree shaking
  sideEffectsFree: [
    "lodash",
    "date-fns",
    "clsx",
    "class-variance-authority",
    "tailwind-merge",
    "zod",
  ],

  // Pacotes que têm side effects
  sideEffects: [
    "*.css",
    "*.scss",
    "*.sass",
    "*.less",
    "polyfills.ts",
    "globals.css",
  ],
};

// Configuração de preload de recursos críticos
export const PRELOAD_CONFIG = {
  // Componentes críticos para preload
  critical: [
    "components/layout/sidebar",
    "components/layout/header",
    "components/ui/card",
    "components/ui/button",
    "components/ui/input",
  ],

  // Componentes para lazy loading
  lazy: [
    "components/dashboards",
    "components/features",
    "components/modals",
    "app/analytics",
    "app/reports",
    "app/investments",
  ],
};

// Configuração de compressão
export const COMPRESSION_CONFIG = {
  // Algoritmos de compressão por tipo de arquivo
  algorithms: {
    js: "gzip",
    css: "gzip",
    html: "gzip",
    json: "brotli",
    svg: "gzip",
  },

  // Níveis de compressão
  levels: {
    development: 1,
    production: 9,
  },
};

// Utilitários para análise de bundle
export class BundleAnalyzer {
  static analyzeChunkSizes(stats: any) {
    const chunks = stats.compilation.chunks;
    const analysis = {
      totalSize: 0,
      chunkCount: chunks.length,
      largestChunks: [] as Array<{ name: string; size: number }>,
      duplicateModules: [] as string[],
    };

    chunks.forEach((chunk: any) => {
      const size = chunk.size || 0;
      analysis.totalSize += size;

      if (size > 100000) {
        // Chunks maiores que 100KB
        analysis.largestChunks.push({
          name: chunk.name || "unnamed",
          size,
        });
      }
    });

    // Ordena chunks por tamanho
    analysis.largestChunks.sort((a, b) => b.size - a.size);

    return analysis;
  }

  static generateOptimizationReport(
    analysis: ReturnType<typeof BundleAnalyzer.analyzeChunkSizes>,
  ) {
    const recommendations = [];

    if (analysis.totalSize > 2000000) {
      // 2MB
      recommendations.push(
        "Bundle total muito grande. Considere lazy loading adicional.",
      );
    }

    if (analysis.largestChunks.length > 5) {
      recommendations.push(
        "Muitos chunks grandes. Revise a estratégia de splitting.",
      );
    }

    if (analysis.duplicateModules.length > 0) {
      recommendations.push(
        `${analysis.duplicateModules.length} módulos duplicados encontrados.`,
      );
    }

    return {
      ...analysis,
      recommendations,
      score: this.calculateOptimizationScore(analysis),
    };
  }

  private static calculateOptimizationScore(
    analysis: ReturnType<typeof BundleAnalyzer.analyzeChunkSizes>,
  ): number {
    let score = 100;

    // Penaliza tamanho total
    if (analysis.totalSize > 2000000) score -= 20;
    else if (analysis.totalSize > 1000000) score -= 10;

    // Penaliza chunks grandes
    score -= Math.min(analysis.largestChunks.length * 5, 30);

    // Penaliza duplicações
    score -= Math.min(analysis.duplicateModules.length * 2, 20);

    return Math.max(score, 0);
  }
}

// Hook para monitoramento de performance do bundle
export function useBundlePerformance() {
  const [metrics, setMetrics] = React.useState({
    loadTime: 0,
    chunkCount: 0,
    totalSize: 0,
    cacheHitRate: 0,
  });

  React.useEffect(() => {
    if (typeof window !== "undefined" && "performance" in window) {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      setMetrics((prev) => ({
        ...prev,
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      }));
    }
  }, []);

  return metrics;
}

const BundleOptimizer = {
  OPTIMIZED_IMPORTS,
  CHUNK_OPTIMIZATION,
  TREE_SHAKING_CONFIG,
  PRELOAD_CONFIG,
  COMPRESSION_CONFIG,
  BundleAnalyzer,
  useBundlePerformance,
};

export default BundleOptimizer;
