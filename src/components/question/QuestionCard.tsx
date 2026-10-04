import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnswerSpec, Question, QuestionPart, StudyMode } from '../../engine/types';
import { gradeObjective, praise, correctAnswerText, type GradeResult } from '../../engine/grading';
import { answerQuestion, isBookmarked, toggleBookmark, LEVEL_NAMES } from '../../state/actions';
import { emit, getState, useLearner } from '../../state/store';
import { setTutorFocus, clearQuestionFocus } from '../../state/tutor';
import { CONCEPT_BY_ID } from '../../content/concepts';
import { MISCONCEPTION_BY_ID } from '../../content/misconceptions';
import { Rich, plain } from '../ui/Rich';
import { Icon } from '../ui/Icon';
import { SourceTag, Modal } from '../ui';
import { Visual } from '../charts/Charts';
import { progressiveHints } from './hints';
import { FrqFeedbackView } from './FrqFeedbackView';
import { gradeFrq, aiAvailable, type FrqResult } from '../../lib/frqService';
import { playSound } from '../../lib/sound';
import * as fx from '../../lib/fx';
import { Calculator } from '../calculator/Calculator';

export interface QuestionOutcome {
  correct: boolean;
  score: number;
  hints: number;
  misconception?: string;
  yourAnswer: string;
  correctAnswer: string;
  ms: number;
}

interface Props {
  question: Question;
  mode: StudyMode;
  scaffold?: boolean;
  exam?: boolean;
  record?: boolean;
  allowHints?: boolean;
  onDone?: (o: QuestionOutcome) => void;
  nextLabel?: string;
  compactHeader?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  recognition: 'Recognition', calculation: 'Calculation', interpretation: 'Interpretation', conceptual: 'Concept', misconception: 'Misconception check',
  'real-world': 'Real world', graph: 'Graph', 'multi-step': 'Multi-step', method: 'Which method?', exam: 'Exam-style', 'free-response': 'Free response',
};

/* ---------------- Answer inputs ---------------- */

function McInput({ answer, value, onChange, graded, disabled }: { answer: Extract<AnswerSpec, { kind: 'mc' }>; value: string; onChange: (v: string) => void; graded: boolean; disabled: boolean }) {
  return (
    <div className="options" role="radiogroup">
      {answer.options.map((o, i) => {
        const selected = value === o.id;
        const cls = graded ? (o.correct ? 'correct' : selected ? 'wrong' : '') : selected ? 'selected' : '';
        return (
          <button key={o.id} type="button" role="radio" aria-checked={selected} className={`option ${cls}`} disabled={disabled} onClick={() => onChange(o.id)}>
            <span className="letter">{graded && o.correct ? <Icon name="check" size={14} /> : graded && selected ? <Icon name="x" size={14} /> : String.fromCharCode(65 + i)}</span>
            <span style={{ flex: 1 }}>
              <Rich text={o.text} as="span" />
              {graded && o.why && (o.correct || selected) && <span className="why">{plain(o.why)}</span>}
              {graded && o.why && !o.correct && !selected && <span className="why muted">Why not: {plain(o.why)}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function NumInput({ value, onChange, onSubmit, disabled, unit, autoFocus }: { value: string; onChange: (v: string) => void; onSubmit: () => void; disabled: boolean; unit?: string; autoFocus?: boolean }) {
  return (
    <div className="numeric-row">
      <input className="input lg" inputMode="decimal" placeholder="Your answer" value={value} disabled={disabled} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSubmit()} aria-label="Numeric answer" />
      {unit && <span className="muted">{unit === 'dollars' ? '$' : unit}</span>}
      <span className="tiny muted">Decimals, fractions (3/8), or percents (40%) all work.</span>
    </div>
  );
}

/* ---------------- Part runner (multi-step scaffolding) ---------------- */

function PartRunner({ part, index, active, done, onGraded }: { part: QuestionPart; index: number; active: boolean; done?: GradeResult; onGraded: (r: GradeResult) => void }) {
  const [v, setV] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const submit = () => {
    if (!v) return;
    const r = gradeObjective(part.answer, v);
    if (r.correct) { fx.burst(ref.current?.querySelector('.btn.primary') ?? ref.current, { count: 10, spread: 70 }); fx.sound('select'); }
    else fx.shake(ref.current);
    onGraded(r);
  };
  return (
    <div ref={ref} className={`part ${done ? (done.correct ? 'done' : '') : active ? '' : 'locked'}`}>
      <div className="part-label">Step {index + 1} · {part.label}</div>
      <Rich text={part.prompt} />
      {(active || done) && (
        <div className="mt-sm">
          {part.answer.kind === 'mc' ? (
            <McInput answer={part.answer} value={done ? (done.correct ? part.answer.options.find((o) => o.correct)!.id : v) : v} onChange={setV} graded={!!done} disabled={!!done} />
          ) : part.answer.kind === 'numeric' ? (
            <NumInput value={v} onChange={setV} onSubmit={submit} disabled={!!done} unit={part.answer.unit} autoFocus={active} />
          ) : null}
          {!done && <button className="btn primary sm mt-sm" onClick={submit} disabled={!v}>Check step</button>}
          {done && (
            <div className={`feedback ${done.correct ? 'good' : done.close ? 'close' : 'bad'}`} style={{ padding: 10 }}>
              <b className="small">{done.correct ? '✓ ' : ''}{done.correct ? 'Correct' : done.title}</b>
              {!done.correct && done.message && <div className="small">{plain(done.message)}</div>}
              <div className="small muted">{plain(part.explain)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Main card ---------------- */

export function QuestionCard({ question: q, mode, scaffold = false, exam = false, record = true, allowHints = true, onDone, nextLabel = 'Next', compactHeader = false }: Props) {
  const s = useLearner();
  const [response, setResponse] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [frq, setFrq] = useState<FrqResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [partResults, setPartResults] = useState<GradeResult[]>([]);
  const [interp, setInterp] = useState<{ v: string; r: GradeResult | null }>({ v: '', r: null });
  const [xpGain, setXpGain] = useState(0);
  const [praiseTitle, setPraiseTitle] = useState('');
  const [calcOpen, setCalcOpen] = useState(false);
  const [anim, setAnim] = useState('');
  const start = useRef(Date.now());
  const cardRef = useRef<HTMLDivElement>(null);
  const hints = useMemo(() => progressiveHints(q), [q]);
  const usingParts = scaffold && !!q.parts?.length && !exam;
  const concept = CONCEPT_BY_ID[q.concept];
  const graded = !!result || !!frq;
  const finished = usingParts ? partResults.length === q.parts!.length : graded;

  // Reset when the question changes
  useEffect(() => {
    setResponse(''); setResult(null); setFrq(null); setHintsShown(0); setPartResults([]); setInterp({ v: '', r: null }); setXpGain(0); setPraiseTitle(''); setAnim('');
    start.current = Date.now();
  }, [q.id]);

  // Share context with the mascot tutor
  useEffect(() => {
    setTutorFocus({ concept: q.concept, question: { prompt: plain(q.prompt), context: q.context ? plain(q.context) : undefined, answered: finished, hintsShown, totalHints: hints.length, solution: q.solution.map(plain) } });
  }, [q, finished, hintsShown, hints.length]);
  useEffect(() => () => clearQuestionFocus(), []);

  const finalize = useCallback((r: { correct: boolean; score: number; misconception?: string; yourAnswer: string; correctAnswer: string; why?: string }) => {
    const ms = Date.now() - start.current;
    const before = getState().xp;
    if (record) {
      answerQuestion({ question: q, correct: r.correct, partial: r.score, hintsUsed: hintsShown, ms, mode, misconception: r.misconception, yourAnswer: r.yourAnswer, correctAnswer: r.correctAnswer, why: r.why });
    }
    const gained = getState().xp - before;
    setXpGain(gained);
    if (!exam) {
      const snd = getState().settings.sound;
      const focused = document.activeElement instanceof HTMLElement && cardRef.current?.contains(document.activeElement) ? document.activeElement : null;
      const anchor = focused ?? cardRef.current?.querySelector('.q-actions') ?? cardRef.current;
      if (r.correct) {
        const p = praise(q, hintsShown, ms);
        setPraiseTitle(p.title);
        playSound(p.perfect ? 'perfect' : 'correct', snd);
        fx.correct(anchor, { xp: gained, perfect: p.perfect });
        setAnim('pop');
        if (p.perfect) {
          emit({ kind: 'celebrate', strength: 'small', title: 'Perfect solve', body: 'Right method, right calculation, no hints.' });
          emit({ kind: 'mascot', mood: 'proud', text: 'Perfect solve! You didn\'t need a single hint. 🔥' });
        }
      } else {
        playSound('wrong', snd);
        fx.wrong(null);
        setAnim('shake');
        const mis = r.misconception ? MISCONCEPTION_BY_ID[r.misconception] : undefined;
        if (mis && Math.random() < 0.6) emit({ kind: 'mascot', mood: 'encourage', text: `Common trap: ${mis.title.toLowerCase()}. ${plain(mis.fix).split('. ')[0]}.` });
      }
    }
    return ms;
  }, [q, hintsShown, mode, record, exam]);

  const submit = useCallback(async () => {
    if (graded || grading) return;
    if (q.answer.kind === 'text') {
      if (response.trim().split(/\s+/).length < 3) return;
      setGrading(true);
      const res = await gradeFrq({ concept: q.concept, prompt: q.prompt, context: q.context, rubric: q.answer.rubric, answer: response, mode: 'frq' });
      setGrading(false);
      setFrq(res);
      const score = res.feedback.score / 100;
      const ms = finalize({ correct: score >= 0.7, score, yourAnswer: response, correctAnswer: q.answer.rubric.model, misconception: score < 0.7 && res.feedback.misconceptions.length ? 'wrong-method' : undefined, why: res.feedback.missing.join('; ') });
      if (exam) onDone?.({ correct: score >= 0.7, score, hints: hintsShown, yourAnswer: response, correctAnswer: q.answer.rubric.model, ms });
      return;
    }
    if (!response) return;
    const r = gradeObjective(q.answer, response);
    setResult(r);
    const ms = finalize({ correct: r.correct, score: r.correct ? 1 : r.score, misconception: r.misconception, yourAnswer: r.yourAnswer, correctAnswer: r.correctAnswer, why: r.message });
    if (exam) onDone?.({ correct: r.correct, score: r.correct ? 1 : r.score, hints: hintsShown, misconception: r.misconception, yourAnswer: r.yourAnswer, correctAnswer: r.correctAnswer, ms });
  }, [graded, grading, q, response, finalize, exam, onDone, hintsShown]);

  const onPart = (i: number, r: GradeResult) => {
    const next = [...partResults];
    next[i] = r;
    setPartResults(next);
    if (next.length === q.parts!.length) {
      const correctCount = next.filter((x) => x.correct).length;
      const score = correctCount / next.length;
      const last = next[next.length - 1];
      const mis = next.find((x) => x.misconception)?.misconception;
      setResult({ ...last, correct: score === 1, score });
      finalize({ correct: score === 1, score, misconception: mis, yourAnswer: last.yourAnswer, correctAnswer: correctAnswerText(q.answer), why: next.filter((x) => !x.correct).map((x) => x.message).join(' ') });
    }
  };

  const submitInterp = () => {
    if (!q.interpretFollowUp || !interp.v) return;
    const r = gradeObjective(q.interpretFollowUp.answer, interp.v);
    setInterp({ v: interp.v, r });
    if (record) {
      answerQuestion({ question: { ...q, id: `${q.id}~i`, type: 'interpretation', dims: ['interpret'], hints: [] }, correct: r.correct, hintsUsed: 0, ms: 5000, mode, misconception: r.misconception, yourAnswer: r.yourAnswer, correctAnswer: r.correctAnswer, why: r.message });
    }
    playSound(r.correct ? 'correct' : 'wrong', getState().settings.sound);
    if (r.correct) fx.correct(cardRef.current?.querySelector('.part .btn.primary') ?? cardRef.current, {});
    else fx.wrong(null);
  };

  const outcome = (): QuestionOutcome => {
    const score = frq ? frq.feedback.score / 100 : result ? (result.correct ? 1 : result.score) : 0;
    return { correct: frq ? score >= 0.7 : !!result?.correct, score, hints: hintsShown, misconception: result?.misconception, yourAnswer: result?.yourAnswer ?? response, correctAnswer: result?.correctAnswer ?? correctAnswerText(q.answer), ms: Date.now() - start.current };
  };

  const needsInterp = !!q.interpretFollowUp && !!result?.correct && !usingParts && !exam && !interp.r;
  const canNext = finished && !needsInterp;

  // Keyboard: A–D / 1–4 choose, Enter submits/continues, H shows a hint.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!typing && q.answer.kind === 'mc' && !graded && !usingParts) {
        const idx = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase());
        if (idx >= 0 && idx < q.answer.options.length) { setResponse(q.answer.options[idx].id); e.preventDefault(); return; }
      }
      if (!typing && e.key.toLowerCase() === 'h' && allowHints && !exam && !graded) { setHintsShown((h) => Math.min(hints.length, h + 1)); return; }
      if (e.key === 'Enter' && !typing) {
        if (canNext && onDone && !exam) { e.preventDefault(); onDone(outcome()); }
        else if (!graded && response && !usingParts) { e.preventDefault(); submit(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Mascot can request "next hint"
  useEffect(() => {
    const handler = () => allowHints && !exam && !finished && setHintsShown((h) => Math.min(hints.length, h + 1));
    window.addEventListener('statlab:hint', handler);
    return () => window.removeEventListener('statlab:hint', handler);
  }, [allowHints, exam, finished, hints.length]);

  const bookmarked = isBookmarked(s, 'question', q.id);

  return (
    <div className={`q-card ${anim}`} key={q.id} ref={cardRef}>
      <div className="q-head">
        {!compactHeader && <span className="chip primary">{concept.title}</span>}
        {!exam && <span className="chip" title={LEVEL_NAMES[q.level]}>Level {q.level} · {LEVEL_NAMES[q.level]}</span>}
        <span className="chip">{TYPE_LABEL[q.type]}</span>
        <span className="spacer" />
        {q.calculator && <button className="btn ghost sm" onClick={() => setCalcOpen(true)} title="Open calculator"><Icon name="calc" size={16} /> <span className="hide-sm">Calculator</span></button>}
        {!exam && <button className="btn ghost sm icon" onClick={() => emit({ kind: 'mascot-open', prompt: finished ? 'Explain this problem to me.' : 'Can you give me a hint?' })} title="Ask Mu for help" aria-label="Ask Mu for help"><Icon name="chat" size={16} /></button>}
        <button className="btn ghost sm icon" onClick={() => toggleBookmark({ kind: 'question', ref: q.id, title: plain(q.prompt).slice(0, 90), snapshot: `${q.context ? q.context + '\n\n' : ''}${q.prompt}` })} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark question'} title="Bookmark">
          <Icon name="bookmark" size={16} className={bookmarked ? 'bookmarked' : ''} />
        </button>
      </div>
      <div className="q-body">
        {q.context && <Rich className="q-context" text={q.context} />}
        {q.visual && <div className="q-visual"><Visual spec={q.visual} compact /></div>}
        <Rich className="q-prompt" text={q.prompt} />

        {usingParts ? (
          <div className="parts">
            <div className="callout small"><b>Guided mode:</b> we'll solve this one step at a time. As you level up, the scaffolding comes off.</div>
            {q.parts!.map((p, i) => (
              <PartRunner key={i} part={p} index={i} active={i === partResults.length} done={partResults[i]} onGraded={(r) => onPart(i, r)} />
            ))}
          </div>
        ) : q.answer.kind === 'mc' ? (
          <McInput answer={q.answer} value={response} onChange={setResponse} graded={graded && !exam} disabled={graded} />
        ) : q.answer.kind === 'numeric' ? (
          <NumInput value={response} onChange={setResponse} onSubmit={submit} disabled={graded} unit={q.answer.unit} autoFocus />
        ) : (
          <div className="stack-sm">
            <textarea className="textarea" placeholder="Write your answer in complete sentences…" value={response} onChange={(e) => setResponse(e.target.value)} disabled={graded || grading} aria-label="Written answer" />
            <div className="tiny muted">{aiAvailable() ? '✨ Claude will give you detailed feedback on this answer.' : 'Checked offline against a rubric. Add a Claude API key in Settings for AI feedback.'}</div>
          </div>
        )}

        {!usingParts && !graded && (
          <div className="q-actions">
            <button className="btn primary" onClick={submit} disabled={!response || grading || (q.answer.kind === 'text' && response.trim().split(/\s+/).length < 3)}>
              {grading ? <><span className="spinner" /> Checking…</> : exam ? 'Submit answer' : 'Check answer'}
            </button>
            {allowHints && !exam && hintsShown < hints.length && (
              <button className="btn ghost" onClick={() => setHintsShown((h) => h + 1)}>
                <Icon name="bulb" size={16} /> {hintsShown === 0 ? 'Hint' : 'Next hint'} <span className="muted small">({hintsShown}/{hints.length})</span>
              </button>
            )}
            {!exam && <span className="tiny muted hide-sm">Keys: A–D choose · Enter check · H hint</span>}
          </div>
        )}

        {hintsShown > 0 && !exam && (
          <div className="hint-box" aria-live="polite">
            {hints.slice(0, hintsShown).map((h, i) => (
              <div className="hint" key={i}>
                <span className="hint-num">{h.label}</span>
                <Rich text={h.text} />
              </div>
            ))}
            {hintsShown > 1 && <div className="tiny muted mt-sm">Hints lower the mastery credit slightly — solving independently counts the most.</div>}
          </div>
        )}

        {/* Feedback */}
        {!exam && frq && <FrqFeedbackView fb={frq.feedback} aiError={frq.aiError} />}
        {!exam && result && !usingParts && q.answer.kind !== 'text' && (
          <div className={`feedback ${result.correct ? 'good' : result.close ? 'close' : 'bad'}`} aria-live="polite">
            <div className="row between">
              <h4>{result.correct ? praiseTitle || '✓ Correct!' : result.title}</h4>
              {xpGain > 0 && <span className="chip primary">+{xpGain} XP</span>}
            </div>
            {result.correct ? (
              <>
                {result.message && <p className="small" style={{ marginBottom: 6 }}>{plain(result.message)}</p>}
                {q.takeaway && <p className="small" style={{ marginBottom: 0 }}><b>Remember:</b> {plain(q.takeaway)}</p>}
              </>
            ) : (
              <>
                {result.message && <Rich text={result.message} />}
                {result.misconception && MISCONCEPTION_BY_ID[result.misconception] && (
                  <p className="small" style={{ marginBottom: 6 }}><b>The fix:</b> {plain(MISCONCEPTION_BY_ID[result.misconception].fix)}</p>
                )}
                <p className="small" style={{ marginBottom: 0 }}><b>Correct answer:</b> {plain(result.correctAnswer)}</p>
              </>
            )}
            <details className="solution" open={!result.correct}>
              <summary className="small bold" style={{ cursor: 'pointer' }}>Full solution</summary>
              <ol className="small mt-sm">{q.solution.map((st, i) => <li key={i}><Rich text={st} as="span" /></li>)}</ol>
            </details>
            <div className="row mt-sm wrap"><SourceTag source={q.source} /></div>
          </div>
        )}
        {usingParts && finished && result && (
          <div className={`feedback ${result.correct ? 'good' : 'close'}`}>
            <div className="row between">
              <h4>{result.correct ? praiseTitle || '✓ All steps correct!' : `${partResults.filter((p) => p.correct).length} of ${partResults.length} steps correct`}</h4>
              {xpGain > 0 && <span className="chip primary">+{xpGain} XP</span>}
            </div>
            <ol className="small">{q.solution.map((st, i) => <li key={i}><Rich text={st} as="span" /></li>)}</ol>
            <SourceTag source={q.source} />
          </div>
        )}

        {/* Interpretation follow-up (STEP 46) */}
        {q.interpretFollowUp && result?.correct && !usingParts && !exam && (
          <div className="part mt" style={{ borderColor: 'var(--primary)' }}>
            <div className="part-label"><Icon name="brain" size={12} /> What does your answer mean?</div>
            <Rich text={q.interpretFollowUp.prompt} />
            {q.interpretFollowUp.answer.kind === 'mc' && (
              <div className="mt-sm">
                <McInput answer={q.interpretFollowUp.answer} value={interp.v} onChange={(v) => !interp.r && setInterp({ v, r: null })} graded={!!interp.r} disabled={!!interp.r} />
                {!interp.r ? (
                  <button className="btn primary sm mt-sm" disabled={!interp.v} onClick={submitInterp}>Check interpretation</button>
                ) : (
                  <p className={`small mt-sm`} style={{ color: interp.r.correct ? 'var(--success)' : 'var(--danger)', marginBottom: 0 }}>
                    {interp.r.correct ? '✓ Exactly — calculation AND interpretation.' : `Not quite. ${plain(q.interpretFollowUp.explain)}`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {canNext && onDone && !exam && (
          <div className="q-actions">
            <button className="btn primary" onClick={() => onDone(outcome())} autoFocus>{nextLabel} <Icon name="right" size={16} /></button>
            <span className="tiny muted">or press Enter</span>
          </div>
        )}
      </div>
      <Modal open={calcOpen} onClose={() => setCalcOpen(false)} title="Calculator" wide>
        <Calculator compact />
      </Modal>
    </div>
  );
}
