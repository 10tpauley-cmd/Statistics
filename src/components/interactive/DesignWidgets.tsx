import { useMemo, useState } from 'react';
import { makeRng, randomSeed } from '../../lib/stats/random';
import { mean, sd } from '../../lib/stats/descriptive';
import { fmt } from '../../lib/stats/format';
import { DotPlot } from '../charts/Charts';
import { Metric, Seg } from '../ui';

/* ---------------- Sampling methods: the wood-duck park (p.64–66) ---------------- */

const COLS = 12;
const ROWS = 12;
const N_SQUARES = COLS * ROWS;
const SAMPLE_N = 12;
const ENTRANCE = 124; // the researcher's convenience starting square from the course example

type Method = 'srs' | 'systematic' | 'stratified' | 'cluster' | 'convenience';

const METHOD_INFO: Record<Method, { label: string; how: string }> = {
  srs: { label: 'Simple random', how: 'Every group of 12 squares is equally likely: number the squares 1–144 and use a random number generator to pick 12.' },
  systematic: { label: 'Systematic', how: 'Pick a random start from 1–12, then take every 12th square after it.' },
  stratified: { label: 'Stratified', how: 'Split the park into strata (each row of the grid), then randomly pick one square from every row.' },
  cluster: { label: 'Cluster', how: 'Split the park into clusters (each column), randomly pick one cluster, and survey every square in it.' },
  convenience: { label: 'Convenience', how: 'Survey the 12 squares easiest to reach — the ones closest to the entrance at square #124.' },
};

const rowOf = (sq: number) => Math.floor((sq - 1) / COLS);
const colOf = (sq: number) => (sq - 1) % COLS;
const isLake = (sq: number) => {
  const r = rowOf(sq), c = colOf(sq);
  return r >= 3 && r <= 6 && c >= 4 && c <= 8;
};
const lakeDistance = (sq: number) => {
  const r = rowOf(sq), c = colOf(sq);
  const dr = r < 3 ? 3 - r : r > 6 ? r - 6 : 0;
  const dc = c < 4 ? 4 - c : c > 8 ? c - 8 : 0;
  return Math.max(dr, dc);
};

/** Fixed "true" duck counts: wood ducks cluster on and around the lake. */
const DUCKS: number[] = (() => {
  const rng = makeRng(20240);
  return Array.from({ length: N_SQUARES }, (_, i) => {
    const d = lakeDistance(i + 1);
    const base = d === 0 ? 7 : d === 1 ? 6 : d === 2 ? 4 : d === 3 ? 2 : 1;
    return Math.max(0, base + rng.int(-2, 2));
  });
})();
const TRUE_TOTAL = DUCKS.reduce((a, b) => a + b, 0);

const CONVENIENCE: number[] = (() => {
  const er = rowOf(ENTRANCE), ec = colOf(ENTRANCE);
  return Array.from({ length: N_SQUARES }, (_, i) => i + 1)
    .map((sq) => ({ sq, d: Math.hypot(rowOf(sq) - er, colOf(sq) - ec) + sq / 10000 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, SAMPLE_N)
    .map((x) => x.sq);
})();

function drawSample(method: Method, seed: number): number[] {
  const rng = makeRng(seed);
  switch (method) {
    case 'srs':
      return rng.sample(Array.from({ length: N_SQUARES }, (_, i) => i + 1), SAMPLE_N);
    case 'systematic': {
      const start = rng.int(1, SAMPLE_N);
      return Array.from({ length: SAMPLE_N }, (_, k) => start + k * SAMPLE_N);
    }
    case 'stratified':
      return Array.from({ length: ROWS }, (_, r) => r * COLS + rng.int(1, COLS));
    case 'cluster': {
      const c = rng.int(0, COLS - 1);
      return Array.from({ length: ROWS }, (_, r) => r * COLS + c + 1);
    }
    case 'convenience':
      return CONVENIENCE;
  }
}

const estimateOf = (sample: number[]) => (sample.reduce((a, sq) => a + DUCKS[sq - 1], 0) / sample.length) * N_SQUARES;

export function SamplingWidget() {
  const [method, setMethod] = useState<Method>('srs');
  const [sample, setSample] = useState<number[]>([]);
  const [reveal, setReveal] = useState(false);
  const [runs, setRuns] = useState<Partial<Record<Method, number[]>>>({});
  const est = sample.length ? estimateOf(sample) : null;
  const draw = () => {
    const s = drawSample(method, randomSeed());
    setSample(s);
    setRuns((r) => ({ ...r, [method]: [...(r[method] ?? []), estimateOf(s)] }));
  };
  const repeat = (n: number) => {
    const out: number[] = [];
    let last: number[] = [];
    for (let i = 0; i < n; i++) {
      last = drawSample(method, randomSeed());
      out.push(estimateOf(last));
    }
    setSample(last);
    setRuns((r) => ({ ...r, [method]: [...(r[method] ?? []), ...out].slice(-600) }));
  };
  const current = runs[method] ?? [];
  const sampleSet = new Set(sample);
  return (
    <div className="widget">
      <Seg options={(Object.keys(METHOD_INFO) as Method[]).map((m) => ({ id: m, label: METHOD_INFO[m].label }))} value={method} onChange={(m) => { setMethod(m); setSample([]); }} label="Sampling method" />
      <p className="small mt-sm" style={{ marginBottom: 8 }}><b>{METHOD_INFO[method].label}:</b> {METHOD_INFO[method].how}</p>
      <div className="row wrap" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: '1 1 300px', maxWidth: 420 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 2 }} role="img" aria-label={`Park grid of 144 squares. ${sample.length ? `${sample.length} squares selected: ${sample.join(', ')}` : 'No sample drawn yet.'}`}>
            {DUCKS.map((d, i) => {
              const sq = i + 1;
              const sel = sampleSet.has(sq);
              const lake = isLake(sq);
              return (
                <span key={sq} title={`Square #${sq}${sel || reveal ? ` — ${d} ducks` : ''}`}
                  style={{
                    aspectRatio: '1', borderRadius: 4, fontSize: 9, display: 'grid', placeItems: 'center', fontVariantNumeric: 'tabular-nums',
                    background: lake ? 'color-mix(in srgb, var(--chart-1) 28%, var(--surface))' : 'color-mix(in srgb, var(--chart-3) 18%, var(--surface))',
                    outline: sel ? '2px solid var(--chart-2)' : undefined, outlineOffset: -2,
                    fontWeight: sel ? 800 : 500, color: sel ? 'var(--text)' : 'var(--muted)',
                  }}>
                  {sq === ENTRANCE && !sel && !reveal ? '🚪' : sel || reveal ? d : ''}
                </span>
              );
            })}
          </div>
          <div className="legend">
            <span><i className="dot" style={{ background: 'color-mix(in srgb, var(--chart-1) 45%, var(--surface))' }} />Lake</span>
            <span><i className="dot" style={{ background: 'color-mix(in srgb, var(--chart-3) 40%, var(--surface))' }} />Forest</span>
            <span><i className="dot" style={{ border: '2px solid var(--chart-2)' }} />In sample</span>
            <span>🚪 Entrance (#{ENTRANCE})</span>
          </div>
        </div>
        <div style={{ flex: '1 1 240px' }}>
          <div className="metric-row" style={{ marginTop: 0 }}>
            <Metric k="Sample mean per square" v={est === null ? '—' : fmt(est / N_SQUARES, 2)} />
            <Metric k="Estimated total" v={est === null ? '—' : fmt(est, 0)} color="var(--chart-2)" />
            <Metric k="True total" v={reveal ? TRUE_TOTAL : '?'} />
          </div>
          <div className="widget-controls">
            <button className="btn sm primary" onClick={draw}>Draw a sample</button>
            <button className="btn sm" onClick={() => repeat(100)}>Repeat 100×</button>
            <label className="row small"><input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} /> Reveal every square</label>
          </div>
          <p className="tiny muted" style={{ marginBottom: 0 }}>Estimate = (mean ducks per sampled square) × 144 squares.</p>
        </div>
      </div>
      {current.length > 1 && (
        <div className="mt">
          <div className="section-title">{current.length} estimates from {METHOD_INFO[method].label.toLowerCase()} samples</div>
          <DotPlot data={current.slice(-150)} xLabel="Estimated total ducks" domain={[0, Math.max(TRUE_TOTAL * 1.8, ...current)]} markers={[{ value: TRUE_TOTAL, label: `True total ${TRUE_TOTAL}`, color: 'var(--chart-3)' }]} />
        </div>
      )}
      {Object.keys(runs).length > 0 && (
        <div className="table-scroll mt-sm">
          <table className="data-table">
            <thead><tr><th className="rh">Method</th><th>Samples</th><th>Average estimate</th><th>Spread (SD)</th><th>Verdict</th></tr></thead>
            <tbody>
              {(Object.keys(METHOD_INFO) as Method[]).filter((m) => runs[m]?.length).map((m) => {
                const r = runs[m]!;
                const avg = mean(r);
                const off = Math.abs(avg - TRUE_TOTAL) / TRUE_TOTAL;
                return (
                  <tr key={m}>
                    <td className="rh">{METHOD_INFO[m].label}</td>
                    <td>{r.length}</td>
                    <td>{fmt(avg, 0)}</td>
                    <td>{r.length > 1 ? fmt(sd(r), 1) : '—'}</td>
                    <td>{r.length < 5 ? 'Run more' : off < 0.08 ? 'Centered on the truth' : 'Biased: misses the truth'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="tiny muted mt-sm" style={{ marginBottom: 0 }}>Every random method gives a different sample each time (sampling variability), but their estimates center on the true total. The convenience sample is the same every time — and always misses, because squares near the entrance are far from the lake.</p>
    </div>
  );
}

/* ---------------- Experimental design: label the Spotify study (p.60–61) ---------------- */

const ROLES = ['Explanatory variable', 'Response variable', 'Experimental units', 'Treatment', 'Control group', 'Randomization'] as const;
type Role = (typeof ROLES)[number];

const SPOTIFY: { id: string; text: string; role: Role; why: string }[] = [
  { id: 'access', text: 'Type of access (premium or free)', role: 'Explanatory variable', why: 'It is the variable the researchers think may cause a change — the "input".' },
  { id: 'time', text: 'Daily listening time (hours)', role: 'Response variable', why: 'It is the outcome they measure to see whether access type made a difference.' },
  { id: 'users', text: 'The 155 app users in the study', role: 'Experimental units', why: 'They are who receives the treatments.' },
  { id: 'premium', text: 'Giving a group of users premium access', role: 'Treatment', why: 'A treatment is a specific manipulation of the explanatory variable.' },
  { id: 'free', text: 'The group kept on free access', role: 'Control group', why: 'It provides the baseline to compare against.' },
  { id: 'random', text: 'Using a random number generator to decide who gets premium', role: 'Randomization', why: 'Random assignment makes the groups alike on average, so a difference in listening time can be blamed on access type.' },
];

const STUDY_TYPES: { text: string; experiment: boolean; why: string }[] = [
  { text: 'A streaming company randomly assigns users to premium or free access and records daily listening time.', experiment: true, why: 'The researchers **assigned** the treatment at random — an experiment. It can support cause-and-effect.' },
  { text: 'Researchers record how long preschoolers wait for a second marshmallow and check their outcomes years later.', experiment: false, why: 'Nobody assigned children to "wait" or "not wait" — they observed behavior. Home environment could confound the result.' },
  { text: 'A survey finds that students who play more video games are more likely to flunk a class.', experiment: false, why: 'Gaming wasn\'t assigned. Time spent on homework is a possible confounder tied to both gaming and grades.' },
];

export function ExperimentDesignWidget() {
  const [picks, setPicks] = useState<Record<string, Role | ''>>({});
  const [checked, setChecked] = useState(false);
  const [studyAns, setStudyAns] = useState<Record<number, boolean>>({});
  const score = SPOTIFY.filter((it) => picks[it.id] === it.role).length;
  const allPicked = SPOTIFY.every((it) => picks[it.id]);
  return (
    <div className="widget">
      <p className="small" style={{ marginTop: 0 }}><b>The study:</b> A music app wants to know whether premium access makes people listen more. It randomly assigns 155 users to premium or free access and records each user's daily listening time.</p>
      <div className="stack-sm">
        {SPOTIFY.map((it) => {
          const ok = picks[it.id] === it.role;
          return (
            <div key={it.id} className="part" style={{ padding: 10, borderColor: checked ? (ok ? 'var(--success-strong)' : 'var(--danger)') : undefined }}>
              <div className="row wrap between">
                <span className="small bold" style={{ flex: '1 1 220px' }}>{it.text}</span>
                <select className="select" style={{ width: 210, height: 34 }} value={picks[it.id] ?? ''} aria-label={`Role of: ${it.text}`}
                  onChange={(e) => { setPicks((p) => ({ ...p, [it.id]: e.target.value as Role })); setChecked(false); }}>
                  <option value="">Choose a role…</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {checked && <div className="tiny mt-sm" style={{ color: ok ? 'var(--success)' : 'var(--danger)' }}>{ok ? '✓ ' : `✗ It's the ${it.role.toLowerCase()}. `}{it.why}</div>}
            </div>
          );
        })}
      </div>
      <div className="widget-controls">
        <button className="btn sm primary" disabled={!allPicked} onClick={() => setChecked(true)}>Check my labels</button>
        {checked && <span className="small"><b>{score}/{SPOTIFY.length}</b> correct{score === SPOTIFY.length ? ' — you can read an experiment like a researcher.' : '. Fix the red ones and check again.'}</span>}
        <button className="btn sm ghost" onClick={() => { setPicks({}); setChecked(false); }}>Reset</button>
      </div>
      <hr />
      <div className="section-title">Experiment or observational study?</div>
      <div className="stack-sm">
        {STUDY_TYPES.map((s, i) => {
          const a = studyAns[i];
          return (
            <div key={i} className="part" style={{ padding: 10 }}>
              <div className="small">{s.text}</div>
              <div className="row wrap mt-sm">
                <button className={`chip ${a === true ? (s.experiment ? 'success' : 'danger') : ''}`} onClick={() => setStudyAns((x) => ({ ...x, [i]: true }))}>Experiment</button>
                <button className={`chip ${a === false ? (!s.experiment ? 'success' : 'danger') : ''}`} onClick={() => setStudyAns((x) => ({ ...x, [i]: false }))}>Observational</button>
              </div>
              {a !== undefined && <div className="tiny mt-sm" style={{ color: a === s.experiment ? 'var(--success)' : 'var(--danger)' }}>{a === s.experiment ? '✓ ' : '✗ '}{s.why.replace(/\*\*/g, '')}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Bias spotter (p.60) ---------------- */

const BIASES = ['Response bias', 'Undercoverage', 'Nonresponse bias', 'Voluntary response bias'] as const;
type Bias = (typeof BIASES)[number];

const BIAS_SCENARIOS: { text: string; answer: Bias; why: string }[] = [
  { text: 'A conservation group posts a poll on social media asking whether the county should protect local wetlands.', answer: 'Voluntary response bias', why: 'People decide for themselves whether to answer, so those with strong opinions dominate.' },
  { text: 'A college emails a survey to 300 randomly selected students. Only 41 reply.', answer: 'Nonresponse bias', why: 'The students were selected, but most didn\'t respond — and responders may differ from non-responders.' },
  { text: '"Given that it violates the academic integrity policy, have you ever used ChatGPT on an assignment?"', answer: 'Response bias', why: 'The wording pressures students toward "no", so answers are pushed in one direction.' },
  { text: 'To learn about the grocery habits of all city residents, researchers interview shoppers leaving a Whole Foods store.', answer: 'Undercoverage', why: 'Residents who don\'t shop at Whole Foods never had a chance to be selected.' },
  { text: 'A website, YouPolls, lets anyone vote on whether the speed limit should be raised.', answer: 'Voluntary response bias', why: 'Anyone who chooses to visit and vote is in the sample — they selected themselves.' },
  { text: 'A city mails a survey about park funding to homeowners who live next to parks.', answer: 'Undercoverage', why: 'Residents who don\'t live near a park (and renters) were left out of the selection process.' },
  { text: 'A newspaper summarizes opinions on a new law using the letters to the editor it received.', answer: 'Voluntary response bias', why: 'Letter writers chose to write in; they usually feel strongly.' },
  { text: 'A phone survey calls 1,000 random numbers; only about 10% of people complete it.', answer: 'Nonresponse bias', why: 'People were randomly chosen, but 90% didn\'t respond.' },
  { text: 'An interviewer asks, "Don\'t you agree that the hard-working teachers deserve a raise?"', answer: 'Response bias', why: 'A leading question influences the response.' },
  { text: 'A survey about internet use is conducted only through an online form sent to email addresses.', answer: 'Undercoverage', why: 'People without internet access or email were left out of the selection process entirely.' },
];

export function BiasSpotterWidget() {
  const [seed, setSeed] = useState(1);
  const order = useMemo(() => makeRng(seed).shuffle(BIAS_SCENARIOS.map((_, i) => i)), [seed]);
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<Bias | null>(null);
  const [score, setScore] = useState(0);
  const done = idx >= order.length;
  const s = done ? null : BIAS_SCENARIOS[order[idx]];
  const choose = (b: Bias) => {
    if (pick || !s) return;
    setPick(b);
    if (b === s.answer) setScore((x) => x + 1);
  };
  const restart = () => { setSeed(randomSeed()); setIdx(0); setPick(null); setScore(0); };
  return (
    <div className="widget">
      <div className="row between small">
        <span className="muted">Scenario {Math.min(idx + 1, order.length)} of {order.length}</span>
        <span className="chip primary">Score {score}</span>
      </div>
      {s ? (
        <>
          <p className="q-prompt mt-sm" style={{ fontSize: '1rem' }}>{s.text}</p>
          <div className="options" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {BIASES.map((b, i) => {
              const state = pick ? (b === s.answer ? 'correct' : b === pick ? 'wrong' : '') : '';
              return (
                <button key={b} className={`option ${state}`} disabled={!!pick} onClick={() => choose(b)}>
                  <span className="letter">{String.fromCharCode(65 + i)}</span>
                  <span>{b}</span>
                </button>
              );
            })}
          </div>
          {pick && (
            <div className={`feedback ${pick === s.answer ? 'good' : 'bad'}`}>
              <h4>{pick === s.answer ? 'Spot on!' : `Not quite — it's ${s.answer.toLowerCase()}.`}</h4>
              <div className="small">{s.why}</div>
              <div className="q-actions" style={{ marginTop: 10 }}><button className="btn sm primary" onClick={() => { setIdx((i) => i + 1); setPick(null); }}>Next scenario</button></div>
            </div>
          )}
        </>
      ) : (
        <div className="center" style={{ padding: '16px 0' }}>
          <div className="big-num">{score}/{order.length}</div>
          <p className="small muted">{score >= 9 ? 'Bias detective! You can see who got left out — and who left themselves in.' : 'Review the four definitions above, then try again — the order shuffles.'}</p>
          <button className="btn sm primary" onClick={restart}>Play again</button>
        </div>
      )}
    </div>
  );
}
