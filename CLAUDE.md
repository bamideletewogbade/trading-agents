# The financial intelligence gym

A mobile-first web product where people in Ghana, then Nigeria and beyond, learn to read markets
and trade with discipline, by practising in simulations and historical replays with an AI coach. Working name Sika Lab, set in
`lib/brand.ts`.

## Read before building anything

1. **The landing page, `app/page.tsx`**, and **`content/curriculum.ts`**: since the reset on
   26 Sep 2026 these are the brief. The product teaches trading and investing (charts,
   technical and fundamental analysis, strategies) as a roadmap of playable lessons, each of
   which also stands alone.
2. `docs/strategy/monetization-and-community.md`: how we make money without selling signals,
   the Floor (community), and the current review of gaps.
3. `docs/research/competitors.md`: who else does this, what we take, and the GitHub
   build-vs-fork call (build ours; adopt lightweight-charts; trading-signals as the answer key).
4. `docs/product-spec.md`: the original why and what. Its principles still hold; its scope is
   narrowed by (1).
5. `docs/implementation-plan.md`: stack, architecture, phases, what we port from Kanea Studio,
   Learn with Bishop and Aksen Labs.
6. `docs/design-brief.md`: the visual system, drawn at `/design`. The landing page adds the
   terminal voice: JetBrains Mono for labels and figures (`font-mono`), chart-paper grids, and
   hollow/filled candles so direction never depends on colour.

Build in phase order. Don't start a phase until the previous phase's exit criteria are met.

## Rules that are not negotiable

1. **AI explains; code calculates.** Every number a learner sees comes from an engine in
   `lib/engines`. The coach may repeat engine numbers, never originate them; the numeric guard
   rejects turns that try.
2. **AI composes; it never invents UI.** The coach returns a typed `Compose` directive naming a
   registered experience. No generated markup, CSS or charts.
3. **Jev decides, never writes.** Yes/no, one-of and score questions go to Jev through OpenRouter's
   Decisions API (`/api/alpha/decisions`). 0.35–0.65 is the hedge band: a hedged assessment
   becomes a question to the learner, a hedged safety answer takes the authored path, and a
   hedged content check goes to a person.
4. **The AI never moves money.** Only a deterministic handler holding a server-issued quote can
   start a Paystack charge. Only `charge.success` or a verify call grants anything, through one
   SQL statement.
5. **Money is integers.** Minor units with a currency code; rates in basis points; AI costs in
   micro-dollars.
6. **Engines are pure and seeded.** No I/O, no `Math.random()`. Runs are event-sourced so
   What-If is a replay.
7. **Every experience declares its truth**: `SIMULATION`, `HYPOTHETICAL`, `HISTORICAL DATA`,
   `EDUCATIONAL ONLY`. Colour is never the only signal.
8. **Mobile first.** Check at 375px with no horizontal overflow. 3D only where the plan names it,
   lazy-loaded, skipped on reduced-motion, Save-Data and low-memory phones.
9. **No hype, no signals, no fake urgency.** No trade calls, no promised returns, no countdown
   timers, no paywall in a session where distress was flagged.
10. **WhatsApp is scoped.** A learning coach for our curriculum, not a general-purpose chatbot
    (Meta's policy since 15 Jan 2026). Frugal with messages; templates only for opted-in dailies
    and renewals.

## Working here

The stack is the Kanea Studio one: vinext on Cloudflare Workers, React 19, Tailwind 4, zod, Drizzle
over Neon (node-postgres for a local database), OpenRouter. Paystack and the WhatsApp Cloud API join
in Phase 5.

```bash
pnpm dev               # http://localhost:5177
pnpm check             # core, engine and intelligence checks, no network. Must pass before any push
pnpm typecheck && pnpm lint
pnpm shots             # with pnpm dev running: every screen at 360/375/390 px, fails on sideways scroll
pnpm walk:onboarding   # with pnpm dev running: chats through onboarding to the desk
pnpm walk:lessons      # with pnpm dev running: plays all 40 lessons of stages 1–5 to the finish
pnpm db:generate       # after changing db/schema.ts: write the next migration (commit it)
pnpm db:migrate        # apply migrations to DATABASE_URL (env or .dev.vars), over HTTPS for Neon
pnpm probe:openrouter  # one live Jev call and one coach turn; costs well under a cent
npx oxfmt <files>      # format what you touched
```

- `lib/core` and `lib/engines` import each other by relative `.ts` path and nothing else, so
  `pnpm check` can run them under plain Node.
- Colours come only from the tokens in `app/globals.css`; Tailwind's own palette is switched off.
  Type uses the `type-*` utilities; numbers that change or align get `num`.
- Route groups, each with its own layout:
  - `app/(marketing)/`: the public site (nav, announcement, footer). A new page is a folder here
    plus a nav line in `content/marketing.ts`.
  - `app/(member)/`: sign-in, sign-up, onboarding, the desk and the lesson player. Clerk loads
    only here.
  - `app/design/`: the design specimen, for the team, not linked from the product.
- Every service is optional (`lib/capabilities.ts`): Clerk, the database, Jev. Code asks
  `capabilities()` and degrades, so a missing key never breaks a page. Clerk hooks only run inside
  `AuthProvider`'s Clerk branch; everything else asks `useAccountMode()`. Server code asks
  `signedInUser(request)` (`lib/auth/server.ts`).
- The curriculum is one list (`content/curriculum.ts`). The roadmap, the single-lesson library,
  the ask box (`lib/curriculum/search.ts`), onboarding placement and the desk all read it.
  `pnpm check` proves every lesson sits in exactly one stage and every live lesson has somewhere
  to play.
- **Lessons are data.** A lesson is a list of beats in `content/lessons/stage*.ts` (`say`,
  `widget`, `choice`, `reflect`), each tagged with its step of the loop. The player
  (`components/lesson/LessonPlayer.tsx`) never changes for a new lesson.
  - Interaction lives in *widgets*: registered once in `components/lesson/widgets/index.tsx`,
    named in `lib/lessons/types.ts`, each backed by an engine, and reusable by any lesson.
  - Every number in a lesson's words is computed in its `beats()` from an engine.
  - Charts a lesson depends on use seeds pinned in `content/lessons/seeds.ts`.
  - A new lesson means:
    1. its beats in `content/lessons`;
    2. `status: 'live'` and `playAt: '/lesson/<id>'` in `content/curriculum.ts`;
    3. a walk step in `scripts/walk-lessons.mjs` if it uses a new widget.
  - `scripts/check-lessons.ts` proves it's complete: a widget, a prediction and a "why"; exactly
    one right answer per question; registered widgets only; the seeds still show what the words
    say.
  - Progress is `lesson_completed` events (`/api/progress`), mirrored on the phone
    (`lib/client/progress.ts`).
- Onboarding questions are data. A new question means: a step, its reader and a Jev option set
  in `lib/onboarding/flow.ts`, its words and chips in `content/onboarding.ts`, and checks in
  `scripts/check-onboarding.ts` using real phrases people type. The chat screen doesn't change.
- Motion lives in `app/globals.css` (page-in, reveals, menu, chat bubbles, card flips), and every
  animation collapses under reduced motion. The 3D hero (`components/three/NoiseField.tsx`)
  loads three.js only after idle, and only on phones that can afford it. New screens get added to `PAGES` in `scripts/shots.mjs`.
- A new interactive piece is a lesson widget (above): an engine in `lib/engines`, its words in
  `content/`, and checks in `scripts/check-lessons.ts`, including one that proves the money
  balances. The first build's Payday experience and its run-replay pipeline were removed on
  26 Sep 2026 (nothing linked to them); git history has them if a replayable experience returns.
- Never trust a number from the browser: the server recomputes anything it stores (onboarding
  placement, lesson completion) from its own copy of the rules.
- Secrets live in the environment or `.dev.vars`, never in the repo, never pasted in chat.
- Comments explain _why_, in plain words. Words shown to learners live in `content/`, not in
  components.
