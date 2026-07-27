"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { MorningSummaryMoverCard } from "@/components/dashboard/morning-summary-mover-card";
import { RotateCw } from "@/components/animate-ui/icons/rotate-cw";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSmoothTypewriter } from "@/hooks/use-smooth-typewriter";
import { getBriefLabels, type BriefLabels } from "@/lib/morning-summary/time-bound";
import { cn } from "@/lib/utils";
import type {
  MorningSummaryAction,
  MorningSummaryFeaturedMover,
  MorningSummaryStage,
  MorningSummaryStreamEvent,
} from "@/types/morning-summary";

const STAGE_LABELS: Record<MorningSummaryStage, string> = {
  opening: "Setting the scene",
  mood: "Reading the tone",
  story: "Writing your brief",
  charts: "Pulling up charts",
  actions: "Suggesting next steps",
};

const spring = { type: "spring" as const, stiffness: 260, damping: 28 };

function GeminiGradientText({
  children,
  className,
  shimmer = false,
}: {
  children: React.ReactNode;
  className?: string;
  shimmer?: boolean;
}) {
  return (
    <span
      className={cn(
        "bg-[linear-gradient(115deg,#4285f4_0%,#9b72cb_35%,#d96570_70%,#9b72cb_100%)] bg-clip-text text-transparent",
        shimmer &&
          "animate-[gemini-shimmer_3s_linear_infinite] bg-size-[200%_auto]",
        className,
      )}
    >
      {children}
    </span>
  );
}

type MorningSummaryViewProps = {
  labels?: BriefLabels;
  onRetry?: () => void;
};

export function MorningSummaryView({
  labels: labelsProp,
  onRetry,
}: MorningSummaryViewProps) {
  const labels = labelsProp ?? getBriefLabels();
  const [stage, setStage] = useState<MorningSummaryStage | null>(null);
  const [headlineTarget, setHeadlineTarget] = useState("");
  const [storyTarget, setStoryTarget] = useState("");
  const [movers, setMovers] = useState<MorningSummaryFeaturedMover[]>([]);
  const [actions, setActions] = useState<MorningSummaryAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<
    "idle" | "loading" | "streaming" | "done"
  >("idle");

  const { displayed: headline } = useSmoothTypewriter(
    headlineTarget,
    { speed: 32, active: phase === "streaming" && Boolean(headlineTarget) },
  );
  const { displayed: story, isComplete: storyDone } = useSmoothTypewriter(
    storyTarget,
    { speed: 36, active: phase === "streaming" && Boolean(storyTarget) },
  );

  const storyActive =
    phase === "streaming" && Boolean(storyTarget) && !storyDone;

  async function loadSummary() {
    setPhase("loading");
    setError(null);
    setStage(null);
    setHeadlineTarget("");
    setStoryTarget("");
    setMovers([]);
    setActions([]);

    try {
      const response = await fetch("/api/morning-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localHour: new Date().getHours() }),
      });

      if (!response.ok) {
        let message = `Could not generate your ${labels.title.toLowerCase()}.`;
        try {
          const body = (await response.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // keep default
        }
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error("No response stream received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as MorningSummaryStreamEvent;
          receivedContent = true;
          setPhase("streaming");

          switch (event.event) {
            case "stage":
              setStage(event.stage);
              break;
            case "headline":
              setHeadlineTarget(event.text);
              break;
            case "mood":
              break;
            case "story":
              setStoryTarget(event.text);
              break;
            case "mover":
              setMovers((current) => {
                if (current.some((item) => item.ticker === event.data.ticker)) {
                  return current;
                }
                return [...current, event.data];
              });
              break;
            case "action":
              setActions((current) => {
                const key = `${event.data.href}:${event.data.label}`;
                if (
                  current.some(
                    (item) => `${item.href}:${item.label}` === key,
                  )
                ) {
                  return current;
                }
                return [...current, event.data];
              });
              break;
            case "done":
              setPhase("done");
              break;
            case "error":
              throw new Error(event.message);
          }
        }
      }

      if (receivedContent) {
        setPhase((current) => (current === "streaming" ? "done" : current));
      }

      if (!receivedContent) {
        throw new Error(
          "The model returned an empty response. Check OPENAI_API_KEY and restart npm run dev.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the summary.",
      );
      setPhase("idle");
    }
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  const isLoading = phase === "loading";
  const isStreaming = phase === "streaming";
  const showHeadline = headlineTarget
    ? headline
    : isLoading || isStreaming
      ? labels.loadingHeadline
      : labels.greeting;
  const showStageLoader = isLoading || (isStreaming && !headlineTarget);
  const stageLabel = stage ? STAGE_LABELS[stage] : null;
  const storyVisible = Boolean(storyTarget || story);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(66,133,244,0.12),transparent_42%),radial-gradient(circle_at_top_right,rgba(155,114,203,0.14),transparent_38%),radial-gradient(circle_at_bottom,rgba(217,101,112,0.08),transparent_40%)] p-1">
      <div className="relative rounded-[calc(1.5rem-4px)] bg-background/85 p-5 backdrop-blur-xl sm:p-6">
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-3 top-3 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:right-4 sm:top-4"
          onClick={() => {
            onRetry?.();
            void loadSummary();
          }}
          disabled={phase === "loading" || phase === "streaming"}
          aria-label="Refresh brief"
        >
          <RotateCw size={16} animateOnHover animation="rotate" />
        </Button>

        <div className="space-y-2.5 pr-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground">
            <SparklesIcon className="size-3.5 text-[#9b72cb]" />
            {labels.badge}
          </div>
          <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              <GeminiGradientText
                shimmer={!headlineTarget && (isLoading || isStreaming)}
              >
              {showHeadline}
            </GeminiGradientText>
          </h2>
        </div>

        <AnimatePresence mode="wait">
          {showStageLoader && (
            <motion.div
              key={stageLabel ?? "loading"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2Icon className="size-4 animate-spin text-[#4285f4]" />
              <span>{isLoading ? "Connecting…" : stageLabel}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {storyVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="mt-6 max-w-2xl"
            >
              <p className="text-lg leading-8 text-foreground/92 sm:text-xl sm:leading-9">
                {story}
                {storyActive && !storyDone && (
                  <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-0.5 animate-pulse rounded-full bg-[#9b72cb]" />
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {movers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="mt-7 grid gap-3 sm:grid-cols-2"
            >
              {movers.map((mover, index) => (
                <motion.div
                  key={mover.ticker}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: index * 0.08 }}
                >
                  <MorningSummaryMoverCard mover={mover} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="mt-7 flex flex-wrap gap-2"
            >
              {actions.map((action, index) => (
                <motion.div
                  key={`${action.href}-${action.label}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: index * 0.06 }}
                >
                  <Link
                    href={action.href}
                    className={buttonVariants({
                      variant: index === 0 ? "default" : "outline",
                      size: "sm",
                    })}
                  >
                    {action.label}
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
