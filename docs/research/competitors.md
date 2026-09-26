# Who else is doing this, and how they work

Research for the reset (26 Sep 2026). Sections 8 and 9 cover trading education and the GitHub
search, added after the founder set the focus on charts, technical and fundamental analysis, and
strategies. The first build led with a budgeting form inside a tabbed
app. It was correct, but it looked like a finance app, not a financial world. Before rebuilding, we
looked at who already teaches money (or anything) by doing, and at what makes them work. The new
landing page (`app/page.tsx`) is built from what's below.

Figures are as each source reported them, linked at the end. Where a number is a vendor's own
claim, it says so.

---

## The short version

1. **Nobody in West Africa lets you practise money decisions and feel the consequences first.**
   African fintechs (Cowrywise, PiggyVest, Bamboo, Ladda/MoneyAfrica, Chipper) teach with
   articles, podcasts and communities, next to a real-money product. FinEd Ghana (pre-seed, 2026)
   is building lessons for school students in Twi and Ewe. That's reading, not practice. The gap
   is real.
2. **Learning by doing is proven; learning by AI chat alone is being commoditised.** Brilliant
   leads with interactive problems, not videos, and charges about $14–28 a month. Khanmigo's
   Socratic tutor sells for $4 a month. The tutor is a layer, and the interactive world is the
   product.
3. **Habit mechanics are what make it last.** Duolingo's streaks, leagues and freezes turned a
   short lesson into a daily return: learners with a 7-day streak are reported to stay at about
   2.4× the rate of those without one. Streaks are allowed to break gently (freezes, weekend
   passes), so the habit doesn't turn into anxiety.
4. **Personality sells.** Cleo is a money coach with a voice (Roast mode and Hype mode) over
   ordinary transaction analysis. The humour doesn't change what's flagged, only how it's said.
   It passed a million paying subscribers and about $300M ARR, with nearly all its revenue in the
   US.
5. **The money is in distribution, not only in subscriptions.** Zogo is free to learners and
   paid for by 200–250+ banks and credit unions, who get engaged young members. Finimize adds an
   API that investment platforms embed, plus events. Greenlight bundles its game into a paid
   family card.
6. **Simulations that end in a feeling work.** SPENT (a month on $1,000, one hard choice at a
   time) is still used in classrooms 15 years later. Trading simulators (Investopedia, Invstr,
   cTrader Market Replay) give you a fake $100k and a real market. They teach stock-picking and
   leaderboard chasing more than judgement.

**What we are:** Brilliant's "learn by doing", pointed at money decisions people in Accra and Lagos
actually face, with SPENT's emotional honesty and a coach with Cleo's personality that asks before
it tells. Duolingo-style daily reps come through WhatsApp. Distribution comes Zogo-style, through
banks, telcos, schools and employers.

---

## 1. Learning by doing

### Brilliant (brilliant.org)

- **How it works:** every lesson is a sequence of interactive problems. There's a 2–4 sentence
  concept intro, then you manipulate something and get instant feedback. No lecture video. Around
  10M+ users.
- **Design:** ustwo designed Brilliant's "game feel": a level gameboard for progress, a
  companion that guides you to the next lesson, celebrations on correct answers, and
  encouragement during struggle. The success measure was retention after week one. It uses Rive
  for interactive animations (streaks, colour-coded paths).
- **Money:** Premium is about $27.99 a month or $161.88 a year, with a 7-day trial. The free tier
  opens only the first chapter of each course. The AI tutor (Koji) is part of Premium.
- **What we take:** the problem is the lesson. The first screen of any topic is something to
  touch, not something to read. Celebrate progress with motion that means something.
- **What we don't take:** the course/chapter structure. Our unit is a _decision_, not a chapter.

### SPENT (playspent.org), from Urban Ministries of Durham and McKinney

- **How it works:** you have $1,000 for a month. Each screen is one dilemma with two bad options
  (a healthy meal or working electricity, the credit card minimum or the rent), with a real
  statistic after some choices. It ends when the month ends or the money does.
- **Why it matters to us:** it proves that a single month, one decision at a time, can change
  how people feel about money. That's exactly our Money Lab. It works because the choices are
  specific and unfair, the way real life is.
- **What we take:** specific, local dilemmas ("your mum asked", "Kofi's guy"), one per screen,
  consequences that land.

### Greenlight Level Up

- **How it works:** a game for kids and teens inside the Greenlight family debit-card app.
  Bite-sized challenges with videos, mini-games and questions, rewarded with coins and stars,
  designed with academics and game designers. It's free to schools through Greenlight for
  Classrooms.
- **Money:** it's a feature of a paid family banking subscription, not a product on its own.
- **What we take:** the family plan and a free schools tier as distribution.

---

## 2. Habit

### Duolingo

- **How it works:** short lessons, XP, streaks, weekly leagues (the top of each league is
  promoted and the bottom risks demotion), streak freezes and weekend amulets so a missed day
  doesn't end the habit.
- **Reported effect:** users with a 7+ day streak retain at about 2.4× the rate of those who never
  build one. Leagues and streaks are credited with most of Duolingo's retention gains. Its 2025
  filing reported about 12.2M paid subscribers.
- **What we take:** the daily rep (one decision a day, about 60 seconds), and a streak that
  forgives.
- **What we don't take:** leagues that reward volume. Our spec's metric is decision quality, not
  minutes. Ranking people by how much they practised money would reward grinding, not judgement.

---

## 3. AI coaches

### Khanmigo (Khan Academy)

- **How it works:** a Socratic tutor. It asks guiding questions, gives progressive hints and
  won't just hand over the answer. It's wired into Khan's exercise library, with voice in and
  out.
- **Money:** $4 a month or $44 a year for families, about $15 per student a year for districts,
  and free for teachers. Khan has said the model costs were high enough that giving it away would
  have bankrupted the nonprofit.
- **Scale (reported):** 68,000 to 700,000 users in a year.
- **What we take:** "What do you think happens?" before "Here's the answer." The coach is a paid
  layer, priced low, and cost-controlled (authored lines first, cheap models, Jev for yes/no
  calls).

### Cleo

- **How it works:** a chat money coach over a read-only bank connection (Plaid). Roast mode and
  Hype mode are a tone layer over normal budgeting analysis. It makes shareable "roast receipts"
  and now has voice and memory.
- **Money (Sacra):** about $300M ARR in 2025, 1.1M+ paying subscribers. Tiers are $5.99, $8.99
  and $14.99 a month, plus cash-advance fees. A 50% free-to-paid conversion is reported, and it
  has been profitable since August 2024. 99.8% of revenue is from the US.
- **What we take:** the coach needs a _character_. A shareable result card is a growth loop.
- **What we don't take:** real bank data (we're a simulator), or lending of any kind.

---

## 4. Market simulators

### Investopedia Simulator, Invstr, cTrader Market Replay, TraderSync

- **How they work:** virtual cash ($100k at Investopedia, $1M at Invstr) against live or replayed
  market data. There are public and private games and leaderboards. Invstr combines "fantasy
  finance" leagues with a real brokerage (via Apex). cTrader and ReplayTrader let you rewind to a
  historical day and replay it candle by candle.
- **What's wrong for us:** they teach you to _pick_ and to _chase the leaderboard_. Nothing
  explains why you lost, and the real-money upsell sits one tap away. That's the signals-group
  culture our spec rules out.
- **What we take:** historical replay is powerful when it's framed as a lesson. "It's 2008, you
  hold these, the market falls 40%, what do you do?" becomes our Market Lab, always labelled
  `HISTORICAL DATA`. So does "it's 2022, the cedi loses half its value against the dollar." We
  never sell a brokerage.

### Binance Academy, Learn & Earn

- **How it works:** short articles and videos, then a quiz, and a correct quiz pays out a small
  amount of a token (KYC required, while supply lasts).
- **What we take:** the visual language only (dark, dense, precise, gold). Paying people to finish
  a quiz rewards finishing, not understanding. We don't do it.

---

## 5. Distribution models

### Zogo

- **How it works:** 1,200+ short modules, each five concepts then a five-question quiz, plus daily
  trivia. You earn "pineapples" and redeem them for gift cards.
- **Money:** B2B2C. It's free to learners and paid for by 200–250+ banks, credit unions and
  fintechs (Chime, Sezzle, New York Life), who get branded modules, a white-label app or an
  embedded "360" version, and a dashboard. Its landing page sells _loyalty, product adoption and
  ROI_ to institutions, not learning to learners.
- **What we take:** Phase 3+ distribution. A Ghanaian bank, a telco (MTN MoMo), an employer or a
  university sponsors access for its people. Our Business Lab and Money Lab are exactly what a
  bank's youth account wants its customers to have played.

### Finimize

- **How it works:** it started as a 3-minute daily finance email and grew to 1M+ readers. Now it
  has an app, premium analysis, native newsletter ads, a content API that investment platforms
  embed, and events (70k+ attendees a year).
- **What we take:** a daily, tiny, jargon-free habit (our WhatsApp daily rep) and a content API
  later.

---

## 6. The African landscape

| Company                      | What it is                              | How it teaches                                                               | What it lacks                         |
| ---------------------------- | --------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| **Cowrywise** (NG)           | Savings and investment app              | 400+ guides and explainers                                                   | Nothing to practise                   |
| **PiggyVest** (NG)           | Savings and locked goals, 4M+ customers | Blog, social                                                                 | Nothing to practise                   |
| **Risevest** (NG)            | Dollar asset manager                    | Content marketing                                                            | Nothing to practise                   |
| **Bamboo, Chaka** (NG)       | US and NGX stock brokerage              | Help centre, weekly "stocks to buy" emails                                   | Closer to tips than teaching          |
| **MoneyAfrica / Ladda** (NG) | Courses and community; savings app      | Courses (budgeting, T-bills, currency risk), 300k social, kids' bootcamps    | Courses, not simulation               |
| **Chipper Cash**             | Payments                                | A "Learn" content pillar (SEO-led)                                           | Content marketing                     |
| **FinEd Ghana** (GH)         | Lessons app for JHS/SHS students        | Twi and Ewe content, GES school partnerships. $150k pre-seed (Omidyar), 2026 | Schools only, lessons not simulations |
| **BezoMoney** (GH)           | Digital susu savings                    | A podcast (BezoSeries)                                                       | Content                               |

**The gap is plain:** every African player teaches by telling, usually next to a product that wants
your deposit. None lets you _live a month_, _run a chop bar_ or _take a 20× position_ and feel
what happens, in cedis and naira, with no product to sell you at the end. That's the neutral,
trusted position we can own. It's also why banks and telcos would pay us rather than build it.

Context worth designing for: in Nigeria inflation has been above 30% and 28.9M adults are still
financially excluded (as reported for 2026). In Ghana, susu ("little by little") and mobile money
are how most people already save. Digital susu is being pushed by MTN partnerships and
BezoMoney.

---

## 7. What this changes in our build

1. **Lead with the world, not the form.** The first thing anyone touches is a live simulation with
   motion and numbers that react: the leverage lesson from spec §19, now the landing page's hero.
   The Money Lab comes back rebuilt in the same terminal-meets-game style.
2. **One design language: "financial terminal meets premium game".** Mono numerals, gridded chart
   surfaces, a live ticker of lessons (not prices), gold only where you act. The old home was a
   form in a card.
3. **Labs, not tabs.** Money Lab, Risk Lab, Market Lab (historical replays), Business Lab
   (chop bar, provision shop), Portfolio Lab, all shown on the landing page with honest status.
4. **The coach has a character and asks first.** Every number it says is the engine's.
5. **Daily rep on WhatsApp**, Duolingo-style habit without leagues.
6. **Money:** free daily reps and a first lab; a MoMo-paid pass (no silent renewals); a family
   plan; then Zogo-style sponsorship by banks, telcos, employers and schools. Prices are set
   after the pilot, not before.
7. **Never:** tips, signals, "stocks to buy", Learn & Earn payouts, leaderboards of profit, or a
   brokerage upsell.

---

## 8. Trading education: who teaches charts, TA and FA today

The founder's direction (26 Sep 2026): the product teaches **chart reading, technical and
fundamental analysis, and trading strategies**. There's a curated roadmap for beginners, and
single lessons for people who already trade and want one thing.

| Who                                                       | How they teach                                                                                                                                                                                                              | What we take                                                                                                           | What we don't                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Babypips School of Pipsology**                          | A free, school-style path: preschool to graduate, 350+ lessons, no account needed. The order runs chart types, candlesticks, support and resistance, Fibonacci, moving averages, indicators, then risk and psychology later | Proof that a _graded path_ is what beginners want. The logical order of the charts-to-indicators stages                | Text and cartoons, and risk comes late. We put risk third           |
| **Investopedia Academy, Udemy "zero to hero" courses**    | Video courses                                                                                                                                                                                                               | The coverage checklist                                                                                                 | Watching, not doing                                                 |
| **TradingView**                                           | Charts, community ideas, Pine Script                                                                                                                                                                                        | Its charting library (below). Its sense of a pro tool                                                                  | Community "ideas" that are signals by another name                  |
| **Chart Guessr, ChartDojo**                               | Guess the next candle, or name the pattern, for XP and streaks                                                                                                                                                              | Quick reps and pattern practice                                                                                        | Guessing direction as the skill. We grade the _plan_, not the guess |
| **Replay simulators** (cTrader, TraderSync, ReplayTrader) | Rewind a real day and trade it candle by candle                                                                                                                                                                             | Sealed historical replays for our Prove-it stage                                                                       | No teaching layer, and a brokerage upsell                           |
| **Telegram and WhatsApp "academies"** (West Africa)       | Signals, screenshots of profits, paid mentorship                                                                                                                                                                            | Nothing. They are the problem: Ghana arrested 41 people in an illegal-forex crackdown, and Nigeria's SEC moved on CBEX | Everything                                                          |

**Our curriculum** (`content/curriculum.ts`) has 50 lessons in 7 stages: How markets work, Read
a chart, **Risk first**, Technical analysis, Fundamental analysis, Strategies, and Prove it (plan,
journal, replays, a 30-day paper challenge graded on process). Every lesson has a _practice_
line, the thing you do. Every lesson also stands alone, with "builds on" hints instead of locks,
so an experienced trader can take "RSI and momentum" and nothing else.

---

## 9. GitHub: is there a base worth building on?

We looked for open-source projects to fork or adopt (26 Sep 2026). Weekly npm downloads are from
the npm registry for 18–24 Sep 2026.

### Libraries worth adopting

| Project                                                                                                                                            | What it is                                                                         | Licence                                                                                                    | Verdict                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[tradingview/lightweight-charts](https://github.com/tradingview/lightweight-charts)** v5.2                                                       | Canvas candlestick, line and histogram charts. Small, fast, ~976k downloads a week | Apache-2.0. **Requires** the TradingView attribution notice and a link to tradingview.com on a public page | **Adopt** for the lesson player's full charts (zoom, pan, indicators underneath). The landing page keeps its own SVG chart: it has 42 candles and needs overlays in HTML                                            |
| **[bennycode/trading-signals](https://github.com/bennycode/trading-signals)** v8.3                                                                 | Streaming indicators: SMA, EMA, RSI, MACD, Bollinger, ATR…                         | MIT                                                                                                        | **Use as a reference in `pnpm check`**, not at runtime. Our engines must be pure, seeded and exactly reproducible, so we write our own indicator maths in `lib/engines` and prove it matches this library's answers |
| [cinar/indicatorts](https://github.com/cinar/indicatorts), [anandanand84/technicalindicators](https://github.com/anandanand84/technicalindicators) | The same, with pattern detection                                                   | MIT                                                                                                        | Second references. technicalindicators' candlestick-pattern detection is useful for checking our pattern lessons                                                                                                    |

### Apps we looked at as possible bases

| Project                                                                                                                                                                                              | What it is                                                                                                                                             | Why not a base                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[msmolkin/trading-replay-lab](https://github.com/msmolkin/trading-replay-lab)**                                                                                                                    | A deterministic historical trading game (Next.js, lightweight-charts). Sealed episodes, 1–50× leverage, anti-lookahead, a ledger hash per session. MIT | **The closest in spirit, and worth reading closely**: its anti-lookahead design (`docs/anti-lookahead.md`) and "blind start" episodes are exactly how our Market Replays should behave. But it's a trading game with no curriculum, coach or lesson structure, and it's a different stack. We borrow the ideas, with credit, not the code |
| [michaelsboost/ChartDojo](https://github.com/michaelsboost/ChartDojo)                                                                                                                                | A gamified pattern trainer: XP, streaks, quick challenges. MIT, no build step                                                                          | Quiz-style pattern recognition, so it's a feature, not a platform. Useful as a checklist of pattern drills                                                                                                                                                                                                                                |
| [punithraj21/Trade-learn-](https://github.com/punithraj21/Trade-learn-)                                                                                                                              | A Next.js reader for an 8-module, 60-chapter course in Markdown, with a 114-term glossary                                                              | A reading app with no interaction. The _structure_ (content as Markdown plus a manifest) matches our `content/` approach. The licence isn't stated, so we don't reuse its text                                                                                                                                                            |
| [aunkay/replay](https://github.com/aunkay/replay)                                                                                                                                                    | Market replay with React, lightweight-charts, FastAPI and yfinance                                                                                     | Needs a Python backend, and yfinance's data terms don't allow commercial redistribution                                                                                                                                                                                                                                                   |
| [dylanpersonguy/OpenCharts](https://github.com/dylanpersonguy/OpenCharts)                                                                                                                            | A self-hosted TradingView alternative: Next.js, Express, Postgres, Redis, CCXT                                                                         | A trading terminal. Far heavier than we need, and it pulls live exchange data                                                                                                                                                                                                                                                             |
| [p00rmanS/learntrading](https://github.com/p00rmanS/learntrading)                                                                                                                                    | An interactive notebook: candles, structure, risk, a position-size calculator, a quiz                                                                  | A good single-page primer, not a base                                                                                                                                                                                                                                                                                                     |
| [mikinty/Trading-Curriculum](https://github.com/mikinty/Trading-Curriculum), [rmcmillan34/algorithmic-trading-learning-roadmap](https://github.com/rmcmillan34/algorithmic-trading-learning-roadmap) | Curated reading lists                                                                                                                                  | Useful to check our coverage against, not code                                                                                                                                                                                                                                                                                            |

### Recommendation: build ours, adopt two libraries

None of these projects is a platform we could grow into ours. Each does one slice: a chart, a
quiz, a replay or a reader. None has what makes us different: a curriculum where every lesson is
a playable simulation, a coach that asks first, numbers that are checked, and African markets.
Forking would mean inheriting a stack and then rewriting most of it.

So:

1. **Keep our stack** (vinext on Cloudflare Workers, pure seeded engines, Neon). It's already
   deployed and checked.
2. **Adopt lightweight-charts** in the lesson player, with its attribution in the footer and on
   an About page.
3. **Use trading-signals as the answer key** for our indicator engines in `pnpm check`.
4. **Borrow trading-replay-lab's anti-lookahead rules** for Market Replays, credited in the code.
5. **Historical data needs a licence we can use commercially.** Not yfinance. It's to be decided
   before the Prove-it stage (candidates: exchange data from the GSE and NGX, central-bank FX
   series, a paid market-data API).

---

## Sources

- Zogo: [zogo.com](https://zogo.com/), [Credit unions](https://zogo.com/credit-unions),
  [CUInsight](https://www.cuinsight.com/transform-your-credit-unions-financial-education-with-zogo/),
  [200 partners](https://globalfintechseries.com/banking/digital-payments/gen-z-targeted-zogo-app-reaches-milestone-signing-200-financial-institution-partners/),
  [Forbes](https://www.forbes.com/sites/afdhelaziz/2021/07/13/how-zogo-is-revolutionizing-financial-literacy-for-gen-zand-how-brands-can-get-involved/)
- Brilliant: [ustwo case study](https://ustwo.com/work/brilliant/),
  [Rive](https://rive.app/blog/how-brilliant-org-motivates-learners-with-rive-animations),
  [pricing](https://brighterly.com/blog/brilliant-org-cost/),
  [review](https://skillscouter.com/brilliant-review-math-science-coding/)
- Duolingo: [StriveCloud](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo),
  [Ludaxis](https://www.ludaxis.io/blog/gamification-in-apps-duolingo-case-study-2026),
  [Propel](https://www.trypropel.ai/resources/blogs/duolingo-customer-retention-strategy)
- Khanmigo: [review and pricing](https://www.myengineeringbuddy.com/blog/khanmigo-reviews-alternatives-pricing-offerings/),
  [growth](https://aiforcause.org/stories/khanmigo-ai-tutor),
  [Freethink](https://www.freethink.com/consumer-tech/khanmigo-ai-tutor)
- Cleo: [Sacra](https://sacra.com/c/cleo/), [FinanceBuzz](https://financebuzz.com/cleo-review),
  [voice and memory](https://www.businesswire.com/news/home/20250729690058/en/Cleo-Becomes-the-First-AI-Money-Coach-That-Speaks-Thinks-and-Remembers)
- Finimize: [about](https://finimize.com/business/why-finimize/about-us),
  [growth](https://simonowens.substack.com/p/how-finimize-grew-to-over-1-million)
- SPENT: [Wikipedia](<https://en.wikipedia.org/wiki/Spent_(video_game)>),
  [Mechanics of Magic](https://mechanicsofmagic.com/2025/09/29/spent-a-game-on-poverty-in-america/)
- Simulators: [Investopedia simulator review](https://stockmarketgame.net/investopedia-simulator-the-ultimate-review),
  [Invstr](https://www.finder.com/uk/share-trading/share-trading-reviews/invstr),
  [cTrader Market Replay](https://www.fxstreet.com/press-releases/ctrader-market-replay-turns-market-history-into-a-trading-simulator-202609171418)
- Greenlight: [Level Up](https://greenlight.com/level-up-financial-literacy-game)
- Binance: [Learn & Earn](https://coinbrain.com/blog/binance-learn-and-earn-quiz-answers)
- Trading education: [Babypips](https://www.babypips.com/learn/forex/elementary),
  [Babypips review](https://takeprofitapp.com/en/learn/babypips-school-of-pipsology-review),
  [Chart Guessr](https://www.chartguessr.app/),
  [ReplayTrader](https://replaytrader.app/),
  [forex scams in Nigeria](https://rally.trade/en/blog/how-to-avoid-forex-scams-nigeria),
  [Telegram signals warning](https://www.fastbull.com/brokersview/news/two-telegram-forex-signals-groups-flagged-in-cysecs-warning-update-267900)
- GitHub and libraries: [lightweight-charts licence](https://github.com/tradingview/lightweight-charts/blob/master/LICENSE),
  [TradingView attribution](https://www.tradingview.com/free-charting-libraries/),
  [trading-replay-lab](https://github.com/msmolkin/trading-replay-lab),
  [ChartDojo](https://github.com/michaelsboost/ChartDojo),
  [Trade-learn-](https://github.com/punithraj21/Trade-learn-),
  [awesome-systematic-trading](https://github.com/paperswithbacktest/awesome-systematic-trading)
- Africa: [Cowrywise](https://cowrywise.com/blog/investment-apps-in-nigeria/),
  [Legit.ng](https://www.legit.ng/business-economy/money/1713403-piggyvest-risevest-8-top-10-investment-apps-nigeria-2026/),
  [Bamboo](https://learn.investbamboo.com/top-investment-apps-in-nigeria/),
  [MoneyAfrica](https://futureoflearning.cchub.africa/startup-directory/moneyafrica/),
  [Ladda](https://www.getladda.com/),
  [Chipper Cash](https://literalhumans.com/case-studies/chipper-cash-case-study/),
  [FinEd Ghana](https://www.jbklutse.com/ghana-startups-funding-2026/),
  [BezoMoney](https://www.techinafrica.com/bezomoney-empowering-ghanas-savings-culture-with-digital-solutions-and-financial-innovation/),
  [Susu](https://www.myjoyonline.com/beyond-mobile-money-the-quiet-struggle-to-modernize-ghanas-ancient-susu-system/),
  [Nigeria context](https://kudicompass.com/financial-literacy-nigeria-beginners-guide/),
  [Coronation on gamification](https://www.coronation.ng/insights/can-gamification-bridge-nigeria-s-financial-literacy-gap-/)
