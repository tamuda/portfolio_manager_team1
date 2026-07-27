/**
 * Available cash strip for the portfolios page.
 * Cash starts at $0 — deposit before buying.
 */

import { BuyStockDialog } from "@/components/holdings/buy-stock-dialog";
import { CashTransferDialog } from "@/components/holdings/cash-transfer-dialog";
import { formatCurrency } from "@/lib/format";

type CashBalanceStripProps = {
  cashBalance: number;
};

export function CashBalanceStrip({ cashBalance }: CashBalanceStripProps) {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Available cash</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {formatCurrency(cashBalance)}
        </p>
        {cashBalance <= 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Deposit cash before placing a buy.
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CashTransferDialog cashBalance={cashBalance} />
        <BuyStockDialog cashBalance={cashBalance} />
      </div>
    </div>
  );
}
