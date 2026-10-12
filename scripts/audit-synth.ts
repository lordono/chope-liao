/**
 * Realism checks for the synthetic reference population.
 *
 *   pnpm audit:synth
 *
 * Prints how well the quiz recovers each synthetic person's true traits
 * (validity), how consistent a retake with different questions is
 * (reliability), Big Five intercorrelations as measured by the quiz, and how
 * often dealbreaker topics come up. Run after changing questions or synth.ts.
 */
import { roundTrip } from '../src/engine/codec';
import { dealbreakerTopics } from '../src/engine/dealbreakers';
import { DIMENSIONS, type Dim } from '../src/engine/dimensions';
import { computeProfile } from '../src/engine/profile';
import { mulberry32 } from '../src/engine/rng';
import { DEFAULT_SYNTH, latentPerson, synthAnswers, type SynthConfig } from '../src/engine/synth';
import type { Profile } from '../src/engine/types';

export function corr(xy: [number, number][]): number {
  const n = xy.length;
  const mx = xy.reduce((s, v) => s + v[0], 0) / n;
  const my = xy.reduce((s, v) => s + v[1], 0) / n;
  let sxy = 0;
  let sx = 0;
  let sy = 0;
  for (const [x, y] of xy) {
    sxy += (x - mx) * (y - my);
    sx += (x - mx) ** 2;
    sy += (y - my) ** 2;
  }
  return sxy / Math.sqrt(sx * sy);
}

export interface SynthAudit {
  validity: Record<Dim, number>;
  reliability: Record<Dim, number>;
  inconsistentShare: number;
  people: Profile[];
}

export function auditSynth(n = 1500, seed = 31, cfg: SynthConfig = DEFAULT_SYNTH): SynthAudit {
  const rng = mulberry32(seed);
  const valid: Record<string, [number, number][]> = {};
  const retest: Record<string, [number, number][]> = {};
  const people: Profile[] = [];
  let inconsistent = 0;
  const take = (z: Record<Dim, number>) => {
    const s = synthAnswers(rng, z, cfg);
    return roundTrip(computeProfile(s.questions.map((i) => i.question), s.answers));
  };
  for (let k = 0; k < n; k++) {
    const z = latentPerson(rng, cfg);
    const p1 = take(z);
    const p2 = take(z);
    people.push(p1);
    if (Object.values(p1.confidence).some((c) => c < 1)) inconsistent++;
    for (const d of DIMENSIONS) {
      (valid[d] ??= []).push([z[d], p1.traits[d]]);
      (retest[d] ??= []).push([p1.traits[d], p2.traits[d]]);
    }
  }
  const map = (src: Record<string, [number, number][]>) =>
    Object.fromEntries(DIMENSIONS.map((d) => [d, corr(src[d]!)])) as Record<Dim, number>;
  return { validity: map(valid), reliability: map(retest), inconsistentShare: inconsistent / n, people };
}

export const median = (xs: number[]) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;

function main() {
  const a = auditSynth();
  const fmt = (r: Record<Dim, number>) => {
    const sorted = DIMENSIONS.map((d) => [d, r[d]] as const).sort((x, y) => x[1] - y[1]);
    return `median ${median(Object.values(r)).toFixed(2)}, lowest ${sorted
      .slice(0, 3)
      .map(([d, v]) => `${d} ${v.toFixed(2)}`)
      .join(', ')}`;
  };
  console.log(`Validity (quiz vs true trait):   ${fmt(a.validity)}`);
  console.log(`Reliability (retake, new items): ${fmt(a.reliability)}`);
  console.log(`Flagged inconsistent (≥1 pair):  ${(a.inconsistentShare * 100).toFixed(0)}%`);
  const b5 = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'steadiness'] as const;
  const rows: string[] = [];
  for (let i = 0; i < 5; i++)
    for (let j = i + 1; j < 5; j++)
      rows.push(`${b5[i]!.slice(0, 4)}–${b5[j]!.slice(0, 4)} ${corr(a.people.map((p) => [p.traits[b5[i]!], p.traits[b5[j]!]])).toFixed(2)}`);
  console.log(`Big Five as measured:            ${rows.join(', ')}`);
  const rng = mulberry32(1);
  const freq: Record<string, number> = {};
  const N = 5000;
  for (let k = 0; k < N; k++) {
    const p = a.people[Math.floor(rng() * a.people.length)]!;
    const q = a.people[Math.floor(rng() * a.people.length)]!;
    for (const t of dealbreakerTopics(p, q)) freq[t.key + (t.must ? ' (must)' : '')] = (freq[t.key + (t.must ? ' (must)' : '')] ?? 0) + 1;
  }
  console.log(`Kopi-chat topics in random pairs: ${Object.entries(freq).map(([k, v]) => `${k} ${((v / N) * 100).toFixed(0)}%`).join(', ')}`);
}

if (process.argv[1]?.endsWith('audit-synth.ts')) main();
