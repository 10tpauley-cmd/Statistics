import { useMemo, useState } from 'react';
import { linearRegression, fitQuadratic, fitExponential } from '../../lib/stats/regression';
import { makeRng, gaussian, randomSeed } from '../../lib/stats/random';
import { fmt } from '../../lib/stats/format';
import { bivariateById, BIVARIATE } from '../../content/datasets';
import { Scatter, ResidualPlot } from '../charts/Charts';
import { Metric, Slider, Seg } from '../ui';

function genPoints(seed: number, strength: number, n = 24): [number, number][] {
  const rng = makeRng(seed);
  const k = Math.sqrt(Math.max(0, 1 - strength * strength));
  return Array.from({ length: n }, () => {
    const zx = gaussian(rng);
    const zy = strength * zx + k * gaussian(rng);
    return [Math.round((50 + 14 * zx) * 10) / 10, Math.round((50 + 14 * zy) * 10) / 10] as [number, number];
  });
}

const describe = (r: number) => `${Math.abs(r) >= 0.8 ? 'Strong' : Math.abs(r) >= 0.5 ? 'Moderate' : Math.abs(r) >= 0.2 ? 'Weak' : 'No'} ${Math.abs(r) >= 0.2 ? (r > 0 ? 'positive' : 'negative') : ''} linear relationship`.replace('  ', ' ');

export function CorrelationWidget({ mode: initMode = 'describe' }: { mode?: 'describe' | 'drag' }) {
  const [mode, setMode] = useState<'describe' | 'drag'>(initMode);
  const [strength, setStrength] = useState(0.8);
  const [seed, setSeed] = useState(7);
  const [pts, setPts] = useState<[number, number][]>(() => genPoints(11, 0.6, 14));
  const [showLine, setShowLine] = useState(true);
  const points = mode === 'describe' ? genPoints(seed, strength) : pts;
  const m = linearRegression(points.map((p) => p[0]), points.map((p) => p[1]));
  return (
    <div className="widget">
      <div className="row wrap between">
        <Seg options={[{ id: 'describe', label: 'Generate data' }, { id: 'drag', label: 'Drag the points' }]} value={mode} onChange={setMode} label="Mode" />
        <label className="row small"><input type="checkbox" checked={showLine} onChange={(e) => setShowLine(e.target.checked)} /> Show regression line</label>
      </div>
      <Scatter points={points} line={showLine ? { a: m.a, b: m.b } : null} xLabel="x" yLabel="y" domainX={[0, 100]} domainY={[0, 100]}
        onPointDrag={mode === 'drag' ? (i, x, y) => setPts((cur) => cur.map((p, k) => (k === i ? [Math.round(x * 10) / 10, Math.round(y * 10) / 10] : p))) : undefined} />
      <div className="metric-row">
        <Metric k="r" v={fmt(m.r, 3)} color={m.r >= 0 ? 'var(--chart-1)' : 'var(--chart-2)'} />
        <Metric k="r²" v={`${fmt(m.r2 * 100, 1)}%`} />
        <Metric k="Slope b" v={fmt(m.b, 3)} />
      </div>
      <p className="small mt-sm"><b>{describe(m.r)}.</b> {mode === 'drag' ? 'Drag one point far from the others to see how a single outlier changes r.' : 'Move the slider: the sign sets the direction, the size sets how tightly points hug the line.'}</p>
      {mode === 'describe' ? (
        <div className="widget-controls">
          <Slider label="Target correlation" value={strength} min={-1} max={1} step={0.05} onChange={setStrength} format={(v) => fmt(v, 2)} />
          <button className="btn sm" onClick={() => setSeed(randomSeed())}>New random sample</button>
        </div>
      ) : (
        <div className="widget-controls">
          <button className="btn sm" onClick={() => setPts(genPoints(randomSeed(), 0.6, 14))}>Reset points</button>
          <button className="btn sm" onClick={() => setPts(Array.from({ length: 14 }, (_, i) => [5 + i * 6.5, Math.round((80 - ((i - 6.5) ** 2) * 1.4) * 10) / 10]))}>Make a curve</button>
        </div>
      )}
    </div>
  );
}

export function ScatterFitWidget({ dataset = 'scuba' }: { dataset?: string }) {
  const d = bivariateById(dataset)!;
  const ls = linearRegression(d.x, d.y);
  const xs = d.x;
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const [p1, setP1] = useState(ls.a + ls.b * xmin + (ls.b < 0 ? -12 : 12));
  const [p2, setP2] = useState(ls.a + ls.b * xmax + (ls.b < 0 ? 12 : -12));
  const [reveal, setReveal] = useState(false);
  const b = (p2 - p1) / (xmax - xmin);
  const a = p1 - b * xmin;
  const sse = d.x.reduce((acc, x, i) => acc + (d.y[i] - (a + b * x)) ** 2, 0);
  const best = ls.residuals.reduce((acc, e) => acc + e * e, 0);
  const ymin = Math.min(...d.y), ymax = Math.max(...d.y);
  const span = ymax - ymin;
  return (
    <div className="widget">
      <Scatter points={d.x.map((x, i) => [x, d.y[i]])} line={{ a, b, color: 'var(--chart-3)' }} extraLine={reveal ? { a: ls.a, b: ls.b, color: 'var(--chart-2)', dash: true } : null} squares xLabel={d.xLabel} yLabel={d.yLabel} />
      <div className="widget-controls">
        <Slider label={`Your line at x = ${xmin}`} value={p1} min={ymin - span} max={ymax + span} step={span / 100} onChange={setP1} format={(v) => fmt(v, 1)} />
        <Slider label={`Your line at x = ${xmax}`} value={p2} min={ymin - span} max={ymax + span} step={span / 100} onChange={setP2} format={(v) => fmt(v, 1)} />
      </div>
      <div className="metric-row">
        <Metric k="Your line" v={`ŷ = ${fmt(a, 2)} ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b), 3)}x`} />
        <Metric k="Your Σ residual²" v={fmt(sse, 1)} color={sse <= best * 1.05 ? 'var(--success)' : undefined} />
        <Metric k="Least squares Σ residual²" v={reveal ? fmt(best, 1) : '?'} />
      </div>
      <div className="widget-controls">
        <button className="btn sm primary" onClick={() => setReveal(true)}>Reveal least-squares line</button>
        {reveal && <span className="small">Least squares: <b>ŷ = {fmt(ls.a, 4)} {ls.b < 0 ? '−' : '+'} {fmt(Math.abs(ls.b), 4)}x</b>. {sse <= best * 1.05 ? 'You got within 5% — excellent!' : `Yours is ${fmt((sse / best - 1) * 100, 0)}% worse.`}</span>}
      </div>
      <p className="tiny muted" style={{ marginBottom: 0 }}>The orange squares are the squared residuals. The least-squares line makes their total area as small as possible.</p>
    </div>
  );
}

export function ResidualsWidget({ datasets = ['archaeopteryx', 'iphone', 'yogurt'] }: { datasets?: string[] }) {
  const [id, setId] = useState(datasets[0]);
  const [sel, setSel] = useState<number | null>(null);
  const [model, setModel] = useState<'linear' | 'quadratic' | 'exponential'>('linear');
  const d = bivariateById(id)!;
  const lin = linearRegression(d.x, d.y);
  const fit = useMemo(() => (model === 'quadratic' ? fitQuadratic(d.x, d.y) : model === 'exponential' ? fitExponential(d.x, d.y) : null), [model, d]);
  const residuals = fit ? fit.residuals : lin.residuals;
  const predicted = (x: number) => (fit ? fit.predict(x) : lin.a + lin.b * x);
  const r2 = fit ? fit.r2 : lin.r2;
  const s = fit ? fit.s : lin.s;
  return (
    <div className="widget">
      <div className="row wrap between">
        <select className="select" style={{ maxWidth: 280 }} value={id} onChange={(e) => { setId(e.target.value); setSel(null); setModel('linear'); }} aria-label="Dataset">
          {BIVARIATE.filter((b) => datasets.includes(b.id)).map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
        {id === 'iphone' && <Seg options={[{ id: 'linear', label: 'Linear' }, { id: 'quadratic', label: 'Quadratic' }, { id: 'exponential', label: 'Exponential' }]} value={model} onChange={setModel} label="Model" />}
      </div>
      <Scatter points={d.x.map((x, i) => [x, d.y[i]])} line={fit ? null : { a: lin.a, b: lin.b }} curve={fit ? (x) => fit.predict(x) : undefined} showResiduals={!fit} highlight={sel} onPointClick={setSel} xLabel={d.xLabel} yLabel={d.yLabel} height={240} />
      <ResidualPlot points={d.x.map((x, i) => [x, residuals[i]])} xLabel={d.xLabel} highlight={sel} />
      {sel !== null && (
        <div className="callout small mt-sm">
          Point ({fmt(d.x[sel], 2)}, {fmt(d.y[sel], 2)}): predicted {fmt(predicted(d.x[sel]), 3)}, residual = {fmt(d.y[sel], 3)} − {fmt(predicted(d.x[sel]), 3)} = <b>{fmt(residuals[sel], 3)}</b> → the model <b>{residuals[sel] < 0 ? 'overpredicts' : 'underpredicts'}</b> here.
        </div>
      )}
      <div className="metric-row">
        <Metric k="Model" v={fit ? fit.equation.replace('ŷ = ', '') : `${fmt(lin.a, 2)} ${lin.b < 0 ? '−' : '+'} ${fmt(Math.abs(lin.b), 3)}x`} />
        <Metric k="r²" v={fmt(r2, 4)} />
        <Metric k="s (typical error)" v={fmt(s, 3)} />
      </div>
      <p className="tiny muted" style={{ marginBottom: 0 }}>Click a point to see its residual. Look at the residual plot: random scatter → the model fits; a curve or pattern → try another model.{d.note ? ` (${d.note})` : ''}</p>
    </div>
  );
}
