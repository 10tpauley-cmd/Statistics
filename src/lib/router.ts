import { useSyncExternalStore } from 'react';

/** Minimal hash router: works from file://, static hosting, and refreshes without a server. */
function readHash() {
  const h = typeof window === 'undefined' ? '' : window.location.hash.replace(/^#/, '') || '/';
  return h.startsWith('/') ? h : `/${h}`;
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useHash() {
  return useSyncExternalStore(subscribe, readHash, () => '/');
}

export function useLocation() {
  const hash = useHash();
  const [path, qs = ''] = hash.split('?');
  return { path: path || '/', query: new URLSearchParams(qs), href: hash };
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const target = `#${to}`;
  if (opts.replace) window.history.replaceState(null, '', target);
  else window.location.hash = to;
  if (opts.replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
  window.scrollTo({ top: 0 });
}

export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const a = path.split('/').filter(Boolean);
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

export function href(to: string) {
  return `#${to}`;
}
