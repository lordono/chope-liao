import { describe, expect, it } from 'vitest';
import { FAITH_OPTIONS, FLAVOUR, QUESTION_BANK, SCENARIOS } from '../src/data/questions';
import { DIMENSIONS } from '../src/engine/dimensions';
import { contradicts, computeProfile } from '../src/engine/profile';
import { mulberry32 } from '../src/engine/rng';
import { MIN_EVIDENCE, drawSession, evidenceMass } from '../src/engine/sampler';
import type { Answers } from '../src/engine/types';

describe('question bank', () => {
  it('has about 70 items with unique ids', () => {
    expect(QUESTION_BANK.length).toBeGreaterThanOrEqual(65);
    expect(new Set(QUESTION_BANK.map((q) => q.id)).size).toBe(QUESTION_BANK.length);
  });

  it('only loads known dimensions with values in [-1, 1]', () => {
    for (const q of QUESTION_BANK) {
      if (q.kind !== 'lifestyle' && q.kind !== 'scenario') continue;
      for (const o of q.options) {
        for (const [d, v] of Object.entries(o.loads)) {
          expect(DIMENSIONS).toContain(d);
          expect(Math.abs(v)).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('gives every scenario 4 options and every dimension both poles somewhere', () => {
    for (const q of SCENARIOS) expect(q.options).toHaveLength(4);
    for (const d of DIMENSIONS) {
      const vals = QUESTION_BANK.flatMap((q) => (q.kind === 'lifestyle' || q.kind === 'scenario' ? q.options.map((o) => o.loads[d] ?? 0) : []));
      expect(Math.max(...vals), d).toBeGreaterThan(0);
      expect(Math.min(...vals), d).toBeLessThan(0);
    }
  });

  it('has three complete consistency pairs', () => {
    const counts: Record<string, number> = {};
    for (const q of QUESTION_BANK) if ((q.kind === 'lifestyle' || q.kind === 'scenario') && q.consistency) counts[q.consistency] = (counts[q.consistency] ?? 0) + 1;
    expect(counts).toEqual({ conscientiousness: 2, extraversion: 2, lead: 2 });
  });

  it('fits flavour and faith answers in their code bits', () => {
    for (const q of FLAVOUR) expect(q.options).toHaveLength(4);
    expect(FAITH_OPTIONS.length).toBeLessThanOrEqual(8);
  });
});

describe('sessions', () => {
  it('always have 36 questions, cover every dimension, and follow the station order', () => {
    const order = ['kopi', 'makan', 'eitheror', 'plottwist', 'serious', 'supper'];
    for (let seed = 0; seed < 200; seed++) {
      const s = drawSession(mulberry32(seed));
      expect(s.items).toHaveLength(36);
      expect(new Set(s.items.map((i) => i.question.id)).size).toBe(36);
      const stations = s.items.map((i) => order.indexOf(i.station));
      expect(stations).toEqual(stations.slice().sort((a, b) => a - b));
      const have: Record<string, number> = {};
      for (const { question: q } of s.items) {
        if (q.kind !== 'lifestyle' && q.kind !== 'scenario') continue;
        for (const [d, m] of Object.entries(evidenceMass(q))) have[d] = (have[d] ?? 0) + m;
      }
      for (const d of DIMENSIONS) expect(have[d] ?? 0, `${d} seed ${seed}`).toBeGreaterThanOrEqual(MIN_EVIDENCE);
      expect(s.items.filter((i) => i.question.kind === 'dealbreaker')).toHaveLength(5);
    }
  });
});

describe('profile', () => {
  it('lowers confidence when a consistency pair contradicts itself', () => {
    const s = drawSession(mulberry32(1));
    const qs = s.items.map((i) => i.question);
    const answers: Answers = new Map();
    // L17 option 0 = very organised; S10 option 2 = all-nighter.
    answers.set('L17', { kind: 'choice', option: 0 });
    answers.set('S10', { kind: 'choice', option: 2 });
    expect(computeProfile(qs, answers).confidence.conscientiousness).toBe(0.5);
    answers.set('S10', { kind: 'choice', option: 0 });
    expect(computeProfile(qs, answers).confidence.conscientiousness).toBe(1);
  });

  it('treats mild opposite answers as consistent', () => {
    expect(contradicts(0.5, -0.5)).toBe(false);
    expect(contradicts(1, -0.5)).toBe(true);
  });

  it('defaults to the middle with no answers', () => {
    const p = computeProfile([], new Map());
    for (const d of DIMENSIONS) expect(p.traits[d]).toBe(0.5);
  });
});
