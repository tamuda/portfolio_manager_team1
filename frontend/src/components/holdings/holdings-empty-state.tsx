import { BuyStockDialog } from "@/components/holdings/buy-stock-dialog";
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

/**
 * Shown when the portfolio has no holdings yet.
 * Cash starts at $0 — prompt deposit first when needed.
 */
export function HoldingsEmptyState({ cashBalance }: HoldingsEmptyStateProps) {
  return (
    <Card className="mt-8">
      <CardHeader className="items-center text-center">
        <CardTitle>No holdings yet</CardTitle>
        <CardDescription>
          {cashBalance <= 0
            ? "Deposit cash, then buy your first stock."
            : `You have ${formatCurrency(cashBalance)} available — buy your first stock to start tracking.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-center gap-2 pb-8">
        <CashTransferDialog
          cashBalance={cashBalance}
          defaultDirection="DEPOSIT"
        />
        <BuyStockDialog
          cashBalance={cashBalance}
          label="Buy your first stock"
        />
      </CardContent>
    </Card>
  );
}
