/**
 * LISTA VIRTUALIZADA SIMPLIFICADA
 */

"use client";

import { ReactNode } from "react";

interface VirtualizedListProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  height?: number;
}

export function VirtualizedList({
  items,
  renderItem,
  height = 400,
}: VirtualizedListProps) {
  // Implementação simplificada - apenas renderiza todos os itens
  // Em uma implementação real, usaríamos virtualização para performance
  return (
    <div style={{ height, overflowY: "auto" }}>
      {items.map((item, index) => (
        <div key={item.id || index}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
}
