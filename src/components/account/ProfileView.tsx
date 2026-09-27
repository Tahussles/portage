"use client";

import { ArrowRight, Mic } from "lucide-react";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { formatMonthYear } from "@/components/roadmap/format";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import { getField } from "@/lib/account/fields";
import { profileOf } from "@/lib/account/hooks";
import { editField, resolveConflict } from "@/lib/account/merge";
import { summarizePlan } from "@/lib/account/plan-summary";
import { useAccountStore, useCurrentAccount } from "@/lib/account/store";
import type { Account, FieldPath, FieldValue } from "@/lib/account/types";
import type { Locale, Pathway } from "@/lib/engine/types";
import { htmlLang, isLocale, useT, type MessageKey, type MessageVars } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { ConflictsCard } from "./profile/ConflictsCard";
import { DocumentsCard } from "./profile/DocumentsCard";
import { FieldRow, type Control } from "./profile/FieldRow";
import { PrivacyCard } from "./profile/PrivacyCard";
import { ProfileHeader } from "./profile/ProfileHeader";
import { Toast } from "./profile/Toast";

const pathway = pathwayData as unknown as Pathway;
type Translate = (key: MessageKey, vars?: MessageVars) => string;

let todayCache: string | null = null;
const getToday = () => (todayCache ??= new Date().toLocaleDateString("en-CA"));
const getReferenceDate = () => pathway.lastReviewed;
const subscribeNever = () => () => {};

const COUNTRIES = ["IN", "PH", "NG", "PK", "CN", "UA", "CO", "KE", "GH", "JM", "IR", "BD", "NP", "LK", "ZW", "ZA", "GB", "US", "FR", "MA", "LB", "HT", "CM", "EG", "BR", "MX", "VN", "KR"];
const SPOKEN = ["hi", "pa", "ur", "tl", "ar", "es", "zh", "fr", "en", "bn", "ta", "ml", "gu", "ne", "fa", "ko", "uk", "ru", "pt", "sw", "yo", "am", "so", "vi"];
const TESTS = ["IELTS", "CELBAN", "OET", "PTE", "TEF", "TCF"];

function named(codes: string[], type: "region" | "language", locale: Locale, current: FieldValue) {
  const names = new Intl.DisplayNames([htmlLang[locale]], { type });
  const all = typeof current === "string" && current && !codes.includes(current) ? [...codes, current] : codes;
  return all.map((value) => ({ value, label: names.of(value) ?? value })).sort((a, b) => a.label.localeCompare(b.label, htmlLang[locale]));
}

type FieldDef = { path: FieldPath; label: MessageKey; control: (t: Translate, locale: Locale, value: FieldValue) => Control };

const text = (): Control => ({ kind: "text" });
const opts = (pairs: [string, MessageKey][]) => (t: Translate): Control => ({ kind: "select", options: pairs.map(([value, key]) => ({ value, label: t(key) })) });

const SECTIONS: { id: string; title: MessageKey; fields: FieldDef[] }[] = [
  {
    id: "about",
    title: "profile.section.about",
    fields: [
      { path: "displayName", label: "profile.field.displayName", control: text },
      { path: "legalName", label: "profile.field.legalName", control: text },
      { path: "preferredLanguage", label: "profile.field.preferredLanguage", control: opts([["en", "docsLang.en"], ["fr", "docsLang.fr"]]) },
      { path: "spokenLanguage", label: "profile.field.spokenLanguage", control: (_t, l, v) => ({ kind: "select", options: named(SPOKEN, "language", l, v) }) },
    ],
  },
  {
    id: "education",
    title: "profile.section.education",
    fields: [
      { path: "profile.countryOfEducation", label: "chip.countryOfEducation", control: (_t, l, v) => ({ kind: "select", options: named(COUNTRIES, "region", l, v) }) },
      { path: "profile.credential", label: "chip.credential", control: opts([["bachelor", "credential.bachelor"], ["diploma", "credential.diploma"], ["other", "credential.other"]]) },
      { path: "profile.graduationYear", label: "chip.graduationYear", control: () => ({ kind: "number", min: 1960, max: 2035 }) },
    ],
  },
  {
    id: "practice",
    title: "profile.section.practice",
    fields: [
      { path: "profile.yearsExperience", label: "chip.yearsExperience", control: () => ({ kind: "number", min: 0, max: 60 }) },
      { path: "profile.lastPractisedAt", label: "chip.lastPractisedAt", control: () => ({ kind: "month" }) },
    ],
  },
  {
    id: "language",
    title: "profile.section.language",
    fields: [
      { path: "profile.languageProficiency.status", label: "chip.languageProficiency.status", control: opts([["none", "langTest.none"], ["booked", "langTest.booked"], ["passed", "langTest.passed"], ["via_education_or_work", "langTest.via_education_or_work"]]) },
      { path: "profile.languageProficiency.test", label: "profile.field.test", control: () => ({ kind: "select", options: TESTS.map((v) => ({ value: v, label: v })) }) },
      { path: "profile.languageProficiency.date", label: "profile.field.testDate", control: () => ({ kind: "month" }) },
      { path: "profile.documentsLanguage", label: "chip.documentsLanguage", control: opts([["en", "docsLang.en"], ["fr", "docsLang.fr"], ["other", "docsLang.other"], ["mixed", "docsLang.mixed"]]) },
    ],
  },
  {
    id: "work",
    title: "profile.section.work",
    fields: [
      // Yes, no or not sure only: Portage never asks for an immigration category.
      { path: "profile.authorizedToWork", label: "chip.authorizedToWork", control: opts([["yes", "answer.yes"], ["no", "answer.no"], ["unsure", "answer.unsure"]]) },
      { path: "profile.currentlyInCanada", label: "chip.currentlyInCanada", control: () => ({ kind: "yesno" }) },
    ],
  },
  {
    id: "progress",
    title: "profile.section.progress",
    fields: [
      ...(["ecaStarted", "cnoAccountCreated", "cnoApplicationSubmitted", "ttpCompleted", "jurisprudencePassed", "registrationExamPassed"] as const).map(
        (k): FieldDef => ({ path: `profile.progress.${k}`, label: `profile.progress.${k}`, control: () => ({ kind: "check" }) }),
      ),
      { path: "profile.progress.criminalRecordCheckDate", label: "profile.progress.criminalRecordCheckDate", control: () => ({ kind: "date" }) },
    ],
  },
];

const LABELS = new Map(SECTIONS.flatMap((s) => s.fields.map((f) => [f.path, f.label] as const)));

function SignedOut() {
  const t = useT();
  return (
    <main className="min-h-svh bg-ink pt-(--nav-h)">
      <section className="mx-auto flex max-w-xl flex-col items-start px-5 py-20 md:px-8">
        <p className="micro-label text-mist">{t("profile.label")}</p>
        <h1 className="mt-3 font-display text-3xl leading-tight font-medium tracking-tight md:text-5xl">{t("profile.signedOut.title")}</h1>
        <p className="mt-4 text-sm leading-relaxed text-mist md:text-base">{t("profile.signedOut.body")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <AppLink href="/signin" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent-hover">
            {t("profile.signedOut.signIn")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </AppLink>
          <AppLink href="/start" className="inline-flex items-center gap-2 rounded-full border border-slate-line px-5 py-2.5 text-sm text-paper hover:border-mist">
            <Mic aria-hidden="true" className="size-4" />
            {t("profile.signedOut.start")}
          </AppLink>
        </div>
      </section>
    </main>
  );
}

/** /profile: one place for everything Portage knows about the signed-in person, every fact editable. */
export function ProfileView() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const hydrated = useAccountStore((s) => s.hydrated);
  const update = useAccountStore((s) => s.update);
  const account = useCurrentAccount();
  const today = useSyncExternalStore(subscribeNever, getToday, getReferenceDate);
  const summary = useMemo(() => (account ? summarizePlan(profileOf(account), pathway, today) : null), [account, today]);
  const [flash, setFlash] = useState<{ path: FieldPath; n: number } | null>(null);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const saves = useRef(0);
  const clearToast = useCallback(() => setToast(null), []);

  if (!hydrated) return <main className="min-h-svh bg-ink pt-(--nav-h)" />;
  if (!account || !summary) return <SignedOut />;

  // Save, highlight the field, and say so when the earliest licence moves.
  const apply = (next: Account, path: FieldPath) => {
    update(() => next);
    if (path === "preferredLanguage" && isLocale(next.preferredLanguage)) setLocale(next.preferredLanguage);
    saves.current += 1;
    const after = summarizePlan(profileOf(next), pathway, today).finish;
    if (after.slice(0, 7) !== summary.finish.slice(0, 7)) {
      setToast({ text: t("profile.toast.licence", { from: formatMonthYear(summary.finish, locale), to: formatMonthYear(after, locale) }), id: saves.current });
    }
    setFlash({ path, n: saves.current });
  };
  const commit = (path: FieldPath, value: FieldValue) => apply(editField(account, path, value, new Date().toISOString()), path);
  const resolve = (id: string, option: number) => {
    const conflict = account.conflicts.find((c) => c.id === id);
    if (conflict) apply(resolveConflict(account, id, option, new Date().toISOString()), conflict.path);
  };
  const labelFor = (path: string) => (LABELS.has(path) ? t(LABELS.get(path)!) : path);

  return (
    <main className="min-h-svh bg-ink pt-(--nav-h)">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-8 md:px-8 md:py-10">
        <p className="micro-label text-mist">{t("profile.label")}</p>
        <ProfileHeader account={account} summary={summary} />
        <ConflictsCard account={account} labelFor={labelFor} onResolve={resolve} />
        <div className="grid gap-5 md:grid-cols-2">
          {SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`section-${section.id}`} className="rounded-[var(--radius)] border border-slate-line bg-granite/60 p-5">
              <h2 id={`section-${section.id}`} className="micro-label mb-1 text-mist">
                {t(section.title)}
              </h2>
              <div className="flex flex-col">
                {section.fields.map((f) => {
                  const value = getField(account, f.path);
                  return (
                    <FieldRow
                      key={f.path}
                      label={t(f.label)}
                      value={value}
                      control={f.control(t, locale, value)}
                      provenance={account.provenance[f.path]}
                      onCommit={(v) => commit(f.path, v)}
                      flash={flash?.path === f.path ? flash.n : undefined}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <DocumentsCard account={account} />
        <PrivacyCard account={account} />
      </div>
      <p aria-live="polite" className="sr-only">
        {flash ? t("profile.saved") : ""}
      </p>
      <Toast message={toast} onDone={clearToast} />
    </main>
  );
}
