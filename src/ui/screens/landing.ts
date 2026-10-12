import { animateLanding } from '../../anim/skyline';
import { KAYA_CHAR, KOPI_CHAR, SKYLINE_SVG } from '../components/art';
import { fromHTML, h } from '../dom';
import { go } from '../router';
import { resetQuiz, state } from '../state';

export function landingScreen(root: HTMLElement): () => void {
  const hasCode = state.me !== null;
  const hero = h(
    'section',
    { class: 'hero' },
    h('div', { class: 'hero-art' }, fromHTML(SKYLINE_SVG), h('div', { class: 'chars' }, fromHTML(KOPI_CHAR), fromHTML(KAYA_CHAR))),
    h(
      'div',
      { class: 'hero-copy' },
      h('h1', {}, 'Chope Liao!'),
      h('p', { class: 'lede' }, 'A cheeky compatibility quiz. About 8 minutes, 36 questions, one shareable match code.'),
      h(
        'div',
        { class: 'actions' },
        hasCode
          ? h('button', { class: 'btn primary', type: 'button', onclick: () => go('/code') }, 'See my code')
          : h(
              'button',
              {
                class: 'btn primary',
                type: 'button',
                onclick: () => {
                  if (!state.session || state.step === 0) resetQuiz();
                  go('/quiz');
                },
              },
              state.session && state.step > 0 ? 'Continue the quiz' : 'Start the quiz',
            ),
        h('button', { class: 'btn', type: 'button', onclick: () => go('/compare') }, 'Check a match'),
        h('button', { class: 'btn', type: 'button', onclick: () => go('/party') }, 'Party Mode'),
      ),
      h(
        'ul',
        { class: 'promise' },
        h('li', {}, 'Nothing is stored. Refresh and your answers are gone.'),
        h('li', {}, 'Your code lives in the link, never on a server.'),
        h('li', {}, 'For fun lah, not a guarantee of love.'),
      ),
    ),
  );
  root.append(hero);
  return animateLanding(root);
}
