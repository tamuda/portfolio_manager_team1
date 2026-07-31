/**
 * Recent activity from GET /transactions.
 * Collapsed by default so the holdings sections stay the focus.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

type TransactionsActivityProps = {
  transactions: Transaction[];
};

function typeLabel(type: Transaction["type"]): string {
  switch (type) {
    case "BUY":
      return "Buy";
    case "SELL":
      return "Sell";
    case "TRANSFER_IN":
      return "Deposit";
    case "TRANSFER_OUT":
      return "Withdrawal";
  }
}

function formatExecutedAt(value: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return formatDate(value.slice(0, 10));
  }
}

export function TransactionsActivity({
  transactions,
}: TransactionsActivityProps) {
  const rows = [...transactions].sort(
    (a, b) =>
      new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime(),
  );

  if (rows.length === 0) return null;

  return (
    <details className="group mt-10 overflow-hidden rounded-xl border">
      <summary className="cursor-pointer list-none px-4 py-3 transition-colors hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Activity</p>
            <p className="text-sm text-muted-foreground">
              {rows.length} transaction{rows.length === 1 ? "" : "s"} · buys,
              sells, and cash transfers
            </p>
          </div>
          <span className="text-sm text-muted-foreground group-open:hidden">
            Show
          </span>
          <span className="hidden text-sm text-muted-foreground group-open:inline">
            Hide
          </span>
        </div>
      </summary>

      <div className="border-t">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Realized P/L</TableHead>
              <TableHead className="text-right">Cash after</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((tx) => {
              const realized =
                tx.realized_gain_loss !== null
                  ? parseFloat(tx.realized_gain_loss)
                  : null;

              return (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatExecutedAt(tx.executed_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {typeLabel(tx.type)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      {tx.ticker ?? "—"}
                      {tx.ticker?.startsWith("UST-") && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Treasury
                        </span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {tx.quantity ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      realized !== null &&
                        (realized >= 0
                          ? "text-emerald-600"
                          : "text-red-600"),
                    )}
                  >
                    {realized === null ? "—" : formatCurrency(realized)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(tx.cash_balance_after)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </details>
  );
}
