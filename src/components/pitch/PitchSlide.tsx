"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MapleMark } from "@/components/ui/MapleMark";
import { DECK_TEXT as T, fill, type SlideId } from "./copy";
import { dataFacts, type priyaFacts } from "./facts";
import { SOURCES, WHY_NOW } from "./sources";

type PitchSlideProps = {
  id: SlideId;
  priya: ReturnType<typeof priyaFacts>;
};

const n = (value: number) => new Intl.NumberFormat("en-CA").format(value);
const date = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" }).format(Date.parse(`${iso}T00:00:00Z`));

function SourceLine({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-mist underline-offset-4 hover:text-paper hover:underline">
      {T.sourcePrefix} {children}
    </a>
  );
}

function Big({ value, label }: { value: string; label: string }) {
  return (
    <div data-pitch-rise className="flex flex-col">
      <span className="font-display text-7xl leading-none font-medium tracking-tight tabular-nums md:text-8xl">{value}</span>
      <span className="mt-3 max-w-xs text-base leading-snug text-paper md:text-lg">{label}</span>
    </div>
  );
}

const title = "font-display text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[1.05] font-medium tracking-tight";

/** One slide's content. Every number comes from facts.ts (data files and the engine) or sources.ts. */
export function PitchSlide({ id, priya }: PitchSlideProps) {
  const facts = dataFacts();

  switch (id) {
    case "hook":
      return (
        <div className="flex flex-col gap-10">
          <span data-pitch-rise>
            <MapleMark className="size-12 text-accent" />
          </span>
          <h1 data-pitch-rise className="max-w-5xl font-display text-[clamp(2.75rem,7vw,6rem)] leading-[1.03] font-medium tracking-tight">
            {T.hook}
          </h1>
        </div>
      );

    case "priya":
      return (
        <div className="flex flex-col gap-6">
          <h2 data-pitch-rise className={title}>
            {T.priyaName}
          </h2>
          <p data-pitch-rise className="font-display text-[clamp(1.75rem,4vw,3.25rem)] leading-tight">
            <span className="block text-paper">{T.priyaLine1}</span>
            <span className="block text-stone-500">{T.priyaLine2}</span>
          </p>
          <p data-pitch-rise className="micro-label text-mist">
            {T.priyaNote}
          </p>
        </div>
      );

    case "problem":
      return (
        <div className="flex flex-col gap-12">
          <h2 data-pitch-rise className={title}>
            {T.problemTitle}
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            <Big value={n(facts.requirements)} label={T.problemRequirements} />
            {facts.guidelineMonths && <Big value={`~${facts.guidelineMonths}`} label={T.problemGuideline} />}
            <Big value={n(facts.applicants)} label={T.problemApplicants} />
          </div>
          <p data-pitch-rise className="max-w-2xl text-lg text-mist">
            {T.problemOrgs}
          </p>
          <div data-pitch-rise className="flex flex-col gap-1">
            <SourceLine href={facts.requirementsSource.url}>{facts.requirementsSource.label}</SourceLine>
            <SourceLine href={facts.applicantsSource.url}>
              {facts.applicantsSource.label}, {T.asOf} {date(facts.applicantsAsOf)}
            </SourceLine>
          </div>
        </div>
      );

    case "whyNow":
      return (
        <div className="flex flex-col gap-10">
          <h2 data-pitch-rise className={title}>
            {T.whyNowTitle}
          </h2>
          <div className="grid gap-10 md:grid-cols-2">
            <div data-pitch-rise className="flex flex-col gap-3">
              <span className="font-display text-5xl font-medium tracking-tight md:text-6xl">{WHY_NOW.flmmMeeting}</span>
              <p className="text-lg leading-relaxed text-paper">{fill(T.whyNowFlmm, { due: WHY_NOW.flmmRecommendationsDue })}</p>
              <SourceLine href={SOURCES.flmm.url}>
                {SOURCES.flmm.publisher}, {SOURCES.flmm.date}
              </SourceLine>
              <SourceLine href={SOURCES.flmmRelease.url}>{SOURCES.flmmRelease.publisher}</SourceLine>
            </div>
            <div data-pitch-rise className="flex flex-col gap-3">
              <span className="font-display text-5xl font-medium tracking-tight tabular-nums md:text-6xl">{WHY_NOW.fcrAgreements}</span>
              <p className="text-lg leading-relaxed text-paper">{fill(T.whyNowFcr, { professionals: n(WHY_NOW.fcrProfessionals) })}</p>
              <SourceLine href={SOURCES.fcr.url}>
                {SOURCES.fcr.publisher}, {SOURCES.fcr.date}
              </SourceLine>
            </div>
          </div>
        </div>
      );

    case "demo":
      return (
        <div className="flex flex-col items-start gap-10">
          <h2 data-pitch-rise className={title}>
            {T.demoTitle}
          </h2>
          <Link
            data-pitch-rise
            href="/signin?from=pitch"
            className="inline-flex items-center gap-3 rounded-full bg-paper px-8 py-4 text-lg font-medium text-ink transition-colors hover:bg-white"
          >
            {T.demoButton}
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <Link data-pitch-rise href="/signin?from=pitch&demo=1" className="text-sm text-mist underline-offset-4 hover:text-paper hover:underline">
            {T.demoBackup}
          </Link>
        </div>
      );

    case "happened":
      return (
        <div className="flex flex-col gap-10">
          <h2 data-pitch-rise className={title}>
            {T.happenedTitle}
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            <Big value={priya.oneAtATime} label={T.happenedOneAtATime} />
            <div data-pitch-rise className="flex flex-col">
              <span className="font-display text-7xl leading-none font-medium tracking-tight text-accent md:text-8xl">
                {priya.portagePlan}
              </span>
              <span className="mt-3 text-base text-paper md:text-lg">{T.happenedPortage}</span>
              {priya.tightOnPortagePlan && <span className="micro-label mt-2 text-accent">{T.happenedTight}</span>}
            </div>
            {priya.windowCloses && <Big value={priya.windowCloses} label={T.happenedWindow} />}
          </div>
          <p data-pitch-rise className="text-sm text-mist">
            {T.happenedEngine}
          </p>
        </div>
      );

    case "business":
      return (
        <div className="flex flex-col gap-10">
          <h2 data-pitch-rise className={title}>
            {T.businessTitle}
          </h2>
          <ul className="flex flex-col gap-6">
            {T.business.map((b) => (
              <li data-pitch-rise key={b.who} className="max-w-4xl border-l-2 border-slate-line pl-5 text-xl leading-snug md:text-2xl">
                <span className="text-paper">{b.who}</span> <span className="text-mist">{b.what}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "moat":
      return (
        <div className="flex flex-col gap-10">
          <h2 data-pitch-rise className={title}>
            {T.moatTitle}
          </h2>
          <ul className="grid gap-6 md:grid-cols-2">
            {T.moatOthers.map((o) => (
              <li data-pitch-rise key={o.who} className="rounded-[var(--radius)] border border-slate-line p-5">
                <p className="text-lg text-paper">{o.who}</p>
                <p className="mt-2 text-mist">{o.what}</p>
              </li>
            ))}
          </ul>
          <p data-pitch-rise className="max-w-4xl border-l-2 border-accent pl-5 font-display text-2xl leading-snug md:text-3xl">
            {T.moatPortage}
          </p>
        </div>
      );

    case "next":
      return (
        <div className="flex flex-col gap-10">
          <h2 data-pitch-rise className={title}>
            {T.nextTitle}
          </h2>
          <ol className="flex flex-col gap-3">
            {T.next.map((item) => (
              <li data-pitch-rise key={item} className="text-xl text-paper md:text-2xl">
                {item}
              </li>
            ))}
          </ol>
          <div data-pitch-rise className="mt-4 flex flex-col gap-2">
            <p className="micro-label text-mist">{T.team}</p>
            <p className="font-display text-[clamp(2.25rem,5vw,4rem)] leading-tight font-medium tracking-tight">
              <span className="text-paper">{T.close1} </span>
              <span className="text-stone-500">{T.close2}</span>
            </p>
          </div>
        </div>
      );
  }
}
