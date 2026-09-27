// Pre-generates the guided interview's spoken questions, so they play instantly and never depend on wifi.
// Run locally (keys come from .env.local and are never printed):
//   node --env-file=.env.local scripts/gen-guide-audio.mjs            all languages
//   node --env-file=.env.local scripts/gen-guide-audio.mjs hi pa      only these
// English and French are the questions as written in src/lib/i18n. Every other language is translated from
// English with the same faithful-translation prompt as /api/speak and spoken with the same ElevenLabs
// model and voice. Writes public/guide/<lang>/q1..q6.mp3 and public/guide/<lang>/questions.json.
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DEFAULT_VOICE_ID, TRANSLATE_SYSTEM, TTS_MODEL, translatePrompt } from "../src/lib/speak/voice.ts";

export const GUIDE_LANGUAGES = ["en", "fr", "hi", "pa", "ur", "tl", "ar", "es", "zh"];
const WRITTEN = { en: "../src/lib/i18n/en.json", fr: "../src/lib/i18n/fr.json" };
const OUT = fileURLToPath(new URL("../public/guide/", import.meta.url));
const FORMAT = "mp3_44100_64"; // small files for speech; 54 clips stay well under 4 MB
const IDS = ["q1", "q2", "q3", "q4", "q5", "q6"];
/**
 * eleven_flash_v2_5 cannot speak Punjabi (Gurmukhi): its clips transcribed back as noise. eleven_v3 lists
 * Punjabi, so Punjabi alone uses it (same voice). Every clip is checked by transcribing it back.
 */
const MODEL_FOR = { pa: "eleven_v3" };

for (const name of ["ANTHROPIC_API_KEY", "ELEVENLABS_API_KEY"]) {
  if (!process.env[name]) {
    console.error(`Missing ${name}. Run with: node --env-file=.env.local scripts/gen-guide-audio.mjs`);
    process.exit(1);
  }
}

const written = Object.fromEntries(
  Object.entries(WRITTEN).map(([lang, file]) => [lang, JSON.parse(readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8"))]),
);
const languageName = (code) => new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;

async function translate(text, code) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 600,
      system: TRANSLATE_SYSTEM,
      messages: [{ role: "user", content: translatePrompt(languageName(code), code, text) }],
    }),
  });
  if (!res.ok) throw new Error(`translation into ${code} failed (HTTP ${res.status})`);
  const data = await res.json();
  const out = data.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  if (!out) throw new Error(`empty translation into ${code}`);
  return out;
}

async function speak(text, lang) {
  const voice = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=${FORMAT}`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: MODEL_FOR[lang] ?? TTS_MODEL }),
  });
  if (!res.ok) throw new Error(`speech failed (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

const langs = process.argv.slice(2).length ? process.argv.slice(2) : GUIDE_LANGUAGES;
let total = 0;
for (const lang of langs) {
  if (!GUIDE_LANGUAGES.includes(lang)) throw new Error(`Unknown guide language: ${lang}`);
  const dir = `${OUT}${lang}/`;
  mkdirSync(dir, { recursive: true });
  const machineTranslated = !(lang in written);
  const questions = [];
  for (const id of IDS) {
    const source = (written[lang] ?? written.en)[`guide.${id}`];
    const text = machineTranslated ? await translate(source, lang) : source;
    const mp3 = await speak(text, lang);
    writeFileSync(`${dir}${id}.mp3`, mp3);
    total += mp3.length;
    questions.push({ id, text });
    console.log(`${lang}/${id}.mp3  ${(mp3.length / 1024).toFixed(1)} KB`);
  }
  writeFileSync(`${dir}questions.json`, `${JSON.stringify({ lang, machineTranslated, model: MODEL_FOR[lang] ?? TTS_MODEL, questions }, null, 2)}\n`);
  total += statSync(`${dir}questions.json`).size;
}
console.log(`total ${(total / 1024 / 1024).toFixed(2)} MB for ${langs.length} language(s)`);
