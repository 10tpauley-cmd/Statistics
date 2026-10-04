import { useEffect, useMemo, useRef, useState } from 'react';
import { onAppEvent, getState, type AppEvent } from '../../state/store';
import { useUi, setUi } from '../../state/ui';
import { navigate } from '../../lib/router';
import { CONCEPTS } from '../../content/concepts';
import { FORMULAS } from '../../content/formulas';
import { GLOSSARY } from '../../content/glossary';
import { MISCONCEPTIONS } from '../../content/misconceptions';
import { BOSSES } from '../../content/boss';
import { WIDGETS } from '../interactive/registry';
import { plain } from '../ui/Rich';
import { Icon } from '../ui/Icon';
import * as fx from '../../lib/fx';

/* ---------------- Toasts ---------------- */

type ToastEvent = Extract<AppEvent, { kind: 'toast' }> & { id: number };

export function Toasts() {
  const [items, setItems] = useState<ToastEvent[]>([]);
  useEffect(() => onAppEvent((e) => {
    if (e.kind !== 'toast') return;
    const id = Date.now() + Math.random();
    if (e.tone === 'success') fx.sound('coin');
    setItems((xs) => [...xs.slice(-3), { ...e, id }]);
    window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
  }), []);
  if (!items.length) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div className="toast" key={t.id} onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}>
          <span className="t-icon" aria-hidden="true">{t.icon ?? (t.tone === 'success' ? '✅' : t.tone === 'warn' ? '⚠️' : t.tone === 'error' ? '⛔' : 'ℹ️')}</span>
          <div><b>{t.title}</b>{t.body && <span>{t.body}</span>}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Celebrations ---------------- */

const CONFETTI = ['#4f46e5', '#2a78d6', '#eb6834', '#1baf7a', '#d4a017', '#be123c'];

export function Celebrations() {
  const [cur, setCur] = useState<(Extract<AppEvent, { kind: 'celebrate' }> & { id: number }) | null>(null);
  useEffect(() => onAppEvent((e) => {
    if (e.kind !== 'celebrate') return;
    const id = Date.now();
    if (e.strength === 'big') { fx.celebrate('boss'); fx.sound('victory'); }
    setCur({ ...e, id });
    window.setTimeout(() => setCur((c) => (c?.id === id ? null : c)), e.strength === 'big' ? 3200 : 1800);
  }), []);
  const pieces = useMemo(() => (cur ? Array.from({ length: cur.strength === 'big' ? 70 : 28 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.5, color: CONFETTI[i % CONFETTI.length], dur: 1.4 + Math.random() * 1.1, rot: Math.random() * 360,
  })) : []), [cur]);
  if (!cur) return null;
  const st = getState().settings;
  const reduced = st.effects === 'off' || st.reducedMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <>
      {!reduced && (
        <div className="confetti" aria-hidden="true">
          {pieces.map((p, i) => <i key={i} style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, transform: `rotate(${p.rot}deg)` }} />)}
        </div>
      )}
      {cur.strength === 'big' && (
        <div className="celebrate" role="alert">
          <div className="celebrate-card" onClick={() => setCur(null)}>
            <div className="big" aria-hidden="true">🏆</div>
            <h2 style={{ margin: '6px 0 4px' }}>{cur.title}</h2>
            {cur.body && <p className="muted" style={{ margin: 0 }}>{cur.body}</p>}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Global search (STEP 35) ---------------- */

interface SearchItem {
  kind: string;
  title: string;
  sub: string;
  route: string;
  hay: string;
}

const PAGES: [string, string, string][] = [
  ['Dashboard', '/', 'home overview plan'], ['Course path', '/learn', 'lessons units map'], ['Practice', '/practice', 'problems adaptive'],
  ['Daily review', '/review', 'spaced repetition memory'], ['Exams', '/exam', 'test final mock timed'], ['Teach It', '/teach', 'explain'],
  ['Boss battles', '/boss', 'challenge'], ['Simulation lab', '/lab', 'simulations widgets interactive'], ['Calculator', '/calculator', 'compute stats regression binomial'],
  ['Formula sheet', '/formulas', 'formulas equations'], ['Glossary', '/glossary', 'terms definitions vocabulary'], ['Concept map', '/map', 'connections graph'],
  ['Mistake bank', '/mistakes', 'errors wrong misconceptions'], ['Saved & notes', '/saved', 'bookmarks notes'], ['Progress', '/progress', 'analytics stats history'],
  ['Settings', '/settings', 'theme dark mode api key export import'], ['Placement test', '/placement', 'find my level diagnostic'],
];

function buildIndex(): SearchItem[] {
  const items: SearchItem[] = [];
  CONCEPTS.forEach((c) => items.push({ kind: 'Concept', title: c.title, sub: plain(c.short), route: `/learn/${c.id}`, hay: `${c.title} ${c.short} ${c.know.join(' ')}`.toLowerCase() }));
  FORMULAS.forEach((f) => items.push({ kind: 'Formula', title: f.name, sub: plain(f.meaning).slice(0, 90), route: `/formulas?f=${f.id}`, hay: `${f.name} ${plain(f.meaning)} formula`.toLowerCase() }));
  GLOSSARY.forEach((g) => items.push({ kind: 'Term', title: g.term, sub: plain(g.definition).slice(0, 90), route: `/glossary?t=${g.id}`, hay: `${g.term} ${(g.aliases ?? []).join(' ')} ${plain(g.definition)}`.toLowerCase() }));
  MISCONCEPTIONS.forEach((m) => items.push({ kind: 'Mistake', title: m.title, sub: m.short, route: `/mistakes?m=${m.id}`, hay: `${m.title} ${m.short}`.toLowerCase() }));
  BOSSES.forEach((b) => items.push({ kind: 'Boss', title: b.title, sub: b.tagline, route: `/boss/${b.id}`, hay: `${b.title} ${b.tagline} boss`.toLowerCase() }));
  Object.entries(WIDGETS).forEach(([id, w]) => items.push({ kind: 'Simulation', title: w.title, sub: 'Interactive simulation', route: `/lab?w=${id}`, hay: `${w.title} simulation`.toLowerCase() }));
  PAGES.forEach(([t, r, k]) => items.push({ kind: 'Page', title: t, sub: '', route: r, hay: `${t} ${k}`.toLowerCase() }));
  return items;
}

function score(item: SearchItem, q: string) {
  const t = item.title.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.every((w) => item.hay.includes(w))) return 30 + (item.kind === 'Concept' ? 5 : 0);
  return 0;
}

export function SearchPalette() {
  const ui = useUi();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const index = useMemo(buildIndex, []);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setUi({ searchOpen: true });
      }
    };
    window.addEventListener('keydown', onKey);
    const off = onAppEvent((e) => e.kind === 'search-open' && setUi({ searchOpen: true }));
    return () => { window.removeEventListener('keydown', onKey); off(); };
  }, []);
  useEffect(() => {
    if (ui.searchOpen) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 10); }
  }, [ui.searchOpen]);
  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return index.filter((i) => i.kind === 'Page').slice(0, 10);
    return index.map((i) => ({ i, s: score(i, qq) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 24).map((x) => x.i);
  }, [q, index]);
  if (!ui.searchOpen) return null;
  const close = () => setUi({ searchOpen: false });
  const go = (r: SearchItem) => { close(); navigate(r.route); };
  return (
    <div className="modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal palette" role="dialog" aria-modal="true" aria-label="Search">
        <div className="palette-input">
          <Icon name="search" />
          <input ref={inputRef} value={q} placeholder="Search concepts, formulas, terms, simulations…" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="search-results"
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close();
              else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              else if (e.key === 'Enter' && results[active]) go(results[active]);
            }} />
          <span className="kbd">Esc</span>
        </div>
        <div className="palette-results" id="search-results" role="listbox">
          {!results.length && <div className="empty small">No matches for “{q}”. Try a term like “median”, “residual”, or “binomial”.</div>}
          {results.map((r, i) => (
            <div key={r.kind + r.route + r.title} role="option" aria-selected={i === active} className={`palette-item ${i === active ? 'active' : ''}`} onMouseEnter={() => setActive(i)} onClick={() => go(r)}>
              <div style={{ minWidth: 0 }}>
                <div className="bold small">{r.title}</div>
                {r.sub && <div className="tiny muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sub}</div>}
              </div>
              <span className="pi-kind">{r.kind}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
