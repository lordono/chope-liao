/** Progress bar styled as an MRT line: each station is a quiz section. */
import { STATIONS, type StationId } from '../../data/questions';
import { moveTrain } from '../../anim/train';
import { h } from '../dom';

export interface MrtBar {
  el: HTMLElement;
  update(step: number, total: number, station: StationId): void;
}

export function mrtBar(): MrtBar {
  const marker = h('span', { class: 'mrt-train', 'aria-hidden': 'true' });
  const fill = h('span', { class: 'mrt-fill' });
  const stops = STATIONS.map((s) =>
    h('li', { class: 'mrt-stop', 'data-id': s.id, style: `--line:${s.colour}` }, h('span', { class: 'mrt-dot' }), h('span', { class: 'mrt-name' }, s.name)),
  );
  const label = h('p', { class: 'mrt-label' });
  const track = h('div', { class: 'mrt-track' }, fill, marker);
  const el = h(
    'nav',
    { class: 'mrt', 'aria-label': 'Quiz progress' },
    track,
    h('ol', { class: 'mrt-stops' }, stops),
    label,
  );
  // A real progressbar for assistive tech; the line is decorative.
  el.setAttribute('role', 'progressbar');
  el.setAttribute('aria-valuemin', '0');

  return {
    el,
    update(step, total, station) {
      const pct = total > 1 ? (step / (total - 1)) * 100 : 0;
      fill.style.width = `${pct}%`;
      moveTrain(marker, pct);
      const idx = STATIONS.findIndex((s) => s.id === station);
      stops.forEach((li, i) => {
        li.classList.toggle('passed', i < idx);
        li.classList.toggle('current', i === idx);
      });
      const s = STATIONS[idx];
      const next = STATIONS[idx + 1];
      label.textContent = `${s?.code} ${s?.name} · ${step + 1} of ${total}${next ? ` · Next: ${next.name}` : ''}`;
      el.setAttribute('aria-valuemax', String(total));
      el.setAttribute('aria-valuenow', String(step + 1));
      el.setAttribute('aria-valuetext', `Question ${step + 1} of ${total}, ${s?.name}`);
      el.style.setProperty('--line', s?.colour ?? '#2e9e5b');
    },
  };
}
