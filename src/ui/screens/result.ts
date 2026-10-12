import { gsap } from 'gsap';
import {
  USER_CATEGORY_LABEL,
  bandFor,
  categoryLevel,
  categoryScores,
  dealbreakerTopics,
  highlights,
  mutualPercentile,
  mutualScore,
  sharesFaith,
  type UserCategory,
} from '../../engine';
import { confetti } from '../../anim/confetti';
import { brew } from '../../anim/kopi';
import { reducedMotion } from '../../anim/motion';
import { BREW_CUP } from '../components/art';
import { announce, fromHTML, h } from '../dom';
import { go } from '../router';
import { state } from '../state';

const BAR_CATEGORIES: UserCategory[] = ['rhythm', 'direction', 'communication'];
const LEVEL_WORDS = ['A fun contrast', 'Some common ground', 'Good overlap', 'Lots in common', 'Very in sync'];

export function resultScreen(root: HTMLElement): () => void {
  const me = state.me;
  const friend = state.friend;
  if (!me || !friend) {
    go('/compare', true);
    return () => {};
  }

  const score = mutualScore(me, friend);
  const band = bandFor(mutualPercentile(score));
  const lines = highlights(me, friend);
  if (sharesFaith(me, friend)) lines.push('You share a faith or outlook that matters to you both.');
  const cats = categoryScores(me, friend);
  const topics = dealbreakerTopics(me, friend);

  const cup = fromHTML(BREW_CUP);
  const reveal = h(
    'div',
    { class: 'reveal', 'aria-hidden': 'true' },
    h('p', { class: 'band-name' }, band.name),
    band.topLabel ? h('p', { class: 'band-top' }, band.topLabel) : null,
    h('p', { class: 'band-blurb' }, band.blurb),
  );

  const details = h(
    'div',
    { class: 'result-details' },
    h('h2', {}, 'What you share'),
    h('ul', { class: 'highlights' }, lines.slice(0, 4).map((l) => h('li', {}, l))),
    h('h2', {}, 'How you line up'),
    h(
      'ul',
      { class: 'bars' },
      BAR_CATEGORIES.map((c) => {
        const level = categoryLevel(c, cats[c]);
        return h(
          'li',
          {},
          h('span', { class: 'bar-label' }, USER_CATEGORY_LABEL[c]),
          h(
            'span',
            { class: 'bar', role: 'img', 'aria-label': `${USER_CATEGORY_LABEL[c]}: ${LEVEL_WORDS[level - 1]}` },
            Array.from({ length: 5 }, (_, i) => h('span', { class: `seg${i < level ? ' on' : ''}` })),
          ),
          h('span', { class: 'bar-word' }, LEVEL_WORDS[level - 1]),
        );
      }),
    ),
    topics.length
      ? h(
          'details',
          { class: 'kopi-chat' },
          h('summary', {}, `Worth a kopi chat · ${topics.length} ${topics.length === 1 ? 'topic' : 'topics'}`),
          h('p', { class: 'fine' }, "These are big-life things. They don't change your band; they're just good to talk about."),
          h(
            'ul',
            {},
            topics.map((t) => h('li', {}, t.text, t.must ? h('span', { class: 'must' }, ' A must-have for one of you.') : null)),
          ),
        )
      : null,
    h('p', { class: 'fine' }, "For fun, not a guarantee of love. The band compares you with thousands of simulated pairs, not real people."),
    h(
      'div',
      { class: 'actions' },
      h(
        'button',
        {
          class: 'btn primary',
          type: 'button',
          onclick: () => {
            state.friend = null;
            go('/compare');
          },
        },
        'Check another code',
      ),
      h('button', { class: 'btn', type: 'button', onclick: () => go('/code') }, 'My code'),
    ),
  );

  const section = h(
    'section',
    { class: `result band-${band.id}` },
    h('h1', { class: 'sr-only' }, `Your match: ${band.name}`),
    h('div', { class: 'brew-stage' }, cup, reveal),
    details,
  );
  root.append(section);

  let stopConfetti = () => {};
  gsap.set(details, { opacity: 0, y: 20 });
  gsap.set(reveal, { opacity: 0, scale: 0.8 });
  const tl = brew(cup, band.fill, () => {
    reveal.removeAttribute('aria-hidden');
    announce(`${band.name}${band.topLabel ? `, ${band.topLabel}` : ''}. ${band.blurb}`);
    const calm = reducedMotion();
    gsap.to(reveal, { opacity: 1, scale: 1, duration: calm ? 0.2 : 0.6, ease: calm ? 'none' : 'back.out(2)' });
    gsap.to(details, { opacity: 1, y: 0, duration: calm ? 0.2 : 0.5, delay: calm ? 0 : 0.3 });
    if (band.id === 'rare' || band.id === 'steady' || band.id === 'cantry') stopConfetti = confetti(section.querySelector('.brew-stage')!);
  });

  return () => {
    tl.kill();
    stopConfetti();
    gsap.killTweensOf([details, reveal]);
  };
}
