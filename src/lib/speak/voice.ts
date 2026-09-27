// Speech settings shared by /api/speak (tts.ts) and scripts/gen-guide-audio.mjs. No imports, so the
// Node script can load it directly.

/** Multilingual and fast (Hindi included); eleven_multilingual_v2 took about 7 s for this summary in English alone. */
export const TTS_MODEL = "eleven_flash_v2_5";
/** "Alice - Clear, Engaging Educator", a premade voice chosen from the voices API. Override with ELEVENLABS_VOICE_ID. */
export const DEFAULT_VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2";

export const TRANSLATE_SYSTEM =
  "Translate faithfully. Do not add, remove, or change any fact, date, number, or name. Output only the translation.";

/** The user message for a translation that will be read aloud. */
export function translatePrompt(languageName: string, languageCode: string, text: string) {
  return `Translate into ${languageName} (${languageCode}). It will be read aloud, so do not add English words in brackets.\n\n${text}`;
}
