# The financial intelligence gym

A mobile-first web product where people in Ghana, then Nigeria and beyond, learn to read markets
and trade with discipline, by practising in simulations and historical replays with an AI coach. Working name Sika Lab, set in
`lib/brand.ts`.

## Read before building anything

1. **The landing page, `app/page.tsx`**, and **`content/curriculum.ts`**: since the reset on
   26 Sep 2026 these are the brief. The product teaches trading and investing (charts,
   technical and fundamental analysis, strategies) as a roadmap of playable lessons, each of
   which also stands alone.
2. `docs/member-app-plan.md`: the signed-in app (the desk, side nav, modules), signals and
   their safeguards, market data, community owners (white label), and the phases.
3. `docs/strategy/monetization-and-community.md`: revenue lines, the Floor (community), and the
   review of gaps. Its "no signals" stance is superseded by the member-app plan §4.
4. `docs/research/competitors.md`: who else does this, what we take, and the GitHub
   build-vs-fork call (build ours; adopt lightweight-charts; trading-signals as the answer key).
5. `docs/product-spec.md`: the original why and what. Its principles still hold; its scope is
   narrowed by (1).
6. `docs/implementation-plan.md`: stack, architecture, phases, what we port from Kanea Studio,
   Learn with Bishop and Aksen Labs.
7. `docs/design-brief.md`: the visual system, drawn at `/design`. The landing page adds the
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
   `LIVE MARKET DATA`, `EDUCATIONAL ONLY`. Colour is never the only signal.
8. **Mobile first.** Check at 375px with no horizontal overflow. 3D only where the plan names it,
   lazy-loaded, skipped on reduced-motion, Save-Data and low-memory phones.
9. **No hype, no fake urgency, and signals only with their proof.** A signal comes from a fixed,
   versioned rule in `lib/engines/signals.ts`, with a stop, a target, the reasons for and against,
   and the rule's complete record; losses stay in it. No promised returns, no countdowns, no
   single-win screenshots, no paywall in a session where distress was flagged, and signals point
   to the paper account and the journal first.
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
pnpm shots             # with pnpm dev running: every screen at 360/375/390/1024/1440 px, fails on sideways scroll
pnpm walk:onboarding   # with pnpm dev running: chats through onboarding to the desk
pnpm walk:lessons      # with pnpm dev running: plays all 47 lessons of stages 1–6 to the finish
pnpm walk:trade        # with pnpm dev running: journal, tools, and a paper trade placed and closed
pnpm db:generate       # after changing db/schema.ts: write the next migration (commit it)
pnpm db:migrate        # apply migrations to DATABASE_URL (env or .dev.vars), over HTTPS for Neon
pnpm probe:openrouter  # one live Jev call and one coach turn; costs well under a cent
pnpm probe:gates       # every Jev gate's labelled phrases, live, three runs; well under a cent
npx oxfmt <files>      # format what you touched
```

- `lib/core` and `lib/engines` import each other by relative `.ts` path and nothing else, so
  `pnpm check` can run them under plain Node.
- Colours come only from the tokens in `app/globals.css`; Tailwind's own palette is switched off.
  Type uses the `type-*` utilities; numbers that change or align get `num`.
- Route groups, each with its own layout:
  - `app/(marketing)/`: the public site (nav, announcement, footer). A new page is a folder here
    plus a nav line in `content/marketing.ts`. Pages carry the names people already use: Courses
    (`/courses`), Signals (`/trading-signals`, which explains them; the signals themselves are in
    the app at `/signals`), Features, Community (with a section for community owners), Pricing,
    and Resources (Glossary, Trading psychology at `/psychology`, the IPO guide). Old paths
    (`/roadmap`, `/mindset`) redirect in `next.config.ts`. Each curriculum stage is called a
    "course" wherever people read it.
  - `app/(member)/`: Clerk loads only here. Inside it, `(tabs)/` is the signed-in app: the desk
    (`/desk`, the dashboard), the path (`/learn`), `/lessons`, `/practice`, `/learn/glossary`,
    `/signals`, `/paper`, `/journal`, `/tools` and `/me`, with a side nav on a laptop and a bottom bar plus
    Menu on a phone (`components/member/AppNav.tsx`, items in `NAV` in `content/member.ts`; a
    module not built yet shows as "Soon", never a dead link). `(focus)/` is sign-in, sign-up and
    the onboarding chat, and `lesson/[id]` and `practice/round` run full screen.
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
  - Interaction lives in _widgets_: registered once in `components/lesson/widgets/index.tsx`,
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
  - The lesson page builds the beats on the server and passes them to the player as data, and
    widgets load lazily (`components/lesson/widgets/index.tsx`), so a phone downloads one
    lesson, not forty.
  - Progress is `lesson_completed` events (`/api/progress` returns them with times and scores),
    mirrored on the phone as a log (`lib/client/progress.ts`). XP, levels, the streak, the daily
    goal and badges are derived from that log by `lib/progress/habit.ts` (pure, checked in
    `scripts/check-progress.ts`), never stored. Honest by rule 9: XP counts learning, never money;
    missing a day costs the streak number and nothing else; nothing counts down or locks.
  - Practise your mistakes: a question answered wrong first time in a lesson joins a spaced
    queue (due now, then after 1, 3 and 7 days, then learned; wrong starts it again). The queue
    is replayed from `question_missed` and `question_reviewed` events by
    `lib/progress/review.ts`, never stored. A question is keyed by its lesson and a hash of its
    prompt, so rewording a question retires its old mistakes rather than mismatching them.
    `/api/questions` builds round questions on the server; `ChoiceQuestion` draws them the same
    way lessons do.
- **Every Jev call goes through `decide()`** (`lib/decisions/gate.ts`): rules first, the
  authored fallback when Jev is off, a breaker, a one-hour cache, a per-person limit, one retry,
  schema-checked answers, and the `decisions` ledger (a hash of the input, never the words). A
  gate is a small pure object (`lib/decisions/reflect.ts`, `ask.ts`, `meaning.ts`): its questions,
  how it reads hedged answers, and its fallback. Learner text goes in `state`, never in
  instructions; the checks prove it. Routes call `decideFor(request, gate, input)`. Words a gate
  can answer with live in `content/coach.ts`. Change a gate's questions → bump its `version` and
  run `pnpm probe:gates`.
- Anything a learner types passes the safety rules (`lib/decisions/safety.ts`): crisis phrases
  show the support card (`components/coach/SupportCard.tsx`) and a hedged crisis answer does too.
  Add phrases people really type, with a check each way in `scripts/check-decisions.ts`.
- A new visitor starts at lesson one: "Start free" goes to `/desk`, which shows the first lesson
  and offers the starting chat as optional. Don't put anything between "Start free" and a lesson.
- **Signals** (`docs/member-app-plan.md` §4): market data comes through `lib/markets` (Kraken
  public bars for crypto and gold; Twelve Data for FX only when `TWELVEDATA_API_KEY` is set),
  prices as integers in each market's smallest unit, closed daily bars only. The engine decides
  on a bar's close and fills at the next open, and `scripts/check-markets.ts` proves no signal
  changes when later bars arrive. The words for every fact live in `content/signals.ts`. When
  data is down, the screen says so; signals are never drawn from made-up prices. "What must
  be true" is `checklistOf()` in the engine: code, not Jev, because every check is a number.
  People follow markets with checkboxes (`lib/client/watchlist.ts`, seeded from onboarding
  through `lib/markets/interests.ts`); markets they don't follow fold away, never vanish.
- The journal (`lib/engines/journal.ts`) and the tools (`lib/engines/tools.ts`) are engines like
  any other.
- **Accounts and sync.** A signed-in person is one learner on every device: the `accounts` table
  links a Clerk user to a learner, and every route asks `learnerOf(db, request)`
  (`lib/learning/account.ts`), never the cookie alone. It falls back to the older rule if the
  table isn't migrated yet, and a sync pull moves a device's guest history into the account.
  The journal and the paper account are **append-only event logs** with unique ids
  (`lib/sync/log.ts`): the device keeps one (`lib/client/sync.ts`), the server keeps one in
  `learning_events` (`lib/sync/store.ts`, `/api/sync`), and syncing keeps every event either
  side has. Nothing is updated in place. `lib/sync/schemas.ts` is the only shape the server
  accepts from a device.
- **The paper account** (`lib/engines/paper.ts`, `/api/paper`, `/paper`): the server is the
  price source and the referee. It fills at the live ask or bid, sizes from risk against its
  own replay of the account, and works out stop and target exits from bars that opened after
  the fill (stop first, gaps fill worse), writing each exit once. A recorded close always wins.
  No leverage; shorts are cash-secured. Closed paper trades appear in the journal. Every paper
  call carries the device's log, so a deployment without a database still works on the
  device. `scripts/check-paper.ts` checks all of it.
- Words shown to people say "device", never "phone": people use any screen. Screens carry
  product and marketing words only: no lines about where things are saved, which server or
  provider answered, or how the system works inside. Truth badges, errors that ask for an
  action, and the legal disclaimer stay. Laptop layouts
  (`lg:`) are designed, not stretched: two columns where there's room, full-width bars in the
  lesson player.
- The glossary is data (`content/glossary.ts`): plain words, no numbers, each term linked to live
  lessons; `scripts/check-lessons.ts` checks it.
- Onboarding questions are data. A new question means: a step, its reader and a Jev option set
  in `lib/onboarding/flow.ts`, its words and chips in `content/onboarding.ts`, and checks in
  `scripts/check-onboarding.ts` using real phrases people type. The chat screen doesn't change.
  Chips are shortcuts, never the only way in: a typed answer is read (then Jev, when it's on),
  an unclear one gets a clarify line with typed examples (the checks prove each example is
  understood), and a second miss skips the question. Nothing ever says "tap one". A question
  with more than one right answer (markets) shows checkboxes and a Done button, never
  one-tap chips, and Jev reads it as one yes/no per option, never a many-way choice. Every
  step's reader is checked against a table of phrases people type (`TYPED` in the checks);
  when the chat misreads someone, their words go there first. What's typed passes
  `crisisRule` before any reading: the support card shows in the chat and the question waits.
- Motion lives in `app/globals.css` (page-in, reveals, menu, chat bubbles, card flips, and the
  game layer: `btn-3d` buttons that sink when pressed, `coin`s, beat slides, pop and shake on
  answers, "+XP" floats, the finish coin's 3D spin, candles drawing in), and every animation
  collapses under reduced motion. Motion never carries meaning alone. CSS 3D is fine anywhere;
  WebGL only in the hero (`components/three/NoiseField.tsx`), which loads three.js after idle
  and only on phones that can afford it. Haptics go through `lib/client/feel.ts`, with an off
  switch on the Me screen. New screens get added to `PAGES` in `scripts/shots.mjs`.
- A new interactive piece is a lesson widget (above): an engine in `lib/engines`, its words in
  `content/`, and checks in `scripts/check-lessons.ts`, including one that proves the money
  balances. The first build's Payday experience and its run-replay pipeline were removed on
  26 Sep 2026 (nothing linked to them); git history has them if a replayable experience returns.
- Never trust a number from the browser: the server recomputes anything it stores (onboarding
  placement, lesson completion) from its own copy of the rules.
- Secrets live in the environment or `.dev.vars`, never in the repo, never pasted in chat.
- Comments explain _why_, in plain words. Words shown to learners live in `content/`, not in
  components.
