/**
 * Display helpers for currency, dates, and portfolio math.
 *
 * The backend sends decimals as JSON strings (Pydantic Decimal serialisation).
 * These helpers parse and format them consistently for the UI.
 */

/** Format a numeric string as USD currency, e.g. "1234.5" → "$1,234.50" */
export function formatCurrency(value: string | number): string {
  const amount = typeof value === "string" ? parseFloat(value) : value;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/** Format an ISO date string for display, e.g. "2024-01-15" → "Jan 15, 2024" */
export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(isoDate));
}

/** Cost basis for one row: quantity added × purchase price */
export function computeCostBasis(quantityAdded: string, purchasePrice: string): number {
  return parseFloat(quantityAdded) * parseFloat(purchasePrice);
}
