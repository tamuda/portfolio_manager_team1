/**
 * Shared green/red gain-loss styling so sidebar badges, the detail header,
 * and any future components all agree on what "positive" and "negative"
 * look like. Colors match the existing convention in holdings-table.tsx
 * and the dashboard (text-emerald-600 / text-red-600).
 */

export function isGain(value: number): boolean {
  return value >= 0;
}

/** Plain colored text, e.g. the detail header's price change line. */
export function getChangeTextColor(value: number): string {
  return isGain(value) ? "text-emerald-600" : "text-red-600";
}

/** Solid pill background + white text, e.g. the sidebar's change badge. */
export function getChangePillClasses(value: number): string {
  return isGain(value)
    ? "bg-emerald-600 text-white"
    : "bg-red-600 text-white";
}

/** Chart line/gradient color for the given day's direction (inside a ChartContainer). */
export function getChangeChartColor(value: number): string {
  return isGain(value) ? "var(--color-gain)" : "var(--color-loss)";
}

/** Raw stroke color for charts rendered outside a ChartContainer (e.g. sparklines). */
export function getChangeStrokeColor(value: number): string {
  return isGain(value) ? "#059669" : "#dc2626"; // emerald-600 / red-600
}

/** e.g. "+1.69%" or "-0.42%". Returns "–" when the value is unavailable. */
export function formatChangePercent(value: number | null): string {
  if (value === null) return "–";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
