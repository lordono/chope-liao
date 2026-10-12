/**
 * Dealbreakers live outside the compatibility score.
 *
 * - Pair check: the band reflects day-to-day fit only; mismatched life topics
 *   appear in a separate "Worth a kopi chat" panel, worded neutrally and never
 *   saying whose answer caused it or who marked it as a must.
 * - Party Mode: a "must" conflict makes the pair unacceptable; each soft
 *   mismatch costs SOFT_DEALBREAKER_PENALTY percentile points (× its weight).
 */
import { SOFT_DEALBREAKER_PENALTY } from './config';
import type { DealbreakerKey, Profile } from './types';

export interface Topic {
  key: DealbreakerKey;
  /** True when at least one person marked this as needing to match. */
  must: boolean;
  /** Share of the soft penalty this topic carries in Party Mode. */
  weight: number;
  text: string;
}

export function dealbreakerTopics(a: Profile, b: Profile): Topic[] {
  const A = a.dealbreakers;
  const B = b.dealbreakers;
  const topics: Topic[] = [];

  // Kids: a two-step gap is a real difference; a one-step gap only matters
  // when someone said it must match.
  const kidsGap = Math.abs(A.kids - B.kids);
  const kidsMust = A.kidsMust || B.kidsMust;
  if (kidsGap >= 2 || (kidsGap === 1 && kidsMust)) {
    topics.push({ key: 'kids', must: kidsMust && kidsGap >= 2, weight: 1, text: 'You see kids in the future a bit differently.' });
  }

  // Smoking: compare each person's acceptance with the other's habit.
  const smokeLevel = (accept: number, other: number) => (other === 0 ? 0 : accept);
  const smoke = Math.max(smokeLevel(A.smokePartner, B.smokeSelf), smokeLevel(B.smokePartner, A.smokeSelf));
  if (smoke >= 1) {
    topics.push({ key: 'smoking', must: smoke === 2, weight: 1, text: 'Smoking or vaping might need a chat.' });
  }

  // Pets: pet lover vs. can't-live-with-pets is a must; vs. prefer-none is soft.
  const petClash = (lover: typeof A, other: typeof A) =>
    lover.pets === 0 ? (other.petsCannot ? 2 : other.pets === 2 ? 1 : 0) : 0;
  const pets = Math.max(petClash(A, B), petClash(B, A));
  if (pets >= 1) {
    topics.push({ key: 'pets', must: pets === 2, weight: 1, text: 'You feel differently about pets at home.' });
  }

  if (Math.abs(A.nearFamily - B.nearFamily) >= 2) {
    topics.push({ key: 'nearFamily', must: false, weight: 1, text: 'You have different hopes about living near family.' });
  }

  // Faith: only a soft topic, per design.
  if (A.faithMatters || B.faithMatters) {
    if (A.faith > 0 && B.faith > 0) {
      if (A.faith !== B.faith) {
        topics.push({
          key: 'faith',
          must: false,
          weight: 1,
          text: 'You come from different faiths or outlooks, and that matters to at least one of you.',
        });
      }
    } else {
      // Half weight: people who don't mind are never asked their faith, so
      // "unknown" is common and says little.
      topics.push({
        key: 'faith',
        must: false,
        weight: 0.5,
        text: 'One of you would love to share a faith or outlook. Worth talking about.',
      });
    }
  }
  return topics;
}

/** Both care about faith and share the same one: a gentle positive highlight. */
export function sharesFaith(a: Profile, b: Profile): boolean {
  const A = a.dealbreakers;
  const B = b.dealbreakers;
  return A.faithMatters && B.faithMatters && A.faith > 0 && A.faith === B.faith;
}

/** Party Mode penalty in percentile points: null = unacceptable pair. */
export function dealbreakerPenalty(a: Profile, b: Profile): number | null {
  const topics = dealbreakerTopics(a, b);
  if (topics.some((t) => t.must)) return null;
  return SOFT_DEALBREAKER_PENALTY * topics.reduce((s, t) => s + t.weight, 0);
}
