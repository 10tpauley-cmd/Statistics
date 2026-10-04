import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConceptId, ExamRecord } from '../engine/types';
import { useLearner } from '../state/store';
import { recordExam, startSession, endSession } from '../state/actions';
import { setTutorFocus } from '../state/tutor';
import { buildExam, EXAM_SCOPES, analyzeExam, type ExamScope } from '../engine/exam';
import { correctAnswerText } from '../engine/grading';
import { CONCEPT_BY_ID } from '../content/concepts';
import { MISCONCEPTION_BY_ID } from '../content/misconceptions';
import { QuestionCard, type QuestionOutcome } from '../components/question/QuestionCard';
import { Rich, plain } from '../components/ui/Rich';
import { Icon } from '../components/ui/Icon';
import { Bar, Empty, LinkBtn, Seg, Toggle, Modal, Ring, timeAgo, fmtDuration } from '../components/ui';
import { navigate } from '../lib/router';

const ALL_SCOPES: { id: ExamScope; title: string; description: string }[] = [
  ...EXAM_SCOPES,
  { id: 'final', title: 'Final mastery exam', description: 'Everything in the course, exam-level, with written explanations.' },
];

export function ExamCenter() {
  const s = useLearner();
  const [scope, setScope] = useState<ExamScope | null>(null);
  const [count, setCount] = useState(15);
  const [timed, setTimed] = useState(true);
  const past = s.exams.filter((e) => e.kind !== 'placement');
  const start = () => scope && navigate(`/exam/${scope}?n=${scope === 'final' ? Math.max(count, 25) : count}&timed=${timed ? 1 : 0}`);
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Exam center</h1>
          <p>Randomized, mixed, exam-level questions. No hints, no feedback until the end — just like the real thing.</p>
        </div>
      </div>
      <div className="grid grid-3" style={{ gap: 12 }}>
        {ALL_SCOPES.map((sc) => {
          const best = past.filter((e) => e.scope === sc.id).reduce((m, e) => Math.max(m, e.score), -1);
          return (
            <button key={sc.id} className="card interactive" style={{ textAlign: 'left', color: 'var(--text)', borderColor: sc.id === 'final' ? 'var(--primary)' : undefined }} onClick={() => setScope(sc.id)}>
              <div className="row between">
                <Icon name={sc.id === 'final' ? 'trophy' : 'clipboard'} size={22} />
                {best >= 0 && <span className={`chip ${best >= 0.8 ? 'success' : best >= 0.6 ? 'warn' : 'danger'}`}>Best {Math.round(best * 100)}%</span>}
              </div>
              <h3 className="mt-sm" style={{ marginBottom: 4 }}>{sc.title}</h3>
              <p className="small muted" style={{ margin: 0 }}>{sc.description}</p>
            </button>
          );
        })}
      </div>

      <div className="card mt">
        <div className="card-title"><h2>Past exams</h2></div>
        {past.length ? (
          <div className="list">
            {past.map((e) => (
              <a key={e.id} className="list-item" href={`#/exam/results?id=${e.id}`} style={{ color: 'var(--text)' }}>
                <Ring value={e.score} size={40} stroke={4} />
                <div style={{ flex: 1 }}>
                  <div className="bold small">{ALL_SCOPES.find((x) => x.id === e.scope)?.title ?? e.scope}</div>
                  <div className="tiny muted">{e.total} questions · {e.timed ? 'timed' : 'untimed'} · {fmtDuration(e.durationMs)} · {timeAgo(e.t)}</div>
                </div>
                <Icon name="right" size={16} />
              </a>
            ))}
          </div>
        ) : <div className="small muted">No exams yet. Your results and analysis will be saved here.</div>}
      </div>

      <Modal open={!!scope} onClose={() => setScope(null)} title={ALL_SCOPES.find((x) => x.id === scope)?.title ?? ''}>
        <div className="stack">
          <p className="small muted" style={{ margin: 0 }}>{ALL_SCOPES.find((x) => x.id === scope)?.description}</p>
          <div className="field">
            <label>Number of questions</label>
            <Seg options={(scope === 'final' ? [25, 30, 40] : [10, 15, 20, 30]).map((n) => ({ id: n, label: String(n) }))} value={scope === 'final' ? Math.max(25, count) : count} onChange={setCount} label="Number of questions" />
          </div>
          <label className="row small"><Toggle checked={timed} onChange={setTimed} label="Timed" /> Timed (about 2.5 minutes per question)</label>
          <div className="callout small">During the exam: no hints, no Mu, and no feedback. A calculator is available on calculation questions. You'll get a full breakdown at the end.</div>
          <button className="btn primary lg" onClick={start}><Icon name="play" size={18} /> Begin exam</button>
        </div>
      </Modal>
    </div>
  );
}

function ExamResults({ rec }: { rec: ExamRecord }) {
  const a = analyzeExam(rec);
  const [show, setShow] = useState<'wrong' | 'all'>('wrong');
  const items = rec.items.filter((it) => show === 'all' || !it.correct);
  return (
    <div className="content narrow">
      <a href="#/exam" className="small"><Icon name="left" size={14} /> Exam center</a>
      <div className="card mt-sm">
        <div className="row wrap" style={{ gap: 20 }}>
          <Ring value={rec.score} size={110} stroke={10} label={`${Math.round(rec.score * 100)}%`} color={rec.score >= 0.8 ? 'var(--success-strong)' : rec.score >= 0.6 ? 'var(--warn)' : 'var(--danger)'} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="section-title" style={{ marginBottom: 2 }}>{rec.kind === 'final' ? 'Final mastery exam' : 'Exam'} report</div>
            <h2 style={{ margin: 0 }}>{ALL_SCOPES.find((x) => x.id === rec.scope)?.title ?? rec.scope}</h2>
            <p className="small muted" style={{ margin: '4px 0 0' }}>{rec.items.filter((i) => i.correct).length} of {rec.total} correct · {fmtDuration(rec.durationMs)} · {rec.timed ? 'timed' : 'untimed'}</p>
            <div className="row wrap mt-sm" style={{ gap: 6 }}>
              {a.strongest && <span className="chip success">Strongest: {a.strongest}</span>}
              {a.weakest && <span className="chip danger">Weakest: {a.weakest}</span>}
            </div>
          </div>
        </div>
        {a.commonError && MISCONCEPTION_BY_ID[a.commonError.id] && (
          <div className="callout warn small mt"><b>Most common error:</b> {MISCONCEPTION_BY_ID[a.commonError.id].title} ({a.commonError.count}×). <Rich text={MISCONCEPTION_BY_ID[a.commonError.id].fix} as="span" /></div>
        )}
      </div>

      <div className="grid grid-2 mt">
        <div className="card">
          <h3>By unit</h3>
          <div className="stack-sm">
            {a.byUnit.map((u) => (
              <div key={u.unit}>
                <div className="row between small"><span>{u.title}</span><b>{u.correct}/{u.total}</b></div>
                <Bar value={u.correct / u.total} color={u.correct / u.total >= 0.75 ? 'var(--success-strong)' : u.correct / u.total >= 0.5 ? 'var(--warn)' : 'var(--danger)'} label={`${u.title} score`} />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Recommended next</h3>
          {a.recommended.length ? (
            <div className="stack-sm">
              {a.recommended.map((id) => (
                <div key={id} className="row small">
                  <span style={{ flex: 1 }}>{CONCEPT_BY_ID[id].title}</span>
                  <LinkBtn to={`/learn/${id}`} className="btn ghost sm">Lesson</LinkBtn>
                  <LinkBtn to={`/practice?concept=${id}`} className="btn sm">Practice</LinkBtn>
                </div>
              ))}
            </div>
          ) : <p className="small muted">Every concept scored 75%+. Try the final mastery exam or a boss battle.</p>}
        </div>
      </div>

      <div className="card mt">
        <div className="card-title">
          <h3>By concept</h3>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th className="rh">Concept</th><th>Correct</th><th>Score</th></tr></thead>
            <tbody>
              {a.byConcept.sort((x, y) => x.correct / x.total - y.correct / y.total).map((c) => (
                <tr key={c.id}><td className="rh"><a href={`#/learn/${c.id}`}>{CONCEPT_BY_ID[c.id].title}</a></td><td>{c.correct}/{c.total}</td><td>{Math.round((c.correct / c.total) * 100)}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt">
        <div className="card-title">
          <h3>Question review</h3>
          <Seg options={[{ id: 'wrong', label: 'Missed' }, { id: 'all', label: 'All' }]} value={show} onChange={setShow} label="Filter" />
        </div>
        {items.length ? (
          <div className="stack-sm">
            {items.map((it, i) => (
              <details key={i} className="part">
                <summary style={{ cursor: 'pointer' }} className="row small">
                  <span>{it.correct ? '✅' : '❌'}</span>
                  <span style={{ flex: 1 }}><b>{CONCEPT_BY_ID[it.concept].title}</b> — {plain(it.prompt).slice(0, 90)}{plain(it.prompt).length > 90 ? '…' : ''}</span>
                </summary>
                <Rich text={it.prompt} className="small mt-sm" />
                <div className="small mt-sm"><b>Your answer:</b> {it.yourAnswer || '(no answer)'}</div>
                <div className="small"><b>Correct answer:</b> {plain(it.correctAnswer)}</div>
                {it.misconception && MISCONCEPTION_BY_ID[it.misconception] && <div className="tiny muted mt-sm">Likely trap: {MISCONCEPTION_BY_ID[it.misconception].title}</div>}
              </details>
            ))}
          </div>
        ) : <p className="small muted">No missed questions — flawless!</p>}
      </div>
      <div className="row wrap mt">
        <LinkBtn to={`/exam/${rec.scope}?n=${rec.total}&timed=${rec.timed ? 1 : 0}`} className="btn primary"><Icon name="repeat" size={16} /> New exam, same settings</LinkBtn>
        <LinkBtn to="/mistakes" className="btn">Mistake Bank</LinkBtn>
      </div>
    </div>
  );
}

export function ExamRunner({ scope, query }: { scope: string; query: URLSearchParams }) {
  const s = useLearner();
  if (scope === 'results') {
    const rec = s.exams.find((e) => e.id === query.get('id'));
    return rec ? <ExamResults rec={rec} /> : <div className="content narrow"><Empty title="Exam not found" action={<LinkBtn to="/exam" className="btn primary">Exam center</LinkBtn>} /></div>;
  }
  if (!ALL_SCOPES.some((x) => x.id === scope)) return <div className="content narrow"><Empty title="Unknown exam" action={<LinkBtn to="/exam" className="btn primary">Exam center</LinkBtn>} /></div>;
  return <ExamSession scope={scope as ExamScope} count={Math.max(5, Math.min(40, Number(query.get('n')) || 15))} timed={query.get('timed') !== '0'} />;
}

function ExamSession({ scope, count, timed }: { scope: ExamScope; count: number; timed: boolean }) {
  const questions = useMemo(() => buildExam(scope, count, Date.now()), [scope, count]);
  const [i, setI] = useState(0);
  const [outcomes, setOutcomes] = useState<(QuestionOutcome | null)[]>([]);
  const startT = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const [confirmQuit, setConfirmQuit] = useState(false);
  const limit = Math.round(count * 2.5) * 60000;
  const finished = useRef(false);

  useEffect(() => {
    startSession(scope === 'final' ? 'final' : 'exam', []);
    setTutorFocus({ page: 'Exam (no help available)' });
    return () => { endSession(); };
  }, [scope]);

  const finish = (outs: (QuestionOutcome | null)[]) => {
    if (finished.current) return;
    finished.current = true;
    const items = questions.map((q, k) => {
      const o = outs[k];
      return { qid: q.id, concept: q.concept, correct: !!o?.correct, partial: o?.score, yourAnswer: o?.yourAnswer ?? '', correctAnswer: o?.correctAnswer ?? correctAnswerText(q.answer), prompt: q.prompt, misconception: o?.misconception };
    });
    const byConcept: ExamRecord['byConcept'] = {};
    const misconceptions: Record<string, number> = {};
    items.forEach((it) => {
      const cur = byConcept[it.concept] ?? { correct: 0, total: 0 };
      byConcept[it.concept as ConceptId] = { correct: cur.correct + (it.correct ? 1 : 0), total: cur.total + 1 };
      if (it.misconception) misconceptions[it.misconception] = (misconceptions[it.misconception] ?? 0) + 1;
    });
    const score = items.reduce((a, it, k) => a + (it.correct ? 1 : Math.min(0.5, outs[k]?.score ?? 0)), 0) / items.length;
    const rec: ExamRecord = { id: `e-${Date.now()}`, t: Date.now(), kind: scope === 'final' ? 'final' : 'exam', scope, timed, durationMs: Date.now() - startT.current, total: items.length, score, byConcept, misconceptions, items };
    endSession();
    recordExam(rec);
    navigate(`/exam/results?id=${rec.id}`, { replace: true });
  };

  useEffect(() => {
    if (!timed) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [timed]);
  const left = limit - (now - startT.current);
  useEffect(() => {
    if (timed && left <= 0) finish(outcomes);
  });

  const answer = (o: QuestionOutcome | null) => {
    const next = [...outcomes];
    next[i] = o;
    setOutcomes(next);
    if (i + 1 >= questions.length) finish(next);
    else setI(i + 1);
  };

  const q = questions[i];
  const m = Math.max(0, Math.floor(left / 60000)), sec = Math.max(0, Math.floor((left % 60000) / 1000));
  return (
    <div className="content narrow">
      <div className="card pad-sm row wrap between" style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 8px)', zIndex: 5 }}>
        <div className="row"><Icon name="clipboard" size={20} /><div><div className="bold small">{ALL_SCOPES.find((x) => x.id === scope)?.title}</div><div className="tiny muted">Question {i + 1} of {questions.length}</div></div></div>
        <div style={{ flex: 1, maxWidth: 260, minWidth: 120 }}><Bar value={i / questions.length} label="Exam progress" /></div>
        {timed && <span className={`chip ${left < 120000 ? 'danger' : ''} timer`}><Icon name="clock" size={13} /> {m}:{String(sec).padStart(2, '0')}</span>}
        <button className="btn ghost sm" onClick={() => setConfirmQuit(true)}>Finish early</button>
      </div>
      <div className="mt">
        <QuestionCard key={q.id} question={q} mode={scope === 'final' ? 'final' : 'exam'} exam allowHints={false} onDone={answer} />
        <div className="row mt-sm"><button className="btn ghost sm" onClick={() => answer(null)}>Skip this question</button><span className="tiny muted">Skipped questions count as incorrect.</span></div>
      </div>
      <Modal open={confirmQuit} onClose={() => setConfirmQuit(false)} title="Finish the exam now?">
        <p className="small">Unanswered questions will be marked incorrect. You've answered {outcomes.filter(Boolean).length} of {questions.length}.</p>
        <div className="row"><button className="btn primary" onClick={() => finish(outcomes)}>Finish & see results</button><button className="btn ghost" onClick={() => setConfirmQuit(false)}>Keep going</button></div>
      </Modal>
    </div>
  );
}
