// Captures the landing chapter shots from a running production build, in English and French. Rerun it any
// time the UI changes:
//   pnpm build && pnpm start --port 3200        (in another terminal)
//   pnpm gen:chapters [http://localhost:3200]
// Drives the installed Chrome through playwright-core (no browser download). Writes
// public/chapters/<chapter>-<lang>.webp and .jpg: 640 x 480 (4:3), each under 80 KB.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const BASE = (process.argv[2] ?? "http://localhost:3200").replace(/\/$/, "");
const OUT = fileURLToPath(new URL("../public/chapters/", import.meta.url));
const VIEWPORT = { width: 1280, height: 800 };
const SIZE = { width: 640, height: 480 };
const MAX_BYTES = 80 * 1024;

const LABELS = {
  en: { portage: /Portage plan/, police: /Police check/ },
  fr: { portage: /Plan Portage/, police: /Vérification de casier/ },
};

/** Union of the page-coordinate boxes of every element matching `selector` (optionally filtered by text). */
async function union(page, selector, text) {
  return page.evaluate(
    ([sel, txt]) => {
      const boxes = [...document.querySelectorAll(sel)]
        .filter((el) => !txt || new RegExp(txt).test(el.textContent ?? ""))
        .map((el) => el.getBoundingClientRect());
      if (!boxes.length) throw new Error(`nothing matches ${sel}`);
      const left = Math.min(...boxes.map((b) => b.left));
      const top = Math.min(...boxes.map((b) => b.top)) + scrollY;
      return { left, top, right: Math.max(...boxes.map((b) => b.right)), bottom: Math.max(...boxes.map((b) => b.bottom)) + scrollY };
    },
    [selector, text?.source],
  );
}

const merge = (...b) => ({
  left: Math.min(...b.map((x) => x.left)),
  top: Math.min(...b.map((x) => x.top)),
  right: Math.max(...b.map((x) => x.right)),
  bottom: Math.max(...b.map((x) => x.bottom)),
});

/** Pads a box and grows it to 4:3 (from its top, centred horizontally) inside the page width. */
function toClip(box, pad) {
  let x = box.left - pad;
  let width = box.right - box.left + pad * 2;
  let height = box.bottom - box.top + pad * 2;
  if (width / height > 4 / 3) height = (width * 3) / 4;
  else {
    const grown = (height * 4) / 3;
    x -= (grown - width) / 2;
    width = grown;
  }
  width = Math.min(width, VIEWPORT.width);
  height = (width * 3) / 4;
  x = Math.max(0, Math.min(x, VIEWPORT.width - width));
  return { x: Math.round(x), y: Math.round(box.top - pad), width: Math.round(width), height: Math.round(height) };
}

const SHOTS = [
  {
    id: "speak",
    path: "/start?demo=1",
    async clip(page) {
      // The guided interview: question 1, its play button, Priya's example answer, and the orb.
      await page.locator("details summary").first().click();
      await page.waitForTimeout(400);
      const dots = await union(page, '[aria-label^="Question 1"]');
      const orb = await union(page, 'button[aria-label="Start recording"], button[aria-label="Commencer l’enregistrement"]');
      return toClip(merge(dots, { ...orb, bottom: orb.bottom + 36 }), 28); // the status line under the orb
    },
  },
  {
    id: "map",
    path: "/roadmap?demo=1",
    async clip(page, t) {
      await page.getByRole("button", { name: t.portage }).click();
      await page.waitForTimeout(1500);
      const flow = await union(page, ".react-flow");
      const nodes = await union(page, ".react-flow__node");
      const clip = toClip(nodes, 28);
      // Keep the crop on the canvas.
      clip.y = Math.max(flow.top, Math.min(clip.y, flow.bottom - clip.height));
      return clip;
    },
  },
  {
    id: "prepare",
    path: "/documents?demo=1",
    async clip(page, t) {
      await page.getByRole("button", { name: t.police }).first().click();
      await page.locator('a:has-text("CNO"), a:has-text("OIIO")').first().waitFor({ timeout: 15000 });
      await page.waitForTimeout(800);
      const preview = await union(page, 'img[alt^="Preview of"], img[alt^="Aperçu de"]');
      const findings = await union(page, "li", /CNO|OIIO/);
      return toClip(merge(preview, { ...findings, bottom: findings.top + 520 }), 24);
    },
  },
  {
    id: "practise",
    path: "/insights",
    async clip(page) {
      await page.waitForTimeout(800);
      // The whole map with Ontario active; widening it to 4:3 stays clear of the funnel column.
      return toClip(await union(page, 'svg[aria-label*="Canada"]'), 12);
    },
  },
];

// Downscale and encode in the browser itself (canvas supports WebP and JPEG), lowering quality until it fits.
async function encode(page, png) {
  return page.evaluate(
    async ({ b64, width, height, max }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);
      const fit = (type) => {
        for (let q = 0.86; q >= 0.3; q -= 0.04) {
          const url = canvas.toDataURL(type, q);
          const b64out = url.slice(url.indexOf(",") + 1);
          if ((b64out.length * 3) / 4 <= max) return { b64: b64out, q: Math.round(q * 100) };
        }
        throw new Error(`${type} does not fit in ${max} bytes`);
      };
      return { webp: fit("image/webp"), jpg: fit("image/jpeg") };
    },
    { b64: png.toString("base64"), ...SIZE, max: MAX_BYTES },
  );
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const lang of ["en", "fr"]) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      locale: lang === "fr" ? "fr-CA" : "en-CA",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    for (const shot of SHOTS) {
      await page.goto(`${BASE}${shot.path}${shot.path.includes("?") ? "&" : "?"}lang=${lang}`, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "header.fixed{visibility:hidden!important}" });
      const clip = await shot.clip(page, LABELS[lang]);
      // Crops that fit the viewport are taken in place (a full-page capture resizes the viewport, which
      // rescales viewport-sized content such as the insights map); taller ones use a full-page capture.
      let png;
      if (clip.height <= VIEWPORT.height) {
        const offset = await page.evaluate((y) => {
          window.scrollTo(0, y);
          return scrollY;
        }, clip.y);
        await page.waitForTimeout(300);
        png = await page.screenshot({ clip: { ...clip, y: clip.y - offset }, type: "png" });
      } else {
        png = await page.screenshot({ clip, fullPage: true, type: "png" });
      }
      const { webp, jpg } = await encode(page, png);
      for (const [ext, out] of [["webp", webp], ["jpg", jpg]]) {
        const file = `${OUT}${shot.id}-${lang}.${ext}`;
        writeFileSync(file, Buffer.from(out.b64, "base64"));
        console.log(`${shot.id}-${lang}.${ext}  ${(Buffer.from(out.b64, "base64").length / 1024).toFixed(1)} KB  q${out.q}  from ${clip.width}x${clip.height}`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
