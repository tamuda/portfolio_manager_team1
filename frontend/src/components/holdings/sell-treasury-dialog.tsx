"use client";

/**
 * Sell an entire Treasury lot via POST /treasury/:id/sell.
 */

import { useEffect, useState, useTransition } from "react";

import { sellTreasuryAction } from "@/app/portfolios/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import type { TreasuryValuation } from "@/types/treasury";

type SellTreasuryDialogProps = {
  holding: TreasuryValuation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SellTreasuryDialog({
  holding,
  open,
  onOpenChange,
}: SellTreasuryDialogProps) {
  const [salePrice, setSalePrice] = useState(holding.current_price);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setSalePrice(holding.current_price);
    setError(null);
  }, [holding.current_price, open]);

  const face = parseFloat(holding.face_value);
  const priceNum = Number(salePrice);
  const estimatedProceeds =
    Number.isFinite(face) &&
    face > 0 &&
    Number.isFinite(priceNum) &&
    priceNum > 0
      ? (face / 100) * priceNum
      : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("Enter a valid sale price per 100 face.");
      return;
    }

    startTransition(async () => {
      const result = await sellTreasuryAction(holding.id, {
        sale_price: String(priceNum),
      });

      if (result.success) {
        onOpenChange(false);
        return;
      }
      setError(result.error ?? "Failed to sell Treasury.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Sell {holding.treasury_type} ·{" "}
            {formatCurrency(parseFloat(holding.face_value))} face
          </DialogTitle>
          <DialogDescription>
            Treasuries sell as a full lot. Proceeds are credited to cash.
          </DialogDescription>
        </DialogHeader>

        <form
          id="sell-treasury-form"
          onSubmit={handleSubmit}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="tsy-sale-price">Sale price / 100 face</Label>
            <Input
              id="tsy-sale-price"
              type="number"
              min="0.0001"
              step="0.0001"
              value={salePrice}
              onChange={(event) => setSalePrice(event.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Suggested mark: {holding.current_price} (model price). Cost basis:{" "}
              {formatCurrency(parseFloat(holding.cost_basis))}.
            </p>
          </div>

          <div className="rounded-lg border px-3 py-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Est. proceeds</span>
              <span className="font-semibold tabular-nums">
                {estimatedProceeds !== null
                  ? formatCurrency(estimatedProceeds)
                  : "—"}
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="sell-treasury-form" disabled={isPending}>
            {isPending ? "Selling…" : "Sell lot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
