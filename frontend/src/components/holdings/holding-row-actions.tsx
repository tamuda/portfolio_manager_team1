"use client";

/**
 * Per-row stock action: Sell (keeps cash + ledger in sync).
 */

import { useState } from "react";

import { SellStockDialog } from "@/components/holdings/sell-stock-dialog";
import { Button } from "@/components/ui/button";

type HoldingRowActionsProps = {
  ticker: string;
  quantity: string;
  currentPrice?: string;
};

export function HoldingRowActions({
  ticker,
  quantity,
  currentPrice,
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
