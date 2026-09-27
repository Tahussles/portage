# Demo runbook

- Deck: **https://portage-navy.vercel.app/pitch** (the live demo starts from slide 5, in the same tab)
- Demo: **https://portage-navy.vercel.app**; instant backup: **https://portage-navy.vercel.app/?from=pitch&demo=1**
- Known-good release: tag **`v1.2-demo`** (commit `5bab52a`, "Merge pull request #52": the Portage line hero and product shots in the chapters). Older fallbacks: `v1.1-demo` (`3fe94e1`, one language at a time) and `v1.0-demo` (`8063c17`). See [If a late deploy breaks the site](#if-a-late-deploy-breaks-the-site).

The pitch runs live with real AI (decision 15). `?demo=1` serves fixtures with no network calls to the AI providers. Priya is a composite persona; say so if asked.

## T-10 minutes

- [ ] Laptop charged and on power; phone hotspot on and tested (join it once, then back to venue wifi).
- [ ] Chrome: a profile with **no extensions**, zoom **100%**, window at least 1440 wide, bookmarks bar hidden.
- [ ] Sound **on**, volume about 60%, output to the room speakers if there are any (for "Hear your plan").
- [ ] macOS: **Reduce motion OFF** (System Settings, Accessibility, Display), **Do Not Disturb ON**, notifications off, Dock hidden.
- [ ] From the `portage/` folder: `pnpm smoke https://portage-navy.vercel.app` prints "All checks passed" (six pages including `/pitch`, plus the demo profile call). If anything fails, see [If a late deploy breaks the site](#if-a-late-deploy-breaks-the-site).
- [ ] Tabs pre-opened, in this order:
  1. https://portage-navy.vercel.app/pitch (the deck, then the live demo in this same tab)
  2. https://portage-navy.vercel.app/?from=pitch&demo=1 (backup: same flow with fixtures, and "Back to pitch" still works)
  3. https://portage-navy.vercel.app/?reset=1 (warm-up tab; also clears a profile before handing the laptop over)
- [ ] Deck PDF on the desktop: in tab 1 press Cmd+P, Destination **Save as PDF**, **Background graphics** on (9 landscape pages). Copy it to a USB stick or cloud link too.
- [ ] Backup video on the desktop: `BACKUP_VIDEO_PATH` (placeholder until recorded), opened once in QuickTime.

## T-2 minutes: warm-up

Cold serverless functions can take much longer on the first call (a cold profile call took 18.7 s locally and fell back). Run this from the `portage/` folder; no keys are needed. Every line should print `200`.

```bash
L=https://portage-navy.vercel.app
for p in / /start /roadmap /documents /insights /pitch; do curl -s -o /dev/null -w "$p %{http_code} %{time_total}s\n" "$L$p"; done
jq -c '{transcript: .text, languageCode, locale: "en"}' src/data/fixtures/transcript-priya.json | curl -s -X POST -H "content-type: application/json" -d @- -o /dev/null -w "profile %{http_code} %{time_total}s\n" "$L/api/profile"
curl -s -F "file=@public/demo/docs/sample-police-check.pdf;type=application/pdf" -F "profile=<src/data/fixtures/profile-priya.json" -o /dev/null -w "doc-check %{http_code} %{time_total}s\n" "$L/api/doc-check"
say -o /tmp/warm.wav --data-format=LEI16@16000 "My name is Priya and I am a nurse." && curl -s -F "audio=@/tmp/warm.wav;type=audio/wav" -o /dev/null -w "transcribe %{http_code} %{time_total}s\n" "$L/api/transcribe"
curl -s -X POST -H "content-type: application/json" -d '{"text":"Your earliest licence is April 2027, if each step goes to plan. It is tight: your practice window closes in July 2027. Start now: ask your nursing school to send your documents to the assessment provider.","languageCode":"hi"}' -o /dev/null -w "speak-short-hi %{http_code} %{time_total}s\n" "$L/api/speak"
```

The last line warms Priya's short Hindi clip (Portage plan). The text must match the roadmap's **Transcript** exactly (it does unless the plan's months shift).

Expected (measured Sep 26, 2026): pages about 0.2 s, profile about 7.7 s, doc-check about 3 s, transcribe about 0.5 s, speak-short-hi about 4.5 s cold and 0.3 s once cached.

The speech cache lives in each server instance, and Vercel can answer from a fresh one, so the curl alone is not a guarantee. The reliable warm-up is in the browser: in **tab 3**, open `/roadmap`, press **Hear your plan** once in each view (One at a time, Portage plan) and stop it. Then load tab 3 again with `?reset=1`. Finally, in **tab 1**, press Home so the deck is on slide 1 (this also restarts the notes timer).

## The deck

- **→ / Space** next, **←** back, **1-9** jump to a slide, **F** fullscreen, **N** speaker notes with a timer. Clicking a slide also advances.
- The notes panel is on the same screen, so the room sees it on a mirrored projector. Use **N** in rehearsal; on stage keep it closed unless the display is extended.
- The URL keeps the slide (`/pitch?s=6`), so a reload stays put.
- Slide 5 has **Open the live demo** (same tab, real AI) and **Instant backup (demo mode)** (same flow with fixtures).
- Every page of the demo shows **Back to pitch** in the navbar (top right, next to EN/FR); it opens slide 6, "What just happened".

## The click path

Lines in quotes are what to say. The speaker notes (**N**) hold the slide lines.

### 3-minute pitch

| Time | Slide or click | Say |
|---|---|---|
| 0:00 | Slide 1, fullscreen (**F**) | "Canada's biggest untapped resource isn't in the ground." |
| 0:10 | Slide 2, Priya | "Meet Priya. Eight years as an ICU nurse. In Waterloo, she works retail." |
| 0:20 | Slide 3, the problem | "Nine separate requirements, about 12 months by CNO's own guideline, and 7,957 internationally educated applicants waiting in Ontario." |
| 0:35 | Slide 4, why now | "In July 2026 the labour ministers agreed to build a digital platform for credential recognition. We built the prototype this weekend." |
| 0:45 | Slide 5: **Open the live demo** | "Let me show you." Then the demo below (about 90 seconds). |
| 2:15 | Navbar: **Back to pitch** (slide 6) | "One at a time, December 2027, after her window closes. With the Portage plan, April 2027: tight, and Portage shows what protects it." |
| 2:30 | Slide 7, business model | "Free for newcomers, always. Regulators, employers and settlement agencies pay." |
| 2:40 | Slide 8, why Portage | "A personal, cited, deadline-aware plan, and a live view for government of where people get stuck." |
| 2:50 | Slide 9, next 30 days | "We're Taha and Ebrahim. Portage. Carry your career across." |

Demo, timed from **Open the live demo**:

| Time | Click | Say |
|---|---|---|
| 0:00 | Landing is on screen | "Priya was an ICU nurse for eight years. In Waterloo, she works retail." |
| 0:05 | **Start**, then **Use sample voice (Priya)** | "She tells Portage her story in Hindi, in her own words." |
| 0:15 | Point at the chips | "Portage pulls out the facts, and she can correct any of them." |
| 0:20 | **Build my roadmap** | "Every CNO requirement, in order, with the official source." |
| 0:30 | Counter shows DEC 2027; point at the red warning | "One step at a time, she finishes in December 2027, and her evidence of practice expires in July. She would have to start over." |
| 0:40 | **Portage plan** (cards glide, counter drops to APR 2027) | "Same steps, done in parallel: April 2027. It's tight, so Portage tells her what protects her window: start her school documents now." |
| 0:55 | **Hear your plan** plays the short clip: licence date, tight, first step (about 23 s in Hindi). Let the first sentence play, then press **Stop** | "And she hears her plan in Hindi: when, how tight, and what to do first." |
| 1:05 | Nav **Documents**, then **Police check** sample | "Before she mails anything, Portage checks it. Her police check is too early: it would expire before she registers." |
| 1:20 | Nav **Insights** | "And for governments: where Canada's talent gets stuck. These are CNO's real numbers." |
| 1:30 | Navbar: **Back to pitch** | |

### 5-minute pitch

The same deck, with the "5 min:" lines in the speaker notes, and about 3 minutes of demo. Slides 1 to 4 take about a minute, the demo about 3:05, slides 6 to 9 about a minute.

Demo, timed from **Open the live demo**, adding these to the path above:

| Time | Click | Say |
|---|---|---|
| 0:00 | Landing: scroll once through the chapters to the three numbers | "7,957 internationally educated applicants in Ontario are waiting. CNO's own guideline is about 12 months, across 9 requirements." |
| 0:25 | **Start**: optionally record live in English (press the orb, speak about 10 seconds, press again) | While it works, read the progress lines: "Transcribing, understanding her story, building her plan." (about 8 seconds live) |
| 0:50 | Tap the **Last practised** chip and change it | "She stays in control of every fact." |
| 1:10 | Roadmap: click the **Pass the NCLEX-RN** card | "Every step shows who does it, the official processing time, the fee, and CNO's source link." Press Esc. |
| 1:30 | Toggle to **Portage plan**; point at "What protects your window" | "Tight, not hopeless: these three steps, starting now." |
| 1:50 | **Hear your plan** (the short clip plays in full, about 23 s), then open **Transcript** | "Read aloud in Hindi: her licence date, how tight it is, and her first step. The facts come from our data; the model only translates. **Full plan** reads every step." |
| 2:15 | **FR** toggle, then back to **EN** | "Every screen in French too, one language at a time. A French browser starts in French." |
| 2:25 | Documents: **Employment letter** sample | "Some documents must come directly from the employer. Portage catches that before it costs her months." |
| 2:45 | Insights: hover Ontario and another province | "Ontario first. Every province is a new data file plus expert review." |
| 3:05 | Navbar: **Back to pitch** (slide 6) | |

## Failure plays

| Symptom | Do this, mid-sentence |
|---|---|
| AI slow (spinner over about 10 s) or a "Sample" tag appears when live was expected | Keep talking; switch to **tab 2** (`?from=pitch&demo=1`) and continue the same click path. Fixtures answer in under 0.2 s. "Here is the same flow in demo mode." |
| **Hear your plan** button disappears (speech failed) | Skip that beat; it hides itself on failure. The plan on screen is unaffected. |
| **Back to pitch** is missing | Switch to tab 1's address bar and open `/pitch?s=6`. |
| Page will not load on venue wifi | Switch to the phone hotspot (already joined once), reload tab 2. |
| The deck will not load | Open the deck PDF from the desktop, full screen. Run the demo from tab 2, or the backup video. |
| Everything is dead | Open the backup video at `BACKUP_VIDEO_PATH` and narrate over it. |
| Asked "is this real data?" | "Every step comes from CNO's published pages, with links; timelines marked Estimate are ours; the funnel on Insights is labelled illustrative." |

## If a late deploy breaks the site

Every push to `main` deploys to production. If a late deploy breaks the site (a smoke FAIL, errors, a blank page), roll back to the known-good build:

1. Vercel dashboard > **Deployments** > the **v1.2-demo** deployment: commit `5bab52a`, "Merge pull request #52 from Tahussles/feat/chapter-shots" ([direct link](https://vercel.com/tahoi-goooooooooooos-projects/portage/8c8YsE2bAXjLF93XGRGYHLVupyhj)). If that build is the broken one, step back to **v1.1-demo** (commit `3fe94e1`, [direct link](https://vercel.com/tahoi-goooooooooooos-projects/portage/DDcuPvrZZdoaWEiXDyQXTF1ZhkoG)) or **v1.0-demo** (commit `8063c17`, [direct link](https://vercel.com/tahoi-goooooooooooos-projects/portage/JFzGpXdzGiw1Ab5EGMyB2akY947f)).
2. Its **⋮** menu > **Instant Rollback**. On the Hobby plan Instant Rollback only reaches the immediately previous production deployment; if the tagged build is further back, use **Promote to Production** from the same menu instead. Either way the build is reused, not rebuilt, and the switch is immediate.
3. Re-run `pnpm smoke https://portage-navy.vercel.app` and reload tabs 1 and 2.

After an Instant Rollback, Vercel stops assigning new `main` deploys to production until someone clicks **Undo Rollback** on the project overview, so a later push will not undo the rollback by accident.

## After the demo

Open tab 3 (`?reset=1`) before handing the laptop to anyone, so the next viewer starts clean.
