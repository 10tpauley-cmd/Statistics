import { useEffect, useMemo, useState } from 'react';
import type { Concept, InlineInput, LessonStep, McOption } from '../../engine/types';
import { parseNumber, fmt } from '../../lib/stats/format';
import { setLessonStep, completeLesson, recordRecall, answerQuestion } from '../../state/actions';
import { getState, useLearner } from '../../state/store';
import { setTutorFocus } from '../../state/tutor';
import { nextLessonConcept } from '../../engine/planner';
import { CONCEPT_BY_ID } from '../../content/concepts';
import { playSound } from '../../lib/sound';
import { Rich, plain } from '../ui/Rich';
import { Icon } from '../ui/Icon';
import { SourceTag, SupportingTag, LinkBtn, Slider } from '../ui';
import { Visual } from '../charts/Charts';
import { Widget } from '../interactive/registry';
import { FormulaCard } from '../FormulaCard';

const KIND_LABEL: Record<LessonStep['kind'], { label: string; icon: string }> = {
  hook: { label: 'Hook', icon: 'zap' },
  predict: { label: 'Predict', icon: 'eye' },
  explain: { label: 'Explain', icon: 'book' },
  interact: { label: 'Try it', icon: 'play' },
  check: { label: 'Check', icon: 'check' },
  worked: { label: 'Worked example', icon: 'pen' },
  formula: { label: 'Formula', icon: 'sigma' },
  recall: { label: 'Recall', icon: 'brain' },
  summary: { label: 'Summary', icon: 'star' },
};

interface InlineResult {
  correct: boolean;
  yourAnswer: string;
  option?: McOption;
}

/* ---------------- Inline inputs used by predict/check steps ---------------- */

function InlineInputView({ input, done, onAnswer }: { input: InlineInput; done: InlineResult | null; onAnswer: (r: InlineResult) => void }) {
  const [text, setText] = useState('');
  const [slider, setSlider] = useState(input.type === 'slider' ? (input.min + input.max) / 2 : 0);
  if (input.type === 'mc') {
    return (
      <div className="options" role="radiogroup">
        {input.options.map((o, i) => {
          const selected = done?.option?.id === o.id;
          const cls = done ? (o.correct ? 'correct' : selected ? 'wrong' : '') : '';
          return (
            <button key={o.id} type="button" role="radio" aria-checked={selected} className={`option ${cls}`} disabled={!!done}
              onClick={() => onAnswer({ correct: !!o.correct, yourAnswer: plain(o.text), option: o })}>
              <span className="letter">{String.fromCharCode(65 + i)}</span>
              <span style={{ flex: 1 }}>
                <Rich text={o.text} as="span" />
                {done && o.why && (o.correct || selected) && <span className="why">{plain(o.why)}</span>}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
  if (input.type === 'number') {
    const submit = () => {
      const v = parseNumber(text);
      if (v === null) return;
      onAnswer({ correct: Math.abs(v - input.answer) <= input.tol, yourAnswer: text });
    };
    return (
      <div className="numeric-row">
        <input className="input lg" inputMode="decimal" placeholder={input.placeholder ?? 'Your answer'} value={done ? done.yourAnswer : text} disabled={!!done} aria-label="Your answer"
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), submit())} />
        {input.unit && <span className="muted">{input.unit}</span>}
        {!done && <button className="btn primary" onClick={submit} disabled={parseNumber(text) === null}>Check</button>}
        {done && <span className="small">Answer: <b>{fmt(input.answer, 4)}{input.unit ? ` ${input.unit}` : ''}</b></span>}
      </div>
    );
  }
  return (
    <div>
      <Slider label={input.label ?? 'Your estimate'} value={done ? parseFloat(done.yourAnswer) : slider} min={input.min} max={input.max} step={input.step} onChange={(v) => !done && setSlider(v)} format={(v) => `${fmt(v, 3)}${input.unit ?? ''}`} />
      {!done ? (
        <button className="btn primary sm mt-sm" onClick={() => onAnswer({ correct: Math.abs(slider - input.answer) <= input.tol, yourAnswer: String(slider) })}>Lock it in</button>
      ) : (
        <p className="small mt-sm" style={{ marginBottom: 0 }}>Actual: <b>{fmt(input.answer, 3)}{input.unit ?? ''}</b> (you said {fmt(parseFloat(done.yourAnswer), 3)})</p>
      )}
    </div>
  );
}

/* ---------------- Individual steps ---------------- */

function StepBody({ step, concept, index, state, setState }: { step: LessonStep; concept: Concept; index: number; state: StepState; setState: (s: StepState) => void }) {
  switch (step.kind) {
    case 'hook':
      return (
        <>
          <h2>{step.title}</h2>
          <Rich text={step.body} />
          {step.visual && <div className="mt"><Visual spec={step.visual} /></div>}
        </>
      );
    case 'predict':
      return (
        <>
          <Rich text={step.prompt} className="q-prompt" />
          {step.visual && <div className="q-visual"><Visual spec={step.visual} /></div>}
          <div className="tiny muted mb">Make your best guess — predictions are never graded.</div>
          <InlineInputView input={step.input} done={state.answer ?? null} onAnswer={(r) => setState({ ...state, answer: r })} />
          {state.answer && (
            <div className="feedback close" style={{ background: 'var(--primary-soft)', borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)' }}>
              <h4 style={{ color: 'var(--primary-text)' }}>{state.answer.correct ? 'Your intuition was right!' : 'Interesting guess — here\'s what really happens'}</h4>
              <Rich text={step.reveal} />
            </div>
          )}
        </>
      );
    case 'explain':
      return (
        <>
          <div className="row wrap" style={{ gap: 8, marginBottom: 6 }}>
            <h2 style={{ margin: 0 }}>{step.title}</h2>
            {step.supporting && <SupportingTag />}
          </div>
          <Rich text={step.body} />
          {step.visual && <div className="mt"><Visual spec={step.visual} /></div>}
          {step.source && <div className="mt-sm"><SourceTag source={step.source} /></div>}
        </>
      );
    case 'interact':
      return (
        <>
          <h2>{step.title}</h2>
          <Rich text={step.prompt} className="small mb" />
          <Widget id={step.widget} props={step.props} />
          {!state.revealed ? (
            <button className="btn sm mt" onClick={() => setState({ ...state, revealed: true })}><Icon name="bulb" size={14} /> What should I notice?</button>
          ) : (
            <div className="callout success mt"><b>Takeaway:</b> <Rich text={step.takeaway} as="span" /></div>
          )}
        </>
      );
    case 'check':
      return (
        <>
          <Rich text={step.prompt} className="q-prompt" />
          {step.visual && <div className="q-visual"><Visual spec={step.visual} /></div>}
          <InlineInputView key={state.tries ?? 0} input={step.input} done={state.answer ?? null} onAnswer={(r) => {
            const first = !state.tries;
            setState({ ...state, answer: r, tries: (state.tries ?? 0) + 1, everWrong: state.everWrong || !r.correct });
            playSound(r.correct ? 'correct' : 'wrong', getState().settings.sound);
            if (!r.correct && first) setLessonStep(concept.id, index, { wrongCheck: true });
            if (first) {
              answerQuestion({
                question: { id: `lesson:${concept.id}:${index}`, generatorId: `lesson-${concept.id}`, concept: concept.id, level: 2, type: step.input.type === 'mc' ? 'recognition' : 'calculation', dims: [step.input.type === 'mc' ? 'recognize' : 'calculate'], hints: [], prompt: step.prompt },
                correct: r.correct, hintsUsed: 0, ms: 15000, mode: 'lesson', misconception: r.option?.misconception, yourAnswer: r.yourAnswer,
                correctAnswer: step.input.type === 'mc' ? plain(step.input.options.find((o) => o.correct)?.text ?? '') : fmt(step.input.answer, 4), why: plain(step.explain),
              });
            }
          }} />
          {state.answer && (
            <div className={`feedback ${state.answer.correct ? 'good' : 'bad'}`} aria-live="polite">
              <h4>{state.answer.correct ? (state.tries === 1 ? '✓ Nailed it' : '✓ Got it now') : '✗ Not quite'}</h4>
              <Rich text={step.explain} />
              {!state.answer.correct && (
                <button className="btn sm mt-sm" onClick={() => setState({ ...state, answer: undefined })}>Try again</button>
              )}
            </div>
          )}
        </>
      );
    case 'worked': {
      const shown = state.stepsShown ?? 1;
      return (
        <>
          <h2>{step.title}</h2>
          <Rich text={step.problem} />
          {step.visual && <div className="mt-sm"><Visual spec={step.visual} /></div>}
          <div className="worked-steps">
            {step.steps.slice(0, shown).map((st, i) => (
              <div className="worked-step" key={i} style={{ animation: 'rise .3s var(--ease)' }}>
                <span className="lbl">{st.label}</span>
                <Rich text={st.body} />
              </div>
            ))}
          </div>
          {shown < step.steps.length ? (
            <div className="row">
              <button className="btn sm" onClick={() => setState({ ...state, stepsShown: shown + 1 })}>Next step ({shown}/{step.steps.length})</button>
              <button className="btn sm ghost" onClick={() => setState({ ...state, stepsShown: step.steps.length })}>Show all</button>
            </div>
          ) : (
            <div className="answer-hero"><b>Answer:</b> <Rich text={step.answer} as="span" /></div>
          )}
          {step.source && <div className="mt-sm"><SourceTag source={step.source} /></div>}
        </>
      );
    }
    case 'formula':
      return <FormulaCard formula={step.formulaId} />;
    case 'recall':
      return (
        <>
          <p className="small muted" style={{ marginTop: 0 }}>Retrieval practice: answer from memory before peeking. Struggling a little is what makes it stick.</p>
          <div className="recall-box">
            <Rich text={step.prompt} className="q-prompt" />
            <textarea className="textarea" style={{ minHeight: 90 }} placeholder="Type what you remember (optional)…" value={state.text ?? ''} onChange={(e) => setState({ ...state, text: e.target.value })} aria-label="Your recall" disabled={!!state.revealed} />
            {!state.revealed ? (
              <button className="btn primary sm mt-sm" onClick={() => setState({ ...state, revealed: true })}><Icon name="eye" size={14} /> Reveal answer</button>
            ) : (
              <>
                <div className="callout mt-sm"><Rich text={step.answer} /></div>
                {state.rating === undefined ? (
                  <div className="mt-sm">
                    <div className="small bold mb" style={{ marginBottom: 6 }}>How well did you remember?</div>
                    <div className="row wrap">
                      {([['Nailed it', 1], ['Partly', 0.6], ['Not yet', 0.2]] as const).map(([l, v]) => (
                        <button key={l} className="btn sm" onClick={() => { setState({ ...state, rating: v }); recordRecall(concept.id, v); }}>{l}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="small mt-sm" style={{ marginBottom: 0 }}>{state.rating >= 1 ? 'Great retrieval! 💪' : state.rating >= 0.6 ? 'Good — this will come back in your reviews.' : 'No problem — we\'ll bring it back soon. That\'s how memory works.'}</p>
                )}
              </>
            )}
          </div>
        </>
      );
    case 'summary':
      return (
        <>
          <h2>What you learned</h2>
          <div className="stack-sm">
            {step.points.map((p, i) => (
              <div key={i} className="row" style={{ alignItems: 'flex-start' }}>
                <span className="chip success" style={{ width: 26, padding: 0, justifyContent: 'center' }}><Icon name="check" size={13} /></span>
                <Rich text={p} />
              </div>
            ))}
          </div>
          <div className="why-box mt"><div className="section-title" style={{ marginBottom: 4 }}>🧠 Memory trick</div><Rich text={concept.memoryTrick} className="small" /></div>
        </>
      );
  }
}

interface StepState {
  answer?: InlineResult;
  tries?: number;
  everWrong?: boolean;
  revealed?: boolean;
  stepsShown?: number;
  text?: string;
  rating?: number;
}

function stepReady(step: LessonStep, st: StepState) {
  if (step.kind === 'predict') return !!st.answer;
  if (step.kind === 'check') return !!st.answer;
  if (step.kind === 'recall') return st.rating !== undefined;
  return true;
}

/* ---------------- Player ---------------- */

export function LessonPlayer({ concept }: { concept: Concept }) {
  const s = useLearner();
  const saved = s.lessons[concept.id];
  const steps = concept.lesson;
  const [idx, setIdx] = useState(() => (saved && !saved.completed ? Math.min(saved.step, steps.length - 1) : 0));
  const [states, setStates] = useState<Record<number, StepState>>({});
  const [finished, setFinished] = useState(false);
  const step = steps[idx];
  const st = states[idx] ?? {};
  const ready = stepReady(step, st);
  const isLast = idx === steps.length - 1;
  const nextConcept = useMemo(() => (finished ? nextLessonConcept(getState()) : null), [finished]);

  useEffect(() => {
    setTutorFocus({ page: `Lesson: ${concept.title} (step ${idx + 1}/${steps.length}, ${KIND_LABEL[step.kind].label})`, concept: concept.id });
  }, [concept, idx, step.kind, steps.length]);

  const go = (to: number) => {
    const t = Math.max(0, Math.min(steps.length - 1, to));
    setIdx(t);
    setLessonStep(concept.id, t);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const advance = () => {
    if (!ready) return;
    if (isLast) {
      completeLesson(concept.id);
      setFinished(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else go(idx + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || e.metaKey || e.ctrlKey) return;
      if (e.key === 'Enter' && !finished && ready && t.tagName !== 'BUTTON' && t.tagName !== 'A') { e.preventDefault(); advance(); }
      if (e.key === 'ArrowLeft' && !finished && idx > 0 && t.tagName !== 'BUTTON') go(idx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (finished) {
    const checks = steps.map((x, i) => ({ x, i })).filter(({ x }) => x.kind === 'check');
    const firstTry = checks.filter(({ i }) => states[i]?.tries === 1 && states[i]?.answer?.correct).length;
    return (
      <div className="card step-card center" style={{ padding: 32 }}>
        <div style={{ fontSize: '2.6rem' }}>🎉</div>
        <h2>Lesson complete: {concept.title}</h2>
        <p className="muted">{checks.length ? `You got ${firstTry} of ${checks.length} checks right on the first try.` : 'Nice work.'} A review is scheduled for tomorrow so this sticks.</p>
        <div className="callout small" style={{ textAlign: 'left', maxWidth: 520, margin: '0 auto 16px' }}>
          <b>Finishing a lesson is not mastery.</b> Mastery needs evidence: recognize, calculate, interpret, apply, and explain — including a level 5+ problem without hints.
        </div>
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <LinkBtn to={`/practice?concept=${concept.id}`} className="btn primary"><Icon name="target" size={16} /> Practice this concept</LinkBtn>
          <LinkBtn to={`/teach?concept=${concept.id}`} className="btn"><Icon name="chat" size={16} /> Teach it back</LinkBtn>
          {nextConcept && nextConcept !== concept.id && <LinkBtn to={`/learn/${nextConcept}`} className="btn">Next: {CONCEPT_BY_ID[nextConcept].title} <Icon name="right" size={16} /></LinkBtn>}
        </div>
        <button className="link-btn small mt" onClick={() => { setFinished(false); setStates({}); go(0); }}>Replay lesson</button>
      </div>
    );
  }

  const kind = KIND_LABEL[step.kind];
  return (
    <div>
      <div className="row between small muted">
        <span>Step {idx + 1} of {steps.length}</span>
        <span className="hide-sm">Enter = continue · ← = back</span>
      </div>
      <div className="lesson-steps" aria-hidden="true">
        {steps.map((_, i) => <span key={i} className={i < idx ? 'done' : i === idx ? 'current' : ''} />)}
      </div>
      <div className="card step-card" key={idx}>
        <span className={`step-kind ${step.kind}`}><Icon name={kind.icon} size={12} /> {kind.label}</span>
        <StepBody step={step} concept={concept} index={idx} state={st} setState={(n) => setStates((m) => ({ ...m, [idx]: n }))} />
        <div className="row between mt" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <button className="btn ghost" onClick={() => go(idx - 1)} disabled={idx === 0}><Icon name="left" size={16} /> Back</button>
          <div className="row">
            {!ready && <span className="tiny muted hide-sm">{step.kind === 'recall' ? 'Reveal and rate yourself to continue' : 'Answer to continue'}</span>}
            <button className="btn primary" onClick={advance} disabled={!ready}>{isLast ? 'Complete lesson' : 'Continue'} <Icon name={isLast ? 'check' : 'right'} size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
