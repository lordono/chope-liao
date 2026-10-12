/**
 * Party Mode reveal: proposals draw as lines between anonymous avatars,
 * held proposals glow, rejected lines fade out, and final pairs snap together.
 * Avatars are shuffled and unnamed so the TV never shows who matched whom;
 * people check their own result afterwards, one at a time.
 *
 * Paced for a TV: ~0.6s per step, compressed for big groups so the whole
 * reveal stays under ~25s. There's always a skip button.
 */
import { gsap } from 'gsap';
import type { MatchEvent } from '../engine';
import { reducedMotion } from './motion';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PALETTE = ['#e1251b', '#2e9e5b', '#0d59a8', '#8a3ab9', '#f39c12', '#9e7c1a', '#0e7c86', '#d14d72'];

export interface RevealLayout {
  n: number;
  /** Optional two-row layout for Gale–Shapley. */
  sides?: { proposers: number[]; receivers: number[] };
}

interface Pos {
  x: number;
  y: number;
}

function positions(layout: RevealLayout, order: number[]): Pos[] {
  const pos: Pos[] = Array.from({ length: layout.n }, () => ({ x: 0, y: 0 }));
  if (layout.sides) {
    const place = (ids: number[], y: number) => {
      const shuffled = order.filter((i) => ids.includes(i));
      shuffled.forEach((id, k) => (pos[id] = { x: ((k + 1) / (shuffled.length + 1)) * 800, y }));
    };
    place(layout.sides.proposers, 90);
    place(layout.sides.receivers, 330);
  } else {
    order.forEach((id, k) => {
      const t = (k / layout.n) * Math.PI * 2 - Math.PI / 2;
      pos[id] = { x: 400 + Math.cos(t) * 300, y: 210 + Math.sin(t) * 160 };
    });
  }
  return pos;
}

export function playReveal(
  svg: SVGSVGElement,
  layout: RevealLayout,
  events: MatchEvent[],
  match: number[],
  onDone: () => void,
): { skip: () => void; cleanup: () => void } {
  svg.replaceChildren();
  svg.setAttribute('viewBox', '0 0 800 420');
  const order = Array.from({ length: layout.n }, (_, i) => i).sort(() => Math.random() - 0.5);
  const pos = positions(layout, order);

  const lineLayer = document.createElementNS(SVG_NS, 'g');
  const avatarLayer = document.createElementNS(SVG_NS, 'g');
  svg.append(lineLayer, avatarLayer);

  const avatars = pos.map((p, i) => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'avatar');
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('r', '22');
    c.setAttribute('fill', PALETTE[order.indexOf(i) % PALETTE.length]!);
    const cup = document.createElementNS(SVG_NS, 'path');
    // A tiny cup glyph so avatars feel on-brand without showing names.
    cup.setAttribute('d', 'M-9 -6h14l-2 12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2zM5 -3c5 0 5 7 0 7');
    cup.setAttribute('fill', 'none');
    cup.setAttribute('stroke', '#fff');
    cup.setAttribute('stroke-width', '2.4');
    g.append(c, cup);
    gsap.set(g, { x: p.x, y: p.y });
    avatarLayer.append(g);
    return g;
  });

  const lines = new Map<string, SVGLineElement>();
  const lineFor = (a: number, b: number) => {
    const key = `${a}-${b}`;
    let l = lines.get(key);
    if (!l) {
      l = document.createElementNS(SVG_NS, 'line');
      const pa = pos[a]!;
      const pb = pos[b]!;
      l.setAttribute('x1', String(pa.x));
      l.setAttribute('y1', String(pa.y));
      l.setAttribute('x2', String(pb.x));
      l.setAttribute('y2', String(pb.y));
      l.setAttribute('class', 'proposal');
      lineLayer.append(l);
      lines.set(key, l);
    }
    return l;
  };

  const finale = () => {
    const tl = gsap.timeline({ onComplete: onDone });
    tl.to(lineLayer.children, { opacity: 0, duration: 0.4 });
    // Pairs line up across the middle; unmatched avatars rest along the bottom.
    const pairs: [number, number][] = [];
    match.forEach((j, i) => {
      if (j > i) pairs.push([i, j]);
    });
    const singles = match.flatMap((j, i) => (j === -1 ? [i] : []));
    pairs.forEach(([i, j], k) => {
      const x = ((k + 1) / (pairs.length + 1)) * 800;
      tl.to(avatars[i]!, { x: x - 21, y: 190, duration: 0.8, ease: 'back.out(1.7)' }, k === 0 ? '<' : '<0.12');
      tl.to(avatars[j]!, { x: x + 21, y: 190, duration: 0.8, ease: 'back.out(1.7)' }, '<');
    });
    singles.forEach((i, k) => {
      const x = ((k + 1) / (singles.length + 1)) * 800;
      tl.to(avatars[i]!, { x, y: 370, opacity: 0.4, scale: 0.8, duration: 0.6 }, '<');
    });
    return tl;
  };

  if (reducedMotion()) {
    // Calm version: no line choreography, pairs simply appear together.
    const tl = finale();
    tl.progress(1);
    return { skip: () => {}, cleanup: () => tl.kill() };
  }

  const step = Math.min(0.6, Math.max(0.12, 25 / Math.max(events.length, 1)));
  const tl = gsap.timeline();
  tl.from(avatars, { scale: 0, opacity: 0, stagger: 0.04, duration: 0.4, ease: 'back.out(2)' });
  for (const e of events) {
    if (e.type === 'propose') {
      const l = lineFor(e.from, e.to);
      const len = Math.hypot(pos[e.to]!.x - pos[e.from]!.x, pos[e.to]!.y - pos[e.from]!.y);
      tl.set(l, { attr: { class: 'proposal' }, opacity: 1, strokeDasharray: len, strokeDashoffset: len });
      tl.to(l, { strokeDashoffset: 0, duration: step * 0.8, ease: 'power1.inOut' });
    } else if (e.type === 'hold') {
      const l = lineFor(e.from, e.by);
      tl.set(l, { attr: { class: 'proposal held' } });
      tl.to([avatars[e.by]!, avatars[e.from]!], { scale: 1.15, duration: step * 0.3, yoyo: true, repeat: 1 });
    } else {
      const l = lineFor(e.from, e.by);
      tl.set(l, { attr: { class: 'proposal rejected' } });
      tl.to(l, { opacity: 0, duration: step * 0.6 });
    }
  }
  tl.add(finale());

  return {
    skip: () => tl.progress(1),
    cleanup: () => tl.kill(),
  };
}
