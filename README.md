# Sika Lab

A financial intelligence gym: people in Ghana, then Nigeria and Kenya, get better at money
decisions by practising them in simulations with an AI coach. Nothing in it is real money.

*Sika* is Twi for money. It's a working name, set in `lib/brand.ts`.

- **Why and what:** `docs/product-spec.md`
- **How and in what order:** `docs/implementation-plan.md`
- **How it looks:** `docs/design-brief.md` (draft, awaiting approval), drawn at `/design`
- **Rules for anyone building here, people or agents:** `CLAUDE.md`

## Run it

```bash
pnpm install
pnpm dev               # http://localhost:5177  (Start on Home opens the Payday month)
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
- **AI:** `OPENROUTER_API_KEY`, and `OPENROUTER_HAS_CREDIT=true` once the account has prepaid
  credit. Then `pnpm probe:openrouter` should show one Jev decision and one coach turn.

## Deploy

The Worker is `sika-lab`, so on the Cloudflare account the other projects use it goes live at
**https://sika-lab.bishoptewogbade.workers.dev**. Any one of these works:

1. **From the PC**, where `wrangler login` already holds the Cloudflare account (how Aksen Labs,
   Kanea and Learn with Bishop deploy): `pnpm install && pnpm deploy`, then
   `pnpm secrets --site https://sika-lab.bishoptewogbade.workers.dev` with the Neon
   `DATABASE_URL` in `.dev.vars`. A Claude Code session running on the PC can do all of it.
2. **From GitHub**, without a laptop: add `CLOUDFLARE_API_TOKEN` ("Edit Cloudflare Workers"
   template), `CLOUDFLARE_ACCOUNT_ID` and `DATABASE_URL` to the repository's Actions secrets.
   The Deploy workflow then runs on every push (or Actions › Deploy › Run workflow): checks,
   migrations, deploy, secrets, and a browser playing the live site.
3. **From a cloud session**: the same two Cloudflare values as environment variables in the
   session's environment settings, then `pnpm deploy`.

Cloud sessions can't use `wrangler login`: its browser sign-in has to come back to the machine
running it, which a cloud container isn't. That is the only reason a cloud session needs a token.

**Before a deploy, a preview.** `pnpm preview:build` turns the first 3 minutes into one
self-contained HTML file (`dist-preview/sika-lab-payday.html`): the same engine and screens,
running in the browser alone, saving nothing. It's how the shareable preview page was made.

## How it is built

Five layers; each talks only to the one below (plan §3).

| Layer | Where | Holds |
| --- | --- | --- |
| Core | `lib/core`, `lib/engines` (Phase 1), `lib/experiences` | Money as integers in four currencies, phone numbers for GH/NG/KE, seeded randomness, the simulations' maths. Pure TypeScript; `pnpm check` runs it under plain Node |
| Decisions | `lib/decisions` (Phase 2) | Jev's typed questions through OpenRouter's Decisions API, and the hedge-band readers |
| Intelligence | `lib/intelligence` (Phase 2) | The coach: authored lines first, then cheap models, with guards on every number |
| Services | `db/`, `lib/payments`, `lib/whatsapp` (later phases) | The only code that touches Neon, Paystack or Meta |
| Surfaces | `app/`, `components/` | Screens. Words live in `content/`, not in components |

Stack: vinext (the Next.js API on Vite) on Cloudflare Workers, React 19, Tailwind 4, zod. Neon +
Drizzle, OpenRouter, Paystack and the WhatsApp Cloud API arrive in the phases that need them.

## Where things stand (25 Sep 2026)

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

1. A deploy, by any of the three routes above.
2. `OPENROUTER_API_KEY` (with prepaid credit) for the coach.
3. The Phase 1 pilot: 15–20 people, on their own phones, watched in person.
4. A local reader for each country's amounts and words (`content/scenarios/payday.ts`).
5. The decisions in plan §18: name, Paystack business, WhatsApp number, voice languages.
