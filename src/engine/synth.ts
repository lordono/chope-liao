/**
 * Synthetic people for the reference population and for tests.
 *
 * Each synthetic person has a latent position on every dimension (correlated
 * where real traits tend to correlate), draws a real quiz session, and answers
 * it with a noisy logit choice model. Their profile then goes through the same
 * pipeline (computeProfile → encode → decode) as a real person.
 *
 * Where Singapore data exists it is used (sources inline). Everything else is
 * an educated guess, and the About page says the reference pairs are simulated.
 * `pnpm audit:synth` prints realism checks for the current assumptions.
 */
import { DIMENSIONS, type Dim, type UserCategory } from './dimensions';
import { roundTrip } from './codec';
import { computeProfile } from './profile';
import { gaussian, pickWeighted, type Rng } from './rng';
import { drawSession } from './sampler';
import type { Answers, Identity, IdentitySelf, Profile, Scale4 } from './types';

/**
 * Every assumption about the synthetic population, in one place, so the
 * reference can be rebuilt (and sensitivity-tested) under different ones.
 */
export interface SynthConfig {
  /**
   * How strongly latent traits drive choices. Higher = less random answers.
   * Tuned so retaking the quiz (with different questions) reproduces traits at
   * r ≈ 0.65–0.7, typical for short personality inventories.
   */
  choiceBeta: number;
  /**
   * Higher-order factors (each loading in −1..1). Big Five traits share
   * "Stability" (organised, warm, steady) and "Plasticity" (sociable, curious)
   * factors, giving the modest positive intercorrelations (~0.2–0.3) seen in
   * meta-analyses (van der Linden et al., 2010).
   */
  factors: Partial<Record<Dim, number>>[];
  /** (target, source, strength): target leans toward source, then is rescaled to unit variance. */
  correlations: [Dim, Dim, number][];
  /** Latent mean shifts (in SD units). */
  means: Partial<Record<Dim, number>>;
  /** Pull toward each category in "which matters more?" answers. */
  priorityBias: Record<UserCategory, number>;
  /** How much stated partner ideals follow the person's own trait (0–1). */
  idealSelfSimilarity: number;
}

export const DEFAULT_SYNTH: SynthConfig = {
  choiceBeta: 2.8,
  factors: [
    { conscientiousness: 0.5, agreeableness: 0.5, steadiness: 0.55, extraversion: 0.2 },
    { extraversion: 0.5, openness: 0.5 },
  ],
  correlations: [
    ['tidiness', 'conscientiousness', 0.5],
    ['lead', 'conscientiousness', 0.4],
    ['money', 'conscientiousness', -0.3],
    ['chronotype', 'conscientiousness', -0.2],
    ['humour', 'extraversion', 0.3],
    ['texting', 'extraversion', 0.2],
    ['steadiness', 'attachAnxiety', -0.5],
    ['texting', 'attachAnxiety', 0.3],
    ['togetherness', 'attachAnxiety', 0.3],
    ['togetherness', 'attachAvoidance', -0.4],
    ['affection', 'attachAvoidance', -0.4],
    ['foodAdventure', 'openness', 0.4],
    ['roam', 'openness', 0.4],
  ],
  means: { attachAnxiety: -0.3, attachAvoidance: -0.3, agreeableness: 0.2 },
  priorityBias: { direction: 0.3, character: 0.2, communication: 0, rhythm: -0.2 },
  idealSelfSimilarity: 0.6,
};

export function latentPerson(rng: Rng, cfg: SynthConfig = DEFAULT_SYNTH): Record<Dim, number> {
  const base = {} as Record<Dim, number>;
  for (const d of DIMENSIONS) base[d] = gaussian(rng);
  // Shared higher-order factors, keeping each trait at unit variance.
  const loadSq: Partial<Record<Dim, number>> = {};
  for (const f of cfg.factors) for (const [d, l] of Object.entries(f) as [Dim, number][]) loadSq[d] = (loadSq[d] ?? 0) + l * l;
  for (const d of DIMENSIONS) base[d] *= Math.sqrt(Math.max(0, 1 - (loadSq[d] ?? 0)));
  for (const f of cfg.factors) {
    const g = gaussian(rng);
    for (const [d, l] of Object.entries(f) as [Dim, number][]) base[d] += l * g;
  }
  // Correlate from the independent base draws, then rescale each target back
  // to unit variance so correlated traits aren't also more spread out.
  const z = { ...base };
  const extraVar: Partial<Record<Dim, number>> = {};
  for (const [t, s, k] of cfg.correlations) {
    z[t] += k * base[s];
    extraVar[t] = (extraVar[t] ?? 0) + k * k;
  }
  for (const d of DIMENSIONS) z[d] = z[d] / Math.sqrt(1 + (extraVar[d] ?? 0)) + (cfg.means[d] ?? 0);
  return z;
}

function toScale4(x: number): Scale4 {
  if (x < -0.9) return 0;
  if (x < 0) return 1;
  if (x < 0.9) return 2;
  return 3;
}

export function synthAnswers(rng: Rng, z: Record<Dim, number>, cfg: SynthConfig = DEFAULT_SYNTH): { answers: Answers; questions: ReturnType<typeof drawSession>['items'] } {
  const session = drawSession(rng);
  const answers: Answers = new Map();
  for (const { question: q } of session.items) {
    switch (q.kind) {
      case 'lifestyle':
      case 'scenario': {
        const utils = q.options.map((o) => {
          let u = 0;
          for (const [d, v] of Object.entries(o.loads) as [Dim, number][]) u += v * z[d];
          return Math.exp(cfg.choiceBeta * u);
        });
        answers.set(q.id, { kind: 'choice', option: pickWeighted(utils, rng) });
        break;
      }
      case 'flavour':
        answers.set(q.id, { kind: 'flavour', option: pickWeighted([0.3, 0.3, 0.2, 0.2], rng) });
        break;
      case 'ideal':
        // People partly want someone like themselves, plus noise.
        answers.set(q.id, { kind: 'scale', value: toScale4(cfg.idealSelfSimilarity * z[q.dim] + Math.sqrt(1 - cfg.idealSelfSimilarity ** 2) * gaussian(rng)) });
        break;
      case 'priority': {
        const x = gaussian(rng) + cfg.priorityBias[q.rightCat] - cfg.priorityBias[q.leftCat];
        answers.set(q.id, { kind: 'scale', value: toScale4(x) });
        break;
      }
      case 'dealbreaker': {
        const pick = (w: number[]) => pickWeighted(w, rng);
        const flag = (p: number) => (rng() < p ? 1 : 0);
        switch (q.key) {
          case 'kids': {
            // "8 in 10 young singles aspire to marry and have children"
            // (NPTD, Marriage & Parenthood Survey 2021). People at either end
            // are likelier to call it a must.
            const kids = pick([0.5, 0.3, 0.12, 0.08]);
            answers.set(q.id, { kind: 'dealbreaker', key: q.key, value: kids, extra: flag([0.4, 0.1, 0.15, 0.5][kids]!) });
            break;
          }
          case 'smoking':
            // Daily smoking 8.4–8.8% of adults (MOH NPHS 2023/2024).
            answers.set(q.id, { kind: 'dealbreaker', key: q.key, value: pick([0.86, 0.06, 0.08]), extra: pick([0.3, 0.4, 0.3]) });
            break;
          case 'pets':
            answers.set(q.id, { kind: 'dealbreaker', key: q.key, value: pick([0.4, 0.45, 0.15]), extra: flag(0.08) });
            break;
          case 'nearFamily':
            answers.set(q.id, { kind: 'dealbreaker', key: q.key, value: pick([0.25, 0.4, 0.3, 0.05]), extra: 0 });
            break;
          case 'faith': {
            // Group shares follow Census 2020 / GHS 2025, nudged toward younger
            // adults (more "no religion"). Index matches FAITH_OPTIONS.
            const group = pick([0, 0.28, 0.19, 0.15, 0.05, 0.07, 0.25, 0.01]);
            // Assumption: how likely each group is to want a shared faith.
            const cares = rng() < [0, 0.3, 0.6, 0.75, 0.45, 0.25, 0.1, 0.4][group]!;
            answers.set(q.id, {
              kind: 'dealbreaker',
              key: q.key,
              value: cares ? (rng() < 0.5 ? 0 : 1) : 2,
              // Some who care still prefer not to say.
              extra: cares && rng() < 0.1 ? 0 : group,
            });
            break;
          }
        }
        break;
      }
    }
  }
  return { answers, questions: session.items };
}

export function synthIdentity(rng: Rng): Identity {
  const self = pickWeighted([0.05, 0.47, 0.45, 0.03], rng) as IdentitySelf;
  // Weights indexed by openTo mask (1 women, 2 men, 4 non-binary).
  const byMask: Record<IdentitySelf, number[]> = {
    0: [1, 0, 0, 0, 0, 0, 0, 0],
    1: [0, 0.06, 0.85, 0.05, 0, 0, 0, 0.04],
    2: [0, 0.85, 0.06, 0.05, 0, 0, 0, 0.04],
    3: [0, 0, 0, 0, 0, 0, 0, 1],
  };
  return { self, openTo: pickWeighted(byMask[self], rng) };
}

/** A complete synthetic profile, quantised exactly like a decoded code. */
export function synthProfile(rng: Rng, opts: { identity?: boolean; config?: SynthConfig } = {}): Profile {
  const cfg = opts.config ?? DEFAULT_SYNTH;
  const z = latentPerson(rng, cfg);
  const { answers, questions } = synthAnswers(rng, z, cfg);
  const identity = opts.identity ? synthIdentity(rng) : undefined;
  return roundTrip(computeProfile(questions.map((i) => i.question), answers, identity));
}
