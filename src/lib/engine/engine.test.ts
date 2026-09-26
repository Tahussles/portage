import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import pathwayJson from "@/data/pathways/on-rn-ien.json";
import planPriyaFixture from "@/data/fixtures/plan-priya.json";
import profilePriya from "@/data/fixtures/profile-priya.json";
import { evaluateRule, getApplicability } from "./applicability";
import { buildPlan } from "./plan";
import { parsePathway } from "./schema";
import { schedule, topologicalOrder } from "./schedule";
import type { NodeStatus, PathwayNode, Profile } from "./types";

const TODAY = "2026-09-26";
const pathway = parsePathway(pathwayJson);
const priya = profilePriya as Profile;

// Marco: Philippines BSN, passed the NCLEX-RN elsewhere, IELTS passed 6 months ago, ECA started.
const marco: Profile = {
  ...priya,
  countryOfEducation: "PH",
  lastPractisedAt: "2026-06",
  nameOnDocumentsMatches: true,
  documentsLanguage: "en",
  languageProficiency: { status: "passed", test: "IELTS", date: "2026-03-26" },
  progress: { ...priya.progress, ecaStarted: true, registrationExamPassed: true },
  spokenLanguage: "tl",
};

// Amina: diploma, last practised 4 years ago.
const amina: Profile = {
  ...priya,
  countryOfEducation: "NG",
  credential: "diploma",
  lastPractisedAt: "2022-09",
  nameOnDocumentsMatches: true,
  documentsLanguage: "en",
  spokenLanguage: "en",
};

const ids = (warnings: { id: string }[]) => warnings.map((w) => w.id);

describe("rules", () => {
  it("evaluates every operator and combinator", () => {
    expect(evaluateRule({ field: "credential", op: "eq", value: "bachelor" }, priya)).toBe(true);
    expect(evaluateRule({ field: "credential", op: "neq", value: "bachelor" }, priya)).toBe(false);
    expect(evaluateRule({ field: "documentsLanguage", op: "in", value: ["other", "mixed"] }, priya)).toBe(true);
    expect(evaluateRule({ field: "progress.cnoAccountCreated", op: "truthy" }, priya)).toBe(false);
    expect(evaluateRule({ field: "progress.criminalRecordCheckDate", op: "falsy" }, priya)).toBe(true);
    expect(evaluateRule({ field: "no.such.field", op: "falsy" }, priya)).toBe(true);
    expect(
      evaluateRule(
        { all: [{ any: [{ field: "province", op: "eq", value: "ON" }] }, { not: { field: "credential", op: "eq", value: "other" } }] },
        priya,
      ),
    ).toBe(true);
  });
});

describe("golden: Priya (demo persona)", () => {
  const plan = buildPlan(priya, pathway, TODAY);

  it("has every step to do, including translations for mixed-language documents", () => {
    for (const id of pathway.nodes.map((n) => n.id)) expect(plan.statuses[id], id).toBe("todo");
  });

  it("computes both totals", () => {
    expect(plan.sequential.totalWeeks).toBe(58);
    expect(plan.sequential.finishDate).toBe("2027-11-06");
    expect(plan.parallel.totalWeeks).toBe(21.1);
    expect(plan.parallel.finishDate).toBe("2027-02-21");
    expect(plan.parallel.criticalPath).toEqual(["eca", "cno_application", "registration_exam", "registration"]);
    expect(plan.estimateShare).toBe(0.9);
  });

  it("schedules the criminal record check as late as possible", () => {
    const crc = pathway.nodes.find((n) => n.id === "criminal_record_check")!;
    expect(plan.parallel.startWeek.criminal_record_check + crc.duration.typicalWeeks).toBe(plan.parallel.totalWeeks);
    expect(plan.order.indexOf("criminal_record_check")).toBe(plan.order.length - 2);
  });

  it("does not fire the evidence-of-practice warning: July 2025 + 3 years is after February 2027", () => {
    expect(ids(plan.warnings)).toEqual(["direct_from_source", "translation_needed"]);
  });

  it("fires the evidence-of-practice warning once the window closes before the finish", () => {
    const later = buildPlan({ ...priya, lastPractisedAt: "2024-01" }, pathway, TODAY);
    expect(ids(later.warnings)[0]).toBe("evidence_of_practice_window");
    expect(later.statuses.evidence_of_practice).toBe("todo");
  });

  it("matches the committed plan-priya.json fixture used by the roadmap UI", () => {
    expect(planPriyaFixture).toEqual(JSON.parse(JSON.stringify(plan)));
  });
});

describe("golden: Marco (exam passed elsewhere, IELTS passed)", () => {
  const plan = buildPlan(marco, pathway, TODAY);

  it("marks the exam and language test done, translations not applicable", () => {
    expect(plan.statuses.registration_exam).toBe("done");
    expect(plan.statuses.language_test).toBe("done");
    expect(plan.statuses.language).toBe("todo");
    expect(plan.statuses.translations).toBe("not_applicable");
    expect(plan.statuses.eca).toBe("todo");
  });

  it("is shorter than Priya on both schedules", () => {
    const p = buildPlan(priya, pathway, TODAY);
    expect(plan.sequential.totalWeeks).toBe(39);
    expect(plan.parallel.totalWeeks).toBe(12.1);
    expect(plan.parallel.criticalPath).toEqual(["ttp_course", "ttp", "registration"]);
    expect(plan.sequential.totalWeeks).toBeLessThan(p.sequential.totalWeeks);
    expect(plan.parallel.totalWeeks).toBeLessThan(p.parallel.totalWeeks);
    expect(ids(plan.warnings)).toEqual(["direct_from_source"]);
  });
});

describe("golden: Amina (last practised 4 years ago)", () => {
  const plan = buildPlan(amina, pathway, TODAY);

  it("blocks evidence of practice with a reason", () => {
    expect(plan.statuses.evidence_of_practice).toBe("blocked");
    const { blockedReasons } = getApplicability(amina, pathway, new Date(Date.UTC(2026, 8, 26)));
    expect(blockedReasons.evidence_of_practice).toMatch(/36 months/);
  });

  it("raises the critical evidence-of-practice warning first, linking CNO's page", () => {
    expect(plan.warnings[0].id).toBe("evidence_of_practice_window");
    expect(plan.warnings[0].severity).toBe("critical");
    expect(plan.warnings[0].sourceUrl).toBe("https://www.cno.org/become-a-nurse/registration-requirements/evidence-of-practice");
    expect(plan.warnings[0].body.en).toMatch(/SPEP/);
  });

  it("still schedules the blocked step so the roadmap shows where it sits", () => {
    expect(plan.sequential.totalWeeks).toBe(55);
    expect(plan.parallel.totalWeeks).toBe(21.1);
    expect(plan.parallel.startWeek.evidence_of_practice).toBeGreaterThan(0);
  });
});

describe("other warnings", () => {
  it("warns when a criminal record check will be stale at the projected finish", () => {
    const withOldCheck = { ...priya, progress: { ...priya.progress, criminalRecordCheckDate: "2026-06-01" } };
    expect(ids(buildPlan(withOldCheck, pathway, TODAY).warnings)).toContain("crc_validity");
    const withFreshCheck = { ...priya, progress: { ...priya.progress, criminalRecordCheckDate: "2027-01-15" } };
    expect(ids(buildPlan(withFreshCheck, pathway, TODAY).warnings)).not.toContain("crc_validity");
  });

  it("flags non-nursing credentials and unsure work authorization", () => {
    const plan = buildPlan({ ...priya, credential: "other", authorizedToWork: "unsure" }, pathway, TODAY);
    expect(ids(plan.warnings)).toEqual(expect.arrayContaining(["non_nursing_credential", "authorization_unsure_or_no"]));
    expect(plan.warnings[0].severity).toBe("critical");
  });

  it("warns about the 2-year application window when steps after applying run too long", () => {
    const slow = parsePathway(structuredClone(pathwayJson));
    slow.nodes.find((n) => n.id === "registration_exam")!.duration = {
      minWeeks: 100,
      typicalWeeks: 110,
      maxWeeks: 120,
      kind: "estimate",
      note: "test only",
    };
    expect(ids(buildPlan(priya, slow, TODAY).warnings)).toContain("application_window");
    expect(ids(buildPlan(priya, pathway, TODAY).warnings)).not.toContain("application_window");
  });

  it("treats done and not-applicable dependencies as satisfied", () => {
    const applied = buildPlan(
      { ...priya, progress: { ...priya.progress, cnoAccountCreated: true, cnoApplicationSubmitted: true } },
      pathway,
      TODAY,
    );
    expect(applied.statuses.eca).toBe("done");
    expect(applied.parallel.startWeek.jurisprudence).toBe(0);
    expect(applied.parallel.startWeek.registration_exam).toBe(0);
  });
});

describe("scheduling primitives", () => {
  const node = (id: string, dependsOn: string[], weeks = 1): PathwayNode => ({
    id,
    title: { en: id, fr: id },
    summary: { en: id, fr: id },
    actor: ["you"],
    dependsOn,
    duration: { minWeeks: weeks, typicalWeeks: weeks, maxWeeks: weeks, kind: "official", note: "test" },
    sources: [{ label: "test", url: "https://example.org", accessed: TODAY }],
  });

  it("throws on cycles and unknown dependencies", () => {
    expect(() => topologicalOrder([node("a", ["b"]), node("b", ["a"])])).toThrow(/cycle/);
    expect(() => topologicalOrder([node("a", ["zzz"])])).toThrow(/unknown/);
  });

  it("returns zero totals when everything is done", () => {
    const nodes = [node("a", []), node("b", ["a"])];
    const statuses: Record<string, NodeStatus> = { a: "done", b: "done" };
    const s = schedule(nodes, statuses);
    expect(s.sequential.totalWeeks).toBe(0);
    expect(s.parallel.totalWeeks).toBe(0);
    expect(s.parallel.criticalPath).toEqual([]);
  });
});

describe("property: random profiles", () => {
  // Small seeded PRNG (mulberry32) so failures are reproducible.
  function rng(seed: number) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const maybe = (r: () => number) => pick(r, [true, false, null] as const);

  function randomProfile(r: () => number): Profile {
    const year = 2012 + Math.floor(r() * 15);
    const month = String(1 + Math.floor(r() * 12)).padStart(2, "0");
    return {
      ...priya,
      credential: pick(r, ["bachelor", "diploma", "other", null] as const),
      lastPractisedAt: r() < 0.1 ? null : `${year}-${month}`,
      authorizedToWork: pick(r, ["yes", "no", "unsure", null] as const),
      documentsLanguage: pick(r, ["en", "fr", "other", "mixed", null] as const),
      languageProficiency: { status: pick(r, ["none", "booked", "passed", "via_education_or_work", null] as const) },
      progress: {
        ecaStarted: maybe(r),
        cnoAccountCreated: maybe(r),
        cnoApplicationSubmitted: maybe(r),
        ttpCompleted: maybe(r),
        jurisprudencePassed: maybe(r),
        registrationExamPassed: maybe(r),
        criminalRecordCheckDate: r() < 0.3 ? `2026-0${1 + Math.floor(r() * 9)}-15` : null,
      },
    };
  }

  it("parallel total never exceeds one-at-a-time, and nothing is NaN", () => {
    const r = rng(42);
    for (let i = 0; i < 200; i++) {
      const profile = randomProfile(r);
      const plan = buildPlan(profile, pathway, TODAY);
      const ctx = JSON.stringify(profile);
      expect(plan.parallel.totalWeeks, ctx).toBeLessThanOrEqual(plan.sequential.totalWeeks);
      expect(Number.isFinite(plan.parallel.totalWeeks), ctx).toBe(true);
      expect(Number.isFinite(plan.sequential.totalWeeks), ctx).toBe(true);
      expect(plan.estimateShare, ctx).toBeGreaterThanOrEqual(0);
      expect(plan.estimateShare, ctx).toBeLessThanOrEqual(1);
      expect(plan.parallel.finishDate, ctx).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const w of Object.values(plan.parallel.startWeek)) expect(Number.isFinite(w), ctx).toBe(true);
    }
  });

  it("is deterministic", () => {
    expect(buildPlan(priya, pathway, TODAY)).toEqual(buildPlan(priya, pathway, TODAY));
  });
});

describe("purity", () => {
  it("engine source never reads the clock, the network or the browser", () => {
    const dir = __dirname;
    const sources = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    for (const file of sources) {
      const text = readFileSync(join(dir, file), "utf8");
      expect(text, file).not.toMatch(/Date\.now|new Date\(\)|fetch\(|window\.|localStorage|from "react"/);
    }
  });
});
