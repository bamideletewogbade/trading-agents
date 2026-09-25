# Implementation Plan

**The financial intelligence gym: how we build it, in what order, and what we borrow.**

Written 25 September 2026. Companion to `docs/product-spec.md` (the why and what). This file is
the how. Where the two disagree about the product, the spec wins; where they disagree about
engineering, this file wins until it is updated.

Built on what already works in our recent projects:

- **Kanea Studio** (24 Sep 2026): the stack, the layering, Jev gates with a hedge band, Gemini
  voice through OpenRouter, and Paystack's direct Charge API for mobile money.
- **Learn with Bishop** (20–23 Sep 2026): Jev as a grader, event-log progression,
  entitlements, the Paystack mode/key check.
- **Aksen Labs** (10 Sep 2026): OpenRouter routing profiles (pinned vs `openrouter/auto`),
  mocked-transport routing tests, the "AI prepares, a person decides" rule enforced in code.

---

## 0. The plan on one screen

| Decision | Choice | Why |
| --- | --- | --- |
| Stack | vinext (Next.js API on Vite) on Cloudflare Workers, React 19, Tailwind 4, `motion`, three.js (lazy), zod, Drizzle + Neon, R2, Queues | The Kanea stack. Proven last week, cheap, fast in Accra and Lagos |
| Where maths lives | Pure TypeScript **engines**, one per simulation, run in the browser *and* on the server *and* behind WhatsApp | Spec §38: AI explains, code calculates. One engine, three surfaces |
| How AI makes UI | The coach returns a typed **Compose** directive naming a registered experience plus config. Never markup | Spec §9, §37 |
| Decisions | **Jev** via OpenRouter's Decisions API for every yes/no, one-of and score: assessment, routing, safety, hint choice | Calibrated, about $0.00004 a call, cannot be prompt-injected into prose |
| Prose | OpenRouter chat, pinned models per **profile**, strict JSON, and a guard that rejects any number the engine did not produce | Short Socratic turns, cheap, checkable |
| Money | **Paystack Charge API, in-page** (the Kanea way): a MoMo PIN prompt on the learner's phone, no redirect. Sold as **passes**, not auto-renewing subscriptions | MoMo has no silent recurring debit. Passes are honest and fit how people buy data bundles |
| WhatsApp | Phone number is the identity **from day one**. Zero-API sharing in Phase 1. The Cloud API "front desk" (login, daily challenge, pay in chat) arrives with payments in Phase 5. WhatsApp-native learning in Phase 6 | Cheap to prepare for, expensive to build early. Meta's AI policy and per-message pricing shape it |
| First proof | The **first 3 minutes** ship in Phase 1 **with no AI at all**, and are tested on 15–20 real people | If the simulation isn't magic without the coach, the coach won't save it |

| Phase | Builds | Exit (the bar to move on) |
| --- | --- | --- |
| 0 | Repo, design brief, shell, core money/phone/RNG, capabilities | Shell live at 375px, design brief approved, `pnpm check` green |
| 1 | Experience registry, **Payday** life sim, What-If replay, share cards | 15–20 real people: ≥ 60% ask for "another one" or a What-If unprompted |
| 2 | The coach: Jev gates, OpenRouter turns, voice, cost ledger, probes | Probe sets ≥ 95% right outside the hedge band; cost per learning event measured |
| 3 | Mastery, practice, daily challenge, **Risk Lab** and the one 3D moment | D7 retention baseline on 100+ learners; transfer detected |
| 4 | 16 lessons across Money, Risk, Markets; authoring pipeline | Every lesson passes the spec §62 checklist and a local reviewer |
| 5 | Paystack passes (Ghana MoMo), gates, price test, **WhatsApp front desk** | First 50 paying learners who aren't friends; idempotent fulfilment proven |
| 6 | WhatsApp-native learning, Scam Radar, voice explain-back, M-Pesa and Nigerian rails | ≥ 30% of weekly learning events start in or return through WhatsApp |
| 7 | Business Lab, Decision Journal, Family, sponsor seats | Driven by what Phases 1–6 teach us |

This follows spec §97's order: shell, design, lesson framework, one simulation, AI tutoring,
progress, more simulations, lessons, personalization, then monetization.

---

## 1. What we are really building

Three bets, in order of how much of the company rides on them:

1. **Learning physics.** A library of deterministic, seeded, replayable simulations with African
   money inside them. This is the moat (spec §94–95). Anyone can call the same LLM. Nobody else
   has a mobile-money-agent float model or a year of a Kumasi nurse's paydays that replays from
   any decision.
2. **A learner model that knows what you can *do*.** Mastery levels are earned by evidence
   (predict, explain, apply, transfer, retain), not by lessons opened.
3. **A coach that asks better questions than it answers.** The cheap part. Most of it is
   authored; Jev picks the line; a model writes only when the learner goes somewhere we didn't
   write for.

What we deliberately do **not** build, now or maybe ever:

- No live trading, broker links, signals, or "today's setup". No live market data in the MVP.
- No free-form AI-generated UI, CSS, or charts.
- No general-purpose chatbot, on the web or on WhatsApp.
- No 3D beyond one signature moment in the MVP.
- No auto-renewing charges on mobile money.

---

## 2. Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | **vinext** (Next.js App Router API on Vite) on **Cloudflare Workers** | Kanea's setup. Use Workers Paid: the free plan's 10 ms CPU limit is too tight |
| UI | React 19, Tailwind 4, `motion`, three.js loaded last and only on capable devices | Kanea's gating: skip on reduced-motion, Save-Data, or `deviceMemory < 3` |
| Validation | zod 4 at every boundary: model output, webhooks, forms, engine configs | |
| Database | **Neon** Postgres over the serverless HTTP driver, **Drizzle** | No transactions over HTTP, so anything that must be atomic is **one SQL statement** (Kanea's fulfil pattern) |
| Files | **R2**: share cards, cached TTS audio, report images | |
| Async | **Cloudflare Queues** (WhatsApp inbound, weekly analyses) and **Cron Triggers** (daily challenge, pass-expiry nudges) | New for us. Keeps webhooks fast |
| Share images | `next/og`, or Satori directly if vinext lacks it | Status-sized 9:16 and square |
| AI | **OpenRouter**: Decisions API (Jev), chat completions, audio in, TTS out | One key, one bill, vendor-neutral (spec §35) |
| Payments | **Paystack Charge API**, direct | See §9 |
| Messaging | **WhatsApp Cloud API**, Meta direct (no BSP markup) | See §10 |
| Quality | `oxlint`, `oxfmt`, `tsc --noEmit`, `node --experimental-strip-types scripts/check-*.ts`, Playwright at 375px | Kanea/Aksen pattern: pure checks with no network |
| Secrets | `.dev.vars` locally; `pnpm secrets` pushes an allowlist over stdin and prints lengths only | Ported from Kanea |

**Performance budget.** First interactive simulation under about 200 KB of compressed JS on a
mid-range Android over 3G. Engines and authored content for the current lesson are cached by a
service worker. The learner's actions go to an IndexedDB outbox and sync when the network returns,
so a dropped connection mid-simulation loses nothing. The coach needs the network; the simulation
never does.

---

## 3. Architecture: five layers, each talks only to the one below

```
┌────────────────────────────────────────────────────────────────────────┐
│ SURFACES     app/ (web), lib/whatsapp/render (chat), share cards       │
│              components/experiences/<key>/View.tsx                     │
├────────────────────────────────────────────────────────────────────────┤
│ SERVICES     db/, lib/learning (events, mastery), lib/payments,        │
│              lib/whatsapp (send/receive), storage. The only code that  │
│              touches Neon, R2, Paystack or Meta                        │
├────────────────────────────────────────────────────────────────────────┤
│ INTELLIGENCE lib/intelligence: coach, compose, context, ladder,        │
│              profiles, openrouter client. The only code that writes    │
│              prose with a model                                        │
├────────────────────────────────────────────────────────────────────────┤
│ DECISIONS    lib/decisions: Jev client, hedge-band readers, every gate │
│              (assess, route, safety, hint, scam, content). Pure apart  │
│              from one HTTP client                                      │
├────────────────────────────────────────────────────────────────────────┤
│ CORE         lib/core (money, phone, country, ids, rng)                │
│              lib/engines (every simulation's maths)                    │
│              lib/experiences (the registry)                            │
│              lib/catalog (passes, prices)                              │
│              Pure TypeScript. No I/O, no framework. `pnpm check` runs  │
│              it under plain Node                                       │
└────────────────────────────────────────────────────────────────────────┘
```

Rules that keep the layers honest:

- **Only `lib/decisions` and `lib/intelligence` hold the OpenRouter key.** Everything above calls
  `decide()` or `coach()` and does not know whether the answer was authored, cached, Jev, or a
  model.
- **Only `lib/engines` produces a number a learner sees.** Surfaces format numbers; they never
  compute them. The coach may repeat numbers; it may not originate them (see §6.4).
- **`lib/capabilities.ts` answers "can this deployment do X?"** No database: the first 3 minutes
  still work, anonymously. No OpenRouter credit: the coach uses authored lines only. No Paystack:
  Pro is shown as "coming soon". No WhatsApp: the web links out with `wa.me` instead.
  `OPENROUTER_HAS_CREDIT` is set by a person, because the Decisions API answers 402 on a trial
  balance (found on the Bishop platform, 20 Sep 2026).
- **Progress is an event log, not columns.** `learning_events` is append-only; mastery, streaks
  and the intelligence map are derived. Gamification rules will change weekly; migrations
  shouldn't.
- **Words live in `content/`, not in components.** That's where localization happens.

---

## 4. The Experience Registry

Every simulation, quiz, card and 3D world is a registered **experience**. The AI (and every
lesson) can only compose experiences that exist in the registry.

### 4.1 The contract

```ts
// lib/experiences/types.ts — pure, no React
export type Truth = 'simulation' | 'hypothetical' | 'historical' | 'educational';
export type WhatsAppMode = 'native' | 'flow' | 'handoff' | 'none';

export type Experience<Config, State, Action, Outcome> = {
  key: ExperienceKey;                 // 'leverage_lab'
  version: number;                    // bump when the maths change; old runs replay on their own version
  purpose: string;
  truth: Truth;                       // drawn as a badge on every surface; the registry refuses an experience without one
  objectives: SkillId[];
  difficulty: { min: 1 | 2 | 3 | 4 | 5; max: 1 | 2 | 3 | 4 | 5 };
  config: z.ZodType<Config>;          // everything a lesson or the coach may set, with bounds
  actions: z.ZodType<Action>;         // everything a learner may do
  init(config: Config, seed: number): State;
  step(state: State, action: Action): { state: State; outcomes: Outcome[] };   // deterministic
  summarize(state: State, locale: Locale): Facts;
  whatsapp: WhatsAppMode;
};

/** The one description of "where things stand", in numbers and short sentences. */
export type Facts = {
  numbers: Record<string, { value: number; unit: Unit; label: string }>;
  lines: string[];                    // "Your account fell 60%: from $500 to $200."
  pivotal: boolean;                   // the engine says this moment is worth a coach question
};
```

`summarize()` is the most reused function in the product. It feeds:

1. **the coach**, as the only numbers it may speak;
2. **the screen reader**, as the text alternative to the chart (spec §83);
3. **WhatsApp**, as the message body;
4. **share cards**, as the headline.

Accessibility and WhatsApp end up as the same work, done once.

The React view is registered separately (`components/experiences/<key>/View.tsx`, lazy-loaded by
key) and renders in two sizes: `card` (inline in the coach conversation) and `full` (the Lab).

### 4.2 Compose: how the coach summons an experience

```ts
// lib/intelligence/compose.ts
export const Compose = z.discriminatedUnion('experience', [
  z.object({ experience: z.literal('leverage_lab'), config: leverageLab.config }),
  z.object({ experience: z.literal('position_size'), config: positionSize.config }),
  z.object({ experience: z.literal('budget_split'), config: budgetSplit.config }),
  // …one entry per registered experience, generated from the registry
]);

export const CoachTurn = z.object({
  say: z.string().max(400),
  ask: z.string().max(200).nullable(),          // the Socratic question, if any
  compose: Compose.nullable(),                   // summon an experience
  whatIf: z.object({ step: z.number().int(), change: z.string() }).nullable(),
});
```

The model sees the JSON schema (strict `response_format`). Its output is parsed with zod. An
invalid config (leverage 500×, a negative salary) is refused by the experience's own bounds, and
the turn falls back to an authored line. The model chooses; the registry decides what's allowed.

### 4.3 Event-sourced runs make "What if?" nearly free

A run is `{ experience, version, config, seed, actions[] }`. State is
`actions.reduce(step, init(config, seed))`. Consequences:

- **What-If (spec §68)** is replaying the same actions with one changed at step *k*. No model,
  no server. Both timelines are shown side by side.
- **Share a run**: the seed and config go in the link. "Play my year" gives a friend the same
  events so they can make different choices.
- **Anti-tamper**: the server replays the actions to verify an outcome before it counts toward a
  leaderboard or certificate (spec §52).
- **Old runs stay true**: a run replays on the engine `version` it was played on.

Randomness comes from a seeded PRNG in `lib/core/rng.ts` (for example `sfc32`). Never
`Math.random()` in an engine; `pnpm check` greps for it.

### 4.4 Numbers are integers

Money is integer **minor units** per currency (pesewas, kobo, cents), carried with its currency
code: Kanea's `money.ts`, generalized. Percentages and rates are **basis points**. AI costs are
**micro-dollars**. No float crosses a boundary. The engine rounds at documented points, and the
check suite asserts them (GH₵ 0.10 + GH₵ 0.20 = GH₵ 0.30, every time).

---

## 5. Learning physics: the engines

### 5.1 The MVP catalogue (8 simulations + 6 wrappers)

| Key | What it simulates | Truth | WhatsApp | Lessons |
| --- | --- | --- | --- | --- |
| `budget_split` | Allocate income into buckets; shocks test the plan | hypothetical | flow | 1, 2, 5 |
| `life_sim` | **Signature 1.** A month to a year of a fictional life, event by event | simulation | native (text month) + handoff | 1, 2 |
| `compounding` | Growth, contributions, fees, loan-app cost, "doubling" claims | hypothetical | native | 4, 11, 16 |
| `inflation_fx` | Purchasing power and FX over time; hypothetical or real published series | historical / hypothetical | native + image card | 3, 15 |
| `leverage_lab` | Capital × leverage → exposure, P/L, margin, liquidation | simulation | native (3 buttons) | 7 |
| `position_size` | Account, risk %, entry, stop → size and risk readout | simulation | flow | 8 |
| `risk_lab` | **Signature 2.** "100 versions of you": Monte Carlo of a strategy | simulation | handoff + image card | 9, 10, 12 |
| `price_path` | Seeded price paths with volatility regimes; predict and calibrate | simulation | handoff | 13, 14 |

Wrappers used around any engine: `predict` (number or choice), `explain_back` (text or voice),
`scenario_card`, `quiz`, `reflection`, `progress_card`. All `native` on WhatsApp.

Example of how small an engine is, and why it's easy to trust:

```ts
// lib/engines/leverage.ts — pure
export function applyMove(p: { capital: Minor; leverage: number }, moveBp: number) {
  const exposure = p.capital * p.leverage;                       // $100 × 20 = $2,000
  const pnl = Math.trunc((exposure * moveBp) / 10_000);          // −300 bp → −$60
  const equity = p.capital + pnl;                                // $40
  return { exposure, pnl, equity, liquidated: equity <= maintenance(p), changeBp: pnlToBp(pnl, p.capital) };
}
// scripts/check-engines.ts asserts the spec's own examples:
//   $500 at 20× ($10,000), −3% → −$300, equity $200 (−60%)
//   $100 at 50×, −3% → liquidated
```

### 5.2 Signature 1: the Life Sim ("Payday")

The spec's iconic demo (§78). The design:

- **Personas** per country, fictional and reviewed by a local reader. For example: *Efua, 24,
  nurse in Kumasi, paid monthly, sends money home.* *Tunde, 27, designer in Lagos, paid in
  dollars by foreign clients.* *Wanjiku, 31, runs an M-Pesa agent shop in Nairobi* (Kenya
  later). Amounts are illustrative, dated, and live in `content/personas/`.
- **Event deck** (data, weighted per persona): salary lands, rent due, family request, susu
  payout, phone screen cracks, hospital bill, school fees, wedding contribution, fuel price
  rise, inflation jump, side-hustle offer, a loan app's "instant" offer, **"wrong transfer,
  please send it back"** SMS, and a friend's "forex guy who doubles money in 30 days".
- **Decisions**: 2–4 options per event, sometimes a slider. Every consequence is computed.
- **State**: cash, savings by place (MoMo wallet, bank, susu), debt by lender (friend, loan app,
  bank) with its real cost, obligations honoured, and months of cover.
- **Pace**: a year in about five minutes. One or two events a month.
- **Coach moments**: at most two or three per run, only where the engine marks `pivotal`.
- **The ending**: "Here's how your decisions shaped your financial position." A few
  deterministic tags describe the *pattern*, not the person ("covered family first", "borrowed
  to absorb shocks"). Then one tap: *replay from month 3 with one thing changed.*

The first 3 minutes (§8) are one month of this engine.

### 5.3 Signature 2: Risk Lab, "100 versions of you"

- Controls: account size, risk per trade, win rate, reward-to-risk, leverage, number of trades,
  volatility.
- Output: 100 seeded equity curves drawn at once. Ruined accounts fall, grey out and get a
  "ruined" label: never colour alone (spec §14, §83). Readouts: share still standing, median
  ending, worst drawdown, "a 50% loss needs a 100% gain to recover".
- It runs in a Web Worker: 100 × 200 trades is trivial on a cheap phone.
- **The one MVP 3D moment: the Survival Valley.** The same 100 curves extruded into a landscape
  where ruined paths drop off a ledge. Spatial because survival *is* spatial here (spec §17).
  Lazy-loaded, capability-gated, and the 2D view shows identical data.
- Teaching beats it enables: same strategy at 2% vs 10% risk per trade; a 60% win rate that
  still blows up at 20×; why doubling down after a loss (martingale) empties accounts.

### 5.4 Signature 3 (Phase 7): Business Lab

Start with the **mobile money agent** (spec §24): float, cash on hand, commissions, rent, fraud
attempts, network downtime. It is uniquely ours, locally obvious, and teaches liquidity better
than any definition. Then the retail shop and the chop bar.

---

## 6. Intelligence: OpenRouter and Jev

### 6.1 The ladder (spec §42, made concrete)

Every learner input climbs only as far as it has to:

| Rung | What answers | Typical use | Cost |
| --- | --- | --- | --- |
| 0 | **Engine** | Any number, any consequence | $0 |
| 1 | **Authored line** | Hints, feedback and explanations written per lesson and misconception | $0 |
| 2 | **Cache** | A generated turn already seen for the same (experience, action class, misconception, level, country) | $0 |
| 3 | **Jev** | Pick the authored hint, assess an answer, route intent, safety | ~$0.00004 |
| 4 | **Small model** (`coach_fast`) | A Socratic turn the authors didn't anticipate | fractions of a cent |
| 5 | **Medium model** (`coach_deep`, `analyst`) | Learner still stuck after two turns; weekly analyses (async) | cents |
| 6 | **Frontier** | Admin content drafting only, never learner-facing live | cents |

**Most of the tutor is authored, not generated.** Content writers produce hints and explanations
per misconception (Appendix B). Jev picks which one fits (`hint.pick`, a `choice` over hint IDs).
A model writes only when the learner goes off the map, and those turns are cached, reviewed, and
promoted into authored lines. The coach gets cheaper and better the longer it runs.

### 6.2 Jev: every decision, with a hedge band that asks a question

Ported from Kanea (`lib/decisions/jev.ts`, `read.ts`):
`POST https://openrouter.ai/api/alpha/decisions` (the `v1` path 404s), model pinned to
`typesafe/jev-1.13`, questions typed as `noul` (probability), `choice`, or `score`. The hedge band
is **0.35–0.65**, the same everywhere.

The twist for a learning product: **in Kanea, a hedged answer goes to a person. Here, the person
is usually the learner.** A hedged assessment becomes a better question ("Say more about why the
3% became 60%?"), never a guess. A hedged *safety* answer takes the safer, authored path. A
hedged *content* answer goes to a human reviewer.

| Gate | When | Questions | Sure → | Hedged → |
| --- | --- | --- | --- | --- |
| `route` + `safety.in` (one call) | Every free-text or voice message to the coach | `intent` choice: explain · show_me · what_if · check_answer · my_progress · account_or_pay · wants_trade_signal · scam_check · distress · off_topic · other_or_unclear. Plus `acute_distress`, `asks_for_signal` as noul | A deterministic handler, or the next rung | Two buttons: "Did you mean A or B?" |
| `assess.explain` | Explain-back and reflection steps | `explains_mechanism`, `correct_direction`, `own_example` (a sign of transfer), and `misconception` as a choice over the lesson's list + `none` + `other_or_unclear` | Mastery evidence; misconception becomes a signal | One follow-up question, reassess once, then record as hedged: no credit, no penalty |
| `assess.predict` | A prediction with reasoning. The number itself is checked by the engine | `reasoning_matches_mechanism`, `misconception` | As above | As above |
| `hint.pick` | Learner is stuck, or asks for help | `choice` over the lesson's authored hint IDs | Show that hint | Show the most general hint |
| `safety.out` | Every generated coach turn, before display | `personal_advice` (tells this person to buy, sell or borrow), `certainty_about_prices`, `hype_tone`, `off_curriculum` | Show it | Replace with an authored line; log it |
| `scam` | A forwarded message or a described "investment" | `fixed_high_return`, `recruitment_based`, `urgency_pressure`, `asks_for_pin_or_otp`, `impersonation`. The engine computes the implied return from the numbers | Red-flags card and the maths | "I can't tell from this. Four questions to ask before you send anything." Never "this is safe" |
| `content.review` | Every AI-drafted lesson | `uncalculated_numbers`, `country_mismatch`, `names_real_brand`, `promises_outcome` | Always to a person. Content never auto-publishes (spec §61) | Same, with the flag |

Two practices carried over from Kanea's measured findings:

- **Ask related questions in one call.** Kanea found answers improve when a gate's questions
  arrive together, and it's one round trip instead of five.
- **Words are tuned with probes, not guesses.** Every gate has a `pnpm probe:<gate>` script that
  runs a labelled set three times and reports misses, false alarms and hedge rate (Kanea's
  `probe:intake` went 30/30 after its questions were reworded). Tune wording in the Jev playground from the
  Bishop repo before shipping.

### 6.3 OpenRouter chat: profiles, not models

`lib/intelligence/profiles.ts` names *jobs*. Models are configuration, pinned, each with a
fallback list passed as `models` so OpenRouter fails over.

| Profile | Job | Policy | Output |
| --- | --- | --- | --- |
| `coach_fast` | A Socratic turn inside an experience | Pinned fast model, 1–2 fallbacks, `reasoning: minimal`, ≤ 400 tokens out | Strict JSON `CoachTurn` |
| `coach_deep` | Escalation: learner stuck after two turns | Pinned stronger model, metered per learner per day | Same |
| `extract` | Pull numbers and claims out of free text (scam forwards, typed What-Ifs) | Cheap model, strict JSON | Typed object |
| `hear` / `speak` | Voice in (Twi, Pidgin, Yoruba, English), voice out | Ported from Kanea `lib/voice/*` | Transcript + English; WAV |
| `analyst` | Async weekly "your last 30 runs" report | Medium model via a queue job | JSON the report components render |
| `drafting` | Admin lesson drafts | `openrouter/auto` with cost tier and allowed models (the Aksen pattern) | Lesson draft JSON |

Model candidates come from what we've measured: Kanea measured Gemini 3.8 Flash hearing Twi at
5–9% character error for about $0.0015 a voice note, and Aksen's auto-router picked Gemini 3.8
Flash for conversation and GLM for JSON. **Re-measure with probes before pinning**; learner-facing
profiles stay pinned so a silent model update can't change how we teach.

### 6.4 Guards on every generated turn

1. **Numeric provenance guard.** Every number in `say` or `ask` must appear in the run's
   `Facts.numbers`, in the learner's own message, or be a small count (≤ 10). Otherwise the turn
   is rejected and an authored line is used. The rejection rate is our live hallucination metric
   (spec §74).
2. **Schema.** zod-parse `CoachTurn`, including `Compose` bounds.
3. **`safety.out`** (above).
4. **Length and tone.** Hard caps; `hype_tone` from Jev; no emoji rockets (spec §33).

### 6.5 Context assembly (spec §39)

`lib/intelligence/context.ts` builds each turn from at most:

- the lesson objective (two lines);
- the experience's `Facts` (numbers and lines);
- the learner's last action and its outcome;
- up to three **learner signals** for this skill (§7);
- level, country, currency, language register.

Never the whole history. Target under about 1,500 input tokens. Stable system prompts keep
provider-side prompt caching effective.

### 6.6 The spec's agents are mostly functions

| Spec §35 agent | What it is in code | Writes prose? |
| --- | --- | --- |
| Learning | `lib/learning/next.ts`: picks the next item from the skill graph and mastery; deterministic | No |
| Tutor | `coach()`: authored → cache → `hint.pick` → `coach_fast` → `coach_deep` | Sometimes |
| Simulation | Engines, plus a deterministic sampler that makes "same concept, new numbers" transfer challenges within a lesson's declared ranges | No |
| Assessment | Jev `assess.*` gates + engine checks | No |
| Research | Phase 4 scripts that import published inflation and FX series, reviewed by a person | No |
| Behavioral / Progress | Derivations over the event log + the async `analyst` | Weekly |
| Safety | Jev `safety.*` + deterministic rules (no signals, truth badges, no paywall after distress) | No |
| Orchestrator | Jev `route` + the ladder | No |

Only two things ever write prose for a learner: the coach and the weekly analyst.

### 6.7 Cost ledger

Every Jev call goes to `decisions`, every chat or voice call to `ai_calls`, every WhatsApp send to
`wa_outbound`, in micro-dollars. Prefer the cost OpenRouter reports over our own arithmetic
(Kanea's rule: a copied price list goes stale silently). This gives the spec's key metric
directly:

```
cost per demonstrated learning event =
  (Σ ai_calls + Σ decisions + Σ wa_outbound) / count(demonstrated learning events)
```

Rough expectation from Kanea's numbers: a learning session of about five Jev calls and two or
three short model turns costs a fraction of a US cent. **AI is unlikely to be the expensive
part. Payment fees, WhatsApp template fees and acquisition are.** The ledger will tell us which.

---

## 7. The learner model and mastery

**Events** (append-only `learning_events`): `exposed`, `interacted`, `predicted`, `explained`,
`applied`, `transferred`, `retrieved`. Each carries the skill, the run, correctness, whether help
was used, and the Jev score where one exists.

**Mastery per skill** (derived, materialized in `mastery`) follows spec §28:

| Level | Evidence required |
| --- | --- |
| Exposure | Saw it |
| Interaction | Changed a variable and saw the result |
| Understanding | `assess.explain` sure-pass |
| Application | Correct on a new scenario without a hint |
| Transfer | Correct in **two different contexts** (the same skill in FX and in a business, say) |
| Retention | Correct again **≥ 7 days** after the last success |

**Spaced retrieval**: a simple Leitner schedule (1, 3, 7, 21 days). **The daily challenge is drawn
from what's due**, so the daily habit is also the retention engine. On WhatsApp this becomes the
60-second daily message (§10).

**Learner signals, not judgments** (spec §40): `learner_signals` rows such as
`percent_of_percent` for the skill `leverage`, with evidence count and last seen. They **decay**
after successful uses and are visible in a "What the coach remembers" screen where the learner can
delete any of them. Trust as a feature (spec §76.12).

**The financial intelligence map** (spec §87): six domain bars computed from skill mastery.
Shown from week one, so the first thing a returning learner sees is that they are getting better
(spec §71).

---

## 8. The first 3 minutes

The bar the spec sets (§98) and the thing Phase 1 exists to prove. No sign-up, no video, no
course list.

| Time | What happens |
| --- | --- |
| 0:00 | Dark screen, one line: **"Let's test how you think about money."** [Start]. Country guessed from the Workers `cf.country`, confirmed with one tap (🇬🇭 🇳🇬 🇰🇪) |
| 0:10 | "It's payday. GH₵ 3,000 just landed in your MoMo." Three cards slide in: rent of GH₵ 900 due in 10 days; Mum asks for GH₵ 400; Kofi says his "forex guy" doubles money in 30 days |
| 0:20 | Drag GH₵ 100 chips into buckets: Rent · Home · Savings · Kofi's guy · Spend. One thumb |
| 0:45 | **Predict:** "If your income stopped today, how many months could you last?" A slider guess |
| 1:00 | [Play the month]: 20 seconds of motion. Data bundles, transport, the phone screen cracks on day 17 (GH₵ 600) |
| 1:30 | **Consequence**, with icons and labels. The coach: one sentence and one question (authored in Phase 1; Jev-picked or `coach_fast` from Phase 2) |
| 2:00 | **What if?** Change one decision, for example GH₵ 300 to savings instead of Kofi. Both months replay side by side |
| 2:30 | **Kofi's guy, computed:** doubling every 30 days turns GH₵ 300 into over GH₵ 5 billion in two years. "That's why a promise like this is a red flag." |
| 2:50 | **"Want another one?"** [Yes] · [Save my progress on WhatsApp] |

Every amount above is illustrative, lives in `content/`, and is recomputed by the engine. The
GH₵ 5 billion figure is 300 × 2²⁴. Accounts come *after* value, through WhatsApp (§10.4).

---

## 9. Payments: Paystack's direct Charge API (the Kanea way)

Learn with Bishop used the redirect checkout (`/transaction/initialize` → `checkout.paystack.com`
→ callback). Kanea Studio replaced that with the **Charge API, in-page**: the learner picks a
network, their phone buzzes with the network's PIN prompt, and the page notices when they approve.
No redirect, no card form, no leaving the app. **That is the flow we port.**

### 9.1 Why passes, not subscriptions

A MoMo charge needs the customer's PIN each time, so there is no honest silent monthly debit on
mobile money. Instead of fighting that, we sell **passes**: 7, 30, 90 or 365 days of Pro, bought
the way people already buy data bundles.

- A new pass bought during an active one **extends from the current end date**, not from today.
- Three days before expiry: one reminder (on WhatsApp once available). One tap to renew.
- Card users can opt into auto-renew later through Paystack plans. Opt-in, never default.
- This is also the spec's ethics (§43): nothing renews behind anyone's back.

### 9.2 Rails by country

| Country | Currency (minor unit) | Charge API channel | What the learner sees | Status |
| --- | --- | --- | --- | --- |
| Ghana | GHS (pesewas) | `mobile_money`, provider `mtn` · `vod` (Telecel; Paystack still wants `vod`) · `atl` | PIN prompt on the phone; some numbers get an SMS code (`send_otp`) instead | **Launch rail.** Kanea's code ports directly |
| Kenya | KES (cents) | `mobile_money`, provider `mpesa` (STK push), number in +254 form | M-Pesa PIN prompt | Phase 6 |
| Nigeria | NGN (kobo) | `bank_transfer` ("Pay with Transfer": a temporary account number for this payment), `ussd`, or card | An account number and amount with copy buttons and an expiry; confirmed by webhook when the transfer lands | Phase 6. Likely needs a Nigerian Paystack business (see §18) |
| Diaspora gifts | Card | Paystack inline card, international cards enabled | "Give your sister in Kumasi a year of Pro": pay by card abroad, the pass lands on her number | Phase 6 |

### 9.3 The flow and its invariants (ported, not reinvented)

```
[Get Pro · GH₵ X / 30 days]  ← price chosen on the server from the catalog, never sent by the client
      │
      ▼
startPayment(order, phone, provider)          lib/payments/start.ts
  • one pending attempt per order within 90 s (a second tap never sends a second prompt)
  • insert payments row (pending, our unique reference)
  • chargeMobileMoney() → prompt_sent | otp_required | failed(reason in the learner's words)
      │
      ▼
PayPanel polls /api/pay/<ref>/status
  • after 40 s without a webhook, verifyTransaction() asks Paystack directly
      │
      ▼
fulfilPayment()  ← webhook | verify | owner-recorded MoMo, all three roads
  • ONE SQL statement: payment pending→success (amount ≥ expected, currency matches),
    entitlement created or extended, event written from the same statement's output
  • the loser of any race changes nothing
```

Carried over word for word, because each was learned the hard way:

- The webhook signature is **HMAC SHA-512** over the **raw body**, compared in constant time.
- The webhook answers 200 to anything correctly signed, including duplicates, and is *not*
  wrapped in the friendly-error helper: a thrown error must become a 500 so Paystack retries.
- The `/charge` response is a status report, **never a receipt**. Only `charge.success` or a
  verify call grants anything.
- **Mode and key must agree** (from Bishop): refuse to run if `PAYSTACK_MODE=live` with an
  `sk_test_` key, or the reverse.
- Paystack needs an email; MoMo learners rarely have one. Use a deterministic synthetic address
  from the phone number on a domain that receives mail.
- Failure reasons are rewritten for people ("There isn't enough in that MoMo wallet. Top up and
  try again."); the original goes in the row for us.

### 9.4 Catalog as data, with a margin check

`lib/catalog/passes.ts` holds each pass: SKU, days, per-country price in minor units, `status`
(`test` · `launch` · `retired`), and the fee schedule with a *checked-on* date. The order stores a
snapshot of what was sold, so repricing never changes an existing order. `pnpm check` refuses any
price where

```
price − payment fee − expected (AI + WhatsApp) cost per paid learner for the pass length
```

falls under the margin floor. That is Kanea's check (it caught Friday Drop at 69.3% on day one).

### 9.5 Free, Pro, and what we'll test

| Free: genuinely useful (spec §44) | Pro: "a personal financial learning coach" (spec §46) |
| --- | --- |
| The first-3-minutes sim, any time | Unlimited Life Sim, Risk Lab and What-If |
| Daily challenge and streak | All lessons across every world |
| The first two lessons of every world | Unlimited coach (fair-use cap), voice coach |
| Coach: authored hints unlimited, about 10 generated turns a day | Weekly analyst report, deeper personalization |
| Progress and the intelligence map | Survival Valley 3D (one free look first) |

**Launch price hypotheses** (to be tested, not believed): a 7-day pass around GH₵ 10 / ₦ 1,000,
30-day around GH₵ 30 / ₦ 3,000, 365-day around GH₵ 250 / ₦ 25,000. Run a three-arm price test per
country (arm stored on the learner) and measure conversion *and* 30-day retention, not conversion
alone. A "founding member" year pass for the first 200 payers is a good early signal.

**Before Paystack exists (Phase 3):** show the real Pro page with real prices and let people
reserve a founding pass by MoMo to the business number, recorded by the owner. That's the third
road into `fulfilPayment()`, so it's real payment code, not a fake door.

### 9.6 Rules enforced in code

- **The AI never initiates a charge.** Only a deterministic handler, from a button tied to a
  server-issued quote (SKU, amount, currency, 10-minute expiry), can call `startPayment()`.
- **No paywall in a session where Jev flagged distress**, and no upsell to that learner for seven
  days.
- No countdown timers, no "offer ends tonight", no fake scarcity (spec §43).
- Refund: a pass unused within seven days is refunded on request; the owner records it.

---

## 10. WhatsApp: when, how, and within which rules

### 10.1 The constraints that shape the design

| Constraint | Consequence for us |
| --- | --- |
| **Meta has banned general-purpose AI chatbots on the WhatsApp Business Platform since 15 Jan 2026.** Task-specific AI is allowed | Our WhatsApp agent is scoped to *our* curriculum, challenges, progress and passes. `off_topic` gets a polite redirect. This also matches the spec |
| **Per-message pricing** since July 2025, and **Meta changes the rules again on 1 Oct 2026**. Third-party summaries say service replies get 1,000 free a month per number and are then charged, and in-window utility replies lose their free status. **Verify against Meta's rate card before modelling** | Message frugality is a design rule: one rich message beats three chatty ones, and templates only for opted-in dailies and renewals. A delivered template can cost more than the whole AI session behind it |
| Free-form replies only within **24 hours** of the learner's last message; templates outside it | The daily challenge is a template that invites a reply; the reply reopens the window for the session |
| Interactive messages: up to **3 reply buttons**, **lists of up to 10 rows**, CTA URL buttons, and **WhatsApp Flows** (multi-screen forms) | Each experience declares a `whatsapp` mode: `native` (buttons and lists), `flow`, `handoff` (a signed link into the web Lab), or `none` |
| No WhatsApp Pay in Ghana, Nigeria or Kenya | Payments happen through Paystack, triggered from chat (§10.5) |
| Business verification, display-name approval and template review take weeks | **Start the paperwork in Phase 1**, long before the build |
| Group messaging via the API is limited | Don't depend on it; Circles live in the product (§10.6) |

### 10.2 When

| Stage | Phase | What | Why then |
| --- | --- | --- | --- |
| **W0** | 0 (day one) | Phone number (E.164) is the identity. Engines are pure. Every experience declares its `whatsapp` mode and `summarize()` | Costs almost nothing now; rebuilding identity later is expensive |
| **W1** | 1 | **Zero-API WhatsApp:** `wa.me` share links, Status-sized share cards, pilot feedback on a person-run number. **Start Meta business verification** | Learn how sharing spreads with nothing to build |
| **W2** | 5 | **Cloud API front desk:** reverse-OTP login, the 60-second daily challenge (spaced retrieval), streak and progress card, passes bought and renewed in chat | The web loop is proven, payments exist, and D7 retention is measured, so we'll know if WhatsApp moves it |
| **W3** | 6 | **WhatsApp-native learning:** voice explain-back, Scam Radar, Flows mini-sims, weekly report card, Circles | Only once message costs per active learner are measured on W2 |

Don't start W2 until the web first-3-minutes clears its Phase 1 bar and a D7 baseline exists.
WhatsApp is the retention fix; we need a "before" to know it worked.

### 10.3 Architecture

```
Learner on WhatsApp (tap · text · voice note · forwarded message)
        │
Meta Cloud API ──webhook──▶ /api/whatsapp/webhook                    (Worker)
                            • verify X-Hub-Signature-256 over the raw body
                            • dedupe on the message id (wa_inbound, unique)
                            • enqueue, answer 200 immediately
                                   │
                                   ▼
                          Queue consumer                              (Worker)
                            1. button or list payload? → deterministic command
                            2. voice note? → hear (Gemini via OpenRouter) → text
                            3. Jev: route + safety.in, one call
                            4. step the SAME engine the web uses (wa_sessions holds the run)
                            5. render a message spec from Facts (≤ 2 messages)
                            6. send via the Graph API; log category and cost in wa_outbound
```

`lib/whatsapp/render.ts` turns `Facts` plus an experience's allowed actions into a message:
text, up to three buttons, a list, a Flow, or a CTA link into the Lab.

### 10.4 Reverse-OTP login: the learner messages us, not the other way round

1. The web shows **[Continue on WhatsApp]**, which opens
   `wa.me/<our number>?text=LOGIN K7Q2-9F`.
2. The learner taps send. The webhook matches the one-time code (10-minute, single use) to the
   waiting web session and binds it to their number. The web page, polling, signs them in.

No SMS fee, no authentication template, no password. The learner started the conversation, which
opens the 24-hour window and records their opt-in in the same step. It is also how the anonymous
first-3-minutes run gets attached to a real learner.

### 10.5 Paying without leaving the chat

```
Learner:  PRO                      (or taps [Get Pro])
Bot:      [list] 7 days · GH₵ 10   /  30 days · GH₵ 30   /  365 days · GH₵ 250
Learner:  taps "30 days"
Bot:      Pay GH₵ 30 for 30 days of Pro from 024 412 3456 (MTN MoMo)?
          [Pay now]  [Other number]  [Cancel]
Learner:  taps [Pay now]           → deterministic handler → Paystack /charge
          (phone shows the MTN PIN prompt; they approve)
Webhook:  charge.success → fulfilPayment() → one statement
Bot:      Paid. Pro runs until 25 Oct. [Today's challenge]
```

If Paystack answers `send_otp`, the bot asks for the SMS code and submits it. The button payload
carries the server-issued quote ID, so the amount can't be edited and the LLM can't start a
charge. In Ghana the WhatsApp number is very often the MoMo number, which is what makes this feel
like magic.

### 10.6 The WhatsApp experiences

- **Daily 60 seconds.** One due item from spaced retrieval as a scenario with three buttons, an
  instant computed consequence, and the streak. Reply in, window open, and the next one's free.
- **Voice explain-back.** "Explain in a voice note why 20× wiped out the account." Gemini hears
  it (Twi, Pidgin, Yoruba, English), `assess.explain` judges it, and the reply is text with an
  optional short spoken line. Built for people who'd rather talk than type (spec §34).
- **Scam Radar.** *Forward any "investment" message to us.* For example: "Invest GH₵ 500 today,
  receive GH₵ 2,500 in 7 days. Limited slots! Send to 055…" The reply:

  > **SCAM RADAR · EDUCATIONAL**
  > That's 400% in a week. At that rate GH₵ 500 would pass GH₵ 1.5 million in five weeks.
  > Red flags here: a fixed high return, urgency ("limited slots"), and payment to a personal
  > MoMo number.
  > [The 4 questions to ask] [Check another]

  The engine computes the numbers, Jev names the flags, and it never says "this one is safe".
  This is the WhatsApp feature most likely to be forwarded, because it's useful to people who
  aren't learners yet.
- **Flows mini-sims.** `budget_split` and `position_size` as native WhatsApp Flows: sliders
  become steppers, and the result comes back as a message.
- **Weekly report card.** The async analyst's summary as one image and three lines, plus a link.
- **Circles** (modelled on the susu): up to eight friends get the same seeded weekly challenge.
  The board ranks **decision quality** computed by the engine, never money "made" (spec §57).
  Invites go out as `wa.me` links; the board lives on the web.
- **Status cards.** Every finished lesson offers a 9:16 card: *"I learned why 20× leverage wiped
  out 83 of my 100 traders"*, with the number taken from the learner's own run. Never returns,
  never screenshots of gains.

### 10.7 Message budget rules

- At most two outbound messages per learner action; text and buttons travel together.
- Images only for share cards and weekly reports.
- Templates only for the opted-in daily challenge and pass renewals. Marketing templates never
  in the MVP.
- A per-learner daily cap, and every send logged with its category and estimated cost.

---

## 11. Trust, safety and compliance

- **Truth badges everywhere** (spec §84): `SIMULATION`, `HYPOTHETICAL`, `HISTORICAL DATA ·
  source · date`, `EDUCATIONAL ONLY`, `AI-GENERATED`. The `ExperienceFrame` component draws it;
  the registry refuses an experience without a `truth`.
- **No signals, ever.** `asks_for_signal` routes to a fixed reply and a Risk Lab run on why
  nobody can know the next move.
- **Distress.** `acute_distress` shows a person-written message and a per-country list of help
  lines reviewed by a person. No upsell for seven days.
- **Historical data only in the MVP**, with source and date: published inflation and exchange
  rate series from the central banks and statistics services. For example, Ghana's inflation ran
  above 50% at its late-2022 peak, which makes "live through 2022 with your savings plan" a
  powerful, clearly labelled lesson.
- **Data protection.** Phone numbers and learning data are sensitive. Keep the minimum, delete on
  request, export on request. Ghana's Data Protection Act 2012 (Act 843), Nigeria's Data
  Protection Act 2023 and Kenya's Data Protection Act 2019 may require registration: **legal
  review before launch**, and again before the Family plan (teenagers mean parental consent).
- **Financial regulation.** Education only; no personalized investment advice. Get a legal read
  per market (SEC Ghana, SEC Nigeria, CMA Kenya) before anything that could look like advice.
- **Sponsored content** is labelled on every screen it appears on (spec §51).
- **AI disclosure.** Coach turns are marked AI; the WhatsApp profile says it's an automated
  learning coach.

---

## 12. Data model (first cut)

| Table | Holds |
| --- | --- |
| `learners` | id, phone (E.164, unique, nullable while anonymous), country, currency, language, consent flags, price-test arm |
| `anon_sessions` | First-3-minutes sessions before identity; merged at login |
| `experience_runs` | experience key, engine version, lesson, config, seed, **actions[]**, summary, status, `parent_run_id` + `branch_step` for What-Ifs |
| `learning_events` | Append-only: type, skill, run, correctness, help used, Jev score |
| `mastery` | Derived per learner × skill: level, evidence, next review date |
| `learner_signals` | Skill, kind, strength, last seen, decays after; learner can view and delete |
| `decisions` | Every Jev call: gate, question-set version, state hash, answers, model, cost, latency, verdict |
| `ai_calls` | Every chat or voice call: profile, model, tokens, cost, cached, guard outcome |
| `coach_turns` | What the learner saw and where it came from: authored, cache, hint, model |
| `orders` | Learner, SKU, **SKU snapshot**, currency, amount, quote expiry, channel (web · whatsapp) |
| `payments` | Our reference (unique), rail, provider, amount, currency, status, raw |
| `entitlements` | Learner, plan, starts, ends, source payment, family owner |
| `wa_contacts` | Phone, opted in at, window expires at, language |
| `wa_inbound` | Message id (unique), phone, type, payload, processed at |
| `wa_outbound` | Phone, category, template, estimated cost, status |
| `wa_sessions` | Phone, current run, step, expiry |
| `login_codes` | Code, web session, expiry, used at |

Later: `journal_entries`, `circles`, `circle_members`, `sponsors`, `seat_codes`. Lessons, skills,
personas, event decks, misconceptions and passes are **content-as-code** in the repo, versioned
with git and reviewed like code.

---

## 13. Repository layout

```
app/                    routes: / (first 3 minutes), learn, practice, progress, coach,
                        lab/[experience], pro, api/{coach,runs,pay,payments,whatsapp,admin}
components/
  shell/                bottom nav, ExperienceFrame, TruthBadge
  experiences/<key>/    View.tsx (card + full sizes)
  ui/                   design-system primitives from the design brief
content/
  lessons/              one file per lesson (the 10-step structure as data)
  personas/  events/    per country
  misconceptions.ts     the library (Appendix B)
  hints/                authored coach lines per lesson × misconception
  copy/                 every other word on screen
lib/
  core/                 money, phone (GH/NG/KE), country, ids, rng
  engines/              one folder per simulation; pure
  experiences/          registry, types, Compose schema generation
  catalog/              passes, prices, fee schedules
  learning/             events, mastery, schedule, next, signals
  decisions/            jev, read, route, assess, hint, safety, scam, content
  intelligence/         openrouter, profiles, ladder, context, coach, guards, cache
  voice/                ported from Kanea
  payments/             paystack, start, fulfil
  whatsapp/             cloud (send), webhook (verify), session, render, commands
  capabilities.ts  brand.ts
db/                     schema, migrations
scripts/                check-core, check-engines, check-catalog, probe-{route,assess,safety,scam},
                        push-secrets, import-series
docs/                   product-spec, implementation-plan, design-brief (Phase 0)
```

---

## 14. Phases in detail

### Phase 0: Foundations and the design brief

- Scaffold the Kanea stack; `CLAUDE.md`; `capabilities.ts`; `brand.ts` (the name lives in one
  place).
- `lib/core`: multi-currency money, phone numbers for Ghana, Nigeria and Kenya (Kanea's network
  prefix map plus the others), seeded RNG, ids. All covered by `pnpm check`.
- **Design brief** (`docs/design-brief.md`, spec §81): tokens, type, spacing, cards, nav,
  buttons, status indicators that never rely on colour alone, a chart kit with a colour-vision-safe
  palette, motion rules, 3D rules, breakpoints. **You approve it before any page is built.**
- The shell: five tabs, `ExperienceFrame`, `TruthBadge`, and a skeleton of each tab at 375px.
- Admin, done now because they take weeks: Meta business verification, OpenRouter prepaid credit,
  Paystack Ghana test keys.

**Exit:** the shell is live on Workers; the design brief is approved; `pnpm check`, lint and
typecheck are green; no horizontal overflow at 375px.

### Phase 1: The first 3 minutes (no AI)

- The Experience Registry and contract; `budget_split` and `life_sim` (one month) with engine
  checks; What-If replay; the Predict wrapper.
- Authored feedback lines for every outcome; anonymous sessions and the event log.
- Status-sized share card; `wa.me` share.

**Exit:** 15–20 people in Accra (and a handful in Lagos), on their own phones, watched in person:
≥ 60% ask for "another one" or try a What-If without being prompted; median time to the first
consequence under 60 seconds; zero mismatches between numbers on screen and the engine.

### Phase 2: The coach

- Port `jev.ts` and `read.ts`; build `route`+`safety.in`, `assess.explain`, `assess.predict`,
  `hint.pick`, `safety.out`.
- `coach()` with the ladder, `CoachTurn`, Compose, the numeric guard, context assembly and cache.
- The Coach tab: a conversation where experiences appear inline as cards (the controlled
  generative UI of spec §9–10).
- Voice (hear and speak) behind a capability flag, ported from Kanea.
- Cost ledger; `pnpm probe:*` with labelled sets, three runs each.

**Exit:** each probe set ≥ 95% right outside the hedge band, hedge rate under 15%; guard
rejections under 2% of generated turns; median coach reply under 2.5 seconds; cost per
demonstrated learning event measured and reported.

### Phase 3: Mastery, practice and Risk Lab

- Mastery derivation, the skill graph for three domains, the intelligence map, spaced retrieval,
  the web daily challenge, a timed practice mode.
- `leverage_lab`, `position_size`, `risk_lab`, and the Survival Valley 3D.
- The Pro page with real prices and founding-member reservations recorded by hand (§9.5).

**Exit:** a D7 retention baseline on 100+ learners; transfer demonstrated on at least one skill by
30% of learners in their second week; the 3D chunk verified never to load on reduced-motion,
Save-Data or low-memory devices.

### Phase 4: Content

- The lesson schema (the spec §18 ten steps as data) and the authoring pipeline: `drafting` →
  `content.review` → a person → publish.
- `compounding`, `inflation_fx` (with imported historical series), `price_path`.
- The 16 MVP lessons (Appendix C), personas and event decks for Ghana, then Nigeria.

**Exit:** every lesson carries the spec §62 checklist as data, fully answered; each has at least
one transfer challenge; a local reviewer has signed off each country's content.

### Phase 5: Money and the WhatsApp front desk

- Port Kanea's Paystack code; passes catalog with the margin check; entitlements; free and Pro
  gates; the three-arm price test.
- WhatsApp W2: webhook and queue, reverse-OTP login, the daily challenge template, pay in chat,
  renewal reminders.

**Exit:** the first 50 paying learners who aren't friends or family; a concurrency test proving
webhook + verify + owner recording grant exactly once; WhatsApp cost per active learner per month
measured.

### Phase 6: WhatsApp-native learning and more rails

- Voice explain-back, Scam Radar, Flows mini-sims, the weekly analyst report, Circles.
- M-Pesa for Kenya; Pay with Transfer for Nigeria; diaspora gift passes by card.

**Exit:** at least 30% of weekly demonstrated learning events start in or come back through
WhatsApp; Scam Radar used and shared weekly.

### Phase 7: Beyond the MVP

Business Lab (the mobile money agent first), the Decision Journal, the Family plan, sponsor seat
codes, institutional reporting. Ordered by what Phases 1–6 teach us.

---

## 15. How the build agents split the work

After Phase 0, lanes can run in parallel because each one meets the others at a written contract.

| Lane | Owns | Its contract | Must not touch |
| --- | --- | --- | --- |
| Design / shell | Tokens, shell, UI kit, `ExperienceFrame`, `TruthBadge` | `docs/design-brief.md`, `components/ui` | Engine maths |
| Engines | `lib/core`, `lib/engines`, `scripts/check-*` | `init` / `step` / `summarize` | React |
| Experience UI | `components/experiences/*` | Renders an engine's state and `Facts` | Any calculation |
| Intelligence | `lib/decisions`, `lib/intelligence`, `lib/voice`, probes | `decide()`, `coach()`, `Compose` | UI |
| Learning | `lib/learning` | `emit(event)`, `mastery(learner)`, `next(learner)` | |
| Content | `content/*` | The lesson schema | Engine maths: ask the Engines lane |
| Payments | `lib/payments`, `lib/catalog`, entitlements | `startPayment()`, `entitlement(learner)` | |
| WhatsApp | `lib/whatsapp`, `app/api/whatsapp` | Renders `Facts`; steps the same engines | Engine maths |

**Every pull request answers**, in its description:

1. The spec §96 questions: learning, practical understanding, mobile, trust, design system,
   complexity, business reason.
2. Does any number on screen come from anywhere other than an engine?
3. A 375px screenshot of anything visible.
4. Is the truth badge right?

**The product review** after each phase is the spec's own bar: *does the first 3 minutes
demonstrate the financial intelligence gym?*

---

## 16. Metrics, wired from day one

| Metric | Computed from |
| --- | --- |
| **Weekly demonstrated learning events** (north star) | `learning_events` of type `applied` or `transferred`, correct, after feedback in the same run |
| Activation | Share of new sessions reaching the first consequence, and finishing the first run |
| Mastery | Skills at Application or above, per learner |
| Retention | W1 / W4 / W12 from events |
| Cost per demonstrated learning event | `ai_calls` + `decisions` + `wa_outbound` ÷ events |
| Hallucination rate | Numeric-guard rejections ÷ generated turns |
| Inappropriate advice rate | `safety.out` flags ÷ generated turns |
| Escalation rate | Turns reaching rung 5+ ÷ all turns |
| Hedge rate per gate | `decisions` in the band ÷ all |
| Conversion and ARPU | `orders`, `payments`, `entitlements`, by price-test arm |

An admin page shows these weekly. Nothing learner-identifying leaves the database.

---

## 17. Risks specific to building it

| Risk | Mitigation |
| --- | --- |
| Jev sits on an **alpha** endpoint | Behind `decide()`. If it vanishes, the fallback is a chat model with strict JSON, with every answer read as hedged: safe, authored paths |
| OpenRouter credit runs out (402) | `OPENROUTER_HAS_CREDIT` flag; coach falls back to authored lines; the simulations don't care |
| Meta changes WhatsApp policy or pricing again | WhatsApp is never the only surface; cost is logged per message; budgets per learner |
| Paystack businesses are per country | Launch Ghana on a Ghana account; Nigeria and Kenya are Phase 6 decisions |
| Workers CPU limits | Heavy simulation runs in the browser; server replays are cheap; Workers Paid |
| Neon HTTP has no transactions | Single-statement writes for anything that must be atomic |
| Local content is wrong (prices, customs, tax) | Illustrative, dated amounts; a local reviewer per country; the learner can report "this isn't how it works here" |
| A model update changes how we teach | Pinned models; probes rerun weekly and on every model change |
| Novelty wins over learning | Every animation answers spec §63's question in its PR |

---

## 18. Decisions I need from you

1. **Name.** One line in `lib/brand.ts`; candidates in Appendix A.
2. **Paystack.** A new Ghana Paystack business for this product, or the Kanea one? A separate
   one is cleaner for settlement and statements. Nigeria needs its own decision before Phase 6.
3. **WhatsApp number.** A dedicated number for the Cloud API, not a personal or Kanea number, so
   the bot's history, quality rating and messaging limits are its own.
4. **Country order.** Ghana → Nigeria → Kenya, as the spec says?
5. **Voice languages at launch.** English, Pidgin and Twi (Kanea has measured Twi), with Yoruba
   next?
6. **The Phase 1 pilot group.** Who are the 15–20 people, and can we watch them play in person?

---

## Appendix A: name candidates

Check trademarks and domains before choosing.

- **Sika Lab**: *sika* is Twi for money. Ghana-first, short, says "experiment".
- **Adwen**: Twi for mind or thinking. "Financial intelligence" in one word.
- **Cowrie Lab**: cowries were money across West Africa, so it's pan-African. Watch the
  similarity to Cowrywise in Nigeria.

## Appendix B: the misconception library (seed)

Each entry has an id, the lessons it appears in, a Jev detection question, authored hints, and the
experience that corrects it.

| Id | The belief | Corrected by |
| --- | --- | --- |
| `percent_of_percent` | A 3% price move means a 3% change in my account | `leverage_lab` |
| `leverage_moves_price` | Leverage changes how much the market moves | `leverage_lab` |
| `stop_is_guaranteed` | My stop loss always fills at my price | `price_path` with gaps |
| `win_rate_is_everything` | A high win rate means a winning strategy | `risk_lab` |
| `losses_symmetric` | Losing 50% then gaining 50% gets me back | `compounding` |
| `double_down_recovers` | Doubling after a loss wins it back (martingale) | `risk_lab` |
| `nominal_is_real` | Money in the bank keeps its value | `inflation_fx` |
| `savings_is_leftover` | You save what's left after spending | `budget_split`, `life_sim` |
| `loan_fee_is_small` | "15% for 30 days" is a small cost | `compounding` (annualized) |
| `high_return_low_risk` | Guaranteed high returns exist | `compounding`, Scam Radar |
| `diversified_same_thing` | Five similar assets is diversification | Portfolio Lab (later) |
| `revenue_is_profit` | Money coming in is money made | Business Lab (later) |

## Appendix C: the 16 MVP lessons

| World | # | Lesson | Engine |
| --- | --- | --- | --- |
| Money | 1 | Payday: where does it go? | `life_sim` |
| Money | 2 | The phone breaks: emergency funds | `life_sim`, `budget_split` |
| Money | 3 | Inflation eats cedis (and naira) | `inflation_fx` (historical) |
| Money | 4 | The loan app's "small" fee | `compounding` |
| Money | 5 | Family, rent and me: budgeting with obligations | `budget_split` |
| Money | 6 | Where savings live: wallet, bank, susu | `compounding` (comparison) |
| Risk | 7 | Leverage: $100 at 5×, 20×, 50× | `leverage_lab` |
| Risk | 8 | Position sizing: risking 1% on purpose | `position_size` |
| Risk | 9 | 100 versions of you: risk of ruin | `risk_lab` |
| Risk | 10 | Win rate vs reward-to-risk | `risk_lab` |
| Risk | 11 | Why losses need bigger gains | `compounding` |
| Risk | 12 | Revenge and doubling down | `risk_lab` |
| Markets | 13 | Price is uncertain: predict, then calibrate | `price_path` |
| Markets | 14 | Calm and wild markets: volatility | `price_path` |
| Markets | 15 | Your currency and the dollar: FX for earners | `inflation_fx` |
| Markets | 16 | Scam Radar: the maths of "guaranteed" returns | `compounding` |

## Appendix D: what we port, file by file

| From | Files | Changes |
| --- | --- | --- |
| kanea-studio | `lib/decisions/jev.ts`, `read.ts` | `X-Title`, question sets |
| kanea-studio | `lib/payments/paystack.ts`, `start.ts`, `fulfil.ts`, `app/api/payments/paystack/webhook/route.ts`, `components/order/PayPanel.tsx` | Jobs become orders and entitlements; add KES/NGN rails; add Bishop's mode/key check |
| kanea-studio | `lib/core/money.ts`, `phone.ts`, `ids.ts` | Multi-currency; Nigeria and Kenya numbers |
| kanea-studio | `lib/voice/*` | As is, with learning prompts |
| kanea-studio | `lib/capabilities.ts`, `scripts/push-secrets.mjs`, `scripts/check-core.ts`, `scripts/probe-*.ts`, the 3D gating | Pattern, not copy |
| learn-with-bishop | `lib/grading/jev.ts`, `types.ts` (`decideJevMark`, `human_until_calibrated`) | Becomes `assess.*` |
| learn-with-bishop | `lib/progress.ts`, `lib/entitlements.ts`, `jev-playground/` | Event log; entitlements; tune questions there |
| aksen-labs | `lib/openrouter.ts`, `lib/ai-routing.ts`, `tests/openrouter-routing.mjs` | Profiles, and mocked-transport tests |

---

## Sources checked for this plan (25 Sep 2026)

- [Meta: pricing on the WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- [EngageLab: WhatsApp Business API pricing and the 1 Oct 2026 changes](https://www.engagelab.com/blog/whatsapp-business-api-pricing)
- [respond.io: WhatsApp's 2026 general-purpose chatbot ban explained](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban)
- [Paystack: Charge API](https://paystack.com/docs/api/charge/)
- [Paystack: payment channels](https://paystack.com/docs/payments/payment-channels/)
- Our own measured findings in kanea-studio, learn-with-bishop and aksen-labs, cited inline.
