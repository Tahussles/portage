"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { PROGRESS_STEPS, type Progress } from "./progress";

/**
 * What is happening during the 8-second wait, tied to the real requests: transcription, profile
 * extraction, then building the plan. Each line appears when its phase starts and gets a check when it
 * resolves. Under reduced motion the text simply changes.
 */
export function IntakeProgress({ progress }: { progress: Progress }) {
  const t = useT();
  return (
    <ol aria-live="polite" className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-2.5 text-left text-sm">
      {PROGRESS_STEPS.map((step) => {
        const status = progress[step];
        return (
          <li
            key={step}
            className={cn(
              "flex items-center gap-3 transition-[opacity,transform] duration-500 motion-reduce:transition-none",
              status === "pending" ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100",
            )}
            aria-hidden={status === "pending"}
          >
            <span className="grid size-5 shrink-0 place-items-center" aria-hidden="true">
              {status === "done" ? (
                <span className="grid size-5 scale-100 place-items-center rounded-full bg-paper text-ink transition-transform duration-300 motion-reduce:transition-none">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : (
                <Loader2 className="size-4 text-mist motion-safe:animate-spin" />
              )}
            </span>
            <span className={status === "done" ? "text-mist" : "text-paper"}>{t(`intake.progress.${step}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Placeholder chips while the profile is on its way. */
export function SkeletonChips() {
  return (
    <ul aria-hidden="true" className="mt-10 flex flex-wrap justify-center gap-2">
      {[112, 148, 96, 124, 138, 104].map((w, i) => (
        <li key={i} className="h-8 rounded-full bg-granite motion-safe:animate-pulse" style={{ width: w }} />
      ))}
    </ul>
  );
}
