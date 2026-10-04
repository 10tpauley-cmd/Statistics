import { useMemo, useState, type ReactNode } from 'react';
import { parseNumber, fmt } from '../../lib/stats/format';
import { iqrFences, lowerHalf, mean, modes, sd, sorted, summarize, twoSdFences, upperHalf, frequencyTable, percentileOf, histogramBins } from '../../lib/stats/descriptive';
import { linearRegression } from '../../lib/stats/regression';
import { binomPmf, binomProb, binomMean, binomSd, expectedValue, distVariance, nCr, type BinomQuery } from '../../lib/stats/probability';
import { DATASETS, BIVARIATE } from '../../content/datasets';
import { Rich } from '../ui/Rich';
import { Icon } from '../ui/Icon';
import { BoxPlot, Histogram, ProbDist, Scatter, ResidualPlot, DataTable } from '../charts/Charts';

export function parseList(s: string): number[] {
  return s.split(/[\s,;]+/).map((t) => parseNumber(t)).filter((v): v is number => v !== null && Number.isFinite(v));
}

const f4 = (x: number) => fmt(x, 4);

function Result({ answer, label, steps, meaning, children }: { answer: ReactNode; label: string; steps: string[]; meaning: string; children?: ReactNode }) {
  return (
    <div className="stack mt">
      <div className="answer-hero">
        <div className="section-title" style={{ marginBottom: 4 }}>Your answer</div>
        <div className="row wrap" style={{ alignItems: 'baseline', gap: 12 }}>
          <span className="big-num">{answer}</span>
          <span className="muted">{label}</span>
        </div>
      </div>
      <div>
        <div className="section-title">How we got there</div>
        <div className="calc-steps">
          {steps.map((st, i) => <div className="calc-step" key={i}><Rich text={st} /></div>)}
        </div>
      </div>
      <div className="callout success">
        <div className="section-title" style={{ marginBottom: 4 }}>What this means</div>
        <Rich text={meaning} />
      </div>
      {children}
    </div>
  );
}

function ListField({ label, value, onChange, presets, placeholder }: { label: string; value: string; onChange: (v: string) => void; presets?: { label: string; data: number[] }[]; placeholder?: string }) {
  return (
    <div className="field">
      <label>{label}</label>
      <textarea className="textarea" style={{ minHeight: 70 }} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? 'e.g. 27, 11, 22, 21, 40'} />
      {presets && (
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="tiny muted">Course data:</span>
          {presets.map((p) => <button key={p.label} className="chip" onClick={() => onChange(p.data.join(', '))}>{p.label}</button>)}
        </div>
      )}
    </div>
  );
}

const PRESETS = DATASETS.filter((d) => ['chips', 'oj', 'paint-a', 'paint-b', 'mcd', 'speeds-north', 'payroll-2003', 'hr-pet', 'actors'].includes(d.id)).map((d) => ({ label: d.title, data: d.data }));

/* ---------------- 1. Describe data ---------------- */

function DescribeTool() {
  const [raw, setRaw] = useState(DATASETS.find((d) => d.id === 'mcd')!.data.join(', '));
  const [ctx, setCtx] = useState('grams of fat');
  const [stat, setStat] = useState<'mean' | 'median' | 'quartiles' | 'sd' | 'outliers' | 'all'>('all');
  const data = useMemo(() => parseList(raw), [raw]);
  if (data.length < 2) return <div className="stack"><ListField label="Data values" value={raw} onChange={setRaw} presets={PRESETS} /><p className="muted small">Enter at least two numbers.</p></div>;
  const sm = summarize(data);
  const srt = sorted(data);
  const m = mean(data);
  const n = data.length;
  const ss = data.reduce((a, x) => a + (x - m) ** 2, 0);
  const fz = iqrFences(data);
  const tz = twoSdFences(data);
  const unit = ctx.trim() || 'units';
  const bw = (sm.max - sm.min) / 8 || 1;
  const niceW = 10 ** Math.floor(Math.log10(bw)) * (bw / 10 ** Math.floor(Math.log10(bw)) > 5 ? 10 : bw / 10 ** Math.floor(Math.log10(bw)) > 2 ? 5 : 2);
  const views: Record<string, ReactNode> = {
    mean: <Result answer={fmt(m, 4)} label="sample mean x̄" steps={[`Add the ${n} values: $\\sum x = ${fmt(data.reduce((a, b) => a + b, 0), 4)}$`, `Divide by n = ${n}: $\\bar{x} = ${fmt(data.reduce((a, b) => a + b, 0), 4)} / ${n} = ${f4(m)}$`]} meaning={`The average is about **${fmt(m, 3)} ${unit}**. It is the balance point of the data; it gets pulled toward outliers.`} />,
    median: <Result answer={fmt(sm.median, 4)} label="median (MD)" steps={[`Sort: ${srt.map((x) => fmt(x, 3)).join(', ')}`, n % 2 ? `n = ${n} is odd → the middle value is position ${(n + 1) / 2}: **${fmt(sm.median, 4)}**` : `n = ${n} is even → average positions ${n / 2} and ${n / 2 + 1}: (${fmt(srt[n / 2 - 1], 4)} + ${fmt(srt[n / 2], 4)})/2 = **${fmt(sm.median, 4)}**`]} meaning={`Half of the values are below **${fmt(sm.median, 3)} ${unit}** and half are above. The median is resistant to outliers.`} />,
    quartiles: <Result answer={`${fmt(sm.q1, 3)} / ${fmt(sm.q3, 3)}`} label="Q1 / Q3" steps={[`Sorted data: ${srt.map((x) => fmt(x, 3)).join(', ')} (median ${fmt(sm.median, 4)})`, `${n % 2 ? 'n is odd, so leave the median out of both halves (course/Stapplet method).' : 'n is even, so split into two equal halves.'}`, `Lower half: ${lowerHalf(data).map((x) => fmt(x, 3)).join(', ')} → Q1 = **${fmt(sm.q1, 4)}**`, `Upper half: ${upperHalf(data).map((x) => fmt(x, 3)).join(', ')} → Q3 = **${fmt(sm.q3, 4)}**`, `IQR = Q3 − Q1 = ${fmt(sm.q3, 4)} − ${fmt(sm.q1, 4)} = **${fmt(sm.iqr, 4)}**`]} meaning={`The middle 50% of the values lie between ${fmt(sm.q1, 3)} and ${fmt(sm.q3, 3)} ${unit} — within **${fmt(sm.iqr, 3)} ${unit}** of each other.`} />,
    sd: <Result answer={fmt(sm.sd, 4)} label="sample standard deviation s" steps={[`Mean: $\\bar{x} = ${f4(m)}$`, `Deviations $(x - \\bar{x})$ and squares — see the table below.`, `Sum of squares: $\\sum (x-\\bar{x})^2 = ${f4(ss)}$`, `Variance: $s^2 = ${f4(ss)} / (${n} - 1) = ${f4(sm.variance)}$`, `Square root: $s = \\sqrt{${f4(sm.variance)}} = ${f4(sm.sd)}$`, `(Population version, dividing by N: σ = ${f4(sd(data, 'population'))})`]} meaning={`On average, a value is about **${fmt(sm.sd, 3)} ${unit}** away from the mean of ${fmt(m, 3)}. Smaller SD = more consistent data.`}>
      <DataTable headers={['x', 'x − x̄', '(x − x̄)²']} rows={data.map((x) => [fmt(x, 4), fmt(x - m, 4), fmt((x - m) ** 2, 4)])} caption={`Deviations sum to ${fmt(data.reduce((a, x) => a + (x - m), 0), 6)} (always 0) — that's why we square them.`} />
    </Result>,
    outliers: <Result answer={fz.outliers.length ? fz.outliers.map((x) => fmt(x, 3)).join(', ') : 'None'} label="outliers (1.5 × IQR rule)" steps={[`IQR = ${fmt(sm.q3, 4)} − ${fmt(sm.q1, 4)} = ${fmt(fz.iqr, 4)}`, `1.5 × IQR = ${fmt(fz.step, 4)}`, `Lower fence: Q1 − 1.5·IQR = ${fmt(sm.q1, 4)} − ${fmt(fz.step, 4)} = **${fmt(fz.lower, 4)}**`, `Upper fence: Q3 + 1.5·IQR = ${fmt(sm.q3, 4)} + ${fmt(fz.step, 4)} = **${fmt(fz.upper, 4)}**`, `2 SD rule: ${f4(m)} ± 2(${f4(sm.sd)}) → ${fmt(tz.lower, 4)} to ${fmt(tz.upper, 4)} → outliers: ${tz.outliers.length ? tz.outliers.map((x) => fmt(x, 3)).join(', ') : 'none'}`]} meaning={fz.outliers.length ? `Values outside ${fmt(fz.lower, 3)} to ${fmt(fz.upper, 3)} are unusually far from the rest. They inflate the mean, SD, and range, but barely affect the median and IQR.` : `No value falls outside the fences ${fmt(fz.lower, 3)} to ${fmt(fz.upper, 3)}, so there are no outliers by the 1.5 × IQR rule.${tz.outliers.length ? ' (The 2 SD rule flags some values — the two rules can disagree.)' : ''}`} />,
  };
  return (
    <div className="stack">
      <div className="grid grid-2">
        <ListField label="Data values" value={raw} onChange={setRaw} presets={PRESETS} />
        <div className="field"><label>What was measured? (for the explanation)</label><input className="input" value={ctx} onChange={(e) => setCtx(e.target.value)} placeholder="e.g. minutes, dollars" /></div>
      </div>
      <div className="seg" style={{ flexWrap: 'wrap' }}>
        {(['all', 'mean', 'median', 'quartiles', 'sd', 'outliers'] as const).map((k) => <button key={k} className={stat === k ? 'active' : ''} onClick={() => setStat(k)}>{{ all: 'Summary', mean: 'Mean', median: 'Median', quartiles: 'Quartiles & IQR', sd: 'Std. dev.', outliers: 'Outliers' }[k]}</button>)}
      </div>
      {stat === 'all' ? (
        <div className="stack mt">
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>n</th><th>mean</th><th>SD (s)</th><th>min</th><th>Q1</th><th>median</th><th>Q3</th><th>max</th><th>range</th><th>IQR</th><th>mode</th></tr></thead>
              <tbody><tr><td>{n}</td><td>{fmt(sm.mean, 4)}</td><td>{fmt(sm.sd, 4)}</td><td>{fmt(sm.min, 4)}</td><td>{fmt(sm.q1, 4)}</td><td>{fmt(sm.median, 4)}</td><td>{fmt(sm.q3, 4)}</td><td>{fmt(sm.max, 4)}</td><td>{fmt(sm.range, 4)}</td><td>{fmt(sm.iqr, 4)}</td><td>{modes(data).length ? modes(data).map((x) => fmt(x, 3)).join(', ') : 'none'}</td></tr></tbody>
            </table>
          </div>
          <div className="callout success small">
            <b>What this means:</b> a typical value is about {fmt(sm.median, 3)} {unit} (median){Math.abs(sm.mean - sm.median) > sm.sd * 0.1 ? `; the mean (${fmt(sm.mean, 3)}) is ${sm.mean > sm.median ? 'above' : 'below'} the median, suggesting a ${sm.mean > sm.median ? 'right' : 'left'} skew` : '; the mean and median are close, suggesting a roughly symmetric shape'}. The middle 50% spans {fmt(sm.iqr, 3)} {unit}; values typically sit {fmt(sm.sd, 3)} {unit} from the mean.{fz.outliers.length ? ` Outliers (1.5×IQR): ${fz.outliers.map((x) => fmt(x, 3)).join(', ')}.` : ''}
          </div>
          <div className="grid grid-2">
            <div className="chart-wrap"><BoxPlot groups={[{ label: 'Data', min: Math.min(...data.filter((x) => !fz.outliers.includes(x))), q1: sm.q1, median: sm.median, q3: sm.q3, max: Math.max(...data.filter((x) => !fz.outliers.includes(x))), outliers: fz.outliers }]} xLabel={ctx} /></div>
            <div className="chart-wrap"><Histogram bins={histogramBins(data, niceW)} xLabel={ctx} markers={[{ value: sm.mean, label: 'mean', dash: true }, { value: sm.median, label: 'median', color: 'var(--chart-3)' }]} height={210} /></div>
          </div>
        </div>
      ) : views[stat]}
    </div>
  );
}

/* ---------------- 2. Frequency table ---------------- */

function FreqTool() {
  const [raw, setRaw] = useState(DATASETS.find((d) => d.id === 'lyme-a')!.data.join(', '));
  const [start, setStart] = useState('0.5');
  const [width, setWidth] = useState('6');
  const data = parseList(raw);
  const s0 = parseNumber(start) ?? 0;
  const w = Math.max(1e-9, parseNumber(width) ?? 1);
  const classes: { lo: number; hi: number }[] = [];
  if (data.length) for (let lo = s0; lo <= Math.max(...data) && classes.length < 40; lo += w) classes.push({ lo, hi: lo + w });
  const t = frequencyTable(data, classes);
  return (
    <div className="stack">
      <ListField label="Data values" value={raw} onChange={setRaw} presets={[{ label: 'Lyme A', data: DATASETS.find((d) => d.id === 'lyme-a')!.data }, { label: 'Lyme B', data: DATASETS.find((d) => d.id === 'lyme-b')!.data }]} />
      <div className="row wrap">
        <div className="field" style={{ width: 160 }}><label>First class starts at</label><input className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="field" style={{ width: 160 }}><label>Class width</label><input className="input" value={width} onChange={(e) => setWidth(e.target.value)} /></div>
      </div>
      {data.length > 0 && (
        <>
          <DataTable headers={['Class', 'Frequency', 'Relative freq.', 'Cumulative freq.', 'Cumulative rel. freq.']} rows={t.map((r) => [`${fmt(r.lo)}–${fmt(r.hi)}`, r.f, fmt(r.rel, 3), r.cum, fmt(r.cumRel, 3)])} caption={`n = ${data.length}. Relative frequency = frequency ÷ ${data.length}; the last cumulative relative frequency is always 1.`} />
          <div className="callout success small"><b>What this means:</b> each row shows how many values fall in that class; the cumulative columns answer "at most" questions — e.g. {fmt((t[Math.min(2, t.length - 1)]?.cumRel ?? 0) * 100, 1)}% of values are below {fmt(t[Math.min(2, t.length - 1)]?.hi ?? 0)}.</div>
        </>
      )}
    </div>
  );
}

/* ---------------- 3. Position: z-score & percentile ---------------- */

function PositionTool() {
  const [x, setX] = useState('8');
  const [m, setM] = useState('8.7');
  const [s, setS] = useState('9.723');
  const [raw, setRaw] = useState(DATASETS.find((d) => d.id === 'speeds-north')!.data.join(', '));
  const [px, setPx] = useState('66');
  const xv = parseNumber(x), mv = parseNumber(m), sv = parseNumber(s);
  const data = parseList(raw);
  const pv = parseNumber(px);
  const z = xv !== null && mv !== null && sv ? (xv - mv) / sv : null;
  const below = pv !== null ? data.filter((d) => d < pv).length : 0;
  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <div className="card flat pad-sm">
        <h3>Standardized score (z)</h3>
        <div className="row wrap">
          <div className="field" style={{ flex: 1 }}><label>Value x</label><input className="input" value={x} onChange={(e) => setX(e.target.value)} /></div>
          <div className="field" style={{ flex: 1 }}><label>Mean</label><input className="input" value={m} onChange={(e) => setM(e.target.value)} /></div>
          <div className="field" style={{ flex: 1 }}><label>SD</label><input className="input" value={s} onChange={(e) => setS(e.target.value)} /></div>
        </div>
        {z !== null && <Result answer={fmt(z, 3)} label="standard deviations from the mean" steps={[`Distance from the mean: ${fmt(xv!, 4)} − ${fmt(mv!, 4)} = ${fmt(xv! - mv!, 4)}`, `Divide by the SD: ${fmt(xv! - mv!, 4)} ÷ ${fmt(sv!, 4)} = **${fmt(z, 4)}**`]} meaning={`The value is **${fmt(Math.abs(z), 3)} standard deviations ${z < 0 ? 'below' : 'above'}** the mean.${Math.abs(z) > 2 ? ' That is beyond 2 SDs — unusual (an outlier by the 2 SD rule).' : ' That is within 2 SDs — a typical value.'}`} />}
      </div>
      <div className="card flat pad-sm">
        <h3>Percentile of a value</h3>
        <ListField label="Data" value={raw} onChange={setRaw} />
        <div className="field mt-sm"><label>Value</label><input className="input" value={px} onChange={(e) => setPx(e.target.value)} /></div>
        {pv !== null && data.length > 0 && <Result answer={`${fmt((below / data.length) * 100, 1)}th`} label="percentile" steps={[`Count values **less than** ${fmt(pv, 3)}: ${below}`, `Divide by n = ${data.length}: ${below}/${data.length} = ${fmt(below / data.length, 4)}`]} meaning={`About ${fmt(percentileOf(data, pv) * 100, 1)}% of the data values are lower than ${fmt(pv, 3)}.`} />}
      </div>
    </div>
  );
}

/* ---------------- 4. Regression ---------------- */

function RegressionTool() {
  const def = BIVARIATE.find((b) => b.id === 'archaeopteryx')!;
  const [xr, setXr] = useState(def.x.join(', '));
  const [yr, setYr] = useState(def.y.join(', '));
  const [names, setNames] = useState({ x: def.xLabel, y: def.yLabel });
  const [px, setPx] = useState('45');
  const [py, setPy] = useState('');
  const x = parseList(xr), y = parseList(yr);
  const ok = x.length >= 3 && x.length === y.length;
  const m = ok ? linearRegression(x, y) : null;
  const pxv = parseNumber(px);
  const pyv = parseNumber(py);
  const strength = m ? (Math.abs(m.r) >= 0.8 ? 'strong' : Math.abs(m.r) >= 0.5 ? 'moderate' : 'weak') : '';
  return (
    <div className="stack">
      <div className="row wrap" style={{ gap: 6 }}>
        <span className="tiny muted">Course data:</span>
        {BIVARIATE.map((b) => <button key={b.id} className="chip" onClick={() => { setXr(b.x.join(', ')); setYr(b.y.join(', ')); setNames({ x: b.xLabel, y: b.yLabel }); }}>{b.title}</button>)}
      </div>
      <div className="grid grid-2">
        <ListField label={`x (explanatory): ${names.x}`} value={xr} onChange={setXr} />
        <ListField label={`y (response): ${names.y}`} value={yr} onChange={setYr} />
      </div>
      {!ok && <p className="small" style={{ color: 'var(--danger)' }}>Enter at least 3 x-values and the same number of y-values ({x.length} vs {y.length}).</p>}
      {m && (
        <>
          <Result answer={`ŷ = ${fmt(m.a, 4)} ${m.b < 0 ? '−' : '+'} ${fmt(Math.abs(m.b), 4)}x`} label="least-squares regression line" steps={[
            `Means: $\\bar{x} = ${f4(m.xbar)}$, $\\bar{y} = ${f4(m.ybar)}$`,
            `Slope: $b = \\frac{\\sum (x-\\bar{x})(y-\\bar{y})}{\\sum (x-\\bar{x})^2} = \\frac{${f4(m.sxy)}}{${f4(m.sxx)}} = ${f4(m.b)}$ (technology does this in the course)`,
            `Intercept: $a = \\bar{y} - b\\bar{x} = ${f4(m.ybar)} - (${f4(m.b)})(${f4(m.xbar)}) = ${f4(m.a)}$`,
            `Correlation: $r = ${f4(m.r)}$; coefficient of determination: $r^2 = ${f4(m.r2)}$`,
            `Standard deviation of residuals: s = ${f4(m.s)}`,
          ]} meaning={`**Slope:** for every 1-unit increase in ${names.x.toLowerCase()}, the predicted ${names.y.toLowerCase()} ${m.b >= 0 ? 'increases' : 'decreases'} by ${fmt(Math.abs(m.b), 4)}.\n\n**r = ${fmt(m.r, 4)}:** a ${strength}, ${m.r >= 0 ? 'positive' : 'negative'}, linear relationship. **r² = ${fmt(m.r2, 4)}:** about ${fmt(m.r2 * 100, 2)}% of the variation in ${names.y.toLowerCase()} is explained by ${names.x.toLowerCase()}. Predictions are only reliable for x between ${fmt(Math.min(...x))} and ${fmt(Math.max(...x))}.`} />
          <div className="grid grid-2">
            <div className="chart-wrap"><Scatter points={x.map((v, i) => [v, y[i]])} line={{ a: m.a, b: m.b }} xLabel={names.x} yLabel={names.y} showResiduals height={250} /></div>
            <div className="chart-wrap"><ResidualPlot points={x.map((v, i) => [v, m.residuals[i]])} xLabel={names.x} /></div>
          </div>
          <div className="grid grid-2">
            <div className="card flat pad-sm">
              <h3>Predict ŷ</h3>
              <div className="field"><label>x =</label><input className="input" value={px} onChange={(e) => setPx(e.target.value)} /></div>
              {pxv !== null && (
                <p className="small mt-sm" style={{ marginBottom: 0 }}>ŷ = {fmt(m.a, 4)} + ({fmt(m.b, 4)})({fmt(pxv, 4)}) = <b>{fmt(m.a + m.b * pxv, 4)}</b>
                  {(pxv < Math.min(...x) || pxv > Math.max(...x)) && <span style={{ color: 'var(--warn)' }}> — warning: extrapolation (outside {fmt(Math.min(...x))}–{fmt(Math.max(...x))}).</span>}
                </p>
              )}
            </div>
            <div className="card flat pad-sm">
              <h3>Residual for an observation</h3>
              <div className="field"><label>Observed y at x = {px}</label><input className="input" value={py} onChange={(e) => setPy(e.target.value)} placeholder="observed y" /></div>
              {pyv !== null && pxv !== null && (
                <p className="small mt-sm" style={{ marginBottom: 0 }}>Residual = {fmt(pyv, 4)} − {fmt(m.a + m.b * pxv, 4)} = <b>{fmt(pyv - (m.a + m.b * pxv), 4)}</b> → the line {pyv - (m.a + m.b * pxv) < 0 ? 'overpredicts' : 'underpredicts'} by {fmt(Math.abs(pyv - (m.a + m.b * pxv)), 3)}.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- 5. Probability rules ---------------- */

function ProbRulesTool() {
  const [pa, setPa] = useState('0.75');
  const [pb, setPb] = useState('0.2');
  const [pab, setPab] = useState('0.15');
  const A = parseNumber(pa), B = parseNumber(pb), AB = parseNumber(pab);
  const valid = A !== null && B !== null && AB !== null && A >= 0 && A <= 1 && B >= 0 && B <= 1 && AB >= 0 && AB <= Math.min(A, B) + 1e-9;
  const or = valid ? A! + B! - AB! : 0;
  const indep = valid && Math.abs(AB! - A! * B!) < 0.0005;
  return (
    <div className="stack">
      <div className="row wrap">
        <div className="field" style={{ flex: 1, minWidth: 120 }}><label>P(A)</label><input className="input" value={pa} onChange={(e) => setPa(e.target.value)} /></div>
        <div className="field" style={{ flex: 1, minWidth: 120 }}><label>P(B)</label><input className="input" value={pb} onChange={(e) => setPb(e.target.value)} /></div>
        <div className="field" style={{ flex: 1, minWidth: 120 }}><label>P(A and B)</label><input className="input" value={pab} onChange={(e) => setPab(e.target.value)} /></div>
      </div>
      {!valid ? <p className="small" style={{ color: 'var(--danger)' }}>Probabilities must be between 0 and 1, and P(A and B) can't exceed P(A) or P(B).</p> : (
        <Result answer={fmt(or, 4)} label="P(A or B)" steps={[
          `Addition rule: P(A or B) = P(A) + P(B) − P(A and B) = ${fmt(A!, 4)} + ${fmt(B!, 4)} − ${fmt(AB!, 4)} = **${fmt(or, 4)}**`,
          `Complements: P(A′) = 1 − ${fmt(A!, 4)} = ${fmt(1 - A!, 4)}; P(neither) = 1 − ${fmt(or, 4)} = **${fmt(1 - or, 4)}**`,
          `Conditional: P(A | B) = P(A and B)/P(B) = ${fmt(AB!, 4)}/${fmt(B!, 4)} = **${B ? fmt(AB! / B!, 4) : '—'}**; P(B | A) = ${A ? fmt(AB! / A!, 4) : '—'}`,
          `Independence check: P(A)·P(B) = ${fmt(A! * B!, 4)} ${indep ? '=' : '≠'} P(A and B) = ${fmt(AB!, 4)} → **${indep ? 'independent' : 'dependent'}**`,
          `Mutually exclusive? P(A and B) = ${fmt(AB!, 4)} → **${AB === 0 ? 'yes' : 'no'}**`,
        ]} meaning={`There is a ${fmt(or * 100, 2)}% chance that A, B, or both happen, and a ${fmt((1 - or) * 100, 2)}% chance that neither does. ${indep ? 'Knowing B happened does not change the chance of A (independent).' : `Knowing B happened changes the chance of A from ${fmt(A!, 3)} to ${B ? fmt(AB! / B!, 3) : '—'} (dependent).`}`} />
      )}
    </div>
  );
}

/* ---------------- 6. Discrete distribution ---------------- */

function DistTool() {
  const [xs, setXs] = useState('0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10');
  const [ps, setPs] = useState('0.33, 0.19, 0.14, 0.10, 0.07, 0.05, 0.04, 0.04, 0.02, 0.01, 0.01');
  const x = parseList(xs), p = parseList(ps);
  const ok = x.length > 0 && x.length === p.length;
  const total = p.reduce((a, b) => a + b, 0);
  const valid = ok && Math.abs(total - 1) < 0.005 && p.every((v) => v >= 0 && v <= 1);
  const d = { x, p };
  const mu = ok ? expectedValue(d) : 0;
  const v = ok ? distVariance(d) : 0;
  const ex2 = ok ? x.reduce((a, xi, i) => a + xi * xi * p[i], 0) : 0;
  return (
    <div className="stack">
      <div className="row wrap" style={{ gap: 6 }}>
        <span className="tiny muted">Course data:</span>
        <button className="chip" onClick={() => { setXs('0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10'); setPs('0.33, 0.19, 0.14, 0.10, 0.07, 0.05, 0.04, 0.04, 0.02, 0.01, 0.01'); }}>Snow days</button>
        <button className="chip" onClick={() => { setXs('100, -100'); setPs('18/38, 20/38'); }}>Roulette $100</button>
        <button className="chip" onClick={() => { setXs('-40, 0, 40'); setPs('0.56, 0.38, 0.06'); }}>Slot machines Z</button>
        <button className="chip" onClick={() => { setXs('-3, -2, 2, 17'); setPs('3/16, 8/16, 4/16, 1/16'); }}>Spinner ($20 prize)</button>
      </div>
      <div className="grid grid-2">
        <ListField label="Values x" value={xs} onChange={setXs} />
        <ListField label="Probabilities P(x)" value={ps} onChange={setPs} placeholder="e.g. 0.2, 0.5, 0.3 or 18/38" />
      </div>
      {!ok && <p className="small" style={{ color: 'var(--danger)' }}>Enter the same number of values and probabilities.</p>}
      {ok && !valid && <p className="small" style={{ color: 'var(--danger)' }}>Not a valid distribution: probabilities must be between 0 and 1 and add to 1 (they add to {fmt(total, 4)}).</p>}
      {valid && (
        <Result answer={`μ = ${fmt(mu, 4)}`} label={`σ = ${fmt(Math.sqrt(v), 4)}`} steps={[
          `Check: ΣP(x) = ${fmt(total, 4)} ✓`,
          `$E(X) = \\sum x\\,P(x) = ${x.map((xi, i) => `(${fmt(xi)})(${fmt(p[i], 4)})`).join(' + ')} = ${f4(mu)}$`,
          `$\\sum x^2 P(x) = ${f4(ex2)}$`,
          `$\\sigma^2 = \\sum x^2P(x) - \\mu^2 = ${f4(ex2)} - (${f4(mu)})^2 = ${f4(v)}$`,
          `$\\sigma = \\sqrt{${f4(v)}} = ${f4(Math.sqrt(v))}$`,
        ]} meaning={`In the long run, X averages about **${fmt(mu, 3)}** per trial, and individual results typically vary from that by about **${fmt(Math.sqrt(v), 3)}**.${Math.abs(mu) < 1e-6 ? ' E(X) = 0, so this is a fair game.' : ''}`}>
          <div className="chart-wrap"><ProbDist x={x} p={p} markers={[{ value: mu, label: 'μ', dash: true }]} /></div>
        </Result>
      )}
    </div>
  );
}

/* ---------------- 7. Binomial ---------------- */

function BinomialTool() {
  const [n, setN] = useState('10');
  const [p, setP] = useState('0.25');
  const [op, setOp] = useState<BinomQuery>('eq');
  const [k, setK] = useState('6');
  const nv = Math.round(parseNumber(n) ?? 0);
  const pv = parseNumber(p) ?? -1;
  const kv = Math.round(parseNumber(k) ?? -1);
  const valid = nv >= 1 && nv <= 1000 && pv >= 0 && pv <= 1 && kv >= 0 && kv <= nv;
  const prob = valid ? binomProb(nv, pv, op, kv) : 0;
  const opText = { eq: '=', le: '≤', lt: '<', ge: '≥', gt: '>', between: '=' }[op];
  const include = (x: number) => (op === 'eq' ? x === kv : op === 'le' ? x <= kv : op === 'lt' ? x < kv : op === 'ge' ? x >= kv : x > kv);
  const xs = valid ? Array.from({ length: nv + 1 }, (_, i) => i) : [];
  const words = { eq: `exactly ${kv}`, le: `at most ${kv}`, lt: `fewer than ${kv}`, ge: `at least ${kv}`, gt: `more than ${kv}`, between: '' }[op];
  const terms = xs.filter(include);
  return (
    <div className="stack">
      <div className="row wrap" style={{ gap: 6 }}>
        <span className="tiny muted">Course examples:</span>
        <button className="chip" onClick={() => { setN('10'); setP('0.25'); setOp('eq'); setK('6'); }}>Pop quiz</button>
        <button className="chip" onClick={() => { setN('3'); setP('0.72'); setOp('eq'); setK('3'); }}>Free throws</button>
        <button className="chip" onClick={() => { setN('6'); setP('0.75'); setOp('ge'); setK('5'); }}>Penalty kicks</button>
        <button className="chip" onClick={() => { setN('250'); setP('1/13'); setOp('le'); setK('10'); }}>Draw a three</button>
      </div>
      <div className="row wrap">
        <div className="field" style={{ width: 120 }}><label>n (trials)</label><input className="input" value={n} onChange={(e) => setN(e.target.value)} /></div>
        <div className="field" style={{ width: 140 }}><label>p (success)</label><input className="input" value={p} onChange={(e) => setP(e.target.value)} /></div>
        <div className="field" style={{ width: 120 }}><label>P(X …)</label><select className="select" value={op} onChange={(e) => setOp(e.target.value as BinomQuery)}><option value="eq">= k</option><option value="le">≤ k</option><option value="lt">&lt; k</option><option value="ge">≥ k</option><option value="gt">&gt; k</option></select></div>
        <div className="field" style={{ width: 120 }}><label>k</label><input className="input" value={k} onChange={(e) => setK(e.target.value)} /></div>
      </div>
      {!valid ? <p className="small" style={{ color: 'var(--danger)' }}>Use 1 ≤ n ≤ 1000, 0 ≤ p ≤ 1, and 0 ≤ k ≤ n.</p> : (
        <Result answer={fmt(prob, 5)} label={`P(X ${opText} ${kv}), X ~ B(${nv}, ${fmt(pv, 4)})`} steps={[
          `Binomial setting: n = ${nv} independent trials, success probability p = ${fmt(pv, 4)}, q = 1 − p = ${fmt(1 - pv, 4)}.`,
          `"${words}" includes x = ${terms.length > 6 ? `${terms[0]}, ${terms[1]}, …, ${terms[terms.length - 1]}` : terms.join(', ')}.`,
          `Each term: $P(X = x) = \\binom{n}{x}p^x q^{n-x}$ — e.g. $P(X = ${terms[0]}) = \\binom{${nv}}{${terms[0]}}(${fmt(pv, 4)})^{${terms[0]}}(${fmt(1 - pv, 4)})^{${nv - terms[0]}} = ${fmt(binomPmf(nv, pv, terms[0]), 6)}$${nv <= 60 ? ` (C = ${nCr(nv, terms[0])})` : ''}`,
          `Add the terms: **${fmt(prob, 6)}** (the course uses technology like Stapplet for this sum).`,
          `Mean μ = np = ${fmt(binomMean(nv, pv), 4)}; SD σ = √(npq) = ${fmt(binomSd(nv, pv), 4)}`,
        ]} meaning={`If this binomial situation were repeated many times, about **${fmt(prob * 100, 2)}%** of the time there would be ${words} successes. On average we expect ${fmt(binomMean(nv, pv), 3)} successes, give or take ${fmt(binomSd(nv, pv), 3)}.${prob < 0.05 ? ' A probability this small means such a result would be surprising by chance alone.' : ''}`}>
          <div className="chart-wrap"><ProbDist x={xs} p={xs.map((x) => binomPmf(nv, pv, x))} highlight={include} xLabel="Number of successes" /></div>
        </Result>
      )}
    </div>
  );
}

/* ---------------- 8. Repeated trials & uniform ---------------- */

function TrialsTool() {
  const [p, setP] = useState('0.15');
  const [n, setN] = useState('5');
  const [a, setA] = useState('0');
  const [b, setB] = useState('180');
  const [c, setC] = useState('0');
  const [d, setD] = useState('75');
  const pv = parseNumber(p) ?? -1, nv = Math.round(parseNumber(n) ?? 0);
  const av = parseNumber(a) ?? 0, bv = parseNumber(b) ?? 1, cv = parseNumber(c) ?? 0, dv = parseNumber(d) ?? 0;
  const okT = pv >= 0 && pv <= 1 && nv >= 1 && nv <= 500;
  const okU = bv > av && dv >= cv && cv >= av && dv <= bv;
  return (
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <div className="card flat pad-sm">
        <h3>Repeated independent trials</h3>
        <div className="row"><div className="field" style={{ flex: 1 }}><label>P(event) each trial</label><input className="input" value={p} onChange={(e) => setP(e.target.value)} /></div><div className="field" style={{ flex: 1 }}><label>Number of trials</label><input className="input" value={n} onChange={(e) => setN(e.target.value)} /></div></div>
        {okT && <Result answer={fmt(1 - (1 - pv) ** nv, 4)} label="P(at least one)" steps={[`P(none) = (1 − ${fmt(pv, 4)})^${nv} = ${fmt(1 - pv, 4)}^${nv} = ${fmt((1 - pv) ** nv, 5)}`, `P(at least one) = 1 − P(none) = **${fmt(1 - (1 - pv) ** nv, 5)}**`, `P(all ${nv}) = ${fmt(pv, 4)}^${nv} = ${fmt(pv ** nv, 6)}`]} meaning={`Over ${nv} independent tries, there is a ${fmt((1 - (1 - pv) ** nv) * 100, 2)}% chance the event happens at least once.`} />}
      </div>
      <div className="card flat pad-sm">
        <h3>Continuous uniform</h3>
        <div className="row"><div className="field" style={{ flex: 1 }}><label>From a</label><input className="input" value={a} onChange={(e) => setA(e.target.value)} /></div><div className="field" style={{ flex: 1 }}><label>to b</label><input className="input" value={b} onChange={(e) => setB(e.target.value)} /></div></div>
        <div className="row mt-sm"><div className="field" style={{ flex: 1 }}><label>P(c &lt; Y &lt; d): c</label><input className="input" value={c} onChange={(e) => setC(e.target.value)} /></div><div className="field" style={{ flex: 1 }}><label>d</label><input className="input" value={d} onChange={(e) => setD(e.target.value)} /></div></div>
        {okU && <Result answer={fmt((dv - cv) / (bv - av), 4)} label={`P(${fmt(cv)} < Y < ${fmt(dv)})`} steps={[`Every value from ${fmt(av)} to ${fmt(bv)} is equally likely.`, `Probability = (d − c)/(b − a) = (${fmt(dv)} − ${fmt(cv)})/(${fmt(bv)} − ${fmt(av)}) = **${fmt((dv - cv) / (bv - av), 4)}**`]} meaning={`${fmt(((dv - cv) / (bv - av)) * 100, 2)}% of the interval lies between ${fmt(cv)} and ${fmt(dv)}, so that's the chance Y lands there.`} />}
      </div>
    </div>
  );
}

const TOOLS = [
  { id: 'describe', label: 'Describe data', icon: 'chart', el: <DescribeTool /> },
  { id: 'freq', label: 'Frequency table', icon: 'list', el: <FreqTool /> },
  { id: 'position', label: 'z-score & percentile', icon: 'target', el: <PositionTool /> },
  { id: 'regression', label: 'Regression & r', icon: 'zap', el: <RegressionTool /> },
  { id: 'prob', label: 'Probability rules', icon: 'layers', el: <ProbRulesTool /> },
  { id: 'dist', label: 'Expected value', icon: 'sigma', el: <DistTool /> },
  { id: 'binomial', label: 'Binomial', icon: 'grad', el: <BinomialTool /> },
  { id: 'trials', label: 'At least one · Uniform', icon: 'repeat', el: <TrialsTool /> },
] as const;

export type ToolId = (typeof TOOLS)[number]['id'];

export function Calculator({ compact = false, initial = 'describe' }: { compact?: boolean; initial?: ToolId }) {
  const [tool, setTool] = useState<ToolId>(initial);
  const t = TOOLS.find((x) => x.id === tool)!;
  return (
    <div className="stack">
      <div className="tabs">
        {TOOLS.map((x) => (
          <button key={x.id} className={`tab ${tool === x.id ? 'active' : ''}`} onClick={() => setTool(x.id)}>
            <span className="row" style={{ gap: 6 }}><Icon name={x.icon} size={14} />{x.label}</span>
          </button>
        ))}
      </div>
      <div className={compact ? '' : 'card'}>{t.el}</div>
    </div>
  );
}
