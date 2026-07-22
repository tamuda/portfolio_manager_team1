"use client";

/**
 * Dialog form for adding a new holding.
 *
 * This is a Client Component because it manages local form state and
 * calls a Server Action on submit. The page itself stays a Server
 * Component that fetches the initial holdings list.
 */

import { useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";

import { createHoldingAction } from "@/app/portfolios/actions";
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

const emptyForm: HoldingCreate = {
  ticker: "",
  quantity_added: "",
  purchase_price: "",
  purchase_date: "",
};

export function AddHoldingDialog({ label = "Add holding" }: AddHoldingDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<HoldingCreate>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(field: keyof HoldingCreate, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

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
          <Button type="submit" form="add-holding-form" disabled={isPending}>
            {isPending ? "Saving…" : "Save holding"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
