# Portage Design System

Architex's design language, Canadian edition. Cinematic dark sections, huge two-tone type, scroll-scrubbed motion, stone neutrals, one rare accent. What changes: flag red instead of violet, bilingual micro-labels, Canadian footage, and the map as a recurring visual.

## 1. Principles
1. **Restraint is the luxury.** One accent colour, two fonts, lots of air.
2. **Motion explains.** Every animation shows a change in state (steps assembling, a plan getting shorter). No motion for decoration only.
3. **Bilingual by default.** Micro-labels always show both languages. Body copy follows the toggle.
4. **Trust is visible.** Sources, "official" vs "estimate" badges, and "Illustrative data" labels are designed elements, not footnotes.
5. **No kitsch.** No moose, beavers, hockey, "eh", or anything resembling Government of Canada branding (no "Canada" wordmark, no flag-plus-wordmark lockup).

## 2. Tokens (`src/app/globals.css`)

```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-display: var(--font-space-grotesk), system-ui, sans-serif;
  --color-accent: #D52B1E;          /* flag red: rare */
  --color-accent-hover: #B32418;
  --color-accent-soft: rgba(213, 43, 30, 0.14);
  --color-ink: #0c0a09;             /* stone-950: cinematic sections */
  --color-granite: #1c1917;         /* stone-900: cards on dark */
  --color-slate-line: #292524;      /* stone-800: borders on dark */
  --color-mist: #a8a29e;            /* stone-400: secondary text on dark */
  --color-paper: #fafaf9;           /* stone-50: light sections */
  --color-rule: #e7e5e4;            /* stone-200: borders on light */
  --color-quiet: #78716c;           /* stone-500: secondary text on light */
  --radius: 0.625rem;
}
```

Usage map:
- Dark sections (hero, intake, roadmap, insights): background `ink`, text `paper`, secondary `mist`, borders `slate-line`.
- Light sections (landing chapters after hero, documents): background `white`/`paper`, text `ink`, secondary `quiet`, borders `rule`.
- Accent red ONLY for: primary CTA, critical path edges and node rings, logo mark, warning icons, the "active province" on maps.
- Status: done = `paper` check icon on `granite`; todo = outline; blocked = red ring + icon; estimate badge = `mist` outline pill with "Estimate · Estimation"; official badge = `paper` fill pill "Official · Officiel".

## 3. Typography
- Display: Space Grotesk 500. Body: Inter 400/500. Numbers in counters: Space Grotesk with `font-variant-numeric: tabular-nums`.
- Scale:
  - Hero: `text-[clamp(2.5rem,8vw,6.5rem)] leading-[1.05] tracking-tight font-display`
  - Chapter words: `text-[clamp(3rem,12vw,10rem)] leading-none tracking-tighter font-display`
  - Section title: `text-4xl md:text-6xl font-display tracking-tight`
  - Counter: `text-6xl md:text-8xl font-display tabular-nums`
  - Body: `text-base md:text-lg leading-relaxed`
  - Micro-label: `text-[10px] tracking-[0.2em] uppercase font-medium` (always bilingual: `PROCESSUS · PROCESS`)
- Two-tone headline: line 1 `text-paper`, line 2 `text-stone-500`.

## 4. Motion (GSAP)
| Element | Animation | Timing |
|---|---|---|
| Hero headline | from `{opacity:0, y:60}` | 1.4 s, `power3.out`, delay 0.3 |
| Hero CTA row | from `{opacity:0, y:20}` | 0.8 s, delay 1.0 |
| Chapter words | opacity 0.15 to 1, scrubbed | ScrollTrigger `top 60%` to `top 30%`, `scrub: true` |
| Ticker | CSS translateX loop | 40 s linear infinite; reverse row 50 s |
| Roadmap nodes in | from `{opacity:0, scale:0.92, y:12}` | 0.5 s each, stagger 0.08, `power2.out` |
| Critical edges | `stroke-dashoffset` flow | CSS 1.6 s linear infinite |
| Layout toggle | GSAP Flip over node positions | 0.9 s, `power3.inOut` |
| Counter | tween number between totals, snap 1 | 0.9 s, synced with Flip |
| Mic orb | scale by input RMS, smoothed | requestAnimationFrame, lerp 0.2 |
| Doc scan | horizontal line sweep top to bottom | 1.2 s, `power1.inOut`, 2 passes |
| Warnings | slide from right + red left rule | 0.5 s, `power2.out` |

Reduced motion: every tween short-circuits to its end state (`gsap.matchMedia()` with `(prefers-reduced-motion: reduce)`); ticker stops; edges static.

## 5. Recurring visual: the land
- `public/topo.svg`: faint topographic contour lines (generate once with `d3-contour` over simplex noise, or hand-pick a public-domain contour pattern). Opacity 6% on dark, 5% on light. Used behind the roadmap canvas and in the insights view.
- `public/geo/canada-provinces.json`: Natural Earth admin-1 (public domain), filtered to Canada, simplified with mapshaper to under 150 KB. Rendered as SVG paths, stroke `slate-line` 0.75 px, fill transparent, hover lifts (`translateY(-2px)`, fill `granite`), active province fill `accent`.

## 6. Screens

### 6.1 Landing `/`
1. **Navbar** (transparent over hero, `glass` on scroll): logo mark (original single-line maple leaf, red) + "Portage" wordmark in Space Grotesk; links "How it works · Comment ça marche", "For government · Pour les gouvernements"; `EN | FR` toggle; pill CTA "Start · Commencer".
2. **Hero** (h-screen, `ink`, grayscale video 40% opacity, gradient to `ink`):
   - Micro-label: `POUR LES PROFESSIONNELS FORMÉS À L'ÉTRANGER · FOR INTERNATIONALLY TRAINED PROFESSIONALS`
   - EN: "You trained for this abroad." / "Now practise it here."
   - FR: "Vous avez été formé à l'étranger." / "Exercez maintenant ici."
   - CTA white pill: "Map my path · Tracer mon parcours"; ghost link: "See a sample plan · Voir un exemple".
3. **Ticker** (two rows, opposite directions, `mist` on `ink`): "ICU nurse · Manila → Sudbury", "Registered nurse · Lagos → Halifax", "Nurse · Kerala → Waterloo", "Midwife · Nairobi → Winnipeg", "Nurse · Kyiv → Calgary", "Nurse · Lahore → Mississauga", "Nurse · Bogotá → Montréal". (Nursing only in v1 so the ticker does not promise professions we do not cover. Add engineers and trades when those pathways exist.)
4. **Chapters** (`white`, scroll-scrubbed words, each with a small grayscale still or clip on the right):
   - **Speak / Parlez:** "Tell us your story in your own language."
   - **Map / Tracez:** "Every requirement, in the right order, with the official source."
   - **Prepare / Préparez:** "Catch document problems before they cost you months."
   - **Practise / Exercez:** "Get to your first shift sooner."
5. **Why it matters band** (`ink`): 2 or 3 big sourced stats only (e.g., "~12 months: CNO's own guideline for nurses educated outside Canada", "9 requirements", "32,000 professionals supported by federal FCR agreements this year"). Each stat has a tiny source line.
6. **Final CTA** (`ink`): "Carry your career across." / "Emportez votre carrière avec vous." + CTA.
7. **Footer:** "Portage is a planning tool. It never asks for your regulator login and never submits anything for you. Always confirm with your regulator." (bilingual)

### 6.2 Intake `/start`
- Full-screen `ink`. Top-left: back + micro-label `ÉTAPE 1 · STEP 1`.
- Centre: mic orb (180 px, `granite` fill, `paper` 1 px ring; while listening, a red 2 px ring pulses with volume).
- Prompt above orb (display, 3xl): "Tell me about your nursing career." / "Parlez-moi de votre parcours en soins infirmiers." Subtext listing what helps: where you studied, years of experience, when you last worked as a nurse, language tests, whether you can work in Canada.
- After stop: transcript in native script, large (2xl), then English translation fades in below in `mist`.
- Profile chips animate in (pill, `granite`, `paper` text; low-confidence fields get a dashed outline and "Check · Vérifier").
- Buttons: "Build my roadmap · Créer mon parcours" (red pill), "Use sample voice (Priya) · Utiliser l'exemple".
- Consent (xs, `mist`): "Your audio is sent to ElevenLabs for transcription and your words to Anthropic to build your profile. Portage does not store either."

### 6.3 Roadmap `/roadmap`
- `ink` background with topo overlay. React Flow controls hidden; custom zoom buttons bottom-right in `granite`.
- **Header bar:** micro-label `PARCOURS · ROADMAP`, title "Registered Nurse, Ontario" / "Infirmier(ère) autorisé(e), Ontario", profile chips (editable).
- **Counter block** (top-right): label "Earliest licence · Permis au plus tôt", value "MAY 2027" style month + year, sub "X% estimated · X % estimé".
- **Toggle** (segmented, pill): "One at a time · Une à la fois" | "Portage plan · Plan Portage".
- **StepNode:** 240 px card, `granite`, 1 px `slate-line`; top row actor icons (you / CNO / third party); title (display, lg); duration line "6 to 10 wks" + Official/Estimate badge; status glyph. Critical nodes: 1 px red ring + small red dot.
- **Edges:** stone 1 px; critical: red 1.5 px with flowing dash.
- **Parallel layout:** x = earliest start week × 40 px, lanes by concurrency; a faint week ruler along the top ("Week 0, 4, 8..." / "Semaine").
- **Side panel** (right, 420 px, `granite`, slides in): title, summary, "Who does this", time, cost, "Can start before arriving in Canada" tag, warnings, sources list with external-link icons.
- **Warnings stack** (left, under header): cards with red left rule (border-radius 0 on that side), icon, title, one-line body, "See fix".

### 6.4 Documents `/documents` [SHOULD]
- Light section (`paper`). Drop zone: dashed `rule`, large display text "Drop a document · Déposez un document".
- On upload: document thumbnail, scan line sweeps, then findings list: ticks (`ink`) for OK, red flags for issues with plain-language fix and the CNO source link.
- Sample docs row: "Try a sample · Essayer un exemple" (three watermarked SAMPLE / EXEMPLE files).

### 6.5 Insights `/insights` [SHOULD]
- `ink`. Title: "Where Canada's talent gets stuck." / "Où les talents du Canada restent bloqués."
- Left: Canada map, Ontario active (red), others dimmed with "Coming soon · Bientôt".
- Right: stage funnel for the nine requirements (horizontal bars, stone with the biggest drop in red).
- Persistent badge top-right: "Illustrative data · Données illustratives" unless replaced with sourced aggregates.
- Footer line: "Built for the FLMM credential recognition platform recommendations, Fall 2026."

## 7. Assets
- **Footage (Pexels, free to use):** search "nurse hospital corridor", "nurse night shift", "hospital hallway walking", "snow city street Canada", "Toronto streetcar", "stethoscope close up", "hands scrubbing surgery". 1080p, 8 to 12 s, grayscale via CSS `filter: grayscale(1)` (not baked in, so we can reuse). Compress with `ffmpeg -i in.mp4 -vf scale=1920:-2 -an -c:v libx264 -crf 28 -preset slow -movflags +faststart out.mp4`.
- **Posters:** first frame JPG at quality 70.
- **Logo:** original single-stroke maple leaf, drawn fresh (do not trace the flag leaf), red stroke on transparent.
- **OG image:** hero headline on `ink` with logo, 1200×630.

## 8. Accessibility
- Contrast: `mist` on `ink` passes for body; never put `quiet` on `ink`.
- All interactive elements keyboard reachable; visible focus ring (`paper` 2 px offset).
- Video is decorative: `aria-hidden`, muted, no controls.
- Language attribute switches with locale (`<html lang="en-CA">` / `fr-CA`).
- Transcript area has `aria-live="polite"`.
