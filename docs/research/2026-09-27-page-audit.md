# Page-by-page UX audit — 27 September 2026

Scope: current working tree, read-only application audit. No app files changed. Read CLAUDE.md and inspected every route family and the components behind it. This report separates source findings from rendered checks. Provider-backed account creation, payment, notification delivery and real-user retention were not verified.

## Decision

The basic information architecture is coherent: discover -> try -> choose a path -> practise -> review mistakes -> return. The working learning loop is much stronger than the unfinished commercial/community promises. Improve the first useful action and truthfulness before adding more decoration. Keep short practical challenges as the acquisition hook; avoid presenting market predictions or income promises as the product outcome.

## Landing first

The 375x812 screenshot has clear typography, strong contrast and large buttons. The announcement plus header occupy roughly 142 CSS pixels. Hero text, two CTAs and repeated promises use the rest of the first screen; the actual chart controls sit below it. The visitor hears “interactive” before getting to interact.

Recommended order: concise promise -> one immediate chart decision -> short outcome/explanation -> save progress -> curriculum -> method/proof -> availability/pricing -> community preview. Make “Try a 2-minute chart challenge” the primary action and “Save my progress” the subsequent conversion. Duration must match the measured demo. Suggested headline to test: “Would you take this trade?” with a simulation label and “Make a decision. See what you missed. Build your judgement.” Compare this with the current learning-led headline using lesson starts/completions and week-one return, not only registrations.

Do not add a testimonials panel or subscriber counters without evidence. Replace the large list of negatives with a short trust line and a concrete description of the experience. Derive all lesson counts and availability badges from the curriculum.

## Pages in journey order

| Page | What works in source | Gaps and concrete recommendation |
|---|---|---|
| `/` | Real ChartDemo and LeverageDemo, computed facts, live/planned curriculum counts, large CTAs, responsive two-column desktop hero. | Demo controls below mobile fold; Start free goes to signup before delivering value. IPO dominates every marketing entrance via global announcement. Reduce announcement prominence and make first challenge primary. Source-check live offer facts separately before featuring them. |
| `/labs` | Reuses working leverage, IPO and noise widgets; quick directory and sensible wide-screen splits. | **P1:** directory has four labs but page renders three; `#chart-lab` has no target. The directory ignores each content item's existing `href`. **P1:** bottom says “52 playable lessons” although five Stage 7 lessons are planned. Bottom CTA row lacks mobile stacking/wrapping. “Pure mathematical engines” is implementation jargon. “Proven plan” and “AI coach that enforces discipline” overstate evidence. Label simplified model assumptions and avoid broad claims that regulators always allocate pro rata. |
| `/roadmap` | Single source of truth, live/planned badges, stage outcomes, prerequisites and playable links. Search uses the actual catalog. | Repeats the landing how-it-works section; shorten it. Seven stages visible does not mean all playable. Show “47 available; 5 planned” only when computed. ARIA tab roles lack associated tabpanels/keyboard arrow behavior; implement full tab interaction or use ordinary toggle buttons. Deep-link directly to requested stage/lesson rather than generic `/roadmap`. |
| `/mindset` | Working noise filter and authored signal/noise quiz make theory interactive. | `content/pages.ts` points to `/mindset#filter` but page's filter Section lacks `id="filter"`. The “strong month ... around 3%” copy implies a typical attainable benchmark without supporting evidence; use an explicitly hypothetical example. A smoothed line is not proof of a profitable signal. Lead with the quiz, then explain principles. |
| `/ipo` | Offer dates/status and money calculated, sources and checked date, calculator and educational framing. | Current factual offer assertions require primary-source validation, not just a stored “checked” string. Separate published facts from pro-rata assumptions and illustrative outcomes, and label historical/indicative figures beside controls. Avoid implying application or brokerage capability; this is a calculator/lesson. |
| `/community` | Clearly says coming soon; example post explicitly says illustration, not a real post/asset. Rules prohibit real-asset calls and solicitation. | **P1:** signup interest POST can store an anonymous event yet success says “We'll tell you” without collecting contact/channel. **P1:** safety section uses present-tense “Every post is checked”/“Mentors are verified” despite no community. Switch to planned statements. The “first 500” founding circle lacks implemented capacity tracking; avoid artificial scarcity. Add real consented waitlist, with chosen channel and persisted contact linkage, before promising notification. |
| `/pricing` | No fake numerical price; pilot pricing and future Pass are described as future. | Checkmarked Pass features still read as an available bundle: seven stages, coach memory, historical replay, certificates, MoMo/card/transfer. Mark each as available/pilot/planned; Free wording understates currently ungated lessons. Partner “Talk to us” only records an event and does not collect a contact or brief. Metadata implies payment methods are usable before checkout exists. |
| `/sign-up` | Clerk component conditional on capabilities; honest guest fallback rather than broken SDK calls. | Validate configured Clerk flow separately. In guest mode signup promises cannot deliver cross-device persistence; keep capability messaging close to CTA. Offer a direct free challenge before account setup. No contact consent/preferences or privacy/legal links are visible in current public navigation. |
| `/sign-in` | Shared accessible visual structure, hash routing for multistep Clerk flow, guest route remains usable. | Requires live sign-in/reset/account tests. Preserve intended return route when arriving from a saved lesson/community action; currently fallback is generic `/desk`. Form should stay high in mobile viewport. |
| `/onboarding` | Typed answers and chips, authored deterministic fallback, progress indicator, profile summary, edit/restart and save state; keyboard Send supported. | Whole-summary change restarts rather than editing one field. Test phone soft keyboard/scroll, slow network and double taps. Conversation asks several profiling questions before learning; allow a clear skip into a challenge and progressively ask remaining questions. |
| `/desk` | Next lesson prominent, real derived habits/streaks, review queue CTA, device-save notice, available lessons remain accessible. | All 52 lessons form a long winding trail; collapse completed/later stages and add compact stage navigation. On desktop max width is only 560px: use stage rail plus active lesson/review column. Device-only save notice can send users back to unavailable signup in guest mode. |
| `/lessons` | Search and topic filters, completed ticks, planned state, playable-first ordering, good touch row sizes. | Horizontal topic chips need clear overflow affordance; query hides topic controls and ignores selected topic without explanation. Add result count/reset and helpful empty-state examples. Use wider desktop grid where useful. |
| `/practice` | Spaced-review queue, due counts, grouping by lesson and meaningful empty state. | Keep distinction between “nothing due”, “not yet attempted” and failed server retrieval. Show next due date/time and a useful fresh lesson when no review is available. Test from genuine missed-answer events; screenshot fixtures use placeholder hashes which may not resolve. |
| `/practice/round` | Shared question component, first answer controls review schedule, explanation and XP, sticky safe-area footer. | **P1:** fetch errors/invalid response return zero questions and present ordinary empty state. Add explicit retry/error state so a broken server does not look like successful completion. Existing shots script omits this route. |
| `/lesson/[id]` | Data-driven beats, lazy widgets, prediction/explanation, computed outcomes, truth labels, contextual finish/next action. Unavailable lessons show useful fallback. | Player session state is in memory: refresh/exit loses unfinished beat/answer state. Add resume and confirmation only when meaningful progress would be lost. Test all 47 lesson widgets, not merely one sample route; planned and invalid IDs currently share fallback. |
| `/me` | Derived XP/streak/badges, daily goal, haptic switch, accessible palette option, account panel. | Separate achievements from settings for quicker scanning; no channel subscription/consent, export/delete data, billing state or sync diagnostics yet. These are gaps to fill as integrations launch, not controls to mock. Desktop remains narrow. |
| `/design` | Useful internal token/specimen page. | Keep outside product navigation and exclude from customer search indexing; no need to beautify as a customer destination. |

## Shared navigation, motion and accessibility

- Marketing nav has active labels, skip link and 48px menu controls. Member tabs are thumb-reachable and include safe-area padding; desktop gets header links. These are good foundations.
- **P1 accessibility:** the full-screen mobile menu locks scrolling and closes on Escape, but lacks focus entry, focus trap/inert background, dialog semantics and focus restoration. Keyboard focus can remain behind the overlay.
- Root `overflow-x: clip` and desk-specific clipping mean “no page scrollbar” alone does not prove no clipped content. Inspect child bounds, wrapping, keyboard focus and 200% zoom as well.
- Motion already includes reveals, page transitions, button depth, coin spins, answer feedback, candle drawing and WebGL hero. Add purposeful explanation transitions rather than more ambient effects.
- CSS globally collapses animation/transition duration for reduced motion. WebGL checks reduced motion, Save-Data and low memory, imports after idle and stops drawing when hidden/offscreen. However suitability is cached with a no-op subscription: changing reduced-motion preference during a session will not disable the live WebGL scene. Re-evaluate media-query changes and handle renderer failures with flat fallback.
- Auth screens also mount NoiseField, although CLAUDE says WebGL only in the hero. Prefer a quiet static auth background and keep download/render budget for the task.
- Desktop layout should intentionally expand the desk/library while keeping lessons readable. Test 320/360/375/390/430, 768/1024/1280/1440/1920, landscape, 200% zoom, keyboard-only and reduced motion. “All screen sizes” cannot be proven by three phone screenshots.

## Images and trust

`/labs` uses supplied JPEG illustrations beside real simulators. Their role should remain explanatory, not evidence of a real terminal, community or actual investment outcome. The existing community HTML mockup is correctly labelled, but generated-looking community/terminal assets must carry equally clear context if introduced. Avoid baking numerical results into decorative images; live engine output is the source of figures. Existing `alt` text names concepts generically, so meaningful diagrams need text equivalents explaining the relationship, not just “Guide”.

## Next implementation batch after decision

1. Fix broken anchors, false availability/count claims, waitlist success/contact mismatch and practice error handling.
2. Redesign landing around one playable decision; measure first action and completion.
3. Simplify marketing navigation to Try, Learn, Community, Pricing; keep Method supporting the learning journey.
4. Add mobile menu focus behavior; verify all routes and interactive states across phone/tablet/desktop.
5. Ship paper challenge and consented channel return loops before promoting community/posting/payment capabilities.
6. Add richer transitions only where they explain market consequence or progress, with static fallbacks.

## Verification log

- Static source inspection: all route families above, common layouts, navigation, auth fallback, practice errors, motion and relevant content.
- Existing local server responded HTTP 200. Starting `pnpm dev` reported an already running vinext PID 3292; it was preserved.
- First `pnpm shots` launch hit sandbox `spawn EPERM`; approved run started successfully. Final result is recorded below when complete.
- Additional read-only browser probe covers 18 routes at 768/1024/1440, stores route/status/width/missing-anchor results in `2026-09-27-responsive-results.json`. This is route/layout smoke testing, not full interactions or provider E2E.
- Visually inspected 375x812 landing and labs first-screen screenshots. Landing first action/buttons are legible; demo controls are below first screen. Labs hero also delays simulator access substantially.

### Completed browser results

- `pnpm shots`: **PASS**, 20 route samples at **360, 375, 390px**, no document-level sideways scrolling. Captures in `shots/`. This script samples five lesson IDs and does not play all lessons or test every UI state.
- Additional probe: **54/54 route visits returned 200**, 18 routes at **768, 1024, 1440px**, no document-level horizontal overflow. It confirms broken `#chart-lab` on `/labs` and broken root skip-link target `#content` on `/design` at each width. The JSON preserves per-route evidence.
- Inspected `shots/audit-desktop-landing.png` at 1440x900: live demo and its first controls fit beside headline; desktop landing balance is substantially better than mobile. Hero is still tall but coherent. Representative other captures: `shots/audit-desktop-labs.png`, `shots/audit-desktop-desk.png`, `shots/roadmap.png`, `shots/community.png`, `shots/pricing.png`.
- **P1 image QA:** visually inspected `public/images/ipo-allotment-guide.jpg`. It contains corrupted/duplicated text (e.g. “company company vs industry”, “Oversubscription in a rising and subsriocriptiont”, “Shares areeing distributed”) and a different Sika logo from the site. Tiny raster text is illegible at mobile display size. Replace it with a responsive HTML/SVG diagram using verified authored text. Do not ship it as educational explanation.
- **P1 image QA:** `public/images/risk-leverage-trap.jpg` also contains garbled lines, calls 1x “SAFE” and 10x “MODERATE RISK”, and incorrectly associates low leverage with “Minimal volatility”. Leverage changes exposure, not the underlying asset's volatility. Replace with a computed loss table/diagram (“illustrative adverse move; ignores fees and maintenance margin”) and plain labels, rather than preserving this image. Its flask wordmark is a third inconsistent logo.
