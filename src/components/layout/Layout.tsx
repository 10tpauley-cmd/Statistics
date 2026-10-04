import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, href } from '../../lib/router';
import { useLearner } from '../../state/store';
import { useUi, setUi, toggleFocus } from '../../state/ui';
import { updateSettings } from '../../state/actions';
import { dueReviews, openMistakes } from '../../engine/planner';
import { levelFromXp, xpForLevel, liveStreak } from '../../engine/learner';
import { Icon } from '../ui/Icon';

const NAV: { label: string; items: { to: string; label: string; icon: string; count?: 'review' | 'mistakes' }[] }[] = [
  {
    label: 'Learn',
    items: [
      { to: '/', label: 'Dashboard', icon: 'home' },
      { to: '/learn', label: 'Course path', icon: 'book' },
      { to: '/practice', label: 'Practice', icon: 'target' },
      { to: '/review', label: 'Daily review', icon: 'repeat', count: 'review' },
      { to: '/exam', label: 'Exams', icon: 'clipboard' },
    ],
  },
  {
    label: 'Challenge',
    items: [
      { to: '/teach', label: 'Teach It', icon: 'chat' },
      { to: '/boss', label: 'Boss battles', icon: 'swords' },
      { to: '/lab', label: 'Simulation lab', icon: 'flask' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/calculator', label: 'Calculator', icon: 'calc' },
      { to: '/formulas', label: 'Formula sheet', icon: 'sigma' },
      { to: '/glossary', label: 'Glossary', icon: 'list' },
      { to: '/map', label: 'Concept map', icon: 'map' },
    ],
  },
  {
    label: 'You',
    items: [
      { to: '/mistakes', label: 'Mistake bank', icon: 'alert', count: 'mistakes' },
      { to: '/saved', label: 'Saved & notes', icon: 'bookmark' },
      { to: '/progress', label: 'Progress', icon: 'chart' },
      { to: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

const isActive = (path: string, to: string) => (to === '/' ? path === '/' : path === to || path.startsWith(`${to}/`));

function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
        <path d="M3 19c3 0 4-12 9-12s6 12 9 12" />
        <path d="M12 7v12" strokeDasharray="2 2.5" />
      </svg>
    </span>
  );
}

function Sidebar() {
  const { path } = useLocation();
  const s = useLearner();
  const ui = useUi();
  const counts = { review: dueReviews(s).length, mistakes: openMistakes(s).length };
  return (
    <>
      {ui.sidebarOpen && <div className="scrim" onClick={() => setUi({ sidebarOpen: false })} />}
      <aside className={`sidebar ${ui.sidebarOpen ? 'open' : ''}`} aria-label="Main navigation">
        <a className="brand" href={href('/')} onClick={() => setUi({ sidebarOpen: false })}>
          <BrandMark />
          <span>Stat Lab<small>FCC MA120 Statistics</small></span>
        </a>
        <nav>
          {NAV.map((g) => (
            <div className="nav-group" key={g.label}>
              <div className="nav-label">{g.label}</div>
              {g.items.map((it) => {
                const n = it.count ? counts[it.count] : 0;
                return (
                  <a key={it.to} href={href(it.to)} className={`nav-item ${isActive(path, it.to) ? 'active' : ''}`} aria-current={isActive(path, it.to) ? 'page' : undefined} onClick={() => setUi({ sidebarOpen: false })}>
                    <Icon name={it.icon} size={18} />
                    {it.label}
                    {n > 0 && <span className="count">{n}</span>}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="spacer" />
        <div className="tiny faint" style={{ padding: '8px 10px' }}>All progress is saved on this device.</div>
      </aside>
    </>
  );
}

function FocusTimer() {
  const ui = useUi();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const total = ui.focusMinutes * 60000;
  const left = Math.max(0, total - (now - ui.focusStart));
  const m = Math.floor(left / 60000), sec = Math.floor((left % 60000) / 1000);
  return (
    <div className="focus-bar">
      <span className="chip primary"><Icon name="focus" size={13} /> Focus mode</span>
      <span className="timer" aria-live="off" title="Focus session time left">{left === 0 ? 'Time for a break ☕' : `${m}:${String(sec).padStart(2, '0')}`}</span>
    </div>
  );
}

function Topbar() {
  const s = useLearner();
  const ui = useUi();
  const level = levelFromXp(s.xp);
  const into = s.xp - xpForLevel(level);
  const need = xpForLevel(level + 1) - xpForLevel(level);
  const streak = liveStreak(s);
  const dark = s.settings.theme === 'dark' || (s.settings.theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  return (
    <header className="topbar">
      {!ui.focus && <button className="btn ghost icon menu-btn" aria-label="Open menu" onClick={() => setUi({ sidebarOpen: true })}><Icon name="menu" /></button>}
      {ui.focus ? <FocusTimer /> : (
        <button className="search-trigger" onClick={() => setUi({ searchOpen: true })} aria-label="Search everything">
          <Icon name="search" size={16} />
          <span className="search-label">Search concepts, formulas, terms…</span>
          <span className="kbd hide-sm">Ctrl K</span>
        </button>
      )}
      <div className="topbar-stats">
        <button className={`btn sm ${ui.focus ? 'primary' : 'ghost'}`} onClick={() => toggleFocus()} title="Focus mode hides everything except the current task" aria-pressed={ui.focus}>
          <Icon name="focus" size={16} /> <span className="hide-sm">{ui.focus ? 'Exit focus' : 'Focus'}</span>
        </button>
        <button className="btn ghost sm icon hide-focus" aria-label="Toggle dark mode" title="Toggle dark mode" onClick={() => updateSettings({ theme: dark ? 'light' : 'dark' })}>
          <Icon name={dark ? 'sun' : 'moon'} size={16} />
        </button>
        <a className="stat-pill hide-focus" href={href('/progress')} title={`${streak} day streak (best ${s.streak.best})`} style={{ color: 'var(--text)' }}>
          <span aria-hidden="true">🔥</span> {streak}<span className="sr-only"> day streak</span>
        </a>
        <a className="stat-pill hide-focus hide-sm" href={href('/progress')} title={`${into} / ${need} XP to level ${level + 1}`} style={{ color: 'var(--text)' }}>
          <Icon name="zap" size={14} /> Lv {level}
          <span className="bar" style={{ width: 54, height: 6 }}><span style={{ width: `${(into / need) * 100}%` }} /></span>
        </a>
      </div>
    </header>
  );
}

function MobileNav() {
  const { path } = useLocation();
  const s = useLearner();
  const due = dueReviews(s).length;
  const items = [
    { to: '/', label: 'Home', icon: 'home' },
    { to: '/learn', label: 'Learn', icon: 'book' },
    { to: '/practice', label: 'Practice', icon: 'target' },
    { to: '/review', label: due ? `Review (${due})` : 'Review', icon: 'repeat' },
  ];
  return (
    <nav className="mobile-nav" aria-label="Quick navigation">
      {items.map((it) => (
        <a key={it.to} href={href(it.to)} className={isActive(path, it.to) ? 'active' : ''}>
          <Icon name={it.icon} size={20} />
          {it.label}
        </a>
      ))}
      <a href="#" onClick={(e) => { e.preventDefault(); setUi({ sidebarOpen: true }); }}>
        <Icon name="menu" size={20} />
        More
      </a>
    </nav>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const ui = useUi();
  return (
    <div className={`app ${ui.focus ? 'focus' : ''}`}>
      <a href="#main" className="sr-only" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <Sidebar />
      <div className="main">
        <Topbar />
        <main id="main" tabIndex={-1} style={{ outline: 'none' }}>{children}</main>
      </div>
      {!ui.focus && <MobileNav />}
    </div>
  );
}

export { BrandMark };
