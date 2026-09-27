"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Check, ExternalLink, Flag, Info } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import type { DocFinding } from "@/lib/engine/types";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { toneOf } from "./doc-check";

gsap.registerPlugin(useGSAP);

type FindingsListProps = { findings: DocFinding[] };

/** Ink ticks for OK, red flags for issues, each with the plain-language fix and CNO's source. */
export function FindingsList({ findings }: FindingsListProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const scope = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-finding]", { opacity: 0, x: 24, duration: 0.5, stagger: 0.1, ease: "power2.out" });
      });
    },
    { scope },
  );

  return (
    <ol ref={scope} className="flex flex-col gap-3 overflow-x-clip">
      {findings.map((finding) => {
        const tone = toneOf(finding);
        const Icon = tone === "ok" ? Check : tone === "issue" ? Flag : Info;
        return (
          <li
            key={finding.id}
            data-finding
            className={cn(
              "flex gap-3 rounded-r-[var(--radius)] rounded-l-none border-l-2 bg-white p-4",
              tone === "issue" ? "border-accent" : tone === "ok" ? "border-ink" : "border-rule",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full",
                tone === "ok" && "bg-ink text-paper",
                tone === "issue" && "bg-accent-soft text-accent",
                tone === "info" && "bg-paper text-quiet",
              )}
            >
              <Icon className="size-3.5" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                <span className="sr-only">{t(`docs.severity.${tone}`)}{locale === "fr" ? " : " : ": "}</span>
                {finding.title[locale] || finding.title.en}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-quiet">{finding.body[locale] || finding.body.en}</p>
              <a
                href={finding.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink underline-offset-4 hover:underline"
              >
                {t("docs.source")}
                <ExternalLink aria-hidden="true" className="size-3" />
                <span className="sr-only"> ({t("panel.newTab")})</span>
              </a>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
