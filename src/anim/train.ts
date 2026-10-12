/** Question transitions: the card pulls out like a departing MRT train. */
import { gsap } from 'gsap';
import { reducedMotion } from './motion';

export function trainOut(card: Element, direction: 1 | -1): Promise<void> {
  return new Promise((resolve) => {
    if (reducedMotion()) {
      gsap.to(card, { opacity: 0, duration: 0.15, onComplete: resolve });
      return;
    }
    gsap.to(card, { xPercent: -110 * direction, skewX: 6 * direction, opacity: 0.4, duration: 0.32, ease: 'power2.in', onComplete: resolve });
  });
}

export function trainIn(card: Element, direction: 1 | -1): gsap.core.Timeline {
  const tl = gsap.timeline();
  const options = card.querySelectorAll('.opt, .scale-btn, .db-block');
  if (reducedMotion()) {
    tl.from(card, { opacity: 0, duration: 0.2 });
    return tl;
  }
  tl.from(card, { xPercent: 110 * direction, skewX: -6 * direction, duration: 0.42, ease: 'power3.out' })
    .to(card, { skewX: 0, duration: 0.2 }, '-=0.15')
    .from(options, { scale: 0.85, opacity: 0, y: 10, stagger: 0.05, duration: 0.3, ease: 'back.out(2)' }, '-=0.2');
  return tl;
}

/** Slides the train marker along the MRT line. */
export function moveTrain(marker: Element, pct: number): void {
  if (reducedMotion()) gsap.set(marker, { left: `${pct}%` });
  else gsap.to(marker, { left: `${pct}%`, duration: 0.5, ease: 'power2.inOut' });
}
