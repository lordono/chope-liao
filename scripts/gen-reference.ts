/**
 * Generates the seeded synthetic reference population and writes quantile
 * tables to src/engine/reference.json.
 *
 *   pnpm gen:reference            # default seed
 *   pnpm gen:reference -- 1234    # custom seed
 *
 * Re-run whenever questions, loadings or scoring weights change, and commit
 * the result.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { USER_CATEGORIES } from '../src/engine/dimensions';
import { mulberry32 } from '../src/engine/rng';
import { categoryScores, mutualScore } from '../src/engine/score';
import { synthProfile } from '../src/engine/synth';
import type { ReferenceTable } from '../src/engine/percentile';

export const DEFAULT_SEED = 20261012;
export const PEOPLE = 3000;
export const PAIRS = 100_000;

export function quantiles(values: number[], points: number): number[] {
  const sorted = values.slice().sort((a, b) => a - b);
  return Array.from({ length: points }, (_, i) => {
    const pos = (i / (points - 1)) * (sorted.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(sorted.length - 1, lo + 1);
    const v = sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
    return Math.round(v * 1e5) / 1e5;
  });
}

export function buildReference(seed: number, people = PEOPLE, pairs = PAIRS): ReferenceTable {
  const rng = mulberry32(seed);
  const pop = Array.from({ length: people }, () => synthProfile(rng));
  const mutual: number[] = [];
  const cats: Record<string, number[]> = Object.fromEntries(USER_CATEGORIES.map((c) => [c, []]));
  for (let k = 0; k < pairs; k++) {
    const i = Math.floor(rng() * people);
    let j = Math.floor(rng() * (people - 1));
    if (j >= i) j++;
    const a = pop[i]!;
    const b = pop[j]!;
    mutual.push(mutualScore(a, b));
    const cs = categoryScores(a, b);
    for (const c of USER_CATEGORIES) cats[c]!.push(cs[c]);
  }
  return {
    meta: { seed, people, pairs, generated: new Date().toISOString().slice(0, 10) },
    mutual: quantiles(mutual, 1001),
    categories: Object.fromEntries(USER_CATEGORIES.map((c) => [c, quantiles(cats[c]!, 101)])) as ReferenceTable['categories'],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const seed = Number(process.argv[2] ?? DEFAULT_SEED);
  const t0 = Date.now();
  const ref = buildReference(seed);
  const out = new URL('../src/engine/reference.json', import.meta.url);
  writeFileSync(out, JSON.stringify(ref) + '\n');
  const m = ref.mutual;
  console.log(
    `reference: seed=${seed} people=${PEOPLE} pairs=${PAIRS} in ${Date.now() - t0}ms\n` +
      `  mutual p5=${m[50]} p25=${m[250]} p50=${m[500]} p75=${m[750]} p95=${m[950]}`,
  );
}
