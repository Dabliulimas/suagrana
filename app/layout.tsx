import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/client-providers";
import { ClientErrorBoundary } from "@/components/client-error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SuaGrana - Gestão Financeira Inteligente",
  description: "Controle suas finanças de forma inteligente e eficiente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ClientErrorBoundary>
          <ClientProviders>{children}</ClientProviders>
        </ClientErrorBoundary>
      </body>
    </html>
  );
}
