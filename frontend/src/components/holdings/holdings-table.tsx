/**
 * Read-only table of portfolio holdings.
 *
 * This is a Server Component — it receives data fetched on the page and
 * renders HTML. Only the Delete button (per row) is a Client Component.
 *
 * NOTE: The "Current price" column is intentionally left out.
 * See docs/MICHAELA_DEV_TASK_LIVE_PRICE.md for implementation steps.
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
import {
  computeCostBasis,
  formatCurrency,
  formatDate,
} from "@/lib/format";
import type { Holding } from "@/types/holding";

type HoldingsTableProps = {
  holdings: Holding[];
};

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const totalCostBasis = holdings.reduce(
    (sum, holding) =>
      sum + computeCostBasis(holding.quantity, holding.purchase_price),
    0,
  );

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
            {/* TODO (Michaela): add "Current price" column — see docs/MICHAELA_DEV_TASK_LIVE_PRICE.md */}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {holdings.map((holding) => {
            const costBasis = computeCostBasis(
              holding.quantity,
              holding.purchase_price,
            );

            return (
              <TableRow key={holding.id}>
                <TableCell className="font-medium">{holding.ticker}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {holding.quantity}
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
                  <DeleteHoldingButton holding={holding} />
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
