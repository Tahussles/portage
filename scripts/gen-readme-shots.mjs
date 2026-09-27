// Regenerates the README screenshots (docs/screenshots, 1440 x 900, English) from a running production
// build, with the same tooling as gen-chapter-shots.mjs:
//   pnpm build && pnpm start --port 3200        (in another terminal)
//   pnpm gen:readme [http://localhost:3200]
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const BASE = (process.argv[2] ?? "http://localhost:3200").replace(/\/$/, "");
const OUT = fileURLToPath(new URL("../docs/screenshots/", import.meta.url));

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-CA" });
  const page = await context.newPage();
  const shot = async (name) => {
    await page.screenshot({ path: `${OUT}${name}`, type: "jpeg", quality: 80 });
    console.log(name);
  };
  const scrollToText = (text, offset) =>
    page.evaluate(
      ([t, o]) => {
        const el = [...document.querySelectorAll("*")].find((e) => e.childElementCount === 0 && e.textContent.trim() === t);
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - o);
      },
      [text, offset],
    );

  await page.goto(`${BASE}/`);
  await page.waitForTimeout(6000); // the Portage line has drawn
  await shot("1-landing.jpg");

  await page.goto(`${BASE}/start?demo=1`);
  await page.waitForTimeout(1500);
  await page.locator("details summary").first().click();
  await page.waitForTimeout(500);
  await scrollToText("What should I say?", 120);
  await page.waitForTimeout(500);
  await shot("2-intake.jpg");

  await page.goto(`${BASE}/roadmap?demo=1`);
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Portage plan/ }).click();
  await page.waitForTimeout(2500);
  await shot("3-roadmap.jpg");

  await page.goto(`${BASE}/documents?demo=1`);
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /Police check/ }).first().click();
  await page.waitForTimeout(4500);
  await scrollToText("What we found", 110);
  await page.waitForTimeout(800);
  await shot("4-documents.jpg");

  await page.goto(`${BASE}/insights`);
  await page.waitForTimeout(2000);
  await scrollToText("Provinces", 110);
  await page.waitForTimeout(1200);
  await shot("5-insights.jpg");

  await page.goto(`${BASE}/signin`);
  await page.waitForTimeout(1500);
  await shot("6-signin.jpg");

  // Signed in as the demo account: the profile with the name conflict to settle.
  await page.getByRole("button", { name: /Continue as Priya/ }).click();
  await page.waitForURL(/\/profile/, { timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot("7-profile.jpg");
  await context.close();
} finally {
  await browser.close();
}
