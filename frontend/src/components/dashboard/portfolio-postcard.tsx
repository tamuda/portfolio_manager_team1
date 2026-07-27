"use client";

import { forwardRef } from "react";

import { formatChangePercent } from "@/lib/change-color";
import { aggregateByTicker } from "@/lib/portfolio/allocation";
import { cn } from "@/lib/utils";
import type { HoldingPerformance } from "@/types/holding";

export const POSTCARD_STYLES = [
  {
    id: "allocation",
    name: "Allocation",
    blurb: "Return + position mix",
  },
  {
    id: "watchlist",
    name: "Watchlist",
    blurb: "Symbols you’re tracking today",
  },
  {
    id: "benchmark",
    name: "vs SPY",
    blurb: "Portfolio vs benchmark + alpha",
  },
  {
    id: "movers",
    name: "Movers",
    blurb: "Best & worst holdings",
  },
] as const;

export type PostcardStyleId = (typeof POSTCARD_STYLES)[number]["id"];

/** Anonymized watchlist row for share cards (no prices). */
export type SnapshotWatchlistRow = {
  ticker: string;
  changePercent: number | null;
};

/** Precomputed vs-SPY stats for the benchmark card. */
export type SnapshotBenchmark = {
  portfolioReturn: number;
  benchmarkReturn: number;
  alpha: number;
  /** Normalized series (start ≈ 100) for a tiny spark overlay. */
  points: { portfolio: number; benchmark: number }[];
};

type PortfolioPostcardProps = {
  holdings: HoldingPerformance[];
  portfolioReturn: number | null;
  styleId?: PostcardStyleId;
  watchlist?: SnapshotWatchlistRow[];
  benchmark?: SnapshotBenchmark | null;
  benchmarkLoading?: boolean;
  className?: string;
};

type AllocationRow = { ticker: string; share: number };

function formatGeneratedAt() {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

function buildAllocationRows(
  holdings: HoldingPerformance[],
  maxRows: number,
): AllocationRow[] {
  const allocation = aggregateByTicker(holdings)
    .filter((row) => row.share > 0)
    .sort((a, b) => b.share - a.share);

  const top = allocation.slice(0, maxRows);
  const otherShare = allocation
    .slice(maxRows)
    .reduce((sum, row) => sum + row.share, 0);

  return otherShare > 0.05
    ? [...top, { ticker: "Other", share: otherShare }]
    : top;
}

function buildMovers(holdings: HoldingPerformance[]) {
  const byTicker = new Map<
    string,
    { ticker: string; returnPct: number; marketValue: number }
  >();

  for (const holding of holdings) {
    const pct =
      holding.gain_loss_percentage === null
        ? null
        : parseFloat(holding.gain_loss_percentage);
    if (pct === null || Number.isNaN(pct)) continue;

    const marketValue = parseFloat(holding.market_value) || 0;
    const existing = byTicker.get(holding.ticker);
    if (!existing || marketValue > existing.marketValue) {
      byTicker.set(holding.ticker, {
        ticker: holding.ticker,
        returnPct: pct,
        marketValue,
      });
    }
  }

  const sorted = [...byTicker.values()].sort(
    (a, b) => b.returnPct - a.returnPct,
  );
  const gainers = sorted.filter((row) => row.returnPct >= 0).slice(0, 3);
  const losers = sorted
    .filter((row) => row.returnPct < 0)
    .slice(-3)
    .reverse();

  return { gainers, losers };
}

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif';

function returnColor(positive: boolean | null, dark: boolean) {
  if (positive === null) return dark ? "#98989d" : "#86868b";
  if (positive) return dark ? "#30d158" : "#248a3d";
  return dark ? "#ff453a" : "#d70015";
}

function Footer({
  generatedAt,
  muted,
}: {
  generatedAt: string;
  muted: string;
}) {
  return (
    <p
      className="mt-8 text-[11px] font-medium tracking-[-0.01em]"
      style={{ color: muted }}
    >
      {generatedAt}
    </p>
  );
}

function AllocationBars({
  rows,
  track,
  fill,
  label,
  value,
}: {
  rows: AllocationRow[];
  track: string;
  fill: string;
  label: string;
  value: string;
}) {
  return (
    <ul className="space-y-3.5">
      {rows.map((row) => (
        <li key={row.ticker}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span
              className="text-[15px] font-semibold tracking-[-0.02em]"
              style={{ color: label }}
            >
              {row.ticker}
            </span>
            <span
              className="text-[15px] font-medium tabular-nums tracking-[-0.02em]"
              style={{ color: value }}
            >
              {row.share.toFixed(1)}%
            </span>
          </div>
          <div
            className="h-[3px] w-full overflow-hidden rounded-full"
            style={{ background: track }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, row.share))}%`,
                background: fill,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MiniOverlayChart({
  points,
}: {
  points: SnapshotBenchmark["points"];
}) {
  if (points.length < 2) return null;

  const width = 280;
  const height = 88;
  const pad = 4;
  const values = points.flatMap((p) => [p.portfolio, p.benchmark]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const toX = (index: number) =>
    pad + (index / (points.length - 1)) * (width - pad * 2);
  const toY = (value: number) =>
    height - pad - ((value - min) / span) * (height - pad * 2);

  const pathFor = (key: "portfolio" | "benchmark") =>
    points
      .map((point, index) => {
        const x = toX(index);
        const y = toY(point[key]);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-5 w-full"
      aria-hidden
    >
      <path
        d={pathFor("benchmark")}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={pathFor("portfolio")}
        fill="none"
        stroke="#0a84ff"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Allocation — return hero + mix. */
function AllocationCard({
  holdings,
  portfolioReturn,
}: {
  holdings: HoldingPerformance[];
  portfolioReturn: number | null;
}) {
  const rows = buildAllocationRows(holdings, 5);
  const generatedAt = formatGeneratedAt();
  const returnPositive =
    portfolioReturn !== null ? portfolioReturn >= 0 : null;
  const returnLabel =
    portfolioReturn === null ? "—" : formatChangePercent(portfolioReturn);

  return (
    <div
      style={{
        fontFamily: FONT,
        background:
          "linear-gradient(165deg, #fbfbfd 0%, #f5f5f7 48%, #ececf0 100%)",
      }}
      className="relative h-full w-[360px] overflow-hidden rounded-[28px] text-[#1d1d1f]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 20% 0%, rgba(255,255,255,0.9), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(0,113,227,0.06), transparent 50%)",
        }}
      />
      <div className="relative flex h-full flex-col px-8 pb-7 pt-8">
        <p className="text-[13px] font-medium" style={{ color: "#86868b" }}>
          Portfolio
        </p>
        <h2 className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.035em]">
          Allocation
        </h2>
        <div className="mt-10">
          <p className="text-[12px] font-medium" style={{ color: "#86868b" }}>
            Return
          </p>
          <p
            className="mt-1 text-[52px] font-semibold leading-none tracking-[-0.045em] tabular-nums"
            style={{ color: returnColor(returnPositive, false) }}
          >
            {returnLabel}
          </p>
        </div>
        <div
          className="mt-10 flex-1 border-t pt-6"
          style={{ borderColor: "rgba(0,0,0,0.06)" }}
        >
          <p
            className="mb-4 text-[12px] font-medium"
            style={{ color: "#86868b" }}
          >
            Weight
          </p>
          <AllocationBars
            rows={rows}
            track="rgba(0,0,0,0.06)"
            fill="#1d1d1f"
            label="#1d1d1f"
            value="#6e6e73"
          />
        </div>
        <Footer generatedAt={generatedAt} muted="#aeaeb2" />
      </div>
    </div>
  );
}

/** Watchlist — today’s tracked symbols (change % only). */
function WatchlistCard({ watchlist }: { watchlist: SnapshotWatchlistRow[] }) {
  const generatedAt = formatGeneratedAt();
  const rows = watchlist.slice(0, 6);

  return (
    <div
      style={{ fontFamily: FONT, background: "#ffffff" }}
      className="relative flex h-full w-[360px] flex-col overflow-hidden rounded-[28px] text-[#1d1d1f]"
    >
      <div className="flex h-full flex-col px-8 pb-7 pt-8">
        <p
          className="text-[12px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "#aeaeb2" }}
        >
          Watchlist
        </p>
        <h2 className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.035em]">
          Today
        </h2>

        <div className="mt-8 flex-1">
          {rows.length === 0 ? (
            <p className="text-[15px]" style={{ color: "#86868b" }}>
              No symbols on your watchlist yet.
            </p>
          ) : (
            <ul>
              {rows.map((row, index) => {
                const positive =
                  row.changePercent === null
                    ? null
                    : row.changePercent >= 0;
                return (
                  <li
                    key={row.ticker}
                    className="flex items-center justify-between py-3.5"
                    style={{
                      borderTop:
                        index === 0
                          ? undefined
                          : "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <span className="text-[17px] font-semibold tracking-[-0.02em]">
                      {row.ticker}
                    </span>
                    <span
                      className="text-[17px] font-semibold tabular-nums tracking-[-0.02em]"
                      style={{ color: returnColor(positive, false) }}
                    >
                      {formatChangePercent(row.changePercent)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Footer generatedAt={generatedAt} muted="#c7c7cc" />
      </div>
    </div>
  );
}

/** Benchmark — portfolio vs SPY. */
function BenchmarkCard({
  benchmark,
  loading,
}: {
  benchmark: SnapshotBenchmark | null;
  loading: boolean;
}) {
  const generatedAt = formatGeneratedAt();
  const alphaPositive =
    benchmark !== null ? benchmark.alpha >= 0 : null;

  return (
    <div
      style={{
        fontFamily: FONT,
        background:
          "linear-gradient(165deg, #1c1c1e 0%, #000000 55%, #0a0a0a 100%)",
      }}
      className="relative h-full w-[360px] overflow-hidden rounded-[28px] text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 80% 0%, rgba(10,132,255,0.18), transparent 50%)",
        }}
      />
      <div className="relative flex h-full flex-col px-8 pb-7 pt-8">
        <p className="text-[13px] font-medium" style={{ color: "#98989d" }}>
          3M performance
        </p>
        <h2 className="mt-1 text-[28px] font-semibold leading-none tracking-[-0.035em]">
          vs SPY
        </h2>

        {loading && !benchmark ? (
          <p className="mt-16 text-[15px]" style={{ color: "#98989d" }}>
            Loading comparison…
          </p>
        ) : !benchmark ? (
          <p className="mt-16 text-[15px]" style={{ color: "#98989d" }}>
            Benchmark data unavailable.
          </p>
        ) : (
          <>
            <div className="mt-10">
              <p
                className="text-[12px] font-medium"
                style={{ color: "#98989d" }}
              >
                Alpha
              </p>
              <p
                className="mt-1 text-[52px] font-semibold leading-none tracking-[-0.045em] tabular-nums"
                style={{ color: returnColor(alphaPositive, true) }}
              >
                {formatChangePercent(benchmark.alpha)}
              </p>
            </div>

            <MiniOverlayChart points={benchmark.points} />

            <div
              className="mt-8 grid grid-cols-2 gap-4 border-t pt-5"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div>
                <p
                  className="text-[11px] font-medium"
                  style={{ color: "#98989d" }}
                >
                  Portfolio
                </p>
                <p
                  className="mt-1 text-[20px] font-semibold tabular-nums tracking-[-0.03em]"
                  style={{
                    color: returnColor(benchmark.portfolioReturn >= 0, true),
                  }}
                >
                  {formatChangePercent(benchmark.portfolioReturn)}
                </p>
              </div>
              <div>
                <p
                  className="text-[11px] font-medium"
                  style={{ color: "#98989d" }}
                >
                  SPY
                </p>
                <p
                  className="mt-1 text-[20px] font-semibold tabular-nums tracking-[-0.03em]"
                  style={{
                    color: returnColor(benchmark.benchmarkReturn >= 0, true),
                  }}
                >
                  {formatChangePercent(benchmark.benchmarkReturn)}
                </p>
              </div>
            </div>
          </>
        )}

        <div className="mt-auto">
          <Footer generatedAt={generatedAt} muted="#636366" />
        </div>
      </div>
    </div>
  );
}

/** Movers — best / worst holding returns. */
function MoversCard({ holdings }: { holdings: HoldingPerformance[] }) {
  const generatedAt = formatGeneratedAt();
  const { gainers, losers } = buildMovers(holdings);

  function Section({
    title,
    rows,
  }: {
    title: string;
    rows: { ticker: string; returnPct: number }[];
  }) {
    return (
      <div>
        <p className="mb-2 text-[12px] font-medium" style={{ color: "#8e8e93" }}>
          {title}
        </p>
        {rows.length === 0 ? (
          <p className="text-[14px]" style={{ color: "#aeaeb2" }}>
            —
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl bg-white">
            {rows.map((row, index) => (
              <li
                key={row.ticker}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderTop:
                    index === 0 ? undefined : "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <span className="text-[15px] font-semibold tracking-[-0.02em]">
                  {row.ticker}
                </span>
                <span
                  className="text-[15px] font-semibold tabular-nums"
                  style={{
                    color: returnColor(row.returnPct >= 0, false),
                  }}
                >
                  {formatChangePercent(row.returnPct)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: FONT, background: "#f2f2f7" }}
      className="relative h-full w-[360px] overflow-hidden rounded-[28px] text-[#1d1d1f]"
    >
      <div className="flex h-full flex-col px-7 pb-6 pt-7">
        <p className="text-[12px] font-medium" style={{ color: "#8e8e93" }}>
          Holdings
        </p>
        <h2 className="mt-0.5 text-[24px] font-semibold tracking-[-0.03em]">
          Movers
        </h2>

        <div className="mt-6 flex flex-1 flex-col gap-5">
          <Section title="Top" rows={gainers} />
          <Section title="Bottom" rows={losers} />
        </div>

        <Footer generatedAt={generatedAt} muted="#aeaeb2" />
      </div>
    </div>
  );
}

export const PortfolioPostcard = forwardRef<
  HTMLDivElement,
  PortfolioPostcardProps
>(function PortfolioPostcard(
  {
    holdings,
    portfolioReturn,
    styleId = "allocation",
    watchlist = [],
    benchmark = null,
    benchmarkLoading = false,
    className,
  },
  ref,
) {
  return (
    <div ref={ref} className={cn("h-[520px]", className)}>
      {styleId === "allocation" && (
        <AllocationCard
          holdings={holdings}
          portfolioReturn={portfolioReturn}
        />
      )}
      {styleId === "watchlist" && <WatchlistCard watchlist={watchlist} />}
      {styleId === "benchmark" && (
        <BenchmarkCard benchmark={benchmark} loading={benchmarkLoading} />
      )}
      {styleId === "movers" && <MoversCard holdings={holdings} />}
    </div>
  );
});
