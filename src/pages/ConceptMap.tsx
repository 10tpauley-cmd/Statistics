import { useState } from 'react';
import type { ConceptId } from '../engine/types';
import { useLearner } from '../state/store';
import { navigate } from '../lib/router';
import { CONCEPTS, CONCEPT_BY_ID } from '../content/concepts';
import { UNITS } from '../content/units';
import { useMasteryMap } from '../components/hooks';
import { masteryColor, Seg } from '../components/ui';

const NODE_W = 172;
const NODE_H = 44;
const COL_W = 200;
const ROW_H = 60;

export function ConceptMapPage() {
  const s = useLearner();
  const mm = useMasteryMap(s);
  const [hover, setHover] = useState<ConceptId | null>(null);
  const [edges, setEdges] = useState<'prereq' | 'all'>('prereq');
  const pos = {} as Record<ConceptId, { x: number; y: number }>;
  UNITS.forEach((u, col) => {
    CONCEPTS.filter((c) => c.unit === u.id).forEach((c, row) => {
      pos[c.id] = { x: 16 + col * COL_W, y: 48 + row * ROW_H };
    });
  });
  const rows = Math.max(...UNITS.map((u) => CONCEPTS.filter((c) => c.unit === u.id).length));
  const W = 16 + UNITS.length * COL_W;
  const H = 48 + rows * ROW_H + 10;
  const links: { from: ConceptId; to: ConceptId; kind: 'prereq' | 'related' }[] = [];
  CONCEPTS.forEach((c) => {
    c.prereqs.forEach((p) => links.push({ from: p, to: c.id, kind: 'prereq' }));
    if (edges === 'all') c.related.forEach((r) => { if (r > c.id && !c.prereqs.includes(r) && !CONCEPT_BY_ID[r].prereqs.includes(c.id)) links.push({ from: c.id, to: r, kind: 'related' }); });
  });
  const connected = (id: ConceptId) => !hover || id === hover || links.some((l) => (l.from === hover && l.to === id) || (l.to === hover && l.from === id));
  const path = (a: ConceptId, b: ConceptId) => {
    const p = pos[a], q = pos[b];
    if (Math.abs(p.x - q.x) < 1) {
      const x = p.x;
      return `M${x} ${p.y + NODE_H / 2} C ${x - 34} ${p.y + NODE_H / 2}, ${x - 34} ${q.y + NODE_H / 2}, ${x} ${q.y + NODE_H / 2}`;
    }
    const [l, r] = p.x < q.x ? [p, q] : [q, p];
    const x1 = l.x + NODE_W, y1 = l.y + NODE_H / 2, x2 = r.x, y2 = r.y + NODE_H / 2;
    const mx = (x1 + x2) / 2;
    return `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  };
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Concept map</h1>
          <p>How every idea in the course connects. Arrows point from a prerequisite to what it unlocks. Hover a concept to trace its connections; click to open it.</p>
        </div>
        <Seg options={[{ id: 'prereq', label: 'Prerequisites' }, { id: 'all', label: '+ Related' }]} value={edges} onChange={setEdges} label="Connections shown" />
      </div>
      <div className="card pad-sm" style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 900, height: 'auto', display: 'block' }} role="img" aria-label="Concept connection map">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10z" fill="var(--chart-axis)" />
            </marker>
          </defs>
          {UNITS.map((u, col) => (
            <text key={u.id} x={16 + col * COL_W} y={26} style={{ fill: `var(--${u.color})`, fontWeight: 800, fontSize: 13 }}>Unit {u.number} · {u.title}</text>
          ))}
          {links.map((l, i) => {
            const on = hover && (l.from === hover || l.to === hover);
            return (
              <path key={i} d={path(l.from, l.to)} fill="none" stroke={on ? 'var(--primary)' : 'var(--chart-axis)'} strokeWidth={on ? 2.2 : 1.2}
                strokeDasharray={l.kind === 'related' ? '4 4' : undefined} opacity={hover && !on ? 0.12 : l.kind === 'related' ? 0.5 : 0.7}
                markerEnd={l.kind === 'prereq' ? 'url(#arrow)' : undefined} />
            );
          })}
          {CONCEPTS.map((c) => {
            const p = pos[c.id];
            const info = mm[c.id];
            const col = masteryColor(info.overall, info.mastered);
            return (
              <g key={c.id} className="map-node" transform={`translate(${p.x} ${p.y})`} opacity={connected(c.id) ? 1 : 0.25}
                onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(c.id)} onBlur={() => setHover(null)}
                onClick={() => navigate(`/learn/${c.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/learn/${c.id}`)} tabIndex={0} role="link" aria-label={`${c.title}, ${Math.round(info.overall * 100)} percent mastery`}>
                <rect width={NODE_W} height={NODE_H} rx={10} fill="var(--surface)" stroke={hover === c.id ? 'var(--primary)' : 'var(--border-strong)'} strokeWidth={1.5} />
                <rect x={0} y={0} width={6} height={NODE_H} rx={3} fill={`var(--${UNITS.find((u) => u.id === c.unit)!.color})`} />
                <text x={14} y={19} style={{ fill: 'var(--text)', fontSize: 12, fontWeight: 650 }}>{c.title.length > 22 ? `${c.title.slice(0, 21)}…` : c.title}</text>
                <rect x={14} y={28} width={NODE_W - 50} height={5} rx={2.5} fill="var(--surface-3)" />
                <rect x={14} y={28} width={Math.max(0, (NODE_W - 50) * info.overall)} height={5} rx={2.5} fill={col} />
                <text x={NODE_W - 10} y={34} textAnchor="end" style={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 700 }}>{info.mastered ? '★' : `${Math.round(info.overall * 100)}%`}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <details className="card mt">
        <summary className="bold" style={{ cursor: 'pointer' }}>Text view of all connections</summary>
        <div className="table-scroll mt-sm">
          <table className="data-table">
            <thead><tr><th className="rh">Concept</th><th style={{ textAlign: 'left' }}>Builds on</th><th style={{ textAlign: 'left' }}>Often confused with</th></tr></thead>
            <tbody>
              {CONCEPTS.map((c) => (
                <tr key={c.id}>
                  <td className="rh"><a href={`#/learn/${c.id}`}>{c.title}</a></td>
                  <td style={{ textAlign: 'left' }} className="small">{c.prereqs.map((p) => CONCEPT_BY_ID[p].title).join(', ') || '—'}</td>
                  <td style={{ textAlign: 'left' }} className="small">{c.confusedWith.map((x) => CONCEPT_BY_ID[x.id].title).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
