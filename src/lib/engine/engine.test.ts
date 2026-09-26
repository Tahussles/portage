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
    for (const n of pathway.nodes.filter((n) => n.lane !== "side")) expect(plan.statuses[n.id], n.id).toBe("todo");
  });

  it("computes both totals", () => {
    expect(plan.sequential.totalWeeks).toBe(64);
    expect(plan.sequential.finishDate).toBe("2027-12-18");
    expect(plan.parallel.totalWeeks).toBe(27.1);
    expect(plan.parallel.finishDate).toBe("2027-04-04");
    expect(plan.parallel.criticalPath).toEqual(["school_documents", "eca", "cno_application", "registration_exam", "registration"]);
    expect(plan.estimateShare).toBe(0.923);
  });

  it("schedules the criminal record check as late as possible", () => {
    const crc = pathway.nodes.find((n) => n.id === "criminal_record_check")!;
    expect(plan.parallel.startWeek.criminal_record_check + crc.duration.typicalWeeks).toBe(plan.parallel.totalWeeks);
    expect(plan.order.indexOf("criminal_record_check")).toBe(plan.order.length - 2);
  });

  it("raises evidence of practice per schedule: critical one at a time, tight in the Portage plan (issue #13)", () => {
    expect(ids(plan.warnings)).toEqual(["evidence_of_practice_window", "direct_from_source", "translation_needed"]);
    const eop = plan.warnings[0];
    // Window closes Jul 2027. One at a time finishes Dec 2027 (typical); the Portage plan finishes
    // Apr 2027 (typical) but Aug 2027 (conservative).
    expect(eop).toMatchObject({
      severity: "critical",
      schedules: ["sequential", "parallel"],
      severityBySchedule: { sequential: "critical", parallel: "warn" },
      facts: {
        windowCloses: "2027-07",
        backup: "spep",
        backupEligibleUntil: "2032-07",
        backupSourceUrl:
          "https://www.cno.org/become-a-nurse/registration-requirements/evidence-of-practice/supervised-practice-experience-partnership",
      },
    });
    // Profile rules carry no per-schedule fields: absent means both.
    expect(plan.warnings[1].schedules).toBeUndefined();
  });

  it("fires the evidence-of-practice warning once the window closes before the finish", () => {
    const later = buildPlan({ ...priya, lastPractisedAt: "2024-02" }, pathway, TODAY);
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
    expect(plan.sequential.totalWeeks).toBe(45);
    expect(plan.parallel.totalWeeks).toBe(17.2);
    expect(plan.parallel.criticalPath.slice(0, 3)).toEqual(["school_documents", "eca", "cno_application"]);
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

  it("offers SPEP as a backup: window closed Sep 2025, eligible until Sep 2030 (issue #23)", () => {
    expect(plan.warnings[0].facts).toMatchObject({ windowCloses: "2025-09", backup: "spep", backupEligibleUntil: "2030-09" });
  });

  it("drops the SPEP backup once the window closed more than 5 years before the plan finishes", () => {
    const longAgo = buildPlan({ ...amina, lastPractisedAt: "2019-01" }, pathway, TODAY);
    const eop = longAgo.warnings.find((w) => w.id === "evidence_of_practice_window")!;
    expect(eop.facts).toEqual({ windowCloses: "2022-01" }); // eligible until Jan 2027, before the Apr 2027 finish
    expect(longAgo.statuses.evidence_of_practice).toBe("blocked");
  });

  it("still schedules the blocked step so the roadmap shows where it sits", () => {
    expect(plan.sequential.totalWeeks).toBe(61);
    expect(plan.parallel.totalWeeks).toBe(27.1);
    expect(plan.parallel.startWeek.evidence_of_practice).toBeGreaterThan(0);
  });
});

describe("side lane data", () => {
  it("lists the While-you-wait steps for Priya and hides bridge roles without work authorization", () => {
    expect(buildPlan(priya, pathway, TODAY).side).toEqual([
      { nodeId: "temporary_class", status: "todo" },
      { nodeId: "bridge_role", status: "todo" },
      { nodeId: "support_orgs", status: "todo" },
    ]);
    const noAuth = buildPlan({ ...priya, authorizedToWork: "no" }, pathway, TODAY);
    expect(noAuth.side.filter((s) => s.status === "not_applicable").map((s) => s.nodeId)).toEqual([
      "temporary_class",
      "bridge_role",
    ]);
  });
});

describe("other warnings", () => {
  it("warns when a criminal record check will be stale at the projected finish", () => {
    const withOldCheck = { ...priya, progress: { ...priya.progress, criminalRecordCheckDate: "2026-06-01" } };
    const old = buildPlan(withOldCheck, pathway, TODAY).warnings.find((w) => w.id === "crc_validity");
    expect(old).toMatchObject({ severityBySchedule: { sequential: "warn", parallel: "warn" }, facts: { windowCloses: "2026-12" } });
    // Expires Jul 2027: fine for the typical Portage plan (Apr 2027), tight on its conservative end (Aug 2027),
    // stale for one at a time (Dec 2027).
    const withLaterCheck = { ...priya, progress: { ...priya.progress, criminalRecordCheckDate: "2027-01-15" } };
    const later = buildPlan(withLaterCheck, pathway, TODAY).warnings.find((w) => w.id === "crc_validity");
    expect(later?.severityBySchedule).toEqual({ sequential: "warn", parallel: "info" });
    const noCheck = buildPlan(priya, pathway, TODAY);
    expect(ids(noCheck.warnings)).not.toContain("crc_validity");
  });

  it("does not fire a date warning on a schedule where neither end of the range breaks it", () => {
    const recent = buildPlan({ ...priya, lastPractisedAt: "2026-06" }, pathway, TODAY);
    expect(ids(recent.warnings)).not.toContain("evidence_of_practice_window");
    const between = buildPlan({ ...priya, lastPractisedAt: "2025-01" }, pathway, TODAY).warnings[0];
    // Closes Jan 2028: after Dec 2027 (one at a time, typical) but before its conservative Jan 2029.
    expect(between.id).toBe("evidence_of_practice_window");
    expect(between.schedules).toEqual(["sequential"]);
    expect(between.severityBySchedule).toEqual({ sequential: "warn" });
    expect(between.severity).toBe("warn");
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

describe("ranges and side lane (contract)", () => {
  it("gives best <= typical <= conservative, with typical equal to the total", () => {
    for (const profile of [priya, marco, amina]) {
      const plan = buildPlan(profile, pathway, TODAY);
      for (const s of [plan.sequential, plan.parallel]) {
        expect(s.range.typicalWeeks).toBe(s.totalWeeks);
        expect(s.range.bestWeeks).toBeLessThanOrEqual(s.range.typicalWeeks);
        expect(s.range.typicalWeeks).toBeLessThanOrEqual(s.range.conservativeWeeks);
        expect(s.range.bestFinish <= s.finishDate && s.finishDate <= s.range.conservativeFinish).toBe(true);
      }
    }
  });

  it("records Priya's ranges", () => {
    const plan = buildPlan(priya, pathway, TODAY);
    expect(plan.sequential.range).toMatchObject({ bestWeeks: 22.2, conservativeWeeks: 120.8 });
    expect(plan.parallel.range).toMatchObject({ bestWeeks: 9, conservativeWeeks: 48.1 });
  });

  it("keeps side-lane nodes out of the schedule and lists them in Plan.side", () => {
    const withSide = parsePathway(structuredClone(pathwayJson));
    withSide.nodes.push({
      ...withSide.nodes[0],
      id: "side_step",
      lane: "side",
      dependsOn: [],
      duration: { minWeeks: 50, typicalWeeks: 60, maxWeeks: 70, kind: "estimate", note: "test only" },
      doneIf: undefined,
    });
    const base = buildPlan(priya, pathway, TODAY);
    const plan = buildPlan(priya, withSide, TODAY);
    expect(plan.side.map((s) => s.nodeId)).toEqual(["temporary_class", "bridge_role", "support_orgs", "side_step"]);
    expect(plan.order).not.toContain("side_step");
    expect(plan.statuses).not.toHaveProperty("side_step");
    expect(plan.parallel.startWeek).not.toHaveProperty("side_step");
    expect(plan.sequential.totalWeeks).toBe(base.sequential.totalWeeks);
    expect(plan.parallel.range).toEqual(base.parallel.range);
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
