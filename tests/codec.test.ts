import { describe, expect, it } from 'vitest';
import {
  CODE_BYTES,
  bytesToWords,
  decodeBytes,
  decodeCode,
  describeDecodeError,
  encodeBytes,
  encodeCode,
} from '../src/engine/codec';
import { DIMENSIONS } from '../src/engine/dimensions';
import { mulberry32 } from '../src/engine/rng';
import { synthProfile } from '../src/engine/synth';
import { WORDLIST, levenshtein } from '../src/engine/wordlist';

const rng = mulberry32(42);
const profiles = Array.from({ length: 50 }, () => synthProfile(rng, { identity: true }));

describe('wordlist', () => {
  it('has 256 unique lowercase words', () => {
    expect(WORDLIST).toHaveLength(256);
    expect(new Set(WORDLIST).size).toBe(256);
    for (const w of WORDLIST) expect(w).toMatch(/^[a-z]{4,11}$/);
  });

  it('keeps every pair at least 3 edits apart', () => {
    for (let i = 0; i < WORDLIST.length; i++) {
      for (let j = i + 1; j < WORDLIST.length; j++) {
        expect(levenshtein(WORDLIST[i]!, WORDLIST[j]!)).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe('encode → decode', () => {
  it('produces 16 words', () => {
    expect(encodeCode(profiles[0]!).split('-')).toHaveLength(CODE_BYTES);
  });

  it('round-trips (synthetic profiles are already quantised)', () => {
    for (const p of profiles) {
      const res = decodeCode(encodeCode(p));
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.profile).toEqual(p);
    }
  });

  it('quantises traits to within 1/14', () => {
    const p = structuredClone(profiles[0]!);
    for (const d of DIMENSIONS) p.traits[d] = rng();
    const res = decodeBytes(encodeBytes(p));
    expect(res.ok).toBe(true);
    if (res.ok) for (const d of DIMENSIONS) expect(Math.abs(res.profile.traits[d] - p.traits[d])).toBeLessThanOrEqual(1 / 14 + 1e-9);
  });

  it('accepts a full URL, a fragment, spaces and capitals', () => {
    const code = encodeCode(profiles[1]!);
    for (const input of [
      `https://example.com/chope/#c=${code}`,
      `#c=${code}`,
      code.toUpperCase(),
      code.replace(/-/g, ' '),
    ]) {
      expect(decodeCode(input).ok).toBe(true);
    }
  });
});

describe('checksum', () => {
  it('catches every single-word substitution', () => {
    for (const p of profiles.slice(0, 5)) {
      const bytes = encodeBytes(p);
      for (let pos = 0; pos < CODE_BYTES; pos++) {
        for (let v = 0; v < 256; v++) {
          if (v === bytes[pos]) continue;
          const bad = bytes.slice();
          bad[pos] = v;
          const res = decodeBytes(bad);
          expect(res.ok).toBe(false);
        }
      }
    }
  });

  it('catches swapped adjacent words', () => {
    let caught = 0;
    let total = 0;
    for (const p of profiles) {
      const words = bytesToWords(encodeBytes(p));
      for (let i = 0; i < words.length - 1; i++) {
        if (words[i] === words[i + 1]) continue;
        const sw = words.slice();
        [sw[i], sw[i + 1]] = [sw[i + 1]!, sw[i]!];
        total++;
        if (!decodeCode(sw.join('-')).ok) caught++;
      }
    }
    // Swaps are a 16-bit burst, beyond CRC-10's guarantee, but nearly all are caught.
    expect(caught / total).toBeGreaterThan(0.99);
  });

  it('auto-corrects a one-letter typo', () => {
    const words = encodeCode(profiles[2]!).split('-');
    const w = words[3]!;
    words[3] = w.slice(0, -1) + (w.endsWith('z') ? 'y' : 'z');
    const res = decodeCode(words.join('-'));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.corrected).toEqual([{ from: words[3], to: w }]);
  });

  it('gives friendly errors', () => {
    const short = decodeCode('kaya-kopi-otter');
    expect(short.ok).toBe(false);
    if (!short.ok) expect(describeDecodeError(short.error)).toMatch(/Dhoby Ghaut/);
    const words = encodeCode(profiles[3]!).split('-');
    words[0] = 'xylophonequx';
    const bad = decodeCode(words.join('-'));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.kind).toBe('word');
  });
});
