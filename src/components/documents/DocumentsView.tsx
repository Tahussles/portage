"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { useCallback, useEffect, useRef, useState } from "react";
import { isDemoMode } from "@/components/intake/intake-api";
import { profileFixture } from "@/lib/demo";
import { useT } from "@/lib/i18n";
import { useActiveProfile } from "@/lib/account/hooks";
import { mergeDocument } from "@/lib/account/merge";
import { useAccountStore, useCurrentAccount } from "@/lib/account/store";
import { useAppStore } from "@/lib/store";
import {
  SAMPLES,
  countIssues,
  extractionRows,
  isPdf,
  loadSample,
  runCheck,
  validateFile,
  type CheckOutcome,
  type FileProblem,
  type Sample,
} from "./doc-check";
import { DocPreview } from "./DocPreview";
import { NextLink } from "@/components/ui/NextLink";
import { DropZone } from "./DropZone";
import { FindingsList } from "./FindingsList";

/** Priya (composite persona) when nobody has done the intake yet. */
const SAMPLE_PROFILE = profileFixture().profile;

type Current = { name: string; src: string; kind: "image" | "pdf"; objectUrl: boolean };

export function DocumentsView() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const profile = useActiveProfile();
  const account = useCurrentAccount();

  const [current, setCurrent] = useState<Current | null>(null);
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [scanned, setScanned] = useState(false);
  const [problem, setProblem] = useState<FileProblem | "docs.error.read" | null>(null);
  // Signed in, the legal name comes from the profile (settled there when sources disagree).
  const [typedName, setLegalName] = useState<string | null>(null);
  const legalName = typedName ?? account?.legalName ?? "";
  const run = useRef(0);

  // Release blob URLs for uploaded files.
  useEffect(() => {
    return () => {
      if (current?.objectUrl) URL.revokeObjectURL(current.src);
    };
  }, [current]);

  const reset = useCallback(() => {
    run.current += 1;
    setCurrent(null);
    setOutcome(null);
    setScanned(false);
  }, []);

  const check = useCallback(
    async (file: File, preview: Current) => {
      const id = ++run.current;
      setProblem(null);
      setOutcome(null);
      setScanned(false);
      setCurrent(preview);
      const result = await runCheck(file, { profile: profile ?? SAMPLE_PROFILE, legalName, demo: isDemoMode() });
      if (id !== run.current) return; // a newer document replaced this one
      if (result.kind === "error") {
        setProblem("docs.error.read");
        setCurrent(null);
        return;
      }
      setOutcome(result);
      // Signed in: keep the findings and the extracted fields (never the file) on the account.
      const store = useAccountStore.getState();
      if (store.currentId) {
        const at = new Date().toISOString();
        const { extraction, findings } = result.data;
        store.update((a) =>
          mergeDocument(a, { id: `${extraction.docType}@${at}`, docType: extraction.docType, checkedAt: at, extraction, findings, sample: result.sample }),
        );
      }
    },
    [profile, legalName],
  );

  const onFile = (file: File) => {
    const invalid = validateFile(file);
    if (invalid) {
      setProblem(invalid);
      return;
    }
    const src = URL.createObjectURL(file);
    void check(file, { name: file.name, src, kind: isPdf(file) ? "pdf" : "image", objectUrl: true });
  };

  const onSample = async (sample: Sample) => {
    try {
      const file = await loadSample(sample);
      void check(file, { name: t(sample.label), src: sample.thumb, kind: "image", objectUrl: false });
    } catch {
      setProblem("docs.error.read");
    }
  };

  const result = outcome?.kind === "result" && scanned ? outcome : null;
  const issues = result ? countIssues(result.data.findings) : 0;

  return (
    <main className="min-h-svh bg-paper text-ink">
      <section className="bg-ink pt-(--nav-h) text-paper">
        <div className="mx-auto max-w-5xl px-5 pt-10 pb-12 md:px-8">
          <p className="micro-label text-mist">{t("documents.label")}</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight font-medium tracking-tight md:text-5xl">
            {t("documents.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist md:text-base">{t("docs.intro")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
        {!current && (
          <div className="flex flex-col gap-8">
            <DropZone onFile={onFile} />
            {problem && (
              <p role="alert" className="-mt-4 text-sm font-medium text-accent">
                {t(problem)}
              </p>
            )}

            <label className="flex max-w-md flex-col gap-1.5 text-sm">
              <span className="font-medium">{t("docs.legalName")}</span>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                autoComplete="off"
                className="rounded-[var(--radius)] border border-rule bg-white px-3 py-2 text-ink"
              />
              <span className="text-xs text-quiet">{t("docs.legalNameHint")}</span>
            </label>

            <div>
              <p className="micro-label mb-3 text-quiet">{t("docs.samples")}</p>
              <ul className="grid grid-cols-2 gap-3 sm:max-w-md">
                {SAMPLES.map((sample) => (
                  <li key={sample.id}>
                    <button
                      type="button"
                      onClick={() => void onSample(sample)}
                      className="group flex w-full flex-col overflow-hidden rounded-[var(--radius)] border border-rule bg-white text-left transition-colors hover:border-ink"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- static sample thumbnail */}
                      <img src={sample.thumb} alt="" className="aspect-[4/3] w-full object-cover object-top" />
                      <span className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                        <span className="font-medium">{t(sample.label)}</span>
                        <span className="micro-label text-accent">{t("docs.watermark")}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {current && (
          <div className="grid gap-8 md:grid-cols-[260px_1fr] md:gap-12">
            <DocPreview
              name={current.name}
              src={current.src}
              kind={current.kind}
              scanning={!result}
              onScanned={() => setScanned(true)}
            />

            <div aria-live="polite" className="min-w-0">
              {!result && <p className="text-sm text-quiet">{t("docs.scanning")}</p>}

              {result && (
                <div className="flex flex-col gap-8">
                  {result.sample && (
                    <p className="flex flex-wrap items-center gap-2 text-xs text-quiet">
                      <span className="rounded-full border border-rule bg-white px-3 py-1 font-medium text-ink">
                        {t("intake.sample")}
                      </span>
                      <span>{t("docs.sampleNote")}</span>
                    </p>
                  )}

                  <div>
                    <h2 className="micro-label text-quiet">{t("docs.findings")}</h2>
                    <p className="mt-2 font-display text-2xl font-medium tracking-tight">
                      {issues === 0
                        ? t("docs.summary.none")
                        : issues === 1
                          ? t("docs.summary.one")
                          : t("docs.summary.many", { n: issues })}
                    </p>
                    <div className="mt-4">
                      <FindingsList findings={result.data.findings} />
                    </div>
                  </div>

                  <div>
                    <h2 className="micro-label mb-2 text-quiet">{t("docs.fields")}</h2>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                      {extractionRows(result.data.extraction, t, locale).map((row) => (
                        <div key={row.label} className="contents">
                          <dt className="text-quiet">{row.label}</dt>
                          <dd className="text-ink">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex items-center gap-2 rounded-full border border-rule bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-ink"
                    >
                      <RotateCcw aria-hidden="true" className="size-4" />
                      {t("docs.another")}
                    </button>
                    <AppLink
                      href="/roadmap"
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
                    >
                      {t("docs.roadmapLink")}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </AppLink>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-col gap-6 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-xs leading-relaxed text-quiet">{t("docs.consent")}</p>
          <NextLink from="documents" tone="light" />
        </div>
      </section>
    </main>
  );
}
