"use client";

/**
 * Deposit or withdraw cash via POST /transactions/transfer.
 * Cash starts at $0 — deposit before buying.
 */

import { useEffect, useState, useTransition } from "react";
import { BanknoteIcon } from "lucide-react";

import { transferCashAction } from "@/app/portfolios/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransferDirection } from "@/types/transaction";

type CashTransferDialogProps = {
  cashBalance: number;
  defaultDirection?: TransferDirection;
};

export function CashTransferDialog({
  cashBalance,
  defaultDirection = "DEPOSIT",
}: CashTransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] =
    useState<TransferDirection>(defaultDirection);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setDirection(defaultDirection);
    setAmount("");
    setError(null);
  }, [defaultDirection, open]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await transferCashAction({ direction, amount });
      if (result.success) {
        setOpen(false);
        return;
      }
      setError(result.error ?? "Failed to update cash.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <BanknoteIcon data-icon="inline-start" />
        Deposit / Withdraw
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cash transfer</DialogTitle>
          <DialogDescription>
            Available cash: {formatCurrency(cashBalance)}. Deposit funds before
            placing buys.
          </DialogDescription>
        </DialogHeader>

        <form
          id="cash-transfer-form"
          onSubmit={handleSubmit}
          className="grid gap-4"
        >
          <div className="space-y-2">
            <Label>Direction</Label>
            <div className="flex gap-1.5">
              {(["DEPOSIT", "WITHDRAWAL"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDirection(option)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    direction === option
                      ? "border-foreground/20 bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option === "DEPOSIT" ? "Deposit" : "Withdraw"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transfer-amount">Amount (USD)</Label>
            <Input
              id="transfer-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="1000.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="cash-transfer-form" disabled={isPending}>
            {isPending
              ? "Working…"
              : direction === "DEPOSIT"
                ? "Deposit"
                : "Withdraw"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
