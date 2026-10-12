/** Turns quiz answers into a Profile. Pure, no DOM. */
import { CONSISTENCY_DIMS, DIMENSIONS, IDEAL_DIMS, USER_CATEGORIES, type Dim, type UserCategory } from './dimensions';
import { DEFAULT_CATEGORY_LEVEL } from './config';
import { evidenceMass } from './sampler';
import type {
  Answers,
  ChoiceQuestion,
  DealbreakerAnswer,
  Dealbreakers,
  Identity,
  Profile,
  Question,
} from './types';

/** Shrinks low-evidence traits toward the middle (0.5). Higher = more shrinkage. */
const SHRINK = 0.5;

export const DEFAULT_DEALBREAKERS: Dealbreakers = {
  kids: 1,
  kidsMust: false,
  smokeSelf: 0,
  smokePartner: 0,
  pets: 1,
  petsCannot: false,
  nearFamily: 2,
  faithMatters: false,
  faith: 0,
};

export const DEFAULT_IDENTITY: Identity = { self: 0, openTo: 0 };

/** Item-level score on one dimension in [-1, 1], or null if the item doesn't target it. */
export function itemScore(q: ChoiceQuestion, option: number, dim: Dim): number | null {
  const mass = evidenceMass(q)[dim];
  if (!mass) return null;
  return (q.options[option]?.loads[dim] ?? 0) / mass;
}

/**
 * Item-centred score in [-1, 1]: the chosen option's loading minus the mean
 * loading across the item's options, scaled so the most extreme option is ±1.
 * This stops items whose options lean one way (e.g. a funny option with
 * humour +0.5 and three neutral ones) from pushing everybody up.
 */
export function centredItemScore(q: ChoiceQuestion, option: number, dim: Dim): number | null {
  const loads = q.options.map((o) => o.loads[dim] ?? 0);
  if (loads.every((v) => v === 0)) return null;
  const mean = loads.reduce((s, v) => s + v, 0) / loads.length;
  const span = Math.max(...loads.map((v) => Math.abs(v - mean)));
  return span > 0 ? ((loads[option] ?? 0) - mean) / span : 0;
}

function computeTraits(questions: Question[], answers: Answers): Record<Dim, number> {
  const num: Record<string, number> = {};
  const den: Record<string, number> = {};
  for (const q of questions) {
    if (q.kind !== 'lifestyle' && q.kind !== 'scenario') continue;
    const a = answers.get(q.id);
    if (!a || a.kind !== 'choice') continue;
    for (const [d, m] of Object.entries(evidenceMass(q)) as [Dim, number][]) {
      num[d] = (num[d] ?? 0) + m * (centredItemScore(q, a.option, d) ?? 0);
      den[d] = (den[d] ?? 0) + m;
    }
  }
  const traits = {} as Record<Dim, number>;
  for (const d of DIMENSIONS) {
    const mass = den[d] ?? 0;
    const raw = mass > 0 ? (num[d] ?? 0) / mass : 0;
    const shrunk = raw * (mass / (mass + SHRINK));
    traits[d] = Math.min(1, Math.max(0, 0.5 + 0.5 * shrunk));
  }
  return traits;
}

/**
 * A consistency pair "contradicts" when the two items point to opposite
 * poles and are clearly apart (e.g. +1 vs −0.5, or +1 vs −1). Two mild
 * answers either side of the middle (+0.5 vs −0.5) don't count.
 */
export function contradicts(s1: number, s2: number): boolean {
  return s1 * s2 < 0 && Math.abs(s1 - s2) >= 1.5;
}

function computeConfidence(questions: Question[], answers: Answers): Profile['confidence'] {
  const out = {} as Profile['confidence'];
  for (const dim of CONSISTENCY_DIMS) {
    const scores: number[] = [];
    for (const q of questions) {
      if ((q.kind !== 'lifestyle' && q.kind !== 'scenario') || q.consistency !== dim) continue;
      const a = answers.get(q.id);
      if (!a || a.kind !== 'choice') continue;
      const s = itemScore(q, a.option, dim);
      if (s !== null) scores.push(s);
    }
    const [s1, s2] = scores;
    out[dim] = s1 !== undefined && s2 !== undefined && contradicts(s1, s2) ? 0.5 : 1;
  }
  return out;
}

function computeIdeals(questions: Question[], answers: Answers): Profile['ideals'] {
  const sums: Record<string, number[]> = {};
  for (const q of questions) {
    if (q.kind !== 'ideal') continue;
    const a = answers.get(q.id);
    if (!a || a.kind !== 'scale') continue;
    (sums[q.dim] ??= []).push(a.value);
  }
  const out = {} as Profile['ideals'];
  for (const d of IDEAL_DIMS) {
    const vals = sums[d];
    out[d] = vals && vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) + 1 : 0;
  }
  return out;
}

/** Net votes → 2-bit level. Strong pick = 2 points, lean = 1; the other side loses the same. */
export function netToLevel(net: number): number {
  if (net <= -2) return 0;
  if (net <= 1) return 1;
  if (net <= 3) return 2;
  return 3;
}

function computeCategoryLevels(questions: Question[], answers: Answers): Profile['categoryLevels'] {
  const net: Record<UserCategory, number> = { character: 0, rhythm: 0, direction: 0, communication: 0 };
  let any = false;
  for (const q of questions) {
    if (q.kind !== 'priority') continue;
    const a = answers.get(q.id);
    if (!a || a.kind !== 'scale') continue;
    any = true;
    const points = a.value === 0 || a.value === 3 ? 2 : 1;
    const winner = a.value <= 1 ? q.leftCat : q.rightCat;
    const loser = a.value <= 1 ? q.rightCat : q.leftCat;
    net[winner] += points;
    net[loser] -= points;
  }
  const out = {} as Profile['categoryLevels'];
  for (const c of USER_CATEGORIES) out[c] = any ? netToLevel(net[c]) : DEFAULT_CATEGORY_LEVEL;
  return out;
}

function computeDealbreakers(questions: Question[], answers: Answers): Dealbreakers {
  const db: Dealbreakers = { ...DEFAULT_DEALBREAKERS };
  for (const q of questions) {
    if (q.kind !== 'dealbreaker') continue;
    const a = answers.get(q.id) as DealbreakerAnswer | undefined;
    if (!a || a.kind !== 'dealbreaker') continue;
    switch (q.key) {
      case 'kids':
        db.kids = clampInt(a.value, 0, 3) as Dealbreakers['kids'];
        db.kidsMust = a.extra === 1;
        break;
      case 'smoking':
        db.smokeSelf = clampInt(a.value, 0, 2) as Dealbreakers['smokeSelf'];
        db.smokePartner = clampInt(a.extra, 0, 2) as Dealbreakers['smokePartner'];
        break;
      case 'pets':
        db.pets = clampInt(a.value, 0, 2) as Dealbreakers['pets'];
        db.petsCannot = a.extra === 1;
        break;
      case 'nearFamily':
        db.nearFamily = clampInt(a.value, 0, 3) as Dealbreakers['nearFamily'];
        break;
      case 'faith':
        // 0 "a lot", 1 "somewhat" → matters; 2 "not really" → doesn't.
        db.faithMatters = a.value < 2;
        db.faith = db.faithMatters ? clampInt(a.extra, 0, 7) : 0;
        break;
    }
  }
  return db;
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

export function computeProfile(questions: Question[], answers: Answers, identity: Identity = DEFAULT_IDENTITY): Profile {
  const flavour = { kopi: 0, chope: 0 };
  for (const q of questions) {
    if (q.kind !== 'flavour') continue;
    const a = answers.get(q.id);
    if (a && a.kind === 'flavour') flavour[q.key] = clampInt(a.option, 0, 3);
  }
  return {
    traits: computeTraits(questions, answers),
    confidence: computeConfidence(questions, answers),
    categoryLevels: computeCategoryLevels(questions, answers),
    ideals: computeIdeals(questions, answers),
    dealbreakers: computeDealbreakers(questions, answers),
    identity: { ...identity },
    flavour,
  };
}
