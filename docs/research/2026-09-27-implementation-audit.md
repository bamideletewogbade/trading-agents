# Implementation audit — 27 September 2026

Scope: source review of learning, identity/persistence, payments, messaging, Stage 7 and community. Reviewed `CLAUDE.md` and the `paystack-payments` skill. No implementation files changed, no secrets inspected, no live payment or provider calls made.

## Outcome

The learning product has a substantial working implementation. Payments, WhatsApp, Telegram, Stage 7 and the Floor require new implementation rather than simply connecting completed stubs. Before monetization, correct identity handling and the trust boundary around learning events.

| Area | Evidence | Current assessment |
| --- | --- | --- |
| Lessons and engines | `content/lessons/stage*.ts`, `lib/engines/*`, lesson registry/player | Data-driven lessons, deterministic calculations, shared widgets and authored fallbacks are implemented. |
| Accounts | `lib/auth/server.ts:20–36`, `components/auth/AuthProvider.tsx` | Clerk verification and guest fallback exist; account/data isolation needs repair. |
| Persistence | `db/schema.ts:28–119`, `lib/learning/profile.ts:79–101` | Real schema, migrations and profile/event writes. Deployed migrations and database state unverified. |
| Paystack | `lib/capabilities.ts:53`, `.dev.vars.example:23–27` | Configuration placeholders only. No initialize/verify/webhook routes, provider adapter, order ledger, entitlements, refunds or reconciliation. |
| WhatsApp | `lib/brand.ts:31`, `lib/capabilities.ts:54–58` | Number is null; capability checks environment presence. No webhook ingestion or outbound implementation. |
| Telegram | Repository route/adapter/configuration inventory | No integration found. The curriculum mention is vocabulary, not connectivity. |
| Stage 7 | `content/curriculum.ts:897–961` | All p1–p5 planned. No challenge/journal/trade lifecycle tables or endpoints. |
| Floor | `app/(marketing)/community/page.tsx:13–63`, `content/pages.ts:81–88` | Static future-feature illustration. No posting, locking, rooms, moderation or scoring workflow. |
| Jev | `lib/decisions/jev.ts:73–142`, `app/api/onboarding/understand/route.ts:23–54` | Provider adapter with timeout/fallback exists; used for onboarding interpretation. No community scoring/moderation integration. |

## Verification performed

`pnpm check`, `pnpm typecheck` and `pnpm lint` all exited successfully. The offline core suite passed 127 checks:

| Suite | Passed |
| --- | ---: |
| Core | 23 |
| Engines | 18 |
| Intelligence, no network | 10 |
| Onboarding and search | 13 |
| Stages 1–6 lesson checks | 51 |
| Progress | 12 |

These results verify the checked local logic and static checks. They do not establish payment readiness, deployed database migrations, authenticated cross-device behavior, provider delivery or browser usability. No browser walkthrough was performed as part of this implementation sub-audit.

## Priority findings

### P1 — Completion and scores are client assertions

`lib/client/progress.ts:208–225` sends `lesson_completed` and client-calculated `right`/`total`. `app/api/events/route.ts:19–25` passes this to `recordEvent`, whose generic schema accepts any matching event name, arbitrary skill and JSON (`lib/learning/store.ts:54–82`). There is no lesson existence check, answer replay or completion verification. The progress reader sanitizes numeric shape, not truth (`app/api/progress/route.ts:38–48`). This contradicts the repository instruction that the server recomputes lesson completion, and permits fabricated progress and distorted metrics.

Use explicit event contracts and authoritative answer/completion validation before using these events for certificates, reputation or challenge results. Add event idempotency and preserve a distinct analytics event path where appropriate.

### P1 — Account reads and event writes use different identities

`app/api/events/route.ts:19–25` writes to the device cookie without resolving the authenticated account. `app/api/progress/route.ts:20–26` reads from the account learner. Profile GET does not update the cookie (`app/api/profile/route.ts:32–39`); profile POST does (`:49–58`). A second device can therefore read existing account progress but write new lesson events to another learner until profile POST aligns the cookie. Use one authenticated learner resolver across reads and writes, with explicit guest migration.

### P1 — Shared-device account isolation is incomplete

The `sika:log`, `sika:done` and `sika:profile` local-storage keys are not account-scoped (`lib/client/progress.ts:36–40`, `lib/client/profile.ts:15`). TokenBridge only registers the token getter and performs no storage reset (`components/auth/TokenBridge.tsx:8–13`). Profile loading can fall back to the device learner even when that learner belongs to another account (`lib/learning/profile.ts:109–112`), and profile upsert can replace that learner's `clerk_user_id` (`:93–99`). Repair ownership checks, account-switch behavior and intentional guest adoption before billing or private journals.

### P1/P2 — No application-level quota on public paid AI requests

`app/api/onboarding/understand/route.ts:23–54` can invoke Jev publicly when configured, bounded by text length and timeout. No application-level per-identity/IP rate limit, concurrency cap or spend ceiling was found. Edge protection was not verified, so this is a code finding rather than proof that deployment has no protection. Add limits before directing acquisition traffic to the endpoint.

### P2 — Interest capture is not a contactable waitlist

`components/marketing/InterestButton.tsx:47–52` records only event type and source path. Anonymous visitors can receive “We’ll tell you” (`content/pages.ts:94`) without providing a contact method or channel consent. The partner CTA similarly promises follow-up (`:158`). Build real contact/consent capture, deduplication, status and notification handling, and make the success copy match what was actually stored.

### P2 — Capability flags conflate configuration and implementation

`lib/capabilities.ts:53–57` can claim payments or WhatsApp availability based on keys alone. The WhatsApp capability comment says the API is wired when no adapter exists. Separate implemented, configured and verified states before enabling UI actions.

### P2 — Pricing describes a future access contract

`content/pages.ts:111–139` lists Stage 1 and selected lessons for Free, and all stages, a remembering coach, historical replays and certificates for Pass. The live curriculum is currently accessible without entitlement enforcement. Pass pricing is explicitly pending. Clarify available-today versus proposed features and establish the catalog/entitlement contract before charging.

## Recommended sequence

1. Repair identity isolation, authoritative learning events, event deduplication, consented waitlist capture and AI quotas.
2. Improve landing/onboarding conversion and measure unique visitor → first interaction → first lesson completion → day-2/day-7 return → consented community opt-in. Exclude test traffic and repeat-click inflation.
3. Build shared messaging foundations: account linking, opt-ins, content IDs, delivery outbox, retries and unsubscribe. Add independent Telegram and WhatsApp adapters, with the web app handling charts and deeper workflows.
4. Pilot the paper challenge with immutable plans, simulated fills/fees, event log, deterministic metrics, reflection and reset rules. Label pilot status explicitly.
5. Pilot Floor with human-reviewed breakdowns, reporting and moderation. Let Jev triage against a published rubric; uncertain cases require review.
6. Implement Paystack after pass contents, price/currency, duration, renewal/refund policy and merchant ownership are decided. Use server-owned catalog → pending order → initialization → signed webhook/server verification → atomic paid transition and entitlement.

## Payment integration decision and current sources

A manually renewed pass fits the existing promise that nothing renews without asking. Paystack's official subscription documentation currently supports cards and Nigerian direct debit; it does not list MoMo subscriptions. Treat MoMo renewal as another customer-authorized checkout, not automatic billing.

Official documentation checked during this audit:

- [Subscriptions](https://paystack.com/docs/payments/subscriptions/): supported automatic subscription channels.
- [Payment channels](https://paystack.com/docs/payments/payment-channels/): channel availability differs by country; cards are broadly available.
- [Recurring charges](https://paystack.com/docs/payments/recurring-charges/): recurring authorizations work for cards and Nigerian direct debit.

For integrated checkout, verify exact reference, gateway, mode, successful status, minor-unit amount and currency against the stored pending order. Validate the raw-body webhook signature and make fulfillment atomic/idempotent across callback and webhook races. Test failures, cancellations, wrong amounts/currencies, duplicate/delayed notifications, refunds and reconciliation before live enablement.

Merchant activation, approved commercial terms, current fees, deployed callback/webhook reachability, live checkout, database contents, deployed Clerk behavior and provider delivery remain unverified. Credentials alone cannot establish any of these states.
