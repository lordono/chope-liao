/**
 * The ONLY things persisted: theme and reduced-motion choices. Answers and
 * codes are never written to storage.
 */
export type ThemePref = 'auto' | 'light' | 'dark';
export type MotionPref = 'auto' | 'reduce';

const KEY = 'chope-liao:prefs';

interface Prefs {
  theme: ThemePref;
  motion: MotionPref;
}

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    const p = raw ? (JSON.parse(raw) as Partial<Prefs>) : {};
    return {
      theme: p.theme === 'light' || p.theme === 'dark' ? p.theme : 'auto',
      motion: p.motion === 'reduce' ? 'reduce' : 'auto',
    };
  } catch {
    return { theme: 'auto', motion: 'auto' };
  }
}

export const prefs: Prefs = load();

function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Private mode or blocked storage: the choice just won't be remembered.
  }
}

export function applyTheme(): void {
  const root = document.documentElement;
  if (prefs.theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', prefs.theme);
  root.toggleAttribute('data-reduce-motion', prefs.motion === 'reduce');
}

export function setTheme(t: ThemePref): void {
  prefs.theme = t;
  save();
  applyTheme();
}

export function setMotion(m: MotionPref): void {
  prefs.motion = m;
  save();
  applyTheme();
}
