// Step 3: edit. Turns the recording into video-out/portage-demo.mp4:
//  - each segment's frames become constant 30 fps, with live AI waits compressed to about 1.5 s (a smooth
//    speed-up and slow-down, so the progress steps stay visible),
//  - the camera zooms (1.6x, 0.7 s power2.inOut, clamped to the frame) from events.json, cropped from the
//    3200 x 1800 source,
//  - title cards and scenes join with 0.4 s crossfades, captions in Inter are burned in,
//  - narration, the spoken question, "Hear your plan" (ducking the narration) and an optional music bed are
//    mixed and normalized to -14 LUFS; H.264 CRF 18, yuv420p, faststart.
// Then the checks: duration, black and white flashes, a contact sheet, and youtube.txt.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { fontFaces } from "./fonts.mjs";
import {
  FPS, LEAD, OUT, OUT_SIZE, SRC, VIDEO, WAIT_TARGET, XFADE, ZOOM,
  clock, dir, exists, ffmpeg, probeDuration, readJson, script, writeJson,
} from "./lib.mjs";

const f3 = (n) => n.toFixed(3);

// ---- time remapping: compress each live-AI wait smoothly -------------------------------------------------

/** Maps a segment's source time to film time. Waits longer than 1.5 s become 1.5 s, easing in and out. */
export function makeRemap(waits) {
  const parts = waits
    .filter((w) => w.b - w.a > WAIT_TARGET)
    .map((w) => {
      const d = w.b - w.a;
      const r = Math.min(0.5, d / 4);
      const m = (WAIT_TARGET - r) / (d - r);
      return { ...w, d, r, m };
    });
  const inside = (p, x) => {
    const { d, r, m } = p;
    if (x <= r) {
      const u = x / r;
      return x - (1 - m) * r * (u ** 3 - u ** 4 / 2);
    }
    const gr = r - (1 - m) * r * 0.5;
    if (x <= d - r) return gr + m * (x - r);
    const y = (x - (d - r)) / r;
    return gr + m * (d - 2 * r) + r * (m * y + (1 - m) * (y ** 3 - y ** 4 / 2));
  };
  return (t) => {
    let shift = 0;
    for (const p of parts) {
      if (t <= p.a) break;
      if (t < p.b) return p.a - shift + inside(p, t - p.a);
      shift += p.d - WAIT_TARGET;
    }
    return t - shift;
  };
}

// ---- zoom expressions for ffmpeg's zoompan --------------------------------------------------------------

function zoomExpressions(windows) {
  const E = ZOOM.ease;
  const ease = (p) => `if(lt(${p},0.5),2*(${p})*(${p}),1-2*(1-(${p}))*(1-(${p})))`;
  const env = (w) => {
    const pin = `(it-${f3(w.a)})/${E}`;
    const pout = `(it-${f3(w.b)})/${E}`;
    return `if(lt(it,${f3(w.a)}),0,if(lt(it,${f3(w.a + E)}),${ease(pin)},if(lt(it,${f3(w.b)}),1,if(lt(it,${f3(w.b + E)}),1-${ease(pout)},0))))`;
  };
  if (!windows.length) return { z: "1", x: "0", y: "0" };
  const z = `1${windows.map((w) => `+${f3(w.z - 1)}*${env(w)}`).join("")}`;
  const cx = `${SRC.width / 2}${windows.map((w) => `+${f3(w.cx - SRC.width / 2)}*${env(w)}`).join("")}`;
  const cy = `${SRC.height / 2}${windows.map((w) => `+${f3(w.cy - SRC.height / 2)}*${env(w)}`).join("")}`;
  return {
    z,
    x: `max(0,min(iw-iw/zoom,(${cx})-iw/zoom/2))`,
    y: `max(0,min(ih-ih/zoom,(${cy})-ih/zoom/2))`,
  };
}

// ---- segments ------------------------------------------------------------------------------------------

async function renderSegment(seg, i, frames, events, target) {
  const start = events.find((e) => e.type === "segment_start" && e.id === seg.id).t;
  const end = events.find((e) => e.type === "segment_end" && e.id === seg.id).t;
  const inSeg = events.filter((e) => e.t >= start && e.t <= end);

  const waits = [];
  for (const e of inSeg) {
    if (e.type === "wait_start") waits.push({ a: e.t - start, b: end - start });
    if (e.type === "wait_end" && waits.length) waits[waits.length - 1].b = e.t - start;
  }
  const remap = makeRemap(waits);
  const length = Math.max(target, remap(end - start) - 0.2);

  // Zoom windows in film time, in source pixels.
  const windows = [];
  for (const e of inSeg) {
    if (e.type === "zoom_in") windows.push({ a: remap(e.t - start), b: length, cx: e.cx * 2, cy: e.cy * 2, z: e.z });
    if (e.type === "zoom_out" && windows.length) windows[windows.length - 1].b = Math.max(windows.at(-1).a + ZOOM.ease, remap(e.t - start));
  }

  // Frames: the one on screen when the segment starts, then every frame inside it.
  const before = frames.filter((f) => f.t <= start).at(-1) ?? frames.find((f) => f.t > start);
  const picked = [{ file: before.file, at: 0 }];
  for (const f of frames) {
    if (f.t <= start || f.t >= end) continue;
    const at = remap(f.t - start);
    if (at - picked.at(-1).at > 1e-3 && at < length) picked.push({ file: f.file, at });
  }
  const lines = ["ffconcat version 1.0"];
  picked.forEach((p, k) => {
    const next = k + 1 < picked.length ? picked[k + 1].at : length;
    lines.push(`file '${p.file}'`, `duration ${f3(next - p.at)}`);
  });
  lines.push(`file '${picked.at(-1).file}'`);
  const list = `${dir("segments")}${seg.id}.ffconcat`;
  writeFileSync(list, `${lines.join("\n")}\n`);

  const zp = zoomExpressions(windows);
  const out = `${dir("segments")}${String(i).padStart(2, "0")}-${seg.id}.mp4`;
  await ffmpeg([
    "-f", "concat", "-safe", "0", "-i", list,
    "-vf", `fps=${FPS},zoompan=z='${zp.z}':x='${zp.x}':y='${zp.y}':d=1:s=${OUT_SIZE.width}x${OUT_SIZE.height}:fps=${FPS},format=yuv420p,setsar=1`,
    "-t", f3(length), "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "15", out,
  ]);

  const audio = [];
  for (const e of inSeg.filter((x) => x.type === "audio")) audio.push({ file: e.file, at: remap(e.t - start) + 0.1 });
  const speakStart = inSeg.find((e) => e.type === "mark" && e.name === "speak-start");
  const speakEnd = inSeg.find((e) => e.type === "mark" && e.name === "speak-end");
  const speakFile = events.filter((e) => e.type === "speak_audio" && e.t <= (speakStart?.t ?? 0)).at(-1)?.file;
  if (speakStart && speakFile) {
    const at = remap(speakStart.t - start);
    const duration = (speakEnd ? remap(speakEnd.t - start) : length) - at;
    audio.push({ file: speakFile, at, duration, speak: true });
  }
  return { id: seg.id, file: out, length, zooms: windows.length, waits: waits.map((w) => w.b - w.a), audio };
}

// ---- captions ------------------------------------------------------------------------------------------

function chunk(text, max = 88) {
  const sentences = text.split(/(?<=[.?!])\s+/);
  const out = [];
  for (const s of sentences) {
    if (s.length <= max) {
      const last = out.at(-1);
      if (last && last.length < 36 && last.length + s.length + 1 <= max) out[out.length - 1] = `${last} ${s}`;
      else out.push(s);
      continue;
    }
    // Split long sentences at the comma or colon closest to the middle.
    const cuts = [...s.matchAll(/[,:;] /g)].map((m) => m.index + 1);
    const mid = s.length / 2;
    const cut = cuts.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
    if (cut) out.push(s.slice(0, cut).trim(), s.slice(cut).trim());
    else out.push(s);
  }
  return out.flatMap((c) => (c.length > max * 1.3 ? chunk(c.replace(/,/, ";"), max) : [c]));
}

async function renderCaptions(cues, total) {
  const capDir = dir("captions");
  rmSync(capDir, { recursive: true, force: true });
  dir("captions");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: OUT_SIZE });
  await page.setContent(`<html><head><style>${fontFaces()}
    html,body{margin:0;background:transparent}
    #c{position:absolute;left:50%;bottom:46px;transform:translateX(-50%);max-width:1500px;padding:11px 24px 12px;
       background:rgba(12,10,9,0.74);border-radius:10px;color:#fafaf9;font:500 30px/1.38 "Inter",system-ui,sans-serif;
       text-align:center;letter-spacing:-0.005em;white-space:normal}
    #c:empty{display:none}</style></head><body><div id="c"></div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const files = [];
  for (const [k, cue] of [{ text: "" }, ...cues].entries()) {
    await page.evaluate((t) => (document.getElementById("c").textContent = t), cue.text);
    const file = `${capDir}${String(k).padStart(3, "0")}.png`;
    await page.screenshot({ path: file, omitBackground: true });
    files.push(file);
  }
  await browser.close();

  // One transparent track: blank between cues, each cue for its time.
  const blank = files[0];
  const lines = ["ffconcat version 1.0"];
  let t = 0;
  cues.forEach((cue, k) => {
    if (cue.start > t + 0.01) lines.push(`file '${blank}'`, `duration ${f3(cue.start - t)}`);
    lines.push(`file '${files[k + 1]}'`, `duration ${f3(cue.end - Math.max(t, cue.start))}`);
    t = cue.end;
  });
  lines.push(`file '${blank}'`, `duration ${f3(Math.max(0.1, total - t))}`, `file '${blank}'`);
  const list = `${capDir}captions.ffconcat`;
  writeFileSync(list, `${lines.join("\n")}\n`);
  const out = `${OUT}captions.mov`;
  await ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-vf", `fps=${FPS},format=rgba`, "-t", f3(total), "-c:v", "png", out]);
  return out;
}

// ---- checks --------------------------------------------------------------------------------------------

function checks(file) {
  const run = (args) => {
    try {
      return execFileSync("ffmpeg", ["-hide_banner", ...args], { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 28 }).toString();
    } catch (e) {
      return `${e.stdout ?? ""}${e.stderr ?? ""}`;
    }
  };
  // Pure black: darker than the ink background itself.
  const black = run(["-i", file, "-vf", "blackdetect=d=0.03:pix_th=0.02", "-an", "-f", "null", "-"]).match(/black_start:[\d.]+ black_end:[\d.]+/g) ?? [];
  // White flashes: a frame much brighter than both neighbours, or almost entirely white.
  const stats = execFileSync("ffprobe", ["-v", "error", "-f", "lavfi", "-i", `movie=${file},signalstats`, "-show_entries", "frame_tags=lavfi.signalstats.YAVG,lavfi.signalstats.YMIN", "-of", "compact=p=0"], { maxBuffer: 1 << 28 })
    .toString()
    .trim()
    .split("\n")
    .map((l) => {
      const tag = (name) => Number((new RegExp(`signalstats\\.${name}=([\\d.]+)`).exec(l) ?? [])[1]);
      return [tag("YAVG"), tag("YMIN")];
    });
  const flashes = [];
  stats.forEach(([yavg, ymin], k) => {
    const prev = stats[k - 1]?.[0] ?? yavg;
    const next = stats[k + 1]?.[0] ?? yavg;
    if (ymin > 200 || (yavg - prev > 90 && yavg - next > 90)) flashes.push(clock(k / FPS));
  });
  run(["-y", "-i", file, "-vf", "fps=1/10,scale=640:-1,tile=5x6:padding=6:color=0x0c0a09", "-frames:v", "1", `${OUT}contact.jpg`]);
  return { black, flashes };
}

// ---- assembly ------------------------------------------------------------------------------------------

export async function render() {
  const { segments, site } = script();
  const timeline = readJson(`${OUT}timeline.json`);
  const frames = readJson(`${OUT}frames.json`);
  const events = readJson(`${OUT}events.json`);

  const rendered = [];
  for (const [i, seg] of segments.entries()) {
    const entry = timeline.segments.find((s) => s.id === seg.id);
    rendered.push(await renderSegment(seg, i, frames, events, entry.duration));
    console.log(`segment ${seg.id}: ${rendered.at(-1).length.toFixed(1)} s, ${rendered.at(-1).zooms} zoom(s)`);
  }

  // Film times: each segment overlaps the previous one by the crossfade.
  let t = 0;
  for (const r of rendered) {
    r.start = t;
    t += r.length - XFADE;
  }
  const total = rendered.at(-1).start + rendered.at(-1).length;

  // Captions from the narration timings.
  const cues = [];
  for (const [i, seg] of segments.entries()) {
    const entry = timeline.segments.find((s) => s.id === seg.id);
    for (const line of entry.lines) {
      const parts = chunk(line.text);
      const chars = parts.reduce((n, p) => n + p.length, 0);
      let c = rendered[i].start + line.start;
      for (const p of parts) {
        const d = (line.duration * p.length) / chars;
        cues.push({ text: p, start: c, end: c + d - 0.05 });
        c += d;
      }
    }
  }
  const captions = await renderCaptions(cues, total);

  // Audio: narration per scene, the spoken question and "Hear your plan" at their moments, optional music.
  const inputs = [];
  const chains = [];
  const narr = [];
  const fx = [];
  const duck = [];
  for (const [i, seg] of segments.entries()) {
    const entry = timeline.segments.find((s) => s.id === seg.id);
    if (entry.track) {
      inputs.push("-i", entry.track);
      const k = inputs.length / 2 - 1;
      const ms = Math.round((rendered[i].start + LEAD) * 1000);
      chains.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[n${k}]`);
      narr.push(`[n${k}]`);
    }
    for (const a of rendered[i].audio) {
      inputs.push("-i", a.file);
      const k = inputs.length / 2 - 1;
      const at = rendered[i].start + a.at;
      const dur = a.duration ?? probeDuration(a.file);
      const ms = Math.round(at * 1000);
      chains.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${f3(dur)},afade=t=out:st=${f3(Math.max(0, dur - 0.35))}:d=0.35,volume=1.15,adelay=${ms}|${ms}[f${k}]`);
      fx.push(`[f${k}]`);
      duck.push([at, at + dur]);
    }
  }
  const duckExpr = duck.length ? duck.map(([a, b]) => `between(t,${f3(a)},${f3(b)})`).join("+") : "0";
  chains.push(`${narr.join("")}amix=inputs=${narr.length}:normalize=0:duration=longest,volume='if(${duckExpr},0.3,1)':eval=frame[narr]`);
  const mixIn = ["[narr]", ...fx];
  const music = `${VIDEO}music.mp3`;
  if (exists(music)) {
    inputs.push("-stream_loop", "-1", "-i", music);
    const k = (inputs.length - 2) / 2;
    chains.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:${f3(total)},volume=-24dB,afade=t=in:d=2,afade=t=out:st=${f3(total - 3)}:d=3[m]`);
    mixIn.push("[m]");
  }
  chains.push(`${mixIn.join("")}amix=inputs=${mixIn.length}:normalize=0:duration=longest,apad=whole_dur=${f3(total)},atrim=0:${f3(total)},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[aout]`);
  const audio = `${OUT}audio.wav`;
  await ffmpeg([...inputs, "-filter_complex", chains.join(";"), "-map", "[aout]", audio]);

  // Picture: crossfade the segments, then burn in the captions.
  const vIn = rendered.flatMap((r) => ["-i", r.file]);
  const vChains = [];
  let last = "[0:v]";
  let offset = 0;
  for (let k = 1; k < rendered.length; k++) {
    offset += rendered[k - 1].length - XFADE;
    const label = `[x${k}]`;
    vChains.push(`${last}[${k}:v]xfade=transition=fade:duration=${XFADE}:offset=${f3(offset)}${label}`);
    last = label;
  }
  const capIdx = rendered.length;
  const audIdx = rendered.length + 1;
  vChains.push(`${last}[${capIdx}:v]overlay=0:0:format=auto,format=yuv420p[vout]`);
  const film = `${OUT}portage-demo.mp4`;
  await ffmpeg([
    ...vIn, "-i", captions, "-i", audio,
    "-filter_complex", vChains.join(";"),
    "-map", "[vout]", "-map", `${audIdx}:a`,
    "-t", f3(total),
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "192k", film,
  ]);

  // Report, checks, YouTube text.
  const duration = probeDuration(film);
  const { black, flashes } = checks(film);
  const chapters = segments
    .map((s, i) => ({ title: s.title, start: rendered[i].start }))
    .filter((c) => c.title);
  const youtube = [
    "Portage: a personal, cited licensing roadmap for internationally educated nurses",
    "",
    "Canada needs nurses, and thousands of internationally educated nurses already live here but cannot practise. Registering in Ontario means nine separate requirements across several organizations, about twelve months by the College of Nurses of Ontario's own guideline, and deadlines that can quietly reset months of progress. Portage turns that maze into one personal plan: a guided voice interview in your own language, every requirement in the right order with its official source, a Portage plan that runs steps in parallel, a document check against CNO's rules, and your plan read aloud in your language.",
    "",
    "For governments and regulators, Portage shows where applicants are and where they stall, with real CNO numbers and a clearly labelled illustrative funnel. The AI only listens and reads; the plan is computed by a deterministic engine from a cited data file. Built at the Ascendance Foundry hackathon by Taha Hussain and Ebrahim Zuberi. Priya is a composite persona.",
    "",
    "Chapters",
    "0:00 Intro",
    ...chapters.map((c) => `${clock(c.start)} ${c.title}`),
    "",
    `Live: ${site}`,
    "Code: https://github.com/Tahussles/portage",
    "",
  ].join("\n");
  writeFileSync(`${OUT}youtube.txt`, youtube);
  const report = {
    file: film,
    duration,
    sizeMB: Number((readFileSync(film).length / 1024 / 1024).toFixed(1)),
    voice: timeline.voice,
    segments: rendered.map((r) => ({ id: r.id, start: clock(r.start), startSeconds: Number(r.start.toFixed(2)), length: Number(r.length.toFixed(2)), zooms: r.zooms, waits: r.waits.map((w) => Number(w.toFixed(1))) })),
    zooms: rendered.reduce((n, r) => n + r.zooms, 0),
    black,
    flashes,
  };
  writeJson(`${OUT}report.json`, report);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await render();
  console.log(JSON.stringify(r, null, 2));
}
