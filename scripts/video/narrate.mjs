// Step 1: narration. Speaks every narration line with ElevenLabs (cached per line in video-out/narration),
// measures it with ffprobe, and writes video-out/timeline.json: each segment's length (narration + 0.6 s)
// and when each line starts. A recording at scripts/video/voiceover/<segment-id>.m4a replaces that scene's
// narration (Taha's own voice). Never prints keys.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { LEAD, OUT, VIDEO, dir, exists, ffmpeg, probeDuration, script, writeJson } from "./lib.mjs";

/** "George - Warm, Captivating Storyteller": calm, premade, made for narration. Override with VIDEO_VOICE_ID. */
const DEFAULT_VOICE = { id: "JBFqnCBsd6RMkjVDRZzb", name: "George (Warm, Captivating Storyteller)" };
/** ElevenLabs' multilingual v2, the model family behind /api/speak's flash v2.5, at full quality for narration. */
const MODEL = "eleven_multilingual_v2";
const SETTINGS = { stability: 0.6, similarity_boost: 0.75, style: 0, use_speaker_boost: true };

async function speakLine(text, prev, next, voice) {
  const key = createHash("sha1").update(JSON.stringify({ voice, MODEL, SETTINGS, text, prev, next })).digest("hex").slice(0, 16);
  const file = `${dir("narration/lines")}${key}.mp3`;
  if (exists(file)) return file;
  if (!process.env.ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is missing: run with node --env-file=.env.local");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: SETTINGS, previous_text: prev ?? undefined, next_text: next ?? undefined }),
  });
  if (!res.ok) throw new Error(`narration failed (HTTP ${res.status}) for: ${text.slice(0, 40)}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

/** One WAV per scene: its lines with the pauses between them. */
async function sceneTrack(id, parts) {
  const out = `${dir("narration")}${id}.wav`;
  const inputs = [];
  const labels = [];
  parts.forEach((p, i) => {
    if (p.file) {
      inputs.push("-i", p.file);
      labels.push(`[${inputs.length / 2 - 1}:a]aresample=48000,aformat=channel_layouts=stereo[a${i}]`);
    } else {
      labels.push(`anullsrc=r=48000:cl=stereo,atrim=0:${p.duration.toFixed(3)}[a${i}]`);
    }
  });
  const concat = `${parts.map((_, i) => `[a${i}]`).join("")}concat=n=${parts.length}:v=0:a=1[out]`;
  await ffmpeg([...inputs, "-filter_complex", `${labels.join(";")};${concat}`, "-map", "[out]", out]);
  return out;
}

export async function narrate() {
  const { segments } = script();
  const voice = process.env.VIDEO_VOICE_ID || DEFAULT_VOICE.id;
  const timeline = { voice: voice === DEFAULT_VOICE.id ? DEFAULT_VOICE.name : voice, model: MODEL, segments: [] };

  for (const seg of segments) {
    const entry = { id: seg.id, kind: seg.card ? "card" : "scene", title: seg.title ?? null, lines: [], track: null };
    const lines = (seg.narration ?? []).filter((n) => typeof n === "string");
    const own = `${VIDEO}voiceover/${seg.id}.m4a`;

    if (seg.narration && exists(own)) {
      // Taha's recording: one file; line starts are estimated from their share of the words.
      const total = probeDuration(own);
      const chars = lines.reduce((n, l) => n + l.length, 0);
      let t = LEAD;
      for (const text of lines) {
        const duration = (total * text.length) / chars;
        entry.lines.push({ text, start: t, duration });
        t += duration;
      }
      entry.track = own;
      entry.narration = total;
      entry.voiceover = true;
    } else if (seg.narration) {
      const parts = [];
      let t = LEAD;
      for (const [i, n] of seg.narration.entries()) {
        if (typeof n === "string") {
          const prev = seg.narration.slice(0, i).filter((x) => typeof x === "string").at(-1);
          const next = seg.narration.slice(i + 1).find((x) => typeof x === "string");
          const file = await speakLine(n, prev, next, voice);
          const duration = probeDuration(file);
          parts.push({ file, duration });
          entry.lines.push({ text: n, start: t, duration });
          t += duration;
        } else {
          parts.push({ duration: n.pause });
          t += n.pause;
        }
      }
      entry.track = await sceneTrack(seg.id, parts);
      entry.narration = t - LEAD;
    }
    entry.duration = Math.max(seg.seconds ?? 0, entry.narration ? entry.narration + 2 * LEAD : 0);
    timeline.segments.push(entry);
  }

  timeline.estimate = timeline.segments.reduce((s, x) => s + x.duration, 0) - 0.4 * (timeline.segments.length - 1);
  writeJson(`${OUT}timeline.json`, timeline);
  return timeline;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t = await narrate();
  for (const s of t.segments) console.log(`${s.id.padEnd(14)} ${s.duration.toFixed(1)} s`);
  console.log(`estimated film length ${t.estimate.toFixed(1)} s (voice: ${t.voice})`);
}
