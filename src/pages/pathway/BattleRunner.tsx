import { useEffect, useMemo, useRef, useState } from 'react';
import type { Question } from '../../engine/types';
import type { BattleTask, BossNode, MiniBossNode } from '../../engine/pathway/types';
import { PATHWAY } from '../../content/pathway';
import { BOSS_BY_ID } from '../../content/boss';
import { CONCEPT_BY_ID } from '../../content/concepts';
import { BOSS_PASS, MINI_PASS, wallStatus } from '../../engine/pathway/progress';
import { taskCount } from '../../engine/pathway/build';
import { getState, useLearner } from '../../state/store';
import { setTutorFocus } from '../../state/tutor';
import { endSession, startSession } from '../../state/actions';
import { markCeremony, recordPathwayBattle, type BattleOutcome } from '../../state/pathway';
import { QuestionCard, type QuestionOutcome } from '../../components/question/QuestionCard';
import { Rich } from '../../components/ui/Rich';
import { Icon } from '../../components/ui/Icon';
import { Visual } from '../../components/charts/Charts';
import { Mu } from '../../components/mascot/Mu';
import { navigate } from '../../lib/router';
import { questionForPlan } from './LevelRunner';
import * as fx from '../../lib/fx';

const SHIELDS = 3;

function materialize(node: MiniBossNode | BossNode, pi: number, ti: number, t: BattleTask): Question {
  if (t.kind === 'gen') return questionForPlan({ concept: t.concept, level: t.level, generators: t.generators, preferTypes: t.preferTypes, excludeTypes: t.excludeTypes ?? ['free-response'] }, { noEasier: true });
  const step = t.kind === 'boss-step' ? BOSS_BY_ID[t.boss].steps[t.index] : t.step;
  const visual = t.kind === 'step' ? t.visual : BOSS_BY_ID[t.boss]?.visual;
  const id = t.kind === 'boss-step' ? `${t.boss}:${t.index}` : `${node.id}:p${pi}t${ti}`;
  return {
    id, generatorId: id.replace(':', '-'), concept: step.concept, level: 6,
    type: step.answer.kind === 'text' ? 'free-response' : 'exam', dims: step.dims,
    context: t.kind === 'step' ? t.context : undefined, prompt: step.prompt, visual, answer: step.answer,
    hints: [step.hint], solution: [step.explain], takeaway: step.explain, calculator: step.answer.kind === 'numeric',
  };
}

const TAUNTS_HIT = ['Ugh! A lucky guess…', 'You… actually understand this?', 'That one stung.', 'Impossible!', 'Not bad, traveler.'];
const TAUNTS_MISS = ['Ha! Check your method.', 'The data does not lie — you misread it.', 'Is that what the numbers say?', 'Careful… I feed on mistakes.'];

export function BattleRunner({ node }: { node: MiniBossNode | BossNode }) {
  const s = useLearner();
  const region = PATHWAY.regions[node.regionIndex];
  const isBoss = node.kind === 'boss';
  const threshold = isBoss ? BOSS_PASS : MINI_PASS;
  const total = taskCount(node.phases);
  const flat = useMemo(() => node.phases.flatMap((ph, pi) => ph.tasks.map((t, ti) => ({ pi, ti, t }))), [node]);
  const [stage, setStage] = useState<'intro' | 'phase' | 'task' | 'result'>('intro');
  const [k, setK] = useState(0); // task index
  const [questions, setQuestions] = useState<Record<number, Question>>({});
  const [scores, setScores] = useState<number[]>([]);
  const [shields, setShields] = useState(SHIELDS);
  const [heal, setHeal] = useState(0);
  const [taunt, setTaunt] = useState('');
  const [outcome, setOutcome] = useState<BattleOutcome | null>(null);
  const bossRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const cur = flat[k];
  const dealt = scores.reduce((a, b) => a + b, 0) / total;
  const hp = Math.max(0, Math.min(1, 1 - dealt + heal));

  useEffect(() => {
    startSession('boss', node.concepts);
    setTutorFocus({ page: `Boss battle: ${node.title}` });
    return () => { endSession(); };
  }, [node]);

  useEffect(() => {
    if (stage === 'task' && cur && !questions[k]) setQuestions((q) => ({ ...q, [k]: materialize(node, cur.pi, cur.ti, cur.t) }));
  }, [stage, k, cur, node, questions]);

  const begin = () => { fx.sound('whoosh'); setStage('phase'); };

  const onDone = (o: QuestionOutcome) => {
    const value = o.correct ? (o.hints ? 0.75 : 1) : Math.min(0.5, o.score);
    const nextScores = [...scores, value];
    setScores(nextScores);
    if (value >= 0.75) {
      fx.sound('hit');
      fx.shake(bossRef.current, true);
      fx.float(bossRef.current, `-${Math.round((value / total) * 100)}`, 'damage');
      fx.burst(bossRef.current, { count: 16, colors: ['#ef4444', '#f97316', '#fde047'], spread: 110 });
      setTaunt(TAUNTS_HIT[nextScores.length % TAUNTS_HIT.length]);
    } else {
      fx.flash('boss');
      fx.shake(arenaRef.current);
      fx.sound('shield');
      setTaunt(TAUNTS_MISS[nextScores.length % TAUNTS_MISS.length]);
      if (shields > 0) setShields(shields - 1);
      else setHeal((h) => Math.min(0.15, h + 0.03)); // cosmetic only — the score below decides the battle
    }
    const nk = k + 1;
    if (nk >= flat.length) {
      const finalScore = nextScores.reduce((a, b) => a + b, 0) / total;
      const out = recordPathwayBattle(node.id, isBoss ? 'boss' : 'mini-boss', finalScore, threshold, { bossId: isBoss ? (node as BossNode).bossId : undefined, final: isBoss && (node as BossNode).final });
      setOutcome(out);
      setStage('result');
      if (out.passed) { fx.sound('victory'); fx.celebrate(isBoss ? ((node as BossNode).final ? 'final' : 'unit') : 'boss'); }
      if (out.passed && isBoss) markCeremony(node.id);
      return;
    }
    setK(nk);
    setStage(flat[nk].pi !== cur.pi ? 'phase' : 'task');
    if (flat[nk].pi !== cur.pi) fx.sound('whoosh');
  };

  const score = scores.reduce((a, b) => a + b, 0) / total;
  const phase = cur ? node.phases[cur.pi] : node.phases[node.phases.length - 1];
  const nextRegion = PATHWAY.regions[node.regionIndex + 1];
  const wall = isBoss ? wallStatus(getState(), region) : null;

  return (
    <div className={`pw-runner pw-battle theme-${region.spec.theme}`} ref={arenaRef}>
      <div className="pw-runner-bar">
        <button className="btn ghost icon sm" onClick={() => navigate('/pathway')} aria-label="Retreat to the Pathway" title="Retreat (progress in this battle is not saved)"><Icon name="x" /></button>
        <div className="pw-runner-title">
          <span className="pw-kicker" style={{ opacity: 1, color: '#dc2626' }}>{isBoss ? ((node as BossNode).final ? 'FINAL BOSS' : 'UNIT BOSS') : 'MINI-BOSS'}</span>
          <b>{node.title}</b>
        </div>
        <div className="pw-shields" aria-label={`${shields} shields left`}>{Array.from({ length: SHIELDS }, (_, i) => <span key={i} className={i < shields ? 'on' : ''}>🛡️</span>)}</div>
      </div>

      <div className="pw-arena">
        <div className="pw-boss" ref={bossRef}>
          <div className={`pw-boss-avatar ${stage === 'result' && outcome?.passed ? 'defeated' : ''}`}>{node.emoji}</div>
          <div className="pw-boss-info">
            <div className="row between"><b>{node.title}</b><span className="tiny">{Math.round(hp * 100)}% HP</span></div>
            <div className="pw-hp"><span style={{ width: `${hp * 100}%` }} /></div>
            <div className="pw-phase-pips">{node.phases.map((ph, i) => <span key={ph.title} className={cur && i < cur.pi ? 'done' : cur && i === cur.pi ? 'current' : stage === 'result' ? 'done' : ''} title={ph.title} />)}</div>
          </div>
        </div>
        {taunt && stage === 'task' && <div className="pw-taunt" key={taunt + k}>“{taunt}”</div>}
      </div>

      <div className="content narrow">
        {stage === 'intro' && (
          <div className="card step-card center stack">
            <div className="pw-boss-hero">{node.emoji}</div>
            <div className="pw-kicker" style={{ color: '#dc2626', opacity: 1 }}>{isBoss ? `${region.spec.name} — guardian` : 'A challenger blocks the road'}</div>
            <h1 style={{ margin: 0 }}>{node.title}</h1>
            {isBoss ? <Rich text={(node as BossNode).story} /> : <p className="pw-quote">“{(node as MiniBossNode).taunt}”</p>}
            {isBoss && (node as BossNode).visual && <Visual spec={(node as BossNode).visual!} />}
            <div className="stack-sm" style={{ textAlign: 'left' }}>
              {node.phases.map((ph, i) => <div key={ph.title} className="row small"><span className="plan-num">{i + 1}</span><span style={{ flex: 1 }}>{ph.title}</span><span className="chip">{ph.tasks.length} task{ph.tasks.length === 1 ? '' : 's'}</span></div>)}
            </div>
            <div className="callout small" style={{ textAlign: 'left' }}>Every correct answer damages {node.title}. Mistakes break a shield — but nothing ends the battle early. Defeat it by dealing at least <b>{Math.round(threshold * 100)}%</b> damage. Hints work, but weaken your strike.</div>
            <button className="btn primary lg" onClick={begin}><Icon name="swords" size={18} /> Begin battle</button>
          </div>
        )}
        {stage === 'phase' && cur && (
          <div className="card step-card center stack pw-phase-card">
            <div className="pw-kicker" style={{ opacity: 1, color: 'var(--rg-accent)' }}>PHASE {cur.pi + 1} OF {node.phases.length}</div>
            <h1 style={{ margin: 0 }}>{phase.title.replace(/^Phase \d+ — /, '')}</h1>
            <p className="pw-quote"><Rich text={phase.intro} as="span" /></p>
            <button className="btn primary lg" onClick={() => setStage('task')} autoFocus>Fight <Icon name="right" size={18} /></button>
          </div>
        )}
        {stage === 'task' && questions[k] && (
          <>
            <div className="pw-stage-label">{phase.title} · task {k + 1} of {total}</div>
            <QuestionCard key={questions[k].id + k} question={questions[k]} mode="boss" onDone={onDone} nextLabel={k + 1 >= total ? 'Final strike' : 'Strike'} />
          </>
        )}
        {stage === 'result' && outcome && (
          <div className="card step-card center stack">
            {outcome.passed ? (
              <>
                <div className="pw-kicker" style={{ color: '#d97706', opacity: 1 }}>👑 {isBoss ? 'BOSS DEFEATED' : 'MINI-BOSS DEFEATED'}</div>
                <h1 style={{ margin: 0 }}>{isBoss ? `“${(node as BossNode).defeatLine}”` : `${node.title} has fallen!`}</h1>
                <div className="big-num">{Math.round(score * 100)}%</div>
                {isBoss && !(node as BossNode).final && (
                  <div className="stack-sm">
                    <div className="pw-kicker" style={{ opacity: 1 }}>UNIT COMPLETE</div>
                    <div className="pw-unit-bar"><span /></div>
                    <div className="pw-rewards">
                      <div>🏆<span>Unit mastery</span></div>
                      <div>⚡<span>+{outcome.xp + outcome.unitBonus} XP</span></div>
                      <div>🗺️<span>{region.spec.name} cleared</span></div>
                      <div>{wall?.ok ? '🔓' : '🧱'}<span>{wall?.ok ? `${nextRegion?.spec.name ?? 'Next region'} unlocked` : 'Mastery wall ahead'}</span></div>
                    </div>
                    {!wall?.ok && wall && <p className="small muted" style={{ margin: 0 }}>To enter the next region, reach {Math.round(0.5 * 100)}% mastery across this region (now {Math.round(wall.mastery * 100)}%). Targeted reviews on the map will get you there.</p>}
                  </div>
                )}
                {isBoss && (node as BossNode).final && <p>The Archive's last book closes. Your journey is complete.</p>}
                {!isBoss && outcome.firstClear && <span className="chip primary">⚡ +{outcome.xp} XP</span>}
                <div className="row wrap" style={{ justifyContent: 'center' }}>
                  {isBoss && (node as BossNode).final ? <button className="btn primary lg" onClick={() => navigate('/pathway/complete')}>🎉 See your journey</button> : <button className="btn primary lg" onClick={() => navigate('/pathway')}>Onward <Icon name="right" size={18} /></button>}
                </div>
              </>
            ) : (
              <>
                <Mu mood="encourage" size={80} />
                <h1 style={{ margin: 0 }}>{node.title} withstands the attack</h1>
                <p className="muted">You dealt <b>{Math.round(score * 100)}%</b> damage — you need {Math.round(threshold * 100)}%. Every battle shows exactly what to sharpen.</p>
                <div className="stack-sm" style={{ textAlign: 'left' }}>
                  {[...new Set(flat.filter((_, i) => (scores[i] ?? 0) < 0.75).map((f) => (questions[flat.indexOf(f)]?.concept)).filter(Boolean))].slice(0, 3).map((c) => (
                    <div key={c} className="row small"><span style={{ flex: 1 }}>Sharpen <b>{CONCEPT_BY_ID[c!].title}</b></span><button className="btn sm" onClick={() => navigate(`/pathway/review/${c}`)}>Quick review</button></div>
                  ))}
                </div>
                <div className="row wrap" style={{ justifyContent: 'center' }}>
                  <button className="btn primary" onClick={() => navigate(`/pathway/play/${node.id}?retry=${s.pathway.battles[node.id]?.plays ?? 0}`)}><Icon name="repeat" size={16} /> Try again</button>
                  <button className="btn" onClick={() => navigate('/pathway')}>Back to the map</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
