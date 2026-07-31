/**
 * Cash strip — funding only.
 * Buy actions live next to each asset section, not here.
 */

import { CashTransferDialog } from "@/components/holdings/cash-transfer-dialog";
import { formatCurrency } from "@/lib/format";

type CashBalanceStripProps = {
  cashBalance: number;
};

export function CashBalanceStrip({ cashBalance }: CashBalanceStripProps) {
  const needsDeposit = cashBalance <= 0;

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Available cash</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {formatCurrency(cashBalance)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CashTransferDialog
          cashBalance={cashBalance}
          defaultDirection="DEPOSIT"
          label={needsDeposit ? "Deposit cash" : "Manage cash"}
          variant={needsDeposit ? "default" : "outline"}
        />
      </div>
    </div>
  );
}
