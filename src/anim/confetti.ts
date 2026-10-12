/** Confetti made of tiny kopi cups and kaya toast. Skipped under reduced motion. */
import { gsap } from 'gsap';
import { CONFETTI_CUP, CONFETTI_TOAST } from '../ui/components/art';
import { reducedMotion } from './motion';

export function confetti(host: HTMLElement, count = 36): () => void {
  if (reducedMotion()) return () => {};
  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  host.append(layer);
  const w = host.clientWidth || window.innerWidth;
  const tl = gsap.timeline({ onComplete: () => layer.remove() });
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.innerHTML = i % 2 ? CONFETTI_CUP : CONFETTI_TOAST;
    layer.append(piece);
    const x = (Math.random() - 0.5) * w * 0.9;
    tl.fromTo(
      piece,
      { x: 0, y: 0, rotate: 0, scale: 0.4 + Math.random() * 0.6, opacity: 1 },
      {
        x,
        y: -160 - Math.random() * 180,
        rotate: (Math.random() - 0.5) * 540,
        duration: 0.7,
        ease: 'power2.out',
      },
      Math.random() * 0.25,
    ).to(piece, { y: '+=520', rotate: '+=180', opacity: 0, duration: 1.4 + Math.random() * 0.6, ease: 'power1.in' }, '>-0.05');
  }
  return () => {
    tl.kill();
    layer.remove();
  };
}
