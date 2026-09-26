"use client";

import { Loader2, Square, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Pathway, Plan, ScheduleKey } from "@/lib/engine/types";
import { useT } from "@/lib/i18n";
import { buildSummary } from "@/lib/speak/summary";

type HearPlanProps = {
  plan: Plan;
  pathway: Pathway;
  schedule: ScheduleKey;
  /** The speaker's language (Priya: "hi"), else the UI locale. */
  language: string;
};

type Spoken = { url: string; text: string };

/** Clips already fetched this session, per (language, summary): toggling back replays without a request. */
const clips = new Map<string, Spoken>();

/**
 * "Hear your plan": a deterministic summary of the plan on screen, read aloud in the person's own
 * language. Any failure hides the button quietly; the plan on screen is always the source of truth.
 */
export function HearPlan({ plan, pathway, schedule, language }: HearPlanProps) {
  const t = useT();
  const summary = useMemo(() => buildSummary(plan, pathway, schedule), [plan, pathway, schedule]);
  const key = `${language}\n${summary}`;
  const [state, setState] = useState<"idle" | "loading" | "playing" | "unavailable">("idle");
  const [spoken, setSpoken] = useState<Spoken | null>(() => clips.get(key) ?? null);
  const audio = useRef<HTMLAudioElement | null>(null);

  // Stop playback when the schedule or language changes (the parent remounts us) or the page closes.
  useEffect(() => () => audio.current?.pause(), []);

  const play = (clip: Spoken) => {
    audio.current?.pause();
    const el = new Audio(clip.url);
    audio.current = el;
    el.onended = () => setState("idle");
    el.onerror = () => setState("idle");
    setState("playing");
    void el.play().catch(() => setState("idle"));
  };

  const onClick = async () => {
    if (state === "playing") {
      audio.current?.pause();
      setState("idle");
      return;
    }
    const cached = clips.get(key);
    if (cached) return play(cached);

    setState("loading");
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: summary, languageCode: language }),
      });
      if (!res.ok || !res.headers.get("content-type")?.includes("audio")) throw new Error("unavailable");
      const clip = {
        url: URL.createObjectURL(await res.blob()),
        text: decodeURIComponent(res.headers.get("x-speak-text") ?? encodeURIComponent(summary)),
      };
      clips.set(key, clip);
      setSpoken(clip);
      play(clip);
    } catch {
      setState("unavailable");
    }
  };

  if (state === "unavailable") return null;

  return (
    <div className="flex flex-col gap-2 md:items-end">
      <button
        type="button"
        onClick={() => void onClick()}
        aria-pressed={state === "playing"}
        disabled={state === "loading"}
        className="inline-flex items-center gap-2 self-start rounded-full border border-slate-line bg-granite px-4 py-2 text-xs font-medium text-paper transition-colors hover:border-mist disabled:cursor-progress md:self-end"
      >
        {state === "loading" ? (
          <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
        ) : state === "playing" ? (
          <Square aria-hidden="true" className="size-3.5 fill-paper" />
        ) : (
          <Volume2 aria-hidden="true" className="size-4" />
        )}
        {state === "playing" ? t("speak.stop") : state === "loading" ? t("speak.loading") : t("speak.hear")}
        <span aria-hidden="true" className={cn("flex h-3 items-end gap-0.5", state !== "playing" && "opacity-40")}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn("w-0.5 rounded-full bg-accent", state === "playing" ? "motion-safe:animate-wave h-3" : "h-1.5")}
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </span>
      </button>
      {spoken && (
        <details className="max-w-md text-xs text-mist md:text-right">
          <summary className="cursor-pointer underline-offset-4 hover:text-paper hover:underline">{t("speak.transcript")}</summary>
          <p lang={language} className="mt-2 text-left leading-relaxed text-paper/90">
            {spoken.text}
          </p>
        </details>
      )}
    </div>
  );
}
