import { useEffect, useState } from 'react';
import type { ConceptId, Question, SessionRecord } from '../engine/types';
import { useLearner, getState } from '../state/store';
import { startSession, endSession } from '../state/actions';
import { cs, masteryInfo } from '../engine/learner';
import { dueReviews, upcomingReviews, startedConcepts } from '../engine/planner';
import { REVIEW_LADDER } from '../engine/srs';
import { makeQuestion, pickGenerator, levelFor } from '../engine/questions';
import { CONCEPT_BY_ID } from '../content/concepts';
import { QuestionCard, type QuestionOutcome } from '../components/question/QuestionCard';
import { SessionSummary, type SessionResult } from '../components/SessionSummary';
import { Icon } from '../components/ui/Icon';
import { Bar, LinkBtn, dueIn, masteryColor } from '../components/ui';
import { Mu } from '../components/mascot/Mu';

function buildQueue(ids: ConceptId[]): Question[] {
  const s = getState();
  const out: Question[] = [];
  ids.forEach((id) => {
    const g = pickGenerator({ concept: id, level: cs(s, id).level, excludeTypes: ['free-response'] });
    if (g) out.push(makeQuestion(g, levelFor(g, cs(s, id).level)));
  });
  return out;
}

function ReviewSession({ ids, onExit }: { ids: ConceptId[]; onExit: () => void }) {
  const [queue] = useState(() => buildQueue(ids));
  const [i, setI] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [rec, setRec] = useState<SessionRecord | null | undefined>(undefined);
  useEffect(() => {
    startSession('review', ids);
    return () => { endSession(); };
  }, [ids]);
  const onDone = (o: QuestionOutcome) => {
    const q = queue[i];
    const next = [...results, { concept: q.concept, correct: o.correct, score: o.score, hints: o.hints, misconception: o.misconception }];
    setResults(next);
    if (i + 1 >= queue.length) setRec(endSession());
    else setI(i + 1);
  };
  if (rec !== undefined) return <SessionSummary title="Daily review complete" results={results} record={rec} onAgain={onExit} againLabel="Back to reviews" />;
  const q = queue[i];
  if (!q) return null;
  return (
    <div className="stack">
      <div className="card pad-sm row between">
        <div className="row"><Icon name="repeat" size={20} /><div><div className="bold small">Spaced review</div><div className="tiny muted">{i + 1} of {queue.length} · from memory, no peeking at notes</div></div></div>
        <div style={{ width: 140 }}><Bar value={i / queue.length} label="Review progress" /></div>
      </div>
      <QuestionCard key={q.id} question={q} mode="review" onDone={onDone} nextLabel={i + 1 >= queue.length ? 'Finish review' : 'Next'} />
    </div>
  );
}

export function ReviewPage() {
  const s = useLearner();
  const [running, setRunning] = useState<ConceptId[] | null>(null);
  const due = dueReviews(s);
  const upcoming = upcomingReviews(s, Date.now(), 14);
  const started = startedConcepts(s).map((c) => ({ id: c.id, info: masteryInfo(s, c.id), srs: cs(s, c.id).srs })).filter((x) => x.srs);

  if (running) {
    return <div className="content narrow"><ReviewSession ids={running} onExit={() => setRunning(null)} /></div>;
  }
  return (
    <div className="content narrow">
      <div className="page-head">
        <div>
          <h1>Daily review</h1>
          <p>Spaced repetition brings each concept back just as you're about to forget it: 1 → 3 → 7 → 14 → 30 → 60 → 120 days.</p>
        </div>
      </div>
      {due.length ? (
        <div className="hero-card">
          <div className="eyebrow">{due.length} concept{due.length === 1 ? '' : 's'} due</div>
          <h2>Strengthen your memory</h2>
          <p>{due.slice(0, 4).map((d) => CONCEPT_BY_ID[d].title).join(' · ')}{due.length > 4 ? ` · +${due.length - 4} more` : ''}</p>
          <div className="row wrap mt">
            <button className="btn white lg" onClick={() => setRunning(due.slice(0, 8))}><Icon name="play" size={18} /> Start review (~{Math.min(8, due.length) * 2} min)</button>
          </div>
        </div>
      ) : (
        <div className="card row" style={{ gap: 18 }}>
          <Mu mood="happy" size={72} />
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 4 }}>All caught up!</h2>
            <p className="small muted" style={{ margin: 0 }}>{upcoming.length ? `Next review: ${CONCEPT_BY_ID[upcoming[0].id].title}, ${dueIn(upcoming[0].due)}.` : 'Finish a lesson to schedule your first review.'} Want extra practice? Try a retrieval challenge.</p>
            <div className="row wrap mt-sm">
              <LinkBtn to="/practice?mode=recall" className="btn sm primary"><Icon name="brain" size={14} /> Retrieval challenge</LinkBtn>
              <LinkBtn to="/practice?mode=mixed" className="btn sm">Mixed review</LinkBtn>
            </div>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="card mt">
          <div className="card-title"><h3>Coming up (14 days)</h3></div>
          <div className="list">
            {upcoming.map((u) => (
              <div key={u.id} className="list-item small">
                <span className="dot" style={{ background: 'var(--info)' }} />
                <span style={{ flex: 1 }}>{CONCEPT_BY_ID[u.id].title}</span>
                <span className="muted">{dueIn(u.due)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {started.length > 0 && (
        <div className="card mt">
          <div className="card-title"><h3>Memory strength</h3><span className="tiny muted">Review interval step 1–{REVIEW_LADDER.length}</span></div>
          <div className="stack-sm">
            {started.sort((a, b) => a.info.retention - b.info.retention).map((x) => (
              <div key={x.id} className="dim-bar" style={{ gridTemplateColumns: 'minmax(120px, 1fr) 1.2fr 70px' }}>
                <a href={`#/learn/${x.id}`} className="small" style={{ color: 'var(--text)' }}>{CONCEPT_BY_ID[x.id].title}</a>
                <Bar value={x.info.retention} color={masteryColor(x.info.retention)} label={`${CONCEPT_BY_ID[x.id].title} retention`} />
                <span className="tiny muted" style={{ textAlign: 'right' }}>step {x.srs!.step + 1} · {REVIEW_LADDER[x.srs!.step]}d</span>
              </div>
            ))}
          </div>
          <button className="btn sm mt" onClick={() => setRunning(started.sort((a, b) => a.info.retention - b.info.retention).slice(0, 5).map((x) => x.id))}>Review my 5 weakest memories now</button>
        </div>
      )}
    </div>
  );
}
