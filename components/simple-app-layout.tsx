"use client";

import { ReactNode } from "react";

interface SimpleAppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function SimpleAppLayout({
  children,
  title,
  subtitle,
}: SimpleAppLayoutProps) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid #e5e7eb", padding: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "600" }}>{title}</h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{subtitle}</p>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
