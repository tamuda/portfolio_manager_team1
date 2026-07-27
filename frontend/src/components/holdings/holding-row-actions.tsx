"use client";

/**
 * Per-row actions: Sell (primary) + Delete as escape hatch.
 * Prefer Sell so cash and the transactions ledger stay in sync.
 */

import { useState } from "react";

import { DeleteHoldingButton } from "@/components/holdings/delete-holding-button";
import { SellStockDialog } from "@/components/holdings/sell-stock-dialog";
import { Button } from "@/components/ui/button";

type HoldingRowActionsProps = {
  ticker: string;
  quantity: string;
  currentPrice?: string;
  holdingId: number;
};

export function HoldingRowActions({
  ticker,
  quantity,
  currentPrice,
  holdingId,
}: HoldingRowActionsProps) {
  const [sellOpen, setSellOpen] = useState(false);
  const maxQuantity = parseFloat(quantity);

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setSellOpen(true)}
        disabled={!Number.isFinite(maxQuantity) || maxQuantity <= 0}
      >
        Sell
      </Button>
      <DeleteHoldingButton holding={{ id: holdingId, ticker }} />

      <SellStockDialog
        ticker={ticker}
        maxQuantity={Number.isFinite(maxQuantity) ? maxQuantity : 0}
        open={sellOpen}
        onOpenChange={setSellOpen}
        defaultPrice={currentPrice}
      />
    </div>
  );
}
