/** Landing: skyline parallax, Merlion spout, and the two characters bobbing. */
import { gsap } from 'gsap';
import { withMotion } from './motion';

export function animateLanding(root: HTMLElement): () => void {
  let removePointer = () => {};
  const revert = withMotion(
    root,
    () => {
      const tl = gsap.timeline();
      tl.from('.skyline .layer-far', { y: 30, opacity: 0, duration: 0.9 })
        .from('.skyline .layer-mid', { y: 40, opacity: 0, duration: 0.8 }, '<0.1')
        .from('.skyline .merlion', { y: 50, opacity: 0, duration: 0.8, ease: 'back.out(1.6)' }, '<0.2')
        .from('.char-kopi', { x: -60, opacity: 0, rotate: -12, duration: 0.7, ease: 'back.out(1.8)' }, '<0.2')
        .from('.char-kaya', { x: 60, opacity: 0, rotate: 12, duration: 0.7, ease: 'back.out(1.8)' }, '<')
        .from('.hero-copy > *', { y: 16, opacity: 0, stagger: 0.08, duration: 0.5 }, '<0.1');

      gsap.to('.skyline .sun', { y: -6, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to('.skyline .spout', { strokeDashoffset: -16, duration: 1, repeat: -1, ease: 'none' });
      gsap.to('.char-kopi', { y: -8, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.2 });
      gsap.to('.char-kaya', { y: -8, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.6 });
      gsap.to('.char-kopi .steam path', { y: -4, opacity: 0.3, stagger: 0.2, duration: 1, yoyo: true, repeat: -1 });
      gsap.to('.char .eye', { scaleY: 0.1, transformOrigin: 'center', duration: 0.08, yoyo: true, repeat: -1, repeatDelay: 3.2 });

      // Parallax: far layers move less than near ones.
      const far = gsap.quickTo('.skyline .layer-far', 'x', { duration: 0.8 });
      const mid = gsap.quickTo('.skyline .layer-mid', 'x', { duration: 0.8 });
      const mer = gsap.quickTo('.skyline .merlion', 'x', { duration: 0.8 });
      const onMove = (e: PointerEvent) => {
        const dx = e.clientX / window.innerWidth - 0.5;
        far(dx * -6);
        mid(dx * -12);
        mer(dx * -20);
      };
      const onScroll = () => {
        const y = Math.min(window.scrollY, 300);
        gsap.set('.skyline .merlion', { y: y * -0.08 });
        gsap.set('.skyline .layer-mid', { y: y * -0.04 });
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      removePointer = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('scroll', onScroll);
      };
      return removePointer;
    },
    () => {
      gsap.from('.hero-copy, .char', { opacity: 0, duration: 0.3 });
    },
  );
  return () => {
    removePointer();
    revert();
  };
}
