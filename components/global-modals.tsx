"use client";

import { useGlobalModal } from "../contexts/ui/global-modal-context";
import { AddTransactionModal } from "./modals/transactions/add-transaction-modal";
import { SharedExpenseModal } from "./shared-expense-modal";
import { InvestmentModal } from "./modals/investment-modal";
import { GoalModal } from "./modals/goal-modal";
import { TripModal } from "./modals/trip-modal";
import { GlobalSearchModal } from "./modals/global-search-modal";

export function GlobalModals() {
  const {
    closeAllModals,
    transactionModalOpen,
    sharedExpenseModalOpen,
    investmentModalOpen,
    goalModalOpen,
    tripModalOpen,
    globalSearchModalOpen,
  } = useGlobalModal();

  return (
    <>
      <AddTransactionModal
        open={transactionModalOpen}
        onOpenChange={(open) => !open && closeAllModals()}
      />

      {sharedExpenseModalOpen && (
        <SharedExpenseModal
          onClose={closeAllModals}
          onSave={closeAllModals}
        />
      )}

      <InvestmentModal isOpen={investmentModalOpen} onClose={closeAllModals} />

      <GoalModal isOpen={goalModalOpen} onClose={closeAllModals} />

      <TripModal isOpen={tripModalOpen} onClose={closeAllModals} />

      <GlobalSearchModal
        isOpen={globalSearchModalOpen}
        onClose={closeAllModals}
      />
    </>
  );
}
