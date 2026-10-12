/**
 * Motion helpers. Every animation goes through here so it gets a calm
 * fallback when the OS asks for reduced motion OR the user switched it on
 * in the app.
 */
import { gsap } from 'gsap';
import { prefs } from '../ui/prefs';

/** Keep regular animations short; deliberate reveals can opt out. */
gsap.defaults({ duration: 0.45, ease: 'power2.out' });

export function reducedMotion(): boolean {
  if (prefs.motion === 'reduce') return true;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type Setup = () => void | (() => void);

/**
 * gsap.matchMedia wrapper: runs `full` normally and `calm` under reduced
 * motion, re-running when the OS setting flips. Returns a cleanup function
 * that reverts every tween created inside.
 */
export function withMotion(scope: Element, full: Setup, calm: Setup): () => void {
  const mm = gsap.matchMedia(scope);
  if (prefs.motion === 'reduce') {
    mm.add('all', calm);
  } else {
    mm.add({ full: '(prefers-reduced-motion: no-preference)', calm: '(prefers-reduced-motion: reduce)' }, (ctx) =>
      ctx.conditions?.full ? full() : calm(),
    );
  }
  return () => mm.revert();
}
