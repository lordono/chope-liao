/**
 * Percentile bands against a seeded synthetic reference population.
 * The table is generated at build time by `pnpm gen:reference`
 * (scripts/gen-reference.ts) and committed as reference.json.
 */
import { BANDS, type BandId } from './config';
import type { UserCategory } from './dimensions';
import reference from './reference.json';

export interface ReferenceTable {
  meta: { seed: number; people: number; pairs: number; generated: string };
  /** 1001 quantiles of mutual scores (index i = i/10 percentile). */
  mutual: number[];
  /** 101 quantiles per user category. */
  categories: Record<UserCategory, number[]>;
}

export const REFERENCE = reference as ReferenceTable;

/** Percentile (0–100) of `score` within a sorted quantile table. */
export function percentileIn(table: readonly number[], score: number): number {
  const n = table.length;
  if (n < 2) return 50;
  const first = table[0] ?? 0;
  const last = table[n - 1] ?? 1;
  if (score <= first) return 0;
  if (score >= last) return 100;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((table[mid] ?? 0) <= score) lo = mid;
    else hi = mid;
  }
  const a = table[lo] ?? 0;
  const b = table[hi] ?? 1;
  const frac = b > a ? (score - a) / (b - a) : 0;
  return ((lo + frac) / (n - 1)) * 100;
}

/** Inverse: the score at a given percentile. */
export function scoreAtPercentile(table: readonly number[], pct: number): number {
  const n = table.length;
  const pos = (Math.min(100, Math.max(0, pct)) / 100) * (n - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(n - 1, lo + 1);
  const a = table[lo] ?? 0;
  const b = table[hi] ?? 1;
  return a + (b - a) * (pos - lo);
}

export function mutualPercentile(score: number, table: ReferenceTable = REFERENCE): number {
  return percentileIn(table.mutual, score);
}

export interface Band {
  id: BandId;
  name: string;
  blurb: string;
  /** "Top 3%" for the top bands only, otherwise null (no raw numbers below). */
  topLabel: string | null;
  /** 0–1 fill level for the kopi cup animation. */
  fill: number;
}

export function bandFor(percentile: number): Band {
  const band = BANDS.find((b) => percentile >= b.min) ?? BANDS[BANDS.length - 1]!;
  let topLabel: string | null = null;
  const top = 100 - percentile;
  if (band.id === 'rare') topLabel = `Top ${Math.max(1, Math.ceil(top))}%`;
  else if (band.id === 'steady') topLabel = `Top ${Math.max(5, Math.ceil(top / 5) * 5)}%`;
  const fills: Record<BandId, number> = { rare: 1, steady: 0.82, cantry: 0.62, mix: 0.42, opposites: 0.25 };
  return { id: band.id, name: band.name, blurb: band.blurb, topLabel, fill: fills[band.id] };
}

/** 1–5 segments for a category bar. Never a number. */
export function categoryLevel(cat: UserCategory, score: number, table: ReferenceTable = REFERENCE): number {
  const pct = percentileIn(table.categories[cat], score);
  return Math.min(5, 1 + Math.floor(pct / 20));
}
