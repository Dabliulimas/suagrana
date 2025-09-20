"use client";

import { ModernAppLayout } from "./modern-app-layout";
import { LazyFinancialDashboard, LazyWrapper } from "./optimization/lazy-loader";

export default function DashboardContent() {
  return (
    <ModernAppLayout>
      <LazyWrapper height="600px">
        <LazyFinancialDashboard />
      </LazyWrapper>
    </ModernAppLayout>
  );
}

export { DashboardContent };
