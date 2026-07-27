/**
 * Recent activity from GET /transactions.
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>
          Buys, sells, and cash transfers for this account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No transactions yet. Deposit cash, then place a buy.
          </p>
        ) : (
          <div className="rounded-xl border">
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
                      <TableCell>{tx.ticker ?? "—"}</TableCell>
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
                        {realized === null
                          ? "—"
                          : formatCurrency(realized)}
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
        )}
      </CardContent>
    </Card>
  );
}
