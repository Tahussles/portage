// Shared helpers for the demo video pipeline (scripts/video). Outputs live in video-out/ (git-ignored).
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const VIDEO = fileURLToPath(new URL("./", import.meta.url));
export const OUT = `${ROOT}video-out/`;
export const FPS = 30;
/** Source frames are 3200 x 1800 (a 1600 x 900 viewport at device scale 2); the film is 1920 x 1080. */
export const VIEW = { width: 1600, height: 900 };
export const SRC = { width: 3200, height: 1800 };
export const OUT_SIZE = { width: 1920, height: 1080 };
export const XFADE = 0.4;
/** Narration starts this long into a scene; a scene lasts narration + 2 x LEAD (0.6 s). */
export const LEAD = 0.3;
export const ZOOM = { scale: 1.6, ease: 0.7 };
/** Live AI waits are compressed to about this long. */
export const WAIT_TARGET = 1.5;

export function dir(path) {
  mkdirSync(`${OUT}${path}`, { recursive: true });
  return `${OUT}${path}/`;
}

export const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
export const writeJson = (file, data) => writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
export const exists = existsSync;

export function script() {
  return readJson(`${VIDEO}script.json`);
}

/** Duration of an audio or video file in seconds. */
export function probeDuration(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim();
  return Number(out);
}

/** Runs ffmpeg; rejects with the tail of stderr on failure. */
export function ffmpeg(args, { quiet = true } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", ["-hide_banner", "-y", ...(quiet ? ["-loglevel", "error"] : []), ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    proc.stderr.on("data", (d) => (err += d));
    proc.on("close", (code) => (code === 0 ? resolve(err) : reject(new Error(`ffmpeg failed (${code}): ${err.slice(-2000)}`))));
  });
}

/** Resolves `at` ("p2+1.5", a number, or undefined) against a scene's narration timeline. */
export function resolveAt(at, timeline) {
  if (at === undefined || at === null) return null;
  if (typeof at === "number") return at;
  const m = /^p(\d+)(?:\+([\d.]+))?$/.exec(at);
  if (!m) throw new Error(`Bad "at": ${at}`);
  const part = timeline.lines[Number(m[1]) - 1];
  if (!part) throw new Error(`No narration line ${m[1]}`);
  return part.start + Number(m[2] ?? 0);
}

/** 0:00 style timestamps. */
export function clock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
