import './ui/styles.css';
import { applyTheme, prefs, setMotion, setTheme, type ThemePref } from './ui/prefs';
import { go, onSharedCode, route, startRouter } from './ui/router';
import { aboutScreen } from './ui/screens/about';
import { codeScreen } from './ui/screens/code';
import { compareScreen, handleSharedCode } from './ui/screens/compare';
import { landingScreen } from './ui/screens/landing';
import { partyScreen } from './ui/screens/party';
import { quizScreen } from './ui/screens/quiz';
import { resultScreen } from './ui/screens/result';
import { prefetchScanner } from './ui/components/scanner';

applyTheme();

route('/', landingScreen);
route('/quiz', quizScreen);
route('/code', codeScreen);
route('/compare', compareScreen);
route('/result', resultScreen);
route('/party', partyScreen);
route('/about', aboutScreen);
onSharedCode(handleSharedCode);

// Header controls
const themeBtn = document.getElementById('theme-toggle') as HTMLButtonElement | null;
const motionBtn = document.getElementById('motion-toggle') as HTMLButtonElement | null;
const THEME_NEXT: Record<ThemePref, ThemePref> = { auto: 'light', light: 'dark', dark: 'auto' };
const THEME_ICON: Record<ThemePref, string> = { auto: '◐', light: '☀', dark: '☾' };

function syncControls() {
  if (themeBtn) {
    themeBtn.textContent = THEME_ICON[prefs.theme];
    themeBtn.setAttribute('aria-label', `Theme: ${prefs.theme}. Tap to change.`);
    themeBtn.title = `Theme: ${prefs.theme}`;
  }
  if (motionBtn) {
    // aria-pressed carries the state; the label stays constant.
    motionBtn.setAttribute('aria-pressed', String(prefs.motion === 'reduce'));
  }
}
themeBtn?.addEventListener('click', () => {
  setTheme(THEME_NEXT[prefs.theme]);
  syncControls();
});
motionBtn?.addEventListener('click', () => {
  setMotion(prefs.motion === 'reduce' ? 'auto' : 'reduce');
  syncControls();
});
document.getElementById('home-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  go('/');
});
syncControls();

startRouter();

// Offline support after first load. Same-origin only, no network calls elsewhere.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    prefetchScanner();
  });
}
