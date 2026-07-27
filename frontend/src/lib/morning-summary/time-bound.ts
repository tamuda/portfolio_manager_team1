export type BriefPeriod = "morning" | "afternoon" | "evening" | "night";

export type BriefLabels = {
  period: BriefPeriod;
  button: string;
  title: string;
  badge: string;
  greeting: string;
  loadingHeadline: string;
  window: string;
  aiFrame: string;
};

/** Map an hour (0–23) to the brief period for that time of day. */
export function getBriefPeriod(hour: number): BriefPeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/** User-facing copy that shifts with the time of day. */
export function getBriefLabels(date: Date = new Date()): BriefLabels {
  const period = getBriefPeriod(date.getHours());

  switch (period) {
    case "morning":
      return {
        period,
        button: "Morning summary",
        title: "Morning summary",
        badge: "AI morning brief",
        greeting: "Good morning",
        loadingHeadline: "Reading overnight moves",
        window: "since yesterday's close",
        aiFrame: "morning brief covering roughly the last 24 hours",
      };
    case "afternoon":
      return {
        period,
        button: "Afternoon brief",
        title: "Afternoon brief",
        badge: "AI afternoon brief",
        greeting: "Good afternoon",
        loadingHeadline: "Checking the day's moves",
        window: "so far today",
        aiFrame: "midday brief covering today's session so far and the last 24 hours",
      };
    case "evening":
      return {
        period,
        button: "Evening recap",
        title: "Evening recap",
        badge: "AI evening recap",
        greeting: "Good evening",
        loadingHeadline: "Wrapping up the day",
        window: "through today's close",
        aiFrame: "evening recap of today's session and the last 24 hours",
      };
    case "night":
      return {
        period,
        button: "Markets wrap",
        title: "Markets wrap",
        badge: "AI markets wrap",
        greeting: "Hello",
        loadingHeadline: "Reviewing recent moves",
        window: "over the last 24 hours",
        aiFrame: "after-hours wrap of the last 24 hours",
      };
  }
}

/** Build AI system instructions for the current time of day. */
export function getBriefInstructions(labels: BriefLabels): string {
  return `
You are a calm financial storyteller writing a ${labels.aiFrame} for one investor.

Write like you're telling a short story about what happened ${labels.window} — not a report.

Fields:
- headline: 4–8 words, sets the tone for a ${labels.period} read
- mood: overall market tone for their portfolio today
- story: 3–5 sentences, 80–120 words. Flowing prose with a beginning, middle, and end. Mention specific tickers and real percentages from the data. End with a gentle forward-looking note suited to the ${labels.period}.
- picks: 1–2 tickers your story focused on (for chart cards)
- actions: 1–2 next-step buttons

Rules:
- Use ONLY provided data. Never invent prices or news.
- No markdown, bullet points, emojis, or disclaimers.
`.trim();
}

/** Hour from client POST body, clamped to 0–23. */
export function parseLocalHour(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const hour = Math.floor(value);
  if (hour < 0 || hour > 23) return undefined;
  return hour;
}

export function getBriefLabelsForHour(hour?: number): BriefLabels {
  if (hour === undefined) return getBriefLabels();
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return getBriefLabels(date);
}
