import { useEffect, useMemo, useState } from 'react';
import type { Question } from '../engine/types';
import { useLearner } from '../state/store';
import { recordBoss, startSession, endSession } from '../state/actions';
import { setTutorFocus } from '../state/tutor';
import { unitBossReady } from '../engine/planner';
import { BOSSES, BOSS_BY_ID, type Boss } from '../content/boss';
import { UNITS } from '../content/units';
import { CONCEPT_BY_ID } from '../content/concepts';
import { QuestionCard, type QuestionOutcome } from '../components/question/QuestionCard';
import { Rich } from '../components/ui/Rich';
import { Icon } from '../components/ui/Icon';
import { Bar, Empty, LinkBtn, SourceTag } from '../components/ui';
import { Visual } from '../components/charts/Charts';
import { Mu } from '../components/mascot/Mu';

export function BossList() {
  const s = useLearner();
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Boss battles</h1>
          <p>One big real-world problem per unit that needs every skill in it — identify, calculate, interpret, and explain. Clear one with 70%+.</p>
        </div>
      </div>
      <div className="grid grid-2">
        {BOSSES.map((b) => {
          const u = UNITS.find((x) => x.id === b.unit)!;
          const rec = s.bosses[b.id];
          const ready = unitBossReady(s, b.unit);
          return (
            <div key={b.id} className="card" style={{ borderTop: `4px solid var(--${u.color})` }}>
              <div className="row between">
                <span className="chip">Unit {u.number} · {u.title}</span>
                <span style={{ fontSize: '1.6rem' }} aria-hidden="true">{rec?.cleared ? '🏆' : '🐉'}</span>
              </div>
              <h2 className="mt-sm" style={{ marginBottom: 4 }}>{b.title}</h2>
              <p className="small muted">{b.tagline}</p>
              <div className="small"><b>{b.steps.length} stages</b> · concepts: {[...new Set(b.steps.map((st) => CONCEPT_BY_ID[st.concept].title))].slice(0, 4).join(', ')}</div>
              {rec && <div className="mt-sm"><div className="row between tiny muted"><span>Best score</span><span>{Math.round(rec.best * 100)}%</span></div><Bar value={rec.best} color={rec.cleared ? 'var(--success-strong)' : 'var(--warn)'} label="Best score" /></div>}
              {!ready && !rec && <div className="tiny muted mt-sm">Recommended after finishing Unit {u.number}'s lessons.</div>}
              <LinkBtn to={`/boss/${b.id}`} className={`btn mt ${ready && !rec?.cleared ? 'primary' : ''}`}><Icon name="swords" size={16} /> {rec ? (rec.cleared ? 'Replay' : 'Try again') : 'Start battle'}</LinkBtn>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function stepQuestion(b: Boss, i: number): Question {
  const st = b.steps[i];
  return {
    id: `${b.id}:${i}`, generatorId: `${b.id}-${i}`, concept: st.concept, level: 6,
    type: st.answer.kind === 'text' ? 'free-response' : 'exam', dims: st.dims,
    prompt: st.prompt, visual: i === 0 || st.answer.kind !== 'text' ? b.visual : undefined, answer: st.answer,
    hints: [st.hint], solution: [st.explain], takeaway: st.explain, source: b.source,
    calculator: st.answer.kind === 'numeric',
  };
}

export function BossRun({ id }: { id: string }) {
  const b = BOSS_BY_ID[id] as Boss | undefined;
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [outs, setOuts] = useState<QuestionOutcome[]>([]);
  const [done, setDone] = useState(false);
  const q = useMemo(() => (b ? stepQuestion(b, i) : null), [b, i]);

  useEffect(() => {
    if (!b || !started) return;
    startSession('boss', [...new Set(b.steps.map((s) => s.concept))]);
    setTutorFocus({ page: `Boss battle: ${b.title}` });
    return () => { endSession(); };
  }, [b, started]);

  if (!b || !q) return <div className="content narrow"><Empty title="Boss not found" action={<LinkBtn to="/boss" className="btn primary">All bosses</LinkBtn>} /></div>;
  const unit = UNITS.find((u) => u.id === b.unit)!;
  const scoreOf = (o: QuestionOutcome) => (o.correct ? (o.hints ? 0.75 : 1) : Math.min(0.5, o.score));
  const total = outs.reduce((a, o) => a + scoreOf(o), 0);
  const hp = 1 - total / b.steps.length;

  if (!started) {
    return (
      <div className="content narrow">
        <a href="#/boss" className="small"><Icon name="left" size={14} /> All bosses</a>
        <div className="card mt-sm" style={{ borderTop: `4px solid var(--${unit.color})` }}>
          <span className="chip">Unit {unit.number} boss</span>
          <h1 className="mt-sm">{b.title}</h1>
          <Rich text={b.story} />
          {b.visual && <div className="mt"><Visual spec={b.visual} /></div>}
          <div className="callout small mt"><b>{b.steps.length} stages.</b> Each stage uses a different skill. One hint per stage is available but reduces that stage's credit. Score 70% to defeat the boss.</div>
          <div className="row between mt">
            <SourceTag source={b.source} />
            <button className="btn primary lg" onClick={() => setStarted(true)}><Icon name="swords" size={18} /> Begin</button>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    const score = total / b.steps.length;
    const win = score >= 0.7;
    return (
      <div className="content narrow">
        <div className="card center step-card" style={{ padding: 32 }}>
          <Mu mood={win ? 'proud' : 'encourage'} size={96} />
          <h1 className="mt-sm">{win ? 'Boss defeated!' : 'The boss survives… for now'}</h1>
          <div className="big-num">{Math.round(score * 100)}%</div>
          <p className="muted">{outs.filter((o) => o.correct).length} of {b.steps.length} stages cleared{outs.some((o) => o.hints) ? ' (some with a hint)' : ''}.</p>
          <div className="stack-sm" style={{ maxWidth: 460, margin: '0 auto', textAlign: 'left' }}>
            {b.steps.map((st, k) => (
              <div key={k} className="row small"><span>{outs[k]?.correct ? '✅' : '❌'}</span><span style={{ flex: 1 }}><b>{st.label}</b> · {CONCEPT_BY_ID[st.concept].title}</span>{!outs[k]?.correct && <a href={`#/practice?concept=${st.concept}`}>Practice</a>}</div>
            ))}
          </div>
          <div className="row wrap mt" style={{ justifyContent: 'center' }}>
            <button className="btn primary" onClick={() => { setI(0); setOuts([]); setDone(false); }}><Icon name="repeat" size={16} /> Fight again</button>
            <LinkBtn to="/boss" className="btn">All bosses</LinkBtn>
          </div>
        </div>
      </div>
    );
  }

  const st = b.steps[i];
  return (
    <div className="content narrow">
      <div className="card pad-sm" style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 8px)', zIndex: 5 }}>
        <div className="row between small">
          <b>🐉 {b.title}</b>
          <span className="muted">Stage {i + 1}/{b.steps.length} · {st.label}</span>
        </div>
        <div className="row mt-sm" style={{ gap: 8 }}>
          <span className="tiny muted">Boss HP</span>
          <div style={{ flex: 1 }}><Bar value={hp} color="var(--danger)" label="Boss health" /></div>
        </div>
      </div>
      {i === 0 && <div className="callout small mt"><Rich text={b.story} /></div>}
      <div className="mt">
        <QuestionCard key={q.id} question={q} mode="boss" onDone={(o) => {
          const next = [...outs, o];
          setOuts(next);
          if (i + 1 >= b.steps.length) {
            setDone(true);
            recordBoss(b.id, next.reduce((a, x) => a + scoreOf(x), 0) / b.steps.length);
            endSession();
          } else setI(i + 1);
        }} nextLabel={i + 1 >= b.steps.length ? 'Finish battle' : 'Next stage'} />
      </div>
    </div>
  );
}
