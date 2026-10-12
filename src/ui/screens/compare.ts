import { decodeCode, describeDecodeError } from '../../engine';
import { scanQr } from '../components/scanner';
import { h } from '../dom';
import { go } from '../router';
import { resetQuiz, state } from '../state';

/** Set when a shared link arrives with a broken code. */
let linkError: { input: string; message: string } | null = null;

/** Router hook for `#c=…` links. Returns the screen to show. */
export function handleSharedCode(code: string): void {
  const res = decodeCode(code);
  if (res.ok) {
    state.friend = res.profile;
    linkError = null;
  } else {
    linkError = { input: code, message: describeDecodeError(res.error) };
  }
}

export function compareScreen(root: HTMLElement): () => void {
  const status = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' });
  const input = h('textarea', {
    id: 'code-input',
    rows: 3,
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    placeholder: 'kaya-otter-monsoon-prata-…',
  });
  if (linkError) {
    input.value = linkError.input;
    status.textContent = linkError.message;
    status.className = 'status error';
  }

  const tryCode = (text: string) => {
    const res = decodeCode(text);
    if (!res.ok) {
      status.textContent = describeDecodeError(res.error);
      status.className = 'status error';
      input.focus();
      return;
    }
    linkError = null;
    state.friend = res.profile;
    status.className = 'status ok';
    status.textContent = res.corrected.length
      ? `Got it! Fixed a typo: ${res.corrected.map((c) => `"${c.from}" → "${c.to}"`).join(', ')}.`
      : 'Got it!';
    window.setTimeout(() => render(), res.corrected.length ? 1200 : 300);
  };

  const form = h(
    'form',
    { class: 'panel paste-form' },
    h('label', { for: 'code-input' }, "Paste your friend's code or link"),
    input,
    h(
      'div',
      { class: 'actions' },
      h('button', { class: 'btn primary', type: 'submit' }, 'Check code'),
      h(
        'button',
        {
          class: 'btn',
          type: 'button',
          onclick: async () => {
            const text = await scanQr();
            if (text) {
              input.value = text;
              tryCode(text);
            }
          },
        },
        'Scan QR',
      ),
    ),
    status,
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    tryCode(input.value);
  });

  const section = h('section', { class: 'compare' });
  root.append(section);

  function render() {
    section.replaceChildren();
    if (state.friend) {
      section.append(
        h('h1', {}, state.me ? 'Ready to brew!' : 'Your friend sent you a code'),
        h(
          'p',
          { class: 'lede' },
          state.me
            ? "Both codes are in. Let's see how you two fit."
            : 'Take the quiz (about 8 minutes) and we will show you both how well you match. Your answers stay on your phone.',
        ),
        h(
          'div',
          { class: 'actions' },
          state.me
            ? h('button', { class: 'btn primary', type: 'button', onclick: () => go('/result') }, 'See our match')
            : h(
                'button',
                {
                  class: 'btn primary',
                  type: 'button',
                  onclick: () => {
                    if (!state.session) resetQuiz();
                    go('/quiz');
                  },
                },
                state.session && state.step > 0 ? 'Continue the quiz' : 'Start the quiz',
              ),
          h(
            'button',
            {
              class: 'btn ghost',
              type: 'button',
              onclick: () => {
                state.friend = null;
                render();
              },
            },
            'Use a different code',
          ),
        ),
      );
    } else {
      section.append(
        h('h1', {}, 'Check a match'),
        h('p', { class: 'lede' }, 'Got a code from someone? Paste it or scan their QR.'),
        form,
      );
    }
  }
  render();
  return () => {};
}
