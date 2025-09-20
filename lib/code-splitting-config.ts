// Configurações de code splitting para otimizar o bundle

export const CODE_SPLITTING_CONFIG = {
  // Componentes que devem ser carregados apenas quando necessários
  LAZY_COMPONENTS: [
    "simple-dashboard",
    "optimized-dashboard",
    "simple-analytics",
    "interactive-budget",
    "simple-budget",
    "dividend-modal",
    "contact-manager",
    "shared-expenses",
    "test-unified-integration",
    "test-contact-sync",
    "debug-transaction-test",
  ],

  // Bibliotecas pesadas que devem ser carregadas dinamicamente
  HEAVY_LIBRARIES: [
    "puppeteer",
    "exceljs",
    "jspdf",
    "html2canvas",
    "framer-motion",
    "react-window",
  ],

  // Chunks de vendor que devem ser separados
  VENDOR_CHUNKS: {
    "react-vendor": ["react", "react-dom"],
    "ui-vendor": [
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
    ],
    "chart-vendor": ["recharts"],
    "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
    "date-vendor": ["date-fns"],
    "query-vendor": ["@tanstack/react-query"],
    "animation-vendor": ["framer-motion"],
  },

  // Rotas que devem ter code splitting
  ROUTE_SPLITTING: [
    "/dashboard",
    "/analytics",
    "/budget",
    "/investments",
    "/contacts",
    "/expenses",
  ],

  // Configurações de preload
  PRELOAD_CONFIG: {
    // Componentes críticos que devem ser precarregados
    critical: ["simple-dashboard"],
    // Componentes que devem ser precarregados no hover
    onHover: ["simple-analytics", "interactive-budget"],
    // Componentes que devem ser precarregados no idle
    onIdle: ["contact-manager", "shared-expenses"],
  },
};

// Função para verificar se um componente deve ser lazy
export function shouldBeLazy(componentName: string): boolean {
  return CODE_SPLITTING_CONFIG.LAZY_COMPONENTS.includes(componentName);
}

// Função para verificar se uma biblioteca deve ser carregada dinamicamente
export function shouldBeDynamic(libraryName: string): boolean {
  return CODE_SPLITTING_CONFIG.HEAVY_LIBRARIES.some((lib) =>
    libraryName.includes(lib),
  );
}

// Função para obter configuração de chunk de vendor
export function getVendorChunk(moduleName: string): string | null {
  for (const [chunkName, modules] of Object.entries(
    CODE_SPLITTING_CONFIG.VENDOR_CHUNKS,
  )) {
    if (modules.includes(moduleName)) {
      return chunkName;
    }
  }
  return null;
}

// Configuração de webpack para code splitting
export function getWebpackSplittingConfig() {
  return {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        // Chunk para React
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: "react-vendor",
          chunks: "all",
          priority: 20,
        },

        // Chunk para Radix UI
        radixUI: {
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
          name: "ui-vendor",
          chunks: "all",
          priority: 15,
        },

        // Chunk para bibliotecas de gráficos
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
          name: "chart-vendor",
          chunks: "all",
          priority: 15,
        },

        // Chunk para formulários
        forms: {
          test: /[\\/]node_modules[\\/](react-hook-form|@hookform|zod)[\\/]/,
          name: "form-vendor",
          chunks: "all",
          priority: 15,
        },

        // Chunk para utilitários de data
        dateUtils: {
          test: /[\\/]node_modules[\\/](date-fns)[\\/]/,
          name: "date-vendor",
          chunks: "all",
          priority: 15,
        },

        // Chunk para React Query
        query: {
          test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
          name: "query-vendor",
          chunks: "all",
          priority: 15,
        },

        // Chunk para animações
        animations: {
          test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
          name: "animation-vendor",
          chunks: "all",
          priority: 15,
        },

        // Chunk padrão para outras bibliotecas
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "all",
          priority: 10,
          minChunks: 2,
        },

        // Chunk para código comum da aplicação
        common: {
          name: "common",
          chunks: "all",
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  };
}

// Função para preload de componentes
export function preloadComponent(componentName: string) {
  const { critical, onHover, onIdle } = CODE_SPLITTING_CONFIG.PRELOAD_CONFIG;

  if (critical.includes(componentName)) {
    // Preload imediatamente
    return import(`@/components/${componentName}`);
  }

  if (onHover.includes(componentName)) {
    // Preload no próximo idle
    return new Promise((resolve) => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          resolve(import(`@/components/${componentName}`));
        });
      } else {
        setTimeout(() => {
          resolve(import(`@/components/${componentName}`));
        }, 100);
      }
    });
  }

  return null;
}
