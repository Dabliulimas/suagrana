"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

export function SimpleDashboard() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Simples</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Este é um dashboard básico para testar se o sistema está
            funcionando.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default SimpleDashboard;
