import { useState, useCallback } from "react";

/**
 * Hook para gerenciar estado de modais de forma consistente
 * Garante que modais sempre fechem corretamente
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}

/**
 * Hook para gerenciar múltiplos modais
 */
export function useModals<T extends string>(modalNames: T[]) {
  const [openModals, setOpenModals] = useState<Set<T>>(new Set());

  const openModal = useCallback((modalName: T) => {
    setOpenModals((prev) => new Set(prev).add(modalName));
  }, []);

  const closeModal = useCallback((modalName: T) => {
    setOpenModals((prev) => {
      const newSet = new Set(prev);
      newSet.delete(modalName);
      return newSet;
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setOpenModals(new Set());
  }, []);

  const isModalOpen = useCallback(
    (modalName: T) => {
      return openModals.has(modalName);
    },
    [openModals],
  );

  return {
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    openModals: Array.from(openModals),
  };
}
