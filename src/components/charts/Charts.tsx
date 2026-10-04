import { useMemo, useState, type ReactNode } from 'react';
import type { BoxGroup, TreeNode, VisualSpec } from '../../engine/types';
import { C, SERIES, linear, ticks, niceDomain, tickFmt, useWidth, useTip, XAxis, YAxis, ChartFrame, barPath } from './core';
import { fmt } from '../../lib/stats/format';

const M = { top: 16, right: 18, bottom: 48, left: 52 };

export interface Marker {
  value: number;
  label: string;
  color?: string;
  dash?: boolean;
}

function Markers({ markers, x, top, bottom }: { markers?: Marker[]; x: (v: number) => number; top: number; bottom: number }) {
  if (!markers?.length) return null;
  return (
    <g>
      {markers.map((m, i) => (
        <g key={m.label + i}>
          <line x1={x(m.value)} x2={x(m.value)} y1={top} y2={bottom} stroke={m.color ?? C.s2} strokeWidth={2} strokeDasharray={m.dash ? '5 4' : undefined} />
          <text x={x(m.value)} y={top - 4 + (i % 2) * 12} textAnchor="middle" style={{ fill: 'var(--text-2)', fontWeight: 700 }}>{m.label}</text>
        </g>
      ))}
    </g>
  );
}

/* ---------------- Histogram ---------------- */

export function Histogram({ bins, xLabel, yLabel, relative, markers, height = 240, highlight, title }: { bins: { lo: number; hi: number; count: number }[]; xLabel?: string; yLabel?: string; relative?: boolean; markers?: Marker[]; height?: number; highlight?: (i: number) => boolean; title?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { show, hide, el } = useTip();
  const top = M.top + (markers?.length ? 22 : 0);
  if (!bins.length) return <div className="muted small">No data.</div>;
  const lo = bins[0].lo;
  const hi = bins[bins.length - 1].hi;
  const maxC = Math.max(...bins.map((b) => b.count), relative ? 0.01 : 1);
  const x = linear([lo, hi], [M.left, w - M.right]);
  const yt = ticks(0, maxC, 5);
  const y = linear([0, Math.max(maxC, yt[yt.length - 1])], [height - M.bottom, top]);
  const binTicks = bins.length <= 16 ? [lo, ...bins.map((b) => b.hi)] : ticks(lo, hi, 8);
  return (
    <ChartFrame frameRef={ref} w={w} height={height} title={title ?? `Histogram${xLabel ? ` of ${xLabel}` : ''}`} tipEl={el}>
      <YAxis y={y} x={M.left} ticksAt={yt} label={yLabel ?? (relative ? 'Relative frequency' : 'Frequency')} gridTo={w - M.right} format={relative ? (v) => fmt(v, 2) : tickFmt} />
      {bins.map((b, i) => {
        const bx = x(b.lo);
        const bw = Math.max(1, x(b.hi) - x(b.lo));
        const by = y(b.count);
        const hl = highlight ? highlight(i) : true;
        const label = `${fmt(b.lo)}–${fmt(b.hi)}`;
        const value = relative ? fmt(b.count, 3) : String(b.count);
        return (
          <g key={i} tabIndex={0} onPointerEnter={() => show({ x: bx + bw / 2, y: by, value, label })} onPointerLeave={hide} onFocus={() => show({ x: bx + bw / 2, y: by, value, label })} onBlur={hide} aria-label={`${label}: ${value}`}>
            <rect x={bx} y={top} width={bw} height={height - M.bottom - top} fill="transparent" />
            <path d={barPath(bx, by, bw, height - M.bottom - by, 3)} fill={C.s1} opacity={hl ? 1 : 0.28} stroke={C.surface} strokeWidth={1} />
          </g>
        );
      })}
      <XAxis x={x} y={height - M.bottom} ticksAt={binTicks} label={xLabel} width={w} />
      <Markers markers={markers} x={x} top={top} bottom={height - M.bottom} />
    </ChartFrame>
  );
}

/* ---------------- Dot plot ---------------- */

export function DotPlot({ data, xLabel, highlight, markers, height, domain, onDotClick, selected, title }: { data: number[]; xLabel?: string; highlight?: number[]; markers?: Marker[]; height?: number; domain?: [number, number]; onDotClick?: (i: number) => void; selected?: number; title?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { show, hide, el } = useTip();
  const sorted = data.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const [d0, d1] = domain ?? niceDomain(Math.min(...data), Math.max(...data), 0.04);
  const x = linear([d0, d1], [M.left - 20, w - M.right]);
  const r = Math.max(3.5, Math.min(7, (w - 80) / Math.max(30, data.length) / 1.2));
  const stacks = new Map<string, number>();
  const pos = sorted.map(({ v, i }) => {
    const px = x(v);
    const key = String(Math.round(px / (r * 2)));
    const level = stacks.get(key) ?? 0;
    stacks.set(key, level + 1);
    return { v, i, px: Math.round(px / (r * 2)) * r * 2, level };
  });
  const maxLevel = Math.max(1, ...pos.map((p) => p.level + 1));
  const top = (markers?.length ? 28 : 10);
  const h = height ?? Math.max(110, top + maxLevel * r * 2.2 + 50);
  const base = h - 40;
  return (
    <ChartFrame frameRef={ref} w={w} height={h} title={title ?? `Dot plot${xLabel ? ` of ${xLabel}` : ''}`} tipEl={el}>
      {pos.map((p) => {
        const isHl = highlight?.includes(p.i) || selected === p.i;
        const cy = base - r - p.level * r * 2.1;
        return (
          <circle key={p.i} cx={p.px} cy={cy} r={r} fill={isHl ? C.s2 : C.s1} stroke={C.surface} strokeWidth={1.5}
            style={{ cursor: onDotClick ? 'pointer' : undefined }}
            onClick={() => onDotClick?.(p.i)}
            onPointerEnter={() => show({ x: p.px, y: cy - r, value: fmt(p.v, 3) })} onPointerLeave={hide} />
        );
      })}
      <XAxis x={x} y={base} ticksAt={ticks(d0, d1, 8)} label={xLabel} width={w} />
      <Markers markers={markers} x={x} top={top} bottom={base} />
    </ChartFrame>
  );
}

/* ---------------- Box plot ---------------- */

export function BoxPlot({ groups, xLabel, height, domain, title }: { groups: BoxGroup[]; xLabel?: string; height?: number; domain?: [number, number]; title?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { show, hide, el } = useTip();
  const all = groups.flatMap((g) => [g.min, g.max, ...(g.outliers ?? [])]);
  const [d0, d1] = domain ?? niceDomain(Math.min(...all), Math.max(...all), 0.04);
  const labelW = Math.min(110, Math.max(...groups.map((g) => g.label.length)) * 7.5 + 12);
  const x = linear([d0, d1], [labelW + 8, w - M.right]);
  const rowH = 54;
  const h = height ?? groups.length * rowH + 56;
  return (
    <ChartFrame frameRef={ref} w={w} height={h} title={title ?? `Box plot${xLabel ? ` of ${xLabel}` : ''}`} tipEl={el}>
      {groups.map((g, i) => {
        const cy = 16 + i * rowH + rowH / 2;
        const col = SERIES[i % SERIES.length];
        const tipFor = (v: number, k: string) => () => show({ x: x(v), y: cy - 18, value: fmt(v, 3), label: `${g.label} ${k}` });
        return (
          <g key={g.label}>
            <text x={labelW} y={cy + 4} textAnchor="end" style={{ fill: 'var(--text-2)', fontWeight: 650 }}>{g.label}</text>
            <line x1={x(g.min)} x2={x(g.q1)} y1={cy} y2={cy} stroke={C.text} strokeWidth={1.5} />
            <line x1={x(g.q3)} x2={x(g.max)} y1={cy} y2={cy} stroke={C.text} strokeWidth={1.5} />
            <line x1={x(g.min)} x2={x(g.min)} y1={cy - 9} y2={cy + 9} stroke={C.text} strokeWidth={1.5} />
            <line x1={x(g.max)} x2={x(g.max)} y1={cy - 9} y2={cy + 9} stroke={C.text} strokeWidth={1.5} />
            <rect x={x(g.q1)} y={cy - 15} width={Math.max(1, x(g.q3) - x(g.q1))} height={30} rx={4} fill={col} fillOpacity={0.22} stroke={col} strokeWidth={2} />
            <line x1={x(g.median)} x2={x(g.median)} y1={cy - 15} y2={cy + 15} stroke={col} strokeWidth={3} />
            {(g.outliers ?? []).map((o, k) => <circle key={k} cx={x(o)} cy={cy} r={4.5} fill={C.surface} stroke={col} strokeWidth={2} onPointerEnter={tipFor(o, 'outlier')} onPointerLeave={hide} />)}
            {([['min', g.min], ['Q1', g.q1], ['median', g.median], ['Q3', g.q3], ['max', g.max]] as [string, number][]).map(([k, v]) => (
              <rect key={k} x={x(v) - 6} y={cy - 18} width={12} height={36} fill="transparent" tabIndex={0} aria-label={`${g.label} ${k} ${fmt(v, 3)}`} onPointerEnter={tipFor(v, k)} onFocus={tipFor(v, k)} onPointerLeave={hide} onBlur={hide} />
            ))}
          </g>
        );
      })}
      <XAxis x={x} y={h - 40} ticksAt={ticks(d0, d1, 8)} label={xLabel} width={w} />
    </ChartFrame>
  );
}

/* ---------------- Scatter ---------------- */

export interface ScatterProps {
  points: [number, number][];
  line?: { a: number; b: number; color?: string; dash?: boolean } | null;
  extraLine?: { a: number; b: number; color?: string; dash?: boolean } | null;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  highlight?: number | null;
  showResiduals?: boolean;
  squares?: boolean;
  onPointClick?: (i: number) => void;
  onPointDrag?: (i: number, x: number, y: number) => void;
  domainX?: [number, number];
  domainY?: [number, number];
  curve?: (x: number) => number;
  title?: string;
  children?: (sx: (v: number) => number, sy: (v: number) => number) => ReactNode;
}

export function Scatter(p: ScatterProps) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { show, hide, el } = useTip();
  const [drag, setDrag] = useState<number | null>(null);
  const h = p.height ?? 280;
  const xs = p.points.map((q) => q[0]);
  const ys = p.points.map((q) => q[1]);
  const [x0, x1] = p.domainX ?? niceDomain(Math.min(...xs), Math.max(...xs));
  const [y0, y1] = p.domainY ?? niceDomain(Math.min(...ys, ...(p.line ? [p.line.a + p.line.b * Math.min(...xs), p.line.a + p.line.b * Math.max(...xs)] : [])), Math.max(...ys, ...(p.line ? [p.line.a + p.line.b * Math.min(...xs), p.line.a + p.line.b * Math.max(...xs)] : [])));
  const x = linear([x0, x1], [M.left, w - M.right]);
  const y = linear([y0, y1], [h - M.bottom, M.top]);
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag === null || !p.onPointDrag) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const px = Math.max(M.left, Math.min(w - M.right, e.clientX - rect.left));
    const py = Math.max(M.top, Math.min(h - M.bottom, e.clientY - rect.top));
    p.onPointDrag(drag, x.invert(px), y.invert(py));
  };
  const lineSeg = (l: { a: number; b: number; color?: string; dash?: boolean }, key: string) => {
    const lx0 = x0, lx1 = x1;
    return <line key={key} x1={x(lx0)} y1={y(l.a + l.b * lx0)} x2={x(lx1)} y2={y(l.a + l.b * lx1)} stroke={l.color ?? C.s2} strokeWidth={2} strokeDasharray={l.dash ? '6 5' : undefined} clipPath="url(#plot-clip)" />;
  };
  const curvePath = p.curve ? Array.from({ length: 60 }, (_, i) => {
    const xv = x0 + ((x1 - x0) * i) / 59;
    return `${i ? 'L' : 'M'}${x(xv)},${y(p.curve!(xv))}`;
  }).join('') : '';
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <svg className="chart" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={p.title ?? 'Scatterplot'}
        onPointerMove={onMove} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)} style={{ touchAction: p.onPointDrag ? 'none' : undefined }}>
        <title>{p.title ?? `Scatterplot of ${p.yLabel ?? 'y'} vs ${p.xLabel ?? 'x'}`}</title>
        <defs><clipPath id="plot-clip"><rect x={M.left} y={M.top} width={w - M.left - M.right} height={h - M.top - M.bottom} /></clipPath></defs>
        <YAxis y={y} x={M.left} ticksAt={ticks(y0, y1, 6)} label={p.yLabel} gridTo={w - M.right} />
        <XAxis x={x} y={h - M.bottom} ticksAt={ticks(x0, x1, 7)} label={p.xLabel} width={w} />
        {p.squares && p.line && p.points.map(([px, py], i) => {
          const yh = p.line!.a + p.line!.b * px;
          const side = Math.abs(y(py) - y(yh));
          return <rect key={`sq${i}`} x={x(px)} y={Math.min(y(py), y(yh))} width={side} height={side} fill={C.s2} fillOpacity={0.12} stroke={C.s2} strokeOpacity={0.4} clipPath="url(#plot-clip)" />;
        })}
        {p.showResiduals && p.line && p.points.map(([px, py], i) => (
          <line key={`r${i}`} x1={x(px)} x2={x(px)} y1={y(py)} y2={y(p.line!.a + p.line!.b * px)} stroke={py >= p.line!.a + p.line!.b * px ? C.good : C.bad} strokeWidth={2} strokeDasharray="3 3" />
        ))}
        {p.line && lineSeg(p.line, 'l')}
        {p.extraLine && lineSeg(p.extraLine, 'l2')}
        {curvePath && <path d={curvePath} fill="none" stroke={C.s3} strokeWidth={2} clipPath="url(#plot-clip)" />}
        {p.children?.(x, y)}
        {p.points.map(([px, py], i) => {
          const hl = p.highlight === i;
          return (
            <g key={i}>
              <circle cx={x(px)} cy={y(py)} r={14} fill="transparent" style={{ cursor: p.onPointDrag ? 'grab' : p.onPointClick ? 'pointer' : undefined }}
                onPointerDown={(e) => { if (p.onPointDrag) { (e.target as Element).setPointerCapture?.(e.pointerId); setDrag(i); } }}
                onClick={() => p.onPointClick?.(i)}
                onPointerEnter={() => show({ x: x(px), y: y(py) - 8, value: `(${fmt(px, 2)}, ${fmt(py, 2)})` })} onPointerLeave={hide} />
              <circle cx={x(px)} cy={y(py)} r={hl ? 7 : 5} fill={hl ? C.s2 : C.s1} stroke={C.surface} strokeWidth={2} pointerEvents="none" />
            </g>
          );
        })}
      </svg>
      {el}
    </div>
  );
}

/* ---------------- Residual plot ---------------- */

export function ResidualPlot({ points, xLabel, height = 200, highlight }: { points: [number, number][]; xLabel?: string; height?: number; highlight?: number | null }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { show, hide, el } = useTip();
  const xs = points.map((q) => q[0]);
  const ys = points.map((q) => q[1]);
  const m = Math.max(0.5, ...ys.map(Math.abs)) * 1.15;
  const [x0, x1] = niceDomain(Math.min(...xs), Math.max(...xs));
  const x = linear([x0, x1], [M.left, w - M.right]);
  const y = linear([-m, m], [height - M.bottom, M.top]);
  return (
    <ChartFrame frameRef={ref} w={w} height={height} title={`Residual plot${xLabel ? ` against ${xLabel}` : ''}`} tipEl={el}>
      <YAxis y={y} x={M.left} ticksAt={ticks(-m, m, 5)} label="Residual" gridTo={w - M.right} />
      <line x1={M.left} x2={w - M.right} y1={y(0)} y2={y(0)} stroke={C.text} strokeWidth={1.5} />
      <XAxis x={x} y={height - M.bottom} ticksAt={ticks(x0, x1, 7)} label={xLabel} width={w} />
      {points.map(([px, py], i) => (
        <g key={i}>
          <circle cx={x(px)} cy={y(py)} r={12} fill="transparent" onPointerEnter={() => show({ x: x(px), y: y(py) - 8, value: fmt(py, 3), label: `x = ${fmt(px, 2)}` })} onPointerLeave={hide} />
          <circle cx={x(px)} cy={y(py)} r={highlight === i ? 7 : 5} fill={highlight === i ? C.s2 : C.s1} stroke={C.surface} strokeWidth={2} pointerEvents="none" />
        </g>
      ))}
    </ChartFrame>
  );
}

/* ---------------- Bar chart (categorical) ---------------- */

export function BarChart({ categories, yLabel, percent, height = 240, showValues = true }: { categories: { label: string; value: number }[]; yLabel?: string; percent?: boolean; height?: number; showValues?: boolean }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { show, hide, el } = useTip();
  const max = Math.max(...categories.map((c) => c.value), 1);
  const yt = ticks(0, max, 5);
  const y = linear([0, yt[yt.length - 1]], [height - M.bottom - 14, M.top]);
  const plotW = w - M.left - M.right;
  const step = plotW / categories.length;
  const bw = Math.max(4, step - 6);
  return (
    <ChartFrame frameRef={ref} w={w} height={height} title={`Bar graph${yLabel ? ` of ${yLabel}` : ''}`} tipEl={el}>
      <YAxis y={y} x={M.left} ticksAt={yt} label={yLabel} gridTo={w - M.right} format={(v) => (percent ? `${v}%` : tickFmt(v))} />
      {categories.map((c, i) => {
        const bx = M.left + i * step + 3;
        const by = y(c.value);
        const v = percent ? `${fmt(c.value, 1)}%` : fmt(c.value, 2);
        return (
          <g key={c.label} tabIndex={0} onPointerEnter={() => show({ x: bx + bw / 2, y: by, value: v, label: c.label })} onPointerLeave={hide} onFocus={() => show({ x: bx + bw / 2, y: by, value: v, label: c.label })} onBlur={hide} aria-label={`${c.label}: ${v}`}>
            <path d={barPath(bx, by, bw, y(0) - by)} fill={C.s1} />
            {showValues && <text x={bx + bw / 2} y={by - 4} textAnchor="middle" style={{ fill: 'var(--text-2)', fontSize: 10, fontWeight: 650 }}>{v}</text>}
            <text x={bx + bw / 2} y={height - M.bottom + 4} textAnchor="middle" style={{ fontSize: 10 }}>{c.label.length > 11 ? `${c.label.slice(0, 10)}…` : c.label}</text>
          </g>
        );
      })}
      <line x1={M.left} x2={w - M.right} y1={y(0)} y2={y(0)} stroke={C.axis} />
    </ChartFrame>
  );
}

/* ---------------- Probability distribution histogram ---------------- */

export function ProbDist({ x: xv, p, xLabel, highlight, height = 230, markers }: { x: number[]; p: number[]; xLabel?: string; highlight?: (x: number) => boolean; height?: number; markers?: Marker[] }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const { show, hide, el } = useTip();
  const top = M.top + (markers?.length ? 22 : 0);
  const max = Math.max(...p, 0.01);
  const yt = ticks(0, max, 5);
  const xmin = Math.min(...xv) - 0.5;
  const xmax = Math.max(...xv) + 0.5;
  const sx = linear([xmin, xmax], [M.left, w - M.right]);
  const y = linear([0, Math.max(max, yt[yt.length - 1])], [height - M.bottom, top]);
  const bw = Math.max(2, sx(1) - sx(0) - 2);
  const xt = xv.length <= 16 ? xv : ticks(Math.min(...xv), Math.max(...xv), 10);
  return (
    <ChartFrame frameRef={ref} w={w} height={height} title={`Probability distribution${xLabel ? ` of ${xLabel}` : ''}`} tipEl={el}>
      <YAxis y={y} x={M.left} ticksAt={yt} label="P(X = x)" gridTo={w - M.right} format={(v) => fmt(v, 2)} />
      {xv.map((v, i) => {
        const bx = sx(v) - bw / 2;
        const by = y(p[i]);
        const hl = highlight ? highlight(v) : false;
        return (
          <g key={v} tabIndex={0} onPointerEnter={() => show({ x: sx(v), y: by, value: fmt(p[i], 4), label: `x = ${v}` })} onPointerLeave={hide} onFocus={() => show({ x: sx(v), y: by, value: fmt(p[i], 4), label: `x = ${v}` })} onBlur={hide} aria-label={`P(X = ${v}) = ${fmt(p[i], 4)}`}>
            <rect x={bx} y={top} width={bw} height={height - M.bottom - top} fill="transparent" />
            <path d={barPath(bx, by, bw, y(0) - by, 3)} fill={hl ? C.s2 : C.s1} opacity={highlight && !hl ? 0.4 : 1} />
          </g>
        );
      })}
      <XAxis x={sx} y={height - M.bottom} ticksAt={xt} label={xLabel} width={w} format={(v) => String(v)} />
      <Markers markers={markers} x={sx} top={top} bottom={height - M.bottom} />
    </ChartFrame>
  );
}

/* ---------------- Stem-and-leaf ---------------- */

export function StemLeaf({ rows, keyText, left }: { rows: { stem: number; leaves: number[] }[]; keyText: string; left?: { stem: number; leaves: number[] }[] }) {
  return (
    <div className="chart-wrap" style={{ fontFamily: 'var(--mono)' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.95rem' }} aria-label="Stem-and-leaf plot">
        <tbody>
          {rows.map((r) => {
            const l = left?.find((x) => x.stem === r.stem);
            return (
              <tr key={r.stem}>
                {left && <td style={{ textAlign: 'right', padding: '2px 8px', letterSpacing: '0.35em' }}>{l ? l.leaves.slice().reverse().join(' ') : ''}</td>}
                <td style={{ padding: '2px 10px', borderLeft: left ? '2px solid var(--border-strong)' : undefined, borderRight: '2px solid var(--border-strong)', fontWeight: 800, textAlign: 'right' }}>{r.stem}</td>
                <td style={{ padding: '2px 10px', letterSpacing: '0.35em' }}>{r.leaves.join(' ')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="tiny muted" style={{ marginTop: 6, fontFamily: 'var(--font)' }}>Key: {keyText}</div>
    </div>
  );
}

/* ---------------- Venn ---------------- */

export function Venn({ labels, onlyA, both, onlyB, neither, highlight, onRegion }: { labels: [string, string]; onlyA: string; both: string; onlyB: string; neither: string; highlight?: ('A' | 'AB' | 'B' | 'N')[]; onRegion?: (r: 'A' | 'AB' | 'B' | 'N') => void }) {
  const hl = (r: 'A' | 'AB' | 'B' | 'N') => highlight?.includes(r);
  const W = 360, H = 210;
  return (
    <div className="chart-wrap" style={{ maxWidth: 460 }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Venn diagram: only ${labels[0]} ${onlyA}, both ${both}, only ${labels[1]} ${onlyB}, neither ${neither}`}>
        <defs>
          <clipPath id="vA"><circle cx={140} cy={105} r={72} /></clipPath>
          <clipPath id="vB"><circle cx={220} cy={105} r={72} /></clipPath>
        </defs>
        <rect x={4} y={4} width={W - 8} height={H - 8} rx={12} fill={hl('N') ? 'var(--primary-soft)' : 'transparent'} stroke="var(--border-strong)" onClick={() => onRegion?.('N')} style={{ cursor: onRegion ? 'pointer' : undefined }} />
        <circle cx={140} cy={105} r={72} fill={hl('A') ? C.s1 : 'transparent'} fillOpacity={0.25} stroke={C.s1} strokeWidth={2} onClick={() => onRegion?.('A')} style={{ cursor: onRegion ? 'pointer' : undefined }} />
        <circle cx={220} cy={105} r={72} fill={hl('B') ? C.s2 : 'transparent'} fillOpacity={0.25} stroke={C.s2} strokeWidth={2} onClick={() => onRegion?.('B')} style={{ cursor: onRegion ? 'pointer' : undefined }} />
        <g clipPath="url(#vA)"><circle cx={220} cy={105} r={72} fill={hl('AB') ? C.s3 : 'transparent'} fillOpacity={0.35} onClick={() => onRegion?.('AB')} style={{ cursor: onRegion ? 'pointer' : undefined }} /></g>
        <text x={104} y={110} textAnchor="middle" style={{ fill: 'var(--text)', fontSize: 15, fontWeight: 800 }}>{onlyA}</text>
        <text x={180} y={110} textAnchor="middle" style={{ fill: 'var(--text)', fontSize: 15, fontWeight: 800 }}>{both}</text>
        <text x={256} y={110} textAnchor="middle" style={{ fill: 'var(--text)', fontSize: 15, fontWeight: 800 }}>{onlyB}</text>
        <text x={W - 24} y={H - 18} textAnchor="end" style={{ fill: 'var(--text)', fontSize: 14, fontWeight: 800 }}>{neither}</text>
        <text x={92} y={30} textAnchor="middle" className="label" style={{ fill: C.s1 }}>{labels[0]}</text>
        <text x={268} y={30} textAnchor="middle" className="label" style={{ fill: C.s2 }}>{labels[1]}</text>
      </svg>
    </div>
  );
}

/* ---------------- Tree diagram ---------------- */

interface Laid { node: TreeNode; x: number; y: number; path: string; parent?: Laid }

export function TreeDiagram({ root, highlightPaths, onLeaf, height }: { root: TreeNode; highlightPaths?: string[]; onLeaf?: (path: string, nodes: TreeNode[]) => void; height?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const depth = (n: TreeNode): number => (n.children?.length ? 1 + Math.max(...n.children.map(depth)) : 0);
  const leaves = (n: TreeNode): number => (n.children?.length ? n.children.reduce((a, c) => a + leaves(c), 0) : 1);
  const D = depth(root);
  const L = leaves(root);
  const h = height ?? Math.max(200, 70 + D * 90);
  const laid: Laid[] = [];
  let leafIdx = 0;
  const layout = (n: TreeNode, d: number, path: string, parent?: Laid): Laid => {
    const me: Laid = { node: n, x: 0, y: 28 + (d * (h - 60)) / Math.max(1, D), path, parent };
    if (n.children?.length) {
      const kids = n.children.map((c, i) => layout(c, d + 1, `${path}/${i}`, me));
      me.x = (kids[0].x + kids[kids.length - 1].x) / 2;
    } else {
      me.x = 30 + ((leafIdx + 0.5) * (w - 60)) / L;
      leafIdx++;
    }
    laid.push(me);
    return me;
  };
  layout(root, 0, 'r');
  const isHl = (path: string) => highlightPaths?.some((p) => p === path || p.startsWith(`${path}/`));
  const chain = (l: Laid) => {
    const out: TreeNode[] = [];
    for (let c: Laid | undefined = l; c; c = c.parent) out.unshift(c.node);
    return out;
  };
  const fontSize = w < 420 ? 10 : 12;
  return (
    <div ref={ref} className="chart-wrap" style={{ position: 'relative' }}>
      <svg className="chart" width={w - 24} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Tree diagram">
        {laid.filter((l) => l.parent).map((l) => {
          const pr = l.parent!;
          const hl = isHl(l.path);
          const mx = (pr.x + l.x) / 2;
          const my = (pr.y + l.y) / 2;
          return (
            <g key={`e${l.path}`}>
              <line x1={pr.x} y1={pr.y + 12} x2={l.x} y2={l.y - 12} stroke={hl ? C.s2 : 'var(--border-strong)'} strokeWidth={hl ? 3 : 1.5} />
              {l.node.p && (
                <g>
                  <rect x={mx - 22} y={my - 10} width={44} height={18} rx={5} fill="var(--surface)" stroke="var(--border)" />
                  <text x={mx} y={my + 3} textAnchor="middle" style={{ fill: hl ? 'var(--text)' : 'var(--text-2)', fontSize: fontSize - 1, fontWeight: 700 }}>{l.node.p}</text>
                </g>
              )}
            </g>
          );
        })}
        {laid.map((l) => {
          const leaf = !l.node.children?.length;
          const hl = isHl(l.path);
          const tw = Math.max(36, l.node.label.length * (fontSize * 0.62) + 14);
          return (
            <g key={l.path} onClick={() => leaf && onLeaf?.(l.path, chain(l))} style={{ cursor: leaf && onLeaf ? 'pointer' : undefined }} tabIndex={leaf && onLeaf ? 0 : undefined} onKeyDown={(e) => e.key === 'Enter' && leaf && onLeaf?.(l.path, chain(l))}>
              <rect x={l.x - tw / 2} y={l.y - 12} width={tw} height={24} rx={7} fill={hl ? 'var(--primary-soft)' : 'var(--surface-2)'} stroke={hl ? C.s2 : 'var(--border-strong)'} strokeWidth={hl ? 2 : 1} />
              <text x={l.x} y={l.y + 4} textAnchor="middle" style={{ fill: 'var(--text)', fontSize, fontWeight: 650 }}>{l.node.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------------- Data table ---------------- */

export function DataTable({ headers, rows, caption, rowHeaders }: { headers: string[]; rows: (string | number)[][]; caption?: string; rowHeaders?: boolean }) {
  return (
    <div>
      <div className="table-scroll">
        <table className="data-table">
          <thead><tr>{headers.map((h, i) => <th key={i} className={rowHeaders && i === 0 ? 'rh' : undefined}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j} className={(rowHeaders || headers[0] === '' ) && j === 0 ? 'rh' : undefined}>{typeof c === 'number' ? fmt(c, 4) : c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <div className="tiny muted mt-sm">{caption}</div>}
    </div>
  );
}

/* ---------------- Shape curves ---------------- */

export function shapeDensity(shape: 'symmetric' | 'right' | 'left' | 'uniform' | 'bimodal', skew = 0) {
  return (t: number) => {
    if (shape === 'uniform') return t > 0.05 && t < 0.95 ? 0.6 : 0.02;
    if (shape === 'bimodal') return Math.exp(-((t - 0.3) ** 2) / 0.008) + 0.85 * Math.exp(-((t - 0.72) ** 2) / 0.01);
    const s = shape === 'right' ? 4 : shape === 'left' ? -4 : skew;
    // skew-normal-ish
    const z = (t - 0.5 + s * -0.03) / 0.16;
    const pdf = Math.exp(-0.5 * z * z);
    const cdf = 1 / (1 + Math.exp(-1.7 * s * z));
    return pdf * cdf * 2;
  };
}

export function ShapeCurve({ shape, height = 150, skew, showCenters = false }: { shape: 'symmetric' | 'right' | 'left' | 'uniform' | 'bimodal'; height?: number; skew?: number; showCenters?: boolean }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const f = shapeDensity(shape, skew);
  const N = 120;
  const pts = Array.from({ length: N }, (_, i) => i / (N - 1));
  const vals = pts.map(f);
  const max = Math.max(...vals);
  const x = linear([0, 1], [20, w - 20]);
  const y = linear([0, max * 1.1], [height - 20, 10]);
  const path = pts.map((t, i) => `${i ? 'L' : 'M'}${x(t)},${y(vals[i])}`).join('') + `L${x(1)},${y(0)}L${x(0)},${y(0)}Z`;
  // numeric mean/median
  const total = vals.reduce((a, b) => a + b, 0);
  const mean = pts.reduce((a, t, i) => a + t * vals[i], 0) / total;
  let acc = 0;
  let median = 0.5;
  for (let i = 0; i < N; i++) {
    acc += vals[i];
    if (acc >= total / 2) { median = pts[i]; break; }
  }
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg className="chart" width={w} height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label={`${shape} distribution shape`}>
        <path d={path} fill={C.s1} fillOpacity={0.2} stroke={C.s1} strokeWidth={2} />
        <line x1={20} x2={w - 20} y1={y(0)} y2={y(0)} stroke={C.axis} />
        {showCenters && (
          <g>
            <line x1={x(median)} x2={x(median)} y1={y(0)} y2={22} stroke={C.s3} strokeWidth={2} />
            <text x={x(median)} y={16} textAnchor="middle" style={{ fill: 'var(--text-2)', fontWeight: 700 }}>median</text>
            <line x1={x(mean)} x2={x(mean)} y1={y(0)} y2={40} stroke={C.s2} strokeWidth={2} strokeDasharray="5 4" />
            <text x={x(mean)} y={34} textAnchor="middle" style={{ fill: 'var(--text-2)', fontWeight: 700 }}>mean</text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ---------------- Line chart (progress) ---------------- */

export function LineChart({ series, height = 200, yMax = 1, yFormat = (v: number) => `${Math.round(v * 100)}%`, xLabels }: { series: { label: string; values: (number | null)[]; color?: string }[]; height?: number; yMax?: number; yFormat?: (v: number) => string; xLabels: string[] }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = xLabels.length;
  const x = linear([0, Math.max(1, n - 1)], [M.left, w - M.right]);
  const y = linear([0, yMax], [height - 34, 12]);
  const yt = ticks(0, yMax, 4);
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <svg className="chart" width={w} height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label={series.map((s) => s.label).join(', ')}
        onPointerMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const i = Math.round(x.invert(e.clientX - rect.left));
          setHover(i >= 0 && i < n ? i : null);
        }} onPointerLeave={() => setHover(null)}>
        <YAxis y={y} x={M.left} ticksAt={yt} gridTo={w - M.right} format={yFormat} />
        {xLabels.map((l, i) => (n <= 14 || i % Math.ceil(n / 10) === 0) && <text key={i} x={x(i)} y={height - 12} textAnchor="middle">{l}</text>)}
        {series.map((s, si) => {
          let d = '';
          s.values.forEach((v, i) => {
            if (v === null) return;
            d += `${d && s.values[i - 1] !== null ? 'L' : 'M'}${x(i)},${y(v)}`;
          });
          return (
            <g key={s.label}>
              <path d={d} fill="none" stroke={s.color ?? SERIES[si % 3]} strokeWidth={2} strokeLinejoin="round" />
              {s.values.map((v, i) => v !== null && (s.values.length < 40 || i === hover) && <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 3} fill={s.color ?? SERIES[si % 3]} stroke={C.surface} strokeWidth={1.5} />)}
            </g>
          );
        })}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={12} y2={height - 34} stroke={C.axis} strokeDasharray="3 3" />}
      </svg>
      {hover !== null && (
        <div className="chart-tip" style={{ left: x(hover), top: 20 }}>
          <div style={{ opacity: 0.8 }}>{xLabels[hover]}</div>
          {series.map((s) => <div key={s.label}><strong>{s.values[hover] === null ? '—' : yFormat(s.values[hover]!)}</strong> {s.label}</div>)}
        </div>
      )}
      {series.length > 1 && (
        <div className="legend">{series.map((s, si) => <span key={s.label}><svg width="16" height="4"><line x1="0" x2="16" y1="2" y2="2" stroke={s.color ?? SERIES[si % 3]} strokeWidth="3" /></svg>{s.label}</span>)}</div>
      )}
    </div>
  );
}

/* ---------------- Visual spec renderer ---------------- */

function tableFor(v: VisualSpec): { headers: string[]; rows: (string | number)[][] } | null {
  switch (v.type) {
    case 'histogram': return { headers: ['Interval', v.relative ? 'Relative frequency' : 'Frequency'], rows: v.bins.map((b) => [`${fmt(b.lo)}–${fmt(b.hi)}`, v.relative ? fmt(b.count, 4) : b.count]) };
    case 'dotplot': return { headers: ['Value'], rows: v.data.slice().sort((a, b) => a - b).map((d) => [d]) };
    case 'boxplot': return { headers: ['Group', 'Min', 'Q1', 'Median', 'Q3', 'Max'], rows: v.groups.map((g) => [g.label, g.min, g.q1, g.median, g.q3, g.max]) };
    case 'scatter': return { headers: [v.xLabel ?? 'x', v.yLabel ?? 'y'], rows: v.points.map((p) => [p[0], p[1]]) };
    case 'residual': return { headers: [v.xLabel ?? 'x', 'Residual'], rows: v.points.map((p) => [p[0], p[1]]) };
    case 'bar': return { headers: ['Category', v.percent ? 'Percent' : 'Value'], rows: v.categories.map((c) => [c.label, c.value]) };
    case 'probdist': return { headers: ['x', 'P(x)'], rows: v.x.map((x, i) => [x, fmt(v.p[i], 4)]) };
    default: return null;
  }
}

export function Visual({ spec, compact = false }: { spec: VisualSpec; compact?: boolean }) {
  const [asTable, setAsTable] = useState(false);
  const table = useMemo(() => tableFor(spec), [spec]);
  let chart: ReactNode;
  switch (spec.type) {
    case 'histogram': chart = <Histogram bins={spec.bins} xLabel={spec.xLabel} yLabel={spec.yLabel} relative={spec.relative} height={compact ? 200 : 240} />; break;
    case 'dotplot': chart = <DotPlot data={spec.data} xLabel={spec.xLabel} highlight={spec.highlight} />; break;
    case 'boxplot': chart = <BoxPlot groups={spec.groups} xLabel={spec.xLabel} />; break;
    case 'scatter': chart = <Scatter points={spec.points} line={spec.line} xLabel={spec.xLabel} yLabel={spec.yLabel} highlight={spec.highlight} height={compact ? 230 : 280} />; break;
    case 'residual': chart = <ResidualPlot points={spec.points} xLabel={spec.xLabel} />; break;
    case 'bar': chart = <BarChart categories={spec.categories} yLabel={spec.yLabel} percent={spec.percent} />; break;
    case 'probdist': chart = <ProbDist x={spec.x} p={spec.p} xLabel={spec.xLabel} highlight={spec.highlight ? (x) => spec.highlight!.includes(x) : undefined} />; break;
    case 'stemleaf': return <StemLeaf rows={spec.rows} keyText={spec.keyText} />;
    case 'venn': return <Venn labels={spec.labels} onlyA={spec.onlyA} both={spec.both} onlyB={spec.onlyB} neither={spec.neither} />;
    case 'tree': return <TreeDiagram root={spec.root} />;
    case 'table': return <DataTable headers={spec.headers} rows={spec.rows} caption={spec.caption} rowHeaders={spec.rowHeaders} />;
    case 'shape': return <div className="chart-wrap"><ShapeCurve shape={spec.shape} /></div>;
  }
  return (
    <div className="chart-wrap">
      {asTable && table ? <DataTable headers={table.headers} rows={table.rows} /> : chart}
      {table && (
        <div style={{ textAlign: 'right', marginTop: 4 }}>
          <button className="link-btn tiny" onClick={() => setAsTable((v) => !v)}>{asTable ? 'Show chart' : 'Show data table'}</button>
        </div>
      )}
    </div>
  );
}

