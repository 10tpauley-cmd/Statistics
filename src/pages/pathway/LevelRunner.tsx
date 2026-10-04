import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConceptId, InlineInput, LessonStep, Question } from '../../engine/types';
import type { EncounterNode, LevelNode, QuestionPlan, Segment } from '../../engine/pathway/types';
import { PATHWAY } from '../../content/pathway';
import { LEVEL_TYPE_META, ENCOUNTER_META } from '../../engine/pathway/build';
import { starsFor, recommendAfterLevel, type LevelPerformance } from '../../engine/pathway/progress';
import { GENERATOR_BY_ID, makeQuestion, pickGenerator, levelFor } from '../../engine/questions';
import { cs, masteryInfo } from '../../engine/learner';
import { CONCEPT_BY_ID } from '../../content/concepts';
import { MISCONCEPTION_BY_ID } from '../../content/misconceptions';
import { FORMULA_BY_ID } from '../../content/formulas';
import { getState, useLearner } from '../../state/store';
import { setTutorFocus } from '../../state/tutor';
import { answerQuestion, completeLesson, endSession, recordTeach, setLessonStep, startSession } from '../../state/actions';
import { completeEncounter, completePathwayLevel, noteQuickReview, savePathwayStep } from '../../state/pathway';
import { StepBody, stepReady, type StepState } from '../../components/lesson/LessonPlayer';
import { QuestionCard, type QuestionOutcome } from '../../components/question/QuestionCard';
import { FrqFeedbackView } from '../../components/question/FrqFeedbackView';
import { NpcBubble } from '../../components/pathway/art';
import { Visual } from '../../components/charts/Charts';
import { Rich, TeX, plain } from '../../components/ui/Rich';
import { Icon } from '../../components/ui/Icon';
import { Ring } from '../../components/ui';
import { gradeFrq, aiAvailable, type FrqResult } from '../../lib/frqService';
import { navigate } from '../../lib/router';
import * as fx from '../../lib/fx';

/* ---------------- Question generation from a plan ---------------- */

const recentGens: string[] = [];

/** Fresh question for a plan, nudged toward the learner's adaptive level (existing engine). */
export function questionForPlan(plan: QuestionPlan, opts: { noEasier?: boolean } = {}): Question {
  const s = getState();
  const learnerLevel = cs(s, plan.concept).level;
  const shift = learnerLevel >= plan.level + 2 ? 1 : learnerLevel < plan.level - 1 && !opts.noEasier ? -1 : 0;
  const lvl = Math.max(1, Math.min(7, plan.level + shift));
  const allowed = (id: string) => {
    const g = GENERATOR_BY_ID[id];
    return g && g.concept === plan.concept && !plan.excludeTypes?.includes(g.type);
  };
  let gen = null as ReturnType<typeof pickGenerator>;
  const listed = (plan.generators ?? []).filter(allowed);
  if (listed.length) {
    const typed = plan.preferTypes ? listed.filter((id) => plan.preferTypes!.includes(GENERATOR_BY_ID[id].type)) : [];
    const pool = (typed.length ? typed : listed).filter((id) => !recentGens.slice(-3).includes(id));
    const ids = pool.length ? pool : typed.length ? typed : listed;
    gen = GENERATOR_BY_ID[ids[Math.floor(Math.random() * ids.length)]];
  }
  gen = gen ?? pickGenerator({ concept: plan.concept, level: lvl, preferTypes: plan.preferTypes, excludeTypes: plan.excludeTypes, avoidGenerators: recentGens.slice(-4) })
    ?? pickGenerator({ concept: plan.concept, level: lvl })!;
  recentGens.push(gen.id);
  if (recentGens.length > 12) recentGens.shift();
  return makeQuestion(gen, levelFor(gen, lvl));
}

/* ---------------- Stage labels ---------------- */

function stageOf(seg: Segment): string {
  switch (seg.kind) {
    case 'intro': return 'Intro';
    case 'hook': return 'Hook';
    case 'lesson-step': return ({ hook: 'Hook', predict: 'Discover', explain: 'Teach', interact: 'Discover', check: 'Check', worked: 'Example', formula: 'Formula', recall: 'Recall', summary: 'Summary' } as Record<string, string>)[seg.step.kind];
    case 'predict': case 'widget': return 'Discover';
    case 'question': return ({ practice: 'Practice', practice2: 'Practice 2', apply: 'Apply', challenge: 'Challenge', check: 'Check' } as Record<string, string>)[seg.stage];
    case 'misconceptions': return 'Trap';
    case 'recall': return 'Recall';
    case 'teach': return 'Teach it';
    case 'formula-match': return 'Formula';
    case 'mc': return 'Question';
    case 'complete': return 'Complete';
  }
}

/** Segments rendered through the shared lesson step renderer. */
function asLessonStep(seg: Segment): LessonStep | null {
  if (seg.kind === 'lesson-step') return seg.step;
  if (seg.kind === 'predict') return { kind: 'predict', prompt: seg.prompt, input: seg.input, reveal: seg.reveal };
  if (seg.kind === 'widget') return { kind: 'interact', title: 'Discover', widget: seg.widget, props: seg.props, prompt: seg.mission, takeaway: seg.takeaway };
  if (seg.kind === 'recall') return { kind: 'recall', prompt: seg.prompt, answer: seg.answer };
  return null;
}

/* ---------------- Small segment components ---------------- */

function McSegment({ seg, id, saved, onScored }: { seg: Extract<Segment, { kind: 'mc' }>; id: string; saved?: string; onScored: (correct: boolean, picked: string) => void }) {
  const [picked, setPicked] = useState<string | null>(saved ?? null);
  const input = seg.input as Extract<InlineInput, { type: 'mc' }>;
  const choose = (oid: string, el: Element) => {
    if (picked) return;
    setPicked(oid);
    const o = input.options.find((x) => x.id === oid)!;
    const correct = !!o.correct;
    answerQuestion({
      question: { id: `enc:${id}`, generatorId: `enc-${id}`, concept: seg.concept, level: 3, type: 'conceptual', dims: ['recognize', 'interpret'], hints: [], prompt: seg.prompt },
      correct, hintsUsed: 0, ms: 15000, mode: 'pathway', misconception: o.misconception, yourAnswer: plain(o.text), correctAnswer: plain(input.options.find((x) => x.correct)?.text ?? ''), why: plain(seg.explain),
    });
    if (correct) fx.correct(el, {}); else fx.wrong(null);
    onScored(correct, oid);
  };
  return (
    <>
      <Rich text={seg.prompt} className="q-prompt" />
      <div className="options">
        {input.options.map((o, i) => {
          const cls = picked ? (o.correct ? 'correct' : picked === o.id ? 'wrong' : '') : '';
          return (
            <button key={o.id} className={`option ${cls}`} disabled={!!picked} onClick={(e) => choose(o.id, e.currentTarget)}>
              <span className="letter">{String.fromCharCode(65 + i)}</span>
              <span style={{ flex: 1 }}><Rich text={o.text} as="span" />{picked && o.why && (o.correct || picked === o.id) && <span className="why">{plain(o.why)}</span>}</span>
            </button>
          );
        })}
      </div>
      {picked && <div className={`feedback ${input.options.find((o) => o.id === picked)?.correct ? 'good' : 'bad'}`}><Rich text={seg.explain} /></div>}
    </>
  );
}

function FormulaMatch({ formula, saved, onScored }: { formula: string; saved?: Record<string, string>; onScored: (score: number, picks: Record<string, string>) => void }) {
  const f = FORMULA_BY_ID[formula];
  const meanings = useMemo(() => f.symbols.map((s) => s.meaning).sort(() => Math.random() - 0.5), [f]);
  const [picks, setPicks] = useState<Record<string, string>>(saved ?? {});
  const [checked, setChecked] = useState(!!saved);
  const right = f.symbols.filter((s) => picks[s.sym] === s.meaning).length;
  return (
    <>
      <div className="answer-hero center"><TeX src={f.latex} display /></div>
      <p className="small muted">Match each symbol of <b>{f.name}</b> to what it means.</p>
      <div className="stack-sm">
        {f.symbols.map((s) => (
          <div key={s.sym} className="row wrap" style={{ gap: 10 }}>
            <span className="chip" style={{ minWidth: 70, justifyContent: 'center' }}><TeX src={s.sym} /></span>
            <select className="select" style={{ flex: 1, minWidth: 200, height: 38 }} value={picks[s.sym] ?? ''} disabled={checked} aria-label={`Meaning of ${s.sym}`}
              onChange={(e) => setPicks((p) => ({ ...p, [s.sym]: e.target.value }))}>
              <option value="">Choose a meaning…</option>
              {meanings.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {checked && <span>{picks[s.sym] === s.meaning ? '✅' : `❌ ${s.meaning}`}</span>}
          </div>
        ))}
      </div>
      {!checked ? (
        <button className="btn primary mt" disabled={Object.keys(picks).length < f.symbols.length} onClick={(e) => { setChecked(true); const sc = right / f.symbols.length; if (sc === 1) fx.correct(e.currentTarget, {}); else fx.wrong(null); onScored(sc, picks); }}>Restore the formula</button>
      ) : <div className={`feedback ${right === f.symbols.length ? 'good' : 'close'}`}><h4>{right} of {f.symbols.length} symbols restored</h4><Rich text={f.meaning} /></div>}
    </>
  );
}

function TeachSegment({ concept, saved, onScored }: { concept: ConceptId; saved?: { text: string; res: FrqResult }; onScored: (score: number, done: { text: string; res: FrqResult }) => void }) {
  const c = CONCEPT_BY_ID[concept];
  const [text, setText] = useState(saved?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<FrqResult | null>(saved?.res ?? null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const submit = async () => {
    setBusy(true);
    const r = await gradeFrq({ concept, prompt: c.teach.prompt, rubric: c.teach, answer: text, mode: 'teach' });
    setBusy(false);
    setRes(r);
    recordTeach(concept, text, r.feedback);
    if (r.feedback.score >= 70) fx.correct(boxRef.current, { perfect: r.feedback.score >= 90 }); else fx.wrong(null);
    onScored(r.feedback.score / 100, { text, res: r });
  };
  return (
    <>
      <Rich text={c.teach.prompt} className="q-prompt" />
      <div className="row wrap" style={{ gap: 6 }}>{['Say what it **is**', 'Give an **example**', 'Explain **why** it matters', 'Name a **common mistake**'].map((t) => <span key={t} className="chip"><Rich text={t} as="span" /></span>)}</div>
      <textarea ref={boxRef} className="textarea mt-sm" style={{ minHeight: 160 }} value={text} onChange={(e) => setText(e.target.value)} disabled={busy || !!res} placeholder="Explain it as if you were teaching a friend…" aria-label="Your explanation" />
      {!res && (
        <div className="row between mt-sm">
          <span className="tiny muted">{words} words{words < 15 ? ' · at least 15' : ''} · {aiAvailable() ? '✨ Claude will coach you' : 'checked offline against a rubric'}</span>
          <button className="btn primary" disabled={words < 15 || busy} onClick={submit}>{busy ? <><span className="spinner" /> Reading…</> : 'Get feedback'}</button>
        </div>
      )}
      {res && <FrqFeedbackView fb={res.feedback} aiError={res.aiError} />}
    </>
  );
}

/** Number that ticks up — small, satisfying, and skipped when motion is reduced. */
export function CountUp({ to, ms = 900 }: { to: number; ms?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (to <= 0) { setV(to); return; }
    const reduced = getState().settings.reducedMotion || getState().settings.effects === 'off';
    if (reduced) { setV(to); return; }
    const t0 = performance.now();
    let raf = 0;
    let ticks = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const next = Math.round(to * (1 - (1 - p) ** 3));
      setV(next);
      if (++ticks % 4 === 0 && p < 1) fx.sound('click');
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <>{v}</>;
}

/* ---------------- Runner ---------------- */

export interface RunnerProps {
  kind: 'level' | 'encounter' | 'review';
  title: string;
  segments: Segment[];
  theme: string;
  node?: LevelNode | EncounterNode;
  reviewConcept?: ConceptId;
  then?: string; // node id to continue to after a quick review
}

export function LevelRunner(props: RunnerProps) {
  const { kind, title, segments, theme, node } = props;
  const s = useLearner();
  const levelId = kind === 'level' && node ? node.id : undefined;
  // Resume only when the saved run's score came along with it — otherwise start over so stars stay honest.
  const [resume] = useState(() => {
    const rec = levelId ? getState().pathway.levels[levelId] : undefined;
    const step = rec?.step ?? 0;
    return step > 0 && step < segments.length - 1 && rec?.run ? { step, run: rec.run } : null;
  });
  const [idx, setIdx] = useState(resume?.step ?? 0);
  const [steps, setSteps] = useState<Record<number, StepState>>({});
  const [questions, setQuestions] = useState<Record<number, Question>>({});
  const [scoredSet, setScoredSet] = useState<Set<number>>(() => new Set(resume?.run.scored ?? []));
  // Answers to custom segments, kept so going Back shows them read-only instead of re-asking (and re-paying XP).
  const [answers, setAnswers] = useState<Record<number, unknown>>({});
  const perf = useRef<LevelPerformance & { perConcept: Partial<Record<ConceptId, { score: number; n: number }>> }>(
    resume ? { graded: resume.run.graded, score: resume.run.score, hints: resume.run.hints, perConcept: { ...resume.run.perConcept } } : { graded: 0, score: 0, hints: 0, perConcept: {} });
  const segRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<null | { stars: number; xp: number; acc: number; rec: ReturnType<typeof recommendAfterLevel>; firstTime: boolean }>(null);
  const seg = segments[idx];
  const concepts = useMemo(() => [...new Set(segments.flatMap((x) => (x.kind === 'intro' ? x.concepts : [])))], [segments]);
  const starEls = useRef<(HTMLSpanElement | null)[]>([]);
  const cancelStars = useRef<() => void>(() => {});

  useEffect(() => {
    startSession('pathway', concepts);
    return () => { endSession(); };
  }, [concepts]);
  useEffect(() => { setTutorFocus({ page: `Pathway: ${title}`, concept: concepts[0] }); }, [title, concepts]);
  const persist = (at: number, scored: Set<number>) => {
    if (!levelId) return;
    const p = perf.current;
    savePathwayStep(levelId, at, { graded: p.graded, score: p.score, hints: p.hints, perConcept: { ...p.perConcept }, scored: [...scored] });
  };
  useEffect(() => {
    if (seg.kind !== 'complete') persist(idx, scoredSet);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Keep keyboard focus inside the new step (unless a field in it already took focus).
    const el = segRef.current;
    if (el && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Generate questions lazily (once per segment so going back doesn't reroll).
  useEffect(() => {
    if (seg.kind === 'question' && !questions[idx]) setQuestions((q) => ({ ...q, [idx]: questionForPlan(seg.plan) }));
  }, [idx, seg, questions]);

  const score = (i: number, value: number, concept: ConceptId | undefined, hints = 0) => {
    if (scoredSet.has(i)) return;
    const nextSet = new Set(scoredSet).add(i);
    setScoredSet(nextSet);
    perf.current.graded += 1;
    perf.current.score += value;
    perf.current.hints += hints;
    if (concept) {
      const pc = perf.current.perConcept[concept] ?? { score: 0, n: 0 };
      perf.current.perConcept[concept] = { score: pc.score + value, n: pc.n + 1 };
    }
    persist(idx, nextSet); // leaving right after answering can't erase (or redo) this result
  };
  const keep = (i: number, v: unknown) => setAnswers((a) => ({ ...a, [i]: v }));

  // Finishing: stars, XP, lesson sync, encounter/review bookkeeping, recommendation.
  useEffect(() => {
    if (seg.kind !== 'complete' || result) return;
    const p = perf.current;
    const stars = starsFor(p);
    const acc = p.graded ? p.score / p.graded : 1;
    let xp = 0;
    let firstTime = false;
    segments.forEach((x) => { if (x.kind === 'lesson-step' && x.last) completeLesson(x.concept); });
    if (kind === 'level' && levelId) { const r = completePathwayLevel(levelId, stars, p.graded ? acc : null); xp = r.xp; firstTime = r.firstTime; }
    if (kind === 'encounter' && node) xp = completeEncounter(node.id);
    if (kind === 'review' && props.reviewConcept) noteQuickReview(props.reviewConcept);
    const rec = kind === 'level' ? recommendAfterLevel(getState(), p.perConcept) : null;
    setResult({ stars, xp, acc, rec, firstTime });
    fx.sound('complete');
    fx.celebrate('level');
    const t = window.setTimeout(() => { cancelStars.current = fx.stars(starEls.current.filter(Boolean) as Element[], stars); }, 50);
    cancelStars.current = () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg.kind]);
  useEffect(() => () => cancelStars.current(), []);

  const next = () => {
    if (seg.kind === 'lesson-step' && seg.step.kind === 'check') {
      const st = steps[idx];
      score(idx, st?.tries === 1 && st.answer?.correct ? 1 : 0, seg.concept);
    }
    if (seg.kind === 'lesson-step' && seg.index >= 0) setLessonStep(seg.concept, seg.index + 1);
    fx.sound('whoosh');
    setIdx((i) => Math.min(segments.length - 1, i + 1));
  };
  const back = () => setIdx((i) => Math.max(0, i - 1));
  const exit = () => navigate('/pathway');

  const lessonStep = asLessonStep(seg);
  const ready = lessonStep ? stepReady(lessonStep, steps[idx] ?? {}) : seg.kind === 'question' || seg.kind === 'teach' || seg.kind === 'formula-match' || seg.kind === 'mc' ? scoredSet.has(idx) : true;
  const typeMeta = node?.kind === 'level' ? LEVEL_TYPE_META[node.type] : node?.kind === 'encounter' ? { label: ENCOUNTER_META[node.encounter.kind].label, emoji: ENCOUNTER_META[node.encounter.kind].emoji } : { label: 'Quick review', emoji: '🔄' };

  return (
    <div className={`pw-runner theme-${theme}`}>
      <div className="pw-runner-bar">
        <button className="btn ghost icon sm" onClick={exit} aria-label="Back to the Pathway" title="Back to the Pathway (progress is saved)"><Icon name="x" /></button>
        <div className="pw-runner-title">
          <span className="pw-kicker" style={{ opacity: 1, color: 'var(--rg-accent)' }}>{typeMeta.emoji} {node?.kind === 'level' ? `LEVEL ${node.number} · ` : ''}{typeMeta.label.toUpperCase()}</span>
          <b>{title}</b>
        </div>
        <div className="pw-segbar" aria-label={`Step ${idx + 1} of ${segments.length}`}>
          {segments.map((x, i) => <span key={i} className={i < idx ? 'done' : i === idx ? 'current' : ''} title={stageOf(x)} />)}
        </div>
      </div>
      <div className="content narrow">
        <div className="pw-stage-label">{stageOf(seg)}</div>
        <div className="card step-card pw-seg" key={idx} ref={segRef} tabIndex={-1} aria-label={`${stageOf(seg)} — step ${idx + 1} of ${segments.length}`}>
          {seg.kind === 'intro' && (
            <div className="center stack">
              <div className="pw-intro-emoji">{typeMeta.emoji}</div>
              <div className="pw-kicker" style={{ color: 'var(--rg-accent)', opacity: 1 }}>{node?.kind === 'level' ? `LEVEL ${node.number}` : typeMeta.label}</div>
              <h1 style={{ margin: 0 }}>{seg.title}</h1>
              <Rich text={seg.text} className="pw-intro-text" />
              <div className="row wrap" style={{ justifyContent: 'center', gap: 6 }}>
                {seg.concepts.map((c) => <span key={c} className="chip">{CONCEPT_BY_ID[c].title}</span>)}
                <span className="chip">~{seg.minutes} min</span>
              </div>
              {seg.npc && <div style={{ textAlign: 'left' }}><NpcBubble id={seg.npc.npc} text={seg.npc.text} /></div>}
            </div>
          )}
          {seg.kind === 'hook' && (
            <>
              <span className="step-kind hook"><Icon name="zap" size={12} /> Hook</span>
              <h2>{seg.title}</h2>
              <Rich text={seg.body} />
              {seg.visual && <div className="mt"><Visual spec={seg.visual} /></div>}
            </>
          )}
          {lessonStep && seg.kind !== 'intro' && (
            <StepBody step={lessonStep} concept={CONCEPT_BY_ID[seg.kind === 'lesson-step' ? seg.concept : seg.kind === 'recall' ? seg.concept : concepts[0]]}
              index={seg.kind === 'lesson-step' ? seg.index : -1} state={steps[idx] ?? {}} setState={(n) => setSteps((m) => ({ ...m, [idx]: n }))} />
          )}
          {seg.kind === 'question' && questions[idx] && scoredSet.has(idx) && (
            <div className="callout tiny" style={{ marginBottom: 10 }}>Already answered — this retry is practice only and won't change your stars or XP.</div>
          )}
          {seg.kind === 'question' && questions[idx] && (
            <QuestionCard key={questions[idx].id} question={questions[idx]} mode="pathway" record={!scoredSet.has(idx)} scaffold={seg.scaffold && !!questions[idx].parts?.length} allowHints={seg.hints} compactHeader={false}
              nextLabel={idx + 1 >= segments.length - 1 ? 'Finish level' : 'Continue'}
              onDone={(o: QuestionOutcome) => { score(idx, o.correct ? 1 : o.score, seg.plan.concept, o.hints); next(); }} />
          )}
          {seg.kind === 'misconceptions' && (
            <>
              <span className="step-kind check"><Icon name="target" size={12} /> Trap check</span>
              <h2>Traps to avoid in {CONCEPT_BY_ID[seg.concept].title}</h2>
              <div className="stack-sm">
                {seg.ids.map((id) => MISCONCEPTION_BY_ID[id]).filter(Boolean).map((m) => (
                  <div key={m.id} className="callout warn"><b>⚠️ {m.title}</b> — {m.short}<div className="mt-sm small"><b>The fix:</b> <Rich text={m.fix} as="span" /></div></div>
                ))}
              </div>
              <p className="tiny muted mt-sm" style={{ marginBottom: 0 }}>Next: questions built to catch exactly these traps.</p>
            </>
          )}
          {(seg.kind === 'teach' || seg.kind === 'formula-match' || seg.kind === 'mc') && scoredSet.has(idx) && answers[idx] === undefined ? (
            <div className="callout"><b>✓ Already answered.</b> You finished this step before you left — your result is saved. Continue on.</div>
          ) : <>
          {seg.kind === 'teach' && <TeachSegment concept={seg.concept} saved={answers[idx] as { text: string; res: FrqResult } | undefined} onScored={(v, d) => { keep(idx, d); score(idx, v, seg.concept); }} />}
          {seg.kind === 'formula-match' && <FormulaMatch formula={seg.formula} saved={answers[idx] as Record<string, string> | undefined} onScored={(v, d) => { keep(idx, d); score(idx, v, concepts[0]); }} />}
          {seg.kind === 'mc' && <McSegment seg={seg} id={`${node?.id ?? 'x'}-${idx}`} saved={answers[idx] as string | undefined} onScored={(c, d) => { keep(idx, d); score(idx, c ? 1 : 0, seg.concept); }} />}
          </>}
          {seg.kind === 'complete' && result && (
            <div className="center stack">
              <div className="pw-complete-burst">🎉</div>
              <h1 style={{ margin: 0 }}>{kind === 'review' ? 'Review complete!' : kind === 'encounter' ? 'Encounter cleared!' : 'Level complete!'}</h1>
              {kind === 'level' && (
                <div className="pw-big-stars" aria-label={`${result.stars} of 3 stars`}>
                  {[0, 1, 2].map((i) => <span key={i} ref={(el) => { starEls.current[i] = el; }}>★</span>)}
                </div>
              )}
              <div className="row wrap" style={{ justifyContent: 'center', gap: 10 }}>
                <span className="chip primary">⚡ +<CountUp to={result.xp} /> XP</span>
                {perf.current.graded > 0 && <span className="chip">{Math.round(result.acc * 100)}% first-try accuracy</span>}
                <span className="chip">{perf.current.hints} hint{perf.current.hints === 1 ? '' : 's'}</span>
                {!result.firstTime && kind === 'level' && <span className="chip">Replay — XP only for new stars</span>}
              </div>
              <div className="card flat pad-sm" style={{ textAlign: 'left' }}>
                <div className="section-title">What you learned</div>
                <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{seg.summary.map((p, i) => <li key={i}><Rich text={p} as="span" /></li>)}</ul>
              </div>
              <div className="row wrap" style={{ justifyContent: 'center', gap: 16 }}>
                {concepts.slice(0, 4).map((c) => { const info = masteryInfo(s, c); return <div key={c} className="stack-sm center"><Ring value={info.overall} size={52} mastered={info.mastered} /><span className="tiny">{CONCEPT_BY_ID[c].title}</span></div>; })}
              </div>
              {result.rec ? (
                <div className="callout warn" style={{ textAlign: 'left' }}>
                  <b>Before continuing, let's strengthen {CONCEPT_BY_ID[result.rec.concept].title}.</b> {result.rec.reason}
                  <div className="row wrap mt-sm">
                    <button className="btn primary sm" onClick={() => navigate(`/pathway/review/${result.rec!.concept}`)}><Icon name="repeat" size={14} /> Quick review (3 min)</button>
                    <button className="btn sm" onClick={exit}>Continue anyway</button>
                  </div>
                </div>
              ) : (
                <div className="row wrap" style={{ justifyContent: 'center' }}>
                  <button className="btn primary lg" onClick={() => (props.then ? navigate(`/pathway/play/${props.then}`) : exit())}>Continue journey <Icon name="right" size={18} /></button>
                  {kind === 'level' && node && <button className="btn" onClick={() => navigate(`/pathway/play/${node.id}?replay=${Date.now() % 100000}`)}><Icon name="repeat" size={16} /> Replay</button>}
                </div>
              )}
            </div>
          )}
          {seg.kind !== 'question' && seg.kind !== 'complete' && (
            <div className="row between mt" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <button className="btn ghost" onClick={back} disabled={idx === 0}><Icon name="left" size={16} /> Back</button>
              <div className="row">
                {!ready && <span className="tiny muted hide-sm">{seg.kind === 'teach' ? 'Submit your explanation to continue' : lessonStep?.kind === 'recall' ? 'Reveal and rate yourself to continue' : 'Answer to continue'}</span>}
                <button className="btn primary" onClick={next} disabled={!ready}>{seg.kind === 'intro' ? "Let's go" : 'Continue'} <Icon name="right" size={16} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Route wrappers ---------------- */

export function nodeTheme(regionIndex: number) {
  return PATHWAY.regions[regionIndex].spec.theme;
}
