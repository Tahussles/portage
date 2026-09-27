"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowLeft, ArrowRight, Pause, Play, Volume2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { extractProfile, transcribe, type Source } from "@/components/intake/intake-api";
import { IntakeProgress } from "@/components/intake/IntakeProgress";
import { MicOrb, type OrbState } from "@/components/intake/MicOrb";
import { ProfileChips } from "@/components/intake/ProfileChips";
import { completeStep, startProgress, type Progress } from "@/components/intake/progress";
import { useRecorder, type RecorderError } from "@/components/intake/useRecorder";
import { AppLink } from "@/components/ui/AppLink";
import { useHref } from "@/components/ui/links";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import { saveEdits, saveVoice } from "@/lib/account/actions";
import { useCurrentAccount } from "@/lib/account/store";
import { cn } from "@/lib/cn";
import { buildPlan } from "@/lib/engine/plan";
import type { Pathway, Profile } from "@/lib/engine/types";
import { translate, useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { QUESTIONS, combineAnswers, isGuideLanguage, mainLanguage, sampleAnswers, type GuideLanguage, type GuideQuestions } from "./questions";

gsap.registerPlugin(useGSAP);

const pathway = pathwayData as unknown as Pathway;
const ENGLISH_QUESTIONS = QUESTIONS.map((q) => translate("en", q.question));

type Answer = { text: string; languageCode: string; source: Source } | { pending: true } | null;

const ERROR_KEY = { denied: "intake.denied", unsupported: "intake.unsupported", failed: "intake.failed" } as const satisfies Record<
  Exclude<RecorderError, null>,
  string
>;

/**
 * Guided interview: six questions, one per screen, each read aloud in the person's language from
 * pre-generated audio (public/guide). Every answer is transcribed as soon as it is recorded; at the end all
 * answers become one "Q: ... A: ..." transcript sent once to /api/profile, then merged into the account.
 */
export function GuidedInterview({ hint }: { hint: string }) {
  const t = useT();
  const router = useRouter();
  const toHref = useHref();
  const locale = useAppStore((s) => s.locale);
  const setProfile = useAppStore((s) => s.setProfile);
  const account = useCurrentAccount();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(() => QUESTIONS.map(() => null));
  const [playing, setPlaying] = useState(false);
  const [native, setNative] = useState<GuideQuestions | null>(null);
  const [showNative, setShowNative] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<{ profile: Profile; sample: boolean } | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const scope = useRef<HTMLDivElement>(null);

  // The questions are spoken in the person's language when we have it, else in the UI language.
  const spoken = (hint !== "auto" ? hint : account?.spokenLanguage)?.split("-")[0];
  const guideLang: GuideLanguage = isGuideLanguage(spoken) ? spoken : locale;
  const nativeName = new Intl.DisplayNames([guideLang], { type: "language" }).of(guideLang) ?? guideLang;

  useEffect(() => {
    if (guideLang === locale) return;
    let live = true;
    fetch(`/guide/${guideLang}/questions.json`)
      .then((r) => r.json() as Promise<GuideQuestions>)
      .then((q) => live && setNative(q))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [guideLang, locale]);

  const stopAudio = useCallback(() => {
    audio.current?.pause();
    setPlaying(false);
  }, []);
  useEffect(() => () => audio.current?.pause(), []);

  const play = () => {
    if (playing) return stopAudio();
    audio.current?.pause();
    const el = new Audio(QUESTIONS[step].audio(guideLang));
    audio.current = el;
    el.onended = () => setPlaying(false);
    el.onerror = () => setPlaying(false);
    setPlaying(true);
    void el.play().catch(() => setPlaying(false));
  };

  const onLevel = useCallback((level: number) => {
    const ring = ringRef.current;
    if (!ring) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ring.style.transform = still ? "" : `scale(${1 + level * 0.18})`;
    ring.style.opacity = level > 0 ? String(0.45 + level * 0.55) : "";
  }, []);

  const recorder = useRecorder({
    onLevel,
    onComplete: (blob) => {
      const index = step;
      setAnswers((a) => a.map((x, i) => (i === index ? { pending: true } : x)));
      void transcribe(blob, hint === "auto" ? undefined : hint).then((r) => {
        // Demo mode (or an unreachable service) returns the whole sample: use Priya's answer to this question.
        const text = r.source === "sample" ? sampleAnswers()[index] : r.data.text;
        const languageCode = r.source === "sample" ? "hi" : r.data.languageCode;
        setAnswers((a) => a.map((x, i) => (i === index ? { text, languageCode, source: r.source } : x)));
      });
    },
  });

  const go = (next: number) => {
    stopAudio();
    setShowNative(false);
    setStep(next);
  };

  const finish = async (final: Answer[]) => {
    stopAudio();
    const heard = final.filter((a): a is { text: string; languageCode: string; source: Source } => !!a && "text" in a);
    if (heard.length === 0) return;
    setProgress(completeStep(startProgress(), "transcribe"));
    const transcript = combineAnswers(ENGLISH_QUESTIONS, final.map((a) => (a && "text" in a ? a.text : null)));
    const extraction = await extractProfile(transcript, mainLanguage(heard.map((a) => a.languageCode), guideLang), locale);
    setProgress((p) => p && completeStep(p, "understand"));
    buildPlan(extraction.data.profile, pathway, new Date().toLocaleDateString("en-CA"));
    setProgress((p) => p && completeStep(p, "build"));
    setProfile(extraction.data.profile);
    saveVoice(extraction.data.profile);
    setResult({ profile: extraction.data.profile, sample: extraction.source === "sample" || heard.every((a) => a.source === "sample") });
  };

  // "Use sample voice (Priya)": all six answers at once, then the same extraction.
  const fillSample = () => {
    if (recorder.listening) return;
    const filled: Answer[] = sampleAnswers().map((text) => ({ text, languageCode: "hi", source: "sample" as const }));
    setAnswers(filled);
    setStep(QUESTIONS.length - 1);
    void finish(filled);
  };

  useGSAP(
    () => {
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-question]", { opacity: 0, x: 16, duration: 0.4, ease: "power2.out" });
      });
    },
    { scope, dependencies: [step, !!result] },
  );

  const q = QUESTIONS[step];
  const answer = answers[step];
  const answeredCount = answers.filter((a) => a && "text" in a).length;
  const busy = progress !== null && !result;
  const orbState: OrbState = recorder.listening ? "listening" : answer && "pending" in answer ? "thinking" : answer ? "done" : "idle";
  const last = step === QUESTIONS.length - 1;

  if (result) {
    return (
      <div ref={scope} className="mt-10 w-full">
        <section data-question aria-label={t("guide.result")} className="w-full">
          <p className="micro-label mb-2 text-mist">{t("guide.result")}</p>
          {result.sample && (
            <p className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs text-mist">
              <span className="rounded-full border border-slate-line px-3 py-1 text-paper">{t("intake.sample")}</span>
              <span>{t("intake.sampleNote")}</span>
            </p>
          )}
          <p className="mb-4 text-xs text-mist">{t("intake.profileNote")}</p>
          <ProfileChips
            profile={result.profile}
            onChange={(p: Profile) => {
              saveEdits(result.profile, p);
              setResult({ ...result, profile: p });
              setProfile(p);
            }}
          />
        </section>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => router.push(toHref("/roadmap"))}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent-hover"
          >
            {t("intake.build")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
          {account && (
            <AppLink href="/profile" className="inline-flex items-center gap-1.5 rounded-full border border-slate-line px-5 py-3 text-sm text-paper hover:border-mist">
              {t("profile.review")}
            </AppLink>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={scope} className="mt-8 flex w-full flex-col items-center">
      <div className="flex items-center gap-3" aria-label={t("guide.progress", { n: step + 1, total: QUESTIONS.length })}>
        {QUESTIONS.map((x, i) => (
          <span
            key={x.id}
            aria-hidden="true"
            className={cn(
              "size-2 rounded-full transition-colors",
              i === step ? "bg-accent" : answers[i] && "text" in answers[i]! ? "bg-paper" : "bg-slate-line",
            )}
          />
        ))}
      </div>
      <p className="micro-label mt-3 text-mist">{t("guide.progress", { n: step + 1, total: QUESTIONS.length })}</p>

      <div data-question key={step} className="mt-5 flex w-full flex-col items-center">
        <h2 className="max-w-2xl font-display text-2xl leading-snug font-medium tracking-tight md:text-3xl">{t(q.question)}</h2>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={play}
            aria-pressed={playing}
            className="inline-flex items-center gap-2 rounded-full border border-slate-line bg-granite px-4 py-2 text-xs font-medium text-paper transition-colors hover:border-mist"
          >
            {playing ? <Pause aria-hidden="true" className="size-4" /> : <Volume2 aria-hidden="true" className="size-4" />}
            {playing ? t("guide.stop") : t("guide.play")}
            {guideLang !== locale && <span className="text-mist">· {nativeName}</span>}
          </button>
          {guideLang !== locale && native && (
            <button type="button" onClick={() => setShowNative((v) => !v)} className="text-xs text-mist underline-offset-4 hover:text-paper hover:underline">
              {showNative ? t("guide.hideNative") : t("guide.native", { language: nativeName })}
            </button>
          )}
        </div>
        {showNative && native && (
          <div className="mt-3 max-w-xl">
            <p lang={guideLang} dir="auto" className="text-lg leading-relaxed text-paper">
              {native.questions[step]?.text}
            </p>
            {native.machineTranslated && <p className="mt-1 text-[11px] text-mist">{t("guide.machine")}</p>}
          </div>
        )}

        <details className="mt-4 max-w-xl text-sm text-mist">
          <summary className="cursor-pointer underline-offset-4 hover:text-paper hover:underline">{t("guide.example")}</summary>
          <p className="mt-2 text-left">
            <span className="micro-label mr-2 text-mist">{t("guide.exampleLabel")}</span>
            <span className="text-paper">{t(q.example)}</span>
          </p>
        </details>

        <div className="mt-8">
          <MicOrb state={orbState} onClick={() => (recorder.listening ? recorder.stop() : void recorder.start())} ringRef={ringRef} />
        </div>
        <p aria-live="polite" className="mt-5 min-h-5 max-w-xl text-sm text-mist">
          {recorder.listening
            ? `${t("intake.status.listening")} ${t("intake.timeLeft", { s: recorder.secondsLeft })}`
            : answer && "pending" in answer
              ? t("guide.transcribing")
              : answer
                ? null
                : t("intake.status.idle")}
        </p>
        {answer && "text" in answer && (
          <p className="mt-1 max-w-xl text-base leading-relaxed text-paper">
            <span className="micro-label mr-2 text-mist">{t("guide.heard")}</span>
            <span lang={answer.languageCode} dir="auto">
              {answer.text}
            </span>
          </p>
        )}
        {recorder.error && (
          <p role="alert" className="mt-3 max-w-md text-sm text-paper">
            {t(ERROR_KEY[recorder.error])}
          </p>
        )}
      </div>

      {progress && <IntakeProgress progress={progress} />}

      <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(step - 1)}
          disabled={step === 0 || busy || recorder.listening}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm text-mist transition-colors hover:text-paper disabled:opacity-40"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("guide.previous")}
        </button>
        {!(answer && "text" in answer) && (
          <button
            type="button"
            onClick={() => (last ? void finish(answers) : go(step + 1))}
            disabled={busy || recorder.listening || (last && answeredCount === 0)}
            className="rounded-full border border-slate-line px-5 py-2.5 text-sm text-paper transition-colors hover:border-mist disabled:opacity-40"
          >
            {t("guide.skip")}
          </button>
        )}
        {answer && "text" in answer && (
          <button
            type="button"
            onClick={() => (last ? void finish(answers) : go(step + 1))}
            disabled={busy || recorder.listening}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {last ? t("guide.finish") : t("guide.next")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-mist">{t("guide.answered", { n: answeredCount, total: QUESTIONS.length })}</p>

      <button
        type="button"
        onClick={fillSample}
        disabled={recorder.listening || busy}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-line px-5 py-3 text-sm text-paper transition-colors hover:border-mist disabled:opacity-50"
      >
        <Play aria-hidden="true" className="size-4" />
        {t("intake.sampleVoice")}
      </button>
    </div>
  );
}
