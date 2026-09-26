# Sika Lab

Learn to read the market, and practise before it costs you. Charts, technical and fundamental
analysis, and strategies, taught as lessons you play in simulated and historical markets, with an
AI coach that asks before it tells. There's one curated roadmap, and every lesson also stands
alone. For Ghana, then Nigeria and beyond. Nothing in it is real money, and it never gives
signals.

_Sika_ is Twi for money. It's a working name, set in `lib/brand.ts`.

- **The brief since the 26 Sep reset:** the landing page (`app/page.tsx`) and the curriculum
  (`content/curriculum.ts`: 52 lessons, 7 stages)
- **Who else does this, and the GitHub build-vs-fork call:** `docs/research/competitors.md`
- **How it makes money, the community, and an honest review:** `docs/strategy/monetization-and-community.md`
- **Original why and what:** `docs/product-spec.md`
- **How and in what order:** `docs/implementation-plan.md`
- **How it looks:** `docs/design-brief.md`, drawn at `/design`
- **Rules for anyone building here, people or agents:** `CLAUDE.md`

## Run it

```bash
pnpm install
pnpm dev               # http://localhost:5177  (the landing page; the earlier prototype is at /home)
pnpm check             # core, engine and intelligence checks: no network, about a second
pnpm typecheck && pnpm lint
pnpm shots             # with pnpm dev running: every screen at 360/375/390 px, fails on sideways scroll
pnpm walk              # with pnpm dev running: plays the first 3 minutes, checks the numbers
pnpm build
```

Copy `.dev.vars.example` to `.dev.vars`. Every service is optional (`lib/capabilities.ts`): with
none set, the whole Payday month still plays; nothing is saved and the coach speaks its authored
lines.

- **Database:** `DATABASE_URL` to a Neon project, or to any local Postgres, then `pnpm db:migrate`.
- **Accounts:** `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from a Clerk application. Without
  them, sign-in pages say accounts are coming and everyone learns as a guest on their device.
- **AI:** `OPENROUTER_API_KEY`, and `OPENROUTER_HAS_CREDIT=true` once the account has prepaid
  credit. Then `pnpm probe:openrouter` should show one Jev decision and one coach turn.

## Deploy

**Live: https://trading-agents.bishoptewogbade.workers.dev**

The repository is connected to Cloudflare Workers Builds (Workers & Pages › trading-agents), so
**every push to `claude/financial-learning-platform-spec-dwjl4e` deploys itself**. The Worker's
name, its workers.dev URL and `SITE_URL` are pinned in `vite.config.ts`, so a deploy can't turn
the URL off or land on a different Worker.

Runtime secrets go in the dashboard, where they survive every deploy (Settings › Variables and
Secrets, type **Secret**):

- `DATABASE_URL`: the Neon pooled connection string. Until it's set, the site works and saves
  nothing (`/api/runs` answers 204). Run `pnpm db:migrate` against it once.
- `OPENROUTER_API_KEY`, and `OPENROUTER_HAS_CREDIT=true` once the account has prepaid credit.
- `CLERK_PUBLISHABLE_KEY` (a plain variable is fine, it's public) and `CLERK_SECRET_KEY`
  (Secret). In Clerk, add the site's URL to the allowed origins.

Other ways to deploy the same Worker, if Workers Builds is ever disconnected:

- **From the PC** where `wrangler login` holds the account (how Aksen Labs and Kanea deploy):
  `pnpm run deploy`, then `pnpm secrets --site https://trading-agents.bishoptewogbade.workers.dev`.
  Use `pnpm run deploy`, not `pnpm deploy`, which is a built-in pnpm command.
- **From GitHub Actions**: Actions › Deploy › Run workflow, with `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` in the repository's secrets. Manual only, so it never races Workers
  Builds.

**A preview without a deploy.** `pnpm preview:build` turns the first 3 minutes into one
self-contained HTML file (`dist-preview/sika-lab-payday.html`): the same engine and screens,
running in the browser alone, saving nothing.

## How it is built

Five layers; each talks only to the one below (plan §3).

| Layer        | Where                                                  | Holds                                                                                                                                                               |
| ------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core         | `lib/core`, `lib/engines` (Phase 1), `lib/experiences` | Money as integers in four currencies, phone numbers for GH/NG/KE, seeded randomness, the simulations' maths. Pure TypeScript; `pnpm check` runs it under plain Node |
| Decisions    | `lib/decisions` (Phase 2)                              | Jev's typed questions through OpenRouter's Decisions API, and the hedge-band readers                                                                                |
| Intelligence | `lib/intelligence` (Phase 2)                           | The coach: authored lines first, then cheap models, with guards on every number                                                                                     |
| Services     | `db/`, `lib/payments`, `lib/whatsapp` (later phases)   | The only code that touches Neon, Paystack or Meta                                                                                                                   |
| Surfaces     | `app/`, `components/`                                  | Screens. Words live in `content/`, not in components                                                                                                                |

Stack: vinext (the Next.js API on Vite) on Cloudflare Workers, React 19, Tailwind 4, zod. Neon +
Drizzle, OpenRouter, Paystack and the WhatsApp Cloud API arrive in the phases that need them.

## Where things stand (26 Sep 2026, later still)

**Stage 5 of the roadmap: fundamental analysis, 9 lessons. 40 lessons you play in all.**

- **The lessons:** what moves prices (only the surprise), central banks and rates, inflation and
  your currency, reading an income statement, valuation and the value trap, the economic
  calendar, commodities and African currencies, the carry trade, and fundamentals with
  technicals.
- **Real figures where we have them.** Ghana's 2022 comes from the Bank of Ghana's December 2022
  statistical bulletin: monthly inflation, the policy rate, 91-day bill rates and the cedi.
  Nigeria's 2023 inflation comes from the NBS, and the naira's official rate from FMDQ data.
  The inflation lesson (f3) plays those years month by month and names its sources on screen.
  Everything else is a labelled model: f7 and f9 were planned as "historical" but need market
  price history we don't have licensed, so they're simulations and say so.
- **New engines:** `lib/engines/macro.ts` (news surprises, policy effects on savings, loans,
  bonds and shares, real returns, dollar flows, the carry trade, a rate-decision day with gaps
  and wide spreads, news-then-pullback entries) and `lib/engines/company.ts` (income statement,
  P/E, dividend yield, holding a share for five years).
- **Every lesson now shows its truth badge** (simulation, historical data, educational) in the
  player's header, as rule 7 asks.
- **9 new widgets**, 40 in all. `pnpm check` runs 123 checks, including that the published
  figures reproduce what the sources reported (the cedi's 30.0% fall, the naira's 49%).
  `pnpm walk:lessons` plays all 40 lessons; CI checks all 40 completions were saved.

### Earlier: stage 4

Technical analysis, 10 lessons, 31 in all at the time.

- **The lessons:** trendlines and channels, moving averages, RSI, MACD built from its parts,
  Bollinger Bands and ATR stops, candlestick patterns, chart patterns (the double top), Fibonacci,
  several timeframes, and divergence.
- **Honest tests.** Where a tool is famous for predicting things, the lesson counts: patterns
  against "any candle at all", Fibonacci levels against made-up ones, both on simulated charts
  with no edge built in. They land on the baseline, and the lesson says why that matters. Pattern
  and divergence lessons play both endings of the same chart. Nothing claims real history yet: we
  have no licensed data, so t6, t7 and t10 are now marked simulation.
- **New engines:** `lib/engines/indicators.ts` (SMA, EMA, RSI, MACD, Bollinger, ATR, crossovers),
  matched value for value against the trading-signals library in `pnpm check`; and
  `lib/engines/ta.ts` (the built charts and the tests), with each chart's shape proven over
  hundreds of seeds.
- **The chart** now draws indicator lines, lines through two points, and an indicator pane (RSI,
  MACD) under the price.
- **10 new widgets**, 31 in all. `pnpm check` runs 113 checks; `pnpm walk:lessons` plays all 31
  lessons and CI checks all 31 completions were saved.

### Earlier that night

**The lesson player, and stages 1–3 of the roadmap: 21 lessons you play.**

- **The player** (`/lesson/<id>`) steps through each lesson's beats: see it, touch it, predict,
  why, check. Continue waits until you've done the thing. The finish screen shows your takeaways
  and the next lesson.
- **Progress** is saved as events, mirrored on the phone, and shown on the roadmap (ticks,
  "3 of 8 done") and the desk ("continue where you left off").
- **The stages:**
  - Stage 1, how markets work: noise and signal, the order book, the spread, order types, four
    markets, IPO 101, leverage, who makes money from you.
  - Stage 2, reading charts: line, bar and candle charts, anatomy, timeframes, trends from swing
    points, support and resistance, trend vs range, volume and breakouts.
  - Stage 3, risk first: stops, position size, R-multiples, drawdown, leverage revisited,
    expectancy over 200 trades.
- **21 widgets**, 14 of them new, each backed by an engine: `lib/engines/market.ts` (order book,
  spread, order types, costs), `lib/engines/candles.ts` (walks, timeframes, swings, efficiency,
  breakouts) and `lib/engines/trades.ts` (R, expectancy, equity curves, recovery).
- **Checks:** `pnpm check` runs 101 of them. `pnpm walk:lessons` plays every lesson in a browser;
  CI runs it and checks all 21 completions were saved.

### Earlier that evening

**The site, accounts and onboarding.**

- **Marketing pages:** `/` (3D noise-vs-signal hero, an open-ended "what do you want to
  understand?" box, the chart lesson, Risk Lab), `/roadmap`, `/mindset`, `/ipo` (the Dangote
  offer, explained with a calculator), `/community` (the Floor, with a founding-circle list) and
  `/pricing`. There's a responsive nav with a full-screen phone menu, and an announcement bar that
  follows the IPO's own dates.
- **Accounts:** `/sign-in` and `/sign-up` through Clerk, in our colours, with a guest mode when
  keys are absent.
- **Onboarding:** `/onboarding` is a chat with Sika, the coach. Answers can be typed in plain
  words or tapped, and are read by `lib/onboarding/flow.ts`, with Jev as the fallback reader.
  Onboarding places you on the roadmap. `/desk` shows where you start and your first three
  lessons. The server stores the profile and recomputes the placement itself.
- **New engines, all checked:**
  - `lib/engines/ipo.ts`: applications, allotment, listing moves, company value, P/E;
  - `lib/engines/noise.ts`: moving averages and direction changes;
  - `compound()` in `lib/engines/risk.ts`.
- **Checks:** `pnpm check` runs 80 of them. `pnpm walk:onboarding` chats through onboarding to
  the desk in a browser; CI runs it against Postgres and checks the profile was saved.

### Earlier the same day

**Reset.** The first build looked like a budgeting app. The product is now trading and
investing education, and the landing page is the brief. Two lessons are playable on it, each
backed by a pure, seeded engine with checks over thousands of seeds:

- **Support, candles and stops** (`lib/engines/chart.ts`). Step through candles, find support,
  then plan the trade and watch it meet the market. There are two endings: the tight stop gets
  shaken out when support holds, and no stop is the worst loss when it breaks.
- **Risk Lab: leverage** (`lib/engines/risk.ts`). $100 at 1–50×. The market ends at −3%, but
  the path dips further, and at 25× the dip, not the ending, closes you out.

Next is the lesson player: full charts with lightweight-charts, and stages 1–3 of the roadmap
with progress saved.

### Before the reset (25 Sep 2026)

**Phase 0, foundations: done.** The stack, the pure core (money in four currencies, phones for
Ghana/Nigeria/Kenya, seeded randomness), the design brief and `/design`, the shell with five tabs.

**Phase 1, the first 3 minutes: built, pilot not yet run.**

- `/play/payday`: choose a country, split a month's income across rent, family, savings, a
  friend's "forex guy" and spending; guess how long the savings would last; watch the month
  happen (the phone breaks mid-month); see what the choices did, with an authored coach line;
  replay the same month with one change, side by side; then see what "doubles every 30 days"
  really means. Ghana, Nigeria (a yearly-rent fund) and Kenya, with illustrative amounts awaiting
  a local reader.
- `lib/engines/payday.ts`: the month's rules, 16 checks including 2,000 random months that must
  each balance to the pesewa. The first month uses the fixed seed "pilot" so every pilot learner
  lives the same month.
- Runs and events are saved when a database is configured: the server replays every run through
  its own engine before storing it, and refuses runs that don't replay.
- `pnpm walk` plays it all in a browser and CI does the same against a real Postgres on every
  push.

**Phase 2, the coach: groundwork built, waiting on the key.** The Jev client and hedge-band
readers, the OpenRouter JSON client with pinned per-job model lists, and the numeric guard that
rejects any number the engine didn't produce, all checked against a mocked OpenRouter.

**Waiting on:**

1. `DATABASE_URL` as a Worker secret, so pilot runs are saved.
2. `OPENROUTER_API_KEY` (with prepaid credit) for the coach.
3. The Phase 1 pilot: 15–20 people, on their own phones, watched in person.
4. A local reader for each country's amounts and words (`content/scenarios/payday.ts`).
5. The decisions in plan §18: name, Paystack business, WhatsApp number, voice languages.
