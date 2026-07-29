"use client";

/**
 * Buy shares against available cash via POST /transactions/buy.
 *
 * User chooses shares OR dollars to invest; execution price always comes
 * from the live market quote (not user-entered).
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";

import {
  buyStockAction,
  getLatestPriceAction,
  searchSymbolsAction,
} from "@/app/portfolios/actions";
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
import { TickerAutocomplete } from "@/components/ticker-autocomplete";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type BuyMode = "shares" | "dollars";

type BuyStockDialogProps = {
  cashBalance: number;
  label?: string;
  /** Prefill ticker (e.g. from a holdings row). */
  defaultTicker?: string;
  /** Controlled open — when set, no trigger button is rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Trim trailing zeros for readable share counts. */
function formatShares(value: number): string {
  return value
    .toFixed(6)
    .replace(/\.?0+$/, "") || "0";
}

export function BuyStockDialog({
  cashBalance,
  label = "Buy",
  defaultTicker = "",
  open: openProp,
  onOpenChange,
}: BuyStockDialogProps) {
  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? openProp : internalOpen;

  function setOpen(next: boolean) {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  const [ticker, setTicker] = useState(defaultTicker);
  const [mode, setMode] = useState<BuyMode>("shares");
  const [sharesInput, setSharesInput] = useState("");
  const [dollarsInput, setDollarsInput] = useState("");
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [priceHint, setPriceHint] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPricePending, startPriceTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setTicker(defaultTicker);
    setMode("shares");
    setSharesInput("");
    setDollarsInput("");
    setLivePrice(null);
    setError(null);
    setPriceHint(null);
  }, [defaultTicker, open]);

  useEffect(() => {
    const trimmed = ticker.trim();
    if (!open || !trimmed) {
      setLivePrice(null);
      return;
    }

    const timeout = setTimeout(() => {
      startPriceTransition(async () => {
        const result = await getLatestPriceAction(trimmed);
        if (!result.success || !result.price) {
          setLivePrice(null);
          setPriceHint(result.error ?? "Could not fetch the latest price.");
          return;
        }
        const price = Number(result.price);
        if (!Number.isFinite(price) || price <= 0) {
          setLivePrice(null);
          setPriceHint("Latest price looks invalid.");
          return;
        }
        setPriceHint(null);
        setLivePrice(price);
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [open, ticker]);

  const preview = useMemo(() => {
    if (livePrice === null || livePrice <= 0) {
      return { quantity: null as number | null, cost: null as number | null };
    }

    if (mode === "shares") {
      const shares = Number(sharesInput);
      if (!Number.isFinite(shares) || shares <= 0) {
        return { quantity: null, cost: null };
      }
      return { quantity: shares, cost: shares * livePrice };
    }

    const dollars = Number(dollarsInput);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      return { quantity: null, cost: null };
    }
    return { quantity: dollars / livePrice, cost: dollars };
  }, [dollarsInput, livePrice, mode, sharesInput]);

  const remainingCash =
    preview.cost !== null ? cashBalance - preview.cost : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = ticker.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter a ticker.");
      return;
    }
    if (livePrice === null || livePrice <= 0) {
      setError("Wait for a live market price before buying.");
      return;
    }
    if (preview.quantity === null || preview.cost === null) {
      setError(
        mode === "shares"
          ? "Enter how many shares you want to buy."
          : "Enter how much you want to invest.",
      );
      return;
    }
    if (preview.cost > cashBalance) {
      setError(
        `This buy costs ${formatCurrency(preview.cost)}, which exceeds your cash of ${formatCurrency(cashBalance)}.`,
      );
      return;
    }

    const quantity = formatShares(preview.quantity);
    const price = livePrice.toFixed(6);

    startTransition(async () => {
      // Refresh quote once more right before placing the order.
      const fresh = await getLatestPriceAction(trimmed);
      let execPrice = price;
      let execQty = quantity;

      if (fresh.success && fresh.price) {
        const nextPrice = Number(fresh.price);
        if (Number.isFinite(nextPrice) && nextPrice > 0) {
          execPrice = nextPrice.toFixed(6);
          if (mode === "dollars") {
            const dollars = Number(dollarsInput);
            execQty = formatShares(dollars / nextPrice);
          }
        }
      }

      const result = await buyStockAction({
        ticker: trimmed,
        quantity: execQty,
        price: execPrice,
        trade_date: todayDateString(),
      });

      if (result.success) {
        setOpen(false);
        return;
      }

      setError(result.error ?? "Failed to place buy.");
    });
  }

  const canSubmit =
    !isPending &&
    !isPricePending &&
    cashBalance > 0 &&
    livePrice !== null &&
    preview.quantity !== null &&
    preview.cost !== null &&
    preview.cost <= cashBalance;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlled && (
        <DialogTrigger render={<Button />}>
          <PlusIcon data-icon="inline-start" />
          {label}
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy stock</DialogTitle>
          <DialogDescription>
            Choose shares or dollars to invest. Price is set from the live
            market quote. Available cash: {formatCurrency(cashBalance)}.
            {cashBalance <= 0 && " Deposit cash before buying."}
          </DialogDescription>
        </DialogHeader>

        <form id="buy-stock-form" onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="buy-ticker">Ticker</Label>
            <TickerAutocomplete
              id="buy-ticker"
              value={ticker}
              onChange={setTicker}
              onSelect={(suggestion) => setTicker(suggestion.symbol)}
              search={searchSymbolsAction}
              placeholder="AAPL"
              required
              maxLength={20}
            />
            {isPricePending && (
              <p className="text-xs text-muted-foreground">
                Looking up the latest price…
              </p>
            )}
            {!isPricePending && priceHint && (
              <p className="text-sm text-destructive" role="alert">
                {priceHint}
              </p>
            )}
            {!isPricePending && livePrice !== null && (
              <p className="text-sm tabular-nums text-muted-foreground">
                Live price:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(livePrice)}
                </span>
                /share
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Buy by</Label>
            <div className="flex gap-1.5">
              {(
                [
                  { id: "shares", label: "Shares" },
                  { id: "dollars", label: "Dollars" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMode(option.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    mode === option.id
                      ? "border-foreground/20 bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "shares" ? (
            <div className="grid gap-2">
              <Label htmlFor="buy-shares">Shares to buy</Label>
              <Input
                id="buy-shares"
                type="number"
                step="any"
                min="0.000001"
                placeholder="10"
                value={sharesInput}
                onChange={(event) => setSharesInput(event.target.value)}
                required
              />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="buy-dollars">Amount to invest (USD)</Label>
              <Input
                id="buy-dollars"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="500.00"
                value={dollarsInput}
                onChange={(event) => setDollarsInput(event.target.value)}
                required
              />
              <button
                type="button"
                className="w-fit text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => setDollarsInput(cashBalance.toFixed(2))}
                disabled={cashBalance <= 0}
              >
                Use all cash
              </button>
            </div>
          )}

          {preview.quantity !== null && preview.cost !== null && (
            <div className="rounded-lg border px-3 py-2 text-sm">
              {mode === "shares" ? (
                <p className="tabular-nums">
                  Estimated cost:{" "}
                  <span className="font-medium">
                    {formatCurrency(preview.cost)}
                  </span>
                </p>
              ) : (
                <p className="tabular-nums">
                  You get about{" "}
                  <span className="font-medium">
                    {formatShares(preview.quantity)}
                  </span>{" "}
                  shares
                </p>
              )}
              <p
                className={
                  remainingCash !== null && remainingCash < 0
                    ? "text-destructive tabular-nums"
                    : "text-muted-foreground tabular-nums"
                }
              >
                Cash after:{" "}
                {remainingCash !== null
                  ? formatCurrency(remainingCash)
                  : "—"}
              </p>
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
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="buy-stock-form" disabled={!canSubmit}>
            {isPending ? "Buying…" : "Place buy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
