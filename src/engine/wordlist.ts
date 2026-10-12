/**
 * 256 words, one per byte. Chosen so every pair differs by at least 3 edits,
 * which means a single typo always has exactly one nearest word and can be
 * auto-corrected. NEVER reorder or edit this list: it would break every code
 * already shared. Add a new list under a new CODE_VERSION instead.
 */
export const WORDLIST: readonly string[] = [
  'kaya', 'kopi', 'prata', 'laksa', 'satay', 'rojak', 'chendol', 'durian',
  'otah', 'popiah', 'kueh', 'ondeh', 'sambal', 'lemak', 'bakkwa', 'putu',
  'wanton', 'dumpling', 'tapioca', 'pandan', 'gula', 'coconut', 'calamansi', 'chilli',
  'ginger', 'sugarcane', 'bandung', 'milo', 'dinosaur', 'kacang', 'tofu', 'mango',
  'rambutan', 'mangosteen', 'jackfruit', 'papaya', 'starfruit', 'longan', 'lychee', 'pineapple',
  'curry', 'murtabak', 'briyani', 'fishball', 'noodle', 'toast', 'otter', 'omelette',
  'sardine', 'keropok', 'apom', 'waffle', 'pisang', 'goreng', 'sotong', 'crab',
  'kangkong', 'rendang', 'achar', 'bubur', 'taugeh', 'carrot', 'merlion', 'hornbill',
  'pangolin', 'kingfisher', 'heron', 'egret', 'gecko', 'cicak', 'mynah', 'sunbird',
  'dugong', 'turtle', 'civet', 'monitor', 'macaque', 'squirrel', 'butterfly', 'dragonfly',
  'firefly', 'seahorse', 'dolphin', 'starling', 'sparrow', 'peacock', 'orchid', 'frangipani',
  'hibiscus', 'rainforest', 'mangrove', 'angsana', 'tembusu', 'bamboo', 'lagoon', 'island',
  'kelong', 'bumboat', 'jetty', 'monsoon', 'sunrise', 'sunset', 'drizzle', 'thunder',
  'rainbow', 'breeze', 'sunny', 'cloudy', 'lightning', 'misty', 'dawn', 'dusk',
  'twilight', 'starlight', 'moonbeam', 'sentosa', 'changi', 'bedok', 'tampines', 'punggol',
  'bishan', 'clementi', 'serangoon', 'woodlands', 'sembawang', 'hougang', 'sengkang', 'queenstown',
  'novena', 'marina', 'esplanade', 'bugis', 'redhill', 'dhoby', 'ubin', 'holland',
  'dover', 'kranji', 'lentor', 'mayflower', 'caldecott', 'stevens', 'napier', 'botanic',
  'rochor', 'hawker', 'kopitiam', 'umbrella', 'tissue', 'chope', 'lanyard', 'ezlink',
  'bicycle', 'scooter', 'kite', 'marble', 'chapteh', 'kampung', 'playground', 'rocket',
  'galaxy', 'planet', 'pebble', 'pickle', 'cookie', 'muffin', 'biscuit', 'pudding',
  'candy', 'sprinkle', 'ribbon', 'pillow', 'slipper', 'backpack', 'kettle', 'teacup',
  'saucer', 'spoon', 'ladle', 'steamer', 'basket', 'balloon', 'compass', 'harbour',
  'lighthouse', 'cablecar', 'train', 'station', 'platform', 'express', 'circle', 'downtown',
  'thomson', 'amber', 'teal', 'indigo', 'crimson', 'saffron', 'ivory', 'olive',
  'lilac', 'peach', 'cocoa', 'caramel', 'honey', 'cinnamon', 'pepper', 'nutmeg',
  'lemongrass', 'galangal', 'turmeric', 'steady', 'shiok', 'sedap', 'makan', 'gostan',
  'badminton', 'takraw', 'swimming', 'cycling', 'hiking', 'picnic', 'karaoke', 'brunch',
  'lunchbox', 'tingkat', 'mahjong', 'chess', 'sudoku', 'crossword', 'origami', 'teapot',
  'thermos', 'trishaw', 'shophouse', 'corridor', 'laundry', 'sunflower', 'papercut', 'sketch',
  'melody', 'rhythm', 'ukulele', 'guitar', 'violin', 'tambourine', 'harmonica', 'trumpet',
  'cuddle', 'giggle', 'sparkle', 'twinkle', 'glow', 'blaze', 'frost', 'meadow',
];

export const WORD_INDEX: ReadonlyMap<string, number> = new Map(WORDLIST.map((w, i) => [w, i]));

export function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const sub = (prev[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1);
      cur.push(Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, sub));
    }
    prev = cur;
  }
  return prev[b.length] ?? 0;
}

/** Exact match, or the unique word within 1 edit (2 for long words). */
export function correctWord(raw: string): { index: number; word: string } | null {
  const exact = WORD_INDEX.get(raw);
  if (exact !== undefined) return { index: exact, word: raw };
  const maxDist = raw.length >= 7 ? 2 : 1;
  let best: { index: number; word: string } | null = null;
  let bestDist = Infinity;
  let tie = false;
  WORDLIST.forEach((w, i) => {
    const d = levenshtein(raw, w);
    if (d < bestDist) {
      bestDist = d;
      best = { index: i, word: w };
      tie = false;
    } else if (d === bestDist) {
      tie = true;
    }
  });
  return bestDist <= maxDist && !tie ? best : null;
}
