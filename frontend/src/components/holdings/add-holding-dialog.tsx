"use client";

/**
 * Dialog form for adding a new holding.
 *
 * This is a Client Component because it manages local form state and
 * calls a Server Action on submit. The page itself stays a Server
 * Component that fetches the initial holdings list.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";

import { createHoldingAction, getLatestPriceAction } from "@/app/portfolios/actions";
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
import type { HoldingCreate } from "@/types/holding";

type AddHoldingDialogProps = {
  /** Wider label for the empty-state CTA. Defaults to "Add holding". */
  label?: string;
};

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function emptyForm(): HoldingCreate {
  return {
    ticker: "",
    quantity_added: "",
    purchase_price: "",
    purchase_date: todayDateString(),
  };
}

export function AddHoldingDialog({ label = "Add holding" }: AddHoldingDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<HoldingCreate>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPricePending, startPriceTransition] = useTransition();
  const [priceError, setPriceError] = useState<string | null>(null);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);

  // Whichever of quantity/purchase price the user typed into most recently
  // is the "source" — the other one is recalculated from it using
  // latestPrice. Defaults to quantity-driven.
  const lastEditedField = useRef<"quantity_added" | "purchase_price">(
    "quantity_added",
  );

  function updateField(field: keyof HoldingCreate, value: string) {
    if (field === "quantity_added" || field === "purchase_price") {
      lastEditedField.current = field;
    }

    setForm((current) => {
      const next = { ...current, [field]: value };

      if (latestPrice == null || latestPrice <= 0) return next;

      if (field === "quantity_added") {
        const quantity = Number(value);
        next.purchase_price =
          Number.isFinite(quantity) && quantity > 0
            ? (quantity * latestPrice).toFixed(2)
            : "";
      } else if (field === "purchase_price") {
        const price = Number(value);
        next.quantity_added =
          Number.isFinite(price) && price > 0
            ? (price / latestPrice).toFixed(6)
            : "";
      }

      return next;
    });
  }

  // Look up the latest market price whenever the ticker changes, then use it
  // to recalculate whichever field (quantity or price) isn't the source.
  useEffect(() => {
    const ticker = form.ticker.trim();

    if (!ticker) {
      setLatestPrice(null);
      setPriceError(null);
      return;
    }

    const timeout = setTimeout(() => {
      startPriceTransition(async () => {
        const result = await getLatestPriceAction(ticker);

        if (!result.success || !result.price) {
          setLatestPrice(null);
          setPriceError(result.error ?? "Could not fetch the latest price.");
          return;
        }

        const price = Number(result.price);
        if (!Number.isFinite(price) || price <= 0) return;

        setPriceError(null);
        setLatestPrice(price);

        setForm((current) => {
          if (lastEditedField.current === "purchase_price") {
            const enteredPrice = Number(current.purchase_price);
            if (Number.isFinite(enteredPrice) && enteredPrice > 0) {
              return {
                ...current,
                quantity_added: (enteredPrice / price).toFixed(6),
              };
            }
          } else {
            const enteredQuantity = Number(current.quantity_added);
            if (Number.isFinite(enteredQuantity) && enteredQuantity > 0) {
              return {
                ...current,
                purchase_price: (enteredQuantity * price).toFixed(2),
              };
            }
          }

          return current;
        });
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [form.ticker]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Normalise ticker to uppercase before sending to the API.
    const payload: HoldingCreate = {
      ...form,
      ticker: form.ticker.trim().toUpperCase(),
    };

    startTransition(async () => {
      const result = await createHoldingAction(payload);

      if (result.success) {
        setForm(emptyForm);
        setPriceError(null);
        setLatestPrice(null);
        lastEditedField.current = "quantity_added";
        setOpen(false);
        return;
      }

      setError(result.error ?? "Failed to save holding.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        {label}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add holding</DialogTitle>
          <DialogDescription>
            Enter the stock details below. Fields match the backend model in{" "}
            <code className="text-xs">schemas/holding.py</code>.
          </DialogDescription>
        </DialogHeader>

        <form id="add-holding-form" onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ticker">Ticker</Label>
            <Input
              id="ticker"
              placeholder="AAPL"
              value={form.ticker}
              onChange={(event) => updateField("ticker", event.target.value)}
              required
              maxLength={20}
              autoComplete="off"
            />
            {isPricePending && (
              <p className="text-xs text-muted-foreground">
                Looking up the latest price…
              </p>
            )}
            {!isPricePending && priceError && (
              <p className="text-sm text-destructive" role="alert">
                {priceError}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity_added">Quantity</Label>
            <Input
              id="quantity_added"
              type="number"
              step="any"
              min="0.000001"
              placeholder="10"
              value={form.quantity_added}
              onChange={(event) => updateField("quantity_added", event.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purchase_price">Purchase price (USD)</Label>
            <Input
              id="purchase_price"
              type="number"
              step="any"
              min="0"
              placeholder="150.00"
              value={form.purchase_price}
              onChange={(event) =>
                updateField("purchase_price", event.target.value)
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="purchase_date">Purchase date</Label>
            <Input
              id="purchase_date"
              type="date"
              value={form.purchase_date}
              onChange={(event) =>
                updateField("purchase_date", event.target.value)
              }
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
          <Button
            type="submit"
            form="add-holding-form"
            disabled={isPending || isPricePending}
          >
            {isPending ? "Saving…" : "Save holding"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
