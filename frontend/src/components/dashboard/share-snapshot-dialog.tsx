"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ShareIcon,
} from "lucide-react";

import { getQuoteAction } from "@/app/watchlist/actions";
import {
  PortfolioPostcard,
  POSTCARD_STYLES,
  type PostcardStyleId,
  type SnapshotBenchmark,
  type SnapshotWatchlistRow,
} from "@/components/dashboard/portfolio-postcard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  aggregateQuantities,
  buildBenchmarkSeries,
} from "@/lib/benchmark/build-series";
import { cn } from "@/lib/utils";
import type { HoldingPerformance } from "@/types/holding";
import type { PricePoint, TimeRange } from "@/types/market-data";

const BENCHMARK_TICKER = "SPY";
const BENCHMARK_RANGE: TimeRange = "3M";

type ShareSnapshotDialogProps = {
  holdings: HoldingPerformance[];
  portfolioReturn: number | null;
  watchlist?: SnapshotWatchlistRow[];
};

export function ShareSnapshotDialog({
  holdings,
  portfolioReturn,
  watchlist = [],
}: ShareSnapshotDialogProps) {
  const [open, setOpen] = useState(false);
  const [styleId, setStyleId] = useState<PostcardStyleId>("allocation");
  const [busy, setBusy] = useState<"download" | "copy" | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState<SnapshotBenchmark | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Map<PostcardStyleId, HTMLButtonElement>>(new Map());

  const selectedMeta =
    POSTCARD_STYLES.find((style) => style.id === styleId) ?? POSTCARD_STYLES[0];

  const quantities = useMemo(
    () =>
      aggregateQuantities(
        holdings.map((holding) => ({
          ticker: holding.ticker,
          quantity: parseFloat(holding.quantity_added),
        })),
      ),
    [holdings],
  );

  const tickers = useMemo(() => [...quantities.keys()], [quantities]);

  useEffect(() => {
    if (!open) return;
    const node = slideRefs.current.get(styleId);
    node?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [open, styleId]);

  useEffect(() => {
    if (!open || tickers.length === 0) return;

    let cancelled = false;
    setBenchmarkLoading(true);

    async function loadBenchmark() {
      const holdingPoints = new Map<string, PricePoint[]>();
      const settled = await Promise.allSettled(
        tickers.map(async (ticker) => {
          const response = await getQuoteAction(ticker, BENCHMARK_RANGE);
          if (!response.success || !response.quote) {
            throw new Error(response.error ?? `Failed to load ${ticker}`);
          }
          return { ticker, points: response.quote.points };
        }),
      );

      for (const entry of settled) {
        if (entry.status === "fulfilled") {
          holdingPoints.set(entry.value.ticker, entry.value.points);
        }
      }

      const benchmarkResult = await getQuoteAction(
        BENCHMARK_TICKER,
        BENCHMARK_RANGE,
      );

      if (cancelled) return;

      if (!benchmarkResult.success || !benchmarkResult.quote) {
        setBenchmark(null);
        setBenchmarkLoading(false);
        return;
      }

      const series = buildBenchmarkSeries({
        quantities,
        holdingPoints,
        benchmarkPoints: benchmarkResult.quote.points,
      });

      if (series.points.length < 2) {
        setBenchmark(null);
      } else {
        const step = Math.max(1, Math.floor(series.points.length / 40));
        const sampled = series.points
          .filter((_, index) => index % step === 0)
          .map((point) => ({
            portfolio: point.portfolio,
            benchmark: point.benchmark,
          }));

        setBenchmark({
          portfolioReturn: series.portfolioReturn,
          benchmarkReturn: series.benchmarkReturn,
          alpha: series.alpha,
          points: sampled,
        });
      }
      setBenchmarkLoading(false);
    }

    void loadBenchmark();

    return () => {
      cancelled = true;
    };
  }, [open, quantities, tickers]);

  async function capturePng(): Promise<string> {
    const node = cardRef.current;
    if (!node) throw new Error("Snapshot card is not ready.");

    const isDark = styleId === "benchmark";
    return toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: isDark ? "#000000" : "#f5f5f7",
    });
  }

  async function handleDownload() {
    setBusy("download");
    setError(null);
    try {
      const dataUrl = await capturePng();
      const link = document.createElement("a");
      link.download = `portfolio-snapshot-${styleId}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("Could not export the image. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy() {
    setBusy("copy");
    setError(null);
    setCopied(false);
    try {
      const dataUrl = await capturePng();
      const blob = await (await fetch(dataUrl)).blob();

      if (!("clipboard" in navigator) || !("ClipboardItem" in window)) {
        setError("Copy image isn’t supported in this browser. Download instead.");
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the image. Try downloading instead.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError(null);
          setCopied(false);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5" />
        }
      >
        <ShareIcon data-icon="inline-start" />
        Share snapshot
      </DialogTrigger>

      <DialogContent className="overflow-hidden border-border/60 bg-[#f5f5f7] p-0 sm:max-w-2xl">
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="tracking-tight">Share snapshot</DialogTitle>
            <DialogDescription className="sr-only">
              Choose a snapshot style to copy or download.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-baseline justify-between gap-3">
            <div>
              <p className="text-sm font-semibold tracking-tight">
                {selectedMeta.name}
              </p>
              <p className="text-xs text-muted-foreground">{selectedMeta.blurb}</p>
            </div>
            <div className="flex gap-1.5">
              {POSTCARD_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  aria-label={style.name}
                  aria-pressed={styleId === style.id}
                  onClick={() => setStyleId(style.id)}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    styleId === style.id ? "bg-[#1d1d1f]" : "bg-black/15",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 py-5 scroll-px-6 scrollbar-none">
          {POSTCARD_STYLES.map((style) => {
            const selected = styleId === style.id;
            return (
              <button
                key={style.id}
                type="button"
                ref={(node) => {
                  if (node) slideRefs.current.set(style.id, node);
                  else slideRefs.current.delete(style.id);
                }}
                onClick={() => setStyleId(style.id)}
                className={cn(
                  "shrink-0 snap-center rounded-[30px] text-left transition-[transform,box-shadow,opacity] duration-300 outline-none",
                  selected
                    ? "scale-100 opacity-100 shadow-[0_16px_48px_rgba(0,0,0,0.14)] ring-2 ring-[#1d1d1f]/80 ring-offset-4 ring-offset-[#f5f5f7]"
                    : "scale-[0.94] opacity-55 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:opacity-80",
                )}
              >
                <PortfolioPostcard
                  ref={selected ? cardRef : undefined}
                  holdings={holdings}
                  portfolioReturn={portfolioReturn}
                  styleId={style.id}
                  watchlist={watchlist}
                  benchmark={benchmark}
                  benchmarkLoading={benchmarkLoading}
                />
              </button>
            );
          })}
        </div>

        {error && (
          <p className="px-6 pb-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 bg-white/70 px-6 py-4 backdrop-blur-sm">
          <p className="text-xs text-muted-foreground">
            Swipe or tap a card to select
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleCopy();
              }}
              disabled={busy !== null}
            >
              {copied ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CopyIcon data-icon="inline-start" />
              )}
              {copied ? "Copied" : busy === "copy" ? "Copying…" : "Copy"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleDownload();
              }}
              disabled={busy !== null}
            >
              <DownloadIcon data-icon="inline-start" />
              {busy === "download" ? "Exporting…" : "Download"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
