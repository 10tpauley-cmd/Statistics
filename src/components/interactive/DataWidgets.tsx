import { useMemo, useState } from 'react';
import { datasetById } from '../../content/datasets';
import { fiveNumber, histogramBins, iqrFences, lowerHalf, mean, median, percentileOf, sd, sorted, summarize, twoSdFences, upperHalf, frequencyTable, stemAndLeaf } from '../../lib/stats/descriptive';
import { fmt } from '../../lib/stats/format';
import { C, linear, ticks, niceDomain, useWidth, XAxis } from '../charts/core';
import { BoxPlot, DotPlot, Histogram, ShapeCurve, StemLeaf, DataTable } from '../charts/Charts';
import { Metric, Slider, Seg } from '../ui';

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

/* ---------------- Draggable number line ---------------- */

function DragLine({ data, onChange, domain, label, markers, highlight, height = 150, decimals = 0 }: { data: number[]; onChange: (d: number[]) => void; domain: [number, number]; label?: string; markers: { v: number; label: string; color: string; dash?: boolean }[]; highlight?: number; height?: number; decimals?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [drag, setDrag] = useState<number | null>(null);
  const x = linear(domain, [30, w - 20]);
  const base = height - 42;
  const order = data.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const stack = new Map<number, number>();
  const level = new Map<number, number>();
  order.forEach(({ v, i }) => {
    const key = Math.round(x(v) / 14);
    const l = stack.get(key) ?? 0;
    stack.set(key, l + 1);
    level.set(i, l);
  });
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drag === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const v = round(Math.max(domain[0], Math.min(domain[1], x.invert(e.clientX - rect.left))), decimals);
    const next = data.slice();
    next[drag] = v;
    onChange(next);
  };
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg className="chart" width={w} height={height} viewBox={`0 0 ${w} ${height}`} onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)} style={{ touchAction: 'none' }} role="img" aria-label={`Draggable dot plot${label ? ` of ${label}` : ''}`}>
        {markers.map((m, k) => (
          <g key={m.label}>
            <line x1={x(m.v)} x2={x(m.v)} y1={18 + k * 14} y2={base} stroke={m.color} strokeWidth={2} strokeDasharray={m.dash ? '5 4' : undefined} />
            <text x={x(m.v)} y={12 + k * 14} textAnchor="middle" style={{ fill: 'var(--text-2)', fontWeight: 700 }}>{m.label} {fmt(m.v, 2)}</text>
          </g>
        ))}
        {data.map((v, i) => {
          const cy = base - 8 - (level.get(i) ?? 0) * 15;
          return (
            <g key={i}>
              <circle cx={x(v)} cy={cy} r={14} fill="transparent" className="draggable" onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); setDrag(i); }}
                tabIndex={0} aria-label={`value ${v}; use arrow keys to move`} onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    const step = 10 ** -decimals * (e.shiftKey ? 10 : 1);
                    const next = data.slice();
                    next[i] = round(Math.max(domain[0], Math.min(domain[1], v + (e.key === 'ArrowRight' ? step : -step))), decimals);
                    onChange(next);
                    e.preventDefault();
                  }
                }} />
              <circle cx={x(v)} cy={cy} r={drag === i ? 8 : 6.5} fill={highlight === i || drag === i ? C.s2 : C.s1} stroke={C.surface} strokeWidth={2} pointerEvents="none" />
            </g>
          );
        })}
        <XAxis x={x} y={base} ticksAt={ticks(domain[0], domain[1], 8)} label={label} width={w} />
      </svg>
    </div>
  );
}

export function DragMeanWidget({ data: init = [46, 59, 48, 19, 47, 41, 39, 45, 28, 50, 50, 41, 49, 34], label = 'Value' }: { data?: number[]; label?: string }) {
  const [data, setData] = useState<number[]>(init);
  const lo = Math.min(...init), hi = Math.max(...init);
  const domain: [number, number] = [Math.floor(Math.min(0, lo - (hi - lo) * 0.3)), Math.ceil(hi + (hi - lo) * 0.9)];
  const m = mean(data), md = median(data);
  return (
    <div className="widget">
      <DragLine data={data} onChange={setData} domain={domain} label={label} markers={[{ v: m, label: 'mean', color: C.s2, dash: true }, { v: md, label: 'median', color: C.s3 }]} />
      <div className="metric-row">
        <Metric k="Mean" v={fmt(m, 2)} color="var(--chart-2)" />
        <Metric k="Median" v={fmt(md, 2)} color="var(--chart-3)" />
        <Metric k="Mean − median" v={fmt(m - md, 2)} />
        <Metric k="n" v={data.length} />
      </div>
      <div className="widget-controls">
        <button className="btn sm" onClick={() => setData([...data, round((domain[0] + domain[1]) / 2, 0)])}>+ Add point</button>
        <button className="btn sm" onClick={() => data.length > 2 && setData(data.slice(0, -1))}>− Remove point</button>
        <button className="btn sm ghost" onClick={() => setData(init)}>Reset</button>
        <span className="tiny muted">Drag dots (or focus one and use ← →).</span>
      </div>
    </div>
  );
}

/* ---------------- Spread & standard deviation ---------------- */

export function SpreadWidget({ data: init = [5, 35, 8, 40, 12], compare = [19, 20, 21, 20, 20] }: { data?: number[]; compare?: number[] }) {
  const [scale, setScale] = useState(1);
  const [squares, setSquares] = useState(false);
  const [ref, w] = useWidth<HTMLDivElement>();
  const m0 = mean(init);
  const data = init.map((v) => round(m0 + (v - m0) * scale, 1));
  const sets = [{ name: 'Player B', d: data, col: C.s1 }, { name: 'Player A', d: compare, col: C.s3 }];
  const all = [...data, ...compare];
  const domain = niceDomain(Math.min(...all, 0), Math.max(...all, 45));
  const x = linear(domain, [80, w - 20]);
  const rowH = 80;
  const h = rowH * 2 + 40;
  const dev = data.map((v) => v - mean(data));
  return (
    <div className="widget">
      <div ref={ref} style={{ width: '100%' }}>
        <svg className="chart" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Deviations from the mean for two players">
          {sets.map((s, r) => {
            const m = mean(s.d);
            const cy = 34 + r * rowH;
            return (
              <g key={s.name}>
                <text x={70} y={cy + 4} textAnchor="end" className="label">{s.name}</text>
                <line x1={80} x2={w - 20} y1={cy + 20} y2={cy + 20} stroke="var(--border)" />
                <line x1={x(m)} x2={x(m)} y1={cy - 24} y2={cy + 22} stroke={C.s2} strokeWidth={2} strokeDasharray="5 4" />
                {s.d.map((v, i) => {
                  const off = (i - (s.d.length - 1) / 2) * 6;
                  const side = Math.abs(x(v) - x(m));
                  return (
                    <g key={i}>
                      {squares && <rect x={Math.min(x(v), x(m))} y={cy + off - side / 2} width={side} height={side} fill={s.col} fillOpacity={0.08} stroke={s.col} strokeOpacity={0.3} />}
                      <line x1={x(m)} x2={x(v)} y1={cy + off} y2={cy + off} stroke={v >= m ? C.good : C.bad} strokeWidth={2} />
                      <circle cx={x(v)} cy={cy + off} r={5.5} fill={s.col} stroke={C.surface} strokeWidth={2} />
                    </g>
                  );
                })}
              </g>
            );
          })}
          <XAxis x={x} y={h - 22} ticksAt={ticks(domain[0], domain[1], 8)} width={w} />
        </svg>
      </div>
      <div className="metric-row">
        <Metric k="B mean" v={fmt(mean(data), 2)} />
        <Metric k="B SD (s)" v={fmt(sd(data), 2)} color="var(--chart-1)" />
        <Metric k="A SD (s)" v={fmt(sd(compare), 2)} color="var(--chart-3)" />
        <Metric k="Σ deviations" v={fmt(dev.reduce((a, b) => a + b, 0), 6)} />
        <Metric k="Σ squares" v={fmt(dev.reduce((a, b) => a + b * b, 0), 1)} />
      </div>
      <div className="widget-controls">
        <Slider label="Spread Player B's games" value={scale} min={0} max={1.6} step={0.05} onChange={setScale} format={(v) => `×${fmt(v, 2)}`} />
        <label className="row small"><input type="checkbox" checked={squares} onChange={(e) => setSquares(e.target.checked)} /> Square the deviations</label>
      </div>
      <p className="tiny muted" style={{ marginBottom: 0 }}>Green/red bars are deviations above/below the mean. They always cancel to 0 — squaring makes every distance count.</p>
    </div>
  );
}

/* ---------------- Histogram builder (and comparison) ---------------- */

const HIST_SETS = ['payroll-2002', 'payroll-2003', 'chips', 'actors', 'hr-alone', 'hr-friend', 'hr-pet', 'concerts-students', 'concerts-teachers', 'lyme-a', 'corporations'];

export function HistogramBuilderWidget({ dataset = 'payroll-2002', compare }: { dataset?: string; compare?: string }) {
  const [id, setId] = useState(dataset);
  const ds = datasetById(id)!;
  const [extra, setExtra] = useState<number[]>([]);
  const [add, setAdd] = useState('');
  const data = [...ds.data, ...extra];
  const range = Math.max(...data) - Math.min(...data);
  const defaultW = Math.max(1, Math.round(range / 7));
  const [width, setWidth] = useState(defaultW);
  const sm = summarize(data);
  const cmp = compare ? datasetById(compare) : undefined;
  return (
    <div className="widget">
      <div className="row wrap">
        <select className="select" style={{ maxWidth: 260 }} value={id} onChange={(e) => { setId(e.target.value); setExtra([]); setWidth(Math.max(1, Math.round((Math.max(...datasetById(e.target.value)!.data) - Math.min(...datasetById(e.target.value)!.data)) / 7))); }} aria-label="Dataset">
          {HIST_SETS.map((d) => <option key={d} value={d}>{datasetById(d)!.title}</option>)}
        </select>
        <span className="tiny muted">{ds.description}</span>
      </div>
      <Histogram bins={histogramBins(data, width)} xLabel={`${ds.variable}${ds.unit ? ` (${ds.unit})` : ''}`} markers={[{ value: sm.mean, label: 'mean', dash: true }, { value: sm.median, label: 'median', color: 'var(--chart-3)' }]} />
      <div className="widget-controls">
        <Slider label="Bin width" value={width} min={Math.max(0.5, Math.round(range / 30))} max={Math.max(2, Math.round(range / 2))} step={range > 20 ? 1 : 0.5} onChange={setWidth} />
        <div className="row"><input className="input" style={{ width: 110, height: 34 }} value={add} onChange={(e) => setAdd(e.target.value)} placeholder="Add a value" aria-label="Add a value" />
          <button className="btn sm" onClick={() => { const v = Number(add); if (Number.isFinite(v) && add !== '') { setExtra([...extra, v]); setAdd(''); } }}>Add</button>
          {extra.length > 0 && <button className="btn sm ghost" onClick={() => setExtra([])}>Undo adds</button>}</div>
      </div>
      <div className="metric-row">
        <Metric k="n" v={sm.n} /><Metric k="Mean" v={fmt(sm.mean, 2)} /><Metric k="Median" v={fmt(sm.median, 2)} /><Metric k="SD" v={fmt(sm.sd, 2)} /><Metric k="IQR" v={fmt(sm.iqr, 2)} />
      </div>
      {cmp && (
        <div className="mt">
          <div className="section-title">Compare: {cmp.title}</div>
          <Histogram bins={histogramBins(cmp.data, width)} xLabel={cmp.variable} markers={[{ value: mean(cmp.data), label: 'mean', dash: true }, { value: median(cmp.data), label: 'median', color: 'var(--chart-3)' }]} />
          <DataTable headers={['Group', 'Median', 'IQR', 'Mean', 'SD', 'Shape hint']} rows={[ds, cmp].map((d) => { const s = summarize(d.data); return [d.title, fmt(s.median, 2), fmt(s.iqr, 2), fmt(s.mean, 2), fmt(s.sd, 2), s.mean - s.median > s.sd * 0.1 ? 'skewed right' : s.median - s.mean > s.sd * 0.1 ? 'skewed left' : 'roughly symmetric']; })} />
        </div>
      )}
    </div>
  );
}

/* ---------------- Outliers ---------------- */

export function OutlierWidget({ dataset = 'mcd' }: { dataset?: string }) {
  const base = datasetById(dataset)!.data;
  const [data, setData] = useState<number[]>([...base, Math.max(...base) + 4]);
  const idx = data.length - 1;
  const orig = summarize(base);
  const cur = summarize(data);
  const fz = iqrFences(data);
  const tz = twoSdFences(data);
  const lo = Math.min(...base), hi = Math.max(...base);
  const domain: [number, number] = [Math.floor(lo - (hi - lo) * 0.4), Math.ceil(hi + (hi - lo) * 1.6)];
  const delta = (a: number, b: number) => `${b - a >= 0 ? '+' : '−'}${fmt(Math.abs(b - a), 2)}`;
  const isOut = fz.outliers.includes(data[idx]);
  return (
    <div className="widget">
      <DragLine data={data} onChange={(d) => setData([...base, d[idx]])} domain={domain} label={datasetById(dataset)!.variable} highlight={idx}
        markers={[{ v: fz.lower, label: 'fence', color: 'var(--danger)', dash: true }, { v: fz.upper, label: 'fence', color: 'var(--danger)', dash: true }, { v: cur.mean, label: 'mean', color: C.s2 }]} height={170} />
      <div className={`callout ${isOut ? 'warn' : 'success'} small`}>The orange point ({fmt(data[idx], 1)}) is {isOut ? '' : 'not '}an outlier by the 1.5 × IQR rule (fences {fmt(fz.lower, 2)} to {fmt(fz.upper, 2)}){tz.outliers.includes(data[idx]) ? ' and is beyond 2 SDs of the mean.' : '.'}</div>
      <div className="table-scroll mt-sm">
        <table className="data-table">
          <thead><tr><th className="rh">Statistic</th><th>Without point</th><th>With point</th><th>Change</th><th>Resistant?</th></tr></thead>
          <tbody>
            {([['Mean', orig.mean, cur.mean, false], ['Median', orig.median, cur.median, true], ['SD', orig.sd, cur.sd, false], ['Range', orig.range, cur.range, false], ['IQR', orig.iqr, cur.iqr, true]] as [string, number, number, boolean][]).map(([k, a, b, r]) => (
              <tr key={k}><td className="rh">{k}</td><td>{fmt(a, 2)}</td><td>{fmt(b, 2)}</td><td style={{ color: Math.abs(b - a) > 1 ? 'var(--danger)' : 'var(--muted)', fontWeight: 700 }}>{delta(a, b)}</td><td>{r ? 'Yes' : 'No'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Boxplot builder ---------------- */

export function BoxplotBuilderWidget({ dataset = 'speeds-north' }: { dataset?: string }) {
  const [id, setId] = useState(dataset);
  const data = datasetById(id)!.data;
  const srt = sorted(data);
  const fn = fiveNumber(data);
  const fz = iqrFences(data);
  const [step, setStep] = useState(0);
  const [modified, setModified] = useState(true);
  const steps = ['Sort the data', 'Find the median', 'Find Q1 (median of lower half)', 'Find Q3 (median of upper half)', 'Draw whiskers to min & max', 'Check for outliers (1.5 × IQR)'];
  const n = srt.length;
  const lo = lowerHalf(data), up = upperHalf(data);
  const highlightIdx = (i: number) => {
    if (step === 1) return n % 2 ? i === (n - 1) / 2 : i === n / 2 - 1 || i === n / 2;
    if (step === 2) return i < lo.length;
    if (step === 3) return i >= n - up.length;
    if (step >= 4) return i === 0 || i === n - 1;
    return false;
  };
  const inner = srt.filter((x) => !fz.outliers.includes(x));
  return (
    <div className="widget">
      <div className="row wrap between">
        <select className="select" style={{ maxWidth: 240 }} value={id} onChange={(e) => { setId(e.target.value); setStep(0); }} aria-label="Dataset">
          {['speeds-north', 'mcd', 'chips', 'oj', 'paint-a', 'paint-b'].map((d) => <option key={d} value={d}>{datasetById(d)!.title}</option>)}
        </select>
        <span className="chip primary">Step {step + 1} of {steps.length}: {steps[step]}</span>
      </div>
      <div className="row wrap mt-sm" style={{ gap: 4 }}>
        {srt.map((v, i) => <span key={i} className="chip" style={highlightIdx(i) ? { background: 'var(--primary)', color: 'var(--on-primary)', borderColor: 'transparent' } : undefined}>{fmt(v, 2)}</span>)}
      </div>
      <div className="mt">
        {step >= 4 ? (
          <BoxPlot groups={[{ label: 'Data', min: modified && step >= 5 ? Math.min(...inner) : fn.min, q1: fn.q1, median: fn.median, q3: fn.q3, max: modified && step >= 5 ? Math.max(...inner) : fn.max, outliers: modified && step >= 5 ? fz.outliers : [] }]} xLabel={datasetById(id)!.variable} />
        ) : (
          <div className="metric-row">
            <Metric k="Median" v={step >= 1 ? fmt(fn.median, 2) : '?'} />
            <Metric k="Q1" v={step >= 2 ? fmt(fn.q1, 2) : '?'} />
            <Metric k="Q3" v={step >= 3 ? fmt(fn.q3, 2) : '?'} />
            <Metric k="IQR" v={step >= 3 ? fmt(fn.q3 - fn.q1, 2) : '?'} />
          </div>
        )}
      </div>
      {step >= 5 && <p className="small mt-sm">Fences: {fmt(fz.lower, 2)} and {fmt(fz.upper, 2)}. {fz.outliers.length ? `Outliers: ${fz.outliers.join(', ')} — drawn as dots; whiskers stop at the most extreme non-outliers.` : 'No outliers.'}</p>}
      <div className="widget-controls">
        <button className="btn sm" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
        <button className="btn sm primary" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>Next step</button>
        {step >= 5 && <label className="row small"><input type="checkbox" checked={modified} onChange={(e) => setModified(e.target.checked)} /> Modified boxplot (show outliers)</label>}
      </div>
    </div>
  );
}

/* ---------------- Shape ---------------- */

export function ShapeWidget() {
  const [skew, setSkew] = useState(3);
  const [mode, setMode] = useState<'skew' | 'uniform' | 'bimodal'>('skew');
  const label = mode !== 'skew' ? (mode === 'uniform' ? 'Uniform' : 'Bimodal') : Math.abs(skew) < 0.6 ? 'Approximately symmetric' : skew > 0 ? 'Skewed right' : 'Skewed left';
  return (
    <div className="widget">
      <Seg options={[{ id: 'skew', label: 'Skew' }, { id: 'uniform', label: 'Uniform' }, { id: 'bimodal', label: 'Bimodal' }]} value={mode} onChange={setMode} label="Shape" />
      <ShapeCurve shape={mode === 'skew' ? (Math.abs(skew) < 0.01 ? 'symmetric' : 'symmetric') : mode} skew={mode === 'skew' ? skew : undefined} height={190} showCenters={mode !== 'uniform'} />
      {mode === 'skew' && <Slider label="Skew (tail direction)" value={skew} min={-5} max={5} step={0.25} onChange={setSkew} format={(v) => (v > 0 ? `→ ${v}` : v < 0 ? `← ${-v}` : '0')} />}
      <p className="small mt-sm" style={{ marginBottom: 0 }}><b>{label}.</b> {mode === 'bimodal' ? 'Two peaks — separate the groups before summarizing.' : mode === 'uniform' ? 'Values spread evenly; no peak.' : Math.abs(skew) < 0.6 ? 'Mean ≈ median.' : skew > 0 ? 'The right tail pulls the mean above the median.' : 'The left tail pulls the mean below the median.'}</p>
    </div>
  );
}

/* ---------------- Stem-and-leaf builder ---------------- */

export function StemLeafWidget({ dataset = 'actors' }: { dataset?: string }) {
  const [id, setId] = useState(dataset);
  const ds = datasetById(id)!;
  const isPayroll = id.startsWith('payroll');
  const [k, setK] = useState(0);
  const shown = ds.data.slice(0, k);
  const rowsAll = stemAndLeaf(ds.data);
  const shownRows = stemAndLeaf(shown);
  const rows = rowsAll.map((r) => ({ stem: r.stem, leaves: shownRows.find((x) => x.stem === r.stem)?.leaves ?? [] }));
  return (
    <div className="widget">
      <div className="row wrap">
        <select className="select" style={{ maxWidth: 240 }} value={id} onChange={(e) => { setId(e.target.value); setK(0); }} aria-label="Dataset">
          {['actors', 'payroll-2002', 'payroll-2003', 'chips', 'concerts-students'].map((d) => <option key={d} value={d}>{datasetById(d)!.title}</option>)}
        </select>
        <span className="small muted">{k} of {ds.data.length} values placed</span>
      </div>
      <div className="row wrap mt-sm" style={{ gap: 4 }}>
        {ds.data.map((v, i) => <span key={i} className="chip" style={i < k ? { opacity: 0.35 } : i === k ? { background: 'var(--primary)', color: 'var(--on-primary)' } : undefined}>{v}</span>)}
      </div>
      <div className="mt"><StemLeaf rows={rows} keyText={isPayroll ? '7|9 = $79 million' : `${rowsAll[0]?.stem ?? 1}|${rowsAll[0]?.leaves[0] ?? 0} = ${rowsAll[0] ? rowsAll[0].stem * 10 + rowsAll[0].leaves[0] : ''}`} /></div>
      <div className="widget-controls">
        <button className="btn sm primary" disabled={k >= ds.data.length} onClick={() => setK(k + 1)}>Place next value</button>
        <button className="btn sm" onClick={() => setK(ds.data.length)}>Place all</button>
        <button className="btn sm ghost" onClick={() => setK(0)}>Reset</button>
      </div>
    </div>
  );
}

/* ---------------- Frequency table builder ---------------- */

export function FreqTableWidget({ dataset = 'lyme-a' }: { dataset?: string }) {
  const data = datasetById(dataset)!.data;
  const [w, setW] = useState(6);
  const classes = useMemo(() => {
    const out: { lo: number; hi: number }[] = [];
    for (let lo = 0.5; lo <= Math.max(...data); lo += w) out.push({ lo, hi: lo + w });
    return out;
  }, [data, w]);
  const t = frequencyTable(data, classes);
  return (
    <div className="widget">
      <Slider label="Class width (weeks)" value={w} min={3} max={12} step={1} onChange={setW} />
      <DataTable headers={['Class', 'f', 'Rel. f', 'Cum. f', 'Cum. rel. f']} rows={t.map((r) => [`${fmt(r.lo)}–${fmt(r.hi)}`, r.f, fmt(r.rel, 3), r.cum, fmt(r.cumRel, 3)])} caption={`Σf = ${data.length}; relative frequencies sum to ${fmt(t.reduce((a, r) => a + r.rel, 0), 3)}.`} />
    </div>
  );
}

/* ---------------- Percentile explorer ---------------- */

export function PercentileWidget({ dataset = 'speeds-north' }: { dataset?: string }) {
  const data = datasetById(dataset)!.data;
  const [sel, setSel] = useState<number>(Math.floor(data.length * 0.7));
  const v = data[sel];
  const fn = fiveNumber(data);
  const pct = percentileOf(data, v) * 100;
  const region = v < fn.q1 ? 'below Q1 (bottom 25%)' : v < fn.median ? 'between Q1 and the median' : v < fn.q3 ? 'between the median and Q3' : 'at or above Q3 (top 25%)';
  return (
    <div className="widget">
      <DotPlot data={data} xLabel={datasetById(dataset)!.variable} onDotClick={setSel} selected={sel} markers={[{ value: fn.q1, label: 'Q1', color: 'var(--chart-3)' }, { value: fn.median, label: 'MD', color: 'var(--chart-2)' }, { value: fn.q3, label: 'Q3', color: 'var(--chart-3)' }]} />
      <div className="metric-row">
        <Metric k="Selected value" v={fmt(v, 2)} color="var(--chart-2)" />
        <Metric k="Values below" v={`${data.filter((d) => d < v).length} of ${data.length}`} />
        <Metric k="Percentile" v={`${fmt(pct, 1)}th`} />
      </div>
      <p className="small mt-sm" style={{ marginBottom: 0 }}>Click any dot. This value is {region}.</p>
    </div>
  );
}

/* ---------------- z-score comparison ---------------- */

export function ZScoreWidget() {
  const [a, setA] = useState({ name: 'Representatives', x: 8, m: 8.7, s: 9.723 });
  const [b, setB] = useState({ name: 'Counties', x: 23, m: 62.82, s: 46.421 });
  const za = (a.x - a.m) / a.s, zb = (b.x - b.m) / b.s;
  const rowFor = (v: typeof a, set: (x: typeof a) => void, z: number, col: string) => (
    <div className="card flat pad-sm">
      <div className="row between"><b>{v.name}</b><span className="chip" style={{ color: col }}>z = {fmt(z, 3)}</span></div>
      <Slider label={`Value (mean ${v.m}, SD ${v.s})`} value={v.x} min={Math.max(0, Math.round(v.m - 3 * v.s))} max={Math.round(v.m + 3 * v.s)} step={v.s > 20 ? 1 : 0.5} onChange={(x) => set({ ...v, x })} />
      <div className="bar mt-sm" style={{ position: 'relative' }}><span style={{ width: `${Math.min(100, (Math.abs(z) / 3) * 100)}%`, background: col }} /></div>
      <div className="tiny muted mt-sm">{fmt(Math.abs(z), 2)} SDs {z < 0 ? 'below' : 'above'} the mean</div>
    </div>
  );
  return (
    <div className="widget">
      <div className="grid grid-2">{rowFor(a, setA, za, 'var(--chart-1)')}{rowFor(b, setB, zb, 'var(--chart-2)')}</div>
      <p className="small mt" style={{ marginBottom: 0 }}><b>{Math.abs(za) > Math.abs(zb) ? a.name : b.name}</b> is farther from its mean in standard deviations ({fmt(Math.max(Math.abs(za), Math.abs(zb)), 3)} vs {fmt(Math.min(Math.abs(za), Math.abs(zb)), 3)}).</p>
    </div>
  );
}

