/**
 * Compact CTA when one asset class is present and the other is not.
 * Keeps the page from showing a big empty table.
 */

import { LandmarkIcon, LineChartIcon } from "lucide-react";

import { BuyStockDialog } from "@/components/holdings/buy-stock-dialog";
import { BuyTreasuryDialog } from "@/components/holdings/buy-treasury-dialog";

type AddAssetClassCardProps = {
  cashBalance: number;
  assetClass: "stock" | "treasury";
};

export function AddAssetClassCard({
  cashBalance,
  assetClass,
}: AddAssetClassCardProps) {
  const isStock = assetClass === "stock";

  return (
    <div className="mt-8 flex flex-col gap-3 rounded-xl border border-dashed px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          {isStock ? (
            <LineChartIcon className="size-4" />
          ) : (
            <LandmarkIcon className="size-4" />
          )}
        </div>
        <div>
          <p className="font-medium">
            {isStock ? "Add stocks" : "Add Treasuries"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isStock
              ? "Diversify with equities alongside your bonds."
              : "Add bills, notes, or bonds alongside your stocks."}
          </p>
        </div>
      </div>
      {isStock ? (
        <BuyStockDialog
          cashBalance={cashBalance}
          label="Buy stock"
          variant="default"
        />
      ) : (
        <BuyTreasuryDialog
          cashBalance={cashBalance}
          label="Buy Treasury"
          variant="default"
        />
      )}
    </div>
  );
}
