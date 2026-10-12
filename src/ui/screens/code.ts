import { gsap } from 'gsap';
import { reducedMotion } from '../../anim/motion';
import { cardBlob, drawCard } from '../components/card';
import { renderQr } from '../components/qr';
import { announce, h } from '../dom';
import { go } from '../router';
import { resetQuiz, shareUrl, state } from '../state';

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    announce(done);
    return true;
  } catch {
    return false;
  }
}

function flash(btn: HTMLButtonElement, text: string) {
  const original = btn.textContent;
  btn.textContent = text;
  window.setTimeout(() => (btn.textContent = original), 1600);
}

export function codeScreen(root: HTMLElement): () => void {
  if (!state.me || !state.myCode) {
    go('/', true);
    return () => {};
  }
  const code = state.myCode;
  const url = shareUrl(code);
  const words = code.split('-');

  const cardCanvas = h('canvas', { class: 'profile-card', role: 'img' });
  const type = drawCard(cardCanvas, state.me);
  cardCanvas.setAttribute('aria-label', `Profile card: ${type.name}. ${type.oneLiner}`);

  const qr = h('canvas', { class: 'qr', role: 'img', 'aria-label': 'QR code of your match link' });
  void renderQr(qr, url);

  const copyLink = h('button', { class: 'btn primary', type: 'button' }, 'Copy my link');
  copyLink.addEventListener('click', async () => flash(copyLink, (await copy(url, 'Link copied')) ? 'Copied!' : 'Copy failed'));
  const copyWords = h('button', { class: 'btn small', type: 'button' }, 'Copy words');
  copyWords.addEventListener('click', async () => flash(copyWords, (await copy(code, 'Code copied')) ? 'Copied!' : 'Copy failed'));

  const shareBtn =
    typeof navigator.share === 'function'
      ? h(
          'button',
          {
            class: 'btn',
            type: 'button',
            onclick: () => void navigator.share({ title: 'Chope Liao', text: "Let's see if we match! Here's my Chope Liao code:", url }).catch(() => {}),
          },
          'Share link',
        )
      : null;

  const saveCard = h('button', { class: 'btn', type: 'button' }, 'Save card image');
  saveCard.addEventListener('click', async () => {
    const blob = await cardBlob(cardCanvas);
    if (!blob) return;
    const file = new File([blob], 'chope-liao-card.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: type.name }).catch(() => {});
      return;
    }
    const a = h('a', { href: URL.createObjectURL(blob), download: 'chope-liao-card.png' });
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  root.append(
    h(
      'section',
      { class: 'code-screen' },
      h('h1', {}, 'Your match code'),
      h('p', { class: 'lede' }, 'Send it to a friend, crush, or the whole group chat. They take the quiz, then you both see the match.'),
      h(
        'div',
        { class: 'code-grid' },
        h(
          'div',
          { class: 'panel code-panel' },
          h('div', { class: 'qr-wrap' }, qr),
          h(
            'p',
            { class: 'code-words', 'aria-label': `Code: ${words.join(' ')}` },
            [0, 4, 8, 12].map((i) => h('span', { class: 'code-row' }, words.slice(i, i + 4).join('-'))),
          ),
          h('div', { class: 'actions' }, copyLink, shareBtn, copyWords),
        ),
        h(
          'div',
          { class: 'panel card-panel' },
          cardCanvas,
          h('h2', { class: 'type-name' }, type.name),
          h('p', {}, type.oneLiner),
          h('p', { class: 'fine' }, 'Just a fun label. The match uses all of your answers, not this type.'),
          h('div', { class: 'actions' }, saveCard),
        ),
      ),
      h(
        'div',
        { class: 'actions center' },
        h('button', { class: 'btn primary', type: 'button', onclick: () => go(state.friend ? '/result' : '/compare') }, state.friend ? 'See our match' : 'Check a match'),
        h('button', { class: 'btn', type: 'button', onclick: () => go('/party') }, 'Party Mode'),
        h(
          'button',
          {
            class: 'btn ghost',
            type: 'button',
            onclick: () => {
              state.me = null;
              state.myCode = null;
              resetQuiz();
              go('/quiz');
            },
          },
          'Retake quiz',
        ),
      ),
      h('p', { class: 'fine center' }, "Your answers aren't saved anywhere. Refresh and they're gone, but your code keeps working."),
    ),
  );

  if (!reducedMotion()) {
    const tl = gsap.timeline();
    tl.from('.code-panel, .card-panel', { y: 24, opacity: 0, stagger: 0.12, duration: 0.5 }).from('.code-row', { x: -12, opacity: 0, stagger: 0.06, duration: 0.3 }, '<0.2');
    return () => tl.kill();
  }
  return () => {};
}
