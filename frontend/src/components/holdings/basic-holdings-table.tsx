/**
 * Basic holdings table — used when live prices are unavailable.
 * Falls back from the performance endpoint on 503 errors.
 */

import { HoldingRowActions } from "@/components/holdings/holding-row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  computeCostBasis,
  formatCurrency,
  formatDate,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Holding } from "@/types/holding";

type BasicHoldingsTableProps = {
  holdings: Holding[];
  className?: string;
};

export function BasicHoldingsTable({
  holdings,
  className,
}: BasicHoldingsTableProps) {
  const totalCostBasis = holdings.reduce(
    (sum, holding) =>
      sum + computeCostBasis(holding.quantity_added, holding.purchase_price),
    0,
  );

  return (
    <div className={cn("mt-8 rounded-xl border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Purchase price</TableHead>
            <TableHead>Purchase date</TableHead>
            <TableHead className="text-right">Cost basis</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {holdings.map((holding) => {
            const costBasis = computeCostBasis(
              holding.quantity_added,
              holding.purchase_price,
            );

            return (
              <TableRow key={holding.id}>
                <TableCell className="font-medium">{holding.ticker}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {holding.quantity_added}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(holding.purchase_price)}
                </TableCell>
                <TableCell>
                  {holding.purchase_date
                    ? formatDate(holding.purchase_date)
                    : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(costBasis)}
                </TableCell>
                <TableCell className="text-right">
                  <HoldingRowActions
                    ticker={holding.ticker}
                    quantity={holding.quantity_added}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          {holdings.length} holding{holdings.length === 1 ? "" : "s"}
        </span>
        <span className="font-medium tabular-nums">
          Total cost basis: {formatCurrency(totalCostBasis)}
        </span>
      </div>
    </div>
  );
}
