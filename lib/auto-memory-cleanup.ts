"use client";

import { useEffect, useRef, useCallback } from "react";
import { logComponents } from "../lib/utils/logger";
import { memoryLeakDetector } from "./memory-leak-detector";

// Sistema de limpeza automática de memória
class AutoMemoryCleanup {
  private componentRegistry = new Map<
    string,
    {
      mountTime: number;
      cleanupFunctions: (() => void)[];
      eventListeners: {
        element: EventTarget;
        type: string;
        listener: EventListener;
      }[];
      timers: (NodeJS.Timeout | number)[];
      observers: (IntersectionObserver | MutationObserver | ResizeObserver)[];
    }
  >();

  private globalCleanupInterval: NodeJS.Timeout | null = null;
  private maxComponentLifetime = 30 * 60 * 1000; // 30 minutos
  private cleanupCheckInterval = 2 * 60 * 1000; // 2 minutos

  constructor() {
    // Só inicializar no lado cliente
    if (typeof window !== "undefined") {
      this.startGlobalCleanup();
      this.interceptEventListeners();
      this.interceptTimers();
    }
  }

  // Registrar componente para monitoramento
  registerComponent(componentId: string) {
    this.componentRegistry.set(componentId, {
      mountTime: Date.now(),
      cleanupFunctions: [],
      eventListeners: [],
      timers: [],
      observers: [],
    });

    memoryLeakDetector.registerComponent(componentId);
  }

  // Desregistrar componente e fazer limpeza
  unregisterComponent(componentId: string) {
    const component = this.componentRegistry.get(componentId);
    if (!component) return;

    // Executar todas as funções de limpeza
    component.cleanupFunctions.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.warn(`Erro na limpeza do componente ${componentId}:`, error);
      }
    });

    // Remover event listeners
    component.eventListeners.forEach(({ element, type, listener }) => {
      try {
        element.removeEventListener(type, listener);
      } catch (error) {
        console.warn(`Erro ao remover listener ${type}:`, error);
      }
    });

    // Limpar timers
    component.timers.forEach((timer) => {
      try {
        clearTimeout(timer as NodeJS.Timeout);
        clearInterval(timer as NodeJS.Timeout);
      } catch (error) {
        console.warn(`Erro ao limpar timer:`, error);
      }
    });

    // Desconectar observers
    component.observers.forEach((observer) => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn(`Erro ao desconectar observer:`, error);
      }
    });

    this.componentRegistry.delete(componentId);
    memoryLeakDetector.unregisterComponent(componentId);
  }

  // Adicionar função de limpeza para um componente
  addCleanupFunction(componentId: string, cleanupFn: () => void) {
    const component = this.componentRegistry.get(componentId);
    if (component) {
      component.cleanupFunctions.push(cleanupFn);
    }
  }

  // Interceptar addEventListener para rastreamento automático
  private interceptEventListeners() {
    if (typeof window === "undefined") return;

    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener =
      EventTarget.prototype.removeEventListener;
    const cleanup = this;

    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      // Tentar encontrar o componente atual (heurística)
      const componentId = cleanup.getCurrentComponentId();
      if (componentId) {
        const component = cleanup.componentRegistry.get(componentId);
        if (component && listener) {
          component.eventListeners.push({
            element: this,
            type,
            listener: listener as EventListener,
          });
        }
      }

      return originalAddEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options,
    ) {
      // Remover do registro se existir
      for (const [, component] of cleanup.componentRegistry.entries()) {
        const index = component.eventListeners.findIndex(
          (l) =>
            l.element === this && l.type === type && l.listener === listener,
        );
        if (index !== -1) {
          component.eventListeners.splice(index, 1);
          break;
        }
      }

      return originalRemoveEventListener.call(this, type, listener, options);
    };
  }

  // Interceptar setTimeout e setInterval
  private interceptTimers() {
    if (typeof window === "undefined") return;

    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    const cleanup = this;

    window.setTimeout = function (callback, delay, ...args) {
      const timer = originalSetTimeout.call(this, callback, delay, ...args);

      const componentId = cleanup.getCurrentComponentId();
      if (componentId) {
        const component = cleanup.componentRegistry.get(componentId);
        if (component) {
          component.timers.push(timer);
        }
      }

      return timer;
    };

    window.setInterval = function (callback, delay, ...args) {
      const timer = originalSetInterval.call(this, callback, delay, ...args);

      const componentId = cleanup.getCurrentComponentId();
      if (componentId) {
        const component = cleanup.componentRegistry.get(componentId);
        if (component) {
          component.timers.push(timer);
        }
      }

      return timer;
    };
  }

  // Heurística para identificar componente atual (limitada)
  private getCurrentComponentId(): string | null {
    // Esta é uma implementação simplificada
    // Em um cenário real, seria necessário um sistema mais sofisticado
    const stack = new Error().stack;
    if (stack) {
      const match = stack.match(/at\s+(\w+)\s+/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  // Limpeza global periódica
  private startGlobalCleanup() {
    this.globalCleanupInterval = setInterval(() => {
      this.performGlobalCleanup();
    }, this.cleanupCheckInterval);
  }

  // Executar limpeza global
  private performGlobalCleanup() {
    const now = Date.now();
    const componentsToCleanup: string[] = [];

    // Identificar componentes que estão há muito tempo na memória
    for (const [componentId, component] of this.componentRegistry.entries()) {
      if (now - component.mountTime > this.maxComponentLifetime) {
        componentsToCleanup.push(componentId);
      }
    }

    // Limpar componentes antigos
    componentsToCleanup.forEach((componentId) => {
      console.warn(
        `Limpeza forçada do componente ${componentId} (tempo limite excedido)`,
      );
      this.unregisterComponent(componentId);
    });

    // Forçar garbage collection se disponível (apenas no cliente)
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development" &&
      (window as any).gc
    ) {
      (window as any).gc();
    }
  }

  // Estatísticas de limpeza
  getCleanupStats() {
    return {
      registeredComponents: this.componentRegistry.size,
      totalEventListeners: Array.from(this.componentRegistry.values()).reduce(
        (total, comp) => total + comp.eventListeners.length,
        0,
      ),
      totalTimers: Array.from(this.componentRegistry.values()).reduce(
        (total, comp) => total + comp.timers.length,
        0,
      ),
      totalObservers: Array.from(this.componentRegistry.values()).reduce(
        (total, comp) => total + comp.observers.length,
        0,
      ),
    };
  }

  // Destruir o sistema de limpeza
  destroy() {
    if (this.globalCleanupInterval) {
      clearInterval(this.globalCleanupInterval);
    }

    // Limpar todos os componentes registrados
    const componentIds = Array.from(this.componentRegistry.keys());
    componentIds.forEach((id) => this.unregisterComponent(id));
  }
}

// Instância global
export const autoMemoryCleanup = new AutoMemoryCleanup();

// Hook para limpeza automática de componentes
export function useAutoCleanup(componentName: string) {
  const componentId = useRef(`${componentName}-${Date.now()}-${Math.random()}`);
  const cleanupFunctions = useRef<(() => void)[]>([]);

  useEffect(() => {
    autoMemoryCleanup.registerComponent(componentId.current);

    return () => {
      autoMemoryCleanup.unregisterComponent(componentId.current);
    };
  }, []);

  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctions.current.push(cleanupFn);
    autoMemoryCleanup.addCleanupFunction(componentId.current, cleanupFn);
  }, []);

  const addEventListenerWithCleanup = useCallback(
    (
      element: EventTarget,
      type: string,
      listener: EventListener,
      options?: AddEventListenerOptions,
    ) => {
      element.addEventListener(type, listener, options);
      addCleanup(() => element.removeEventListener(type, listener, options));
    },
    [addCleanup],
  );

  const setTimeoutWithCleanup = useCallback(
    (callback: () => void, delay: number) => {
      const timer = setTimeout(callback, delay);
      addCleanup(() => clearTimeout(timer));
      return timer;
    },
    [addCleanup],
  );

  const setIntervalWithCleanup = useCallback(
    (callback: () => void, delay: number) => {
      const timer = setInterval(callback, delay);
      addCleanup(() => clearInterval(timer));
      return timer;
    },
    [addCleanup],
  );

  return {
    addCleanup,
    addEventListenerWithCleanup,
    setTimeoutWithCleanup,
    setIntervalWithCleanup,
    componentId: componentId.current,
  };
}

// Hook para monitoramento de observers
export function useObserverCleanup(componentName: string) {
  const { addCleanup } = useAutoCleanup(componentName);

  const createIntersectionObserver = useCallback(
    (
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) => {
      const observer = new IntersectionObserver(callback, options);
      addCleanup(() => observer.disconnect());
      return observer;
    },
    [addCleanup],
  );

  const createMutationObserver = useCallback(
    (callback: MutationCallback) => {
      const observer = new MutationObserver(callback);
      addCleanup(() => observer.disconnect());
      return observer;
    },
    [addCleanup],
  );

  const createResizeObserver = useCallback(
    (callback: ResizeObserverCallback) => {
      const observer = new ResizeObserver(callback);
      addCleanup(() => observer.disconnect());
      return observer;
    },
    [addCleanup],
  );

  return {
    createIntersectionObserver,
    createMutationObserver,
    createResizeObserver,
  };
}

export default autoMemoryCleanup;
