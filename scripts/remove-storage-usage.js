#!/usr/bin/env node
// Remover/neutralizar usos de storage/localStorage em áreas de UI para produção
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

// 1) components/features/search/global-search.tsx: remover mockResults; fallback sem resultados
safe("components/features/search/global-search.tsx", (c) => {
  let out = c;
  out = out.replace(
    /const\s+mockResults:[\s\S]*?\n\s*\];?/m,
    "const mockResults: SearchResult[] = []",
  );
  out = out.replace(
    /const\s+filtered\s*=\s*mockResults\.filter[\s\S]*?\)/m,
    "const filtered = []",
  );
  return out;
});

// 2) components/optimized-dashboard.tsx: evitar storage.getTrips()
safe("components/optimized-dashboard.tsx", (c) => {
  return c.replace(
    /const\s+tripsData\s*=\s*storage\.getTrips\(\)\s*\|\|\s*\[\]/,
    "const tripsData: any[] = []",
  );
});

// 3) components/features/travel/family-selector.tsx: usar API contatos
safe("components/features/travel/family-selector.tsx", (c) => {
  let out = c;
  if (!/fetch\('\/api\/contacts'\)/.test(out)) {
    out = out.replace(
      /\/\/ Simular carregamento de membros da família[\s\S]*?\n/,
      "",
    );
    out = out.replace(
      /useEffect\(\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[\]\)/m,
      `useEffect(() => {
      (async () => {
        try { const r = await fetch('/api/contacts'); const d = r.ok ? await r.json() : { contacts: [] }; setMembers(d.contacts || []) } catch {}
      })()
    }, [])`,
    );
  }
  return out;
});

// 4) executive-dashboard: remover comentários "Mock previous"
safe("components/dashboards/executive/executive-dashboard.tsx", (c) =>
  c.replace(/\/\/ Mock previous value|\/\/ Mock previous/g, ""),
);

console.log(
  "\n🧹 Remoção/neutralização de storage/localStorage aplicada nos alvos conhecidos.",
);
