# The member app: the dashboard, the modules and signals

Written 26 Sep 2026. This covers what a signed-in person gets, how it is organised, and how we add
buy and sell signals without breaking the rules that make the product trustworthy. It is also what
we show a forex or crypto community owner who might run their community on it.

Read with `CLAUDE.md` (the rules), `docs/implementation-plan.md` (stack and layers) and
`docs/strategy/monetization-and-community.md` (how we earn). Where this document changes an older
one, this one wins, and the older one is marked.

---

## 1. What we are building

A **trading school in a box**. It has four parts:

1. **Learn:** a path of playable lessons.
2. **Practice:** mistakes come back until they stick.
3. **Market:** signals with their reasons and a record anyone can check.
4. **Trade:** a journal, tools and a paper account.

It is built for two customers:

- **The learner:** someone in Ghana or Nigeria who wants to trade or invest and has been burned, or
  is about to be, by signal groups and "account managers".
- **The community owner:** a forex or crypto educator with a Telegram, WhatsApp or Discord group of
  hundreds or thousands. Today they juggle a Telegram channel for calls, a Google Drive of PDFs,
  YouTube replays, a spreadsheet for results and Paystack links by hand. We give them one branded
  place that does all of it, and does it more honestly than anything their members have seen.

### What a trading education company organises, and what we add

| What they all have                | How it usually looks                     | Ours                                                                                                  |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Academy: courses by level         | Video playlists, PDFs                    | A roadmap of 54 playable lessons, each built on a simulation. Every number comes from an engine       |
| Signals and trade ideas           | Telegram calls, screenshots of wins only | Rule-based signals with entry, stop, target, the reasons for and against, and a complete record       |
| Market analysis and a daily brief | A mentor's voice note                    | The engine's read of each market (trend, momentum, volatility) in plain words; the mentor adds a view |
| Economic calendar                 | A link to Forex Factory                  | A calendar that says which lesson explains each release (f6), and flags open signals it can hit       |
| Trading journal                   | A spreadsheet, or a paid app             | A journal that computes R, win rate, expectancy and drawdown, and links mistakes to lessons           |
| Calculators                       | A pip calculator on another site         | Position size, risk and reward, pip value, drawdown recovery and compounding, on the same engines     |
| Paper trading and challenges      | A demo account at a broker               | A paper account that takes our signals or your own ideas, and a 30-day challenge (p5)                 |
| Community and live sessions       | A Telegram group, a Zoom link            | The Floor: plans, not calls; live sessions with replays; mentors verified                             |
| Mentorship                        | DMs                                      | Plan and journal reviews, booked and paid in the product                                              |
| Certificates                      | A PDF                                    | Proof of skill from practice data: a certificate means you did the work                               |
| Membership and billing            | Paystack links by hand                   | Passes paid by MoMo, card or transfer, with no silent renewals                                        |

**Our flair:**

- **Signals that teach.** Every signal names the lesson that explains its setup, so members learn to
  read the setup themselves.
- **A record you can't fake.** Every signal we ever publish stays in the record, and nothing is
  deleted.
- **Numbers from code, words from AI.** The AI explains; it never invents a number.
- **Honest labels everywhere.** Every experience says whether it is a simulation, historical data,
  live market data or AI.
- **Ghana and Nigeria first.** Cedi and naira, MoMo, the GSE, the NGX and local examples.

---

## 2. Navigation

### The public site (unchanged)

Roadmap, Glossary, Mindset, IPO 101, Community, Pricing; "Start free" goes to `/desk`. Nothing
public mentions an internal module that isn't live.

### The signed-in app

On a laptop, a **side nav**, grouped by what you are doing. On a phone, a **bottom bar** with the
four most-used places and a **Menu** that opens the whole side nav as a sheet.

```
◆ Sika Lab                   (or the community's own logo)

  Desk                 /desk            home: everything at a glance
LEARN
  Path                 /learn           the roadmap, stage by stage
  Lessons              /lessons         any lesson, on its own
  Practice  ●3         /practice        mistakes due again
  Glossary             /learn/glossary  81 words, plainly
MARKETS
  Signals              /signals         what the rules see now, and why
  Calendar     soon    /calendar        releases that move prices
TRADE
  Journal              /journal         your trades, measured in R
  Tools                /tools           calculators on the same engines
  Paper account soon   /paper           trade signals without money
COMMUNITY
  The Floor    soon    /floor           plans, not calls
  Live         soon    /live            sessions and replays
YOU
  Progress             /me              XP, streak, badges, notes, settings
```

Phone bottom bar: **Desk · Learn · Signals · Journal · Menu**. The practice count sits on Learn.

A module that isn't built shows in the side nav as "Soon", and never as a dead link. When a
community switches a module off, it disappears from their members' nav.

### Route map

| Route                             | What                                           | Notes                                                |
| --------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `/desk`                           | The dashboard                                  | Was the path; onboarding and sign-in still land here |
| `/learn`                          | The path (stages as coin trails)               | Moved from `/desk`                                   |
| `/learn/glossary`                 | The glossary in the member frame               | Same data as the public `/glossary`                  |
| `/lessons`, `/practice`, `/me`    | As before                                      |                                                      |
| `/signals`                        | Every market: price, trend, the current signal | Live market data                                     |
| `/signals/[market]`               | One market: chart, signal, reasons, record     |                                                      |
| `/journal`                        | Trades, stats, equity in R                     | Device first, synced later                           |
| `/tools`                          | Calculators                                    | Prefilled from a signal (`?entry=&stop=`)            |
| `/lesson/[id]`, `/practice/round` | Full screen, as before                         |                                                      |

---

## 3. The dashboard (`/desk`)

The dashboard answers three questions in one screen: _what should I do now_, _how am I doing_ and
_what is the market doing_. On a phone it is one column in that order. On a laptop it is a grid:
learning on the left, markets and trading on the right.

1. **Greeting and the day:** streak, level, today's goal.
2. **Up next:** the next lesson, one big button. For a newcomer, "Start here" and "Find my level".
3. **Practice due:** mistakes ready to try again.
4. **Signals now:** the markets with a live signal first, then the rest with their trend.
5. **Your journal:** trades logged, win rate, average R, open trades; "Log a trade".
6. **Your path:** the current stage and its progress.
7. **Tools:** the four calculators people use most.
8. **Word of the day:** a glossary term, the same for everyone that day.
9. **Later:** the next live session, the Floor's latest plan, and the community's announcements.

Every card reads from a module; the dashboard holds no rules of its own.

---

## 4. Signals

### 4.1 The promise

> A signal says what a fixed, published rule sees in a market, where it would be wrong, what it
> aims for, why, and how the same rule has done. It never says what will happen.

### 4.2 The pipeline: code decides, Jev checks, the AI explains

```
market data ─▶ adapter ─▶ closed bars ─▶ signal engine ─▶ reading ─▶ Jev gate ─▶ explanation ─▶ record
 (Kraken,      (lib/markets)  (integers)   (lib/engines/     (facts)    (decide())   (authored or   (signals
  Twelve Data)                               signals.ts)                              LLM + guard)    table)
```

1. **Adapters** (`lib/markets/`) fetch OHLC bars and turn prices into integers in the market's
   smallest unit, for example BTC in tenths of a dollar and EUR/USD in 0.00001s. The unfinished bar
   is dropped: rules only ever see closed bars.
2. **The signal engine** (`lib/engines/signals.ts`) is pure and has fixed rules with a version
   number. On each closed bar it reads the trend (the 20 and 50 averages, and the 200 for the big
   picture), momentum (RSI) and volatility (ATR). It fires on one of two setups the curriculum
   teaches:
   - **Trend pullback** (s1, t2, t3): the trend is up, price dips to the 20 average with RSI below
     45, then closes above the last bar's high. The mirror image is a sell.
   - **Breakout** (s3, c7): price closes beyond a tight 20-bar base on heavy volume, with the big
     trend not against it.
     A signal carries entry, stop (beyond the pullback low or inside the base, at least one ATR
     away), target (2R), the facts for and the facts against, and the lesson ids that explain it.
3. **The rule's record on this market** is the same engine walked forward over the same bars. Each
   decision is made on a bar's close and filled at the next bar's open. Gaps are honoured and costs
   paid, and when stop and target fall in the same bar, the stop is assumed hit first. Every number
   (win rate, average R, worst run) comes from here.
4. **Jev** (Phase D) answers questions the numbers can't: _"Is a high-impact release due inside this
   trade's window?"_ (from the calendar) and _"Does this mentor note contradict the signal's
   direction?"_. It uses `decide()` like every other gate: rules first, the authored fallback when
   Jev is off, and the hedge band sends it to a person.
5. **The explanation** is authored from the facts today (`content/signals.ts`), so it always works
   and costs nothing. In Phase D the coach rewrites it in plain words, and the numeric guard rejects
   any number the engine didn't produce.
6. **The record** (Phase C): each signal is written to `signals` when it first fires and is closed
   by the engine when its stop, target or time limit is hit. Rows are never updated except to close
   them, and never deleted. The public record page shows every one.

### 4.3 The safeguards (rule 9, rewritten)

- **Every signal has a stop, a target and a size rule** (1% of the account by default, and the tool
  that works it out).
- **The reasons against are shown next to the reasons for.** A setup has costs and risks, and
  saying so is the product.
- **The record is complete.** Losses are shown as big as wins, and the win rate sits next to the
  average R so nobody is fooled by either alone.
- **Paper first.** A new member's first signals go to the paper account; real money is their own
  decision, outside the product.
- **No urgency.** No "entry closing in 5 minutes", no push that says "BUY NOW". A notification says
  which market and which setup, and waits for them to open it.
- **No promises.** No "90% accuracy", no monthly return claims, no screenshots of single wins.
- **Care comes first.** When a session was flagged for distress (`lib/decisions/safety.ts`), signals
  and paywalls stay hidden and the support card shows.
- **Labelled.** Every signal screen carries `LIVE MARKET DATA` and `EDUCATIONAL ONLY`, and the
  record carries `HISTORICAL DATA` with its source and dates.

### 4.4 Market data

| Source              | Covers                                                     | Cost and limits                                          | Status                                                              |
| ------------------- | ---------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| **Kraken** (public) | BTC, ETH, SOL, XRP; EUR/USD, GBP/USD, USD/JPY; gold (PAXG) | Free, no key, 720 bars per call; about one call a second | **v1 default.** Reachable; its FX and PAXG are Kraken's own markets |
| Coinbase, OKX       | Crypto                                                     | Free, no key                                             | Fallback adapters when Kraken fails                                 |
| Twelve Data         | FX majors and minors, gold (XAU), indices, US stocks       | Free key: 800 calls/day; paid from about $29/month       | Phase B, when `TWELVEDATA_API_KEY` is set                           |
| GSE and NGX         | Local stocks                                               | No clean public API                                      | Research: licensed feed or daily close upload                       |
| Binance, Bybit      | Crypto                                                     | Free                                                     | Geo-blocked from US servers (451 or 403); skip                      |

Signals run on **4-hour bars**. That is swing trading: a signal lasts hours to days, which suits
people who work. Readings are cached for ten minutes on the server; a new 4-hour bar is the only
thing that can change a signal.

### 4.5 Regulation (take advice before charging)

Selling buy or sell recommendations is investment advice in most places.

- In Nigeria the SEC registers investment advisers, and the Investments and Securities Act 2025
  brings digital assets under its oversight.
- In Ghana the SEC licenses investment advisers under the Securities Industry Act, 2016 (Act 929).

Until we have legal advice:

- signals are **general** (the same for everyone, never tailored to one person's money);
- they are **rule-based and published with their record**;
- they are labelled **educational**, with the paper account as the default;
- they are **free inside the Pass** rather than sold on their own.

A community owner who sells their own calls through us does so under their own licence, and the
terms say so.

---

## 5. The other modules

| Module            | Source of truth                                                                   | Storage                                                         | Phase |
| ----------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----- |
| **Path, lessons** | `content/curriculum.ts`, `content/lessons/*`                                      | `lesson_completed` events                                       | Live  |
| **Practice**      | `lib/progress/review.ts`                                                          | `question_missed` and `question_reviewed` events                | Live  |
| **Glossary**      | `content/glossary.ts`                                                             | None                                                            | Live  |
| **Journal**       | `lib/engines/journal.ts` (R, win rate, expectancy, drawdown)                      | On the device now (`sika:journal`); `journal_trades` in Phase C | A     |
| **Tools**         | `lib/engines/tools.ts` plus the risk and trade engines                            | None                                                            | A     |
| **Signals**       | `lib/engines/signals.ts` on `lib/markets/*`                                       | Server cache now; the `signals` table in Phase C                | A→C   |
| **Paper account** | A pure fill engine: next-bar fills, stops, costs, as the backtester               | `paper_orders` events                                           | C     |
| **Calendar**      | Twelve Data or a licensed calendar; f6 explains it                                | Cached                                                          | B     |
| **The Floor**     | Plans with entry, stop and reason, graded against the market by the signal engine | `floor_posts`                                                   | E     |
| **Live**          | Scheduled sessions, replays on R2                                                 | `sessions`                                                      | E     |
| **Coach**         | `Compose` directives, the numeric guard, `decide()`                               | Ledger                                                          | D     |

The journal is the heart of trading. A trade has:

- market, side, entry, stop, target, exit, size and the times;
- the setup (pullback, breakout, range, news, other) and the source (a signal, your own, a mentor);
- one feeling before it (calm, FOMO, revenge, bored, sure) and a note.

The engine turns this into:

- R per trade, win rate, average R and expectancy;
- the equity curve in R and the worst losing run;
- a breakdown by setup and by feeling.

When the stats show a leak, for example that FOMO trades lose, the journal names the lesson that
covers it (p3).

---

## 6. Community owners (white label)

A community is an **organisation**, and everything a member sees is scoped to one:

- **Roles:** owner, mentor, member. Mentors publish ideas (as Floor posts, graded like everyone
  else's) and host live sessions. Owners see the admin.
- **Branding:** name, logo, one accent colour (checked for contrast against our tokens) and a custom
  domain in Phase F (Cloudflare for SaaS). The truth labels and the safety rules can't be
  rebranded.
- **Modules on and off:** a crypto community can hide the FX lessons and add its own lessons, written
  as lesson data and checked by the same `check-lessons`.
- **Their own signals:** a mentor's call must carry entry, stop, target and a reason, and it joins
  the same permanent record. This is what makes an honest community better than a Telegram channel.
- **Admin:** members, who is active, who is stuck on which lesson, practice accuracy, journal
  discipline (did they use stops?), and signal and record summaries. It never shows a member's notes
  or crisis flags.
- **Billing:** Paystack subaccounts, so members pay the community directly and we take a platform
  share. Seats for institutions.
- **Invites:** a link or a code; members land in the community's branded onboarding.

**Pitch in one line:** _"Your calls, your lessons, your brand, with a record your members can trust
and a school that makes them better traders, so they stay."_

---

## 7. Data model additions

```
orgs              id, slug, name, brand (json), modules (json), plan, created_at
memberships       org_id, user_id, role (owner|mentor|member), joined_at
markets           id, source, symbol, name, class (crypto|fx|metal|stock), decimals, cost_bp, active
signals           id, org_id null, market_id, rule_version, setup, side, bar_time, entry, stop, target,
                  facts (json), status (open|target|stop|expired), closed_at, exit, r_hundredths
                  (append-only; only status, closed_at, exit and r are written, once, on close)
journal_trades    id, user_id, org_id, market, side, entry, stop, target, exit, size, opened_at,
                  closed_at, setup, source, signal_id null, feeling, note
paper_orders      event log: id, user_id, account_id, kind, payload, at
floor_posts       id, org_id, user_id, market, side, entry, stop, target, reason, status, r_hundredths
sessions          id, org_id, host_id, title, starts_at, replay_url
```

All prices are integers in the market's units, R is in hundredths and money is in minor units, as
everywhere else.

---

## 8. Rule changes

**Rule 9 of `CLAUDE.md`,** rewritten:

> **No hype, no fake urgency, and signals only with their proof.** A signal comes from a fixed rule
> in `lib/engines/signals.ts`, with a stop, a target, the reasons for and against, and the rule's
> complete record; losses stay in it. No promised returns, no countdowns, no single-win screenshots,
> no paywall in a session where distress was flagged, and signals default to the paper account.

**Truth labels:** add `LIVE MARKET DATA` ("prices from Kraken, updated every few minutes") to the
four existing ones.

**The tip rule** (`lib/decisions/safety.ts`) still routes "what should I buy?" to lessons from the
ask box, and now also offers Signals, where the reasons and record are.

**`docs/strategy/monetization-and-community.md`** said "no signals". It is superseded here: signals
are included in the Pass, not sold alone, until legal advice says otherwise.

---

## 9. Phases

| Phase | What                                                                                                                                     | Exit criteria                                                                                                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | Shell: side nav, bottom bar and menu. The dashboard. Path at `/learn`. Tools. Journal on the device. Signals v1 on Kraken 4-hour bars    | `pnpm check` proves the signal rules, journal maths and tool maths; every screen at 360–1440 px with no sideways scroll; signals degrade to a clear message when data is down |
| **B** | Market data: Twelve Data adapter for FX, gold and indices; the calendar; watchlists                                                      | Data adapters tested on recorded responses; calendar shows the next week                                                                                                      |
| **C** | The permanent record (the `signals` table, closed by a scheduled job); the paper account; journal synced to accounts; "Take this signal" | A signal's row can't be edited except to close it; the record page matches a replay; paper fills match the backtester's                                                       |
| **D** | AI explanations with the numeric guard; the calendar Jev gate; the coach answers "why?" on any signal                                    | Guard rejection rate measured on live turns; `probe:gates` green                                                                                                              |
| **E** | Communities: orgs, roles, branding, mentor ideas, the Floor, live sessions, admin                                                        | A second community runs beside ours with its own brand and nothing leaks between them                                                                                         |
| **F** | Billing per community (Paystack subaccounts), custom domains, Telegram and WhatsApp delivery of signal notices                           | A community takes its first payment and a member gets a notice on WhatsApp                                                                                                    |

---

## 10. Decisions for you

1. **Markets first.**
   - Crypto and FX majors plus gold, as v1 has it?
   - Or add local stocks (GSE/NGX), which need a paid or manual feed?
2. **Data budget.** Twelve Data's paid tier (about $29/month) gives proper FX and gold, and the
   calendar needs one too.
3. **Signals and the law.** Keep them inside the Pass as education until a lawyer in each country
   says otherwise?
4. **White-label priority.** Is there a specific community owner to build Phase E around? Their
   size and what they sell (calls, courses, mentorship) decide what the admin shows first.
