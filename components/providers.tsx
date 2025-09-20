"use client";

import React from "react";
import { ThemeProvider } from "../contexts/theme-context";
import { FinancialProvider } from "../contexts/financial";
import { UnifiedProvider } from "../contexts/unified-context";
import { InvestmentProvider } from "../contexts/investments/investment-context";
import { SidebarProvider } from "./ui/sidebar";
import { GlobalModalProvider } from "../contexts/ui/global-modal-context";
import { Toaster } from "./ui/toaster";
import { GlobalModals } from "./global-modals";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <UnifiedProvider>
        <InvestmentProvider>
          <SidebarProvider>
            <GlobalModalProvider>
              {children}
              <GlobalModals />
              <Toaster />
            </GlobalModalProvider>
          </SidebarProvider>
        </InvestmentProvider>
      </UnifiedProvider>
    </ThemeProvider>
  );
}
