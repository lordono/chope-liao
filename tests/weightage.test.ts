import { describe, expect, it } from 'vitest';
import { dimScale } from '../src/engine/calibration';
import { SECURITY_WEIGHT } from '../src/engine/config';
import { CATEGORIES, DIMENSIONS, DIMENSION_CONFIG, type Category } from '../src/engine/dimensions';
import { mulberry32 } from '../src/engine/rng';
import { dimensionFit, securityFit, weightFor } from '../src/engine/score';
import { synthProfile } from '../src/engine/synth';
import type { Profile } from '../src/engine/types';

/**
 * Guards that configured weights are the weights people actually get: each
 * category's pull on the score (weight × spread of its fit across random
 * pairs) should match its share of configured weight. Re-run
 * `pnpm gen:reference` if this fails after editing questions or weights.
 */
describe('weightage', () => {
  // Fresh seed, neutral stated preferences, so we test the calibration itself.
  const rng = mulberry32(2024);
  const pop: Profile[] = Array.from({ length: 500 }, () => {
    const p = synthProfile(rng);
    p.categoryLevels = { character: 1, rhythm: 1, direction: 1, communication: 1 };
    for (const k of Object.keys(p.ideals) as (keyof Profile['ideals'])[]) p.ideals[k] = 0;
    return p;
  });

  const sd = (v: number[]) => {
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
  };

  it('gives each category its intended share of influence (±4 points)', () => {
    const fits: Record<string, number[]> = {};
    const weights: Record<string, number> = {};
    for (let k = 0; k < 6000; k++) {
      const a = pop[Math.floor(rng() * pop.length)]!;
      const b = pop[Math.floor(rng() * pop.length)]!;
      for (const d of DIMENSIONS) {
        if (DIMENSION_CONFIG[d].rule === 'pairPattern') continue;
        (fits[d] ??= []).push(dimensionFit(a, b, d));
        weights[d] = weightFor(a, b, d);
      }
      (fits.security ??= []).push(securityFit(a, b));
    }
    weights.security = SECURITY_WEIGHT * dimScale('security');

    const actual: Partial<Record<Category, number>> = {};
    const intended: Partial<Record<Category, number>> = { security: SECURITY_WEIGHT };
    for (const key of Object.keys(fits)) {
      const cat: Category = key === 'security' ? 'security' : DIMENSION_CONFIG[key as keyof typeof DIMENSION_CONFIG].category;
      actual[cat] = (actual[cat] ?? 0) + weights[key]! * sd(fits[key]!);
      if (key !== 'security') intended[cat] = (intended[cat] ?? 0) + DIMENSION_CONFIG[key as keyof typeof DIMENSION_CONFIG].weight;
    }
    const totA = Object.values(actual).reduce((a, b) => a + b, 0);
    const totI = Object.values(intended).reduce((a, b) => a + b, 0);
    for (const c of CATEGORIES) {
      const a = (100 * actual[c]!) / totA;
      const i = (100 * intended[c]!) / totI;
      expect(Math.abs(a - i), `${c}: intended ${i.toFixed(1)}% actual ${a.toFixed(1)}%`).toBeLessThanOrEqual(4);
    }
  });

  it('keeps calibration factors moderate (no dimension needs a wild correction)', () => {
    for (const d of [...DIMENSIONS.filter((x) => DIMENSION_CONFIG[x].rule !== 'pairPattern'), 'security' as const]) {
      expect(dimScale(d), d).toBeGreaterThan(0.6);
      expect(dimScale(d), d).toBeLessThan(1.8);
    }
  });
});
