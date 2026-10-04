import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConceptId, Generator, Question, SessionRecord, StudyMode } from '../engine/types';
import { useLearner, getState } from '../state/store';
import { startSession, endSession, recordRecall, resolveMistake, LEVEL_NAMES } from '../state/actions';
import { setTutorFocus } from '../state/tutor';
import { cs, masteryInfo } from '../engine/learner';
import { mixedPool, openMistakes, startedConcepts } from '../engine/planner';
import { GENERATORS, GENERATOR_BY_ID, makeQuestion, pickGenerator, levelFor } from '../engine/questions';
import { CONCEPTS, CONCEPT_BY_ID } from '../content/concepts';
import { UNITS } from '../content/units';
import { QuestionCard, type QuestionOutcome } from '../components/question/QuestionCard';
import { SessionSummary, type SessionResult } from '../components/SessionSummary';
import { Rich } from '../components/ui/Rich';
import { Icon } from '../components/ui/Icon';
import { Empty, LinkBtn, Toggle, Ring } from '../components/ui';
import { navigate } from '../lib/router';

type Mode = 'smart' | 'concept' | 'mixed' | 'method' | 'mistakes' | 'graph' | 'quick' | 'recall';

const MODES: Record<Mode, { title: string; desc: string; icon: string; study: StudyMode }> = {
  smart: { title: 'Smart practice', desc: 'An adaptive mix drawn from your weakest and most-due concepts.', icon: 'sparkles', study: 'practice' },
  concept: { title: 'Concept practice', desc: 'Adaptive problems on one concept, from recognition up to mastery level.', icon: 'target', study: 'practice' },
  mixed: { title: 'Mixed review', desc: 'Interleaved topics with no labels — you must recognize which idea applies.', icon: 'shuffle', study: 'mixed' },
  method: { title: 'Which method?', desc: 'Don\'t calculate — pick the right tool for the situation. The skill exams test most.', icon: 'help', study: 'method' },
  mistakes: { title: 'Fix my mistakes', desc: 'Fresh variants of problems you missed. Get them right to resolve them.', icon: 'alert', study: 'mistakes' },
  graph: { title: 'Graph reading', desc: 'Histograms, dot plots, box plots, scatterplots, residual plots, and tables.', icon: 'chart', study: 'graph' },
  quick: { title: '5-minute quiz', desc: 'Five quick questions from what you have studied.', icon: 'zap', study: 'quick' },
  recall: { title: 'Retrieval challenge', desc: 'Answer from memory, reveal, and rate yourself. Builds long-term memory.', icon: 'brain', study: 'recall' },
};

function weightedPick<T>(items: T[], weight: (t: T, i: number) => number): T {
  const ws = items.map(weight);
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

interface NextCtx {
  mode: Mode;
  concept?: ConceptId;
  recentGens: string[];
  recentConcepts: ConceptId[];
  usedMistakes: Set<string>;
}

function nextQuestion(ctx: NextCtx): { q: Question; mistakeId?: string } | null {
  const s = getState();
  const build = (g: Generator, concept: ConceptId) => makeQuestion(g, levelFor(g, cs(s, concept).level));
  if (ctx.mode === 'method') {
    const g = GENERATOR_BY_ID['mt-which'];
    let q = makeQuestion(g, 5);
    for (let i = 0; i < 4 && ctx.recentConcepts.slice(-2).includes(q.concept); i++) q = makeQuestion(g, 5);
    return { q };
  }
  if (ctx.mode === 'mistakes') {
    const open = openMistakes(s).filter((m) => !ctx.usedMistakes.has(m.id)).sort((a, b) => a.t - b.t);
    const m = open[0];
    if (!m) return null;
    const g = GENERATOR_BY_ID[m.gen] ?? pickGenerator({ concept: m.concept, level: m.level, excludeTypes: ['free-response'] });
    if (!g) return null;
    return { q: makeQuestion(g, levelFor(g, m.level)), mistakeId: m.id };
  }
  if (ctx.mode === 'concept' && ctx.concept) {
    const g = pickGenerator({ concept: ctx.concept, level: cs(s, ctx.concept).level, avoidGenerators: ctx.recentGens });
    return g ? { q: build(g, ctx.concept) } : null;
  }
  const pool = mixedPool(s).slice(0, 8);
  if (ctx.mode === 'graph') {
    let gens = GENERATORS.filter((g) => g.type === 'graph' && pool.includes(g.concept));
    if (gens.length < 3) gens = GENERATORS.filter((g) => g.type === 'graph');
    const fresh = gens.filter((g) => !ctx.recentGens.slice(-3).includes(g.id));
    const g = (fresh.length ? fresh : gens)[Math.floor(Math.random() * (fresh.length || gens.length))];
    return { q: build(g, g.concept) };
  }
  const candidates = pool.filter((c) => !ctx.recentConcepts.slice(-1).includes(c));
  const concept = weightedPick(candidates.length ? candidates : pool, (_c, i) => 1 / (1 + i * 0.35));
  const g = pickGenerator({ concept, level: cs(s, concept).level, avoidGenerators: ctx.recentGens, excludeTypes: ctx.mode === 'quick' ? ['free-response', 'multi-step'] : undefined });
  return g ? { q: build(g, concept) } : null;
}

/* ---------------- Recall session ---------------- */

function RecallSession() {
  const items = useMemo(() => {
    const s = getState();
    const started = startedConcepts(s);
    const src = started.length ? started : CONCEPTS.slice(0, 4);
    const all = src.flatMap((c) => [...c.recall, ...c.lesson.flatMap((st) => (st.kind === 'recall' ? [{ prompt: st.prompt, answer: st.answer }] : []))].map((r) => ({ ...r, concept: c.id })));
    return all.sort(() => Math.random() - 0.5).slice(0, 8);
  }, []);
  const [i, setI] = useState(0);
  const [text, setText] = useState('');
  const [shown, setShown] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  if (!items.length) return <Empty title="Nothing to recall yet">Complete a lesson first.</Empty>;
  if (i >= items.length) {
    const avg = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
    return (
      <div className="card center" style={{ padding: 28 }}>
        <div className="big-num">{Math.round(avg * 100)}%</div>
        <p className="muted">recalled across {items.length} prompts. Each one fed your explain-evidence and review schedule.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn primary" onClick={() => { setI(0); setScores([]); setShown(false); setText(''); }}>Another round</button>
          <LinkBtn to="/" className="btn">Dashboard</LinkBtn>
        </div>
      </div>
    );
  }
  const it = items[i];
  const rate = (v: number) => {
    recordRecall(it.concept, v);
    setScores((x) => [...x, v]);
    setI(i + 1); setShown(false); setText('');
  };
  return (
    <div className="card">
      <div className="row between small muted"><span className="chip primary">{CONCEPT_BY_ID[it.concept].title}</span><span>{i + 1} / {items.length}</span></div>
      <Rich text={it.prompt} className="q-prompt mt" />
      <textarea className="textarea" placeholder="Answer from memory first…" value={text} onChange={(e) => setText(e.target.value)} disabled={shown} aria-label="Your answer" />
      {!shown ? (
        <button className="btn primary mt-sm" onClick={() => setShown(true)}><Icon name="eye" size={16} /> Reveal</button>
      ) : (
        <>
          <div className="callout mt-sm"><Rich text={it.answer} /></div>
          <div className="row wrap mt-sm">
            <span className="small bold">How did you do?</span>
            <button className="btn sm" onClick={() => rate(1)}>Nailed it</button>
            <button className="btn sm" onClick={() => rate(0.6)}>Partly</button>
            <button className="btn sm" onClick={() => rate(0.2)}>Missed it</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Adaptive session ---------------- */

function PracticeSession({ mode, concept }: { mode: Mode; concept?: ConceptId }) {
  const s = useLearner();
  const ctx = useRef<NextCtx>({ mode, concept, recentGens: [], recentConcepts: [], usedMistakes: new Set() });
  const [cur, setCur] = useState<{ q: Question; mistakeId?: string } | null>(() => nextQuestion(ctx.current));
  const [results, setResults] = useState<SessionResult[]>([]);
  const [summary, setSummary] = useState<{ rec: SessionRecord | null } | null>(null);
  const [guided, setGuided] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const info = concept ? masteryInfo(s, concept) : null;
  const meta = MODES[mode];

  useEffect(() => {
    startSession(meta.study, concept ? [concept] : []);
    if (concept) setTutorFocus({ concept });
    return () => { endSession(); };
  }, [meta.study, concept]);

  const finish = () => setSummary({ rec: endSession() });

  const onDone = (o: QuestionOutcome) => {
    if (!cur) return;
    const r: SessionResult = { concept: cur.q.concept, correct: o.correct, score: o.score, hints: o.hints, misconception: o.misconception };
    const nextResults = [...results, r];
    setResults(nextResults);
    setStreak(o.correct ? streak + 1 : 0);
    ctx.current.recentGens = [...ctx.current.recentGens, cur.q.generatorId].slice(-6);
    ctx.current.recentConcepts = [...ctx.current.recentConcepts, cur.q.concept].slice(-4);
    if (cur.mistakeId) {
      ctx.current.usedMistakes.add(cur.mistakeId);
      // A correct fresh variant fixes the mistake, even when it came from a lesson check or boss stage.
      if (o.correct && o.hints === 0) resolveMistake(cur.mistakeId);
    }
    if (mode === 'quick' && nextResults.length >= 5) { finish(); return; }
    const n = nextQuestion(ctx.current);
    if (!n) { finish(); return; }
    setCur(n);
  };

  if (summary) {
    return (
      <SessionSummary title={meta.title + (concept ? `: ${CONCEPT_BY_ID[concept].title}` : '')} results={results} record={summary.rec}
        onAgain={() => { startSession(meta.study, concept ? [concept] : []); setResults([]); setSummary(null); setStreak(0); ctx.current.usedMistakes = new Set(); setCur(nextQuestion(ctx.current)); }} />
    );
  }
  if (!cur) {
    return mode === 'mistakes'
      ? <Empty icon="🎉" title="Mistake Bank is clear" action={<LinkBtn to="/practice?mode=mixed" className="btn primary">Mixed practice</LinkBtn>}>No open mistakes right now. Every wrong answer lands here automatically so you can fix it later.</Empty>
      : <Empty title="No problems available">Try another mode.</Empty>;
  }
  const q = cur.q;
  const level = cs(s, q.concept).level;
  const scaffold = guided ?? (level <= 3 && !!q.parts?.length);
  const correct = results.filter((r) => r.correct).length;
  return (
    <div className="stack">
      <div className="card pad-sm row wrap between">
        <div className="row wrap" style={{ gap: 10 }}>
          {info && concept ? <Ring value={info.overall} size={40} stroke={4} mastered={info.mastered} /> : <Icon name={meta.icon} size={22} />}
          <div>
            <div className="bold small">{meta.title}{concept ? ` · ${CONCEPT_BY_ID[concept].title}` : ''}</div>
            <div className="tiny muted">
              {results.length} answered · {correct} correct{streak >= 3 ? ` · 🔥 ${streak} in a row` : ''}{mode === 'quick' ? ` · ${5 - results.length} left` : ''}
              {mode !== 'method' && ` · Level ${level}: ${LEVEL_NAMES[level]}`}
            </div>
          </div>
        </div>
        <div className="row wrap">
          {q.parts?.length ? (
            <label className="row small" title="Break the problem into guided steps">
              <Toggle checked={scaffold} onChange={(v) => setGuided(v)} label="Guided steps" /> Guided steps
            </label>
          ) : null}
          <button className="btn sm" onClick={finish} disabled={!results.length}>End session</button>
        </div>
      </div>
      {mode === 'mixed' && results.length === 0 && <div className="callout small">Mixed review hides the topic label on purpose: deciding <b>which</b> idea applies is half the skill.</div>}
      <QuestionCard key={q.id} question={q} mode={meta.study} scaffold={scaffold} onDone={onDone} compactHeader={mode === 'concept'} nextLabel={mode === 'quick' && results.length === 4 ? 'Finish' : 'Next problem'} />
    </div>
  );
}

/* ---------------- Hub ---------------- */

function PracticeHub() {
  const s = useLearner();
  const [unit, setUnit] = useState(UNITS[0].id);
  const openCount = openMistakes(s).length;
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Practice</h1>
          <p>Every problem is generated fresh, adapts to your level, and counts toward mastery only once — no farming the same question.</p>
        </div>
      </div>
      <div className="grid grid-4" style={{ gap: 12 }}>
        {(['smart', 'mixed', 'method', 'graph', 'quick', 'mistakes', 'recall'] as Mode[]).map((m) => (
          <button key={m} className="card interactive" style={{ textAlign: 'left', color: 'var(--text)' }} onClick={() => navigate(`/practice?mode=${m}`)}>
            <div className="row between"><Icon name={MODES[m].icon} size={22} />{m === 'mistakes' && openCount > 0 && <span className="chip danger">{openCount}</span>}</div>
            <h3 className="mt-sm" style={{ marginBottom: 4 }}>{MODES[m].title}</h3>
            <p className="small muted" style={{ margin: 0 }}>{MODES[m].desc}</p>
          </button>
        ))}
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <h3 style={{ marginBottom: 6 }}>The 7 levels</h3>
          <ol className="tiny muted" style={{ margin: 0, paddingLeft: 16 }}>{Object.values(LEVEL_NAMES).map((l) => <li key={l}>{l}</li>)}</ol>
          <p className="tiny muted" style={{ margin: '6px 0 0' }}>Level up after 2–3 clean solves; drop back after 2 misses.</p>
        </div>
      </div>
      <div className="card mt">
        <div className="card-title"><h2>Practice one concept</h2></div>
        <div className="tabs" role="tablist" style={{ marginBottom: 12 }}>
          {UNITS.map((u) => <button key={u.id} role="tab" aria-selected={unit === u.id} className={`tab ${unit === u.id ? 'active' : ''}`} onClick={() => setUnit(u.id)}>Unit {u.number}</button>)}
        </div>
        <div className="grid grid-3" style={{ gap: 8 }}>
          {CONCEPTS.filter((c) => c.unit === unit).map((c) => {
            const info = masteryInfo(s, c.id);
            return (
              <a key={c.id} className="plan-item" href={`#/practice?concept=${c.id}`}>
                <Ring value={info.overall} size={34} stroke={4} mastered={info.mastered} />
                <div style={{ flex: 1, minWidth: 0 }}><div className="small bold">{c.title}</div><div className="tiny muted">Level {info.level} · {info.attempts} attempts</div></div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PracticePage({ query }: { query: URLSearchParams }) {
  const modeParam = query.get('mode') as Mode | null;
  const concept = query.get('concept') as ConceptId | null;
  const validConcept = concept && CONCEPT_BY_ID[concept] ? concept : null;
  const mode: Mode | null = validConcept ? 'concept' : modeParam && modeParam in MODES ? modeParam : null;
  if (!mode) return <PracticeHub />;
  return (
    <div className="content narrow">
      <div className="row between mb">
        <a href="#/practice" className="small"><Icon name="left" size={14} /> All practice modes</a>
        {validConcept && <a href={`#/learn/${validConcept}`} className="small">Back to the lesson</a>}
      </div>
      {mode === 'recall' ? <RecallSession /> : <PracticeSession mode={mode} concept={validConcept ?? undefined} />}
    </div>
  );
}
