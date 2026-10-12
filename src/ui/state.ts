/**
 * In-memory app state. Nothing here is ever written to storage; refreshing
 * the page clears it.
 */
import type { Answers, Identity, Participant, Profile, Session } from '../engine';

export interface AppState {
  session: Session | null;
  answers: Answers;
  identity: Identity;
  /** Index of the current quiz step. */
  step: number;
  /** My profile exactly as my code decodes (quantised). */
  me: Profile | null;
  myCode: string | null;
  /** A friend's decoded profile, from a link or paste. */
  friend: Profile | null;
  party: Participant[];
}

export const state: AppState = {
  session: null,
  answers: new Map(),
  identity: { self: 0, openTo: 0 },
  step: 0,
  me: null,
  myCode: null,
  friend: null,
  party: [],
};

export function resetQuiz(): void {
  state.session = null;
  state.answers = new Map();
  state.identity = { self: 0, openTo: 0 };
  state.step = 0;
}

export function shareUrl(code: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#c=${code}`;
}
