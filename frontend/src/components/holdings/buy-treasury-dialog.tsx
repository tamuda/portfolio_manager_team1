"use client";

/**
 * Buy a US Treasury lot via POST /treasury/buy.
 * Preset catalog + FRED-suggested price; all terms editable in Advanced.
 */

import { useEffect, useState, useTransition } from "react";
import { LandmarkIcon } from "lucide-react";

import {
  buyTreasuryAction,
  getYieldCurveAction,
} from "@/app/portfolios/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import {
  TREASURY_PRESETS,
  addYearsToDate,
  nearestYield,
  suggestPricePerHundred,
  toDateInputValue,
  type TreasuryPresetId,
} from "@/lib/treasury/presets";
import { cn } from "@/lib/utils";
import type { TreasuryType } from "@/types/treasury";

type BuyTreasuryDialogProps = {
  cashBalance: number;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  /** Controlled open — when set, no trigger button is rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function todayDateString() {
  return toDateInputValue(new Date());
}

export function BuyTreasuryDialog({
  cashBalance,
  label = "Buy Treasury",
  variant = "default",
  open: openProp,
  onOpenChange,
}: BuyTreasuryDialogProps) {
  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? openProp : internalOpen;

  function setOpen(next: boolean) {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
  }
  const [presetId, setPresetId] = useState<TreasuryPresetId>("3m_bill");
  const [faceValue, setFaceValue] = useState("1000");
  const [treasuryType, setTreasuryType] = useState<TreasuryType>("BILL");
  const [couponRate, setCouponRate] = useState("0");
  const [couponFrequency, setCouponFrequency] = useState("0");
  const [maturityDate, setMaturityDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("100");
  const [purchaseDate, setPurchaseDate] = useState(todayDateString());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [curveHint, setCurveHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCurvePending, startCurveTransition] = useTransition();

  const preset = TREASURY_PRESETS.find((item) => item.id === presetId)!;

  function applyPreset(
    nextId: TreasuryPresetId,
    points: { tenor_years: number; yield_percent: string }[] = [],
  ) {
    const next = TREASURY_PRESETS.find((item) => item.id === nextId)!;
    const yieldPct = nearestYield(points, next.tenorYears);
    const coupon =
      next.couponFrequency === 0 ? 0 : (yieldPct ?? 4);
    const price = suggestPricePerHundred({
      treasuryType: next.treasuryType,
      couponRate: coupon,
      couponFrequency: next.couponFrequency,
      tenorYears: next.tenorYears,
      yieldPercent: yieldPct,
    });

    setPresetId(nextId);
    setTreasuryType(next.treasuryType);
    setCouponFrequency(String(next.couponFrequency));
    setCouponRate(coupon.toFixed(3));
    setMaturityDate(
      toDateInputValue(addYearsToDate(new Date(), next.tenorYears)),
    );
    setPurchasePrice(price.toFixed(4));
    setPurchaseDate(todayDateString());

    if (yieldPct !== null) {
      setCurveHint(
        `Suggested from FRED ~${yieldPct.toFixed(2)}% yield for ${next.label}.`,
      );
    } else {
      setCurveHint(
        "Yield curve unavailable — using placeholder price. Edit Advanced if needed.",
      );
    }
  }

  useEffect(() => {
    if (!open) return;

    setFaceValue("1000");
    setShowAdvanced(false);
    setError(null);

    startCurveTransition(async () => {
      const result = await getYieldCurveAction();
      applyPreset("3m_bill", result.success ? (result.curve?.points ?? []) : []);
      if (!result.success) {
        setCurveHint(
          result.error ??
            "Yield curve unavailable — using placeholder price. Edit Advanced if needed.",
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when dialog opens
  }, [open]);

  const faceNum = Number(faceValue);
  const priceNum = Number(purchasePrice);
  const estimatedCost =
    Number.isFinite(faceNum) &&
    faceNum > 0 &&
    Number.isFinite(priceNum) &&
    priceNum > 0
      ? (faceNum / 100) * priceNum
      : null;

  const canSubmit =
    estimatedCost !== null &&
    estimatedCost > 0 &&
    estimatedCost <= cashBalance &&
    maturityDate.length > 0 &&
    !isPending;

  function handlePresetClick(id: TreasuryPresetId) {
    startCurveTransition(async () => {
      const result = await getYieldCurveAction();
      applyPreset(id, result.success ? (result.curve?.points ?? []) : []);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (estimatedCost === null) {
      setError("Enter a valid face value and purchase price.");
      return;
    }
    if (estimatedCost > cashBalance) {
      setError(
        `This purchase costs ${formatCurrency(estimatedCost)}, which exceeds available cash.`,
      );
      return;
    }

    startTransition(async () => {
      const result = await buyTreasuryAction({
        treasury_type: treasuryType,
        face_value: String(faceNum),
        coupon_rate: couponRate,
        coupon_frequency: Number(couponFrequency) || 0,
        maturity_date: maturityDate,
        purchase_price: String(priceNum),
        purchase_date: purchaseDate || null,
      });

      if (result.success) {
        setOpen(false);
        return;
      }
      setError(result.error ?? "Failed to buy Treasury.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlled && (
        <DialogTrigger render={<Button type="button" variant={variant} />}>
          <LandmarkIcon data-icon="inline-start" />
          {label}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buy US Treasury</DialogTitle>
          <DialogDescription>
            Pick a common tenor, set face value, and confirm. Cash available:{" "}
            {formatCurrency(cashBalance)}.
          </DialogDescription>
        </DialogHeader>

        <form
          id="buy-treasury-form"
          onSubmit={handleSubmit}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label>Preset</Label>
            <div className="flex flex-wrap gap-1.5">
              {TREASURY_PRESETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePresetClick(item.id)}
                  disabled={isCurvePending}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    presetId === item.id
                      ? "border-foreground bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {curveHint && (
              <p className="text-xs text-muted-foreground">{curveHint}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tsy-face">Face value ($)</Label>
            <Input
              id="tsy-face"
              type="number"
              min="1"
              step="1"
              value={faceValue}
              onChange={(event) => setFaceValue(event.target.value)}
              required
            />
          </div>

          <div className="rounded-lg border px-3 py-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{treasuryType}</span>
            </div>
            <div className="mt-1 flex justify-between gap-3">
              <span className="text-muted-foreground">Maturity</span>
              <span className="font-medium tabular-nums">{maturityDate || "—"}</span>
            </div>
            <div className="mt-1 flex justify-between gap-3">
              <span className="text-muted-foreground">Price / 100</span>
              <span className="font-medium tabular-nums">{purchasePrice}</span>
            </div>
            <div className="mt-1 flex justify-between gap-3">
              <span className="text-muted-foreground">Est. cash out</span>
              <span className="font-semibold tabular-nums">
                {estimatedCost !== null ? formatCurrency(estimatedCost) : "—"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="text-left text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setShowAdvanced((value) => !value)}
          >
            {showAdvanced ? "Hide advanced" : "Advanced — edit all terms"}
          </button>

          {showAdvanced && (
            <div className="grid gap-3 rounded-lg border p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="tsy-type">Type</Label>
                  <select
                    id="tsy-type"
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                    value={treasuryType}
                    onChange={(event) =>
                      setTreasuryType(event.target.value as TreasuryType)
                    }
                  >
                    <option value="BILL">BILL</option>
                    <option value="NOTE">NOTE</option>
                    <option value="BOND">BOND</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tsy-freq">Coupon frequency</Label>
                  <Input
                    id="tsy-freq"
                    type="number"
                    min="0"
                    max="12"
                    step="1"
                    value={couponFrequency}
                    onChange={(event) => setCouponFrequency(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="tsy-coupon">Coupon rate (%)</Label>
                  <Input
                    id="tsy-coupon"
                    type="number"
                    min="0"
                    step="0.001"
                    value={couponRate}
                    onChange={(event) => setCouponRate(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tsy-price">Purchase price / 100</Label>
                  <Input
                    id="tsy-price"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={purchasePrice}
                    onChange={(event) => setPurchasePrice(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="tsy-maturity">Maturity date</Label>
                  <Input
                    id="tsy-maturity"
                    type="date"
                    value={maturityDate}
                    onChange={(event) => setMaturityDate(event.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tsy-purchase-date">Purchase date</Label>
                  <Input
                    id="tsy-purchase-date"
                    type="date"
                    value={purchaseDate}
                    onChange={(event) => setPurchaseDate(event.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="buy-treasury-form"
            disabled={!canSubmit || cashBalance <= 0}
          >
            {isPending ? "Buying…" : `Buy ${preset.label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
