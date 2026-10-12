import type { ConsistencyDim, Dim, IdealDim, UserCategory } from './dimensions';

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

/** Loadings in [-1, 1]. Negative pushes toward the left pole (reverse-keyed). */
export type Loads = Partial<Record<Dim, number>>;

export interface ChoiceOption {
  label: string;
  loads: Loads;
}

export type QuestionKind = 'lifestyle' | 'scenario' | 'flavour' | 'ideal' | 'priority' | 'dealbreaker';

interface BaseQuestion {
  id: string;
  prompt: string;
  /** Optional one-line helper shown under the prompt. */
  hint?: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  kind: 'lifestyle' | 'scenario';
  options: ChoiceOption[];
  /** Scenarios only: heavier ones go in the middle station. */
  heavy?: boolean;
  /** Both items of a consistency pair share the same key. */
  consistency?: ConsistencyDim;
}

export type FlavourKey = 'kopi' | 'chope';

/** Always asked, zero scoring weight, feeds highlights and the profile card. */
export interface FlavourQuestion extends BaseQuestion {
  kind: 'flavour';
  key: FlavourKey;
  /** Exactly 4 options (2 bits in the code). */
  options: { label: string; highlight: string }[];
}

/** "In a partner, would you rather…" — sets a stated ideal on one dimension. */
export interface IdealQuestion extends BaseQuestion {
  kind: 'ideal';
  dim: IdealDim;
  /** Left = wants the partner LOW on `dim`, right = HIGH. */
  left: string;
  right: string;
}

/** "Which matters more?" — shifts category weights. */
export interface PriorityQuestion extends BaseQuestion {
  kind: 'priority';
  leftCat: UserCategory;
  rightCat: UserCategory;
  left: string;
  right: string;
}

export type DealbreakerKey = 'kids' | 'smoking' | 'pets' | 'nearFamily' | 'faith';

export interface DealbreakerQuestion extends BaseQuestion {
  kind: 'dealbreaker';
  key: DealbreakerKey;
}

export type Question = ChoiceQuestion | FlavourQuestion | IdealQuestion | PriorityQuestion | DealbreakerQuestion;

// ---------------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------------

/** 4-point forced scale for trade-offs: 0 strong-left, 1 lean-left, 2 lean-right, 3 strong-right. */
export type Scale4 = 0 | 1 | 2 | 3;

export interface Dealbreakers {
  /** 0 yes definitely, 1 maybe, 2 probably not, 3 definitely not */
  kids: 0 | 1 | 2 | 3;
  kidsMust: boolean;
  /** 0 never, 1 occasionally, 2 regularly */
  smokeSelf: 0 | 1 | 2;
  /** 0 fine, 1 rather not, 2 dealbreaker */
  smokePartner: 0 | 1 | 2;
  /** 0 love/have pets, 1 fine either way, 2 prefer none */
  pets: 0 | 1 | 2;
  /** allergic or otherwise can't live with pets */
  petsCannot: boolean;
  /** 0 very important, 1 nice to have, 2 doesn't matter, 3 prefer some distance */
  nearFamily: 0 | 1 | 2 | 3;
  /** sharing a faith or outlook matters to me */
  faithMatters: boolean;
  /** 0 prefer not to say / not asked; see FAITH_OPTIONS in questions.ts */
  faith: number;
}

export interface DealbreakerAnswer {
  kind: 'dealbreaker';
  key: DealbreakerKey;
  /** Primary choice index. */
  value: number;
  /** Secondary choice (smoking partner, faith group) or toggle as 0/1. */
  extra: number;
}

export type Answer =
  | { kind: 'choice'; option: number }
  | { kind: 'flavour'; option: number }
  | { kind: 'scale'; value: Scale4 }
  | DealbreakerAnswer;

export type Answers = Map<string, Answer>;

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** 0 skip, 1 woman, 2 man, 3 non-binary */
export type IdentitySelf = 0 | 1 | 2 | 3;

export interface Identity {
  self: IdentitySelf;
  /** Bitmask: 1 women, 2 men, 4 non-binary. 0 = not set (open to anyone). */
  openTo: number;
}

export interface Profile {
  traits: Record<Dim, number>;
  /** 1 = consistent, 0.5 = the consistency pair contradicted itself. */
  confidence: Record<ConsistencyDim, number>;
  /** Category multipliers as levels 0–3 (see CATEGORY_LEVELS in config.ts). */
  categoryLevels: Record<UserCategory, number>;
  /** Stated ideals: 0 none, 1–4 = Scale4 + 1. */
  ideals: Record<IdealDim, number>;
  dealbreakers: Dealbreakers;
  identity: Identity;
  flavour: { kopi: number; chope: number };
}
