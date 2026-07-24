"use client";

/**
 * Dialog for adding a new symbol to the watchlist.
 *
 * Mirrors the debounced ticker-lookup pattern in AddHoldingDialog: as the
 * user types, we look up the ticker so they see a live preview before
 * confirming, instead of allowing garbage tickers straight through.
 */

import { useEffect, useState, useTransition } from "react";

import { addWatchlistItemAction, getQuoteAction } from "@/app/watchlist/actions";
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

type AddSymbolDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (ticker: string) => void;
};

export function AddSymbolDialog({
  open,
  onOpenChange,
  onAdded,
}: AddSymbolDialogProps) {
  const [ticker, setTicker] = useState("");
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookupPending, startLookupTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = ticker.trim();

    if (!trimmed) {
      setPreviewName(null);
      setPreviewPrice(null);
      setLookupError(null);
      return;
    }

    const timeout = setTimeout(() => {
      startLookupTransition(async () => {
        const result = await getQuoteAction(trimmed, "1D");

        if (!result.success || !result.quote) {
          setPreviewName(null);
          setPreviewPrice(null);
          setLookupError(result.error ?? "Symbol not found.");
          return;
        }

        setLookupError(null);
        setPreviewName(result.quote.name);
        setPreviewPrice(result.quote.price);
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [ticker]);

  function reset() {
    setTicker("");
    setPreviewName(null);
    setPreviewPrice(null);
    setLookupError(null);
    setSubmitError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const normalized = ticker.trim().toUpperCase();

    startTransition(async () => {
      const result = await addWatchlistItemAction(normalized);

      if (result.success) {
        onAdded(normalized);
        reset();
        onOpenChange(false);
        return;
      }

      setSubmitError(result.error ?? "Failed to add symbol.");
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add symbol</DialogTitle>
          <DialogDescription>
            Enter a ticker to add it to your watchlist.
          </DialogDescription>
        </DialogHeader>

        <form
          id="add-symbol-form"
          onSubmit={handleSubmit}
          className="grid gap-2"
        >
          <Label htmlFor="watchlist-ticker">Ticker</Label>
          <Input
            id="watchlist-ticker"
            placeholder="AAPL"
            value={ticker}
            onChange={(event) => setTicker(event.target.value)}
            required
            maxLength={20}
            autoComplete="off"
            autoFocus
          />

          {isLookupPending && (
            <p className="text-xs text-muted-foreground">
              Looking up symbol…
            </p>
          )}
          {!isLookupPending && lookupError && (
            <p className="text-sm text-destructive" role="alert">
              {lookupError}
            </p>
          )}
          {!isLookupPending && previewPrice !== null && (
            <p className="text-sm text-muted-foreground">
              {previewName ?? ticker.trim().toUpperCase()} —{" "}
              {previewPrice.toFixed(2)}
            </p>
          )}
          {submitError && (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
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
            form="add-symbol-form"
            disabled={isPending || isLookupPending || previewPrice === null}
          >
            {isPending ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
