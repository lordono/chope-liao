/**
 * Synthetic people for the reference population and for tests.
 *
 * Each synthetic person has a latent position on every dimension (correlated
 * where real traits tend to correlate), draws a real quiz session, and answers
 * it with a noisy logit choice model. Their profile then goes through the same
 * pipeline (computeProfile → encode → decode) as a real person.
 *
 * The distributions are educated guesses, not survey data. The About page
 * says so.
 */
import { DIMENSIONS, type Dim, type UserCategory } from './dimensions';
import { roundTrip } from './codec';
import { computeProfile } from './profile';
import { gaussian, pickWeighted, type Rng } from './rng';
import { drawSession } from './sampler';
import type { Answers, Identity, IdentitySelf, Profile, Scale4 } from './types';

/** How strongly latent traits drive choices. Higher = less random answers. */
const CHOICE_BETA = 1.4;

/** Pairs of (target, source, strength): target += strength × source. */
const CORRELATIONS: [Dim, Dim, number][] = [
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
];

/** Mean shifts: most people are moderately secure. */
const MEANS: Partial<Record<Dim, number>> = { attachAnxiety: -0.3, attachAvoidance: -0.3, agreeableness: 0.2 };

const PRIORITY_BIAS: Record<UserCategory, number> = { direction: 0.3, character: 0.2, communication: 0, rhythm: -0.2 };

export function latentPerson(rng: Rng): Record<Dim, number> {
  const z = {} as Record<Dim, number>;
  for (const d of DIMENSIONS) z[d] = gaussian(rng) + (MEANS[d] ?? 0);
  for (const [t, s, k] of CORRELATIONS) z[t] += k * z[s];
  return z;
}

function toScale4(x: number): Scale4 {
  if (x < -0.9) return 0;
  if (x < 0) return 1;
  if (x < 0.9) return 2;
  return 3;
}

export function synthAnswers(rng: Rng, z: Record<Dim, number>): { answers: Answers; questions: ReturnType<typeof drawSession>['items'] } {
  const session = drawSession(rng);
  const answers: Answers = new Map();
  for (const { question: q } of session.items) {
    switch (q.kind) {
      case 'lifestyle':
      case 'scenario': {
        const utils = q.options.map((o) => {
          let u = 0;
          for (const [d, v] of Object.entries(o.loads) as [Dim, number][]) u += v * z[d];
          return Math.exp(CHOICE_BETA * u);
        });
        answers.set(q.id, { kind: 'choice', option: pickWeighted(utils, rng) });
        break;
      }
      case 'flavour':
        answers.set(q.id, { kind: 'flavour', option: pickWeighted([0.3, 0.3, 0.2, 0.2], rng) });
        break;
      case 'ideal':
        // People partly want someone like themselves, plus noise.
        answers.set(q.id, { kind: 'scale', value: toScale4(0.6 * z[q.dim] + 0.8 * gaussian(rng)) });
        break;
      case 'priority': {
        const x = gaussian(rng) + PRIORITY_BIAS[q.rightCat] - PRIORITY_BIAS[q.leftCat];
        answers.set(q.id, { kind: 'scale', value: toScale4(x) });
        break;
      }
      case 'dealbreaker': {
        const pick = (w: number[]) => pickWeighted(w, rng);
        const flag = (p: number) => (rng() < p ? 1 : 0);
        switch (q.key) {
          case 'kids':
            answers.set(q.id, { kind: 'dealbreaker', key: q.key, value: pick([0.45, 0.3, 0.15, 0.1]), extra: flag(0.35) });
            break;
          case 'smoking':
            answers.set(q.id, { kind: 'dealbreaker', key: q.key, value: pick([0.85, 0.1, 0.05]), extra: pick([0.35, 0.4, 0.25]) });
            break;
          case 'pets':
            answers.set(q.id, { kind: 'dealbreaker', key: q.key, value: pick([0.4, 0.45, 0.15]), extra: flag(0.08) });
            break;
          case 'nearFamily':
            answers.set(q.id, { kind: 'dealbreaker', key: q.key, value: pick([0.25, 0.4, 0.3, 0.05]), extra: 0 });
            break;
          case 'faith':
            answers.set(q.id, {
              kind: 'dealbreaker',
              key: q.key,
              value: pick([0.2, 0.25, 0.55]),
              extra: pick([0.1, 0.3, 0.2, 0.15, 0.06, 0.08, 0.09, 0.02]),
            });
            break;
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
export function synthProfile(rng: Rng, opts: { identity?: boolean } = {}): Profile {
  const z = latentPerson(rng);
  const { answers, questions } = synthAnswers(rng, z);
  const identity = opts.identity ? synthIdentity(rng) : undefined;
  return roundTrip(computeProfile(questions.map((i) => i.question), answers, identity));
}
