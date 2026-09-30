"use client";

import { AlertCircleIcon, ArrowRightIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api/client";
import { useDeleteExpense } from "@/lib/api/queries";
import { formatCents } from "@/lib/money";
import type { ExpenseDto } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Trash icon that asks for confirmation before permanently deleting an expense. */
export function DeleteExpenseButton({ expense, className }: { expense: ExpenseDto; className?: string }) {
  const [open, setOpen] = useState(false);
  const deleteExpense = useDeleteExpense();
  const { paidBy, expenseFor, amountCents, description } = expense;

  function handleOpenChange(nextOpen: boolean) {
    // Keep the dialog open while the request is in flight.
    if (deleteExpense.isPending) return;
    setOpen(nextOpen);
    if (!nextOpen) deleteExpense.reset();
  }

  async function confirmDelete() {
    try {
      await deleteExpense.mutateAsync(expense.id);
      toast.success("Expense deleted", {
        description: `${description} (${formatCents(amountCents)}) was removed and balances were updated.`,
      });
      setOpen(false);
    } catch {
      // The error is shown inside the dialog from `deleteExpense.error`.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete expense: ${description}`}
          className={cn("text-muted-foreground hover:bg-destructive/10 hover:text-destructive", className)}
        >
          <Trash2Icon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this expense?</DialogTitle>
          <DialogDescription>
            The balance between {paidBy.name} and {expenseFor.name} will be recalculated. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3.5 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{description}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              {paidBy.name}
              <ArrowRightIcon aria-hidden className="size-3" />
              <span className="sr-only">paid for</span>
              {expenseFor.name}
            </p>
          </div>
          <p className="shrink-0 font-semibold tabular-nums">{formatCents(amountCents)}</p>
        </div>

        {deleteExpense.error && (
          <Alert variant="destructive" role="alert">
            <AlertCircleIcon />
            <AlertTitle>Couldn&apos;t delete the expense</AlertTitle>
            <AlertDescription>{getErrorMessage(deleteExpense.error)}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={deleteExpense.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={confirmDelete}
            disabled={deleteExpense.isPending}
          >
            {deleteExpense.isPending ? <Spinner /> : <Trash2Icon />}
            {deleteExpense.isPending ? "Deleting…" : "Delete expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
