"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { AddTransactionModal } from "./modals/transactions/add-transaction-modal";

interface NewTransactionButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function NewTransactionButton({
  variant = "default",
  size = "md",
  className = "",
}: NewTransactionButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {

    setShowModal(true);
  };

  const handleClose = () => {

    setShowModal(false);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Nova Transação</span>
        <span className="sm:hidden">Nova</span>
      </Button>

      <AddTransactionModal 
        open={showModal} 
        onOpenChange={(open) => !open && handleClose()} 
      />
    </>
  );
}
