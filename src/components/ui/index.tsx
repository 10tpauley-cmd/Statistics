import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { Source } from '../../engine/types';
import { Icon } from './Icon';
import { href } from '../../lib/router';

export function masteryColor(v: number, mastered = false) {
  if (mastered) return 'var(--m-gold)';
  if (v >= 0.75) return 'var(--m-high)';
  if (v >= 0.5) return 'var(--m-mid)';
  if (v > 0) return 'var(--m-low)';
  return 'var(--faint)';
}

export function Ring({ value, size = 56, stroke = 6, label, color, mastered = false, ariaLabel }: { value: number; size?: number; stroke?: number; label?: ReactNode; color?: string; mastered?: boolean; ariaLabel?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const col = color ?? masteryColor(v, mastered);
  return (
    <span className="ring-wrap" style={{ width: size, height: size }} role="img" aria-label={ariaLabel ?? `${Math.round(v * 100)} percent`}>
      <svg width={size} height={size}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle className="ring-value" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="ring-label" style={{ fontSize: Math.max(10, size * 0.24) }}>{label ?? (mastered ? '★' : `${Math.round(v * 100)}`)}</span>
    </span>
  );
}

export function Bar({ value, color, className = '', label }: { value: number; color?: string; className?: string; label?: string }) {
  return (
    <div className={`bar ${className}`} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  );
}

export function SourceTag({ source }: { source?: Source }) {
  if (!source) return null;
  const pages = [...new Set(source.pages)].sort((a, b) => a - b);
  const contiguous = pages.every((p, i) => i === 0 || p === pages[i - 1] + 1);
  const pageText = pages.length === 1 ? `p. ${pages[0]}`
    : contiguous && pages.length > 2 ? `pp. ${pages[0]}–${pages[pages.length - 1]}`
    : pages.length > 5 ? `pp. ${pages.slice(0, 4).join(', ')} +${pages.length - 4} more`
    : `pp. ${pages.join(', ')}`;
  return (
    <span className="source-tag" title={source.note ?? 'Traceable to your FCC MA120 course PDF'}>
      <Icon name="book" size={12} /> Course Source: PDF {pageText} — {source.section}
      {source.note && <span style={{ color: 'var(--warn)' }}> · note</span>}
    </span>
  );
}

export function SupportingTag() {
  return <span className="supporting-tag" title="Added to help explain a course idea; not printed in the PDF">Supporting explanation</span>;
}

export function Empty({ icon = '🌱', title, children, action }: { icon?: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="e-icon">{icon}</div>
      <h3>{title}</h3>
      {children && <div className="small" style={{ maxWidth: 420, margin: '0 auto 12px' }}>{children}</div>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    setTimeout(() => ref.current?.querySelector<HTMLElement>('button, input, textarea, select, a')?.focus(), 10);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <div className="modal-head">
          <h3 style={{ margin: 0 }} id={titleId}>{title}</h3>
          <button className="btn ghost icon sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={`tab ${value === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Seg<T extends string | number>({ options, value, onChange, label }: { options: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.id)} role="radio" aria-checked={value === o.id} className={value === o.id ? 'active' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="toggle" aria-label={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span />
    </label>
  );
}

export function LinkBtn({ to, children, className = 'btn', ...rest }: { to: string; children: ReactNode; className?: string; title?: string }) {
  return (
    <a className={className} href={href(to)} {...rest}>
      {children}
    </a>
  );
}

export function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div className="slider-field">
      <label>
        <span>{label}</span>
        <span className="mono">{format ? format(value) : value}</span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
    </div>
  );
}

export function Metric({ k, v, color }: { k: string; v: ReactNode; color?: string }) {
  return (
    <div className="metric">
      <div className="k">{k}</div>
      <div className="v" style={{ color }}>{v}</div>
    </div>
  );
}

export function fmtDuration(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} m`;
}

export function timeAgo(t: number, now = Date.now()) {
  const s = Math.max(0, (now - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

export function dueIn(t: number, now = Date.now()) {
  const d = (t - now) / 86400000;
  if (d <= 0) return 'due now';
  if (d < 1) return 'due today';
  if (d < 2) return 'tomorrow';
  return `in ${Math.round(d)} days`;
}
