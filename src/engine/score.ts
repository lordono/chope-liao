/**
 * Compatibility scoring. Pure functions, no DOM.
 *
 * directionalScore(a, b): how well B fits what A wants.
 * mutualScore(a, b):      harmonic mean of both directions, so a one-sided
 *                         fit scores low without revealing which side.
 *
 * Dealbreakers are deliberately NOT part of these scores. In pair check they
 * are shown separately (dealbreakers.ts); in Party Mode they act as a filter
 * or penalty (matching.ts / partyScore).
 */
import { FLAVOUR } from '../data/questions';
import {
  CONSISTENCY_DIMS,
  DIMENSIONS,
  DIMENSION_CONFIG,
  IDEAL_DIMS,
  USER_CATEGORIES,
  type Dim,
  type UserCategory,
} from './dimensions';
import {
  CATEGORY_LEVELS,
  IDEAL_STRENGTH_BOOST,
  IDEAL_VALUES,
  LOW_CONFIDENCE_FACTOR,
  PARTNER_EFFECT_SHARE,
  SECURITY,
  SECURITY_WEIGHT,
  STATED_PREFERENCE_BLEND,
} from './config';
import type { Profile } from './types';

const BLEND = STATED_PREFERENCE_BLEND;
const blend = (base: number, stated: number) => (1 - BLEND) * base + BLEND * stated;

function isIdealDim(d: Dim): d is (typeof IDEAL_DIMS)[number] {
  return (IDEAL_DIMS as readonly Dim[]).includes(d);
}
function isConsistencyDim(d: Dim): d is (typeof CONSISTENCY_DIMS)[number] {
  return (CONSISTENCY_DIMS as readonly Dim[]).includes(d);
}
function isUserCategory(c: string): c is UserCategory {
  return (USER_CATEGORIES as readonly string[]).includes(c);
}

/** What A would ideally want B to score on `d`. */
export function idealFor(a: Profile, d: Dim): number {
  const cfg = DIMENSION_CONFIG[d];
  const own = a.traits[d];
  const base = cfg.rule === 'complement' ? 1 - own : own;
  if (isIdealDim(d) && a.ideals[d] > 0) {
    const stated = IDEAL_VALUES[a.ideals[d] - 1] ?? base;
    return blend(base, stated);
  }
  return base;
}

/** How much A cares about `d` (before normalisation). */
export function weightFor(a: Profile, b: Profile, d: Dim): number {
  const cfg = DIMENSION_CONFIG[d];
  let w = cfg.weight;
  if (isUserCategory(cfg.category)) {
    w *= blend(1, CATEGORY_LEVELS[a.categoryLevels[cfg.category]] ?? 1);
  }
  if (isIdealDim(d) && a.ideals[d] > 0) {
    w *= blend(1, IDEAL_STRENGTH_BOOST[a.ideals[d] - 1] ?? 1);
  }
  if (isConsistencyDim(d) && Math.min(a.confidence[d], b.confidence[d]) < 1) {
    w *= LOW_CONFIDENCE_FACTOR;
  }
  return w;
}

/** Fit of B to A on one (non pair-pattern) dimension, in [0, 1]. */
export function dimensionFit(a: Profile, b: Profile, d: Dim): number {
  const cfg = DIMENSION_CONFIG[d];
  const closeness = 1 - Math.abs(idealFor(a, d) - b.traits[d]);
  if (cfg.rule === 'similarPlusPartner') {
    return (1 - PARTNER_EFFECT_SHARE) * closeness + PARTNER_EFFECT_SHARE * b.traits[d];
  }
  return closeness;
}

/**
 * Attachment pair pattern, symmetric. Anyone with a secure partner tends to do
 * fine (bonus scales with the more secure person); anxious × avoidant is the
 * classic trap (penalty). Nobody is penalised for their own score alone.
 */
export function securityFit(a: Profile, b: Profile): number {
  const secure = (p: Profile) => 1 - Math.max(p.traits.attachAnxiety, p.traits.attachAvoidance);
  const s = Math.max(secure(a), secure(b));
  const trap = Math.max(
    a.traits.attachAnxiety * b.traits.attachAvoidance,
    a.traits.attachAvoidance * b.traits.attachAnxiety,
  );
  return clamp01(SECURITY.base + SECURITY.secureBonus * s - SECURITY.trapPenalty * trap);
}

function weightedFit(a: Profile, b: Profile, dims: readonly Dim[], includeSecurity: boolean): number {
  let num = 0;
  let den = 0;
  for (const d of dims) {
    if (DIMENSION_CONFIG[d].rule === 'pairPattern') continue;
    const w = weightFor(a, b, d);
    num += w * dimensionFit(a, b, d);
    den += w;
  }
  if (includeSecurity) {
    num += SECURITY_WEIGHT * securityFit(a, b);
    den += SECURITY_WEIGHT;
  }
  return den > 0 ? clamp01(num / den) : 0.5;
}

export function directionalScore(a: Profile, b: Profile): number {
  return weightedFit(a, b, DIMENSIONS, true);
}

export function harmonicMean(x: number, y: number): number {
  return x + y > 0 ? (2 * x * y) / (x + y) : 0;
}

export function mutualScore(a: Profile, b: Profile): number {
  return harmonicMean(directionalScore(a, b), directionalScore(b, a));
}

/** Mutual fit within each user-facing category (for the optional bars). */
export function categoryScores(a: Profile, b: Profile): Record<UserCategory, number> {
  const out = {} as Record<UserCategory, number>;
  for (const c of USER_CATEGORIES) {
    const dims = DIMENSIONS.filter((d) => DIMENSION_CONFIG[d].category === c);
    out[c] = harmonicMean(weightedFit(a, b, dims, false), weightedFit(b, a, dims, false));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Positive-only highlights
// ---------------------------------------------------------------------------

/** Both at or beyond this distance from the middle counts as "clearly the same side". */
const HIGHLIGHT_EDGE = 0.2;
/** Used only when nothing clears HIGHLIGHT_EDGE: one quantisation step off-centre. */
const HIGHLIGHT_EDGE_RELAXED = 0.07;

function sharedTraitPhrases(a: Profile, b: Profile, edge: number): { text: string; strength: number }[] {
  const phrases: { text: string; strength: number }[] = [];
  for (const d of DIMENSIONS) {
    const h = DIMENSION_CONFIG[d].highlight;
    if (!h) continue;
    const da = a.traits[d] - 0.5;
    const db = b.traits[d] - 0.5;
    const strength = Math.min(Math.abs(da), Math.abs(db));
    if (strength < edge || Math.sign(da) !== Math.sign(db)) continue;
    const text = da > 0 ? h.high : h.low;
    if (text) phrases.push({ text, strength });
  }
  return phrases.sort((x, y) => y.strength - x.strength);
}

export function highlights(a: Profile, b: Profile, max = 4): string[] {
  let phrases = sharedTraitPhrases(a, b, HIGHLIGHT_EDGE);
  if (phrases.length < 2) phrases = sharedTraitPhrases(a, b, HIGHLIGHT_EDGE_RELAXED).slice(0, 2);

  const flavour: string[] = [];
  for (const q of FLAVOUR) {
    if (a.flavour[q.key] === b.flavour[q.key]) {
      const text = q.options[a.flavour[q.key]]?.highlight;
      if (text) flavour.push(text);
    }
  }

  const out: string[] = [];
  const dimTexts = phrases.map((p) => p.text);
  // Pair a trait with a flavour detail when we can: "You both come alive after
  // 10pm and chope seats with umbrellas."
  while (out.length < max && (dimTexts.length || flavour.length)) {
    const t = dimTexts.shift();
    const f = out.length === 0 ? flavour.shift() : undefined;
    if (t && f) out.push(`You both ${t} and ${f}.`);
    else if (t) out.push(`You both ${t}.`);
    else if (flavour.length || f) out.push(`You both ${f ?? flavour.shift()}.`);
  }
  if (out.length === 0) out.push("You'll have plenty to discover about each other.");
  return out.slice(0, max);
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}
