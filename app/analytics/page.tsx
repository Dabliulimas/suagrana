"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a página consolidada
    router.replace("/advanced-dashboard?tab=analytics");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Redirecionando para Análises...</p>
      </div>
    </div>
  );
}
