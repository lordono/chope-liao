import { describe, expect, it } from 'vitest';
import {
  blockingPairs,
  galeShapley,
  greedyMatching,
  isValidMatching,
  prefsFromMatrix,
  roommatesWithFallback,
  runPartyMatching,
  stableRoommates,
} from '../src/engine/matching';
import { mulberry32, shuffle, type Rng } from '../src/engine/rng';
import { synthProfile } from '../src/engine/synth';

function randomBipartite(rng: Rng, nL: number, nR: number, pAccept: number) {
  const n = nL + nR;
  const left = Array.from({ length: nL }, (_, i) => i);
  const right = Array.from({ length: nR }, (_, i) => nL + i);
  // Asymmetric random preferences with random unacceptable pairs.
  const acceptable = (i: number, j: number) => ((i * 7919 + j * 104729) % 1000) / 1000 < pAccept;
  const prefs: number[][] = Array.from({ length: n }, () => []);
  for (const i of left) prefs[i] = shuffle(right, rng).filter((j) => acceptable(Math.min(i, j), Math.max(i, j)));
  for (const j of right) prefs[j] = shuffle(left, rng).filter((i) => acceptable(Math.min(i, j), Math.max(i, j)));
  return { n, left, right, prefs };
}

describe('Gale–Shapley', () => {
  it('never leaves a blocking pair (random pools, incomplete lists)', () => {
    const rng = mulberry32(1);
    for (let t = 0; t < 300; t++) {
      const nL = 1 + Math.floor(rng() * 12);
      const nR = 1 + Math.floor(rng() * 12);
      const { n, left, right, prefs } = randomBipartite(rng, nL, nR, 0.4 + rng() * 0.6);
      const proposeLeft = rng() < 0.5;
      const { match } = galeShapley(proposeLeft ? left : right, proposeLeft ? right : left, prefs, n);
      expect(isValidMatching(match)).toBe(true);
      expect(blockingPairs(prefs, match)).toEqual([]);
      // Only acceptable pairs are ever matched.
      match.forEach((j, i) => {
        if (j !== -1) expect(prefs[i]).toContain(j);
      });
    }
  });
});

describe('stable roommates', () => {
  it('finds stable matchings on random solvable instances', () => {
    const rng = mulberry32(2);
    let solved = 0;
    for (let t = 0; t < 300; t++) {
      const n = 2 + Math.floor(rng() * 12);
      const prefs = Array.from({ length: n }, (_, i) => shuffle([...Array(n).keys()].filter((j) => j !== i), rng));
      const res = stableRoommates(prefs);
      if (res.solvable) {
        solved++;
        expect(isValidMatching(res.match)).toBe(true);
        expect(blockingPairs(prefs, res.match)).toEqual([]);
      }
    }
    expect(solved).toBeGreaterThan(100);
  });

  it('detects the classic unsolvable instance and falls back gracefully', () => {
    // 0, 1, 2 each rank the next one first; everybody ranks 3 last.
    const prefs = [
      [1, 2, 3],
      [2, 0, 3],
      [0, 1, 2],
      [0, 1, 2],
    ];
    expect(stableRoommates(prefs).solvable).toBe(false);
    const m = prefs.map((p, i) => Array.from({ length: 4 }, (_, j) => (j === i ? null : 3 - p.indexOf(j))));
    const res = roommatesWithFallback(m, prefs);
    expect(res.usedFallback).toBe(true);
    expect(isValidMatching(res.match)).toBe(true);
    expect(res.match.filter((j) => j !== -1)).toHaveLength(4);
  });

  it('greedy matching only uses acceptable pairs', () => {
    const m = [
      [null, 0.9, null],
      [0.9, null, 0.5],
      [null, 0.5, null],
    ];
    expect(greedyMatching(m)).toEqual([1, 0, -1]);
  });
});

describe('runPartyMatching', () => {
  const rng = mulberry32(3);
  const pool = Array.from({ length: 24 }, () => synthProfile(rng, { identity: true }));

  it('returns a valid, stable matching with no forced bad pairings', () => {
    const res = runPartyMatching(pool, 35, mulberry32(4));
    expect(isValidMatching(res.match)).toBe(true);
    expect(res.stable).toBe(true);
    expect(res.note.length).toBeGreaterThan(10);
  });

  it('leaves everyone unmatched when the bar is impossibly high', () => {
    const res = runPartyMatching(pool, 101, mulberry32(5));
    expect(res.match.every((j) => j === -1)).toBe(true);
  });

  it('uses Gale–Shapley for a two-sided group and roommates otherwise', () => {
    const twoSided = pool.map((p, i) => ({ ...p, identity: { self: (i % 2 ? 1 : 2) as 1 | 2, openTo: i % 2 ? 2 : 1 } }));
    expect(runPartyMatching(twoSided, -Infinity, mulberry32(6)).algorithm).toBe('gale-shapley');
    const open = pool.map((p) => ({ ...p, identity: { self: 0 as const, openTo: 0 } }));
    expect(runPartyMatching(open, -Infinity, mulberry32(6)).algorithm).not.toBe('gale-shapley');
  });

  it('prefs from a symmetric matrix are consistent', () => {
    const m = [
      [null, 0.8, 0.3],
      [0.8, null, 0.6],
      [0.3, 0.6, null],
    ];
    expect(prefsFromMatrix(m)).toEqual([[1, 2], [0, 2], [1, 0]]);
  });
});
