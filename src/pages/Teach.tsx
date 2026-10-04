import { useEffect, useState } from 'react';
import type { ConceptId } from '../engine/types';
import { useLearner } from '../state/store';
import { recordTeach } from '../state/actions';
import { setTutorFocus } from '../state/tutor';
import { masteryInfo } from '../engine/learner';
import { startedConcepts } from '../engine/planner';
import { gradeFrq, aiAvailable, type FrqResult } from '../lib/frqService';
import { CONCEPTS, CONCEPT_BY_ID } from '../content/concepts';
import { UNITS } from '../content/units';
import { FrqFeedbackView } from '../components/question/FrqFeedbackView';
import { Rich } from '../components/ui/Rich';
import { Icon } from '../components/ui/Icon';
import { LinkBtn, timeAgo } from '../components/ui';
import { Mu } from '../components/mascot/Mu';
import { navigate } from '../lib/router';

const TIPS = ['Say what it **is** in plain words', 'Give a concrete **example**', 'Explain **why** it works or matters', 'Name a **common mistake** to avoid'];

export function TeachPage({ query }: { query: URLSearchParams }) {
  const s = useLearner();
  const param = query.get('concept') as ConceptId | null;
  const suggested = startedConcepts(s).map((c) => ({ id: c.id, e: masteryInfo(s, c.id).dims.explain })).sort((a, b) => a.e - b.e)[0]?.id;
  const id: ConceptId = param && CONCEPT_BY_ID[param] ? param : suggested ?? 'center';
  const c = CONCEPT_BY_ID[id];
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<FrqResult | null>(null);
  const [dup, setDup] = useState(false);
  const history = s.teach.filter((t) => t.concept === id);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => { setTutorFocus({ concept: id, page: `Teach It: ${c.title}` }); }, [id, c.title]);

  const submit = async () => {
    if (words < 15 || busy) return;
    setBusy(true);
    const r = await gradeFrq({ concept: id, prompt: c.teach.prompt, rubric: c.teach, answer: text, mode: 'teach' });
    setBusy(false);
    setRes(r);
    setDup(recordTeach(id, text, r.feedback).duplicate);
  };

  return (
    <div className="content narrow">
      <div className="page-head">
        <div>
          <h1>Teach It</h1>
          <p>Explain the idea as if you were teaching a friend. If you can teach it, you understand it — and explaining is required for mastery.</p>
        </div>
        <select className="select" style={{ maxWidth: 280 }} value={id} onChange={(e) => { navigate(`/teach?concept=${e.target.value}`); }} aria-label="Concept to teach">
          {UNITS.map((u) => (
            <optgroup key={u.id} label={`Unit ${u.number}: ${u.title}`}>
              {CONCEPTS.filter((x) => x.unit === u.id).map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
          <Mu mood={res ? (res.feedback.score >= 80 ? 'proud' : 'encourage') : 'thinking'} size={64} />
          <div style={{ flex: 1 }}>
            <div className="chip primary">{c.title}</div>
            <Rich text={c.teach.prompt} className="q-prompt mt-sm" />
            <div className="row wrap" style={{ gap: 6 }}>
              {TIPS.map((t) => <span key={t} className="chip"><Rich text={t} as="span" /></span>)}
            </div>
          </div>
        </div>
        <textarea className="textarea mt" style={{ minHeight: 180 }} value={text} onChange={(e) => { setText(e.target.value); setRes(null); }} placeholder="Start with: “Imagine you…”" aria-label="Your explanation" disabled={busy} />
        <div className="row between mt-sm">
          <span className="tiny muted">{words} words{words < 15 ? ' · write at least 15' : ''} · {aiAvailable() ? '✨ Claude will grade this and coach you' : 'Checked offline against a rubric (add an API key in Settings for AI coaching)'}</span>
          <button className="btn primary" onClick={submit} disabled={words < 15 || busy}>{busy ? <><span className="spinner" /> Reading…</> : <><Icon name="send" size={16} /> Get feedback</>}</button>
        </div>
        {res && <FrqFeedbackView fb={res.feedback} aiError={res.aiError} />}
        {res && dup && <div className="callout warn small mt-sm">You've submitted this exact explanation before, so it doesn't count as new evidence. Revise it using the feedback to improve your score.</div>}
        {res && (
          <div className="row wrap mt">
            <button className="btn" onClick={() => { setRes(null); }}>Revise my explanation</button>
            <LinkBtn to={`/practice?concept=${id}`} className="btn ghost">Practice {c.title}</LinkBtn>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="card mt">
          <div className="card-title"><h3>Your past explanations</h3></div>
          <div className="list">
            {history.slice(0, 6).map((t) => (
              <details key={t.id} className="list-item" style={{ display: 'block' }}>
                <summary className="row small" style={{ cursor: 'pointer' }}>
                  <b>{Math.round(t.score * 100)}%</b>
                  <span className="muted" style={{ flex: 1 }}>{t.text.slice(0, 80)}{t.text.length > 80 ? '…' : ''}</span>
                  <span className="tiny muted">{t.graded === 'ai' ? 'AI' : 'offline'} · {timeAgo(t.t)}</span>
                </summary>
                <p className="small mt-sm" style={{ whiteSpace: 'pre-wrap' }}>{t.text}</p>
                {t.feedback.missing.length > 0 && <p className="tiny muted" style={{ margin: 0 }}>Missing then: {t.feedback.missing.join('; ')}</p>}
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
