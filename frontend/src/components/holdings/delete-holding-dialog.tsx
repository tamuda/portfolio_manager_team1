"use client";

/**
 * "Are you sure?" popup for deleting a holding.
 * Used by HoldingRowActions (⋯ menu) — not a standalone button.
 */

import { useState, useTransition } from "react";

import { deleteHoldingAction } from "@/app/portfolios/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Holding } from "@/types/holding";

type DeleteHoldingDialogProps = {
  holding: Pick<Holding, "id" | "ticker">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteHoldingDialog({
  holding,
  open,
  onOpenChange,
}: DeleteHoldingDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deleteHoldingAction(holding.id);

      if (result.success) {
        onOpenChange(false);
        return;
      }

      setError(result.error ?? "Failed to delete holding.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {holding.ticker}?</DialogTitle>
          <DialogDescription>
            This removes the holding from your portfolio. This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
