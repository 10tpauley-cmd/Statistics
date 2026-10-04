import { useMemo, useState } from 'react';
import type { TreeNode } from '../../engine/types';
import { binomPmf, binomProb, binomMean, binomSd, expectedValue, distSd, transformDist } from '../../lib/stats/probability';
import { fmt } from '../../lib/stats/format';
import { tableById, TABLES } from '../../content/datasets';
import { LineChart, ProbDist, TreeDiagram, Venn } from '../charts/Charts';
import { Metric, Slider, Seg } from '../ui';

/* ---------------- Law of large numbers ---------------- */

export function LLNWidget() {
  const [kind, setKind] = useState<'coin' | 'die'>('coin');
  const [results, setResults] = useState<number[]>([]);
  const p = kind === 'coin' ? 0.5 : 1 / 6;
  const hit = (v: number) => (kind === 'coin' ? v === 1 : v === 6);
  const run = (n: number) => {
    const out = results.slice();
    for (let i = 0; i < n; i++) out.push(kind === 'coin' ? (Math.random() < 0.5 ? 1 : 0) : 1 + Math.floor(Math.random() * 6));
    setResults(out.slice(-20000));
  };
  const props = useMemo(() => {
    const pts: number[] = [];
    let c = 0;
    const step = Math.max(1, Math.floor(results.length / 120));
    results.forEach((v, i) => {
      if (hit(v)) c++;
      if ((i + 1) % step === 0 || i === results.length - 1) pts.push(c / (i + 1));
    });
    return pts;
  }, [results, kind]); // eslint-disable-line
  const count = results.filter(hit).length;
  return (
    <div className="widget">
      <div className="row wrap between">
        <Seg options={[{ id: 'coin', label: '🪙 Coin: P(heads)' }, { id: 'die', label: '🎲 Die: P(six)' }]} value={kind} onChange={(k) => { setKind(k); setResults([]); }} label="Experiment" />
        <span className="small muted">Theoretical probability: <b>{kind === 'coin' ? '0.5' : '1/6 ≈ 0.167'}</b></span>
      </div>
      {results.length ? (
        <LineChart series={[{ label: 'Experimental proportion', values: props }, { label: 'Theoretical', values: props.map(() => p), color: 'var(--chart-2)' }]} xLabels={props.map((_, i) => String(Math.round(((i + 1) / props.length) * results.length)))} height={210} />
      ) : <div className="empty small">Run some trials to see the running proportion.</div>}
      <div className="coin-strip mt-sm" aria-hidden="true">{results.slice(-60).map((v, i) => <i key={i} style={{ background: hit(v) ? 'var(--chart-1)' : 'var(--surface-3)' }} />)}</div>
      <div className="metric-row">
        <Metric k="Trials" v={results.length.toLocaleString()} />
        <Metric k={kind === 'coin' ? 'Heads' : 'Sixes'} v={count.toLocaleString()} />
        <Metric k="Experimental P" v={results.length ? fmt(count / results.length, 4) : '—'} />
        <Metric k="Off by" v={results.length ? fmt(Math.abs(count / results.length - p), 4) : '—'} />
      </div>
      <div className="widget-controls">
        {[10, 100, 1000, 10000].map((n) => <button key={n} className="btn sm" onClick={() => run(n)}>Run {n.toLocaleString()}</button>)}
        <button className="btn sm ghost" onClick={() => setResults([])}>Reset</button>
      </div>
      <p className="tiny muted" style={{ marginBottom: 0 }}>As the number of trials increases, the experimental probability gets closer to the theoretical probability (Lab #3 idea, p.31).</p>
    </div>
  );
}

/* ---------------- Two dice dot array ---------------- */

const DICE_EVENTS: Record<string, { label: string; f: (a: number, b: number) => boolean }> = {
  sum7: { label: 'Sum is 7', f: (a, b) => a + b === 7 },
  sum711: { label: 'Sum is 7 or 11', f: (a, b) => a + b === 7 || a + b === 11 },
  doubles: { label: 'Doubles', f: (a, b) => a === b },
  diff: { label: 'Different numbers', f: (a, b) => a !== b },
  firstEven: { label: 'First die even', f: (a) => a % 2 === 0 },
  sumGe10: { label: 'Sum ≥ 10', f: (a, b) => a + b >= 10 },
  secondSix: { label: 'Second die is 6', f: (_a, b) => b === 6 },
};

export function DiceWidget() {
  const [A, setA] = useState('sum7');
  const [B, setB] = useState('firstEven');
  const ea = DICE_EVENTS[A], eb = DICE_EVENTS[B];
  const cells: { a: number; b: number }[] = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) cells.push({ a, b });
  const nA = cells.filter((c) => ea.f(c.a, c.b)).length;
  const nB = cells.filter((c) => eb.f(c.a, c.b)).length;
  const nAB = cells.filter((c) => ea.f(c.a, c.b) && eb.f(c.a, c.b)).length;
  const indep = Math.abs(nAB / 36 - (nA / 36) * (nB / 36)) < 1e-9;
  return (
    <div className="widget">
      <div className="row wrap">
        <label className="small bold">A: <select className="select" style={{ width: 200, height: 34 }} value={A} onChange={(e) => setA(e.target.value)}>{Object.entries(DICE_EVENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
        <label className="small bold">B: <select className="select" style={{ width: 200, height: 34 }} value={B} onChange={(e) => setB(e.target.value)}>{Object.entries(DICE_EVENTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(6, 1fr)', gap: 4, maxWidth: 380, marginTop: 12 }} role="grid" aria-label="Two-dice dot array">
        <span />
        {[1, 2, 3, 4, 5, 6].map((b) => <span key={b} className="tiny muted center bold">{b}</span>)}
        {[1, 2, 3, 4, 5, 6].map((a) => (
          <div key={a} style={{ display: 'contents' }}>
            <span className="tiny muted bold" style={{ alignSelf: 'center' }}>{a}</span>
            {[1, 2, 3, 4, 5, 6].map((b) => {
              const inA = ea.f(a, b), inB = eb.f(a, b);
              const bg = inA && inB ? 'var(--chart-3)' : inA ? 'var(--chart-1)' : inB ? 'var(--chart-2)' : 'var(--surface-3)';
              return <span key={b} title={`(${a}, ${b}) sum ${a + b}`} style={{ aspectRatio: '1', borderRadius: 6, background: bg, opacity: inA || inB ? 0.9 : 1, display: 'grid', placeItems: 'center', fontSize: 10, color: inA || inB ? '#fff' : 'var(--muted)' }}>{a + b}</span>;
            })}
          </div>
        ))}
      </div>
      <div className="legend"><span><i className="dot" style={{ background: 'var(--chart-1)' }} />A only</span><span><i className="dot" style={{ background: 'var(--chart-2)' }} />B only</span><span><i className="dot" style={{ background: 'var(--chart-3)' }} />A and B</span></div>
      <div className="metric-row">
        <Metric k="P(A)" v={`${nA}/36`} /><Metric k="P(B)" v={`${nB}/36`} /><Metric k="P(A and B)" v={`${nAB}/36`} /><Metric k="P(A or B)" v={`${nA + nB - nAB}/36`} /><Metric k="P(A | B)" v={nB ? fmt(nAB / nB, 3) : '—'} />
      </div>
      <p className="small mt-sm" style={{ marginBottom: 0 }}><b>{indep ? 'Independent' : 'Dependent'}:</b> P(A)·P(B) = {fmt((nA / 36) * (nB / 36), 4)} {indep ? '=' : '≠'} P(A and B) = {fmt(nAB / 36, 4)}. {nAB === 0 ? 'They are also mutually exclusive.' : ''}</p>
    </div>
  );
}

/* ---------------- Tree explorer ---------------- */

const TREE_PRESETS: Record<string, { title: string; first: { label: string; p: number }[]; cond: number[]; ev: string; notEv: string }> = {
  flu: { title: 'Rapid flu test', first: [{ label: 'Flu', p: 0.22 }, { label: 'No flu', p: 0.78 }], cond: [0.963, 0.026], ev: 'Test +', notEv: 'Test −' },
  ducks: { title: 'Duck pools', first: [{ label: 'Pool 1', p: 4 / 6 }, { label: 'Pool 2', p: 2 / 6 }], cond: [0.2, 0.7], ev: 'Gold', notEv: 'Red' },
  jed: { title: 'Jed\'s commute', first: [{ label: 'Car', p: 0.3 }, { label: 'Walk', p: 0.3 }, { label: 'Bus', p: 0.4 }], cond: [0.03, 0.1, 0.07], ev: 'Late', notEv: 'On time' },
};

export function TreeWidget({ preset = 'flu' }: { preset?: string }) {
  const [key, setKey] = useState(preset in TREE_PRESETS ? preset : 'flu');
  const t = TREE_PRESETS[key];
  const [first, setFirst] = useState(t.first.map((x) => x.p));
  const [cond, setCond] = useState(t.cond);
  const [given, setGiven] = useState<number | null>(null);
  const sw = (k: string) => { setKey(k); setFirst(TREE_PRESETS[k].first.map((x) => x.p)); setCond(TREE_PRESETS[k].cond); setGiven(null); };
  const norm = first.map((p, i) => (i === first.length - 1 ? Math.max(0, 1 - first.slice(0, -1).reduce((a, b) => a + b, 0)) : p));
  const paths = norm.map((p, i) => p * cond[i]);
  const total = paths.reduce((a, b) => a + b, 0);
  const root: TreeNode = { label: 'Start', children: t.first.map((f, i) => ({ label: f.label, p: fmt(norm[i], 3), children: [{ label: t.ev, p: fmt(cond[i], 3) }, { label: t.notEv, p: fmt(1 - cond[i], 3) }] })) };
  const hl = given === null ? norm.map((_, i) => `r/${i}/0`) : [`r/${given}/0`];
  return (
    <div className="widget">
      <div className="row wrap">{Object.entries(TREE_PRESETS).map(([k, v]) => <button key={k} className={`chip ${k === key ? 'primary' : ''}`} onClick={() => sw(k)}>{v.title}</button>)}</div>
      <TreeDiagram root={root} highlightPaths={hl} />
      <div className="grid grid-2 mt-sm">
        <div className="stack-sm">
          {t.first.map((f, i) => i < t.first.length - 1 && <Slider key={f.label} label={`P(${f.label})`} value={first[i]} min={0} max={1} step={0.01} onChange={(v) => setFirst(first.map((x, k) => (k === i ? v : x)))} format={(v) => fmt(v, 2)} />)}
          {t.first.map((f, i) => <Slider key={`c${f.label}`} label={`P(${t.ev} | ${f.label})`} value={cond[i]} min={0} max={1} step={0.001} onChange={(v) => setCond(cond.map((x, k) => (k === i ? v : x)))} format={(v) => fmt(v, 3)} />)}
        </div>
        <div className="stack-sm">
          {t.first.map((f, i) => (
            <button key={f.label} className={`plan-item ${given === i ? 'active' : ''}`} style={given === i ? { borderColor: 'var(--chart-2)' } : undefined} onClick={() => setGiven(given === i ? null : i)}>
              <span className="small">P({f.label} and {t.ev}) = {fmt(norm[i], 3)} × {fmt(cond[i], 3)} = <b>{fmt(paths[i], 4)}</b></span>
            </button>
          ))}
          <div className="metric-row">
            <Metric k={`P(${t.ev})`} v={fmt(total, 4)} />
            {given !== null && <Metric k={`P(${t.first[given].label} | ${t.ev})`} v={fmt(paths[given] / total, 4)} color="var(--chart-2)" />}
          </div>
          <p className="tiny muted" style={{ margin: 0 }}>Multiply along each path; add the paths that end in "{t.ev}". Click a path to compute the reverse conditional: path ÷ total.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Venn sliders ---------------- */

export function VennWidget() {
  const [pa, setPa] = useState(0.42);
  const [pb, setPb] = useState(0.77);
  const [pab, setPab] = useState(0.31);
  const ab = Math.min(pab, pa, pb, Math.max(0, pa + pb - 0) );
  const maxAB = Math.min(pa, pb);
  const minAB = Math.max(0, pa + pb - 1);
  const both = Math.max(minAB, Math.min(maxAB, ab));
  const or = pa + pb - both;
  const indep = Math.abs(both - pa * pb) < 0.005;
  return (
    <div className="widget">
      <Venn labels={['A', 'B']} onlyA={fmt(pa - both, 2)} both={fmt(both, 2)} onlyB={fmt(pb - both, 2)} neither={fmt(1 - or, 2)} highlight={['AB']} />
      <div className="widget-controls">
        <Slider label="P(A)" value={pa} min={0} max={1} step={0.01} onChange={setPa} format={(v) => fmt(v, 2)} />
        <Slider label="P(B)" value={pb} min={0} max={1} step={0.01} onChange={setPb} format={(v) => fmt(v, 2)} />
        <Slider label={`P(A and B) (${fmt(minAB, 2)}–${fmt(maxAB, 2)})`} value={both} min={minAB} max={maxAB} step={0.01} onChange={setPab} format={(v) => fmt(v, 2)} />
      </div>
      <div className="metric-row">
        <Metric k="P(A or B)" v={fmt(or, 3)} /><Metric k="Neither" v={fmt(1 - or, 3)} /><Metric k="P(A | B)" v={pb ? fmt(both / pb, 3) : '—'} />
      </div>
      <p className="small mt-sm" style={{ marginBottom: 0 }}>{both === 0 ? 'Mutually exclusive (no overlap) — and therefore dependent.' : indep ? `Independent: P(A)·P(B) = ${fmt(pa * pb, 3)} ≈ P(A and B).` : `Not mutually exclusive; ${Math.abs(both - pa * pb) < 0.005 ? 'independent' : 'dependent'} (P(A)·P(B) = ${fmt(pa * pb, 3)}).`}</p>
    </div>
  );
}

/* ---------------- Contingency table conditioning ---------------- */

export function ContingencyWidget({ table = 'superheroes' }: { table?: string }) {
  const [id, setId] = useState(table);
  const t = tableById(id);
  const [given, setGiven] = useState<{ kind: 'row' | 'col'; i: number } | null>(null);
  const [event, setEvent] = useState<{ kind: 'row' | 'col'; i: number } | null>(null);
  const [clickMode, setClickMode] = useState<'event' | 'given'>('event');
  const rowTot = t.counts.map((r) => r.reduce((a, b) => a + b, 0));
  const colTot = t.cols.map((_, j) => t.counts.reduce((a, r) => a + r[j], 0));
  const grand = rowTot.reduce((a, b) => a + b, 0);
  const inSel = (sel: typeof given, i: number, j: number) => !!sel && (sel.kind === 'row' ? sel.i === i : sel.i === j);
  const evName = event ? (event.kind === 'row' ? t.rows[event.i] : t.cols[event.i]) : '';
  const gName = given ? (given.kind === 'row' ? t.rows[given.i] : t.cols[given.i]) : '';
  const evCount = event ? (event.kind === 'row' ? rowTot[event.i] : colTot[event.i]) : 0;
  const gCount = given ? (given.kind === 'row' ? rowTot[given.i] : colTot[given.i]) : grand;
  const both = event && given ? t.counts.reduce((acc, r, i) => acc + r.reduce((a, c, j) => a + (inSel(event, i, j) && inSel(given, i, j) ? c : 0), 0), 0) : 0;
  return (
    <div className="widget">
      <div className="row wrap">{TABLES.filter((x) => x.id !== 'medals').map((x) => <button key={x.id} className={`chip ${x.id === id ? 'primary' : ''}`} onClick={() => { setId(x.id); setGiven(null); setEvent(null); }}>{x.title}</button>)}</div>
      <p className="small muted mt-sm">Click a row/column header to set the <b>event</b>; shift-click (or use the toggle) to set the <b>given</b> condition.</p>
      <Seg options={[{ id: 'event', label: 'Clicking sets: event' }, { id: 'given', label: 'Clicking sets: given' }]} value={clickMode} onChange={setClickMode} label="Click mode" />
      <div className="table-scroll mt-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th className="rh">{t.rowVar} \ {t.colVar}</th>
              {t.cols.map((c, j) => <th key={c} style={{ cursor: 'pointer', background: event?.kind === 'col' && event.i === j ? 'var(--primary-soft)' : given?.kind === 'col' && given.i === j ? 'var(--warn-soft)' : undefined }} onClick={(e) => pick(e, { kind: 'col', i: j })}>{c}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={r}>
                <td className="rh" style={{ cursor: 'pointer', background: event?.kind === 'row' && event.i === i ? 'var(--primary-soft)' : given?.kind === 'row' && given.i === i ? 'var(--warn-soft)' : undefined }} onClick={(e) => pick(e, { kind: 'row', i })}>{r}</td>
                {t.counts[i].map((c, j) => <td key={j} className={given && !inSel(given, i, j) ? 'dim' : event && inSel(event, i, j) && (!given || inSel(given, i, j)) ? 'hl' : ''}>{c}</td>)}
                <td className={given && given.kind === 'col' ? 'dim' : ''}>{rowTot[i]}</td>
              </tr>
            ))}
            <tr><td className="rh">Total</td>{colTot.map((c, j) => <td key={j} className={given && given.kind === 'row' ? 'dim' : ''}>{c}</td>)}<td>{grand}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="metric-row">
        <Metric k={event ? `P(${evName})` : 'P(event)'} v={event ? `${evCount}/${grand} = ${fmt(evCount / grand, 3)}` : '—'} />
        <Metric k={event && given ? `P(${evName} | ${gName})` : 'P(event | given)'} v={event && given ? `${both}/${gCount} = ${fmt(both / gCount, 3)}` : '—'} color="var(--chart-2)" />
      </div>
      {event && given && <p className="small mt-sm" style={{ marginBottom: 0 }}>{Math.abs(both / gCount - evCount / grand) < 0.0005 ? 'Equal → these events are independent.' : `P(${evName}) ≠ P(${evName} | ${gName}) → dependent: knowing "${gName}" changes the probability.`}</p>}
      <div className="widget-controls"><button className="btn sm ghost" onClick={() => { setGiven(null); setEvent(null); }}>Clear</button></div>
    </div>
  );
  function pick(e: React.MouseEvent, sel: { kind: 'row' | 'col'; i: number }) {
    const asGiven = e.shiftKey || clickMode === 'given';
    if (asGiven) setGiven(given && given.kind === sel.kind && given.i === sel.i ? null : sel);
    else setEvent(event && event.kind === sel.kind && event.i === sel.i ? null : sel);
  }
}

/* ---------------- Binomial explorer ---------------- */

export function BinomialWidget({ n: n0 = 10, p: p0 = 0.25 }: { n?: number; p?: number }) {
  const [n, setN] = useState(n0);
  const [p, setP] = useState(p0);
  const [k, setK] = useState(6);
  const [op, setOp] = useState<'eq' | 'ge' | 'le'>('ge');
  const xs = Array.from({ length: n + 1 }, (_, i) => i);
  const kk = Math.min(k, n);
  const prob = binomProb(n, p, op, kk);
  return (
    <div className="widget">
      <div className="row wrap">
        <button className="chip" onClick={() => { setN(10); setP(0.25); setK(6); setOp('ge'); }}>Mr. Halter (4 choices)</button>
        <button className="chip" onClick={() => { setN(10); setP(1 / 3); setK(6); setOp('ge'); }}>Mr. Athey (3 choices)</button>
        <button className="chip" onClick={() => { setN(6); setP(0.75); setK(5); setOp('ge'); }}>Penalty kicks</button>
        <button className="chip" onClick={() => { setN(3); setP(0.72); setK(3); setOp('eq'); }}>Free throws</button>
      </div>
      <ProbDist x={xs} p={xs.map((x) => binomPmf(n, p, x))} highlight={(x) => (op === 'eq' ? x === kk : op === 'ge' ? x >= kk : x <= kk)} xLabel="Number of successes" markers={[{ value: binomMean(n, p), label: 'μ', dash: true }]} />
      <div className="widget-controls">
        <Slider label="n (trials)" value={n} min={1} max={40} step={1} onChange={setN} />
        <Slider label="p (success)" value={p} min={0.01} max={0.99} step={0.01} onChange={setP} format={(v) => fmt(v, 2)} />
        <Slider label="k" value={kk} min={0} max={n} step={1} onChange={setK} />
        <Seg options={[{ id: 'eq', label: 'X = k' }, { id: 'ge', label: 'X ≥ k' }, { id: 'le', label: 'X ≤ k' }]} value={op} onChange={setOp} label="Event" />
      </div>
      <div className="metric-row">
        <Metric k={`P(X ${op === 'eq' ? '=' : op === 'ge' ? '≥' : '≤'} ${kk})`} v={fmt(prob, 4)} color="var(--chart-2)" />
        <Metric k="μ = np" v={fmt(binomMean(n, p), 3)} />
        <Metric k="σ = √(npq)" v={fmt(binomSd(n, p), 3)} />
      </div>
    </div>
  );
}

/* ---------------- Free throws (Darius Washington) ---------------- */

export function FreeThrowsWidget() {
  const [p, setP] = useState(0.72);
  const [shots, setShots] = useState<boolean[]>([]);
  const [sim, setSim] = useState<{ win: number; ot: number; lose: number } | null>(null);
  const made = shots.filter(Boolean).length;
  const left = 3 - shots.length;
  // Memphis trails 75–73: needs 3 makes to win, exactly 2 for OT.
  const need = (m: number) => {
    let win = 0, ot = 0, lose = 0;
    for (let x = 0; x <= left; x++) {
      const pr = binomPmf(left, p, x);
      const tot = m + x;
      if (tot >= 3) win += pr; else if (tot === 2) ot += pr; else lose += pr;
    }
    return { win, ot, lose };
  };
  const cur = need(made);
  const simulate = () => {
    let win = 0, ot = 0, lose = 0;
    for (let g = 0; g < 1000; g++) {
      let mk = 0;
      for (let s = 0; s < 3; s++) if (Math.random() < p) mk++;
      if (mk === 3) win++; else if (mk === 2) ot++; else lose++;
    }
    setSim({ win, ot, lose });
  };
  return (
    <div className="widget">
      <div className="row wrap between">
        <div className="row"><span className="chip">Louisville 75</span><span className="chip primary">Memphis {73 + made}</span><span className="small muted">{left} shot{left === 1 ? '' : 's'} left</span></div>
        <div className="row" style={{ gap: 4 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', background: i < shots.length ? (shots[i] ? 'var(--success-strong)' : 'var(--danger)') : 'var(--surface-3)', color: '#fff', fontSize: 12 }}>{i < shots.length ? (shots[i] ? '✓' : '✗') : '🏀'}</span>)}</div>
      </div>
      <div className="metric-row">
        <Metric k="P(Memphis wins)" v={fmt(cur.win, 3)} color="var(--success)" />
        <Metric k="P(overtime)" v={fmt(cur.ot, 3)} />
        <Metric k="P(Memphis loses)" v={fmt(cur.lose, 3)} color="var(--danger)" />
      </div>
      <div className="widget-controls">
        <button className="btn sm primary" disabled={left === 0} onClick={() => setShots([...shots, Math.random() < p])}>Shoot (random, p = {fmt(p, 2)})</button>
        <button className="btn sm" disabled={left === 0} onClick={() => setShots([...shots, true])}>Make</button>
        <button className="btn sm" disabled={left === 0} onClick={() => setShots([...shots, false])}>Miss</button>
        <button className="btn sm ghost" onClick={() => setShots([])}>Reset</button>
        <Slider label="Free-throw %" value={p} min={0.3} max={0.95} step={0.01} onChange={(v) => { setP(v); setShots([]); }} format={(v) => `${Math.round(v * 100)}%`} />
      </div>
      <div className="widget-controls">
        <button className="btn sm" onClick={simulate}>Simulate 1,000 games</button>
        {sim && <span className="small">Wins {sim.win} · OT {sim.ot} · Losses {sim.lose} — compare with {fmt(p ** 3, 3)}, {fmt(3 * p * p * (1 - p), 3)}, {fmt(1 - p ** 3 - 3 * p * p * (1 - p), 3)}.</span>}
      </div>
    </div>
  );
}

/* ---------------- Expected value simulation ---------------- */

const EV_PRESETS: Record<string, { title: string; x: number[]; p: number[] }> = {
  roulette: { title: '$100 on black', x: [100, -100], p: [18 / 38, 20 / 38] },
  spinner: { title: 'Spinner ($3, $20 prize)', x: [-3, -2, 2, 17], p: [3 / 16, 8 / 16, 4 / 16, 1 / 16] },
  slots: { title: 'Two slot machines (Z)', x: [-40, 0, 40], p: [0.56, 0.38, 0.06] },
};

export function ExpectedValueWidget({ preset = 'roulette' }: { preset?: string }) {
  const [key, setKey] = useState(preset in EV_PRESETS ? preset : 'roulette');
  const d = EV_PRESETS[key];
  const [plays, setPlays] = useState<number[]>([]);
  const mu = expectedValue(d);
  const run = (n: number) => {
    const out = plays.slice();
    for (let i = 0; i < n; i++) {
      let u = Math.random();
      let k = 0;
      while (k < d.p.length - 1 && u > d.p[k]) { u -= d.p[k]; k++; }
      out.push(d.x[k]);
    }
    setPlays(out.slice(-50000));
  };
  const avg = useMemo(() => {
    const pts: number[] = [];
    let s = 0;
    const step = Math.max(1, Math.floor(plays.length / 120));
    plays.forEach((v, i) => { s += v; if ((i + 1) % step === 0 || i === plays.length - 1) pts.push(s / (i + 1)); });
    return pts;
  }, [plays]);
  const lo = Math.min(...d.x), hi = Math.max(...d.x);
  return (
    <div className="widget">
      <div className="row wrap">{Object.entries(EV_PRESETS).map(([k, v]) => <button key={k} className={`chip ${k === key ? 'primary' : ''}`} onClick={() => { setKey(k); setPlays([]); }}>{v.title}</button>)}</div>
      <ProbDist x={d.x} p={d.p} xLabel="Net winnings ($)" height={170} markers={[{ value: mu, label: 'E(X)', dash: true }]} />
      {plays.length > 0 && (
        <LineChart series={[{ label: 'Average winnings per play', values: avg }, { label: 'E(X)', values: avg.map(() => mu), color: 'var(--chart-2)' }]} xLabels={avg.map((_, i) => String(Math.round(((i + 1) / avg.length) * plays.length)))} yMax={Math.max(Math.abs(lo), Math.abs(hi))} yFormat={(v) => `$${fmt(v, 1)}`} height={180} />
      )}
      <div className="metric-row">
        <Metric k="E(X)" v={`$${fmt(mu, 2)}`} /><Metric k="σ" v={`$${fmt(distSd(d), 2)}`} /><Metric k="Plays" v={plays.length.toLocaleString()} /><Metric k="Your average" v={plays.length ? `$${fmt(plays.reduce((a, b) => a + b, 0) / plays.length, 2)}` : '—'} /><Metric k="Total" v={plays.length ? `$${fmt(plays.reduce((a, b) => a + b, 0), 0)}` : '—'} />
      </div>
      <div className="widget-controls">{[10, 100, 1000, 10000].map((n) => <button key={n} className="btn sm" onClick={() => run(n)}>Play {n.toLocaleString()}</button>)}<button className="btn sm ghost" onClick={() => setPlays([])}>Reset</button></div>
      <p className="tiny muted" style={{ marginBottom: 0 }}>Note: the y-axis shows average winnings; it can be negative (losses). The running average settles near E(X) as plays increase.</p>
    </div>
  );
}

/* ---------------- Transformations ---------------- */

export function TransformWidget() {
  const base = { x: [100, -100], p: [18 / 38, 20 / 38] };
  const [mult, setMult] = useState(1);
  const [add, setAdd] = useState(0);
  const d = transformDist(base, mult, add);
  return (
    <div className="widget">
      <p className="small muted" style={{ marginTop: 0 }}>Start: $100 roulette bet on black (E = −$5.26, σ ≈ $99.86). New winnings = {fmt(mult, 2)}·X {add >= 0 ? '+' : '−'} {fmt(Math.abs(add), 0)}.</p>
      <ProbDist x={d.x.map((v) => Math.round(v * 100) / 100)} p={d.p} xLabel="Winnings ($)" height={170} markers={[{ value: expectedValue(d), label: 'E', dash: true }]} />
      <div className="widget-controls">
        <Slider label="Multiply bet by" value={mult} min={0.25} max={2} step={0.25} onChange={setMult} format={(v) => `×${v}`} />
        <Slider label="Add constant (fee is negative)" value={add} min={-20} max={20} step={1} onChange={setAdd} format={(v) => `${v >= 0 ? '+' : '−'}$${Math.abs(v)}`} />
      </div>
      <div className="metric-row">
        <Metric k="Mean E" v={`$${fmt(expectedValue(d), 2)}`} />
        <Metric k="SD σ" v={`$${fmt(distSd(d), 2)}`} />
        <Metric k="Variance" v={fmt(distSd(d) ** 2, 0)} />
      </div>
      <p className="small mt-sm" style={{ marginBottom: 0 }}>Adding a constant shifts the mean but leaves the SD at ${fmt(distSd(base) * Math.abs(mult), 2)}. Multiplying by {fmt(mult, 2)} scales the mean and SD by {fmt(mult, 2)} (variance by {fmt(mult * mult, 4)}). The shape never changes.</p>
    </div>
  );
}
