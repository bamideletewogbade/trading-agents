# Product Specification

**Interactive AI Financial Learning & Decision Simulation Platform**

| | |
| --- | --- |
| Working title | TBD (see `docs/implementation-plan.md`, appendix A, for candidates) |
| Document type | Product / Business / Experience Specification |
| Audience | Product, design, content, research, AI, frontend and growth agents |
| Status | Foundational product specification |
| Primary market | Ghana → Nigeria → West Africa → broader Africa → global emerging-market learners |
| Primary platform | Mobile-first Web |
| Design inspiration | Binance-style financial interface language, adapted into an education-first experience |
| Technology stack | Deliberately unspecified here. The stack is chosen in `docs/implementation-plan.md` |

This is the product and business specification, not the engineering spec. It says what we are
building, why it exists, who it serves, what the experience should feel like, what business we
are creating, and what not to build. The Binance reference is visual inspiration, not something
to clone.

How to read it alongside the rest of the repo:

- `CLAUDE.md` is the index and the rules that are not negotiable.
- This file is the **why and what**. When the plan and this file disagree about the product,
  this file wins.
- `docs/implementation-plan.md` is the **how and in what order**.

---

## 1. Executive summary

We are building a mobile-first interactive financial learning platform that combines:

- AI tutoring
- interactive simulations
- practical decision-making
- generative/agentic UI
- visual learning
- 3D and motion media
- personalized learning paths
- instant feedback
- behavioral learning
- financial-market simulations
- progress and mastery systems
- localized African financial context

The product should not feel like an online course, a traditional LMS, a YouTube channel, a
trading signals group, a financial influencer community, a generic AI chatbot, a collection of
PDFs, or a static financial-literacy website.

The product should feel like:

> **A financial intelligence gym.**

Users come to practice thinking about money. They don't merely consume information. They:

learn → experiment → make decisions → see consequences → receive feedback → retry → improve.

The core product philosophy is:

> **Don't tell the learner what happens. Let them cause it to happen.**

---

## 2. The big product idea

Traditional financial education is overwhelmingly informational. A learner is told *"Leverage
increases exposure."* Then they answer *"What is leverage?"* That demonstrates recall. It does
not necessarily demonstrate understanding.

Our product should instead present:

> "You have $100. Choose your leverage."

The learner selects 5×. The system creates the position. The market moves. The learner sees the
result. Then the system asks:

> "What do you think would happen if we increased this to 20×?"

The learner changes the variable. The outcome changes. Now the learner has built an intuitive
mental model. This distinction is foundational.

### Product learning loop

Every major learning experience should aim toward:

```
SEE → TOUCH → PREDICT → ACT → CONSEQUENCE → FEEDBACK → EXPLAIN → RETRY
```

Rather than:

```
WATCH → READ → QUIZ → FORGET
```

---

## 3. Why now

### 3.1 Mobile financial infrastructure is already deeply embedded in Africa

Mobile money is no longer an experimental financial product.

GSMA reports that Africa had approximately 1.1 billion registered mobile-money accounts and 286
million active 30-day accounts in 2024, representing 53% and 56% of global registered and active
accounts respectively. Africa accounted for approximately $1.1 trillion in mobile-money
transaction value that year.

West Africa has been a major growth engine. GSMA reported that West Africa generated more than a
third of global new registered and active 30-day accounts in 2023, with Nigeria, Ghana and
Senegal among the major drivers.

The broader ecosystem continued expanding: GSMA reports that global mobile-money transactions
exceeded $2 trillion in 2025.

This matters because the product is not introducing digital financial behavior to a population
with no digital financial infrastructure. The infrastructure and behavior are already there.

**The opportunity is to add an intelligence layer.**

---

## 4. African market context

We should not build "an American financial education product with African colors." The product
must be designed around actual African financial realities, for example:

mobile money · bank transfers · informal businesses · side hustles · remittances · family
obligations · irregular income · inflation · currency depreciation · FX exposure · cross-border
payments · savings groups · small-business cash flow · school fees · rent · emergency funds ·
business inventory · agent/merchant businesses · digital payments · investing · entrepreneurship
· global remote income · diaspora income.

The product should recognize that the financial life of a Ghanaian, Nigerian, Kenyan or Ugandan
user may involve multiple currencies, income sources and obligations.

---

## 5. Important market insight

We should not define the market as *"People who want to trade forex."* That is too narrow and
potentially dangerous.

The broader market is:

> **People who want to become better at making financial decisions.**

Forex/trading can be one learning domain. It should not define the entire company. The platform
should eventually cover:

- **Personal finance:** budgeting, saving, debt, emergency funds, financial planning
- **Investing:** stocks, ETFs, bonds, funds, diversification, compounding
- **Markets:** forex, crypto, commodities, macroeconomics, market structure
- **Business:** pricing, margins, cash flow, inventory, working capital, unit economics
- **Entrepreneurship:** starting a business, evaluating opportunities, customer economics,
  business decisions
- **Financial psychology:** FOMO, overconfidence, loss aversion, impulsive decisions, risk
  perception, behavioral biases
- **Digital financial literacy:** mobile money, digital payments, scams, fraud awareness, account
  security

---

## 6. Product positioning

The initial positioning should be:

> **Learn money by actually using it.**

Alternative internal positioning:

> **A flight simulator for financial decisions.**

Pilots don't learn exclusively by reading about turbulence. They practice. Likewise, financial
learners should practice allocating money, managing risk, setting goals, evaluating investments,
responding to market movements, running a business, handling unexpected expenses and making
trade-offs, without having to lose real money.

---

## 7. The core differentiator

The differentiator is NOT *"We use AI."* Everyone will use AI. The differentiator is:

> **We turn financial concepts into interactive environments where the learner can manipulate
> the variables and experience the consequences.**

- AI makes the experience personalized.
- Simulation makes it practical.
- Memory makes it adaptive.
- Generative UI makes it dynamic.
- Motion/3D makes selected concepts memorable.

---

## 8. The AI tutor

The AI tutor is not primarily an answer machine. Its job is to help the user develop reasoning
ability. The tutor should prefer *"What do you think happens?"* over *"Here's the answer."* It
should use Socratic teaching where appropriate.

For example:

> **User:** "Should I use 20× leverage?"
>
> **Tutor:** "Before we answer that, let's test something. If your account is $500 and you
> control a $10,000 position, what happens to your account if the position moves 3% against
> you?"

Then launch an interactive simulation. The tutor should teach through questions, experiments and
consequences.

---

## 9. Generative UI

The product should incorporate the broader emerging pattern of agentic / generative UI.

Modern agent interfaces can render interactive cards, forms, lists and actions directly within
conversational experiences. OpenAI's ChatKit documentation, for example, supports widgets that
can trigger backend actions and update the conversation UI. MCP Apps is also emerging as a
standardized mechanism for delivering interactive UI from AI tools, including charts,
dashboards, forms and richer media such as 3D models.

These trends validate an important product direction:

> **The AI conversation should be capable of summoning an interactive learning experience instead
> of merely producing text.**

### Critical rule

The AI should NOT freely invent the application's visual system. **The platform owns the design
system. The AI selects and configures approved experiences.**

---

## 10. Controlled generative UI

Think of the platform as having an **Experience Registry**. Possible experiences:

interactive chart · market simulator · risk simulator · portfolio builder · budget simulator ·
compounding calculator · scenario card · decision tree · quiz · drag-and-drop exercise ·
flashcards · timeline · comparison · business simulator · cash-flow simulator · 3D learning
world · animated explanation · interactive story · challenge · reflection exercise.

The AI can choose *"Show a risk simulation."* It should not generate arbitrary UI code. This
preserves quality, consistency, safety, accessibility, performance, brand identity and
predictable behavior.

---

## 11. The product shell

The main product should remain stable. The dynamic experiences live inside it.

Primary mobile navigation:

```
Home | Learn | Practice | Progress | Coach
```

- **Home:** personalized dashboard.
- **Learn:** curriculum and discovery.
- **Practice:** simulations and challenges.
- **Progress:** mastery, streaks, skills and history.
- **Coach:** AI tutor and personalized guidance.

---

## 12. Mobile-first principle

The mobile experience is the canonical experience. Desktop should be an expansion of mobile. Do
not design desktop first and squeeze it down. Target a comfortable experience around small
modern smartphone screens.

The product should work for users with inexpensive Android phones, limited bandwidth,
intermittent connectivity, small screens, touch interaction and reduced processing power.

---

## 13. Mobile UX principles

Every interaction should answer:

> **Can I do this comfortably with one thumb?**

Use: large touch targets, bottom sheets, swipe gestures where useful, short cards, progressive
disclosure, large numbers, simple charts, minimal typing, voice interaction where appropriate.

Avoid: dense desktop tables, tiny controls, excessive navigation, long forms, unnecessary
typing, tiny charts, information overload.

---

## 14. Design language

Use Binance-style financial-product aesthetics as inspiration, not as a literal clone. The
desired design language is dark-first, sophisticated, financial, modern, high information density
where useful, clean, sharp, premium, technically credible, and visually exciting without becoming
childish.

Binance's recent redesign emphasizes a darker "Midnight Black" direction, cleaner typography,
personalization and accessibility; those characteristics are useful reference points. Binance has
also explicitly worked on color-vision accessibility, including alternative chart palettes,
because red/green trading conventions can create accessibility problems.

We inherit that lesson:

> **Never rely on color alone to communicate financial outcomes.**

---

## 15. Visual system

| Role | Direction |
| --- | --- |
| Background | Near-black / charcoal |
| Surfaces | Dark gray-blue panels |
| Primary accent | Warm yellow/gold (Binance-inspired) |
| Positive state | Green/teal, supplemented by icons and labels |
| Negative state | Red/orange, supplemented by icons and labels |
| Neutral | Blue/gray |
| Educational highlight | Yellow/gold |

The product should feel like **financial terminal meets premium game interface meets modern
education platform.** Not **crypto casino.**

---

## 16. Motion design

Motion is a learning tool. It is not decoration. Use motion when it communicates cause and
effect, progression, transformation, scale, time, risk, growth or feedback.

Examples:

- **Compounding:** a small tree gradually grows.
- **Risk:** a safe zone expands/contracts.
- **Portfolio:** assets move around a portfolio center.
- **Market structure:** price moves through a dynamic landscape.
- **Cash flow:** money flows through business nodes.

---

## 17. 3D strategy

3D should be selective. Do NOT turn the entire application into a 3D game.

> **80% normal interface, 15% motion/2D visualization, 5% high-impact 3D.**

3D is justified when spatial representation makes a concept easier to understand.

- **Good uses:** market landscapes, portfolio worlds, compounding, risk environments, business
  simulations, economic systems, virtual stores/businesses, progression environments.
- **Bad uses:** navigation, basic definitions, simple quizzes, account settings, ordinary
  dashboards.

---

## 18. Interactive lesson structure

Every major lesson should follow a reusable structure:

1. **Hook.** A short practical question: *"You have GH₵1,000. What would you do with it?"*
2. **Visual explanation.** Show the concept.
3. **Interactive manipulation.** Allow the user to change variables.
4. **Prediction.** Ask what they think will happen.
5. **Action.** Let them make a decision.
6. **Consequence.** Show the result immediately.
7. **Explanation.** Explain why.
8. **Retry.** Allow experimentation.
9. **Mastery challenge.** Give a new scenario.
10. **Reflection.** Ask the learner to explain their reasoning.

---

## 19. Example: leverage lesson

Instead of *"Leverage allows traders to control larger positions,"* create:

- Starting state: capital $100, leverage 5×, position $500.
- Provide a slider. The user moves 5× → 10× → 20× → 50×.
- The simulation changes exposure, P/L sensitivity, margin requirements, risk indicator and
  drawdown.
- Then: *"The market moves against you by 3%."* User presses **SIMULATE**. The system calculates
  the result.
- Then asks: *"Would you still choose 20×?"* The user must explain why. The tutor responds.

This is the desired product experience.

---

## 20. Example: position sizing

Give the user account size, risk limit, entry and stop loss. Ask: *"Choose your position size."*
The learner drags a slider. The system shows Risk: 0.4% … Risk: 1.0% … Risk: 2.7%. The visual
changes. The learner sees the consequence.

Then the system introduces a second scenario. The learner must repeat the concept without
assistance. This creates actual skill transfer.

---

## 21. Example: personal finance

Scenario: *"You earn GH₵6,000 per month."* Expenses: rent, food, transport, family support,
data, entertainment, debt. The learner allocates income.

Then: *"Your phone breaks."* Unexpected expense: GH₵1,500. The learner must decide: borrow,
reduce spending, use savings, sell an asset, or delay another expense. The system demonstrates
the consequences.

This teaches emergency funds more effectively than a definition.

---

## 22. African contextualization

The platform should use local currencies and scenarios.

- **Ghana:** GH₵, mobile money, bank transfers, local business examples, school fees, rent,
  family support, remittances.
- **Nigeria:** ₦, transfers, fintech wallets, informal commerce, side businesses, inflation, FX
  considerations.
- **Kenya:** KSh, mobile money, small businesses, savings/investment scenarios.

The system should never assume that "African users" have one financial reality. Localization
must be country-specific where possible.

---

## 23. Localization beyond currency

Localization includes currency, terminology, examples, income patterns, business models, payment
behavior, cultural context, financial obligations, regulatory environment, common scams and local
investment products.

Do not simply translate English into another language and call it localization.

---

## 24. African business simulations

This is a major opportunity. Create realistic simulations around:

- **Mobile money agent.** Variables: float, transaction volume, commissions, rent, cash
  availability, fraud, downtime. Goal: *maximize sustainable profit while maintaining
  liquidity.*
- **Small retail shop.** Variables: inventory, pricing, demand, supplier credit, spoilage, cash
  flow.
- **Food business.** Variables: ingredients, pricing, customer demand, wastage, delivery costs.
- **Freelance business.** Variables: clients, FX income, platform fees, taxes, expenses,
  savings.

This makes financial education immediately relevant.

---

## 25. Learning domains

Initial content architecture:

| Track | Topics |
| --- | --- |
| A — Money Fundamentals | income, expenses, budgeting, saving, emergency funds, debt, inflation |
| B — Investing | compounding, diversification, risk, asset classes, portfolio construction |
| C — Markets | market structure, price, liquidity, volatility, technical analysis, macroeconomics |
| D — Trading | position sizing, stop losses, leverage, risk/reward, journaling, probability |
| E — Business | revenue, costs, margins, cash flow, inventory, pricing, unit economics |
| F — Financial Psychology | FOMO, overconfidence, loss aversion, revenge behavior, impulsive decisions, confirmation bias |

---

## 26. Important: trading education boundary

The platform should teach users to understand markets. It should not become *"AI tells you what
trade to take."*

The core product should emphasize education, simulation, risk management, decision-making,
journaling, historical analysis and probabilistic thinking.

Avoid positioning the product as a guaranteed-money system. The product should actively teach
that market outcomes are uncertain.

---

## 27. Personalization

Every user should eventually have a Learning Profile:

```
USER
 ├── knowledge
 ├── skills
 ├── goals
 ├── completed lessons
 ├── failed concepts
 ├── successful concepts
 ├── decision patterns
 ├── preferred learning styles
 ├── confidence
 └── current learning trajectory
```

Do not expose sensitive internal labels unnecessarily. The system should translate this into
useful user-facing language, for example:

> "You've improved significantly at position sizing. Your next challenge is managing risk when
> market conditions change."

---

## 28. Mastery model

Do not measure learning simply as *"Completed lesson."* Instead track:

| Level | Question |
| --- | --- |
| Exposure | Did they see it? |
| Interaction | Did they manipulate it? |
| Understanding | Could they explain it? |
| Application | Could they solve a new scenario? |
| Transfer | Could they apply it in a different context? |
| Retention | Can they still do it later? |

A learner should only be considered highly proficient after demonstrating transfer.

---

## 29. Practice mode

Practice should be separate from lessons. Examples:

- "You have 60 seconds to construct a portfolio."
- "Keep risk below 1%."
- "Your business has lost 20% of revenue. What do you change?"
- "Inflation rises. What happens to your savings strategy?"

Practice should feel like a game, but the underlying objective is skill development.

---

## 30. Challenges

Create daily/weekly challenges.

- **Daily:** "Build a budget with GH₵5,000."
- **Weekly:** "Complete three risk simulations."
- **Monthly:** "Build a diversified hypothetical portfolio."

Avoid challenges that imply users should risk real money.

---

## 31. Progress system

Users should see concepts mastered, current streak, skills improving, weak areas, completed
simulations, practice performance, confidence and learning velocity.

Avoid turning the entire experience into meaningless XP farming. Gamification should reinforce
learning.

---

## 32. Social layer

Potential future features: challenges, leaderboards, cohorts, study groups, friend competitions,
community simulations, mentor sessions.

But community should not become a signal-selling or hype ecosystem. The goal is:

> **Learning together, not copying trades.**

---

## 33. AI coach personality

The coach should be intelligent, calm, encouraging, practical, direct, occasionally playful,
never condescending, and never hype-driven.

Avoid:

> "BROOO THIS TRADE IS ABOUT TO EXPLODE 🚀🚀🚀"

Prefer:

> "Interesting decision. Let's test what happens if volatility increases."

---

## 34. Voice

Voice should eventually be supported. This is particularly useful for explanations, coaching,
accessibility, hands-free learning, and users who prefer speaking to typing.

A learner could say *"Explain this to me like I'm new."* The coach responds verbally. Then:
*"Give me a challenge."* The interactive experience opens.

---

## 35. AI agent roles

The product should conceptually contain several specialized agents.

| Agent | Responsibility |
| --- | --- |
| Learning Agent | What should be taught, appropriate difficulty, lesson progression |
| Tutor Agent | Explanations, hints, Socratic questions, feedback |
| Simulation Agent | Scenarios, variables, challenges, consequences |
| Assessment Agent | Understanding, application, transfer, mastery |
| Research Agent | Current information, external data, references, research tasks |
| Behavioral/Progress Agent | Learning patterns, recurring mistakes, improvement |
| Safety Agent | Financial-risk boundaries, harmful content, unsafe recommendations, inappropriate claims |

**Decision/Orchestration Layer.** A low-cost decision system such as Jev may eventually
determine which agent to use, whether an LLM is needed, which model class is appropriate, whether
to use UI, whether to escalate, and whether to perform the task asynchronously.

The product should not depend on any particular model vendor.

---

## 36. The Experience Registry

The AI should have a controlled set of experiences:

```
explanation        interactive_chart   market_simulator   risk_simulator
budget_simulator   portfolio_builder   business_simulator decision_tree
quiz               drag_drop           scenario           calculator
timeline           flashcards          3d_world           challenge
reflection         progress_card
```

Each experience should have: purpose, supported inputs, supported outputs, difficulty range,
mobile behavior, accessibility behavior, educational objectives, allowed actions.

---

## 37. AI should compose, not invent

The model can decide *"Use the risk simulator."* It can configure *account = 500, risk limit =
1%.* But the simulator owns calculations, interaction logic, visual behavior, accessibility and
validation.

**This is a non-negotiable product principle.**

---

## 38. Deterministic learning physics

Whenever a result can be calculated deterministically, do not ask an LLM to calculate it.
Examples: percentages, position size, compounding, budgets, cash flow, portfolio weights,
scenario outcomes.

> **AI explains. Code calculates.**

This makes the product cheaper, faster, more reliable and easier to test.

---

## 39. Contextual AI

The AI should not receive the entire user's history every time. The system should assemble only
the relevant context.

Example: the user asks *"Why was that a bad decision?"* Relevant context might be the scenario,
their selected answer, previous related mistakes and the current learning objective. Not their
entire conversation history.

This is important for cost, speed, privacy and accuracy.

---

## 40. Personal learning memory

The platform should remember useful learning information, for example:

- "User struggles with percentage calculations."
- "User understands definitions but struggles with application."
- "User performs well in calm market scenarios but struggles under volatility."

These should be treated as learning signals, not permanent judgments about the person.

---

## 41. Async intelligence

Some experiences do not need instant responses. Example: *"Analyze my last six months of
simulated trades."* Instead of making the user wait: *"Your analysis is being prepared."* Then
produce patterns, charts, recurring mistakes, improvement opportunities and suggested practice.

This reduces pressure on real-time systems and creates a richer experience.

---

## 42. Cost optimization principle

> **Do not use expensive intelligence unless it improves the outcome.**

Conceptual hierarchy, escalating only when necessary:

1. Deterministic logic
2. Cache
3. Cheap decision/routing model
4. Small model
5. Medium model
6. Frontier reasoning

---

## 43. Monetization philosophy

We should not build a product where monetization depends on exploiting financial anxiety.

Do not sell fake signals, promise returns, manufacture urgency, encourage risky trading, sell
"secret strategies", or monetize fear.

The business should make money from better learning and deeper utility.

---

## 44. Monetization model

Use a hybrid model.

**Free.** Enough value to create habit. Free users should have access to basic lessons, selected
simulations, basic AI tutoring, progress tracking and limited daily practice. The free product
should be genuinely useful. It should not be a fake trial.

---

## 45. Premium

Premium unlocks unlimited AI coaching, advanced simulations, deeper personalization, advanced
progress analytics, advanced market simulations, 3D experiences, advanced practice, personalized
learning plans, long-term behavioral analysis and advanced business simulations.

---

## 46. Premium positioning

Do not sell *"More content."* Sell:

> **A personal financial learning coach.**

The user pays for personalization, practice, feedback, depth, intelligence and progress.

---

## 47. Potential pricing strategy

Do not assume US pricing. Develop localized purchasing power.

| Tier | Idea |
| --- | --- |
| Free | $0 |
| Starter | Low-cost local monthly subscription |
| Pro | Higher tier for serious learners |
| Family | Multiple learners |
| Career/Business | Advanced professional content |

Pricing should be validated experimentally.

Khan Academy provides a useful benchmark: Khanmigo is listed at $4/month or $44/year for
individual learners/parents in the U.S., while Brilliant uses a free-to-paid model where Premium
unlocks unlimited lessons and its AI tutor. These benchmarks show that users can understand AI
tutoring as a paid layer, but our African pricing must be independently tested rather than
simply converted from U.S. prices.

---

## 48. Family plan

> **One subscription → household learning.**

Useful for parents, teenagers, siblings and couples. Each user gets a separate profile, separate
progress and separate AI memory.

---

## 49. Group / community plan

Potential customers: trading communities, universities, bootcamps, entrepreneurship programs,
youth organizations, financial institutions, NGOs, employers. They purchase seats.

---

## 50. B2B / institutional

This could eventually be a major revenue stream.

| Customer | Use |
| --- | --- |
| Banks | Financial-literacy programs |
| Fintechs | Customer education |
| Brokerages | Risk education and onboarding |
| Universities | Financial-literacy curriculum |
| Employers | Employee financial wellness |
| NGOs | Financial inclusion programs |
| Governments / development organizations | Financial-literacy initiatives |

Khan Academy's institutional model demonstrates that AI-assisted learning can also be packaged
around organizations, with district products including reporting, personalized support and
administrative functionality.

---

## 51. Financial-institution partnerships

Long-term opportunity: a bank could sponsor *"Money Skills for Young Ghanaians,"* a fintech could
sponsor *"Digital Finance Academy,"* a brokerage could sponsor *"Market Fundamentals."*

But sponsored education must be clearly identified. We should never allow sponsors to secretly
influence educational conclusions.

---

## 52. Certification

Eventually users could earn: Financial Foundations, Investment Foundations, Trading Risk
Fundamentals, Small Business Finance, Entrepreneurship Finance.

Certificates should represent actual demonstrated mastery. Not *"Watched 12 videos."*

---

## 53. Premium digital products

Additional monetization: advanced courses, specialized simulation packs, professional
assessments, certificates, mentorship, cohort programs, premium challenges, career pathways.

---

## 54. Human mentor marketplace

Potential later-stage product. The AI identifies *"This learner would benefit from human
coaching,"* then offers *Book a mentor session.* Revenue model: commission, subscription,
marketplace fee. Human mentors must be vetted.

---

## 55. No advertising in core learning

Advertising should not be central. Especially avoid financial-product advertising that could
compromise trust. **The product's moat is trust.**

---

## 56. Data monetization

Do NOT build the business around selling individual financial/behavioral data. User learning
data should be treated as sensitive.

If aggregated research products are ever considered, they should be genuinely aggregated,
privacy-preserving, legally reviewed, transparent, and opt-in where appropriate.

Trust is more valuable than short-term data revenue.

---

## 57. Growth strategy

The growth loop should be:

```
Learn → achieve → share → invite → practice together
```

Users should be able to share *"I completed the Risk Challenge."* Not *"I made 400% trading this
week."* The latter creates the wrong culture.

---

## 58. Social content loop

The platform can automatically generate shareable learning moments, for example *"I just learned
why leverage can amplify losses,"* with a beautiful visual, shareable to WhatsApp, Instagram,
TikTok, X and LinkedIn.

The shared content should educate rather than promote unrealistic financial outcomes.

---

## 59. WhatsApp as a growth / access channel

Because of the importance of mobile communication in African markets, WhatsApp should be
considered as a potential acquisition and lightweight interaction channel. Possible interactions:

- "Send me today's challenge."
- "Explain inflation."
- "Give me a 5-minute money exercise."

The full interactive simulation should preferably open into the Web product. WhatsApp becomes:

> **notification + entry point + conversational layer**

rather than necessarily being the entire application.

---

## 60. Content strategy

The content engine should prioritize:

- **Short:** 5–10 minute experiences.
- **Interactive:** at least one decision.
- **Practical:** connected to real-world situations.
- **Progressive:** beginner → intermediate → advanced.
- **Reusable:** concepts should be remixable across contexts.

---

## 61. Content authoring

Eventually an educator should be able to describe *"Teach a beginner how emergency funds work."*
The system generates a draft: objective, explanation, simulation, questions, challenge, feedback,
assessment. A human reviews it. Only then does it become production content.

AI-generated educational content should not automatically become canonical.

---

## 62. Content quality standard

Every lesson should answer:

1. What should the learner understand?
2. What should the learner be able to do?
3. What decision will they practice?
4. What consequence will they observe?
5. What misconception might they have?
6. How will we detect it?
7. How will we correct it?
8. How will we test transfer?

---

## 63. "Cool" must have a purpose

The product should look cool. But aesthetics cannot substitute for learning. Every animation
should answer:

> "What does this help the learner understand?"

If there is no answer: remove it.

---

## 64. The product should feel alive

The environment should respond to users.

- User improves → visual environment becomes richer.
- User completes a track → unlock a new world.
- User struggles → coach changes teaching style.
- User returns after a week → *"Welcome back. Let's pick up where you left off."*

This creates emotional continuity.

---

## 65. Progression worlds

Instead of only a course list, create a visual progression:

```
FOUNDATIONS → MONEY → RISK → INVESTING → MARKETS → BUSINESS → FINANCIAL INTELLIGENCE
```

Each world contains lessons, simulations, challenges and mastery gates.

---

## 66. The "Lab" concept

Major topics should have a laboratory:

- **Risk Lab:** experiment with risk.
- **Market Lab:** experiment with price.
- **Portfolio Lab:** experiment with allocation.
- **Business Lab:** run a virtual business.
- **Money Lab:** manage a virtual monthly income.

This terminology reinforces experimentation.

---

## 67. The "Decision Journal"

Users should eventually have a private decision journal. They can record *"I thought X would
happen because Y."* Later: *"What actually happened?"* This is extremely valuable for developing
decision quality.

The AI can identify repeated assumptions, overconfidence, inconsistent reasoning and
improvements, without shaming the learner.

---

## 68. The "What If?" engine

This could become one of the platform's signature features. Any major decision can branch into
*"What if I changed X?"*

- "What if I saved 10% instead of 5%?"
- "What if inflation were 15%?"
- "What if sales dropped 30%?"
- "What if my stop loss were twice as far?"
- "What if I diversified?"

The user explores alternate realities. This is exactly where interactive UI and simulation shine.

---

## 69. AI + simulation loop

```
AI explains
  ↓
Simulation demonstrates
  ↓
User changes variable
  ↓
Simulation responds
  ↓
AI observes
  ↓
AI asks question
  ↓
User answers
  ↓
Assessment updates mastery
  ↓
Next scenario adapts
```

This is the heart of the product.

---

## 70. Business model flywheel

```
FREE USERS → LEARN → PRACTICE → BUILD HABIT → SEE PROGRESS → UPGRADE
  → DEEPER PERSONALIZATION → BETTER OUTCOMES → RETENTION → REFERRALS
```

Then:

```
INDIVIDUALS → FAMILIES → COMMUNITIES → INSTITUTIONS → FINANCIAL PARTNERS
```

---

## 71. Retention strategy

Retention should not rely exclusively on streaks. The strongest retention mechanism should be:

> **"I am actually getting better."**

Users should return because they want to improve, the system remembers them, challenges adapt,
their progress matters, and they want to test themselves. Streaks are secondary.

---

## 72. Success metrics

Do not make DAU the primary north-star metric. Possible north-star:

> **Weekly Demonstrated Learning Events**

A demonstrated learning event occurs when a learner completes a simulation, makes a decision,
receives feedback, and successfully applies the concept.

| Metric | Definition |
| --- | --- |
| Activation | Percentage completing first interactive lesson |
| Learning engagement | Interactive sessions/week |
| Mastery | Concepts demonstrated successfully |
| Retention | Week 1 / Week 4 / Week 12 |
| Monetization | Free → paid conversion |
| Revenue | ARPU / LTV |
| Learning efficiency | Time to mastery |
| AI efficiency | Cost per successful learning event |

---

## 73. Important AI metric

Track **cost per demonstrated learning outcome**, not cost per message. This prevents us from
optimizing for cheap conversations instead of useful learning.

---

## 74. Quality metrics

Measure answer accuracy, simulation correctness, pedagogical quality, learner comprehension,
task completion, hallucination rate, inappropriate advice rate, escalation rate and user
correction rate.

---

## 75. Business risks

| # | Risk | Mitigation |
| --- | --- | --- |
| 1 | "It's just ChatGPT with pretty charts." | Build proprietary simulations and learning systems. |
| 2 | Too much visual novelty. | Design around learning objectives. |
| 3 | Users want quick money, not education. | Position around financial intelligence, not get-rich-quick outcomes. |
| 4 | AI hallucination. | Use deterministic calculations and controlled content. |
| 5 | AI costs become excessive. | Caching, routing, small models, deterministic logic, asynchronous workflows. |
| 6 | Mobile performance. | Progressive loading and selective 3D. |
| 7 | Users don't pay. | Validate willingness to pay early. Do not build an enormous paid ecosystem before validating demand. |

---

## 76. Product principles

These principles are non-negotiable.

1. Teach through consequences.
2. Interaction beats passive consumption.
3. AI explains; deterministic systems calculate.
4. AI composes approved experiences rather than inventing arbitrary UI.
5. Mobile first. Always.
6. Africa is the starting context, not a marketing skin.
7. Financial education before financial action.
8. Never manufacture financial hype.
9. 3D must earn its place.
10. The product should feel premium without requiring premium hardware.
11. Personalization should improve learning, not manipulate users.
12. Trust is a core product feature.

---

## 77. MVP

The first product should NOT attempt to build the entire vision. The MVP should prove one
hypothesis:

> **People will prefer interactive financial learning over passive financial content.**

Build approximately:

- 3 learning domains: Money fundamentals, Risk, Markets
- 10–20 interactive lessons
- 5–8 simulation primitives
- AI tutor
- Basic learner memory
- Basic progress
- Mobile-first Web
- One signature 3D experience
- One practice mode
- One daily challenge
- Free + premium experiment

---

## 78. MVP signature experience: the Financial Decision Simulator

Build one experience that makes people say *"I've never learned finance like this."*

Give the user a fictional monthly income. Then introduce events: salary received, rent due,
family emergency, business opportunity, market opportunity, unexpected expense, inflation
changes. The learner makes decisions. The system maintains a simulated financial life.

At the end: *"Here's how your decisions shaped your financial position."*

This could become the platform's iconic demo.

---

## 79. Second signature experience: Risk Lab

A visual environment where users manipulate capital, position size, leverage, stop loss,
volatility and probability. Then see expected outcomes, drawdown, risk and survival probability.
The learner can repeatedly experiment.

---

## 80. Third signature experience: Business Lab

Give the user a virtual Ghanaian/Nigerian small business. They control pricing, inventory, staff,
marketing, cash and debt. The market responds. This broadens the platform beyond trading.

---

## 81. Design agent instructions

The design agents should create a formal design brief before large-scale UI production. The
brief should specify: visual atmosphere, color system, typography, spacing, card system,
navigation, buttons, status indicators, charts, animations, 3D usage, accessibility, mobile
breakpoints, interaction principles.

The design brief should be the source of truth for all subsequent agents. A structured design
brief can establish the visual system before parallel agents build individual pages, reducing
visual inconsistency.

---

## 82. Design anti-patterns

Do NOT create: generic SaaS purple gradients, excessive glassmorphism, random neon colors, huge
hero sections, stock-finance imagery, generic AI robot illustrations, excessive rounded cards,
dashboard clutter, desktop-first layouts, fake trading screenshots, "Lambo" imagery,
get-rich-quick visual language, excessive 3D.

The product should feel **credible + modern + energetic + intelligent.**

---

## 83. Accessibility

Color should never be the only signal. Use labels, icons, patterns, numbers, text and alternative
palettes. Binance's work on color-vision deficiency is a useful precedent for financial
interfaces that don't rely exclusively on red/green semantics.

Motion should respect reduced-motion settings. Interactive controls should have accessible
labels.

---

## 84. Trust design

Users should always know whether something is educational, simulated, real, historical,
hypothetical, AI-generated, or current market information. The UI should explicitly distinguish
them, for example:

```
SIMULATION    HYPOTHETICAL    HISTORICAL DATA    EDUCATIONAL ONLY
```

Do not blur these states.

---

## 85. Real-money boundary

The initial platform should focus on simulated decisions. If real financial actions are ever
introduced, they should be clearly separated from education.

The product should not quietly transition **learning → trading** without explicit user action and
appropriate safeguards.

---

## 86. Long-term vision

The ultimate product is not a course platform. It is a:

> **PERSONAL FINANCIAL INTELLIGENCE SYSTEM**

It understands what you know, what you don't know, what you're practicing, what decisions you
make, where you struggle, and how your reasoning improves. And it creates personalized
experiences to help you become better.

---

## 87. Future product surface

Eventually the user could say *"I want to get better with money."* The system responds *"Let's
find out where you are,"* then generates an assessment. From that, **your financial intelligence
map**:

```
Money fundamentals      ████████░░
Risk management         ██████░░░░
Investing               ████░░░░░░
Business finance        ███████░░░
Market knowledge        ███░░░░░░░
Decision discipline     █████░░░░░
```

Then: *"I recommend starting with Risk Lab."* The platform becomes an adaptive curriculum rather
than a static course catalog.

---

## 88. The ultimate interface

The long-term product should feel like ChatGPT + Brilliant + a financial simulator + a game
world + a personal coach, but should not simply copy any of them. The unique combination is:

> **AI conversation + interactive financial simulations + localized African scenarios +
> persistent learning memory + adaptive practice.**

---

## 89. Competitive logic

Existing products validate pieces of the model.

- **Brilliant** demonstrates the value of interactive learning and now combines it with an
  embedded AI tutor. Its Premium offering includes interactive lessons, unlimited practice and
  access to its AI tutor, Koji.
- **Khanmigo** demonstrates that AI tutoring can be monetized as a separate layer around
  educational content, listing $4/month or $44/year for individual learners/parents in the U.S.
- **Duolingo** demonstrates the scale of a freemium learning model, with paid subscriptions
  supplemented by advertising and in-app purchases; its 2025 filing reported approximately 12.2
  million paid subscribers at year-end.

Our opportunity is to combine the strongest lessons:

| Source | Lesson |
| --- | --- |
| Duolingo | habit + freemium + progression |
| Brilliant | interactive learning |
| Khanmigo | personalized AI tutoring |
| Agentic UI | dynamic interfaces inside conversation |
| Simulation | practical decision-making |
| African fintech ecosystem | local relevance and distribution |

---

## 90. What we should not copy

Do not copy Binance's exact UI, Brilliant's exact course structure, Duolingo's gamification,
Khanmigo's interface, any influencer's personality, or any trading guru's business model.

We are borrowing validated principles, not identities.

---

## 91. Business model evolution

```
Phase 1: B2C learning subscription
Phase 2: Premium AI coach
Phase 3: Family + group plans
Phase 4: Institutional learning
Phase 5: Financial wellness partnerships
Phase 6: Certification + career pathways
Phase 7: Simulation/learning infrastructure for other organizations
```

The long-term company could therefore evolve from a **consumer education product** into a
**financial intelligence platform**.

---

## 92. Potential platform business

Eventually other organizations could use the learning engine. For example, a bank wants *"Build
a financial-literacy simulator for university students."* Instead of building it themselves, they
use our platform.

- They provide: brand, content requirements, target audience.
- We provide: simulation engine, AI tutor, experience engine, assessment, analytics.

This could create a B2B platform business.

---

## 93. Data flywheel

With appropriate privacy controls:

```
MORE LEARNING → MORE INTERACTIONS → MORE LEARNING SIGNALS → BETTER PERSONALIZATION
  → BETTER EXPERIENCES → BETTER RETENTION → MORE LEARNING
```

The moat becomes content + simulations + learning data + personalization + experience library.
Not merely the underlying AI model.

---

## 94. Content moat

Over time we should accumulate thousands of interactive scenarios, hundreds of simulation
primitives, localized examples, misconceptions, assessment patterns, teaching strategies and
difficulty models.

A competitor can call the same LLM. They cannot instantly recreate years of interactive
educational content and behavioral learning data.

---

## 95. The real moat

> **A structured model of how people learn financial decisions through simulation.**

The company should own:

| Graph | Question it answers |
| --- | --- |
| Content graph | What concepts connect? |
| Skill graph | What abilities must be mastered? |
| Simulation graph | What scenarios teach them? |
| Learner graph | What does this user understand? |
| Experience graph | Which interaction works best for which concept? |

That becomes a proprietary intelligence layer.

---

## 96. Claude agent building rule

Agents should not interpret this document as *"Build everything."* They should interpret it as
*"Build toward this product vision while preserving the principles."*

Every implementation decision should be tested against:

1. Does this improve learning?
2. Does this improve practical understanding?
3. Does this work on mobile?
4. Does this strengthen trust?
5. Does this fit the design system?
6. Does this avoid unnecessary complexity?
7. Does this have a business reason to exist?

If the answer is no: **do not build it.**

---

## 97. First build sequence

Agents should conceptually proceed in this order:

1. Create the product shell.
2. Create the design system.
3. Create the lesson framework.
4. Create one interactive simulation.
5. Create AI tutoring around that simulation.
6. Create progress/mastery.
7. Create additional simulations.
8. Create the first 10–20 lessons.
9. Add personalization.
10. Add monetization.

Do not build advanced features before the core learning loop feels exceptional.

---

## 98. The first demo must be powerful

When someone opens the product for the first time, they should experience the thesis within
minutes. Not *"Create your account," "Watch orientation video," "Choose a course."*

Instead: *"Let's test how you think about money."* Then launch a scenario. The user makes a
decision. The environment reacts. AI explains. User tries again. Then: *"Want another one?"*

**That is the product.**

---

## 99. Final product thesis

> **We help people become better financial decision-makers by letting them practice financial
> decisions in interactive simulations with an AI coach.**

The product is not a chatbot, not a course, not a trading platform, not a financial influencer
community.

It is **a financial intelligence gym.** Users don't come merely to consume information. They come
to practice thinking. They experiment without risking real money. They receive immediate
feedback. The AI remembers where they struggle. The simulations adapt. The visual world makes
abstract concepts tangible. The platform becomes increasingly personalized.

And over time: **the learner gets better at making decisions.** That is the outcome the entire
business should optimize for.

---

## 100. North-star product equation

```
Financial Knowledge × Interactive Practice × Immediate Feedback
  × Personalization × Repetition × Real-world Context
= Financial Intelligence
```

The business model sits underneath that:

| Layer | Purpose |
| --- | --- |
| Free access | habit |
| Premium | personalization |
| Family | household adoption |
| Institutional | scale |
| Partnerships | distribution |
| Certification | career value |
| Platform | long-term infrastructure business |

---

## 101. Final design mantra

When an agent is unsure what to build, use this:

> Show me.
> Let me touch it.
> Let me make the decision.
> Show me what happened.
> Tell me why.
> Let me try again.

That is the product. And the visual language should make the learner feel:

> **"I'm not taking a finance course. I'm learning to operate a financial world."**

---

## Notes to the build agents

Emphasised by the founder before any build starts:

- **Do not overbuild the AI layer first.** The signature simulation is the thing that needs to
  feel magical.
- **Do not let "generative UI" become random UI generation.** Controlled interactive primitives
  are the better product architecture.
- **Do not make it a forex product.** Forex is one compelling domain inside a much larger
  financial-intelligence platform.
- **Do not overdo 3D.** The 3D moments need to be memorable and pedagogically justified.
- **Do not optimize monetization before proving the learning loop.** Brilliant, Khanmigo and
  Duolingo validate pieces of the monetization logic, but willingness-to-pay in Ghana/Nigeria
  still needs empirical testing.
- **The African context is an actual product advantage**, not a localization afterthought. West
  Africa's role in mobile-money growth and the scale of digital financial activity give us a
  strong environment in which to build something genuinely locally relevant.

One conclusion from the research matters most: **the interactive-learning thesis is stronger than
the "AI tutor" thesis by itself.** AI tutoring is increasingly commoditized. Interactive
simulations, localized financial scenarios, persistent learner models, and the ability to turn a
learner's decisions into an adaptive curriculum are where the proprietary product effort belongs.

When the first build comes back, review it as a product, not merely as code:

> **Does the first 3 minutes actually demonstrate the "financial intelligence gym" idea?**

That is the bar.
