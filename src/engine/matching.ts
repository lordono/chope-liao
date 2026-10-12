/**
 * Party Mode matching. Pure functions, no DOM.
 *
 * 1. Build the acceptable pairs: identity filters both ways, no "must"
 *    dealbreaker conflict, and party score ≥ the minimum.
 * 2. If the identity-compatibility graph splits cleanly into two sides, run
 *    Gale–Shapley with a randomly chosen proposing side.
 * 3. Otherwise run Irving's stable roommates algorithm; if no stable matching
 *    exists, fall back to a greedy best-pairs-first matching and say so.
 *
 * Note: because party scores are symmetric (both people rank the pair by the
 * same number), a stable matching always exists and is unique when there are
 * no ties. Irving's fallback and the proposing side therefore mostly matter for
 * ties and for the general algorithms used in tests.
 */
import { dealbreakerPenalty } from './dealbreakers';
import { mutualPercentile } from './percentile';
import { mutualScore } from './score';
import type { Rng } from './rng';
import type { Identity, Profile } from './types';

export interface Participant {
  id: string;
  name: string;
  profile: Profile;
}

export type MatchEvent =
  | { type: 'propose'; from: number; to: number }
  | { type: 'hold'; by: number; from: number }
  | { type: 'reject'; by: number; from: number };

export interface MatchResult {
  algorithm: 'gale-shapley' | 'roommates' | 'greedy';
  /** Indices of each side (Gale–Shapley only). */
  sides?: { proposers: number[]; receivers: number[] };
  /** match[i] = partner index, or -1 for "no chope this round". */
  match: number[];
  stable: boolean;
  events: MatchEvent[];
  /** Plain-language explanation for the screen. */
  note: string;
}

const IDENTITY_BIT: Record<number, number> = { 1: 1, 2: 2, 3: 4 };

/** Is `b` someone `a` is open to? Unset fields are treated as open. */
function openTo(a: Identity, b: Identity): boolean {
  if (a.openTo === 0) return true;
  if (b.self === 0) return a.openTo === 7;
  return (a.openTo & (IDENTITY_BIT[b.self] ?? 0)) !== 0;
}

export function canPair(a: Identity, b: Identity): boolean {
  return openTo(a, b) && openTo(b, a);
}

/**
 * Party score for a pair, in percentile points: the mutual-score percentile
 * minus any soft dealbreaker penalty. Null if the pair is unacceptable.
 */
export function partyScore(a: Profile, b: Profile): number | null {
  if (!canPair(a.identity, b.identity)) return null;
  const penalty = dealbreakerPenalty(a, b);
  if (penalty === null) return null;
  return mutualPercentile(mutualScore(a, b)) - penalty;
}

/** Symmetric score matrix; null = unacceptable. Ties broken by tiny seeded jitter. */
export function scoreMatrix(profiles: Profile[], minPercentile: number, rng: Rng): (number | null)[][] {
  const n = profiles.length;
  const m: (number | null)[][] = Array.from({ length: n }, () => Array<number | null>(n).fill(null));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = partyScore(profiles[i]!, profiles[j]!);
      const v = s !== null && s >= minPercentile ? s + rng() * 1e-6 : null;
      m[i]![j] = v;
      m[j]![i] = v;
    }
  }
  return m;
}

export function prefsFromMatrix(m: (number | null)[][]): number[][] {
  return m.map((row) =>
    row
      .map((s, j) => ({ s, j }))
      .filter((x): x is { s: number; j: number } => x.s !== null)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.j),
  );
}

/** Two-colour the identity-compatibility graph. Returns null if it isn't bipartite. */
export function findTwoSides(profiles: Profile[]): { left: number[]; right: number[] } | null {
  const n = profiles.length;
  const colour = Array<number>(n).fill(-1);
  let edges = 0;
  for (let s = 0; s < n; s++) {
    if (colour[s] !== -1) continue;
    colour[s] = 0;
    const queue = [s];
    while (queue.length) {
      const u = queue.shift()!;
      for (let v = 0; v < n; v++) {
        if (v === u || !canPair(profiles[u]!.identity, profiles[v]!.identity)) continue;
        if (u < v) edges++;
        if (colour[v] === -1) {
          colour[v] = 1 - colour[u]!;
          queue.push(v);
        } else if (colour[v] === colour[u]) {
          return null;
        }
      }
    }
  }
  if (edges === 0) return null;
  return {
    left: colour.flatMap((c, i) => (c === 0 ? [i] : [])),
    right: colour.flatMap((c, i) => (c === 1 ? [i] : [])),
  };
}

// ---------------------------------------------------------------------------
// Gale–Shapley (incomplete lists)
// ---------------------------------------------------------------------------

export function galeShapley(
  proposers: number[],
  receivers: number[],
  prefs: number[][],
  n: number,
): { match: number[]; events: MatchEvent[] } {
  const receiverSet = new Set(receivers);
  const proposerSet = new Set(proposers);
  const events: MatchEvent[] = [];
  const match = Array<number>(n).fill(-1);
  const next = Array<number>(n).fill(0);
  const rank = prefs.map((p) => new Map(p.map((j, r) => [j, r])));
  // Each side only considers acceptable people on the other side.
  const lists = prefs.map((p, i) =>
    p.filter((j) => (proposerSet.has(i) ? receiverSet.has(j) : proposerSet.has(j)) && rank[j]?.has(i)),
  );
  const free = proposers.slice().reverse();

  while (free.length) {
    const p = free.pop()!;
    const list = lists[p] ?? [];
    if ((next[p] ?? 0) >= list.length) continue; // exhausted: stays unmatched
    const r = list[next[p]!]!;
    next[p]!++;
    events.push({ type: 'propose', from: p, to: r });
    const current = match[r]!;
    const rRank = rank[r]!;
    if (current === -1) {
      match[r] = p;
      match[p] = r;
      events.push({ type: 'hold', by: r, from: p });
    } else if ((rRank.get(p) ?? Infinity) < (rRank.get(current) ?? Infinity)) {
      match[r] = p;
      match[p] = r;
      match[current] = -1;
      events.push({ type: 'reject', by: r, from: current });
      events.push({ type: 'hold', by: r, from: p });
      free.push(current);
    } else {
      events.push({ type: 'reject', by: r, from: p });
      free.push(p);
    }
  }
  return { match, events };
}

// ---------------------------------------------------------------------------
// Irving's stable roommates (incomplete lists)
// ---------------------------------------------------------------------------

export function stableRoommates(prefs: number[][]): { match: number[]; solvable: boolean; events: MatchEvent[] } {
  const n = prefs.length;
  const events: MatchEvent[] = [];
  // Only mutually acceptable pairs.
  const list = prefs.map((p, i) => p.filter((j) => j !== i && (prefs[j]?.includes(i) ?? false)));
  const del = (i: number, j: number) => {
    list[i] = list[i]!.filter((x) => x !== j);
    list[j] = list[j]!.filter((x) => x !== i);
  };
  const deleteSuccessors = (y: number, x: number) => {
    const l = list[y]!;
    const idx = l.indexOf(x);
    if (idx === -1) return;
    for (const w of l.slice(idx + 1)) del(y, w);
  };

  // Phase 1: proposals. holds[y] = proposer whose proposal y currently holds.
  const holds = Array<number>(n).fill(-1);
  const free = Array.from({ length: n }, (_, i) => n - 1 - i);
  while (free.length) {
    const x = free.pop()!;
    const y = list[x]![0];
    if (y === undefined) continue;
    events.push({ type: 'propose', from: x, to: y });
    const z = holds[y]!;
    if (z !== -1) {
      // y kept x in its list after holding z, so y prefers x.
      del(y, z);
      events.push({ type: 'reject', by: y, from: z });
      free.push(z);
    }
    holds[y] = x;
    events.push({ type: 'hold', by: y, from: x });
    deleteSuccessors(y, x);
  }

  const hadList = list.map((l) => l.length > 0);

  // Phase 2: find and eliminate rotations until every list has ≤ 1 entry.
  for (let guard = 0; guard < n * n + 10; guard++) {
    const p0 = list.findIndex((l) => l.length >= 2);
    if (p0 === -1) break;
    const ps = [p0];
    const qs: number[] = [];
    const seen = new Map<number, number>([[p0, 0]]);
    let start = -1;
    let cur = p0;
    for (let steps = 0; steps <= n + 1; steps++) {
      const q = list[cur]![1];
      if (q === undefined) return { match: Array(n).fill(-1), solvable: false, events };
      const ql = list[q]!;
      const nxt = ql[ql.length - 1]!;
      qs.push(q);
      const s = seen.get(nxt);
      if (s !== undefined) {
        start = s;
        break;
      }
      seen.set(nxt, ps.length);
      ps.push(nxt);
      cur = nxt;
    }
    if (start === -1) return { match: Array(n).fill(-1), solvable: false, events };
    const xs = ps.slice(start);
    const ys = qs.slice(start);
    xs.forEach((x, i) => deleteSuccessors(ys[i]!, x));
    if (list.some((l, i) => hadList[i] && l.length === 0)) {
      return { match: Array(n).fill(-1), solvable: false, events };
    }
  }

  const match = list.map((l, i) => {
    const j = l[0];
    return l.length === 1 && j !== undefined && list[j]?.[0] === i ? j : -1;
  });
  return { match, solvable: isStable(prefs, match) && isValidMatching(match), events };
}

// ---------------------------------------------------------------------------
// Greedy fallback & checks
// ---------------------------------------------------------------------------

/** Best pairs first. Always produces a valid matching of acceptable pairs. */
export function greedyMatching(m: (number | null)[][]): number[] {
  const n = m.length;
  const edges: { i: number; j: number; s: number }[] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const s = m[i]![j];
    if (s !== null && s !== undefined) edges.push({ i, j, s });
  }
  edges.sort((a, b) => b.s - a.s);
  const match = Array<number>(n).fill(-1);
  for (const { i, j } of edges) {
    if (match[i] === -1 && match[j] === -1) {
      match[i] = j;
      match[j] = i;
    }
  }
  return match;
}

export function isValidMatching(match: number[]): boolean {
  return match.every((j, i) => j === -1 || (j !== i && match[j] === i));
}

/** All pairs (i, j) who both prefer each other to their current situation. */
export function blockingPairs(prefs: number[][], match: number[]): [number, number][] {
  const rank = prefs.map((p) => new Map(p.map((j, r) => [j, r])));
  const prefersOver = (i: number, j: number) => {
    const r = rank[i]!;
    if (!r.has(j)) return false;
    const cur = match[i]!;
    return cur === -1 || r.get(j)! < (r.get(cur) ?? Infinity);
  };
  const out: [number, number][] = [];
  for (let i = 0; i < prefs.length; i++) {
    for (const j of prefs[i]!) {
      if (j <= i || match[i] === j) continue;
      if (prefersOver(i, j) && prefersOver(j, i)) out.push([i, j]);
    }
  }
  return out;
}

export function isStable(prefs: number[][], match: number[]): boolean {
  return blockingPairs(prefs, match).length === 0;
}

/** Roommates, falling back to greedy when no stable matching exists. */
export function roommatesWithFallback(
  m: (number | null)[][],
  prefs: number[][] = prefsFromMatrix(m),
): { match: number[]; stable: boolean; usedFallback: boolean; events: MatchEvent[] } {
  const res = stableRoommates(prefs);
  if (res.solvable) return { match: res.match, stable: true, usedFallback: false, events: res.events };
  const match = greedyMatching(m);
  return { match, stable: isStable(prefs, match), usedFallback: true, events: res.events };
}

// ---------------------------------------------------------------------------
// Entry point for Party Mode
// ---------------------------------------------------------------------------

/** `minPercentile`: pairs whose party score falls below this stay unmatched. */
export function runPartyMatching(profiles: Profile[], minPercentile: number, rng: Rng): MatchResult {
  const n = profiles.length;
  const m = scoreMatrix(profiles, minPercentile, rng);
  const prefs = prefsFromMatrix(m);
  const sides = findTwoSides(profiles);

  if (sides) {
    const leftProposes = rng() < 0.5;
    const proposers = leftProposes ? sides.left : sides.right;
    const receivers = leftProposes ? sides.right : sides.left;
    const { match, events } = galeShapley(proposers, receivers, prefs, n);
    return {
      algorithm: 'gale-shapley',
      sides: { proposers, receivers },
      match,
      stable: isStable(prefs, match),
      events,
      note: `The group split into two sides, so we used Gale–Shapley. A coin flip picked the ${leftProposes ? 'left' : 'right'} side to propose this round.`,
    };
  }

  const res = roommatesWithFallback(m, prefs);
  return {
    algorithm: res.usedFallback ? 'greedy' : 'roommates',
    match: res.match,
    stable: res.stable,
    events: res.events,
    note: res.usedFallback
      ? "There was no perfectly stable pairing this round, so we paired the strongest matches first."
      : "Everyone could pair with anyone, so we used Irving's stable roommates algorithm.",
  };
}
