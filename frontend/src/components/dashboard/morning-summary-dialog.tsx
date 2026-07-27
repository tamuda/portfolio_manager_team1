"use client";

import { useMemo, useState } from "react";
import { SparklesIcon } from "lucide-react";

import { MorningSummaryView } from "@/components/dashboard/morning-summary-view";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getBriefLabels } from "@/lib/morning-summary/time-bound";

export function MorningSummaryDialog() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const labels = useMemo(() => getBriefLabels(), []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5" />
        }
      >
        <SparklesIcon data-icon="inline-start" />
        {labels.button}
      </DialogTrigger>
      <DialogContent
        className="overflow-hidden rounded-3xl border-border/60 bg-transparent p-0 shadow-2xl sm:max-w-3xl [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:z-10 sm:[&_[data-slot=dialog-close]]:top-5 sm:[&_[data-slot=dialog-close]]:right-5"
        showCloseButton
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>
            AI brief of your portfolio and watchlist for moves {labels.window}.
          </DialogDescription>
        </DialogHeader>

        <div className="p-1">
          {open ? (
            <MorningSummaryView
              key={session}
              labels={labels}
              onRetry={() => setSession((value) => value + 1)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
