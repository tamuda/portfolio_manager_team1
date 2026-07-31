"use client";

/**
 * Table of Treasury holdings with model valuations.
 * Empty state is handled by the parent page (AddAssetClassCard).
 */

import { useState } from "react";

import { SellTreasuryDialog } from "@/components/holdings/sell-treasury-dialog";
import { Button } from "@/components/ui/button";
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
import type { TreasuryHolding, TreasuryValuation } from "@/types/treasury";

type TreasuriesTableProps = {
  valuations: TreasuryValuation[] | null;
  holdings: TreasuryHolding[];
  pricingUnavailable?: boolean;
  className?: string;
};

function formatPercent(value: string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return "—";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

function toCostOnlyValuation(holding: TreasuryHolding): TreasuryValuation {
  const face = parseFloat(holding.face_value);
  const purchase = parseFloat(holding.purchase_price);
  const cost = (face / 100) * purchase;
  return {
    ...holding,
    current_price: holding.purchase_price,
    cost_basis: String(cost),
    market_value: String(cost),
    gain_loss: "0",
    gain_loss_percentage: "0",
  };
}

export function TreasuriesTable({
  valuations,
  holdings,
  pricingUnavailable = false,
  className,
}: TreasuriesTableProps) {
  const [sellTarget, setSellTarget] = useState<TreasuryValuation | null>(null);

  const rows: TreasuryValuation[] =
    valuations && valuations.length > 0
      ? valuations
      : holdings.map(toCostOnlyValuation);

  if (rows.length === 0) return null;

  const totalCost = rows.reduce(
    (sum, row) => sum + parseFloat(row.cost_basis),
    0,
  );
  const totalMarket = rows.reduce(
    (sum, row) => sum + parseFloat(row.market_value),
    0,
  );
  const totalGain = totalMarket - totalCost;

  return (
    <div className={cn("rounded-xl border", className)}>
      {pricingUnavailable && (
        <p className="border-b px-4 py-2 text-xs text-muted-foreground">
          Model pricing unavailable — showing cost basis as market value.
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Face</TableHead>
            <TableHead className="text-right">Coupon</TableHead>
            <TableHead>Maturity</TableHead>
            <TableHead className="text-right">Cost basis</TableHead>
            <TableHead className="text-right">Mark / 100</TableHead>
            <TableHead className="text-right">Market value</TableHead>
            <TableHead className="text-right">Gain / loss</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const gain = parseFloat(row.gain_loss);
            return (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.treasury_type}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(parseFloat(row.face_value))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {parseFloat(row.coupon_rate).toFixed(3)}%
                  {row.coupon_frequency === 0 ? " · zero" : ""}
                </TableCell>
                <TableCell>{formatDate(row.maturity_date)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(parseFloat(row.cost_basis))}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {parseFloat(row.current_price).toFixed(4)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(parseFloat(row.market_value))}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    gain > 0 && "text-emerald-600",
                    gain < 0 && "text-red-600",
                  )}
                >
                  {formatCurrency(gain)}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({formatPercent(row.gain_loss_percentage)})
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSellTarget(row)}
                  >
                    Sell
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-muted/40 font-medium">
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCurrency(totalCost)}
            </TableCell>
            <TableCell />
            <TableCell className="text-right tabular-nums">
              {formatCurrency(totalMarket)}
            </TableCell>
            <TableCell
              className={cn(
                "text-right tabular-nums",
                totalGain > 0 && "text-emerald-600",
                totalGain < 0 && "text-red-600",
              )}
            >
              {formatCurrency(totalGain)}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>

      {sellTarget && (
        <SellTreasuryDialog
          holding={sellTarget}
          open={Boolean(sellTarget)}
          onOpenChange={(next) => {
            if (!next) setSellTarget(null);
          }}
        />
      )}
    </div>
  );
}
