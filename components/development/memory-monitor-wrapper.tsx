"use client";

import { MemoryMonitor } from "./memory-monitor";

export default function MemoryMonitorWrapper() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return <MemoryMonitor />;
}
