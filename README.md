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
pnpm dev            # http://localhost:5177
pnpm check          # pure core checks: money, phones, seeded randomness, determinism rules
pnpm typecheck && pnpm lint
pnpm shots          # with pnpm dev running: every screen at 360/375/390 px, fails on sideways scroll
pnpm build
```

Copy `.dev.vars.example` to `.dev.vars` for secrets. Every service is optional
(`lib/capabilities.ts`): with none of them set, the app still runs.

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

**Phase 0, foundations.** Done:

- The scaffold, the same stack as Kanea Studio, building clean.
- `lib/core`: multi-currency money (minor units, basis points, micro-dollars, compact hero
  amounts), phone numbers for Ghana, Nigeria and Kenya with MoMo network guesses, seeded
  randomness identical across browsers, readable login codes. 23 checks, including one that
  fails the build if an engine uses `Math.random()` or an engine-dependent maths function.
- The design brief, with the palette validated for colour-blind readers and the typeface chosen
  by checking 25 families for ₵, ₦, Twi and Yoruba letters.
- The shell: five tabs (Home, Learn, Practice, Progress, Coach), truth badges, the experience
  frame, buttons, stats, gain/loss markers, the slider and choice controls, and a gain/loss
  colour setting for colour-blind learners that applies before first paint.
- `/design`, the brief drawn on a phone, for approval.

**Waiting on:**

1. Approval of the design brief (`/design`, `docs/design-brief.md` §14). Phase 1 builds screens
   on it.
2. A Cloudflare account to deploy to (the Phase 0 exit asks for the shell live on Workers).
3. The decisions in plan §18: name, Paystack business, WhatsApp number, country order, voice
   languages, the Phase 1 pilot group.
4. Admin that takes weeks, so it should start now: Meta business verification, OpenRouter prepaid
   credit, Paystack Ghana test keys.

**Next, Phase 1:** the Experience Registry, the Payday life simulation with What-If replay, and
the first 3 minutes, tested on 15–20 real people before any AI is added.
