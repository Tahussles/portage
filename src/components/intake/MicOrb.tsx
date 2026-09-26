"use client";

import { Loader2, Mic, Square } from "lucide-react";
import type { Ref } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

export type OrbState = "idle" | "listening" | "thinking" | "done";

type MicOrbProps = {
  state: OrbState;
  onClick: () => void;
  /** The red ring the recorder scales with the input level. */
  ringRef: Ref<HTMLSpanElement>;
};

/** 180 px mic orb: granite with a paper ring; a red ring pulses with your voice while listening. */
export function MicOrb({ state, onClick, ringRef }: MicOrbProps) {
  const t = useT();
  const Icon = state === "listening" ? Square : state === "thinking" ? Loader2 : Mic;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "thinking"}
      aria-pressed={state === "listening"}
      aria-label={t(`intake.orb.${state}`)}
      className="group relative grid size-[180px] shrink-0 place-items-center rounded-full bg-granite ring-1 ring-paper transition-transform hover:scale-[1.02] disabled:cursor-progress motion-reduce:transition-none"
    >
      <span
        ref={ringRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -inset-2 rounded-full border-2 border-accent transition-opacity duration-300",
          state === "listening" ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon
        aria-hidden="true"
        className={cn(
          "size-10 text-paper",
          state === "listening" && "size-8 fill-accent text-accent",
          state === "thinking" && "motion-safe:animate-spin",
        )}
      />
    </button>
  );
}
