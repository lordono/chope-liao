/**
 * Per-dimension scale factors that make configured weights mean what they
 * say. A dimension whose fit varies a lot across pairs would otherwise swing
 * the score more than its weight suggests (and a narrow one less). The
 * factors are measured on the synthetic reference population by
 * `pnpm gen:reference` and stored in reference.json as `dimScale`.
 *
 * Kept separate from percentile.ts so the generator can measure with all
 * factors at 1 first, then apply them.
 */
import type { Dim } from './dimensions';
import reference from './reference.json';

export type ScaleKey = Dim | 'security';

const stored = (reference as { dimScale?: Partial<Record<ScaleKey, number>> }).dimScale ?? {};
let scales: Partial<Record<ScaleKey, number>> = { ...stored };

export function dimScale(key: ScaleKey): number {
  return scales[key] ?? 1;
}

/** For the reference generator only. */
export function setDimScales(next: Partial<Record<ScaleKey, number>>): void {
  scales = { ...next };
}
