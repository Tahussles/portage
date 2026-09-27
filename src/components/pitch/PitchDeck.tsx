"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import { profileFixture } from "@/lib/demo";
import { cn } from "@/lib/cn";
import { DECK_TEXT, SLIDES, fill } from "./copy";
import { dataFacts, priyaFacts } from "./facts";
import { PitchSlide } from "./PitchSlide";
import { WHY_NOW } from "./sources";

gsap.registerPlugin(useGSAP);

const TIMER_KEY = "portage.pitch.startedAt";
const REFERENCE_DATE = (pathwayData as { lastReviewed: string }).lastReviewed;
let todayCache: string | null = null;
const getToday = () => (todayCache ??= new Date().toLocaleDateString("en-CA"));
const getReferenceDate = () => REFERENCE_DATE;
const subscribeNever = () => () => {};

// The slide lives in the URL and the notes timer in sessionStorage; both are read as external stores.
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("popstate", cb);
  };
}
const notify = () => listeners.forEach((l) => l());

function readSlide(): number {
  const s = Number(new URLSearchParams(window.location.search).get("s"));
  return Number.isInteger(s) && s >= 1 && s <= SLIDES.length ? s - 1 : 0;
}

function storedStart(): number | null {
  try {
    const v = Number(sessionStorage.getItem(TIMER_KEY));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}

function startTimer() {
  try {
    sessionStorage.setItem(TIMER_KEY, String(Date.now()));
  } catch {
    // the timer is a convenience only
  }
  notify();
}

function formatElapsed(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * The pitch as slides in the product's own design language. Keys: Right/Space next, Left back,
 * Home/End, 1-9 jump, F fullscreen, N notes. The URL keeps the slide (/pitch?s=4). Print (Save as PDF)
 * gives one slide per landscape page.
 */
export function PitchDeck() {
  const index = useSyncExternalStore(subscribe, readSlide, () => 0);
  const startedAt = useSyncExternalStore(subscribe, storedStart, () => null);
  const [notes, setNotes] = useState(false);
  const [now, setNow] = useState(0);
  const scope = useRef<HTMLDivElement>(null);
  const today = useSyncExternalStore(subscribeNever, getToday, getReferenceDate);
  const priya = useMemo(() => priyaFacts(profileFixture().profile, today), [today]);

  const facts = dataFacts();
  const values = {
    requirements: facts.requirements,
    guidelineMonths: facts.guidelineMonths,
    applicants: new Intl.NumberFormat("en-CA").format(facts.applicants),
    fcrAgreements: WHY_NOW.fcrAgreements,
    fcrProfessionals: new Intl.NumberFormat("en-CA").format(WHY_NOW.fcrProfessionals),
    oneAtATime: priya.oneAtATime,
    portagePlan: priya.portagePlan,
    windowCloses: priya.windowCloses,
  };

  // The notes timer starts when the deck opens on slide 1 (and restarts whenever slide 1 is shown again).
  useEffect(() => {
    if (index === 0 && !storedStart()) startTimer();
  }, [index]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const go = useCallback((next: number) => {
    const target = Math.min(SLIDES.length - 1, Math.max(0, next));
    const url = new URL(window.location.href);
    url.searchParams.set("s", String(target + 1));
    window.history.replaceState(window.history.state, "", url);
    if (target === 0) startTimer();
    notify();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "Home") go(0);
      else if (e.key === "End") go(SLIDES.length - 1);
      else if (/^[1-9]$/.test(e.key)) go(Number(e.key) - 1);
      else if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
      } else if (e.key === "n" || e.key === "N") setNotes((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  // 0.5 s fade and rise for the new slide's content; instant under reduced motion.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(`[data-slide="${index}"] [data-pitch-rise]`, { opacity: 0, y: 16, duration: 0.5, stagger: 0.06, ease: "power2.out" });
      });
    },
    { scope, dependencies: [index], revertOnUpdate: true },
  );

  const onClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button, [data-notes]")) return;
    go(index + 1);
  };

  const slide = SLIDES[index];

  return (
    <div ref={scope} className="pitch-deck relative min-h-svh bg-ink text-paper" onClick={onClick}>
      {SLIDES.map((s, i) => (
        <section
          key={s.id}
          data-slide={i}
          data-active={i === index || undefined}
          aria-hidden={i !== index}
          className="pitch-slide relative isolate min-h-svh flex-col justify-center overflow-hidden px-8 py-16 md:px-20"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[url(/topo.svg)] bg-cover opacity-[0.05]" />
          <p className="micro-label absolute top-8 left-8 text-mist md:left-20">
            {String(i + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")} · {s.label}
          </p>
          <div className="mx-auto w-full max-w-6xl">
            <PitchSlide id={s.id} priya={priya} />
          </div>
        </section>
      ))}

      <div aria-hidden="true" className="pitch-chrome fixed inset-x-0 bottom-0 h-0.5 bg-slate-line">
        <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }} />
      </div>

      {notes && (
        <aside
          data-notes
          aria-label={DECK_TEXT.notesTitle}
          className="pitch-chrome fixed inset-x-4 bottom-4 z-10 max-h-[40svh] overflow-y-auto rounded-[var(--radius)] border border-slate-line bg-granite/95 p-5 backdrop-blur md:inset-x-auto md:right-6 md:w-[520px]"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="micro-label text-mist">
              {DECK_TEXT.notesTitle} · {slide.label}
            </p>
            <p className="font-display text-lg tabular-nums">{startedAt ? formatElapsed(now - startedAt) : "00:00"}</p>
          </div>
          <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed">
            {slide.notes.map((line) => (
              <li key={line} className={cn(line.startsWith("5 min:") ? "text-mist" : "text-paper")}>
                {fill(line, values)}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-mist">{DECK_TEXT.keys}</p>
        </aside>
      )}
    </div>
  );
}
