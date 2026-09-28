# Chartward landing update

Scope: the latest request prioritised the landing page and beginner-friendly language before further feature work. Applied to the current working tree; unrelated and staged changes preserved. No deployment or provider configuration performed.

## Changes

- Replaced the advanced opening chart exercise with a simple one-share example: buy at GH₵10, then explore selling higher, lower or unchanged. All results come from integer minor-unit arithmetic in `lib/engines/first-share.ts`.
- The current landing source already did not render the earlier leverage widget. It now uses only the beginner example; existing advanced lesson and lab components are preserved.
- Rewrote the headline, introduction, CTAs, course explanation, local-example cards and closing around clear beginner questions.
- Page sequence: immediate example, learning process, starter questions, course availability, local examples, first-lesson CTA. Advanced signals/modules remain reachable through the existing navigation rather than being the first experience.
- Hid the topical IPO announcement on the home route only and removed decorative WebGL from its hero to give the learning interaction more space. (Superseded 28 Sep 2026: the WebGL NoiseField is back in the hero at the user's request, with the first trade placed directly under the headline on phones. Live signals also returned as a landing section, again at the user's request.)
- Applied the Chartward C/decision-point mark to shared branding and favicon; updated the shared description/footer tagline.
- Fixed a 320px overflow in the course-search grid. Secondary CTA is a quiet link, keeping the first mobile screen compact.

## Verification

- `scripts/check-landing.mjs`: all gain/loss/break-even interactions passed at 320, 375, 430, 768, 1024, 1440 and 1920px; no document overflow, broken local anchors, or page JavaScript errors. Reduced-motion browser setting used.
- Visually reviewed mobile and desktop screenshots, including the full page. Evidence in `shots/landing-review/`; final results in `results.json`.
- TypeScript passed; targeted Oxlint passed; changed files formatted with Oxfmt.
- Build completed; bundler reported chunk-size and plugin-timing warnings.
- New arithmetic checked for positive/negative/zero outcomes, total-loss boundary, invalid inputs and money conservation across a range of sale prices.

This confirms local landing behavior. It does not establish deployed state, authenticated flows, AI provider replies, payment readiness, or completion of the broader dashboard/features work.
