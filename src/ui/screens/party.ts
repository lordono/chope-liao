import {
  PARTY_THRESHOLDS,
  bandFor,
  decodeCode,
  describeDecodeError,
  encodeCode,
  highlights,
  mulberry32,
  mutualPercentile,
  mutualScore,
  randomSeed,
  runPartyMatching,
  type MatchResult,
  type PartyThreshold,
} from '../../engine';
import { playReveal } from '../../anim/party';
import { scanQr } from '../components/scanner';
import { announce, h } from '../dom';
import { state } from '../state';

const THRESHOLD_LABELS: Record<PartyThreshold, string> = {
  relaxed: 'Relaxed: pair most people',
  normal: 'Normal',
  picky: 'Picky: only strong matches',
};

let threshold: PartyThreshold = 'normal';

export function partyScreen(root: HTMLElement): () => void {
  const section = h('section', { class: 'party' });
  root.append(section);
  let cleanupReveal = () => {};

  function collect() {
    cleanupReveal();
    section.replaceChildren();
    const status = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' });
    const nameInput = h('input', { id: 'p-name', type: 'text', autocomplete: 'off', maxlength: 24, required: true });
    const codeInput = h('textarea', { id: 'p-code', rows: 2, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    const list = h('ul', { class: 'roster' });
    const count = h('p', { class: 'count', 'aria-live': 'polite' });
    const runBtn = h('button', { class: 'btn primary big', type: 'button' }, 'Chope liao! Run the matching');

    const refresh = () => {
      list.replaceChildren(
        ...state.party.map((p, i) =>
          h(
            'li',
            {},
            h('span', { class: 'roster-name' }, p.name),
            h(
              'button',
              {
                class: 'btn ghost small',
                type: 'button',
                'aria-label': `Remove ${p.name}`,
                onclick: () => {
                  state.party.splice(i, 1);
                  refresh();
                },
              },
              'Remove',
            ),
          ),
        ),
      );
      const n = state.party.length;
      count.textContent = n === 0 ? 'No one yet. Add the first person!' : `${n} ${n === 1 ? 'person' : 'people'} in the party`;
      runBtn.disabled = n < 2;
    };

    const add = (name: string, code: string) => {
      const clean = name.trim();
      if (!clean) {
        status.textContent = 'Give them a name or nickname first.';
        status.className = 'status error';
        nameInput.focus();
        return false;
      }
      if (state.party.some((p) => p.name.toLowerCase() === clean.toLowerCase())) {
        status.textContent = `There's already a "${clean}". Try a nickname?`;
        status.className = 'status error';
        return false;
      }
      const res = decodeCode(code);
      if (!res.ok) {
        status.textContent = describeDecodeError(res.error);
        status.className = 'status error';
        codeInput.focus();
        return false;
      }
      const canonical = encodeCode(res.profile);
      if (state.party.some((p) => encodeCode(p.profile) === canonical)) {
        status.textContent = 'That code is already in the party.';
        status.className = 'status error';
        return false;
      }
      state.party.push({ id: canonical, name: clean, profile: res.profile });
      status.textContent = `${clean} is in!`;
      status.className = 'status ok';
      nameInput.value = '';
      codeInput.value = '';
      nameInput.focus();
      refresh();
      return true;
    };

    const form = h(
      'form',
      { class: 'panel' },
      h('label', { for: 'p-name' }, 'Name or nickname'),
      nameInput,
      h('label', { for: 'p-code' }, 'Their match code or link'),
      codeInput,
      h(
        'div',
        { class: 'actions' },
        h('button', { class: 'btn primary', type: 'submit' }, 'Add to party'),
        h(
          'button',
          {
            class: 'btn',
            type: 'button',
            onclick: async () => {
              const text = await scanQr();
              if (text) {
                codeInput.value = text;
                if (nameInput.value.trim()) add(nameInput.value, text);
                else {
                  status.textContent = 'Scanned! Now add their name.';
                  status.className = 'status ok';
                  nameInput.focus();
                }
              }
            },
          },
          'Scan QR',
        ),
        state.me && state.myCode && !state.party.some((p) => p.id === state.myCode)
          ? h(
              'button',
              {
                class: 'btn ghost',
                type: 'button',
                onclick: () => {
                  if (!nameInput.value.trim()) nameInput.value = 'Me';
                  add(nameInput.value, state.myCode!);
                },
              },
              'Add my own code',
            )
          : null,
      ),
      status,
    );
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      add(nameInput.value, codeInput.value);
    });

    const thresholdGroup = h(
      'fieldset',
      { class: 'panel thresholds' },
      h('legend', {}, 'How picky should the matching be?'),
      (Object.keys(PARTY_THRESHOLDS) as PartyThreshold[]).map((t) => {
        const input = h('input', { type: 'radio', name: 'threshold', id: `t-${t}`, value: t, checked: t === threshold });
        input.addEventListener('change', () => (threshold = t));
        return h('div', { class: 'radio' }, input, h('label', { for: `t-${t}` }, THRESHOLD_LABELS[t]));
      }),
      h('p', { class: 'fine' }, 'Pairs below the bar stay unmatched rather than being forced together.'),
    );

    runBtn.addEventListener('click', () => run());

    section.append(
      h('h1', {}, 'Party Mode'),
      h(
        'p',
        { class: 'lede' },
        "Collect everyone's codes on this one device, then let the matching do its thing. Codes and names stay in this tab only.",
      ),
      form,
      count,
      list,
      thresholdGroup,
      h('div', { class: 'actions center' }, runBtn),
    );
    refresh();
  }

  function run() {
    const rng = mulberry32(randomSeed());
    const result = runPartyMatching(
      state.party.map((p) => p.profile),
      PARTY_THRESHOLDS[threshold],
      rng,
    );
    reveal(result);
  }

  function reveal(result: MatchResult) {
    section.replaceChildren();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'party-stage');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Animated matching: anonymous avatars send proposals and pair up');
    const skip = h('button', { class: 'btn ghost', type: 'button' }, 'Skip animation');
    section.append(
      h('h1', {}, 'Matching…'),
      h('p', { class: 'lede' }, result.note),
      h('p', { class: 'fine' }, 'Avatars are anonymous and shuffled, so the screen never shows who matched whom.'),
      svg,
      h('div', { class: 'actions center' }, skip),
    );
    const handle = playReveal(svg, { n: state.party.length, ...(result.sides ? { sides: result.sides } : {}) }, result.events, result.match, () => {
      skip.replaceWith(h('button', { class: 'btn primary big', type: 'button', onclick: () => results(result) }, 'See results, one at a time'));
      announce('Matching done.');
    });
    skip.addEventListener('click', handle.skip);
    cleanupReveal = handle.cleanup;
  }

  function results(result: MatchResult) {
    cleanupReveal();
    section.replaceChildren();
    const panel = h('div', { class: 'panel private', hidden: true, 'aria-live': 'polite' });
    const names = h(
      'div',
      { class: 'name-grid' },
      state.party.map((p, i) =>
        h(
          'button',
          {
            class: 'btn name',
            type: 'button',
            onclick: () => show(i),
          },
          p.name,
        ),
      ),
    );

    function show(i: number) {
      const person = state.party[i]!;
      const j = result.match[i] ?? -1;
      names.hidden = true;
      panel.hidden = false;
      const hide = h(
        'button',
        {
          class: 'btn primary',
          type: 'button',
          onclick: () => {
            panel.hidden = true;
            panel.replaceChildren();
            names.hidden = false;
            (names.children[i] as HTMLElement | undefined)?.focus();
          },
        },
        'Hide and pass the phone',
      );
      if (j === -1) {
        panel.replaceChildren(
          h('h2', { tabindex: '-1' }, `${person.name}…`),
          h('p', { class: 'big-line' }, 'No chope this round, try again next makan session.'),
          h('p', { class: 'fine' }, "Nobody's pairing cleared the bar this time. That's about this group, not about you."),
          hide,
        );
      } else {
        const partner = state.party[j]!;
        const band = bandFor(mutualPercentile(mutualScore(person.profile, partner.profile)));
        panel.replaceChildren(
          h('h2', { tabindex: '-1' }, `${person.name}, you're paired with`),
          h('p', { class: 'big-line partner' }, partner.name),
          h('p', { class: 'band-chip' }, band.name, band.topLabel ? ` · ${band.topLabel}` : ''),
          h('ul', { class: 'highlights' }, highlights(person.profile, partner.profile, 2).map((l) => h('li', {}, l))),
          hide,
        );
      }
      panel.querySelector<HTMLElement>('h2')?.focus();
    }

    section.append(
      h('h1', {}, 'Results'),
      h('p', { class: 'lede' }, 'Tap your name to see your own result. Hide it before you pass the phone on.'),
      names,
      panel,
      h(
        'div',
        { class: 'actions center' },
        h('button', { class: 'btn', type: 'button', onclick: () => run() }, 'Run again'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => collect() }, 'Edit the party'),
      ),
    );
  }

  collect();
  return () => cleanupReveal();
}
