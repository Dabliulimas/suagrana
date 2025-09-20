"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface GlobalModalContextType {
  // Modal state
  activeModal: string | null;
  transactionModalOpen: boolean;
  investmentModalOpen: boolean;
  goalModalOpen: boolean;
  tripModalOpen: boolean;
  sharedExpenseModalOpen: boolean;
  transactionsListModalOpen: boolean;
  globalSearchModalOpen: boolean;

  // Modal actions
  openTransactionModal: () => void;
  openSharedExpenseModal: () => void;
  openInvestmentModal: () => void;
  openGoalModal: () => void;
  openTripModal: () => void;
  openTransactionsListModal: () => void;
  openGlobalSearch: () => void;
  closeAllModals: () => void;
}

const GlobalModalContext = createContext<GlobalModalContextType>({
  activeModal: null,
  transactionModalOpen: false,
  investmentModalOpen: false,
  goalModalOpen: false,
  tripModalOpen: false,
  sharedExpenseModalOpen: false,
  transactionsListModalOpen: false,
  globalSearchModalOpen: false,

  openTransactionModal: () => {},
  openSharedExpenseModal: () => {},
  openInvestmentModal: () => {},
  openGoalModal: () => {},
  openTripModal: () => {},
  openTransactionsListModal: () => {},
  openGlobalSearch: () => {},
  closeAllModals: () => {},
});

export function GlobalModalProvider({ children }: { children: ReactNode }) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openTransactionModal = () => {
    setActiveModal("transaction");
  };

  const openSharedExpenseModal = () => {
    setActiveModal("shared-expense");
  };

  const openInvestmentModal = () => {
    setActiveModal("investment");
  };

  const openGoalModal = () => {
    setActiveModal("goal");
  };

  const openTripModal = () => {
    setActiveModal("trip");
  };

  const openTransactionsListModal = () => {
    setActiveModal("transactions-list");
  };

  const openGlobalSearch = () => {
    setActiveModal("global-search");
  };

  const closeAllModals = () => {
    setActiveModal(null);
  };

  return (
    <GlobalModalContext.Provider
      value={{
        activeModal,
        transactionModalOpen: activeModal === "transaction",
        investmentModalOpen: activeModal === "investment",
        goalModalOpen: activeModal === "goal",
        tripModalOpen: activeModal === "trip",
        sharedExpenseModalOpen: activeModal === "shared-expense",
        transactionsListModalOpen: activeModal === "transactions-list",
        globalSearchModalOpen: activeModal === "global-search",

        openTransactionModal,
        openSharedExpenseModal,
        openInvestmentModal,
        openGoalModal,
        openTripModal,
        openTransactionsListModal,
        openGlobalSearch,
        closeAllModals,
      }}
    >
      {children}
    </GlobalModalContext.Provider>
  );
}

export function useGlobalModal() {
  return useContext(GlobalModalContext);
}
