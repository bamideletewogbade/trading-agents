# Monetization, community, and an honest review

Written 26 Sep 2026, after the marketing site, accounts and onboarding landed. It covers:

- how Sika Lab makes money without becoming the thing it teaches people to avoid;
- how the community ("the Floor") works;
- a candid rating of the idea, the gaps, and what to do next.

Prices here are **hypotheses to test in the pilot**, not decisions.

---

## 1. The rule every revenue line must pass

> **We only earn when the learner gets better, never when they trade more.**

That rules out:

- selling signals or "premium calls";
- revenue per trade from a broker;
- ads for trading platforms inside lessons;
- leaderboards ranked by profit;
- anything with a countdown.

It rules in:

- selling practice, feedback and structure;
- selling access to trustworthy people;
- selling proof of skill;
- selling the whole package to institutions that benefit from better-informed customers.

---

## 2. Revenue lines, in the order we'd switch them on

| #   | Line                  | Who pays                                             | Model                                                                                                                                                                   | When                                            |
| --- | --------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | **Pass**              | Learner                                              | Monthly or yearly, paid by MoMo, card or transfer (Paystack). Nothing renews silently, because MoMo has no silent debit, so every renewal is an ask                     | After the pilot proves the loop                 |
| 2   | **Mentor cohorts**    | Learner                                              | A 4-week cohort with a verified mentor: live replays, plan reviews, journal feedback. Revenue share with the mentor (starting hypothesis: 60% to the mentor, 40% to us) | With the Floor, phase B                         |
| 3   | **Institutions**      | Broker, bank, registrar, telco, university, employer | A white-label or co-branded roadmap per seat or per completion, with a learning report                                                                                  | Right after the pilot: the fastest real revenue |
| 4   | **Certification**     | Learner or employer                                  | Stage certificates free with a Pass; a proctored "Market Reader" exam as a paid product                                                                                 | Once stages 1–4 exist                           |
| 5   | **Sponsored lessons** | Exchanges, regulators, issuers                       | A clearly labelled lesson ("How the NGX works"). Never a product pitch; our editors keep final say                                                                      | Opportunistic                                   |
| 6   | **Insight reports**   | Regulators, institutions                             | Aggregate, anonymised "what retail investors understand" reports. Never individual data                                                                                 | Year 2                                          |

### Pass pricing hypotheses (to test, not to publish)

- **Anchors:**
  - Khanmigo is $4 a month.
  - Brilliant is about $14–28 a month.
  - Cleo's paid tiers are $5.99–14.99.
  - Local purchasing power is far lower than all of these.
  - Signals groups charge monthly fees our audience already pays.
- **Tests:**
  - Nigeria: three price points, e.g. ₦3,000, ₦5,000 and ₦8,000 a month, with yearly at about 8× monthly.
  - Ghana: GH₵40, GH₵60 and GH₵90.
- **Method:** a fake-door "Upgrade" in the desk, then a Van Westendorp price-sensitivity survey in the pilot, then real Paystack charges for a small cohort.
- **Free stays generous:** stage 1, IPO 101, noise vs signal, Risk Lab, and a weekly single lesson. Free is the marketing.

### The institution play is the Dangote moment

The IPO put millions of first-time investors in front of brokers and fintech platforms at once. Every
one of those platforms now has customers who don't know what allotment, oversubscription or a P/E
is.

IPO 101 is already built around the real offer, so it is a ready-made product to sell them, with
their logo on it. The next big IPO reuses it with a content change (`content/ipo.ts`).

**Who to call first:**

- the fintech platforms taking retail applications;
- registrars;
- universities with investment clubs.

### Broker referrals: not yet, and only on these terms

The natural next step after learning is opening a real account. If we ever refer:

- only after stage 3 (Risk first);
- more than one SEC-registered option, shown side by side;
- a flat fee per verified account, **never** per trade or per deposit;
- disclosed on the page.

Until then the desk shows the regulator's public list of registered operators, and nothing else.

---

## 3. The Floor: community without signals

Traders' communities today are signals groups. People join for the calls and stay for the people.
We keep the people and replace the calls with **reasoning in public**.

### What it is

| Feature              | What it does                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Breakdowns**       | Chart, thesis, stop and size, posted and **locked before the move**. The platform scores it afterwards on process: was the stop respected, was risk sized, did the thesis hold? Wins and losses both teach. |
| **Rooms**            | NGX/GSE, forex, crypto, commodities, IPOs. Moderated, on topic.                                                                                                                                             |
| **Replays together** | A weekly live session on a sealed historical chart: everyone writes a plan, then we press play.                                                                                                             |
| **Mentors**          | Verified, with a public on-platform track record of process scores. They teach their process in cohorts, and may not sell calls.                                                                            |
| **Process score**    | Reputation from following your own plan and explaining your reasoning. Profit is never ranked.                                                                                                              |
| **Study groups**     | Small groups sharing journals, private by default.                                                                                                                                                          |

### How it stays clean (built on what we already have)

1. **Every post goes to Jev** with a yes/no question: "Is this an instruction to buy or sell a real
   asset?" Clearly yes: blocked, with a note explaining why. Hedged (0.35–0.65): held for a person.
   Clearly no: posted.
2. **A second Jev question** checks for "account manager", managed accounts, pooled money,
   guaranteed returns, or contact details. Same bands.
3. **New members can't DM or post links.** DMs open with tenure and a clean record.
4. **Impersonation defence:** a public "our only official channels" page. We will be impersonated
   in WhatsApp groups ("Sika Lab signals") the week we get noticed.
5. **Scam patterns remove people.** They don't earn warnings.

### Phasing

- **A (pilot):** staff-posted breakdowns and the weekly replay session. Read and react only.
- **B:** members post breakdowns, study groups, the first 5 mentors, the first cohorts.
- **C:** rooms, reputation, mentor marketplace, the Floor on WhatsApp (digests only, within
  Meta's 2026 rules for AI on WhatsApp).

The founding-circle button on `/community` already records interest (the `community_interest`
event), so the size of that list is the go/no-go for phase A.

---

## 4. An honest review

### Rating: **7.5 / 10** as it stands. 9 if the gaps below are closed.

| Dimension               | Score | Why                                                                                                                                                                  |
| ----------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Problem and timing      | 9     | Real, painful and topical: inflation, the Dangote IPO, signals-group losses, regulators arresting illegal forex operators. People are asking right now.              |
| Differentiation         | 8     | Nobody in West Africa lets you _practise_ and feel consequences first. The engines, checks and "no look-ahead" discipline are genuinely hard to copy quickly.        |
| Product so far          | 7     | The first 3 minutes prove the idea (chart lesson, Risk Lab, IPO 101, noise vs signal, chat onboarding). But only 6 of 52 lessons are playable, across 4 experiences. |
| Monetization clarity    | 5     | Plausible lines, none proven. Willingness to pay for _education_ (vs signals) in NG/GH is the biggest unknown.                                                       |
| Execution risk          | 6     | A lot of interactive content is expensive to build. That's the real bottleneck, not tech.                                                                            |
| Trust and safety design | 9     | No signals, no AI touching money, numbers guarded, truth badges. This is the brand.                                                                                  |

### What makes the most sense

- **Practice before money.** "A flight simulator for trading" is clear, true and differentiating.
- **Riding the Dangote moment with IPO 101.** It's timely, shareable and sellable to platforms.
- **Risk first in the roadmap.** It's what separates us from every "learn forex" course.
- **Conversational onboarding with placement.** Experienced traders skip ahead; beginners aren't
  overwhelmed.
- **Community as reasoning, not calls.** It keeps the social pull of signals groups without the
  harm.

### Big gaps you may be missing

1. **Regulation and data protection.**
   - Education is fine, but mentors plus a community can drift into unlicensed investment advice.
     Get a Nigerian and a Ghanaian securities lawyer to review the Floor rules and mentor terms
     _before_ phase B.
   - Register with Nigeria's data protection commission (NDPA 2023) and Ghana's Data Protection
     Commission.
   - Get consent for cross-border storage: Clerk and Neon host outside both countries.
2. **The bridge to real money.** Learners will trade for real eventually. If we don't give them a
   responsible next step, the signals groups will. Build a "graduation" at the end of stage 3:
   - a safety checklist;
   - how to verify a broker on the regulator's list;
   - start small with a written plan;
   - keep journaling here.

   This is also where trust converts to revenue later.

3. **A content engine, not hand-built lessons.**
   - 52 interactive lessons at today’s pace is too slow.
   - Build lesson _primitives_ (chart + draggable level, indicator panel, order ticket, replay
     player) and a content format that composes them. Then a lesson is mostly `content/`, not code.
   - This is the single most important engineering investment next.
4. **Proof that people learn.**
   - Short pre/post checks per stage, built from the same engines.
   - Institutions buy outcomes ("customers who finished stage 3 made fewer margin calls"), not
     lessons.
   - It's also our honest answer to "does this work?".
5. **A retention loop that exists.**
   - The daily chart on WhatsApp, streaks that forgive, and "welcome back" from the coach are all
     designed. None is built yet.
   - Without them, onboarding completions leak by week two.
6. **Languages and low data.**
   - Pidgin first, then Yoruba, Hausa and Twi, for reach.
   - A lite mode (no 3D, no fonts, compressed charts) for people paying for every megabyte.
   - The 3D already skips Save-Data phones; a PWA install and offline lessons would help further.
7. **Historical data licensing.** Market replays need data we can use commercially (not yfinance).
   Decide the source before stage 7.
8. **Credibility of the teachers.**
   - An advisory panel with names people trust (a CFA charterholder, a licensed broker, a
     finance academic) and a visible review process for lessons.
   - In a market full of fake gurus, _who stands behind this_ matters as much as the product.

### Improvements, in priority order

1. Put Clerk keys in the dashboard and a working database in production, so accounts and
   profiles are real.
2. Push IPO 101 hard **before 13 October**: short videos of the calculator, WhatsApp-shareable
   result cards ("I'd get 190 shares, and here's what oversubscription does"), outreach to the
   fintech platforms taking applications.
3. Build the lesson primitives, then stages 1–3 on them.
4. Ship the daily chart on WhatsApp (templates only for opted-in dailies).
5. Floor phase A (staff breakdowns and the weekly replay), then lawyers, then phase B.
6. Pilot pricing: fake door, then a survey, then small real cohorts.
7. Pre/post learning checks, and a pitch deck for institutions built on them.
