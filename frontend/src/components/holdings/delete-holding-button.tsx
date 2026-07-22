"use client";

/**
 * Delete button with a confirmation dialog.
 *
 * Calls deleteHoldingAction (Server Action) which hits DELETE /holdings/:id
 * and revalidates the portfolios page.
 */

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";

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

type DeleteHoldingButtonProps = {
  holding: Pick<Holding, "id" | "ticker">;
};

export function DeleteHoldingButton({ holding }: DeleteHoldingButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);

    startTransition(async () => {
      const result = await deleteHoldingAction(holding.id);

      if (result.success) {
        setOpen(false);
        return;
      }

      setError(result.error ?? "Failed to delete holding.");
    });
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${holding.ticker}`}
      >
        <Trash2Icon />
        Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
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
              onClick={() => setOpen(false)}
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
    </>
  );
}
