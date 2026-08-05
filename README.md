# Tenjin てんじん

A minimal, distraction-free Japanese-learning app. Realkana-style pacing, but
**no multiple choice** (no guessing by elimination).

The home page is a growing list of **sections** — today: **Kana** (hiragana &
katakana) and **Vocabulary** (common words & phrases). Kanji becomes new
sections later; each one gets its own data module and plugs into the same
drill engine.

Type a reading, pick a character, or draw it with your finger/mouse/stylus.
Correct answers advance immediately; wrong ones stay on the same card so you
try again. Progress, streaks and highscores live in `localStorage` (nothing
leaves the device). It's a static site and a PWA — it installs and works
offline.

## Stack

Next.js (App Router, **static export**), TypeScript, plain hand-written CSS
(no UI framework), Vitest for the engine, zero runtime dependencies.

## Run it

```bash
npm install
npm run dev        # local dev server
npm run test       # engine unit tests
npm run typecheck  # TS check
npm run lint       # eslint
npm run build      # static export → out/
npm start          # serve the export
npm run icons      # regenerate the app icons (pure Node, no deps)
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import** the repo. The framework is auto-detected
   (Next.js, static output). No env vars or config needed.
3. `npm run build` + `vercel.json` are already wired — deploy succeeds as-is.

## How it's put together (read before extending)

```
data/kana.ts             the kana section's content → the single source of truth
lib/decks.ts             section registry — where new content plugs in
lib/types.ts            generic contracts (Card, DrillConfig, InputKind, …)
lib/quizzing.ts         the scheduler (auto-advance, retry-on-wrong, skip)
lib/matching.ts         prefix-aware input matching (partial vs wrong)
lib/stats.ts            localStorage: per-card mastery, highscores, streaks
lib/recognition.ts      handwriting scoring for the draw drill
lib/util.ts             shuffle / queue helpers
components/drill/       DrillView (runner) + DrawCanvas (draw input)
components/             KanaTable (charts), PracticeSetup (config UI), …
app/                    next routes: `/` (sections) and `/practice/?…` (runner)
scripts/generate-icons.mjs, public/, vercel.json, app/manifest.ts, sw.js — PWA
```

### The core idea

Every learning item — kana today, kanji/vocab tomorrow — becomes a **`Card`**:
`{ prompt, answer, check(input) }`. The runner, scheduler, stats, highscores
and setup UI only ever see `Card`s. **To add a new way to practice a
character set, you add a deck; the app grows without restructuring.**

### Editing kana (fix a reading, add a group)

All kana live in `data/kana.ts`: the `CHAR` map (glyph), `KATA` (katakana
conversion), and the `ROWS` map (row → readings + accepted spelling variants).
Change a reading there and charts, the config UI and every drill update.
Readings are forgiving on purpose (`shi`/`si`, `chi`/`ti`, …) — keep the
accepted-variants array up to date.

### Adding a new section (kanji, vocabulary, …)

1. Create `data/<deck>.ts` mirroring `data/kana.ts`:
   - a `groups` list (e.g. JLPT levels, topics),
   - a `buildCards(settings)` function returning `Card[]`,
   - its own settings type (extend `DeckSettings` in `lib/decks.ts`).
2. Append a `DeckDef` to `lib/decks.ts` — it then appears on the home
   section list automatically. Kana keeps its script/direction extras in
   `components/PracticeSetup.tsx`; new sections can add their own config rows
   there when needed.
3. `Shuffle again` / `Review missed` / highscores all keep working for free —
   the engine only ever sees `Card`s.

### Adding a new input mode (new *kind* of drill)

1. Add the value to `InputKind` in `lib/types.ts`.
2. Render it: a small branch in `components/drill/DrillView.tsx`.
3. Declare it in the deck's `inputs` in `lib/decks.ts` so the config UI offers it.

### Draw recognition caveat

The draw drill scores your ink against the *target glyph* rendered locally
with the same font — it is deliberately not a classifier (no dependency, works
offline). Stroke-order checking (real stroke data) can replace
`lib/recognition.ts` later without touching the UI. If you'd rather defer it,
remove the `draw` mode from `InputKind` (lib/types.ts) and from the `MODES`
array in PracticeSetup.
