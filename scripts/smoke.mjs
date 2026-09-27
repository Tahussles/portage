// Smoke test: `pnpm smoke <baseUrl>` (default http://localhost:3000).
// GETs every page (expects 200) and POSTs the profile route in demo mode (expects ok: true).
// Sends only Ebrahim's Priya fixture transcript; prints no response bodies or secrets.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const PAGES = ["/", "/start", "/roadmap", "/documents", "/insights", "/pitch"];
const transcript = JSON.parse(
  readFileSync(fileURLToPath(new URL("../src/data/fixtures/transcript-priya.json", import.meta.url)), "utf8"),
);

let failed = 0;
const report = (ok, label, detail) => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  ${detail}`);
};

for (const path of PAGES) {
  const started = Date.now();
  try {
    const res = await fetch(base + path, { redirect: "manual" });
    report(res.status === 200, `GET  ${path}`, `${res.status} in ${Date.now() - started} ms`);
  } catch (err) {
    report(false, `GET  ${path}`, err.message);
  }
}

{
  const started = Date.now();
  try {
    const res = await fetch(`${base}/api/profile?demo=1`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript: transcript.text, languageCode: transcript.languageCode, locale: "en" }),
      redirect: "manual",
    });
    const body = res.headers.get("content-type")?.includes("json") ? await res.json() : null;
    report(
      res.status === 200 && body?.ok === true,
      "POST /api/profile?demo=1",
      `${res.status} ok=${body?.ok} fallback=${body?.fallback ?? false} in ${Date.now() - started} ms`,
    );
  } catch (err) {
    report(false, "POST /api/profile?demo=1", err.message);
  }
}

console.log(failed ? `\n${failed} check(s) failed against ${base}` : `\nAll checks passed against ${base}`);
process.exit(failed ? 1 : 0);
