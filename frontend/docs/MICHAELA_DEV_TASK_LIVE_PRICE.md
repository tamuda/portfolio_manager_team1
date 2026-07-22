# Michaela's Task: Live Price Column

**Your mission:** Add a **"Current price"** column to the holdings table that fetches live (cached) stock prices from an external API.

This is your first step toward portfolio **performance** features (Sprint 2). You'll practice:

- Calling an external API from Next.js
- Building a small Client Component
- Wiring new data into an existing table

**Estimated time:** 2–4 hours (take your time — ask questions!)

**Supported tickers on the sample API:** `C`, `AMZN`, `TSLA`, `FB`, `AAPL`

---

## Before you start

1. Make sure both servers are running:

```bash
# Terminal 1 — backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
cp .env.example .env.local   # only needed once
npm run dev
```

2. Open http://localhost:3000/portfolios and add a holding with ticker **AAPL** (or another supported ticker above).

3. Skim these existing files so you know the patterns:

| File | What it does |
|------|----------------|
| `src/lib/api/client.ts` | Shared fetch wrapper for our backend |
| `src/lib/api/holdings.ts` | Holdings CRUD — copy this structure |
| `src/components/holdings/holdings-table.tsx` | Table you'll modify (look for the TODO comment) |
| `src/lib/format.ts` | `formatCurrency()` — reuse this for prices |

---

## What you're building

```
Holdings table (today)                Holdings table (after your work)
─────────────────────                 ────────────────────────────────
Ticker | Qty | Price | Date | ...     Ticker | Qty | Price | Date | Current price | ...
AAPL   | 10  | $150  | ...  | ...     AAPL   | 10  | $150  | ...  | $328.16       | ...
```

Each row will fetch its own price when the page loads. While loading, show `…`. If the ticker isn't supported, show `N/A`.

---

## Step 1 — Create the price API helper

Create a **new file**: `src/lib/api/prices.ts`

Copy this entire block, then read the comments:

```typescript
/**
 * Live price API — uses the Neueda training sample endpoint.
 *
 * Docs: project README Appendix D (Financial Data)
 * URL:  https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData
 *
 * NOTE: This is NOT our FastAPI backend. It's a separate service that caches
 * Yahoo Finance data. Later, our backend team may move this logic server-side.
 */

const PRICE_API_BASE =
  "https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData";

/** Shape of the JSON returned by the sample API */
type PriceApiResponse = {
  ticker: string;
  price_data: {
    close: number[];
    // The API returns more fields (high, low, open, etc.) — we only need close.
  };
};

/**
 * Fetch the latest closing price for a ticker.
 *
 * @returns The most recent close price as a number, or null if unavailable.
 */
export async function getLatestPrice(ticker: string): Promise<number | null> {
  const url = `${PRICE_API_BASE}?ticker=${encodeURIComponent(ticker)}`;

  const response = await fetch(url, {
    // Re-fetch on each page load so prices stay reasonably fresh.
    cache: "no-store",
  });

  if (!response.ok) {
    // Ticker not found or API error — return null so the UI can show "N/A".
    return null;
  }

  const data = (await response.json()) as PriceApiResponse;
  const closes = data.price_data?.close;

  if (!closes || closes.length === 0) {
    return null;
  }

  // The last entry in the close array is the most recent price.
  return closes[closes.length - 1];
}
```

**Modify nothing yet** — save the file and make sure TypeScript is happy (no red squiggles).

---

## Step 2 — Create a Next.js Route Handler (proxy)

Browsers sometimes block direct calls to other domains (CORS). To avoid that, we'll proxy the request through our own Next.js server.

Create a **new file**: `src/app/api/price/route.ts`

```typescript
/**
 * GET /api/price?ticker=AAPL
 *
 * Proxies the sample price API so the browser only talks to localhost:3000.
 * This is a common pattern — the frontend calls our route, our route calls the external API.
 */

import { NextRequest, NextResponse } from "next/server";

import { getLatestPrice } from "@/lib/api/prices";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing ticker query parameter" },
      { status: 400 },
    );
  }

  const price = await getLatestPrice(ticker.toUpperCase());

  if (price === null) {
    return NextResponse.json(
      { error: `No price data for ${ticker}` },
      { status: 404 },
    );
  }

  return NextResponse.json({ ticker: ticker.toUpperCase(), price });
}
```

**Test it manually** before moving on. With the frontend dev server running:

```bash
curl "http://localhost:3000/api/price?ticker=AAPL"
```

You should see something like:

```json
{"ticker":"AAPL","price":328.16}
```

Try an unsupported ticker too:

```bash
curl "http://localhost:3000/api/price?ticker=INVALID"
```

You should get a 404 — that's expected.

---

## Step 3 — Create the LivePriceCell component

This is a **Client Component** because it uses `useEffect` to fetch data after the page renders.

Create a **new file**: `src/components/holdings/live-price-cell.tsx`

```tsx
"use client";

/**
 * Fetches and displays the current price for one ticker.
 *
 * Used inside HoldingsTable — one cell per row.
 * Calls our Next.js route handler (/api/price) rather than the external API directly.
 */

import { useEffect, useState } from "react";

import { formatCurrency } from "@/lib/format";

type LivePriceCellProps = {
  ticker: string;
};

type PriceState =
  | { status: "loading" }
  | { status: "success"; price: number }
  | { status: "error" };

export function LivePriceCell({ ticker }: LivePriceCellProps) {
  const [state, setState] = useState<PriceState>({ status: "loading" });

  useEffect(() => {
    // Reset when ticker changes (e.g. after adding a new holding).
    setState({ status: "loading" });

    async function fetchPrice() {
      try {
        const response = await fetch(
          `/api/price?ticker=${encodeURIComponent(ticker)}`,
        );

        if (!response.ok) {
          setState({ status: "error" });
          return;
        }

        const data = (await response.json()) as { price: number };
        setState({ status: "success", price: data.price });
      } catch {
        setState({ status: "error" });
      }
    }

    fetchPrice();
  }, [ticker]);

  if (state.status === "loading") {
    return <span className="text-muted-foreground">…</span>;
  }

  if (state.status === "error") {
    return <span className="text-muted-foreground">N/A</span>;
  }

  return (
    <span className="tabular-nums">{formatCurrency(state.price)}</span>
  );
}
```

---

## Step 4 — Add the column to the holdings table

Open `src/components/holdings/holdings-table.tsx`.

### 4a. Add the import at the top

Find the existing imports and add this line:

```typescript
import { LivePriceCell } from "@/components/holdings/live-price-cell";
```

### 4b. Add the column header

Find the `{/* TODO (Michaela): add "Current price" column ... */}` comment in `<TableHeader>`.

**Replace that comment** with:

```tsx
<TableHead className="text-right">Current price</TableHead>
```

### 4c. Add the cell in each row

Find the `<TableCell>` that shows cost basis (the one with `formatCurrency(costBasis)`).

**After that cell**, add:

```tsx
<TableCell className="text-right">
  <LivePriceCell ticker={holding.ticker} />
</TableCell>
```

Save the file and refresh http://localhost:3000/portfolios. You should see live prices for supported tickers!

---

## Step 5 — Verify your work

Use this checklist:

- [ ] AAPL (or other supported ticker) shows a dollar amount in **Current price**
- [ ] While loading, the cell shows `…`
- [ ] An unsupported ticker (e.g. `XYZ`) shows `N/A`
- [ ] Adding a new holding refreshes the price for that row
- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` completes successfully

---

## Stretch goals (optional — only if you finish early)

These connect to what you'll build in Sprint 2:

### A. Market value column

Add another column: **Market value** = `quantity × current price`.

You'll need to lift price state up or pass a callback from `LivePriceCell` — ask the team which pattern they prefer.

### B. "Refresh prices" button

Add a button above the table that re-fetches all prices. Hint: use a `key` prop on `LivePriceCell` and increment it on click.

### C. Explore yfinance on the backend

The training README mentions [yfinance](https://pypi.org/project/yfinance/) for Python. Eventually the **backend** will fetch prices so the frontend doesn't call Yahoo directly. Read Appendix D in the project README and talk to the backend team about adding a `GET /holdings?include=performance` endpoint.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| Column shows `N/A` for AAPL | Route handler not working | Test with `curl localhost:3000/api/price?ticker=AAPL` |
| `N/A` for every ticker | Typo in ticker or API down | Check browser Network tab (F12 → Network) |
| Page crashes with hydration error | Missing `"use client"` | Make sure `live-price-cell.tsx` starts with `"use client";` |
| TypeScript error on import | Wrong file path | Paths use `@/` which maps to `src/` (see `tsconfig.json`) |

---

## Files you will create / modify

| Action | File |
|--------|------|
| **Create** | `src/lib/api/prices.ts` |
| **Create** | `src/app/api/price/route.ts` |
| **Create** | `src/components/holdings/live-price-cell.tsx` |
| **Modify** | `src/components/holdings/holdings-table.tsx` |

When you're done, open a PR with title: `feat: add live price column to holdings table`

Good luck — this is exactly how real apps connect to live market data.
