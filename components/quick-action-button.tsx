"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { AddTransactionModal } from "./modals/transactions/add-transaction-modal";

interface QuickActionButtonProps {
  onTransactionAdded?: () => void;
  tripId?: string;
  className?: string;
}

export function QuickActionButton({
  onTransactionAdded,
  tripId,
  className,
}: QuickActionButtonProps) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const handleTransactionSaved = () => {
    setShowTransactionModal(false);
    onTransactionAdded?.();
  };

  return (
    <>
      <Button
        onClick={() => setShowTransactionModal(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 ${className}`}
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <AddTransactionModal
        open={showTransactionModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowTransactionModal(false);
            onTransactionAdded?.();
          }
        }}
      />
    </>
  );
}
