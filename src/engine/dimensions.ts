/**
 * The scored dimensions. Order matters: it is the bit order inside a match
 * code, so only ever APPEND new dimensions and bump CODE_VERSION in codec.ts.
 *
 * Every trait is a 0–1 score. 0 is the left pole, 1 the right pole.
 */

export const DIMENSIONS = [
  // Character (Big Five)
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'steadiness',
  // Relational security (measured gently through scenarios, never shown)
  'attachAnxiety',
  'attachAvoidance',
  // Daily rhythm
  'chronotype',
  'tidiness',
  'activity',
  'foodAdventure',
  // Life direction
  'money',
  'ambition',
  'family',
  'togetherness',
  'roam',
  // Communication
  'texting',
  'conflict',
  'affection',
  'humour',
  // Complement
  'lead',
] as const;

export type Dim = (typeof DIMENSIONS)[number];

export const CATEGORIES = [
  'character',
  'security',
  'rhythm',
  'direction',
  'communication',
  'complement',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Categories a person can re-weight through "which matters more?" trade-offs. */
export const USER_CATEGORIES = ['character', 'rhythm', 'direction', 'communication'] as const;
export type UserCategory = (typeof USER_CATEGORIES)[number];

/**
 * How B's score on a dimension is compared with what A wants.
 *
 * - `similar`: A's ideal is A's own score (or A's stated ideal from trade-offs).
 * - `complement`: A's ideal is the opposite of A's own score.
 * - `similarPlusPartner`: mostly similarity, with a small bonus for B simply
 *   being high on the trait.
 * - `pairPattern`: handled as a pair lookup in score.ts (attachment), not per
 *   dimension.
 */
export type MatchRule = 'similar' | 'complement' | 'similarPlusPartner' | 'pairPattern';

export interface DimensionConfig {
  label: string;
  low: string;
  high: string;
  category: Category;
  rule: MatchRule;
  /** Base importance before the person's own trade-offs are blended in. */
  weight: number;
  /**
   * Positive-only highlight phrases, used as "You both ___." when BOTH people
   * sit clearly on the same side. Omit to never highlight this dimension.
   */
  highlight?: { low?: string; high?: string };
}

export const DIMENSION_CONFIG: Record<Dim, DimensionConfig> = {
  openness: {
    label: 'Curiosity',
    low: 'Familiar comforts',
    high: 'New experiences',
    category: 'character',
    rule: 'similar',
    weight: 0.8,
    highlight: { high: 'love trying something new', low: 'love the tried-and-tested' },
  },
  conscientiousness: {
    label: 'Organisation',
    low: 'Go with the flow',
    high: 'Organised',
    category: 'character',
    rule: 'similar',
    weight: 0.8,
    highlight: { high: 'actually remember the plan', low: 'keep plans loose and easy' },
  },
  extraversion: {
    label: 'Social energy',
    low: 'Recharges alone',
    high: 'Recharges with people',
    category: 'character',
    rule: 'similar',
    weight: 0.8,
    highlight: { high: 'get energy from a big makan gathering', low: 'recharge best with quiet time' },
  },
  agreeableness: {
    label: 'Warmth',
    low: 'Blunt',
    high: 'Accommodating',
    category: 'character',
    // Research on couples finds a partner's warmth predicts satisfaction for
    // almost everyone, so B being warm earns a small bonus on top of similarity.
    rule: 'similarPlusPartner',
    weight: 0.8,
    highlight: { high: 'would give up the last piece of kaya toast' },
  },
  steadiness: {
    label: 'Steadiness',
    low: 'Feels things intensely',
    high: 'Steady lah',
    category: 'character',
    // Same reasoning as warmth: a steadier partner tends to help both people.
    // Kept small on purpose so nobody is heavily penalised for feeling deeply.
    rule: 'similarPlusPartner',
    weight: 0.8,
    highlight: { high: 'stay calm when the MRT breaks down' },
  },
  attachAnxiety: {
    label: 'Reassurance needs',
    low: 'Rarely needs reassurance',
    high: 'Likes reassurance',
    category: 'security',
    // Attachment works as a pair pattern (anxious + avoidant is the classic
    // trap; anyone with a secure partner tends to do fine), so it is scored
    // as a combined lookup in score.ts rather than by similarity.
    rule: 'pairPattern',
    weight: 1,
  },
  attachAvoidance: {
    label: 'Closeness comfort',
    low: 'Comfortable with closeness',
    high: 'Needs lots of space',
    category: 'security',
    rule: 'pairPattern',
    weight: 1,
  },
  chronotype: {
    label: 'Body clock',
    low: 'Early bird',
    high: 'Night owl',
    category: 'rhythm',
    rule: 'similar',
    weight: 1,
    highlight: { high: 'come alive after 10pm', low: 'catch the first kopi of the morning' },
  },
  tidiness: {
    label: 'Home tidiness',
    low: 'Organised chaos',
    high: 'Everything in its place',
    category: 'rhythm',
    rule: 'similar',
    weight: 1,
    highlight: { high: 'like an empty sink', low: 'speak fluent organised chaos' },
  },
  activity: {
    label: 'Activity',
    low: 'Cosy indoors',
    high: 'Sporty outdoors',
    category: 'rhythm',
    rule: 'similar',
    weight: 1,
    highlight: { high: 'would rather be cycling along East Coast', low: 'love a cosy night in' },
  },
  foodAdventure: {
    label: 'Food adventure',
    low: 'Loyal to the usual stall',
    high: 'Will try every new stall',
    category: 'rhythm',
    rule: 'similar',
    weight: 1,
    highlight: { high: 'rush to try every new hawker stall', low: 'stay loyal to your usual stall' },
  },
  money: {
    label: 'Money style',
    low: 'Saves hard',
    high: 'Enjoys now',
    category: 'direction',
    rule: 'similar',
    weight: 1.3,
    highlight: { low: 'save with a plan', high: 'believe in treating yourselves' },
  },
  ambition: {
    label: 'Career drive',
    low: 'Work-life balance',
    high: 'Career drive',
    category: 'direction',
    rule: 'similar',
    weight: 1.3,
    highlight: { high: 'chase big goals', low: 'protect your weekends' },
  },
  family: {
    label: 'Family involvement',
    low: 'Independent unit',
    high: 'Family very involved',
    category: 'direction',
    rule: 'similar',
    weight: 1.3,
    highlight: { high: 'love a big family dinner', low: 'like building your own little unit' },
  },
  togetherness: {
    label: 'Togetherness',
    low: 'Lots of own space',
    high: 'Do everything together',
    category: 'direction',
    rule: 'similar',
    weight: 1.3,
    highlight: { high: 'like doing things together', low: 'give each other plenty of space' },
  },
  roam: {
    label: 'Roots or roam',
    low: 'Settle near home',
    high: 'Move abroad someday',
    category: 'direction',
    rule: 'similar',
    weight: 1.3,
    highlight: { high: 'dream of living overseas someday', low: 'feel rooted right here at home' },
  },
  texting: {
    label: 'Texting cadence',
    low: 'Replies in batches',
    high: 'Replies instantly',
    category: 'communication',
    rule: 'similar',
    weight: 1,
    highlight: { high: 'reply in seconds', low: 'keep it chill about reply times' },
  },
  conflict: {
    label: 'Conflict approach',
    low: 'Cool off first',
    high: 'Talk it out now',
    category: 'communication',
    // Deliberately similarity, not complement: a "talk now" person with a
    // "cool off" partner is the pursue-withdraw pattern linked to unhappy couples.
    rule: 'similar',
    weight: 1,
    highlight: { high: 'like to talk things out straight away', low: 'like to cool off before a big talk' },
  },
  affection: {
    label: 'Affection style',
    low: 'Low-key',
    high: 'Very expressive',
    category: 'communication',
    rule: 'similar',
    weight: 1,
    highlight: { high: 'say the sweet things out loud', low: 'show love quietly' },
  },
  humour: {
    label: 'Humour',
    low: 'Gentle and earnest',
    high: 'Playful and teasing',
    category: 'communication',
    rule: 'similar',
    weight: 1,
    highlight: { high: 'love a friendly roast', low: 'keep the jokes gentle' },
  },
  lead: {
    label: 'Planning role',
    low: 'Follows the plan',
    high: 'Makes the plan',
    category: 'complement',
    // The one complementary dimension. Two planners clash over the itinerary;
    // two followers end up at the same kopitiam forever. Evidence for
    // complementarity in general is thin, so it carries a light weight.
    rule: 'complement',
    weight: 0.4,
  },
};

/** Dimensions that can receive a stated ideal from partner trade-offs (code order). */
export const IDEAL_DIMS = ['lead', 'money', 'roam', 'togetherness', 'ambition'] as const satisfies readonly Dim[];
export type IdealDim = (typeof IDEAL_DIMS)[number];

/** Dimensions measured by a consistency pair (code order). */
export const CONSISTENCY_DIMS = ['conscientiousness', 'extraversion', 'lead'] as const satisfies readonly Dim[];
export type ConsistencyDim = (typeof CONSISTENCY_DIMS)[number];

export const USER_CATEGORY_LABEL: Record<UserCategory, string> = {
  character: 'Personality',
  rhythm: 'Lifestyle',
  direction: 'Life goals',
  communication: 'Communication',
};
