import type { ConceptId, SessionRecord } from '../engine/types';
import { CONCEPT_BY_ID } from '../content/concepts';
import { MISCONCEPTION_BY_ID } from '../content/misconceptions';
import { useLearner } from '../state/store';
import { masteryInfo } from '../engine/learner';
import { Icon } from './ui/Icon';
import { LinkBtn, fmtDuration } from './ui';
import { Mu } from './mascot/Mu';

export interface SessionResult {
  concept: ConceptId;
  correct: boolean;
  score: number;
  hints: number;
  misconception?: string;
}

/** STEP 37 — what you studied, how you did, what improved, what to do next. */
export function SessionSummary({ title, results, record, onAgain, againLabel = 'Keep practicing' }: { title: string; results: SessionResult[]; record: SessionRecord | null; onAgain?: () => void; againLabel?: string }) {
  const s = useLearner();
  const n = results.length;
  const correct = results.filter((r) => r.correct).length;
  const hints = results.reduce((a, r) => a + r.hints, 0);
  const concepts = [...new Set(results.map((r) => r.concept))];
  const before = record?.masteryBefore ?? {};
  const changes = concepts.map((id) => ({ id, before: before[id] ?? 0, after: masteryInfo(s, id).overall })).sort((a, b) => b.after - b.before - (a.after - a.before));
  const mis = Object.entries(results.reduce<Record<string, number>>((acc, r) => (r.misconception ? { ...acc, [r.misconception]: (acc[r.misconception] ?? 0) + 1 } : acc), {})).sort((a, b) => b[1] - a[1]);
  const weakest = changes.slice().sort((a, b) => a.after - b.after)[0];
  const acc = n ? correct / n : 0;
  return (
    <div className="card step-card">
      <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
        <Mu mood={acc >= 0.8 ? 'proud' : acc >= 0.5 ? 'happy' : 'encourage'} size={72} />
        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ marginBottom: 2 }}>Session summary</div>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            {acc >= 0.8 ? 'Excellent session — that\'s real progress.' : acc >= 0.5 ? 'Solid work. The misses are exactly what we\'ll review next.' : 'Tough set — and that\'s where learning happens. Your mistakes are saved for review.'}
          </p>
        </div>
      </div>
      <div className="metric-row mt">
        <div className="metric"><div className="k">Problems</div><div className="v">{n}</div></div>
        <div className="metric"><div className="k">Correct</div><div className="v">{correct} <span className="small muted">({Math.round(acc * 100)}%)</span></div></div>
        <div className="metric"><div className="k">Hints used</div><div className="v">{hints}</div></div>
        <div className="metric"><div className="k">XP earned</div><div className="v">+{record?.xp ?? 0}</div></div>
        {record && <div className="metric"><div className="k">Time</div><div className="v">{fmtDuration(Math.max(record.activeMs, (record.end ?? Date.now()) - record.start))}</div></div>}
      </div>
      {changes.length > 0 && (
        <div className="mt">
          <div className="section-title">Mastery change</div>
          <div className="stack-sm">
            {changes.map((c) => {
              const d = c.after - c.before;
              return (
                <div key={c.id} className="row small">
                  <span style={{ flex: 1 }}>{CONCEPT_BY_ID[c.id].title}</span>
                  <span className="muted">{Math.round(c.before * 100)}% → <b style={{ color: 'var(--text)' }}>{Math.round(c.after * 100)}%</b></span>
                  <span className={`chip ${d > 0.005 ? 'success' : d < -0.005 ? 'danger' : ''}`} style={{ minWidth: 58, justifyContent: 'center' }}>{d > 0.005 ? '▲' : d < -0.005 ? '▼' : '•'} {Math.abs(Math.round(d * 100))}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {mis.length > 0 && (
        <div className="callout warn small mt">
          <b>Watch out:</b> {mis.slice(0, 2).map(([id, k]) => `${MISCONCEPTION_BY_ID[id]?.title ?? id}${k > 1 ? ` (${k}×)` : ''}`).join('; ')}. These are in your <a href="#/mistakes">Mistake Bank</a> and will come back as fresh variants.
        </div>
      )}
      <div className="row wrap mt">
        {onAgain && <button className="btn primary" onClick={onAgain}><Icon name="repeat" size={16} /> {againLabel}</button>}
        {weakest && weakest.after < 0.85 && <LinkBtn to={`/practice?concept=${weakest.id}`} className="btn">Focus on {CONCEPT_BY_ID[weakest.id].title}</LinkBtn>}
        <LinkBtn to="/" className="btn ghost">Dashboard</LinkBtn>
      </div>
    </div>
  );
}
