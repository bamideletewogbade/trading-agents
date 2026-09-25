# The financial intelligence gym

A mobile-first web product where people in Ghana, then Nigeria and beyond, get better at money
decisions by practising them in simulations with an AI coach. Working name TBD; it will live in
`lib/brand.ts`.

## Read before building anything

1. `docs/product-spec.md`: what we're building and why. The product source of truth.
2. `docs/implementation-plan.md`: stack, architecture, phases and exit criteria, what we port
   from Kanea Studio, Learn with Bishop and Aksen Labs.
3. `docs/design-brief.md`: the visual system. **Doesn't exist until Phase 0 produces it, and no
   page is built before it's approved.**

Build in phase order. Don't start a phase until the previous phase's exit criteria are met.

## Rules that are not negotiable

1. **AI explains; code calculates.** Every number a learner sees comes from an engine in
   `lib/engines`. The coach may repeat engine numbers, never originate them; the numeric guard
   rejects turns that try.
2. **AI composes; it never invents UI.** The coach returns a typed `Compose` directive naming a
   registered experience. No generated markup, CSS or charts.
3. **Jev decides, never writes.** Yes/no, one-of and score questions go to Jev through OpenRouter's
   Decisions API (`/api/alpha/decisions`). 0.35–0.65 is the hedge band: a hedged assessment
   becomes a question to the learner, a hedged safety answer takes the authored path, and a
   hedged content check goes to a person.
4. **The AI never moves money.** Only a deterministic handler holding a server-issued quote can
   start a Paystack charge. Only `charge.success` or a verify call grants anything, through one
   SQL statement.
5. **Money is integers.** Minor units with a currency code; rates in basis points; AI costs in
   micro-dollars.
6. **Engines are pure and seeded.** No I/O, no `Math.random()`. Runs are event-sourced so
   What-If is a replay.
7. **Every experience declares its truth**: `SIMULATION`, `HYPOTHETICAL`, `HISTORICAL DATA`,
   `EDUCATIONAL ONLY`. Colour is never the only signal.
8. **Mobile first.** Check at 375px with no horizontal overflow. 3D only where the plan names it,
   lazy-loaded, skipped on reduced-motion, Save-Data and low-memory phones.
9. **No hype, no signals, no fake urgency.** No trade calls, no promised returns, no countdown
   timers, no paywall in a session where distress was flagged.
10. **WhatsApp is scoped.** A learning coach for our curriculum, not a general-purpose chatbot
    (Meta's policy since 15 Jan 2026). Frugal with messages; templates only for opted-in dailies
    and renewals.

## Working here

The stack is the Kanea Studio one (vinext on Cloudflare Workers, React 19, Tailwind 4, zod; Drizzle
+ Neon, OpenRouter and Paystack join in the phases that need them).

```bash
pnpm dev            # http://localhost:5177
pnpm check          # pure core and engine checks, no network. Must pass before any push
pnpm typecheck && pnpm lint
pnpm shots          # with pnpm dev running: every screen at 360/375/390 px, fails on sideways scroll
npx oxfmt <files>   # format what you touched
pnpm probe:<gate>   # (Phase 2) real Jev calls on labelled sets; run after touching question wording
```

- `lib/core` and `lib/engines` import each other by relative `.ts` path and nothing else, so
  `pnpm check` can run them under plain Node.
- Colours come only from the tokens in `app/globals.css`; Tailwind's own palette is switched off.
  Type uses the `type-*` utilities; numbers that change or align get `num`.
- Every page lives under `app/(app)/` (the shell with the tabs) unless it deliberately goes full
  screen. New screens get added to `PAGES` in `scripts/shots.mjs`.
- Comments explain *why*, in plain words. Words shown to learners live in `content/`, not in
  components.
