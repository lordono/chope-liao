/**
 * Draws a 36-question session from the bank, stratified so every dimension
 * gets enough evidence, and orders it into MRT stations:
 *
 *   Kopi Junction (easy lifestyle) → Makan Crossing (lighter scenarios) →
 *   Either-Or Interchange (trade-offs) → Plot Twist Park (heavier scenarios) →
 *   Serious Bit Station (dealbreakers) → Supper Terminal (light finish)
 */
import { DEALBREAKERS, FLAVOUR, IDEALS, LIFESTYLE, PRIORITIES, SCENARIOS, type StationId } from '../data/questions';
import { DIMENSIONS, type Dim, type UserCategory } from './dimensions';
import { shuffle, type Rng } from './rng';
import type { ChoiceQuestion, IdealQuestion, PriorityQuestion, Question } from './types';

export const SESSION_MIX = {
  /** Scored lifestyle items (flavour items are extra and always asked). */
  lifestyle: 11,
  scenario: 12,
  ideal: 3,
  priority: 3,
  /** Lifestyle items moved to the final station. */
  supperLifestyle: 3,
} as const;

/** Minimum evidence mass (sum of max |loading| across chosen items) per dimension. */
export const MIN_EVIDENCE = 1.5;

export interface SessionItem {
  question: Question;
  station: StationId;
}

export interface Session {
  items: SessionItem[];
}

/** Max |loading| for each dimension the question targets. */
export function evidenceMass(q: ChoiceQuestion): Partial<Record<Dim, number>> {
  const mass: Partial<Record<Dim, number>> = {};
  for (const opt of q.options) {
    for (const [d, v] of Object.entries(opt.loads) as [Dim, number][]) {
      mass[d] = Math.max(mass[d] ?? 0, Math.abs(v));
    }
  }
  return mass;
}

function pickChoiceItems(rng: Rng): { lifestyle: ChoiceQuestion[]; scenarios: ChoiceQuestion[] } {
  // Consistency pairs are always included, both halves.
  const lifestyle = LIFESTYLE.filter((q) => q.consistency);
  const scenarios = SCENARIOS.filter((q) => q.consistency);
  const chosen = new Set<string>([...lifestyle, ...scenarios].map((q) => q.id));

  const have: Record<Dim, number> = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<Dim, number>;
  const add = (q: ChoiceQuestion) => {
    for (const [d, m] of Object.entries(evidenceMass(q)) as [Dim, number][]) have[d] += m;
  };
  [...lifestyle, ...scenarios].forEach(add);

  const heavyCount = () => scenarios.filter((q) => q.heavy).length;
  const half = SESSION_MIX.scenario / 2;

  while (lifestyle.length < SESSION_MIX.lifestyle || scenarios.length < SESSION_MIX.scenario) {
    const pool = [
      ...(lifestyle.length < SESSION_MIX.lifestyle ? LIFESTYLE : []),
      ...(scenarios.length < SESSION_MIX.scenario ? SCENARIOS : []),
    ].filter((q) => {
      if (chosen.has(q.id)) return false;
      if (q.kind === 'scenario') {
        // Keep roughly half light, half heavy so both scenario stations fill.
        const heavy = heavyCount();
        const light = scenarios.length - heavy;
        if (q.heavy && heavy >= half + 1) return false;
        if (!q.heavy && light >= half + 1) return false;
      }
      return true;
    });
    if (pool.length === 0) break;

    let best: ChoiceQuestion | undefined;
    let bestScore = -Infinity;
    for (const q of pool) {
      let gain = 0;
      for (const [d, m] of Object.entries(evidenceMass(q)) as [Dim, number][]) {
        gain += Math.min(Math.max(MIN_EVIDENCE - have[d], 0), m);
      }
      // Randomness keeps sessions varied once coverage is satisfied.
      const score = gain + rng() * 0.6;
      if (score > bestScore) {
        bestScore = score;
        best = q;
      }
    }
    if (!best) break;
    chosen.add(best.id);
    add(best);
    (best.kind === 'lifestyle' ? lifestyle : scenarios).push(best);
  }
  return { lifestyle, scenarios };
}

function pickIdeals(rng: Rng): IdealQuestion[] {
  const out: IdealQuestion[] = [];
  const dims = new Set<string>();
  for (const q of shuffle(IDEALS, rng)) {
    if (out.length >= SESSION_MIX.ideal) break;
    if (dims.has(q.dim)) continue;
    dims.add(q.dim);
    out.push(q);
  }
  return out;
}

function pickPriorities(rng: Rng): PriorityQuestion[] {
  // Try a few shuffles to cover all four categories at least once.
  let best: PriorityQuestion[] = [];
  for (let attempt = 0; attempt < 20; attempt++) {
    const pick = shuffle(PRIORITIES, rng).slice(0, SESSION_MIX.priority);
    const cats = new Set<UserCategory>(pick.flatMap((q) => [q.leftCat, q.rightCat]));
    best = pick;
    if (cats.size === 4) break;
  }
  return best;
}

export function drawSession(rng: Rng): Session {
  const { lifestyle, scenarios } = pickChoiceItems(rng);
  const ideals = pickIdeals(rng);
  const priorities = pickPriorities(rng);

  const mixedLifestyle = shuffle(lifestyle, rng);
  const supper = mixedLifestyle.slice(0, SESSION_MIX.supperLifestyle);
  const opening = mixedLifestyle.slice(SESSION_MIX.supperLifestyle);

  // Lighter scenarios first, heavier ones in the middle station.
  const sortedScenarios = shuffle(scenarios, rng).sort((a, b) => Number(!!a.heavy) - Number(!!b.heavy));
  const makan = sortedScenarios.slice(0, Math.ceil(scenarios.length / 2));
  const plot = sortedScenarios.slice(Math.ceil(scenarios.length / 2));

  const [kopiFlavour, chopeFlavour] = FLAVOUR;
  const items: SessionItem[] = [
    ...(kopiFlavour ? [{ question: kopiFlavour, station: 'kopi' as const }] : []),
    ...opening.map((q) => ({ question: q, station: 'kopi' as const })),
    ...makan.map((q) => ({ question: q, station: 'makan' as const })),
    ...shuffle<Question>([...ideals, ...priorities], rng).map((q) => ({ question: q, station: 'eitheror' as const })),
    ...plot.map((q) => ({ question: q, station: 'plottwist' as const })),
    ...DEALBREAKERS.map((q) => ({ question: q, station: 'serious' as const })),
    ...supper.map((q) => ({ question: q, station: 'supper' as const })),
    // End on the silliest one.
    ...(chopeFlavour ? [{ question: chopeFlavour, station: 'supper' as const }] : []),
  ];
  return { items };
}
