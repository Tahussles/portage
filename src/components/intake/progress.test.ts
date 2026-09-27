import { describe, expect, it } from "vitest";
import { completeStep, isComplete, startProgress } from "./progress";

describe("intake progress", () => {
  it("starts with transcription and advances one phase at a time", () => {
    let p = startProgress();
    expect(p).toEqual({ transcribe: "active", understand: "pending", build: "pending" });
    p = completeStep(p, "transcribe");
    expect(p).toEqual({ transcribe: "done", understand: "active", build: "pending" });
    p = completeStep(p, "understand");
    expect(p).toEqual({ transcribe: "done", understand: "done", build: "active" });
    expect(isComplete(p)).toBe(false);
    p = completeStep(p, "build");
    expect(isComplete(p)).toBe(true);
  });
});
