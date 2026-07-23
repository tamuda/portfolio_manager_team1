/**
 * Table of portfolio holdings with live performance data from the backend.
 *
 * Data comes from GET /api/v1/holdings/performance (yfinance on the server).
 * Only the Delete button (per row) is a Client Component.
 */

import { DeleteHoldingButton } from "@/components/holdings/delete-holding-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { HoldingPerformance } from "@/types/holding";
import { cn } from "@/lib/utils";

type HoldingsTableProps = {
  holdings: HoldingPerformance[];
};

function formatPercent(value: string | null): string {
  if (value === null) return "—";
  const num = parseFloat(value);
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const totalCostBasis = holdings.reduce(
    (sum, h) => sum + parseFloat(h.cost_basis),
    0,
  );
  const totalMarketValue = holdings.reduce(
    (sum, h) => sum + parseFloat(h.market_value),
    0,
  );
  const totalGainLoss = totalMarketValue - totalCostBasis;

  return (
    <div className="mt-8 rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Purchase price</TableHead>
            <TableHead>Purchase date</TableHead>
            <TableHead className="text-right">Cost basis</TableHead>
            <TableHead className="text-right">Current price</TableHead>
            <TableHead className="text-right">Market value</TableHead>
            <TableHead className="text-right">Gain / loss</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {holdings.map((holding) => {
            const gainLoss = parseFloat(holding.gain_loss);
            const isPositive = gainLoss >= 0;

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
                  {formatCurrency(holding.cost_basis)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(holding.current_price)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(holding.market_value)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    isPositive ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {formatCurrency(holding.gain_loss)}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({formatPercent(holding.gain_loss_percentage)})
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {/* TODO (Michaela): replace with <HoldingRowActions holding={holding} /> — see docs/MICHAELA_DEV_TASK_EDIT_HOLDING.md */}
                  <DeleteHoldingButton holding={holding} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-1 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground">
          {holdings.length} holding{holdings.length === 1 ? "" : "s"}
        </span>
        <div className="flex flex-col gap-0.5 text-right sm:items-end">
          <span className="tabular-nums">
            Cost basis: {formatCurrency(totalCostBasis)}
          </span>
          <span className="font-medium tabular-nums">
            Market value: {formatCurrency(totalMarketValue)}
            <span
              className={cn(
                "ml-2 text-sm",
                totalGainLoss >= 0 ? "text-emerald-600" : "text-red-600",
              )}
            >
              ({totalGainLoss >= 0 ? "+" : ""}
              {formatCurrency(totalGainLoss)})
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
