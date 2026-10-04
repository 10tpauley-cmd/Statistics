import { useLearner } from '../state/store';
import { accuracy, conceptualVsCalc, dayKey, levelFromXp, liveStreak, misconceptionCounts, typeAccuracy } from '../engine/learner';
import { ACHIEVEMENTS } from '../engine/achievements';
import { DIMENSIONS, DIM_LABEL } from '../engine/types';
import { CONCEPTS } from '../content/concepts';
import { UNITS } from '../content/units';
import { MISCONCEPTION_BY_ID } from '../content/misconceptions';
import { useMasteryMap } from '../components/hooks';
import { BarChart, LineChart } from '../components/charts/Charts';
import { Bar, Ring, fmtDuration, masteryColor, Empty, LinkBtn } from '../components/ui';

const TYPE_NAMES: Record<string, string> = {
  recognition: 'Recognition', calculation: 'Calculation', interpretation: 'Interpretation', conceptual: 'Concept', misconception: 'Misconception',
  'real-world': 'Real world', graph: 'Graph', 'multi-step': 'Multi-step', method: 'Method', exam: 'Exam', 'free-response': 'Written',
};

export function ProgressPage() {
  const s = useLearner();
  const mm = useMasteryMap(s);
  const now = Date.now();
  const days = Array.from({ length: 14 }, (_, i) => now - (13 - i) * 86400000);
  const labels = days.map((t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()}`; });
  const daily = days.map((t) => s.daily[dayKey(t)]);
  const overall = CONCEPTS.reduce((a, c) => a + mm[c.id].overall * c.importance, 0) / CONCEPTS.reduce((a, c) => a + c.importance, 0);
  const mastered = CONCEPTS.filter((c) => mm[c.id].mastered).length;
  const totalMs = Object.values(s.daily).reduce((a, d) => a + d.ms, 0);
  const acc = accuracy(s);
  const split = conceptualVsCalc(s);
  const types = typeAccuracy(s);
  const mis = Object.entries(misconceptionCounts(s, false)).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const openMis = misconceptionCounts(s, true);
  const weeks = 12;
  const heatDays = Array.from({ length: weeks * 7 }, (_, i) => now - (weeks * 7 - 1 - i) * 86400000);
  const maxMs = Math.max(1, ...heatDays.map((t) => s.daily[dayKey(t)]?.ms ?? 0));
  const exams = s.exams.filter((e) => e.kind !== 'placement').slice(0, 10).reverse();

  if (!s.attempts.length && !Object.keys(s.lessons).length) {
    return <div className="content narrow"><div className="page-head"><div><h1>Progress</h1></div></div><Empty icon="📈" title="Your analytics will appear here" action={<LinkBtn to="/learn" className="btn primary">Start a lesson</LinkBtn>}>Complete lessons and practice problems to see mastery, accuracy, study time, and mistake trends.</Empty></div>;
  }

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Progress</h1>
          <p>Mastery is built from evidence across five skills — not from time spent or problems clicked through.</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ gap: 12 }}>
        <div className="card pad-sm row" style={{ gap: 12 }}><Ring value={overall} size={56} color="var(--primary)" /><div className="stat-card"><div className="k">Overall mastery</div><div className="small muted">{mastered} of {CONCEPTS.length} mastered</div></div></div>
        <div className="card pad-sm stat-card"><div className="k">Problems</div><div className="v">{s.attempts.length}</div><div className="tiny muted">{acc === null ? '' : `${Math.round(acc * 100)}% accuracy overall`}</div></div>
        <div className="card pad-sm stat-card"><div className="k">Study time</div><div className="v">{fmtDuration(totalMs)}</div><div className="tiny muted">{Object.values(s.daily).filter((d) => d.ms > 0).length} active days</div></div>
        <div className="card pad-sm stat-card"><div className="k">Streak · Level</div><div className="v">🔥 {liveStreak(s)} · Lv {levelFromXp(s.xp)}</div><div className="tiny muted">best streak {s.streak.best} · {s.xp} XP</div></div>
      </div>

      <div className="grid grid-2 mt">
        <div className="card">
          <h3>Accuracy (last 14 days)</h3>
          <LineChart series={[{ label: 'Daily accuracy', values: daily.map((d) => (d && d.problems ? d.correct / d.problems : null)) }]} xLabels={labels} height={200} />
        </div>
        <div className="card">
          <h3>Study minutes per day</h3>
          <BarChart categories={labels.map((l, i) => ({ label: l, value: Math.round((daily[i]?.ms ?? 0) / 60000) }))} yLabel="Minutes" height={200} showValues={false} />
        </div>
      </div>

      <div className="card mt">
        <div className="card-title"><h3>Activity (12 weeks)</h3><span className="tiny muted">darker = more study time</span></div>
        <div className="heat" style={{ gridTemplateColumns: `repeat(${weeks * 7 > 60 ? 42 : 30}, minmax(10px, 1fr))` }} role="img" aria-label="Study activity heatmap">
          {heatDays.map((t) => {
            const ms = s.daily[dayKey(t)]?.ms ?? 0;
            return <i key={t} title={`${new Date(t).toLocaleDateString()}: ${Math.round(ms / 60000)} min`} style={{ background: ms ? `color-mix(in srgb, var(--primary) ${Math.round(25 + 75 * (ms / maxMs))}%, var(--surface-3))` : undefined }} />;
          })}
        </div>
      </div>

      <div className="card mt">
        <div className="card-title"><h3>Mastery by concept and skill</h3><span className="tiny muted">— = skill doesn't apply</span></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th className="rh">Concept</th>{DIMENSIONS.map((d) => <th key={d}>{DIM_LABEL[d]}</th>)}<th>Overall</th></tr></thead>
            <tbody>
              {UNITS.map((u) => [
                <tr key={u.id}><td className="rh" colSpan={7} style={{ color: `var(--${u.color})`, fontWeight: 800 }}>Unit {u.number} · {u.title}</td></tr>,
                ...CONCEPTS.filter((c) => c.unit === u.id).map((c) => {
                  const info = mm[c.id];
                  return (
                    <tr key={c.id}>
                      <td className="rh"><a href={`#/learn/${c.id}`}>{c.title}</a>{info.mastered ? ' ★' : ''}</td>
                      {DIMENSIONS.map((d) => (
                        <td key={d} style={info.applicable.includes(d) && info.dims[d] > 0 ? { background: `color-mix(in srgb, ${masteryColor(info.dims[d])} 22%, transparent)` } : undefined}>
                          {info.applicable.includes(d) ? `${Math.round(info.dims[d] * 100)}` : '—'}
                        </td>
                      ))}
                      <td><b>{Math.round(info.overall * 100)}%</b></td>
                    </tr>
                  );
                }),
              ])}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2 mt">
        <div className="card">
          <h3>Accuracy by question type</h3>
          {Object.keys(types).length ? (
            <BarChart categories={Object.entries(types).filter(([, v]) => v!.n >= 1).map(([k, v]) => ({ label: TYPE_NAMES[k] ?? k, value: Math.round((v!.c / v!.n) * 100) }))} yLabel="% correct" percent height={220} />
          ) : <p className="small muted">No answers yet.</p>}
          <div className="metric-row">
            <div className="metric"><div className="k">Conceptual</div><div className="v">{split.concept === null ? '—' : `${Math.round(split.concept * 100)}%`}</div></div>
            <div className="metric"><div className="k">Calculation</div><div className="v">{split.calc === null ? '—' : `${Math.round(split.calc * 100)}%`}</div></div>
          </div>
          {split.calc !== null && split.concept !== null && Math.abs(split.calc - split.concept) > 0.15 && (
            <p className="small mt-sm" style={{ marginBottom: 0 }}>{split.calc > split.concept ? 'You compute well but miss more on meaning — try interpretation and Teach It.' : 'Your ideas are solid; calculation slips cost you more — use the Calculator to check steps.'}</p>
          )}
        </div>
        <div className="card">
          <h3>Mistake patterns</h3>
          {mis.length ? (
            <div className="stack-sm">
              {mis.map(([id, n]) => (
                <a key={id} href={`#/mistakes?m=${id}`} style={{ color: 'var(--text)' }}>
                  <div className="row between small"><span>{MISCONCEPTION_BY_ID[id]?.title ?? id}</span><span className="muted">{openMis[id] ?? 0} open / {n} total</span></div>
                  <Bar value={(n - (openMis[id] ?? 0)) / n} color="var(--success-strong)" label="Share resolved" />
                </a>
              ))}
              <div className="tiny muted">Green = share of that mistake you've since fixed.</div>
            </div>
          ) : <p className="small muted">No mistake patterns yet.</p>}
        </div>
      </div>

      {exams.length > 1 && (
        <div className="card mt">
          <h3>Exam scores</h3>
          <LineChart series={[{ label: 'Exam score', values: exams.map((e) => e.score) }]} xLabels={exams.map((e) => new Date(e.t).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }))} height={200} />
        </div>
      )}

      <div className="card mt">
        <div className="card-title"><h3>Achievements</h3><span className="small muted">{Object.keys(s.achievements).length}/{ACHIEVEMENTS.length}</span></div>
        <div className="grid grid-4" style={{ gap: 10 }}>
          {ACHIEVEMENTS.map((a) => {
            const got = s.achievements[a.id];
            return (
              <div key={a.id} className="card flat pad-sm" style={{ opacity: got ? 1 : 0.5, filter: got ? undefined : 'grayscale(1)' }}>
                <div style={{ fontSize: '1.5rem' }} aria-hidden="true">{a.icon}</div>
                <div className="bold small">{a.title}</div>
                <div className="tiny muted">{a.description}</div>
                {got && <div className="tiny" style={{ color: 'var(--success)', marginTop: 4 }}>Earned {new Date(got).toLocaleDateString()}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
