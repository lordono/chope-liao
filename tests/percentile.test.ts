import { describe, expect, it } from 'vitest';
import { buildReference } from '../scripts/gen-reference';
import { REFERENCE, bandFor, mutualPercentile, percentileIn, scoreAtPercentile } from '../src/engine/percentile';
import { mulberry32 } from '../src/engine/rng';
import { mutualScore } from '../src/engine/score';
import { synthProfile } from '../src/engine/synth';

describe('reference table', () => {
  it('is sorted and has the expected size', () => {
    expect(REFERENCE.mutual).toHaveLength(1001);
    for (let i = 1; i < REFERENCE.mutual.length; i++) expect(REFERENCE.mutual[i]!).toBeGreaterThanOrEqual(REFERENCE.mutual[i - 1]!);
    expect(REFERENCE.meta.people).toBe(3000);
  });

  it('is calibrated: fresh pairs from a different seed land near uniform percentiles', () => {
    const rng = mulberry32(999);
    const pop = Array.from({ length: 400 }, () => synthProfile(rng));
    const pcts: number[] = [];
    for (let k = 0; k < 4000; k++) {
      const i = Math.floor(rng() * pop.length);
      const j = (i + 1 + Math.floor(rng() * (pop.length - 1))) % pop.length;
      pcts.push(mutualPercentile(mutualScore(pop[i]!, pop[j]!)));
    }
    pcts.sort((a, b) => a - b);
    const median = pcts[Math.floor(pcts.length / 2)]!;
    expect(median).toBeGreaterThan(44);
    expect(median).toBeLessThan(56);
    const top5 = pcts.filter((p) => p >= 95).length / pcts.length;
    expect(top5).toBeGreaterThan(0.02);
    expect(top5).toBeLessThan(0.09);
  });

  it('is reproducible from its seed (small sample)', () => {
    const a = buildReference(5, 60, 2000);
    const b = buildReference(5, 60, 2000);
    expect(a.mutual).toEqual(b.mutual);
  });
});

describe('percentile helpers', () => {
  it('invert each other', () => {
    for (const p of [5, 20, 45, 75, 95]) expect(percentileIn(REFERENCE.mutual, scoreAtPercentile(REFERENCE.mutual, p))).toBeCloseTo(p, 0);
  });

  it('map to bands with numbers only for the top two', () => {
    expect(bandFor(97)).toMatchObject({ id: 'rare', topLabel: 'Top 3%' });
    expect(bandFor(80)).toMatchObject({ id: 'steady', topLabel: 'Top 20%' });
    expect(bandFor(60)).toMatchObject({ id: 'cantry', topLabel: null });
    expect(bandFor(30)).toMatchObject({ id: 'mix', topLabel: null });
    expect(bandFor(5)).toMatchObject({ id: 'opposites', topLabel: null });
  });
});
