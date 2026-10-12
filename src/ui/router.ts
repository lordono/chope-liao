/**
 * Hash router. Routes look like `#/quiz`; a shared code arrives as `#c=…`
 * (fragment only, so static hosts never see it).
 */
export type Screen = (root: HTMLElement, params: URLSearchParams) => void | (() => void);

const routes = new Map<string, Screen>();
let cleanup: (() => void) | void;
let codeHandler: ((code: string) => void) | null = null;

export function route(path: string, screen: Screen): void {
  routes.set(path, screen);
}

/** Called when the URL carries `#c=…`. */
export function onSharedCode(fn: (code: string) => void): void {
  codeHandler = fn;
}

export function go(path: string, replace = false): void {
  const hash = `#${path}`;
  if (window.location.hash === hash) {
    render();
    return;
  }
  if (replace) {
    history.replaceState(null, '', hash);
    render();
  } else {
    window.location.hash = hash;
  }
}

function render(): void {
  let raw = window.location.hash.slice(1);
  if (raw.startsWith('c=')) {
    codeHandler?.(decodeURIComponent(raw.slice(2)));
    // Keep the code in the address bar; show the compare screen.
    raw = '/compare';
  }
  const [path = '/', query = ''] = (raw || '/').split('?');
  const screen = routes.get(path) ?? routes.get('/')!;
  const root = document.getElementById('app')!;
  if (cleanup) cleanup();
  root.replaceChildren();
  window.scrollTo(0, 0);
  cleanup = screen(root, new URLSearchParams(query));
  // Move focus to the new screen's heading for keyboard and screen-reader users.
  const heading = root.querySelector<HTMLElement>('h1, [data-focus]');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}

export function startRouter(): void {
  window.addEventListener('hashchange', render);
  render();
}
