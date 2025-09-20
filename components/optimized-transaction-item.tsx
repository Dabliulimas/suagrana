import React from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Calendar,
  Edit,
  Trash2,
} from "lucide-react";
import type { Transaction } from "../types";

interface OptimizedTransactionItemProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const OptimizedTransactionItem =
  React.memo<OptimizedTransactionItemProps>(
    ({ transaction, onEdit, onDelete, showActions = true }) => {
      const getTransactionIcon = (type: Transaction["type"]) => {
        switch (type) {
          case "income":
            return <ArrowUpRight className="w-4 h-4 text-green-600" />;
          case "shared":
            return <Users className="w-4 h-4 text-blue-600" />;
          default:
            return <ArrowDownRight className="w-4 h-4 text-red-600" />;
        }
      };

      const getTransactionBadge = (type: Transaction["type"]) => {
        switch (type) {
          case "income":
            return (
              <Badge className="bg-green-100 text-green-800">Receita</Badge>
            );
          case "shared":
            return (
              <Badge className="bg-blue-100 text-blue-800">Compartilhada</Badge>
            );
          default:
            return <Badge variant="destructive">Despesa</Badge>;
        }
      };

      const handleEdit = React.useCallback(() => {
        onEdit?.(transaction);
      }, [onEdit, transaction]);

      const handleDelete = React.useCallback(() => {
        onDelete?.(transaction.id);
      }, [onDelete, transaction.id]);

      return (
        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getTransactionIcon(transaction.type)}
              {getTransactionBadge(transaction.type)}
            </div>
            <div>
              <p className="font-medium">{transaction.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(transaction.date).toLocaleDateString("pt-BR")}
                </span>
                <span>{transaction.category}</span>
                {transaction.account && <span>{transaction.account}</span>}
                {transaction.sharedWith &&
                  transaction.sharedWith.length > 0 && (
                    <span>
                      {transaction.sharedWith.length} pessoa
                      {transaction.sharedWith.length !== 1 ? "s" : ""}
                    </span>
                  )}
              </div>
              {transaction.notes && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {transaction.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span
                className={`font-semibold text-lg ${
                  transaction.type === "income"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}R${" "}
                {Math.abs(transaction.amount).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
              {transaction.installments && transaction.currentInstallment && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {transaction.currentInstallment}/{transaction.installments}
                </p>
              )}
              {transaction.myShare && transaction.type === "shared" && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sua parte: R${" "}
                  {Math.abs(transaction.myShare).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>

            {showActions && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    },
  );

OptimizedTransactionItem.displayName = "OptimizedTransactionItem";
