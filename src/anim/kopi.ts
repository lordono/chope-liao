/** Result reveal: the kopi cup brews up to the band level. A deliberate reveal (~2s). */
import { gsap } from 'gsap';
import { reducedMotion } from './motion';

export function brew(cup: Element, fill: number, onDone: () => void): gsap.core.Timeline {
  const fillEl = cup.querySelector('.kopi-fill');
  const wave = cup.querySelector('.kopi-wave');
  const steam = cup.querySelector('.brew-steam');
  // The fill rect covers y 40→152 (112 units). Level = top edge of the liquid.
  const top = 40 + 112 * (1 - fill);
  const tl = gsap.timeline();
  if (reducedMotion()) {
    gsap.set(fillEl, { attr: { y: top } });
    gsap.set(wave, { y: top - 40 });
    gsap.set(steam, { opacity: 1 });
    tl.call(onDone, [], 0.05);
    return tl;
  }
  gsap.set(fillEl, { attr: { y: 152 } });
  gsap.set(wave, { y: 112 });
  tl.to(fillEl, { attr: { y: top }, duration: 1.8, ease: 'power1.inOut' })
    .to(wave, { y: top - 40, duration: 1.8, ease: 'power1.inOut' }, '<')
    .to(wave, { x: -30, duration: 0.6, repeat: 3, yoyo: true, ease: 'sine.inOut' }, '<')
    .to(steam, { opacity: 1, duration: 0.4 })
    // Call before the endless steam loop, which would otherwise block completion.
    .call(onDone, [], '<')
    .to(steam?.querySelectorAll('path') ?? [], { y: -6, stagger: 0.15, duration: 0.8, yoyo: true, repeat: -1 }, '<');
  return tl;
}
