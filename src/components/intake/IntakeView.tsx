"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { useRouter } from "next/navigation";
import { useHref } from "@/components/ui/links";
import { NextLink } from "@/components/ui/NextLink";
import { useCallback, useRef, useState } from "react";
import { FreeChecklist } from "@/components/guide/FreeChecklist";
import { GuidedInterview } from "@/components/guide/GuidedInterview";
import { GuideSheet } from "@/components/guide/GuideSheet";
import { cn } from "@/lib/cn";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import { buildPlan } from "@/lib/engine/plan";
import type { Pathway, Profile } from "@/lib/engine/types";
import { useT } from "@/lib/i18n";
import { saveEdits, saveVoice } from "@/lib/account/actions";
import { useCurrentAccount } from "@/lib/account/store";
import { useAppStore } from "@/lib/store";
import {
  SAMPLE_EXTRACTION,
  SAMPLE_TRANSCRIPT,
  extractProfile,
  sampleClipExists,
  transcribe,
  type Source,
} from "./intake-api";
import { IntakeProgress, SkeletonChips } from "./IntakeProgress";
import { LanguageHintSelect } from "./LanguageHintSelect";
import { MicOrb, type OrbState } from "./MicOrb";
import { ProfileChips } from "./ProfileChips";
import { completeStep, startProgress, type Progress } from "./progress";
import { useRecorder, type RecorderError } from "./useRecorder";

gsap.registerPlugin(useGSAP);

const SAMPLE_CLIP = "/demo/priya-hi.webm";

const pathway = pathwayData as unknown as Pathway;

type Heard = {
  text: string;
  languageCode: string;
  translation: string;
  source: Source;
  /** A live recording fell back to the sample because a route was missing or failed. */
  fellBack: boolean;
};

const ERROR_KEY = {
  denied: "intake.denied",
  unsupported: "intake.unsupported",
  failed: "intake.failed",
} as const satisfies Record<Exclude<RecorderError, null>, string>;

export function IntakeView() {
  const t = useT();
  const router = useRouter();
  const toHref = useHref();
  const locale = useAppStore((s) => s.locale);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const account = useCurrentAccount();

  const [mode, setMode] = useState<"guided" | "free">("guided");
  const [phase, setPhase] = useState<OrbState>("idle");
  const [hint, setHint] = useState("auto");
  const [heard, setHeard] = useState<Heard | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const onLevel = useCallback((level: number) => {
    const ring = ringRef.current;
    if (!ring) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ring.style.transform = still ? "" : `scale(${1 + level * 0.18})`;
    ring.style.opacity = level > 0 ? String(0.45 + level * 0.55) : "";
  }, []);

  const runPipeline = useCallback(
    async (audio: Blob, fromSample: boolean) => {
      setPhase("thinking");
      setHeard(null);
      setProgress(startProgress());
      const transcript = await transcribe(audio, hint === "auto" ? undefined : hint);
      setProgress((p) => p && completeStep(p, "transcribe"));
      const extraction = await extractProfile(transcript.data.text, transcript.data.languageCode, locale);
      setProgress((p) => p && completeStep(p, "understand"));
      // The real plan build; it takes milliseconds, and /roadmap builds the same plan from the store.
      buildPlan(extraction.data.profile, pathway, new Date().toLocaleDateString("en-CA"));
      setProgress((p) => p && completeStep(p, "build"));
      const source: Source = transcript.source === "live" && extraction.source === "live" ? "live" : "sample";
      setHeard({
        text: transcript.data.text,
        languageCode: transcript.data.languageCode,
        translation: extraction.data.englishTranslation,
        source,
        fellBack: source === "sample" && !fromSample,
      });
      setProfile(extraction.data.profile);
      saveVoice(extraction.data.profile);
      setPhase("done");
    },
    [hint, locale, setProfile],
  );

  const recorder = useRecorder({ onLevel, onComplete: (blob) => void runPipeline(blob, false) });

  const onOrb = () => {
    if (recorder.listening) recorder.stop();
    else void recorder.start();
  };

  const playSample = async () => {
    if (recorder.listening) return;
    if (await sampleClipExists(SAMPLE_CLIP)) {
      try {
        const clip = await (await fetch(SAMPLE_CLIP)).blob();
        await runPipeline(clip, true);
        return;
      } catch {
        // fall through to the bundled sample
      }
    }
    setProgress(null);
    setHeard({
      text: SAMPLE_TRANSCRIPT.text,
      languageCode: SAMPLE_TRANSCRIPT.languageCode,
      translation: SAMPLE_EXTRACTION.englishTranslation,
      source: "sample",
      fellBack: false,
    });
    setProfile(SAMPLE_EXTRACTION.profile);
    saveVoice(SAMPLE_EXTRACTION.profile);
    setPhase("done");
  };

  // The English translation fades in under the native transcript.
  useGSAP(
    () => {
      if (!heard) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-transcript]", { opacity: 0, y: 12, duration: 0.6, ease: "power2.out" });
        gsap.from("[data-translation]", { opacity: 0, duration: 0.8, delay: 0.5, ease: "power1.out" });
      });
    },
    { scope: resultRef, dependencies: [heard] },
  );

  const orbState: OrbState = recorder.listening ? "listening" : phase;
  const status =
    orbState === "listening"
      ? `${t("intake.status.listening")} ${t("intake.timeLeft", { s: recorder.secondsLeft })}`
      : t(`intake.status.${orbState}`);

  return (
    <main className="min-h-svh bg-ink pt-(--nav-h)">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-5 pt-8 pb-16 text-center md:pt-12">
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <AppLink href="/" className="inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-paper">
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("intake.back")}
          </AppLink>
          <LanguageHintSelect value={hint} onChange={setHint} />
        </div>

        <p className="micro-label mt-10 text-mist">{t("start.label")}</p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl leading-tight font-medium tracking-tight md:text-5xl">
          {t("start.title")}
        </h1>
        {mode === "free" && <p className="mt-4 max-w-xl text-sm leading-relaxed text-mist md:text-base">{t("intake.helps")}</p>}

        <div className="mt-4">
          <GuideSheet />
        </div>

        <div role="group" aria-label={t("guide.mode.label")} className="mt-8 flex rounded-full border border-slate-line p-1 text-sm">
          {(["guided", "free"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn("rounded-full px-4 py-2 transition-colors", mode === m ? "bg-paper text-ink" : "text-mist hover:text-paper")}
            >
              {t(m === "guided" ? "guide.mode.guided" : "guide.mode.free")}
            </button>
          ))}
        </div>

        {mode === "guided" ? (
          <div className="w-full max-w-3xl">
            <GuidedInterview hint={hint} />
          </div>
        ) : (
          <div className="mt-10 grid w-full gap-8 text-center md:grid-cols-[minmax(0,1fr)_280px] md:items-start">
            <div className="flex min-w-0 flex-col items-center">
            <div className="mt-2">
              <MicOrb state={orbState} onClick={onOrb} ringRef={ringRef} />
            </div>
            <p aria-live="polite" className="mt-6 min-h-5 text-sm text-mist">
              {status}
            </p>
            {progress && <IntakeProgress progress={progress} />}
            {phase === "thinking" && <SkeletonChips />}

            {recorder.error && (
              <p role="alert" className="mt-3 max-w-md text-sm text-paper">
                {t(ERROR_KEY[recorder.error])}
              </p>
            )}

            {heard && (
              <section ref={resultRef} aria-label={t("intake.transcript")} className="mt-10 w-full">
                {heard.source === "sample" && (
                  <p className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs text-mist">
                    <span className="rounded-full border border-slate-line px-3 py-1 text-paper">{t("intake.sample")}</span>
                    <span>{heard.fellBack ? t("intake.fallbackNote") : t("intake.sampleNote")}</span>
                  </p>
                )}
                <p
                  data-transcript
                  lang={heard.languageCode}
                  dir="auto"
                  aria-live="polite"
                  className="font-display text-xl leading-relaxed text-paper md:text-2xl"
                >
                  {heard.text}
                </p>
                {heard.languageCode !== "en" && heard.translation && (
                  <p data-translation lang="en" className="mt-5 text-base leading-relaxed text-mist">
                    <span className="sr-only">{t("intake.translation")}: </span>
                    {heard.translation}
                  </p>
                )}
              </section>
            )}

            {profile && (
              <section aria-label={t("intake.profile")} className="mt-10 w-full">
                <p className="micro-label mb-2 text-mist">{t("intake.profile")}</p>
                <p className="mb-4 text-xs text-mist">{t("intake.profileNote")}</p>
                <ProfileChips
                  profile={profile}
                  onChange={(p: Profile) => {
                    saveEdits(profile, p);
                    setProfile(p);
                  }}
                />
                {account && (
                  <AppLink href="/profile" className="mt-4 inline-flex items-center gap-1.5 text-sm text-paper underline-offset-4 hover:underline">
                    {t("profile.review")}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </AppLink>
                )}
              </section>
            )}

            <div className="mt-12 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                disabled={!profile}
                onClick={() => router.push(toHref("/roadmap"))}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-granite disabled:text-mist"
              >
                {t("intake.build")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => void playSample()}
                disabled={recorder.listening || phase === "thinking"}
                className="inline-flex items-center gap-2 rounded-full border border-slate-line px-5 py-3 text-sm text-paper transition-colors hover:border-mist disabled:opacity-50"
              >
                <Play aria-hidden="true" className="size-4" />
                {t("intake.sampleVoice")}
              </button>
            </div>
            </div>
            <FreeChecklist />
          </div>
        )}

        <p className="mt-10 max-w-md text-xs leading-relaxed text-mist">{t("intake.consent")}</p>
        <NextLink from="start" className="mt-8" />
      </div>
    </main>
  );
}
