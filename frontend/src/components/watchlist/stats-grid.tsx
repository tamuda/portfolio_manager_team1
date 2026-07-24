import { formatCompactNumber, formatPrice } from "@/lib/format";
import type { QuoteStats } from "@/types/market-data";

type StatRow = { label: string; value: string };

function StatColumn({ rows }: { rows: StatRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-4 text-sm"
        >
          <span className="text-muted-foreground">{row.label}</span>
          <span className="font-medium tabular-nums">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StatsGrid({ stats }: { stats: QuoteStats }) {
  const columns: StatRow[][] = [
    [
      { label: "Open", value: formatPrice(stats.open) },
      { label: "High", value: formatPrice(stats.high) },
      { label: "Low", value: formatPrice(stats.low) },
    ],
    [
      { label: "Vol", value: formatCompactNumber(stats.volume) },
      { label: "Avg Vol", value: formatCompactNumber(stats.avg_volume) },
    ],
    [
      { label: "52W H", value: formatPrice(stats.fifty_two_week_high) },
      { label: "52W L", value: formatPrice(stats.fifty_two_week_low) },
    ],
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t px-4 py-4 sm:grid-cols-3">
      {columns.map((rows, index) => (
        <StatColumn key={index} rows={rows} />
      ))}
    </div>
  );
}
