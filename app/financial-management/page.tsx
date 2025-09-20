"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FinancialManagementPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para a pagina consolidada
    router.replace("/advanced-dashboard?tab=management");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Redirecionando para Análises...</p>
      </div>
    </div>
  );
}
