/**
 * Fun "types" for the profile card. Purely a label: matching always uses the
 * full trait scores. Attachment dimensions are never used here.
 *
 * Each type has a prototype: target values on a few dimensions. The type whose
 * prototype is closest (weighted by how far each trait is from the middle)
 * wins.
 */
import type { Dim } from './dimensions';
import type { Profile } from './types';

export interface ProfileType {
  id: string;
  name: string;
  oneLiner: string;
  /** Emoji used on the card as a tiny mascot accessory. */
  emoji: string;
  colours: [string, string];
  prototype: Partial<Record<Dim, number>>;
}

export const PROFILE_TYPES: ProfileType[] = [
  {
    id: 'kosong-planner',
    name: 'The Kopi-O Kosong Planner',
    oneLiner: 'No sugar, no surprises. Your itinerary has an itinerary.',
    emoji: '☕',
    colours: ['#3b2a20', '#c8a27a'],
    prototype: { conscientiousness: 1, lead: 1, tidiness: 0.85 },
  },
  {
    id: 'supper-seeker',
    name: 'The Spontaneous Supper Seeker',
    oneLiner: "Plans? You've got prata at 2am and zero regrets.",
    emoji: '🌙',
    colours: ['#1d2b53', '#ff9f43'],
    prototype: { chronotype: 1, conscientiousness: 0.2, extraversion: 0.8, foodAdventure: 0.8 },
  },
  {
    id: 'east-coast-cyclist',
    name: 'The Chill East-Coast Cyclist',
    oneLiner: 'Sea breeze, steady pace, sunset with a coconut.',
    emoji: '🚲',
    colours: ['#0e7c86', '#f6d55c'],
    prototype: { activity: 1, steadiness: 0.9 },
  },
  {
    id: 'void-deck-philosopher',
    name: 'The Void Deck Philosopher',
    oneLiner: 'Quiet on the outside, a whole universe of ideas on the inside.',
    emoji: '💭',
    colours: ['#4b3f72', '#c9b6e4'],
    prototype: { openness: 1, extraversion: 0.15, humour: 0.3 },
  },
  {
    id: 'hawker-hunter',
    name: 'The Hawker Hunter',
    oneLiner: 'Will cross the whole island for one bowl of laksa. Worth it.',
    emoji: '🍜',
    colours: ['#b33939', '#ffda79'],
    prototype: { foodAdventure: 1, openness: 0.8 },
  },
  {
    id: 'group-chat-captain',
    name: 'The Group Chat Captain',
    oneLiner: 'You made the poll, booked the table, and reminded everyone twice.',
    emoji: '📣',
    colours: ['#e1251b', '#ffd1cc'],
    prototype: { extraversion: 1, lead: 1, texting: 0.9 },
  },
  {
    id: 'steady-teh-peng',
    name: 'The Steady Teh Peng',
    oneLiner: 'Cool, sweet, and exactly what everyone needs on a hot day.',
    emoji: '🧋',
    colours: ['#a0522d', '#f5e6ca'],
    prototype: { steadiness: 1, agreeableness: 1 },
  },
  {
    id: 'staycay-specialist',
    name: 'The Weekend Staycay Specialist',
    oneLiner: 'Room service, a pool, and someone you love. Who needs a flight?',
    emoji: '🏨',
    colours: ['#2d6a4f', '#b7e4c7'],
    prototype: { togetherness: 1, activity: 0.3, roam: 0.2 },
  },
  {
    id: 'changi-dreamer',
    name: 'The Changi Departure Dreamer',
    oneLiner: 'Half your camera roll is airport carpets and foreign skylines.',
    emoji: '✈️',
    colours: ['#0d59a8', '#a9d6f5'],
    prototype: { roam: 1, openness: 0.85 },
  },
  {
    id: 'heartland-homebody',
    name: 'The Heartland Homebody',
    oneLiner: 'Your kopitiam uncle knows your order. Your family knows your schedule.',
    emoji: '🏠',
    colours: ['#7f5539', '#ede0d4'],
    prototype: { roam: 0, family: 1, extraversion: 0.3 },
  },
  {
    id: 'kaya-romantic',
    name: 'The Kaya Toast Romantic',
    oneLiner: 'Sweet, warm, and best shared over breakfast.',
    emoji: '💛',
    colours: ['#d4a017', '#fff3c4'],
    prototype: { affection: 1, togetherness: 0.85 },
  },
  {
    id: 'spreadsheet-saver',
    name: 'The Spreadsheet Saver',
    oneLiner: 'Your BTO fund has a colour-coded tab. Respect.',
    emoji: '📊',
    colours: ['#1b4332', '#95d5b2'],
    prototype: { money: 0, conscientiousness: 0.9 },
  },
  {
    id: 'last-minute-legend',
    name: 'The Last-Minute Legend',
    oneLiner: 'Packed in ten minutes, still made the flight, somehow relaxed.',
    emoji: '⏱️',
    colours: ['#6a040f', '#ffba08'],
    prototype: { conscientiousness: 0, lead: 0.2, steadiness: 0.85 },
  },
  {
    id: 'kopitiam-regular',
    name: 'The Early-Bird Kopitiam Regular',
    oneLiner: 'First kopi at 7am, same seat, same stall, same smile.',
    emoji: '🌅',
    colours: ['#e76f51', '#ffe8d6'],
    prototype: { chronotype: 0, foodAdventure: 0.15 },
  },
  {
    id: 'park-connector-runner',
    name: 'The 6am Park Connector Runner',
    oneLiner: 'Sunrise, sneakers, 10k before most people open their eyes.',
    emoji: '👟',
    colours: ['#2a9d8f', '#e9f5db'],
    prototype: { activity: 1, chronotype: 0, conscientiousness: 0.8 },
  },
  {
    id: 'cosy-nester',
    name: 'The Cosy Netflix Nester',
    oneLiner: 'Blanket, snacks, next episode. Outside is overrated.',
    emoji: '🛋️',
    colours: ['#5e548e', '#e0b1cb'],
    prototype: { activity: 0, extraversion: 0.2, chronotype: 0.8 },
  },
];

export function profileTypeFor(p: Profile): ProfileType {
  let best = PROFILE_TYPES[0]!;
  let bestScore = -Infinity;
  for (const t of PROFILE_TYPES) {
    let score = 0;
    let weight = 0;
    for (const [d, target] of Object.entries(t.prototype) as [Dim, number][]) {
      // Reward agreement in the direction of the prototype, scaled by how
      // decisive the prototype is on that dimension.
      const decisiveness = Math.abs(target - 0.5) * 2;
      score += decisiveness * (1 - Math.abs(p.traits[d] - target));
      weight += decisiveness;
    }
    const avg = weight > 0 ? score / weight : 0;
    if (avg > bestScore) {
      bestScore = avg;
      best = t;
    }
  }
  return best;
}
