"use client";

/**
 * Sell shares via POST /transactions/sell (FIFO lots on the backend).
 */

import { useEffect, useState, useTransition } from "react";

import { getLatestPriceAction, sellStockAction } from "@/app/portfolios/actions";
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

type SellStockDialogProps = {
  ticker: string;
  maxQuantity: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Suggested per-share price (e.g. current_price from performance). */
  defaultPrice?: string;
};

export function SellStockDialog({
  ticker,
  maxQuantity,
  open,
  onOpenChange,
  defaultPrice = "",
}: SellStockDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(defaultPrice);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPricePending, startPriceTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setQuantity("");
    setPrice(defaultPrice);
    setError(null);

    if (defaultPrice) return;

    startPriceTransition(async () => {
      const result = await getLatestPriceAction(ticker);
      if (result.success && result.price) {
        setPrice(result.price);
      }
    });
  }, [defaultPrice, open, ticker]);

  const qtyNum = Number(quantity);
  const priceNum = Number(price);
  const estimatedProceeds =
    Number.isFinite(qtyNum) &&
    qtyNum > 0 &&
    Number.isFinite(priceNum) &&
    priceNum > 0
      ? qtyNum * priceNum
      : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (qtyNum > maxQuantity) {
      setError(
        `Cannot sell more than ${maxQuantity} shares of ${ticker} held.`,
      );
      return;
    }

    startTransition(async () => {
      const result = await sellStockAction({
        ticker,
        quantity,
        price,
      });

      if (result.success) {
        onOpenChange(false);
        return;
      }

      setError(result.error ?? "Failed to place sell.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sell {ticker}</DialogTitle>
          <DialogDescription>
            Available to sell: {maxQuantity} share
            {maxQuantity === 1 ? "" : "s"}. Proceeds are credited to cash.
          </DialogDescription>
        </DialogHeader>

        <form
          id="sell-stock-form"
          onSubmit={handleSubmit}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="sell-quantity">Quantity (shares)</Label>
            <Input
              id="sell-quantity"
              type="number"
              step="any"
              min="0.000001"
              max={maxQuantity}
              placeholder={String(maxQuantity)}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
            <button
              type="button"
              className="w-fit text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => setQuantity(String(maxQuantity))}
            >
              Sell all
            </button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sell-price">Price per share (USD)</Label>
            <Input
              id="sell-price"
              type="number"
              step="any"
              min="0.000001"
              placeholder="150.00"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
            {isPricePending && (
              <p className="text-xs text-muted-foreground">
                Looking up the latest price…
              </p>
            )}
          </div>

          {estimatedProceeds !== null && (
            <div className="rounded-lg border px-3 py-2 text-sm tabular-nums">
              Estimated proceeds:{" "}
              <span className="font-medium">
                {formatCurrency(estimatedProceeds)}
              </span>
            </div>
          )}

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
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="sell-stock-form"
            disabled={isPending || maxQuantity <= 0}
          >
            {isPending ? "Selling…" : "Place sell"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
