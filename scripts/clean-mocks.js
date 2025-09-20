#!/usr/bin/env node
// Remove/neutralize dados de exemplo (mocks) em componentes de UI e demos
const fs = require("fs");
const path = require("path");

function exists(p) {
  return fs.existsSync(p);
}
function read(p) {
  return fs.readFileSync(p, "utf8");
}
function write(p, c) {
  fs.writeFileSync(p, c);
  console.log("✅ Atualizado:", p);
}
function safe(rel, edit) {
  const p = path.resolve(process.cwd(), rel);
  if (!exists(p)) {
    console.log("⚠️  Arquivo não encontrado:", rel);
    return;
  }
  const before = read(p);
  const after = edit(before);
  if (after && after !== before) {
    write(p, after);
  } else {
    console.log("ℹ️  Sem mudanças:", rel);
  }
}

// 1) components/ML analytics: remover mocks e tentar API (fallback vazio)
safe("components/ml-analytics-dashboard.tsx", (c) => {
  let out = c;
  out = out.replace(
    /\/\/ Simular carregamento de dados de ML[\s\S]*?setIsLoading\(false\)/,
    `
    try {
      const res = await fetch('/api/reports/insights')
      if (res.ok) {
        const data = await res.json()
        setInsights(Array.isArray(data.items) ? data.items : [])
      } else {
        setInsights([])
      }
    } finally {
      setIsLoading(false)
    }
  `,
  );
  return out;
});

// 2) components/features/investments/notification-center.tsx: remover mockAlerts e usar API (fallback vazio)
safe("components/features/investments/notification-center.tsx", (c) => {
  let out = c;
  out = out.replace(
    /\n\s*\/\/ Mock data for demonstration[\s\S]*?mockAlerts:[\s\S]*?\]\)/,
    `
  const mockAlerts: InvestmentAlert[] = useMemo(() => [], [])
  `,
  );
  out = out.replace(/mockAlerts/g, "alerts");
  out = out.replace(
    /const\s+activeAlerts\s*=\s*alerts\.filter/g,
    `const activeAlerts = alerts.filter`,
  );
  out = out.replace(
    /const\s+triggeredAlerts\s*=\s*alerts\.filter/g,
    `const triggeredAlerts = alerts.filter`,
  );
  out = out.replace(/\{alerts\.length\}/g, "{alerts.length}");
  // Injetar efeito simples para buscar via API
  if (
    !out.includes("useEffect(() => {") ||
    !out.includes("/api/investments/alerts")
  ) {
    out = out.replace(
      /(export\s+function\s+NotificationCenter\([^)]*\)\s*\{)/,
      `$1\n  const [alerts, setAlerts] = useState<InvestmentAlert[]>([])\n  useEffect(() => {\n    (async () => {\n      try {\n        const res = await fetch('/api/investments/alerts')\n        if(res.ok){ const d = await res.json(); setAlerts(Array.isArray(d.items)? d.items: []) }\n      } catch {}\n    })()\n  }, [])\n`,
    );
  }
  return out;
});

// 3) components/dashboard-header.tsx: remover contagem mock
safe("components/dashboard-header.tsx", (c) => {
  return c.replace(
    /const\s*\[notificationCount\][\s\S]*?=\s*useState\([^)]*\)\s*\/\/ Mock[^\n]*/,
    "const [notificationCount] = useState(0)",
  );
});

// 4) components/enhanced-reports-system.tsx: remover mockData
safe("components/enhanced-reports-system.tsx", (c) => {
  let out = c;
  out = out.replace(
    /const\s+mockData:[\s\S]*?setReportData\(mockData\)/,
    `// Dados de exemplo removidos`,
  );
  return out;
});

// 5) components/examples/api-integration-demo.tsx: desabilitar tela de demo
safe("components/examples/api-integration-demo.tsx", (c) => {
  let out = c;
  out = out.replace(
    /\/\/ Dados mockados temporários[\s\S]*/,
    "// Demo desabilitado em produção",
  );
  return out;
});

console.log("\n🧹 Limpeza de dados de exemplo concluída.");
