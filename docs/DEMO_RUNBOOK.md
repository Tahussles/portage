# Demo runbook

Live site: **https://portage-navy.vercel.app** (instant backup: **https://portage-navy.vercel.app/?demo=1**)

The pitch runs live with real AI (decision 15). `?demo=1` serves fixtures with no network calls to the AI providers. Priya is a composite persona; say so if asked.

## T-10 minutes

- [ ] Laptop charged and on power; phone hotspot on and tested (join it once, then back to venue wifi).
- [ ] Chrome: a profile with **no extensions**, zoom **100%**, window at least 1440 wide, bookmarks bar hidden.
- [ ] Sound **on**, volume about 60%, output to the room speakers if there are any (for "Hear your plan").
- [ ] macOS: **Reduce motion OFF** (System Settings, Accessibility, Display), **Do Not Disturb ON**, notifications off, Dock hidden.
- [ ] Tabs pre-opened, in this order:
  1. https://portage-navy.vercel.app/ (the demo)
  2. https://portage-navy.vercel.app/?demo=1 (backup, same flow with fixtures)
  3. https://portage-navy.vercel.app/?reset=1 (clears the in-memory profile and returns to the landing)
- [ ] Backup video on the desktop: `BACKUP_VIDEO_PATH` (placeholder until recorded), opened once in QuickTime.

## T-2 minutes: warm-up

Cold serverless functions can take much longer on the first call (a cold profile call took 18.7 s locally and fell back). Run this from the `portage/` folder; no keys are needed. Every line should print `200`.

```bash
L=https://portage-navy.vercel.app
for p in / /start /roadmap /documents /insights; do curl -s -o /dev/null -w "$p %{http_code} %{time_total}s\n" "$L$p"; done
jq -c '{transcript: .text, languageCode, locale: "en"}' src/data/fixtures/transcript-priya.json | curl -s -X POST -H "content-type: application/json" -d @- -o /dev/null -w "profile %{http_code} %{time_total}s\n" "$L/api/profile"
curl -s -F "file=@public/demo/docs/sample-police-check.pdf;type=application/pdf" -F "profile=<src/data/fixtures/profile-priya.json" -o /dev/null -w "doc-check %{http_code} %{time_total}s\n" "$L/api/doc-check"
say -o /tmp/warm.wav --data-format=LEI16@16000 "My name is Priya and I am a nurse." && curl -s -F "audio=@/tmp/warm.wav;type=audio/wav" -o /dev/null -w "transcribe %{http_code} %{time_total}s\n" "$L/api/transcribe"
curl -s -X POST -H "content-type: application/json" -d '{"text":"Your earliest licence is April 2027, if each step goes to plan. It is tight: your practice window closes in July 2027. Start now: ask your nursing school to send your documents to the assessment provider.","languageCode":"hi"}' -o /dev/null -w "speak-short-hi %{http_code} %{time_total}s\n" "$L/api/speak"
```

The last line warms Priya's short Hindi clip (Portage plan) on the server. The text must match the roadmap's **Transcript** exactly (it does for any day before the plan's months shift); if it no longer matches, the browser step below still warms it.

Expected (measured Sep 26, 2026, 7:55 PM): pages about 0.2 s, profile about 7.7 s, doc-check about 3 s, transcribe about 0.5 s, speak about 1.6 s.

Then, in tab 1, open `/roadmap`, press **Hear your plan** once in each view (One at a time, Portage plan) and stop it. The pill plays the short clip; that caches both short clips on the server (a replay then takes about 0.2 s instead of about 4 s). Finally load tab 3 (`?reset=1`) so the demo starts clean.

## The click path

Timings are cumulative from the moment you switch to the browser. Lines in quotes are what to say.

### 3-minute pitch (about 90 seconds of demo)

| Time | Click | Say |
|---|---|---|
| 0:00 | Landing is on screen | "Priya was an ICU nurse for eight years. In Waterloo, she works retail." |
| 0:05 | **Start · Commencer**, then **Use sample voice (Priya)** | "She tells Portage her story in Hindi, in her own words." |
| 0:15 | Point at the chips | "Portage pulls out the facts, and she can correct any of them." |
| 0:20 | **Build my roadmap** | "Every CNO requirement, in order, with the official source." |
| 0:30 | Counter shows DEC 2027; point at the red warning | "One step at a time, she finishes in December 2027, and her evidence of practice expires in July. She would have to start over." |
| 0:40 | **Portage plan · Plan Portage** (cards glide, counter drops to APR 2027) | "Same steps, done in parallel: April 2027. It's tight, so Portage tells her what protects her window: start her school documents now." |
| 0:55 | **Hear your plan** (let it play about 5 seconds, then stop) | "And she hears her plan in Hindi." |
| 1:05 | Nav **Documents**, then **Police check** sample | "Before she mails anything, Portage checks it. Her police check is too early: it would expire before she registers." |
| 1:20 | Nav **Insights** | "And for governments: where Canada's talent gets stuck. These are CNO's real numbers." |
| 1:30 | Back to slides | |

### 5-minute pitch (about 3 minutes of demo)

Same path, with these additions:

| Time | Click | Say |
|---|---|---|
| 0:00 | Landing: scroll once through the chapters to the three numbers | "7,957 internationally educated applicants in Ontario are waiting. CNO's own guideline is about 12 months, across 9 requirements." |
| 0:25 | **Start**: optionally record live in English (press the orb, speak about 10 seconds, press again) | While it works, read the progress lines: "Transcribing, understanding her story, building her plan." (about 8 seconds live) |
| 0:50 | Tap the **Last practised** chip and change it | "She stays in control of every fact." |
| 1:10 | Roadmap: click the **Pass the NCLEX-RN** card | "Every step shows who does it, the official processing time, the fee, and CNO's source link." Press Esc. |
| 1:30 | Toggle to **Portage plan**; point at "What protects your window" | "Tight, not hopeless: these three steps, starting now." |
| 1:50 | **Hear your plan**, then open **Transcript** | "Read aloud in Hindi, with the transcript for accessibility. The facts come from our data; the model only translates." |
| 2:10 | **FR** toggle, then back to **EN** | "Fully bilingual." |
| 2:20 | Documents: **Employment letter** sample | "Some documents must come directly from the employer. Portage catches that before it costs her months." |
| 2:40 | Insights: hover Ontario and another province | "Ontario first. Every province is a new data file plus expert review." |
| 3:00 | Back to slides | |

## Failure plays

| Symptom | Do this, mid-sentence |
|---|---|
| AI slow (spinner over about 10 s) or a "Sample" tag appears when live was expected | Keep talking; switch to **tab 2** (`?demo=1`) and continue the same click path. Fixtures answer in under 0.2 s. "Here is the same flow in demo mode." |
| **Hear your plan** button disappears (speech failed) | Skip that beat; it hides itself on failure. The plan on screen is unaffected. |
| Page will not load on venue wifi | Switch to the phone hotspot (already joined once), reload tab 2 (`?demo=1`). |
| Everything is dead | Open the backup video at `BACKUP_VIDEO_PATH` and narrate over it. |
| Asked "is this real data?" | "Every step comes from CNO's published pages, with links; timelines marked Estimate are ours; the funnel on Insights is labelled illustrative." |

## After the demo

Open tab 3 (`?reset=1`) before handing the laptop to anyone, so the next viewer starts clean.
