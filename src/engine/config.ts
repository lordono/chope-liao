/**
 * Scoring knobs in one place. See README "Adjusting scoring weights".
 * Per-dimension base weights and match rules live in dimensions.ts.
 */

/** Multipliers for the 2-bit category levels produced by priority trade-offs. */
export const CATEGORY_LEVELS = [0.7, 1.0, 1.2, 1.45] as const;
export const DEFAULT_CATEGORY_LEVEL = 1;

/**
 * Stated partner preferences predict real attraction poorly (Eastwick et al.,
 * 2014), so a person's own trade-offs only move their weights halfway.
 * 0 = ignore trade-offs, 1 = trust them completely.
 */
export const STATED_PREFERENCE_BLEND = 0.5;

/** Ideal value and weight boost for each Scale4 answer on an ideal trade-off. */
export const IDEAL_VALUES = [0.1, 0.35, 0.65, 0.9] as const;
export const IDEAL_STRENGTH_BOOST = [1.5, 1.2, 1.2, 1.5] as const;

/** Weight multiplier applied to a dimension whose consistency pair contradicted. */
export const LOW_CONFIDENCE_FACTOR = 0.5;

/** `similarPlusPartner`: share of the fit that comes from B's level alone. */
export const PARTNER_EFFECT_SHARE = 0.3;

/**
 * Relational security block. Attachment anxiety and avoidance are combined
 * into one pair-pattern term with this total weight (about 10% of the score).
 */
export const SECURITY_WEIGHT = 2.0;
export const SECURITY = {
  /** Fit when neither person is secure and there is no trap. */
  base: 0.55,
  /** Bonus scaled by how secure the MORE secure person is. */
  secureBonus: 0.45,
  /** Penalty scaled by the anxious × avoidant overlap in either direction. */
  trapPenalty: 0.6,
} as const;

/**
 * Party Mode: percentile points a pair loses per soft dealbreaker mismatch.
 * Applied in percentile space because raw mutual scores are tightly bunched
 * (a multiplicative penalty would silently act like a hard filter).
 */
export const SOFT_DEALBREAKER_PENALTY = 12;

/** Party Mode minimum-score presets, as percentiles of the reference pairs. */
export const PARTY_THRESHOLDS = {
  relaxed: 20,
  normal: 35,
  picky: 60,
} as const;
export type PartyThreshold = keyof typeof PARTY_THRESHOLDS;

/** Band cut-offs (percentile of mutual score against the reference pairs). */
export const BANDS = [
  { id: 'rare', min: 95, name: 'Rare find', blurb: 'Like finding an empty seat on the MRT at 6pm.' },
  { id: 'steady', min: 75, name: 'Steady match', blurb: 'Steady lah. A lot of good stuff lines up.' },
  { id: 'cantry', min: 45, name: 'Can try', blurb: 'Plenty in common, with room to surprise each other.' },
  { id: 'mix', min: 20, name: 'Interesting mix', blurb: 'Different flavours. Like kaya with a bit of butter.' },
  { id: 'opposites', min: 0, name: 'Opposites attract?', blurb: 'Rojak energy. Unexpected things can work.' },
] as const;
export type BandId = (typeof BANDS)[number]['id'];
