import { describe, expect, it } from 'vitest';
import { dealbreakerPenalty, dealbreakerTopics } from '../src/engine/dealbreakers';
import { mutualPercentile } from '../src/engine/percentile';
import { DIMENSIONS } from '../src/engine/dimensions';
import { partyScore } from '../src/engine/matching';
import { mulberry32 } from '../src/engine/rng';
import { categoryScores, directionalScore, highlights, mutualScore, securityFit } from '../src/engine/score';
import { synthProfile } from '../src/engine/synth';
import type { Profile } from '../src/engine/types';

const rng = mulberry32(7);
const pop = Array.from({ length: 80 }, () => synthProfile(rng));

describe('mutualScore', () => {
  it('is symmetric and stays in [0, 1]', () => {
    for (let i = 0; i < pop.length; i++) {
      for (let j = i + 1; j < pop.length; j += 7) {
        const a = pop[i]!;
        const b = pop[j]!;
        const ab = mutualScore(a, b);
        expect(ab).toBeCloseTo(mutualScore(b, a), 12);
        expect(ab).toBeGreaterThanOrEqual(0);
        expect(ab).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is never above either directional score by much (harmonic mean ≤ arithmetic mean)', () => {
    const [a, b] = pop as [Profile, Profile];
    const d1 = directionalScore(a, b);
    const d2 = directionalScore(b, a);
    expect(mutualScore(a, b)).toBeLessThanOrEqual((d1 + d2) / 2 + 1e-12);
  });

  it('scores a near-clone higher than a mirror image', () => {
    const a = pop[0]!;
    const clone = structuredClone(a);
    const mirror = structuredClone(a);
    for (const d of DIMENSIONS) mirror.traits[d] = 1 - a.traits[d];
    expect(mutualScore(a, clone)).toBeGreaterThan(mutualScore(a, mirror));
  });

  it('treats planning role as complementary', () => {
    const a = structuredClone(pop[0]!);
    const b = structuredClone(pop[0]!);
    const c = structuredClone(pop[0]!);
    a.traits.lead = 1;
    b.traits.lead = 0; // follower
    c.traits.lead = 1; // another planner
    expect(directionalScore(a, b)).toBeGreaterThan(directionalScore(a, c));
  });

  it('penalises the anxious × avoidant pairing more than two secure people', () => {
    const base = structuredClone(pop[0]!);
    const anxious = { ...base, traits: { ...base.traits, attachAnxiety: 1, attachAvoidance: 0.2 } };
    const avoidant = { ...base, traits: { ...base.traits, attachAnxiety: 0.2, attachAvoidance: 1 } };
    const secure = { ...base, traits: { ...base.traits, attachAnxiety: 0.1, attachAvoidance: 0.1 } };
    expect(securityFit(anxious, avoidant)).toBeLessThan(securityFit(secure, secure));
    expect(securityFit(anxious, secure)).toBeGreaterThan(securityFit(anxious, avoidant));
  });

  it('category scores stay in [0, 1]', () => {
    const cs = categoryScores(pop[1]!, pop[2]!);
    for (const v of Object.values(cs)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('dealbreakers', () => {
  const withDb = (p: Profile, db: Partial<Profile['dealbreakers']>): Profile => ({
    ...p,
    dealbreakers: { ...p.dealbreakers, ...db },
  });
  const calm = { kids: 1, kidsMust: false, smokeSelf: 0, smokePartner: 0, pets: 1, petsCannot: false, nearFamily: 1, faithMatters: false, faith: 0 } as const;

  it('leave the pair-check score untouched but are reported separately', () => {
    const a = withDb(pop[0]!, { ...calm, kids: 0, kidsMust: true });
    const b = withDb(pop[1]!, { ...calm, kids: 3 });
    const before = mutualScore(withDb(a, calm), withDb(b, calm));
    expect(mutualScore(a, b)).toBeCloseTo(before, 12);
    const topics = dealbreakerTopics(a, b);
    expect(topics.map((t) => t.key)).toContain('kids');
    expect(topics.find((t) => t.key === 'kids')?.must).toBe(true);
  });

  it('make a "must" conflict unacceptable in Party Mode and soft ones a penalty', () => {
    const a = withDb(pop[0]!, { ...calm, kids: 0, kidsMust: true });
    const b = withDb(pop[1]!, { ...calm, kids: 3 });
    expect(dealbreakerPenalty(a, b)).toBeNull();
    expect(partyScore(a, b)).toBeNull();

    const c = withDb(pop[0]!, { ...calm, nearFamily: 0 });
    const d = withDb(pop[1]!, { ...calm, nearFamily: 3 });
    const penalty = dealbreakerPenalty(c, d);
    expect(penalty).toBeGreaterThan(0);
    expect(partyScore(c, d)!).toBeCloseTo(mutualPercentile(mutualScore(c, d)) - penalty!, 9);
  });

  it('never say whose answer caused a topic', () => {
    const a = withDb(pop[0]!, { ...calm, smokeSelf: 2 });
    const b = withDb(pop[1]!, { ...calm, smokePartner: 2 });
    for (const t of [...dealbreakerTopics(a, b), ...dealbreakerTopics(b, a)]) {
      expect(t.text).not.toMatch(/\byou (smoke|said|marked)\b/i);
    }
    expect(dealbreakerTopics(a, b)).toEqual(dealbreakerTopics(b, a));
  });

  it('treat faith as soft only', () => {
    const a = withDb(pop[0]!, { ...calm, faithMatters: true, faith: 2 });
    const b = withDb(pop[1]!, { ...calm, faith: 0 });
    const topics = dealbreakerTopics(a, b);
    expect(topics).toHaveLength(1);
    expect(topics[0]!.must).toBe(false);
  });
});

describe('highlights', () => {
  it('returns 1–4 positive lines and never mentions mismatches', () => {
    for (let i = 0; i < 20; i++) {
      const hs = highlights(pop[i]!, pop[i + 1]!);
      expect(hs.length).toBeGreaterThanOrEqual(1);
      expect(hs.length).toBeLessThanOrEqual(4);
      for (const h of hs) expect(h).not.toMatch(/differ|mismatch|but you|unlike/i);
    }
  });
});
