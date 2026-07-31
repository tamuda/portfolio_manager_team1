/**
 * Guided empty state — one clear next step at a time.
 * Step 1: deposit. Step 2: choose an asset class to buy.
 */

import { LandmarkIcon, LineChartIcon } from "lucide-react";

import { BuyStockDialog } from "@/components/holdings/buy-stock-dialog";
import { BuyTreasuryDialog } from "@/components/holdings/buy-treasury-dialog";
import { CashTransferDialog } from "@/components/holdings/cash-transfer-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

type HoldingsEmptyStateProps = {
  cashBalance: number;
};

export function HoldingsEmptyState({ cashBalance }: HoldingsEmptyStateProps) {
  const needsDeposit = cashBalance <= 0;

  if (needsDeposit) {
    return (
      <Card className="mt-8">
        <CardHeader className="max-w-lg self-center text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step 1 of 2
          </p>
          <CardTitle className="mt-1">Start with cash</CardTitle>
          <CardDescription>
            Deposit funds into your account. After that you can buy stocks or
            Treasuries.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <CashTransferDialog
            cashBalance={cashBalance}
            defaultDirection="DEPOSIT"
            label="Deposit cash"
            variant="default"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader className="max-w-lg self-center text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step 2 of 2
        </p>
        <CardTitle className="mt-1">What do you want to buy?</CardTitle>
        <CardDescription>
          You have {formatCurrency(cashBalance)} available. Pick one asset class
          to start — you can add the other later.
        </CardDescription>
      </CardHeader>
      <CardContent className="mx-auto grid w-full max-w-xl gap-3 pb-8 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <LineChartIcon className="size-4" />
          </div>
          <div>
            <p className="font-medium">Stocks</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Equities with live market prices
            </p>
          </div>
          <BuyStockDialog
            cashBalance={cashBalance}
            label="Buy stock"
            variant="default"
          />
        </div>
        <div className="flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <LandmarkIcon className="size-4" />
          </div>
          <div>
            <p className="font-medium">Treasuries</p>
            <p className="mt-1 text-sm text-muted-foreground">
              US bills, notes, and bonds
            </p>
          </div>
          <BuyTreasuryDialog
            cashBalance={cashBalance}
            label="Buy Treasury"
            variant="default"
          />
        </div>
      </CardContent>
    </Card>
  );
}
