// Step 2: record. Drives the installed Chrome (playwright-core) through the live site at 1600 x 900, device
// scale 2, and captures every frame with the DevTools screencast (JPEG 92, 3200 x 1800, with timestamps).
// Scenes are paced to their narration: an action's `at` is in film time, and live AI waits are logged so the
// render can compress them. Zooms are logged too (the render applies them; a CSS transform on the page moves
// the fixed navbar and side panel). Writes video-out/frames/*.jpg, frames.json and events.json.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { fontFaces } from "./fonts.mjs";
import { OUT, ROOT, VIDEO, VIEW, WAIT_TARGET, ZOOM, dir, readJson, resolveAt, script, writeJson } from "./lib.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => Date.now() / 1000;

function cardHtml(card) {
  const topo = `data:image/svg+xml;base64,${readFileSync(`${ROOT}public/topo-hero.svg`).toString("base64")}`;
  return readFileSync(`${VIDEO}cards.html`, "utf8")
    .replace("/*FONTS*/", fontFaces())
    .replace("/*TOPO*/", topo)
    .replace("/*GSAP*/", readFileSync(`${ROOT}node_modules/gsap/dist/gsap.min.js`, "utf8"))
    .replace("/*CARD*/", JSON.stringify(card));
}

export async function record() {
  const { site, segments } = script();
  const timeline = readJson(`${OUT}timeline.json`);
  rmSync(`${OUT}frames`, { recursive: true, force: true });
  const framesDir = dir("frames");
  const audioDir = dir("audio");
  const frames = [];
  const events = [];
  const log = (type, extra = {}) => events.push({ type, t: now(), ...extra });

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    // The screencast only delivers device pixels (3200 x 1800) when the scale factor is forced at launch.
    args: ["--force-device-scale-factor=2", "--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "--force-color-profile=srgb"],
  });
  const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2, locale: "en-CA", colorScheme: "dark" });
  await context.addInitScript({ content: readFileSync(`${VIDEO}cursor.js`, "utf8") });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    const file = `${framesDir}${String(frames.length).padStart(6, "0")}.jpg`;
    writeFileSync(file, Buffer.from(data, "base64"));
    frames.push({ file, t: metadata.timestamp ?? now() });
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });

  // "Hear your plan": fetch the speech response ourselves, keep its exact bytes to mix in at the real
  // moment, and hand the same response to the page.
  await page.route("**/api/speak", async (route) => {
    const res = await route.fetch();
    const body = await res.body();
    if (res.ok() && body.length > 1000) {
      const file = `${audioDir}speak-${events.length}.mp3`;
      writeFileSync(file, body);
      log("speak_audio", { file });
    }
    await route.fulfill({ response: res, body });
  });

  const locate = (target) => {
    let loc;
    if (target.role) loc = page.getByRole(target.role, { name: target.name, exact: target.exact ?? false });
    else if (target.css) loc = page.locator(target.css);
    else loc = page.getByText(target.text, { exact: false });
    loc = loc.nth(target.nth ?? 0);
    if (target.up) loc = loc.locator(`xpath=${Array(target.up).fill("..").join("/")}`);
    return loc;
  };
  const boxOf = async (target) => {
    const loc = locate(target);
    await loc.waitFor({ state: "visible", timeout: 20000 });
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    return loc.boundingBox();
  };

  let segStart = 0;
  let savings = 0;
  const virtual = () => now() - segStart - savings;
  const until = async (t) => {
    while (virtual() < t) await sleep(15);
  };

  const zoomIn = async (box) => {
    const z = Math.max(1.2, Math.min(ZOOM.scale, (VIEW.width * 0.9) / box.width, (VIEW.height * 0.86) / box.height));
    log("zoom_in", { cx: box.x + box.width / 2, cy: box.y + box.height / 2, z });
    await sleep(ZOOM.ease * 1000);
  };
  const zoomOut = async () => {
    log("zoom_out");
    await sleep(ZOOM.ease * 1000);
  };

  async function perform(a, onCamera) {
    switch (a.do) {
      case "goto":
        await page.goto(site + a.url, { waitUntil: "load" });
        await sleep(1200);
        return;
      case "sleep":
        await sleep(a.seconds * 1000);
        return;
      case "key":
        await page.keyboard.press(a.key);
        return;
      case "scrollTo": {
        await locate(a.target).waitFor({ state: "visible", timeout: 20000 });
        await locate(a.target).evaluate((el, offset) => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - offset, behavior: "smooth" }), a.offset ?? 120);
        await sleep(1000);
        return;
      }
      case "waitFor": {
        const started = now();
        if (a.ai && onCamera) log("wait_start");
        await locate(a.target).waitFor({ state: "visible", timeout: 90000 });
        if (a.ai && onCamera) {
          log("wait_end");
          savings += Math.max(0, now() - started - WAIT_TARGET);
        }
        if (a.mark) log("mark", { name: a.mark });
        return;
      }
      case "zoom": {
        const box = await boxOf(a.target);
        if (onCamera) await zoomIn(box);
        await sleep((a.hold ?? 2) * 1000);
        if (a.then) await perform(a.then, onCamera);
        if (onCamera) await zoomOut();
        return;
      }
      case "click": {
        const box = await boxOf(a.target);
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        if (a.zoom && onCamera) await zoomIn(a.zoomOn ? await boxOf(a.zoomOn) : box);
        await page.evaluate(([px, py]) => window.__cursor?.move(px, py), [x, y]).catch(() => {});
        await page.mouse.move(x, y);
        await page.evaluate(() => window.__cursor?.click()).catch(() => {});
        await page.mouse.click(x, y);
        if (a.audio) log("audio", { file: `${ROOT}${a.audio.file}` });
        if (a.mark) log("mark", { name: a.mark });
        if (a.hold) await sleep(a.hold * 1000);
        if (a.zoom && onCamera) await zoomOut();
        return;
      }
      default:
        throw new Error(`Unknown action: ${a.do}`);
    }
  }

  await page.goto(`${site}/?reset=1`, { waitUntil: "load" });
  await sleep(1500);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 3200, maxHeight: 1800, everyNthFrame: 1 });

  for (const seg of segments) {
    const entry = timeline.segments.find((s) => s.id === seg.id);
    if (seg.card) {
      await page.setContent(cardHtml(seg.card), { waitUntil: "load" });
      await sleep(60);
      segStart = now();
      savings = 0;
      log("segment_start", { id: seg.id });
      await until(entry.duration + 0.2);
      log("segment_end", { id: seg.id });
      continue;
    }
    if (seg.url) {
      await page.goto(site + seg.url, { waitUntil: "load" });
      await sleep(1400);
    }
    for (const a of seg.setup ?? []) await perform(a, false);
    await sleep(500);

    segStart = now();
    savings = 0;
    log("segment_start", { id: seg.id });
    for (const a of seg.actions ?? []) {
      const at = resolveAt(a.at, entry);
      if (at !== null) await until(at);
      await perform(a, true);
    }
    const overrun = virtual() - entry.duration;
    if (overrun > 0.2) console.warn(`  ${seg.id}: actions ran ${overrun.toFixed(1)} s past the narration`);
    await until(entry.duration + 0.2);
    log("segment_end", { id: seg.id });
    console.log(`recorded ${seg.id}`);
  }

  await cdp.send("Page.stopScreencast").catch(() => {});
  await sleep(300);
  await browser.close();
  writeJson(`${OUT}frames.json`, frames);
  writeJson(`${OUT}events.json`, events);
  console.log(`${frames.length} frames, ${events.length} events`);
  return { frames, events };
}

if (import.meta.url === `file://${process.argv[1]}`) await record();
