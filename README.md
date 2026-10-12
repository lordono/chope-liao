# Chope Liao

A Singapore-flavoured compatibility quiz. Everyone takes a short quiz and gets a
shareable **match code**. Two codes give a match result, and **Party Mode** runs
stable matching for a whole group, all inside the browser.

- **No backend, no network calls, no analytics, no cookies.** It's a static site
  that works offline after the first load.
- Answers live **in memory only**. Refreshing clears them. The only thing saved
  to storage is the theme and reduced-motion choice.
- Share codes go in the URL **fragment** (`/#c=…`), so static hosts never
  receive them.

## Setup

```bash
pnpm install
pnpm dev              # http://localhost:5173
pnpm test             # Vitest engine tests
pnpm build            # type-check + production build into dist/
pnpm preview          # serve the build (service worker active)
pnpm gen:reference    # regenerate the percentile reference table
```

Requires Node 20+ and pnpm. Deploy `dist/` to any static host. It uses relative
paths, so a sub-path works too.

## Project layout

```
src/
  engine/            pure scoring logic, no DOM (unit-tested)
    dimensions.ts    the 21 dimensions, match rules, base weights, highlight phrases
    config.ts        scoring knobs: blends, security block, bands, Party Mode thresholds
    sampler.ts       draws a stratified 36-question session into MRT stations
    profile.ts       answers → traits / confidence / weights / dealbreakers
    codec.ts         16-byte match code ↔ 16 words, CRC-10, friendly errors
    wordlist.ts      256 local-flavour words (every pair ≥ 3 edits apart)
    score.ts         directionalScore, mutualScore, category scores, highlights
    dealbreakers.ts  "worth a kopi chat" topics + Party Mode penalty
    percentile.ts    percentile bands from the reference table
    reference.json   generated quantile table + weight calibration (commit it)
    calibration.ts   per-dimension scale factors so weights mean what they say
    matching.ts      Gale–Shapley, Irving's stable roommates, greedy fallback
    profileType.ts   16 fun profile-card types
    synth.ts         synthetic people for the reference population and tests
  data/questions.ts  the question bank (144 items), stations, dealbreaker copy
  ui/                screens, router, components (QR, scanner, card, MRT bar)
  anim/              GSAP animations, each with a reduced-motion fallback
scripts/gen-reference.ts
tests/
public/              service worker, manifest, icon
```

There's no UI framework. The screens are simple enough for a tiny `h()` helper
and a hash router, which keeps the bundle small for phones on the MRT.

## How scoring works

**Dimensions (21):**
- Big Five character traits
- Two attachment dimensions
- Daily rhythm: chronotype, tidiness, activity, food adventurousness
- Life direction: money, ambition, family involvement, togetherness, roots vs roam
- Communication: texting, conflict approach, affection, humour
- One complementary dimension: lead ⟷ follow

**How quiz answers become traits:**
- Each scored question targets 2–3 dimensions.
- Each option has a loading in [-1, 1] on each dimension it targets.
- Items are **centred** (the chosen option is scored relative to the item's
  average option). This stops lopsided items from pushing everyone the same way.
- Traits with little evidence are pulled gently toward 0.5.

**`directionalScore(a, b)`** is how well B fits what A wants. It's a weighted
average of per-dimension fits:

| Rule | Fit |
|---|---|
| `similar` | `1 − |ideal − b|`, where ideal is A's own score, blended halfway with A's stated ideal from trade-offs |
| `complement` (lead only) | ideal = `1 − A's score` |
| `similarPlusPartner` (warmth, steadiness) | 70% similarity + 30% B's level |
| `pairPattern` (attachment) | One symmetric term (about 10% of the total). Bonus when either person is secure; penalty for anxious × avoidant. Nobody is penalised for their own score alone. |

**Weights:**
- Base weights come from `dimensions.ts`.
- Each weight is then **calibrated** (`calibration.ts`). Some dimensions' fits
  naturally vary more across pairs than others, which would let them swing the
  score more than their weight says. `pnpm gen:reference` measures each
  dimension's spread on the synthetic population and stores a scale factor in
  `reference.json`. As a result, each category's real pull on the score matches
  its configured share to within a few points. `tests/weightage.test.ts`
  guards this.
- They're multiplied by the person's category priorities and the strength of any
  stated ideals, both blended 50/50 with defaults.
- Stated preferences predict real attraction poorly, so they only move weights
  halfway.

**`mutualScore`** is the harmonic mean of both directions. The two directional
scores are never shown.

**Bands:**
- `pnpm gen:reference` builds 3,000 seeded synthetic people, scores 100,000
  random pairs, and stores 1,001 quantiles.
- A mutual score becomes a percentile, then a band:

| Band | Percentile |
|---|---|
| Rare find | ≥ 95 |
| Steady match | 75 – 95 |
| Can try | 45 – 75 |
| Interesting mix | 20 – 45 |
| Opposites attract? | < 20 |

Only the top two bands show a number ("Top 3%").

**Dealbreakers (kids, smoking, pets, living near family, faith):**
- They **don't** affect the pair-check band. They show up separately under
  "Worth a kopi chat", worded neutrally and never saying whose answer caused a
  topic.
- In Party Mode, a "must match" conflict makes a pair unacceptable.
- Each soft mismatch costs 12 percentile points. "Faith unknown" costs half,
  because people who don't mind are never asked their faith.

## Adding or editing questions

Edit `src/data/questions.ts`.

1. Pick the right array: `LIFESTYLE`, `SCENARIOS`, `IDEALS`, `PRIORITIES`. Flavour
   and dealbreakers are fixed sets.
2. Give it a unique `id` and 4 options for scenarios (one funny but still
   meaningful).
3. Add `loads` per option: `1` for a clear signal, `0.5` for a hint, negative
   for the left pole. Make sure every dimension the question targets appears at
   both poles somewhere across the options.
4. Mark heavier scenarios with `heavy: true` so they land in Plot Twist Park.
5. Run `pnpm test`. It checks loadings are valid, every session covers every
   dimension, and every dimension has both poles somewhere in the bank.
6. Run `pnpm gen:reference` and commit `reference.json`. Percentiles depend on
   the question bank.

How many of each type a session uses is set by `SESSION_MIX` in
`src/engine/sampler.ts`. Each dimension must get at least `MIN_EVIDENCE` of
evidence per session.

> **Don't** reorder `DIMENSIONS`, change bit widths in `codec.ts`, or edit
> `wordlist.ts` without bumping `CODE_VERSION`. Existing codes would decode
> wrongly. Flavour questions must keep exactly 4 options, and `FAITH_OPTIONS`
> at most 8.

## Adjusting scoring weights

| What | Where |
|---|---|
| How much a dimension matters by default | `weight` in `DIMENSION_CONFIG` (`dimensions.ts`) |
| Similar vs complementary | `rule` in `DIMENSION_CONFIG`, with a comment explaining why |
| How much trade-offs move weights | `STATED_PREFERENCE_BLEND` (`config.ts`) |
| Attachment block | `SECURITY_WEIGHT`, `SECURITY` (`config.ts`) |
| Low-confidence penalty | `LOW_CONFIDENCE_FACTOR` (`config.ts`) |
| Band cut-offs and copy | `BANDS` (`config.ts`) |
| Party Mode strictness | `PARTY_THRESHOLDS`, `SOFT_DEALBREAKER_PENALTY` (`config.ts`) |
| Synthetic population realism | `CHOICE_BETA`, `CORRELATIONS`, `MEANS` (`synth.ts`) |

After any change to questions or scoring, run `pnpm gen:reference && pnpm test`.
The tests check two things: fresh pairs from a different seed land near uniform
percentiles, and each category's real influence stays within 4 points of its
configured share.

## Match code format (v1)

128 bits, rendered as 16 words from the 256-word list.

| Field | Bits |
|---|---|
| Version | 3 |
| Traits (21 × 3) | 63 |
| Confidence flags | 3 |
| Category levels (4 × 2) | 8 |
| Stated ideals (5 × 3) | 15 |
| Dealbreakers | 16 |
| Identity | 5 |
| Flavour | 4 |
| Spare | 1 |
| CRC-10 | 10 |

- Bytes are reordered so the checksum leads, then XOR-whitened, so codes don't
  all start with the same word.
- CRC-10 catches every single-word error.
- Typos within one edit are auto-corrected.
- Codes are **encoded, not secret**. The About page says so.

## Known limitations and ideas

- **Synthetic answer distributions are educated guesses**, so percentiles are
  only as good as `synth.ts`. If you ever collect opt-in, anonymous answer
  distributions, plug them in there.
- **The stable matching is unique in practice.** Party scores are symmetric, so
  with no ties the stable matching is the same whichever side proposes. The
  proposing side is still randomised and shown, as specified. Ranking by
  directional scores would make the side matter, but would rank people by a
  number we promise never to reveal.
- **Lighthouse hasn't been run yet.** The page is built for it (small bundle,
  system fonts, labelled controls, focus management), but run it against
  `pnpm preview` before shipping.
- **The skyline, Merlion and characters are first-pass SVG art.** Replace them
  freely; colours come from CSS custom properties.
