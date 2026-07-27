"use client";

import { useEffect, useRef, useState } from "react";

type UseSmoothTypewriterOptions = {
  /** Characters revealed per second. */
  speed?: number;
  /** When false, snap to the full target immediately. */
  active?: boolean;
};

/**
 * Smoothly reveals `target` character-by-character using rAF — avoids the
 * jerky word jumps from server-side chunk streaming.
 */
export function useSmoothTypewriter(
  target: string,
  { speed = 38, active = true }: UseSmoothTypewriterOptions = {},
) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const targetRef = useRef(target);
  const speedRef = useRef(speed);

  targetRef.current = target;
  speedRef.current = speed;

  useEffect(() => {
    if (!active) {
      setDisplayed(target);
      indexRef.current = target.length;
      return;
    }

    if (target.length < indexRef.current) {
      indexRef.current = 0;
      setDisplayed("");
    }

    let frame = 0;
    let lastTime: number | null = null;

    const tick = (time: number) => {
      const currentTarget = targetRef.current;
      if (lastTime === null) lastTime = time;

      const elapsed = time - lastTime;
      if (elapsed >= 16) {
        const chars = Math.max(1, Math.round((elapsed / 1000) * speedRef.current));
        lastTime = time;
        indexRef.current = Math.min(
          indexRef.current + chars,
          currentTarget.length,
        );
        setDisplayed(currentTarget.slice(0, indexRef.current));
      }

      if (indexRef.current < currentTarget.length) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);

  const isComplete =
    !active || (target.length > 0 && displayed.length >= target.length);

  return { displayed, isComplete };
}
