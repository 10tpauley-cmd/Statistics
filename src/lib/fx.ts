/**
 * Effects layer ("juice"): click ripples, particle bursts, floating XP, combo streaks, star pops,
 * screen flashes, and haptics. Pure DOM on a fixed overlay — no React re-renders, cheap to run.
 * Intensity follows Settings → Effects (full / subtle / off) and respects reduced motion.
 */
import { getState } from '../state/store';
import { playSound, type SoundName } from './sound';

type Level = 'full' | 'subtle' | 'off';

const PALETTE = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7'];
const GOLD = ['#fbbf24', '#f59e0b', '#fde68a', '#fcd34d'];

function level(): Level {
  if (typeof window === 'undefined') return 'off';
  const s = getState().settings;
  if (s.effects === 'off') return 'off';
  const reduced = s.reducedMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return reduced ? 'subtle' : s.effects ?? 'full';
}

let root: HTMLDivElement | null = null;
function layer() {
  if (root && document.body.contains(root)) return root;
  root = document.createElement('div');
  root.className = 'fx-layer';
  root.setAttribute('aria-hidden', 'true');
  document.body.appendChild(root);
  return root;
}

function spawn(el: HTMLElement, life: number) {
  layer().appendChild(el);
  window.setTimeout(() => el.remove(), life);
  return el;
}

function at(target?: Element | DOMRect | { x: number; y: number } | null): { x: number; y: number } {
  if (!target) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  if ('getBoundingClientRect' in target) {
    const r = target.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  if ('width' in target) return { x: target.left + target.width / 2, y: target.top + target.height / 2 };
  return target;
}

export function sound(name: SoundName) {
  playSound(name, getState().settings.sound);
}

export function haptic(pattern: number | number[] = 10) {
  if (!getState().settings.haptics || level() === 'off') return;
  try { navigator.vibrate?.(pattern); } catch { /* unsupported */ }
}

/** Expanding ring where you pressed. */
export function ripple(x: number, y: number, color = 'var(--primary)') {
  if (level() !== 'full') return;
  const el = document.createElement('i');
  el.className = 'fx-ripple';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.borderColor = color;
  spawn(el, 520);
}

/** Particle burst — dots, or emoji/glyphs when given. */
export function burst(target: Element | DOMRect | { x: number; y: number } | null, opts: { count?: number; colors?: string[]; glyphs?: string[]; spread?: number; size?: number; gravity?: boolean } = {}) {
  const lv = level();
  if (lv === 'off') return;
  const { x, y } = at(target);
  const count = Math.round((opts.count ?? 14) * (lv === 'subtle' ? 0.35 : 1));
  const spread = opts.spread ?? 90;
  const colors = opts.colors ?? PALETTE;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i');
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const dist = spread * (0.55 + Math.random() * 0.6);
    const glyph = opts.glyphs?.[i % opts.glyphs.length];
    el.className = glyph ? 'fx-glyph' : 'fx-dot';
    if (glyph) el.textContent = glyph;
    else el.style.background = colors[i % colors.length];
    const size = (opts.size ?? 8) * (0.7 + Math.random() * 0.6);
    el.style.setProperty('--s', `${size}px`);
    el.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    el.style.setProperty('--dy', `${Math.sin(ang) * dist + (opts.gravity === false ? 0 : 26)}px`);
    el.style.setProperty('--r', `${(Math.random() - 0.5) * 540}deg`);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.animationDelay = `${Math.random() * 60}ms`;
    spawn(el, 950);
  }
}

/** Floating text (e.g. "+12 XP") rising from a point. */
export function float(target: Element | DOMRect | { x: number; y: number } | null, text: string, tone: 'xp' | 'good' | 'bad' | 'gold' | 'damage' = 'xp') {
  if (level() === 'off') return;
  const { x, y } = at(target);
  const el = document.createElement('span');
  el.className = `fx-float ${tone}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  spawn(el, 1300);
}

/** Soft full-screen glow (green for correct, gold for perfect, red for a miss). */
export function flash(kind: 'good' | 'gold' | 'bad' | 'boss') {
  if (level() !== 'full') return;
  const el = document.createElement('i');
  el.className = `fx-flash ${kind}`;
  spawn(el, 650);
}

export function shake(el: Element | null, strong = false) {
  if (!el || level() === 'off') return;
  const cls = strong ? 'fx-shake-strong' : 'fx-shake';
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  window.setTimeout(() => el.classList.remove(cls), 600);
}

export function pulse(el: Element | null) {
  if (!el || level() === 'off') return;
  el.classList.remove('fx-pulse');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('fx-pulse');
  window.setTimeout(() => el.classList.remove('fx-pulse'), 700);
}

/* ---------------- Combo streak ---------------- */

let combo = 0;
let comboEl: HTMLDivElement | null = null;
let comboTimer: number | undefined;

const COMBO_WORDS: Record<number, string> = { 3: 'On fire!', 5: 'Unstoppable!', 8: 'Statistical!', 10: 'Legendary!', 15: 'Mythic!', 20: 'Godlike!' };

function showCombo(n: number) {
  if (level() === 'off') return;
  if (!comboEl || !document.body.contains(comboEl)) {
    comboEl = document.createElement('div');
    comboEl.className = 'fx-combo';
    layer().appendChild(comboEl);
  }
  const word = COMBO_WORDS[n] ?? (n >= 20 && n % 5 === 0 ? 'Godlike!' : '');
  comboEl.innerHTML = `<b>🔥 ${n}×</b><span>${word || 'streak'}</span>`;
  comboEl.classList.remove('show', 'big');
  void comboEl.offsetWidth;
  comboEl.classList.add('show');
  if (word) comboEl.classList.add('big');
  window.clearTimeout(comboTimer);
  comboTimer = window.setTimeout(() => comboEl?.classList.remove('show', 'big'), word ? 1800 : 1200);
}

export function comboCount() {
  return combo;
}

/* ---------------- High-level moments ---------------- */

/** A correct answer: burst from the anchor, XP float, combo bump, gentle glow. */
export function correct(anchor: Element | null, opts: { xp?: number; perfect?: boolean } = {}) {
  combo += 1;
  const p = at(anchor);
  burst(p, opts.perfect ? { count: 26, colors: GOLD, spread: 130, size: 9 } : { count: 14 });
  if (opts.perfect) burst(p, { count: 6, glyphs: ['★', '✦', '✧'], spread: 110, size: 18 });
  if (opts.xp) float({ x: p.x, y: p.y - 18 }, `+${opts.xp} XP`, opts.perfect ? 'gold' : 'xp');
  flash(opts.perfect ? 'gold' : 'good');
  haptic(opts.perfect ? [12, 40, 18] : 12);
  if (combo >= 2) {
    showCombo(combo);
    if (COMBO_WORDS[combo]) {
      sound('combo');
      burst({ x: window.innerWidth / 2, y: 90 }, { count: 22, glyphs: ['🔥', '✨'], spread: 140, size: 18 });
    }
  }
}

/** A miss: combo resets, small red pulse — informative, not punishing. */
export function wrong(anchor: Element | null) {
  const lost = combo;
  combo = 0;
  flash('bad');
  if (anchor) shake(anchor);
  haptic([20, 30, 20]);
  if (lost >= 3) float({ x: window.innerWidth / 2, y: 110 }, `Streak of ${lost} ended — keep going`, 'bad');
}

/** Stars popping in one after another (level complete). */
export function stars(els: Element[], earned: number) {
  els.slice(0, earned).forEach((el, i) => {
    window.setTimeout(() => {
      el.classList.add('fx-star-on');
      burst(el, { count: 10, colors: GOLD, spread: 60, size: 7 });
      sound('star');
      haptic(10);
    }, 350 + i * 380);
  });
}

/** Big moment: confetti rain from the top plus a centered burst. */
export function celebrate(kind: 'level' | 'boss' | 'unit' | 'final' = 'level') {
  const lv = level();
  if (lv === 'off') return;
  const n = { level: 40, boss: 80, unit: 110, final: 160 }[kind] * (lv === 'subtle' ? 0.25 : 1);
  for (let i = 0; i < n; i++) {
    const el = document.createElement('i');
    el.className = 'fx-confetti';
    el.style.left = `${Math.random() * 100}vw`;
    el.style.background = [...PALETTE, ...GOLD][i % 10];
    el.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
    el.style.animationDelay = `${Math.random() * 0.4}s`;
    el.style.setProperty('--r', `${Math.random() * 720}deg`);
    el.style.setProperty('--x', `${(Math.random() - 0.5) * 160}px`);
    spawn(el, 3400);
  }
  burst(null, { count: 30, spread: 220, size: 10 });
  haptic([15, 50, 25, 50, 40]);
}

/* ---------------- Global click feedback ---------------- */

const CLICKABLE = 'button, a[href], [role="button"], [role="radio"], [role="tab"], [role="link"], .option, .toggle, summary, input[type="checkbox"], input[type="range"]';

/** Installs the press ripple + soft tick for every interactive element. Returns an uninstaller. */
export function installClickFx() {
  const onDown = (e: PointerEvent) => {
    const t = (e.target as Element | null)?.closest?.(CLICKABLE) as HTMLElement | null;
    if (!t || (t as HTMLButtonElement).disabled || t.getAttribute('aria-disabled') === 'true') return;
    if (level() === 'off') return;
    const isChoice = t.matches('.option, [role="radio"], [role="tab"], .toggle, input[type="checkbox"]');
    ripple(e.clientX, e.clientY, isChoice ? 'var(--primary)' : 'color-mix(in srgb, var(--primary) 70%, white)');
    if (t.closest('.fx-quiet')) return;
    sound(isChoice ? 'select' : 'click');
    if (e.pointerType === 'touch') haptic(6);
  };
  document.addEventListener('pointerdown', onDown, { passive: true });
  return () => document.removeEventListener('pointerdown', onDown);
}
