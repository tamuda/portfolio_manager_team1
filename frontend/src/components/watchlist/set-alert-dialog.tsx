"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALERT_TYPES,
  alertTypeLabel,
  clearAlertTrigger,
  getAlertsForTicker,
  getBrowserNotifyEnabled,
  removeAlert,
  setBrowserNotifyEnabled,
  upsertAlert,
  type AlertType,
  type WatchlistAlert,
} from "@/lib/alerts/storage";
import { cn } from "@/lib/utils";

type SetAlertDialogProps = {
  ticker: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPrice?: number | null;
};

export function SetAlertDialog({
  ticker,
  open,
  onOpenChange,
  defaultPrice,
}: SetAlertDialogProps) {
  const [type, setType] = useState<AlertType>("price_above");
  const [threshold, setThreshold] = useState("");
  const [existing, setExisting] = useState<WatchlistAlert[]>([]);
  const [browserNotify, setBrowserNotify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifyHint, setNotifyHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const rules = getAlertsForTicker(ticker);
    setExisting(rules);
    setBrowserNotify(getBrowserNotifyEnabled());
    setError(null);
    setNotifyHint(null);

    const preferred =
      rules.find((rule) => rule.type === "price_above") ?? rules[0];
    if (preferred) {
      setType(preferred.type);
      setThreshold(String(preferred.threshold));
    } else {
      setType("price_above");
      setThreshold(
        defaultPrice != null && Number.isFinite(defaultPrice)
          ? defaultPrice.toFixed(2)
          : "",
      );
    }
  }, [defaultPrice, open, ticker]);

  async function handleToggleNotify(next: boolean) {
    setBrowserNotify(next);
    setBrowserNotifyEnabled(next);
    setNotifyHint(null);

    if (!next) return;
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifyHint("Browser notifications are not supported here.");
      return;
    }
    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") {
      setNotifyHint("Notifications are blocked in browser settings.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setNotifyHint("Notification permission was not granted.");
      setBrowserNotify(false);
      setBrowserNotifyEnabled(false);
    }
  }

  function handleSave() {
    const value = Number(threshold);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid threshold greater than 0.");
      return;
    }

    upsertAlert({ ticker, type, threshold: value });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alert for {ticker}</DialogTitle>
          <DialogDescription>
            Rules are saved in this browser and checked about every minute while
            the app is open.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Alert type</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALERT_TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    type === option
                      ? "border-foreground/20 bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {alertTypeLabel(option)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-threshold">
              {type === "pct_move" ? "Percent move" : "Price"}
            </Label>
            <Input
              id="alert-threshold"
              type="number"
              inputMode="decimal"
              min="0"
              step={type === "pct_move" ? "0.1" : "0.01"}
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
              placeholder={type === "pct_move" ? "5" : "200.00"}
            />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={browserNotify}
              onChange={(event) => {
                void handleToggleNotify(event.target.checked);
              }}
            />
            <span>
              Also send browser notifications
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Requires permission. Only fires while this site is open.
              </span>
            </span>
          </label>

          {notifyHint && (
            <p className="text-xs text-muted-foreground">{notifyHint}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {existing.length > 0 && (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Active rules
              </p>
              <ul className="space-y-2">
                {existing.map((alert) => (
                  <li
                    key={alert.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span>
                      {alertTypeLabel(alert.type)}{" "}
                      <span className="tabular-nums">
                        {alert.type === "pct_move"
                          ? `±${alert.threshold}%`
                          : `$${alert.threshold.toFixed(2)}`}
                      </span>
                      {alert.triggeredAt && (
                        <span className="ml-1 text-xs text-amber-600">
                          triggered
                        </span>
                      )}
                    </span>
                    <div className="flex gap-1">
                      {alert.triggeredAt && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            clearAlertTrigger(alert.id);
                            setExisting(getAlertsForTicker(ticker));
                          }}
                        >
                          Reset
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          removeAlert(alert.id);
                          setExisting(getAlertsForTicker(ticker));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save alert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
