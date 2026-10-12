import { gsap } from 'gsap';
import { DEALBREAKER_TEXT, FAITH_OPTIONS, STATIONS, type StationId } from '../../data/questions';
import {
  computeProfile,
  drawSession,
  encodeCode,
  mulberry32,
  randomSeed,
  roundTrip,
  type Answer,
  type ChoiceQuestion,
  type DealbreakerAnswer,
  type DealbreakerQuestion,
  type FlavourQuestion,
  type IdealQuestion,
  type PriorityQuestion,
  type Question,
  type Scale4,
} from '../../engine';
import { trainIn, trainOut } from '../../anim/train';
import { mrtBar } from '../components/mrtBar';
import { announce, h } from '../dom';
import { go } from '../router';
import { state } from '../state';

type Step = { kind: 'question'; question: Question; station: StationId; number: number } | { kind: 'identity'; station: StationId; number: number };

function buildSteps(): Step[] {
  if (!state.session) state.session = drawSession(mulberry32(randomSeed()));
  const steps: Step[] = [];
  let number = 0;
  for (const item of state.session.items) {
    if (item.station === 'serious' && !steps.some((s) => s.kind === 'identity')) {
      steps.push({ kind: 'identity', station: 'serious', number });
    }
    steps.push({ kind: 'question', question: item.question, station: item.station, number: number++ });
  }
  return steps;
}

const AUTO_ADVANCE_MS = 260;

export function quizScreen(root: HTMLElement): () => void {
  const steps = buildSteps();
  const total = state.session!.items.length;
  const bar = mrtBar();
  const stage = h('div', { class: 'quiz-stage' });
  const backBtn = h('button', { class: 'btn ghost small', type: 'button', onclick: () => move(-1) }, '← Back');
  const heading = h('h1', { class: 'sr-only' }, 'Quiz');
  root.append(h('section', { class: 'quiz' }, heading, bar.el, h('div', { class: 'quiz-nav' }, backBtn), stage));

  let card: HTMLElement | null = null;
  let busy = false;
  let pendingTimer = 0;

  function onKey(e: KeyboardEvent) {
    if (!card || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 9) {
      const btn = card.querySelectorAll<HTMLButtonElement>('[data-quick]')[n - 1];
      if (btn) {
        e.preventDefault();
        btn.click();
      }
    }
  }
  window.addEventListener('keydown', onKey);

  function render(direction: 1 | -1, animate: boolean) {
    const step = steps[state.step]!;
    bar.update(step.number, total, step.station);
    backBtn.disabled = state.step === 0;
    const next = step.kind === 'identity' ? identityCard() : questionCard(step.question);
    next.classList.add('card');
    stage.replaceChildren(next);
    card = next;
    if (animate) trainIn(next, direction);
    const station = STATIONS.find((s) => s.id === step.station);
    const prev = steps[state.step - direction];
    if (!prev || prev.station !== step.station) announce(`Now arriving at ${station?.name}.`);
    // Focus the prompt so screen readers read the new question.
    next.querySelector<HTMLElement>('.prompt')?.focus({ preventScroll: true });
  }

  async function move(direction: 1 | -1) {
    if (busy) return;
    const target = state.step + direction;
    if (target < 0) return;
    if (target >= steps.length) {
      finish();
      return;
    }
    busy = true;
    if (card) await trainOut(card, direction);
    state.step = target;
    render(direction, true);
    busy = false;
  }

  function record(id: string, answer: Answer, advance = true) {
    state.answers.set(id, answer);
    if (!advance) return;
    window.clearTimeout(pendingTimer);
    pendingTimer = window.setTimeout(() => move(1), AUTO_ADVANCE_MS);
  }

  function finish() {
    const questions = state.session!.items.map((i) => i.question);
    const profile = roundTrip(computeProfile(questions, state.answers, state.identity));
    state.me = profile;
    state.myCode = encodeCode(profile);
    go(state.friend ? '/result' : '/code');
  }

  // -------------------------------------------------------------------------
  // Card builders
  // -------------------------------------------------------------------------

  function promptEl(text: string, hint?: string, id = 'q-prompt') {
    return [
      h('h2', { class: 'prompt', id, tabindex: '-1' }, text),
      hint ? h('p', { class: 'hint' }, hint) : null,
    ];
  }

  function optionButton(label: string, selected: boolean, onPick: () => void, index: number) {
    const btn = h(
      'button',
      { class: 'opt', type: 'button', 'aria-pressed': String(selected), 'data-quick': '' },
      h('span', { class: 'opt-key', 'aria-hidden': 'true' }, String(index + 1)),
      h('span', { class: 'opt-label' }, label),
    );
    btn.addEventListener('click', () => {
      btn.parentElement?.querySelectorAll('.opt').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      gsap.fromTo(btn, { scale: 0.96 }, { scale: 1, duration: 0.25, ease: 'back.out(3)' });
      onPick();
    });
    return btn;
  }

  function questionCard(q: Question): HTMLElement {
    switch (q.kind) {
      case 'lifestyle':
      case 'scenario':
      case 'flavour':
        return choiceCard(q);
      case 'ideal':
      case 'priority':
        return scaleCard(q);
      case 'dealbreaker':
        return dealbreakerCard(q);
    }
  }

  function choiceCard(q: ChoiceQuestion | FlavourQuestion): HTMLElement {
    const prev = state.answers.get(q.id);
    const selected = prev && (prev.kind === 'choice' || prev.kind === 'flavour') ? prev.option : -1;
    const kind = q.kind === 'flavour' ? 'flavour' : 'choice';
    return h(
      'div',
      { class: `qcard ${q.kind}` },
      h('p', { class: 'eyebrow' }, q.kind === 'scenario' ? 'Scenario' : q.kind === 'flavour' ? 'Just for fun' : 'Quick tap'),
      promptEl(q.prompt, q.hint),
      h(
        'div',
        { class: 'opts', role: 'group', 'aria-labelledby': 'q-prompt' },
        q.options.map((o, i) => optionButton(o.label, i === selected, () => record(q.id, { kind, option: i } as Answer), i)),
      ),
    );
  }

  function scaleCard(q: IdealQuestion | PriorityQuestion): HTMLElement {
    const prev = state.answers.get(q.id);
    const selected = prev && prev.kind === 'scale' ? prev.value : -1;
    const rows: [Scale4, string, string][] = [
      [0, 'Definitely', q.left],
      [1, 'A bit more', q.left],
      [2, 'A bit more', q.right],
      [3, 'Definitely', q.right],
    ];
    const btns: HTMLButtonElement[] = rows.map(([value, strength, label]) => {
      const btn = h(
        'button',
        {
          class: `scale-btn ${value <= 1 ? 'left' : 'right'}`,
          type: 'button',
          'aria-pressed': String(value === selected),
          'data-quick': '',
        },
        h('span', { class: 'scale-strength' }, strength),
        h('span', { class: 'scale-label' }, label),
      );
      btn.addEventListener('click', () => {
        btns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
        record(q.id, { kind: 'scale', value });
      });
      return btn;
    });
    const children = [btns[0], btns[1], h('p', { class: 'scale-or', 'aria-hidden': 'true' }, 'or'), btns[2], btns[3]];
    return h(
      'div',
      { class: 'qcard tradeoff' },
      h('p', { class: 'eyebrow' }, q.kind === 'ideal' ? 'Pick a side' : 'Which matters more?'),
      promptEl(q.prompt, 'No middle option. Go with your gut.'),
      h('div', { class: 'scale', role: 'group', 'aria-labelledby': 'q-prompt' }, children),
    );
  }

  /** A row of toggle buttons for one sub-question of a dealbreaker. */
  function choiceGroup(labelId: string, labels: readonly string[], selected: number, onPick: (i: number) => void, quick: boolean) {
    const btns = labels.map((label, i) => {
      const b = h('button', { class: 'opt compact', type: 'button', 'aria-pressed': String(i === selected), ...(quick ? { 'data-quick': '' } : {}) }, label);
      b.addEventListener('click', () => {
        btns.forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        onPick(i);
      });
      return b;
    });
    return h('div', { class: 'opts db-block', role: 'group', 'aria-labelledby': labelId }, btns);
  }

  function checkbox(id: string, label: string, checked: boolean, onChange: (v: boolean) => void) {
    const input = h('input', { type: 'checkbox', id, checked });
    input.addEventListener('change', () => onChange(input.checked));
    return h('div', { class: 'check db-block' }, input, h('label', { for: id }, label));
  }

  function dealbreakerCard(q: DealbreakerQuestion): HTMLElement {
    const prev = state.answers.get(q.id) as DealbreakerAnswer | undefined;
    const ans: DealbreakerAnswer = prev ? { ...prev } : { kind: 'dealbreaker', key: q.key, value: -1, extra: q.key === 'smoking' ? -1 : 0 };
    const nextBtn = h('button', { class: 'btn primary', type: 'button' }, 'Next stop →');
    const valid = () => ans.value >= 0 && (q.key !== 'smoking' || ans.extra >= 0);
    const refresh = () => {
      nextBtn.disabled = !valid();
    };
    nextBtn.addEventListener('click', () => {
      if (!valid()) return;
      state.answers.set(q.id, { ...ans });
      move(1);
    });
    const body: (HTMLElement | null)[] = [];
    switch (q.key) {
      case 'kids': {
        const t = DEALBREAKER_TEXT.kids;
        body.push(choiceGroup('q-prompt', t.options, ans.value, (i) => ((ans.value = i), refresh()), true));
        body.push(checkbox('kids-must', t.must, ans.extra === 1, (v) => (ans.extra = v ? 1 : 0)));
        break;
      }
      case 'smoking': {
        const t = DEALBREAKER_TEXT.smoking;
        body.push(h('h3', { class: 'sub', id: 'smoke-self' }, t.selfPrompt));
        body.push(choiceGroup('smoke-self', t.self, ans.value, (i) => ((ans.value = i), refresh()), false));
        body.push(h('h3', { class: 'sub', id: 'smoke-partner' }, t.partnerPrompt));
        body.push(choiceGroup('smoke-partner', t.partner, ans.extra, (i) => ((ans.extra = i), refresh()), false));
        break;
      }
      case 'pets': {
        const t = DEALBREAKER_TEXT.pets;
        body.push(choiceGroup('q-prompt', t.options, ans.value, (i) => ((ans.value = i), refresh()), true));
        body.push(checkbox('pets-cannot', t.cannot, ans.extra === 1, (v) => (ans.extra = v ? 1 : 0)));
        break;
      }
      case 'nearFamily': {
        body.push(choiceGroup('q-prompt', DEALBREAKER_TEXT.nearFamily.options, ans.value, (i) => ((ans.value = i), refresh()), true));
        break;
      }
      case 'faith': {
        const t = DEALBREAKER_TEXT.faith;
        const follow = h(
          'div',
          { class: 'follow', hidden: !(ans.value === 0 || ans.value === 1) },
          h('h3', { class: 'sub', id: 'faith-follow' }, t.followPrompt),
          h('p', { class: 'hint' }, t.followHint),
          choiceGroup('faith-follow', FAITH_OPTIONS, ans.extra, (i) => (ans.extra = i), false),
        );
        body.push(
          choiceGroup(
            'q-prompt',
            t.options,
            ans.value,
            (i) => {
              ans.value = i;
              follow.hidden = i === 2;
              if (i === 2) ans.extra = 0;
              refresh();
            },
            true,
          ),
        );
        body.push(follow);
        break;
      }
    }
    refresh();
    return h(
      'div',
      { class: 'qcard dealbreaker' },
      h('p', { class: 'eyebrow' }, 'The serious bit'),
      promptEl(q.prompt, q.key === 'kids' ? 'Big-life stuff. No wrong answers, just honest ones.' : undefined),
      ...body,
      h('div', { class: 'card-actions' }, nextBtn),
    );
  }

  function identityCard(): HTMLElement {
    const id = state.identity;
    const selfLabels = ['Prefer not to say', 'Woman', 'Man', 'Non-binary'];
    const selfOrder = [1, 2, 3, 0];
    const selfGroup = choiceGroup(
      'id-self',
      selfOrder.map((i) => selfLabels[i]!),
      selfOrder.indexOf(id.self),
      (i) => (state.identity = { ...state.identity, self: selfOrder[i] as 0 | 1 | 2 | 3 }),
      false,
    );
    const opens: [number, string][] = [
      [1, 'Women'],
      [2, 'Men'],
      [4, 'Non-binary people'],
    ];
    const openBoxes = opens.map(([bit, label]) =>
      checkbox(`open-${bit}`, label, (id.openTo & bit) !== 0, (v) => {
        state.identity = { ...state.identity, openTo: v ? state.identity.openTo | bit : state.identity.openTo & ~bit };
      }),
    );
    return h(
      'div',
      { class: 'qcard identity' },
      h('p', { class: 'eyebrow' }, 'Optional'),
      promptEl('Party Mode filter', 'Only used in Party Mode to decide who can be paired. Skip if you like.'),
      h('h3', { class: 'sub', id: 'id-self' }, 'I am'),
      selfGroup,
      h('h3', { class: 'sub', id: 'id-open' }, "I'm open to matching with"),
      h('div', { class: 'checks', role: 'group', 'aria-labelledby': 'id-open' }, openBoxes),
      h(
        'div',
        { class: 'card-actions' },
        h(
          'button',
          {
            class: 'btn ghost',
            type: 'button',
            onclick: () => {
              state.identity = { self: 0, openTo: 0 };
              move(1);
            },
          },
          'Skip',
        ),
        h('button', { class: 'btn primary', type: 'button', onclick: () => move(1) }, 'Next stop →'),
      ),
    );
  }

  render(1, true);
  return () => {
    window.removeEventListener('keydown', onKey);
    window.clearTimeout(pendingTimer);
    gsap.killTweensOf(stage.querySelectorAll('*'));
  };
}
