# Design brief

**Status: approved to proceed (25 Sep 2026).** Spec §81 makes this the source of truth for every
agent that builds a screen. The specimen page (`/design`) draws it on a phone; changes to it are
welcome, and go here first, then into `app/globals.css`, then into screens.

Tokens live in `app/globals.css` as Tailwind theme variables, so `bg-panel`, `text-fg`, `border-edge`
and `text-gold` are the classes. **Tailwind's default palette is switched off there**: the only
colours that exist in this codebase are the ones below. This file says what they are and why.

---

## 1. The atmosphere in one line

**A trading floor at night, lit for learning.** Charcoal surfaces, precise numbers, and one warm
gold light that falls on whatever the learner should look at next. Terminal precision with the
responsiveness of a good game. Never a crypto casino (spec §15).

## 2. Five rules every screen follows

1. **The number is the hero.** The biggest thing on a screen is the number that just changed,
   set in tabular figures so it doesn't jitter while it counts. From a million up, a hero number
   uses words (`GH₵5.03 billion`, via `formatMoney(…, { compact: true })`) so it fits one line
   of a phone.
2. **Gold means "you" or "look here".** The learner's own choice, the one primary action, the
   thing being taught. Never decoration, never a gradient, never a glow. At most one gold
   button per screen.
3. **Every state wears words.** A gain is `▲ +GH₵300 gain`, never just green. A loss is
   `▼ −$300 loss (−60%)`. A truth badge says `SIMULATION` in letters. Colour is the fourth
   signal, after text, icon and position (spec §14, §83).
4. **Thumbs first.** Primary actions sit in the bottom third. Secondary tasks open in bottom
   sheets, not modals. Every target is at least 48 × 48 px.
5. **Nothing moves unless something changed.** Motion shows cause and effect, and every
   consequence sequence can be skipped (spec §16, §63).

## 3. Colour

Dark only for the MVP. Contrast is set well past WCAG AA on purpose: these screens are read
outdoors in strong sun.

### Surfaces and ink

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `ink` | `#0A0C10` | Page background | — |
| `panel` | `#12161C` | Cards, sheets, chart surface | — |
| `raised` | `#1A1F27` | Inputs, pressed states, nested panels | — |
| `line` | `#262D38` | Decorative hairlines and gridlines only | — |
| `edge` | `#65707F` | Borders that identify a control (inputs, secondary buttons) | 3.6:1 on panel, 3.3:1 on raised |
| `fg` | `#E9EDF2` | Primary text | 15.4:1 on panel |
| `fg-2` | `#AEB6C2` | Secondary text | 8.9:1 on panel |
| `muted` | `#848D9C` | The lowest grey allowed for words people must read | 5.4:1 on panel, 4.9:1 on raised |

### Gold, and the states

| Token | Hex | Use | Contrast |
| --- | --- | --- | --- |
| `gold` | `#EBAE3F` | Primary action, focus ring, the learner's choice, educational highlight | 9.2:1 on panel; `ink` on gold 9.9:1 |
| `gold-soft` | gold at 12% | Background of a highlighted row or chosen chip | text on it 12.8:1 |
| `gain` | `#2BC4A0` | Gain text and icons, always with ▲ and a word | 8.2:1 on panel |
| `loss` | `#F2735F` | Loss text and icons, always with ▼ and a word | 6.4:1 on panel |
| `info` | `#6AA2F0` | Neutral information, the `SIMULATION` badge | 7.0:1 on panel |
| caution | `gold` + ⚠ | Warnings share gold on purpose: gold already means "look here" | — |

The gold is deliberately not Binance's (`#F0B90B`, `#FCD535`): warmer, a little amber, closer to
cowrie and kente gold than to a crypto logo.

### Chart colours (validated, not eyeballed)

Checked with the data-viz palette validator against the `panel` surface, dark mode:

| Slot | Role | Hex |
| --- | --- | --- |
| 1 | **You**: the learner's own run | `#C98500` |
| 2 | **What if**: the other timeline | `#3987E5` |
| 3 | A third series | `#199E70` |
| 4 | | `#9085E9` |
| 5 | | `#E66767` |
| 6 | | `#008300` |
| 7 | | `#D55181` |

- This order passes every gate for lines and bars: worst neighbouring pair ΔE 8.6 for colour-blind
  readers (target ≥ 8), 20.9 for everyone else (floor ≥ 15), all ≥ 3:1 on the surface.
- Slots 1–3 also pass when every pair can touch (scatter, the 100 paths): worst ΔE 8.4. **Charts
  where any two series can sit side by side carry three series at most.** More than that folds
  into "Other" or splits into small multiples.
- Chart marks sit darker than the text tokens because marks and words have different jobs. A
  label beside a line wears a text token, never the line's colour.

### Gain against loss, and the colour-blind setting

The default pair (`#199E70` against `#E66767` as marks) only reaches ΔE 6.5 for protanopia. That
is the warn band: legal **only** with secondary encoding, which rule 3 already requires (▲▼, a
sign, a word, and position above or below the baseline).

A setting, **Colours: Standard / Blue–orange**, swaps the pair to `#3987E5` against `#D95926`
(ΔE 26.8), the lesson Binance learned in public. It lives in Progress › Settings and is
remembered on the device.

Paths that ended (the ruined accounts in Risk Lab) are `#4A5260`, dashed, and labelled "ruined".

## 4. Type

**Inter (variable), self-hosted.** Chosen on evidence, not taste. On 25 Sep 2026 we opened 25
candidate families from Google Fonts and checked each for the glyphs this product must draw
natively, because a fallback glyph from another font looks broken beside a price: **₵ ₦** (cedi
and naira), **ɛ ɔ** (Twi), **ọ ẹ ṣ** (Yoruba), **▲ ▼** (gain and loss markers), and tabular
figures (numbers that count without jitter).

| Family | Missing |
| --- | --- |
| **Inter** | **nothing** |
| Plus Jakarta Sans | ɛ ɔ |
| Space Grotesk, Archivo | ɛ ɔ, ▲ ▼ |
| IBM Plex Sans | ɛ ɔ, ṣ, ▲ ▼ |
| Onest | ₵ ₦, ▲ ▼ |
| Geist | ₵ ₦, ɛ ɔ, ṣ |
| Manrope, Schibsted Grotesk, Hanken Grotesk | ₵ ₦, ɛ ɔ, ṣ, ▲ ▼ |
| Sora, DM Sans, Figtree, Rubik, Instrument Sans, Red Hat Display | ₵ ₦, ɛ ɔ, ọ ẹ ṣ, ▲ ▼ |

Inter was the only one with all of it. It's common, so the character comes from scale, gold and
motion rather than from the letterforms. One family, loaded in subsets the browser only fetches
when a page uses them, served from our own origin: Latin first, then Latin Extended (₵ ₦ ɛ ɔ ṣ)
and Vietnamese (ọ ẹ) on demand.

One catch, found in the subset files: **no web subset carries ▲ ▼**, although the full font does.
So on screens the gain and loss markers are drawn as SVG triangles of the same shape
(`components/ui/Delta.tsx`), which also keeps them the same size and baseline at every text size.
Plain-text surfaces (WhatsApp, share text) use the ▲ ▼ characters, which every phone's own font
draws.

Features: `tnum` on every number that changes or aligns; `cv05` (the lowercase l with a tail) so
`l`, `1` and `I` never blur in an amount or a code.

| Style | Size / line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `hero` | 44 / 48 | 650 | −0.02em | The number that changed |
| `display` | 32 / 38 | 650 | −0.015em | Stat values, page openers |
| `title` | 22 / 28 | 600 | −0.01em | Screen titles |
| `heading` | 18 / 24 | 600 | 0 | Card titles |
| `body` | 16 / 24 | 400 | 0 | Everything people read. Never smaller on a phone (it also stops iOS zooming on focus) |
| `small` | 14 / 20 | 400 | 0 | Secondary lines |
| `label` | 12 / 16 | 600 | +0.06em, capitals | Badges, section labels, tab labels |
| `tick` | 11 / 14 | 500 | 0 | Chart axis ticks only |

Sizes are in rem, so text scales with the phone's setting up to 200% without clipping.

## 5. Space, shape, depth

- **Space:** a 4 px base: 4, 8, 12, 16, 24, 32, 48, 64. Page gutter 16. Card padding 16. Gap
  between cards 12.
- **Shape:** radius 4 for chips, badges and inputs; 8 for cards and buttons; 16 only on the top
  corners of a bottom sheet. No pill-shaped cards (spec §82, "excessive rounded cards").
- **Depth:** no drop shadows on dark. Hierarchy is the surface step (`ink` → `panel` →
  `raised`) plus a 1 px `line`. A sheet sits over a 60% black scrim. No glassmorphism, no blur.

## 6. Components

| Component | Rules |
| --- | --- |
| **Primary button** | `gold` fill, `ink` text, 48 px tall, full width in the thumb zone on phones. One per screen |
| **Secondary button** | `raised` fill, `fg`, 1 px `edge` border |
| **Quiet button** | Text only in `fg-2`; for "Skip", "Not now" |
| **Pressed / focus / disabled** | Pressed: 98% scale, one step darker. Focus: 2 px `gold` ring, 2 px offset. Disabled: 40% opacity plus a line saying why |
| **Card** | `panel`, radius 8, 1 px `line`, padding 16, title in `label` style |
| **Stat** | Label (`label`, `muted`), value (`display`, tabular), delta row (▲/▼, signed amount, the word) |
| **Money chip** | The draggable GH₵100 unit. `raised`, radius 4, 44 px min; chosen: `gold` border on `gold-soft` |
| **Slider** | 4 px track, 28 px visible thumb, 48 px hit area, the value above the thumb in large tabular figures while dragging, − and + steppers beside it, arrow keys work |
| **Segmented choice** | For fixed options like 5× · 10× · 20× · 50×. Chosen segment: `gold-soft` fill, `gold` border, bold |
| **Bottom nav** | Five tabs, icon **and** label always. Active: `gold` icon, `fg` label, 2 px gold bar on top. 64 px + the phone's safe area |
| **Top bar** | Title left, one action right. No hamburger menus |
| **Bottom sheet** | Secondary tasks and explanations. Drag handle, close button, radius 16 top |
| **Truth badge** | See §7. Required on every experience |
| **Experience frame** | Title and truth badge on top, the experience in the middle, actions at the bottom in thumb reach, and a "Read this as text" toggle that shows the engine's plain-language summary |

**Icons:** line icons drawn inline as SVG on a 24 px grid, 1.75 px strokes, round joins. No icon
font, no library download. The tab set: a house (Home), an open book (Learn), a **dumbbell**
(Practice: this is a gym), rising steps (Progress), a speech bubble with a question mark (Coach).

## 7. Truth badges (spec §84)

Every experience declares what it is, and the badge says so in words first:

| Badge | Text | Icon | Border | Colour |
| --- | --- | --- | --- | --- |
| Simulation | `SIMULATION` | loop arrow | solid | `info` |
| Hypothetical | `HYPOTHETICAL` | ≈ | **dashed** | `fg-2` |
| Historical data | `HISTORICAL DATA · source · date` | clock | solid, double weight | `fg` |
| Educational only | `EDUCATIONAL ONLY` | open book | solid | `gold` |
| AI-generated | `AI` | small "AI" letters, never a robot | dotted | `fg-2` |

Text, icon, border style, then colour: a badge still reads in greyscale and in forced-colours
mode.

## 8. Motion

| Token | Duration | Use |
| --- | --- | --- |
| `fast` | 120 ms | Press feedback |
| `base` | 220 ms | Tabs, chips, toggles |
| `slow` | 420 ms | Sheets, page changes |
| `story` | 0.6–20 s | Consequence sequences (a month plays out); always skippable |

Easing: out `cubic-bezier(0.16, 1, 0.3, 1)` for things arriving; in-out `cubic-bezier(0.65, 0,
0.35, 1)` for things moving between places. Nothing bounces more than once, nothing loops while
idle, no parallax.

A number counts up or down only when the counting itself teaches (a balance draining over a
month). **Reduced motion:** no transforms; states change at once with at most a 150 ms fade;
counting numbers jump to their final value; story sequences become a list of what happened.

Celebrate learning, never money. A skill reaching Transfer gets a short, quiet mark on the map;
a simulated gain gets nothing but its number. No confetti, no coins, no rockets.

## 9. Charts

From the data-viz method, applied:

- 2 px lines, markers ≥ 8 px, bars with 4 px rounded ends at the baseline, 2 px gaps between
  fills.
- A legend whenever there are two or more series, plus direct labels when there are four or
  fewer. One y-axis, always. Recessive grid (`line`), baseline in `#39424F`.
- Text on a chart wears text tokens, never the series colour.
- Touch: press and drag to scrub a crosshair with a tooltip. Every chart has "Show as table".
- The 100 paths of Risk Lab: 1 px lines at 35% opacity, "you" drawn on top in slot 1, ruined
  paths dashed `#4A5260` with a count ("63 of 100 ruined").

## 10. 3D

One moment in the MVP: the **Survival Valley** in Risk Lab (plan §5.3), Phase 3. It loads last,
in its own file (budget ~150 KB compressed), only when the phone can afford it: not with reduced
motion, not with Save-Data, not under 3 GB of memory. The 2D chart beside it shows identical
data. No 3D in navigation, menus, dashboards or definitions (spec §17).

## 11. Layout

The phone is canonical: design at 375 px, check at 360 and 390. No horizontal scrolling, ever.

| Width | Layout |
| --- | --- |
| < 480 | One column, bottom nav |
| 480–1023 | The same column, centred, at most 480 px wide |
| ≥ 1024 | Nav becomes a left rail; a Lab and the coach can sit side by side; content at most 1120 px |

## 12. Words

Calm, direct, plain. Second person. Numbers instead of adjectives ("you'd last 12 days", not
"you'd struggle"). The coach speaks at most two sentences and one question at a time. No hype, no
"guaranteed", no emoji in coach lines. Local words where they're the real words (MoMo, susu,
trotro, data bundle), and Twi, Pidgin or Yoruba marked with the right `lang` so screen readers
say them properly. Every word on screen lives in `content/`.

## 13. Never

Purple SaaS gradients, glassmorphism, neon, huge hero sections, stock photos of people pointing at
charts, robot illustrations, pill-shaped cards, dashboard clutter, fake trading screenshots,
luxury-car or cash-stack imagery, confetti on money, red and green with no words, desktop-first
layouts, 3D anywhere the plan doesn't name (spec §82).

## 14. What approval covers

Look at `/design` and the five tabs on a phone, then say yes or change:

1. The palette: `ink`/`panel`/`raised`, the gold, the gain and loss pair.
2. Inter, and the type scale.
3. The five tabs, their icons and labels (Home · Learn · Practice · Progress · Coach).
4. The truth badges.
5. The motion rules.
