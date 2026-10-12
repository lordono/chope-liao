/**
 * Match code format (v1): 128 bits → 16 bytes → 16 words.
 *
 *   version          3
 *   traits      21 × 3   (0–7, i.e. 8 levels per dimension)
 *   low-confidence    3   (one flag per consistency dimension)
 *   category lvl 4 × 2
 *   ideals       5 × 3   (0 none, 1–4 = Scale4 + 1)
 *   dealbreakers     16
 *   identity          5
 *   flavour      2 × 2
 *   spare             1
 *   CRC-10           10
 *
 * Before rendering, whole bytes are reordered so the checksum bytes come
 * first (BYTE_ORDER) and everything is XOR-whitened with a fixed mask, so
 * similar profiles don't all start with the same words. Moving whole bytes
 * keeps CRC-10's guarantee of catching any single-word error. This is NOT
 * encryption: the scoring code is public and anyone can decode a code.
 */
import { CONSISTENCY_DIMS, DIMENSIONS, IDEAL_DIMS, USER_CATEGORIES } from './dimensions';
import { mulberry32 } from './rng';
import type { Dealbreakers, IdentitySelf, Profile } from './types';
import { WORDLIST, correctWord } from './wordlist';

export const CODE_VERSION = 1;
export const CODE_BYTES = 16;
const PAYLOAD_BITS = 118;
const CRC_BITS = 10;
const CRC_POLY = 0x233; // x^10 + x^9 + x^5 + x^4 + x + 1

/** Transmitted byte i = canonical byte BYTE_ORDER[i]. */
const BYTE_ORDER = [15, 14, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

const WHITEN_MASK: Uint8Array = (() => {
  const rng = mulberry32(0xc0ffee);
  return Uint8Array.from({ length: CODE_BYTES }, () => Math.floor(rng() * 256));
})();

class BitWriter {
  readonly bytes = new Uint8Array(CODE_BYTES);
  pos = 0;
  write(value: number, bits: number): void {
    for (let i = bits - 1; i >= 0; i--) {
      const bit = (value >>> i) & 1;
      const byte = this.pos >>> 3;
      this.bytes[byte] = (this.bytes[byte] ?? 0) | (bit << (7 - (this.pos & 7)));
      this.pos++;
    }
  }
}

class BitReader {
  pos = 0;
  constructor(private readonly bytes: Uint8Array) {}
  read(bits: number): number {
    let v = 0;
    for (let i = 0; i < bits; i++) {
      const byte = this.bytes[this.pos >>> 3] ?? 0;
      v = (v << 1) | ((byte >>> (7 - (this.pos & 7))) & 1);
      this.pos++;
    }
    return v;
  }
}

/** Bitwise CRC-10 over the first `bitCount` bits. */
export function crc10(bytes: Uint8Array, bitCount: number): number {
  let crc = 0;
  for (let i = 0; i < bitCount; i++) {
    const bit = ((bytes[i >>> 3] ?? 0) >>> (7 - (i & 7))) & 1;
    const top = ((crc >>> (CRC_BITS - 1)) & 1) ^ bit;
    crc = (crc << 1) & ((1 << CRC_BITS) - 1);
    if (top) crc ^= CRC_POLY;
  }
  return crc;
}

const q3 = (x: number) => Math.min(7, Math.max(0, Math.round(x * 7)));

export function encodeBytes(p: Profile): Uint8Array {
  const w = new BitWriter();
  w.write(CODE_VERSION, 3);
  for (const d of DIMENSIONS) w.write(q3(p.traits[d]), 3);
  for (const d of CONSISTENCY_DIMS) w.write(p.confidence[d] < 1 ? 1 : 0, 1);
  for (const c of USER_CATEGORIES) w.write(p.categoryLevels[c], 2);
  for (const d of IDEAL_DIMS) w.write(p.ideals[d], 3);
  const db = p.dealbreakers;
  w.write(db.kids, 2);
  w.write(db.kidsMust ? 1 : 0, 1);
  w.write(db.smokeSelf, 2);
  w.write(db.smokePartner, 2);
  w.write(db.pets, 2);
  w.write(db.petsCannot ? 1 : 0, 1);
  w.write(db.nearFamily, 2);
  w.write(db.faithMatters ? 1 : 0, 1);
  w.write(db.faith, 3);
  w.write(p.identity.self, 2);
  w.write(p.identity.openTo & 7, 3);
  w.write(p.flavour.kopi, 2);
  w.write(p.flavour.chope, 2);
  w.write(0, 1); // spare
  if (w.pos !== PAYLOAD_BITS) throw new Error(`payload is ${w.pos} bits, expected ${PAYLOAD_BITS}`);
  w.write(crc10(w.bytes, PAYLOAD_BITS), CRC_BITS);
  return Uint8Array.from(BYTE_ORDER, (src, i) => (w.bytes[src] ?? 0) ^ (WHITEN_MASK[i] ?? 0));
}

export type DecodeError =
  | { kind: 'empty' }
  | { kind: 'length'; got: number }
  | { kind: 'word'; word: string; position: number }
  | { kind: 'checksum' }
  | { kind: 'version'; version: number };

export type DecodeResult =
  | { ok: true; profile: Profile; corrected: { from: string; to: string }[] }
  | { ok: false; error: DecodeError };

export function decodeBytes(raw: Uint8Array): DecodeResult {
  if (raw.length !== CODE_BYTES) return { ok: false, error: { kind: 'length', got: raw.length } };
  const bytes = new Uint8Array(CODE_BYTES);
  BYTE_ORDER.forEach((dst, i) => (bytes[dst] = (raw[i] ?? 0) ^ (WHITEN_MASK[i] ?? 0)));
  const r = new BitReader(bytes);
  const version = r.read(3);
  // Check the checksum before trusting the version, so a typo isn't reported
  // as "newer version".
  const tail = new BitReader(bytes);
  tail.pos = PAYLOAD_BITS;
  if (tail.read(CRC_BITS) !== crc10(bytes, PAYLOAD_BITS)) return { ok: false, error: { kind: 'checksum' } };
  if (version !== CODE_VERSION) return { ok: false, error: { kind: 'version', version } };

  const traits = {} as Profile['traits'];
  for (const d of DIMENSIONS) traits[d] = r.read(3) / 7;
  const confidence = {} as Profile['confidence'];
  for (const d of CONSISTENCY_DIMS) confidence[d] = r.read(1) ? 0.5 : 1;
  const categoryLevels = {} as Profile['categoryLevels'];
  for (const c of USER_CATEGORIES) categoryLevels[c] = r.read(2);
  const ideals = {} as Profile['ideals'];
  for (const d of IDEAL_DIMS) ideals[d] = Math.min(4, r.read(3));
  const dealbreakers: Dealbreakers = {
    kids: r.read(2) as Dealbreakers['kids'],
    kidsMust: r.read(1) === 1,
    smokeSelf: Math.min(2, r.read(2)) as Dealbreakers['smokeSelf'],
    smokePartner: Math.min(2, r.read(2)) as Dealbreakers['smokePartner'],
    pets: Math.min(2, r.read(2)) as Dealbreakers['pets'],
    petsCannot: r.read(1) === 1,
    nearFamily: r.read(2) as Dealbreakers['nearFamily'],
    faithMatters: r.read(1) === 1,
    faith: r.read(3),
  };
  const identity = { self: r.read(2) as IdentitySelf, openTo: r.read(3) };
  const flavour = { kopi: r.read(2), chope: r.read(2) };
  return {
    ok: true,
    profile: { traits, confidence, categoryLevels, ideals, dealbreakers, identity, flavour },
    corrected: [],
  };
}

export function bytesToWords(bytes: Uint8Array): string[] {
  return Array.from(bytes, (b) => WORDLIST[b] ?? '');
}

export function encodeCode(p: Profile): string {
  return bytesToWords(encodeBytes(p)).join('-');
}

/** Pulls the word part out of a pasted URL, fragment or bare code. */
export function extractCode(input: string): string {
  const s = input.trim();
  const m = s.match(/[#&]c=([a-z\-\s,]+)/i);
  return (m?.[1] ?? s).toLowerCase();
}

export function decodeCode(input: string): DecodeResult {
  const words = extractCode(input)
    .split(/[\s,\-_.·]+/)
    .filter(Boolean);
  if (words.length === 0) return { ok: false, error: { kind: 'empty' } };
  if (words.length !== CODE_BYTES) return { ok: false, error: { kind: 'length', got: words.length } };
  const bytes = new Uint8Array(CODE_BYTES);
  const corrected: { from: string; to: string }[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i] ?? '';
    const hit = correctWord(w);
    if (!hit) return { ok: false, error: { kind: 'word', word: w, position: i + 1 } };
    if (hit.word !== w) corrected.push({ from: w, to: hit.word });
    bytes[i] = hit.index;
  }
  const res = decodeBytes(bytes);
  return res.ok ? { ...res, corrected } : res;
}

/** Friendly, on-brand error copy. */
export function describeDecodeError(e: DecodeError): string {
  switch (e.kind) {
    case 'empty':
      return 'Paste a code or a link first.';
    case 'length':
      return `This code looks like it lost its way at Dhoby Ghaut. A code has ${CODE_BYTES} words; this one has ${e.got}.`;
    case 'word':
      return `Word ${e.position} ("${e.word}") isn't on our line. Got a typo?`;
    case 'checksum':
      return 'Hmm, one of the words seems to have switched trains. Double-check the code?';
    case 'version':
      return 'This code comes from a different version of Chope Liao. Ask your friend to make a fresh one.';
  }
}

/** The profile exactly as anyone decoding its code would see it (quantised). */
export function roundTrip(p: Profile): Profile {
  const res = decodeBytes(encodeBytes(p));
  if (!res.ok) throw new Error('round trip failed');
  return res.profile;
}
