/** The three real phases after a recording: each advances only when its request resolves. */
export const PROGRESS_STEPS = ["transcribe", "understand", "build"] as const;

export type ProgressStep = (typeof PROGRESS_STEPS)[number];
export type StepStatus = "pending" | "active" | "done";
export type Progress = Record<ProgressStep, StepStatus>;

export function startProgress(): Progress {
  return { transcribe: "active", understand: "pending", build: "pending" };
}

/** Marks `step` done and starts the next one, if any. */
export function completeStep(progress: Progress, step: ProgressStep): Progress {
  const next = PROGRESS_STEPS[PROGRESS_STEPS.indexOf(step) + 1];
  return { ...progress, [step]: "done", ...(next ? { [next]: "active" } : {}) };
}

export function isComplete(progress: Progress) {
  return PROGRESS_STEPS.every((s) => progress[s] === "done");
}
