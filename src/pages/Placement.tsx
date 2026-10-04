import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConceptId, ExamRecord } from '../engine/types';
import { useLearner } from '../state/store';
import { finishPlacement, skipPlacement, recordExam, startSession, endSession } from '../state/actions';
import { setTutorFocus } from '../state/tutor';
import { buildPlacement } from '../engine/exam';
import { nextLessonConcept } from '../engine/planner';
import { correctAnswerText } from '../engine/grading';
import { CONCEPT_BY_ID } from '../content/concepts';
import { UNITS, unitOf } from '../content/units';
import { QuestionCard, type QuestionOutcome } from '../components/question/QuestionCard';
import { Icon } from '../components/ui/Icon';
import { Bar, LinkBtn } from '../components/ui';
import { Mu } from '../components/mascot/Mu';
import { navigate } from '../lib/router';

export function PlacementPage() {
  const s = useLearner();
  const questions = useMemo(() => buildPlacement(Date.now()), []);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [outs, setOuts] = useState<(QuestionOutcome | null)[]>([]);
  const [done, setDone] = useState(false);
  const t0 = useRef(Date.now());

  useEffect(() => {
    if (!started) return;
    startSession('placement', []);
    setTutorFocus({ page: 'Placement test (no help available)' });
    return () => { endSession(); };
  }, [started]);

  const finish = (all: (QuestionOutcome | null)[]) => {
    const results = questions.map((q, k) => ({ concept: q.concept, correct: !!all[k]?.correct, level: q.level }));
    finishPlacement(results);
    const byConcept: ExamRecord['byConcept'] = {};
    results.forEach((r) => {
      const cur = byConcept[r.concept] ?? { correct: 0, total: 0 };
      byConcept[r.concept] = { correct: cur.correct + (r.correct ? 1 : 0), total: cur.total + 1 };
    });
    recordExam({
      id: `p-${Date.now()}`, t: Date.now(), kind: 'placement', scope: 'placement', timed: false, durationMs: Date.now() - t0.current, total: questions.length,
      score: results.filter((r) => r.correct).length / results.length, byConcept, misconceptions: {},
      items: questions.map((q, k) => ({ qid: q.id, concept: q.concept, correct: !!all[k]?.correct, yourAnswer: all[k]?.yourAnswer ?? '(skipped)', correctAnswer: all[k]?.correctAnswer ?? correctAnswerText(q.answer), prompt: q.prompt })),
    });
    endSession();
    setDone(true);
  };

  const answer = (o: QuestionOutcome | null) => {
    const next = [...outs];
    next[i] = o;
    setOuts(next);
    if (i + 1 >= questions.length) finish(next);
    else setI(i + 1);
  };

  if (!started) {
    return (
      <div className="content narrow">
        <div className="card row" style={{ gap: 20, alignItems: 'flex-start' }}>
          <Mu mood="wave" size={96} />
          <div style={{ flex: 1 }}>
            <h1>Find your level</h1>
            <p>{questions.length} quick questions, one per key idea across all five units. It takes about 10 minutes. No hints, no grades — it just tells Stat Lab where to start you.</p>
            <ul className="small">
              <li>Choose <b>“I don't know this yet”</b> instead of guessing — honest answers give a better path.</li>
              <li>Placement can raise your starting level, but it never marks anything as mastered.</li>
            </ul>
            {s.placement === 'done' && <div className="callout warn small mb">You've taken this before. Retaking updates your starting estimates.</div>}
            <div className="row wrap">
              <button className="btn primary lg" onClick={() => setStarted(true)}><Icon name="play" size={18} /> Start placement</button>
              <button className="btn ghost" onClick={() => { skipPlacement(); navigate('/learn/pop-sample'); }}>Skip — start from lesson 1</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    const byUnit = UNITS.map((u) => {
      const ks = questions.map((q, k) => ({ q, k })).filter(({ q }) => unitOf(q.concept).id === u.id);
      return { u, correct: ks.filter(({ k }) => outs[k]?.correct).length, total: ks.length };
    });
    const known = questions.filter((_, k) => outs[k]?.correct).map((q) => q.concept);
    const start = nextLessonConcept(s) as ConceptId | null;
    return (
      <div className="content narrow">
        <div className="card step-card">
          <div className="row" style={{ gap: 16 }}>
            <Mu mood="proud" size={80} />
            <div>
              <div className="section-title" style={{ marginBottom: 2 }}>Placement complete</div>
              <h1 style={{ margin: 0 }}>{known.length} of {questions.length} correct</h1>
              <p className="small muted" style={{ margin: '4px 0 0' }}>Your starting levels are set. Concepts you knew start higher and come back for review in 2 days.</p>
            </div>
          </div>
          <div className="stack-sm mt">
            {byUnit.map(({ u, correct, total }) => (
              <div key={u.id}>
                <div className="row between small"><span>Unit {u.number}: {u.title}</span><b>{correct}/{total}</b></div>
                <Bar value={total ? correct / total : 0} color={`var(--${u.color})`} label={`Unit ${u.number} placement`} />
              </div>
            ))}
          </div>
          {start && (
            <div className="callout mt">
              <b>Recommended start:</b> {CONCEPT_BY_ID[start].title} — {CONCEPT_BY_ID[start].short}
            </div>
          )}
          <div className="row wrap mt">
            {start && <LinkBtn to={`/learn/${start}`} className="btn primary"><Icon name="play" size={16} /> Start learning</LinkBtn>}
            <LinkBtn to="/" className="btn">Go to dashboard</LinkBtn>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[i];
  return (
    <div className="content narrow">
      <div className="card pad-sm row between">
        <div className="small"><b>Placement</b> · question {i + 1} of {questions.length}</div>
        <div style={{ width: 200 }}><Bar value={i / questions.length} label="Placement progress" /></div>
      </div>
      <div className="mt">
        <QuestionCard key={q.id} question={q} mode="placement" exam allowHints={false} onDone={answer} />
        <button className="btn ghost sm mt-sm" onClick={() => answer(null)}>I don't know this yet</button>
      </div>
    </div>
  );
}
