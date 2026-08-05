<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- ---------------------------------------------------------------- -->
<!-- Tenjin project playbook (written by the maintainer — keep updated) -->
<!-- ---------------------------------------------------------------- -->

## What this is

**Tenjin** — a minimal, offline-first Japanese-learning PWA ("no multiple
choice" by design). Next.js 16 **App Router, static export**
(`next.config.ts`: `output: "export"`, `trailingSlash: true`), TypeScript,
hand-written CSS (no UI framework), Vitest. Deployed to Vercel (auto-detected
framework; `vercel.json` sets headers for `/sw.js`, `/manifest.webmanifest`,
security). Content is organized as **sections** (today: `kana`, `vocabulary`;
kanji coming).

## Command cheat sheet — run ALL before calling work done

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint (Next + React Compiler rules are strict, see gotchas)
npm run test        # vitest — engine unit tests
npm run build       # static export → out/
npm run dev         # local dev server
npm run icons       # regenerate app icons (pure Node PNG writer)
npm start           # serve out/ locally
```

## Architecture & the flow of content

- `data/kana.ts` — content source of truth (full 216-char syllabus, variants).
- `data/vocabulary.ts` — vocabulary deck (81 words: greetings, numbers, time,
  family, food, directions, verbs, adjectives, particles, questions). Only
  supports the **Read** mode (kana → romaji, meaning shown); no picker/draw.
- `lib/types.ts` — generic contracts: `Card { prompt, answer, check, readings }`,
  `DrillConfig`, `InputKind`, `KanaDirection`.
- `lib/decks.ts` — **section registry**. Adding kanji/vocab = new `data/<deck>.ts`
  (groups + `buildCards(settings)`) + one `DeckDef` here. Everything else follows.
- `lib/quizzing.ts` — `DrillSession`: weighted scheduling (see note below),
  auto-advance on correct, wrong stays on card, `skip()`, `fail()`.
- `lib/matching.ts` — `classifyInput` → `correct | partial | wrong | empty`
  (prefix-aware so typing "k…" toward "ka" isn't flagged wrong).
- `lib/stats.ts` + `components/useStats.ts` — progress, mastery, highscores,
  day streaks; **reactive store** pattern.
- `lib/settings.ts` + `components/useSettings.ts` — persisted UI options.
- `components/drill/` — `DrillView` (runner) + `DrawCanvas` (draw input).
- `lib/recognition.ts` — draw scoring (glyph-similarity, deliberately not a
  classifier; swappable for real stroke-order data later without touching UI).

## Extension seams (the 2 things you'll be asked to do)

1. **Add a section (kanji/vocab…)**: new `data/<deck>.ts` mirroring `data/kana.ts`
   (groups + `buildCards(settings)` returning `Card[]`), extend `DeckSettings`
   in `lib/decks.ts`, add a `DeckDef`. It appears on the home section list
   automatically; if a deck needs custom config UI rows (like kana's script/
   direction), add them in `components/PracticeSetup.tsx`.
   **Provide `readings` on cards** (`string[]`, normalized) or typing will
   false-wrong mid-word — `classifyInput` needs it for `partial` detection.
2. **Add an input mode**: `InputKind` in `lib/types.ts` + a render branch in
   `DrillView.tsx` + declare it in the deck's `inputs` in `lib/decks.ts`.

## Gotchas (all bitten us — respect these)

- **Next 16 + static export**: no server/dynamic features. Metadata routes need
  `export const dynamic = "force-static"` (see `app/manifest.ts`).
- **NEVER render a `<script>` element from a component** (React 19 warns;
  breaks hydration). Theme FOUC is solved by a module-scoped side-effect in
  `ThemeProvider.tsx`, not a script tag.
- **`useSyncExternalStore` snapshots must be cached/stable references** — a
  fresh `Map`/object every call causes "Maximum update depth exceeded".
  `lib/stats.ts` snapshots a version counter; `lib/settings.ts` caches the
  object and replaces it only on update.
- **`react-hooks/set-state-in-effect` + React Compiler lint are strict**:
  don't `setState()` synchronously in effects (use the store pattern instead);
  don't add manual `useMemo` that the compiler flags — compute trivially each
  render and let it optimize. (Both errors appeared during normal dev.)
- **Vitest 4 here ignores the jsdom env setting** — test files must not rely on
  `window`/`localStorage`. See `__tests__/stats.test.ts` for the self-polyfill
  pattern; keep tests environment-agnostic.
- **localStorage access must be try/catch** everywhere (private browsing throws).
- **Keys**: settings `tenjin:settings:v1`, theme `tenjin:theme`, stats
  `kana-trainer:v1` (LEGACY — kept so existing users don't lose progress; don't
  rename casually). SW cache name in `public/sw.js` — bump when deploying
  breaking asset changes so old cached clients refresh.
- **Scheduler**: `DrillSession.weighted()` buckets by mastery (weak first) and
  **shuffles within each bucket** — do not replace with a deterministic sort
  (rows would come out in data order = "ka ke ki ko ku", seen as a bug).
- **ん** answers to a bare `n`, `nn`, or `n'` — safe because the current card
  is fixed (a bare "n" can never also answer な etc).
- Service worker (`public/sw.js`): network-first for navigations (fallback to
  cached `/index.html`), stale-while-revalidate for assets; precaches `/` +
  `/index.html`. Works with static export.

## Style rules

- No comments in code unless they explain a non-obvious decision (this file
  and README exist for guidance). Mimic existing patterns; plain CSS lives in
  `app/globals.css`; kana glyphs use `--font-kana` (JP serif stack).
- Keep the engine (`lib/*`) framework-free and pure (unit-testable); React
  lives in `components/` and `app/`.
