# Demo video pipeline

`pnpm video` renders the Devpost demo, `video-out/portage-demo.mp4` (1920 x 1080, about 4:30), from scratch:

1. **Narration** (`narrate.mjs`): every line in `script.json` is spoken by ElevenLabs (`eleven_multilingual_v2`, the "George" storyteller voice; override with `VIDEO_VOICE_ID`), cached per line in `video-out/narration/`. A scene lasts its narration plus 0.6 s. Put your own recording at `scripts/video/voiceover/<scene-id>.m4a` to replace a scene's narration.
2. **Recording** (`record.mjs`): the installed Chrome (playwright-core) plays the live site at 1600 x 900, device scale 2, starting from `?reset=1`. The DevTools screencast keeps every frame (3200 x 1800, JPEG 92) with its timestamp. A calm cursor (`cursor.js`) glides to each target and ripples on click. Actions are timed to the narration (`"at": "p2+1.5"`), live AI waits and zooms are logged in `video-out/events.json`, and the "Hear your plan" audio is kept as served.
3. **Edit** (`render.mjs`): constant 30 fps per segment; each live AI wait is compressed to about 1.5 s with a smooth speed-up; zooms (1.6x, 0.7 s, clamped to the frame) are cropped from the 3200 x 1800 source; title cards (`cards.html`, the app's own fonts) and scenes join with 0.4 s crossfades; captions in Inter are burned in from the narration timings; narration, the spoken question and "Hear your plan" (ducking the narration) are mixed and normalized to -14 LUFS. Add a royalty-free `scripts/video/music.mp3` for a bed at -24 dB.
4. **Checks**: black and white flashes, `video-out/contact.jpg` (a frame every 10 s), `video-out/report.json`, and `video-out/youtube.txt` with chapter timestamps.

`pnpm video --no-record` re-edits the last recording. Needs a local `pnpm build` once (for the fonts), ffmpeg, Chrome, and `ELEVENLABS_API_KEY` in `.env.local` for new narration lines. Zooms are done in post: a CSS transform on the page moves the fixed navbar and side panel (tested).
