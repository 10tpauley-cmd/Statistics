import { useMemo, useState } from 'react';
import { PATHWAY } from '../content/pathway';
import { computeView, journeyStats, WALL_THRESHOLD } from '../engine/pathway/progress';
import { LEVEL_TYPE_META } from '../engine/pathway/build';
import { useLearner } from '../state/store';
import { setName, skipPlacement } from '../state/actions';
import { navigate } from '../lib/router';
import { todayPlan, planMinutes, continueTarget, dueReviews, weakConcepts, strongConcepts, openMistakes } from '../engine/planner';
import { accuracy, dayKey, liveStreak, levelFromXp, xpForLevel } from '../engine/learner';
import { ACHIEVEMENTS } from '../engine/achievements';
import { CONCEPTS, CONCEPT_BY_ID } from '../content/concepts';
import { UNITS } from '../content/units';
import { BOSSES } from '../content/boss';
import { useMasteryMap, STATUS_LABEL } from '../components/hooks';
import { Ring, Bar, LinkBtn, fmtDuration, timeAgo, dueIn, masteryColor } from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { Mu } from '../components/mascot/Mu';
import { MISCONCEPTION_BY_ID } from '../content/misconceptions';

const PLAN_ICON: Record<string, string> = { placement: 'target', review: 'repeat', mistakes: 'alert', learn: 'book', practice: 'target', mixed: 'shuffle', teach: 'chat', recall: 'brain', boss: 'swords', method: 'help' };

function Welcome() {
  const [name, setN] = useState('');
  return (
    <div className="content narrow">
      <div className="hero-card" style={{ padding: 32 }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">FCC MA120 · Statistics</div>
            <h2 style={{ fontSize: '2rem' }}>Welcome to Stat Lab</h2>
            <p>Your whole statistics course — sampling, describing data, regression, probability, and random variables — rebuilt as interactive lessons, simulations, adaptive practice, and exams. Everything traces back to your course packet.</p>
            <div className="field" style={{ maxWidth: 320, margin: '16px 0' }}>
              <label htmlFor="nm" style={{ color: 'rgba(255,255,255,.9)' }}>What should we call you? (optional)</label>
              <input id="nm" className="input" value={name} onChange={(e) => setN(e.target.value)} placeholder="Your first name" />
            </div>
            <div className="row wrap">
              <button className="btn white lg" onClick={() => { if (name.trim()) setName(name.trim()); navigate('/placement'); }}><Icon name="target" size={18} /> Find my level (10 min)</button>
              <button className="btn lg" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.5)' }} onClick={() => { if (name.trim()) setName(name.trim()); skipPlacement(); navigate('/pathway'); }}>Begin the Pathway</button>
            </div>
          </div>
          <div className="hide-sm" style={{ background: 'rgba(255,255,255,.12)', borderRadius: 24, padding: 10 }}><Mu mood="wave" size={120} /></div>
        </div>
      </div>
      <div className="grid grid-3 mt">
        {[
          ['🎯', 'Mastery, not points', 'A concept is mastered only when you can recognize, calculate, interpret, apply, and explain it.'],
          ['🧠', 'Built to stick', 'Spaced reviews, retrieval practice, and a Mistake Bank that brings errors back until they\'re fixed.'],
          ['🐣', 'Meet Mu', 'Your bell-curve buddy. Press ? anytime for hints, explanations, or a study plan.'],
        ].map(([i, t, d]) => (
          <div className="card" key={t}><div style={{ fontSize: '1.6rem' }}>{i}</div><h3 className="mt-sm">{t}</h3><p className="small muted" style={{ margin: 0 }}>{d}</p></div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const s = useLearner();
  const mm = useMasteryMap(s);
  const plan = useMemo(() => todayPlan(s), [s]);
  const now = Date.now();
  const isNew = s.attempts.length === 0 && Object.keys(s.lessons).length === 0 && s.placement === 'pending';
  if (isNew) return <Welcome />;

  const cont = continueTarget(s);
  const due = dueReviews(s, now);
  const weak = weakConcepts(s, 5, now);
  const strong = strongConcepts(s, 3, now);
  const open = openMistakes(s);
  const overall = CONCEPTS.reduce((a, c) => a + mm[c.id].overall * c.importance, 0) / CONCEPTS.reduce((a, c) => a + c.importance, 0);
  const masteredCount = CONCEPTS.filter((c) => mm[c.id].mastered).length;
  const today = s.daily[dayKey(now)] ?? { ms: 0, problems: 0, correct: 0, xp: 0 };
  const weekMs = Array.from({ length: 7 }, (_, i) => s.daily[dayKey(now - i * 86400000)]?.ms ?? 0).reduce((a, b) => a + b, 0);
  const totalMs = Object.values(s.daily).reduce((a, d) => a + d.ms, 0);
  const solved = s.attempts.filter((a) => a.correct).length;
  const acc = accuracy({ ...s, attempts: s.attempts.slice(-60) });
  const streak = liveStreak(s, now);
  const level = levelFromXp(s.xp);
  const goalPct = Math.min(1, today.ms / (s.settings.dailyGoal * 60000));
  const examDays = s.settings.examDate ? Math.ceil((new Date(`${s.settings.examDate}T09:00`).getTime() - now) / 86400000) : null;
  const recentAch = Object.entries(s.achievements).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean);

  const activity = [
    ...s.attempts.filter((a) => a.mode !== 'lesson').slice(-8).map((a) => ({ t: a.t, icon: a.correct ? '✅' : '❌', text: `${a.correct ? 'Solved' : 'Missed'} a ${a.type.replace('-', ' ')} problem`, sub: CONCEPT_BY_ID[a.concept].title })),
    ...Object.entries(s.lessons).filter(([, l]) => l?.completedAt).map(([id, l]) => ({ t: l!.completedAt!, icon: '📗', text: 'Completed lesson', sub: CONCEPT_BY_ID[id as keyof typeof CONCEPT_BY_ID].title })),
    ...s.teach.slice(0, 4).map((t) => ({ t: t.t, icon: '🧑‍🏫', text: `Teach It: ${Math.round(t.score * 100)}%`, sub: CONCEPT_BY_ID[t.concept].title })),
    ...s.exams.slice(0, 3).map((e) => ({ t: e.t, icon: '📝', text: `${e.kind === 'placement' ? 'Placement' : e.kind === 'final' ? 'Final exam' : 'Exam'}: ${Math.round(e.score * 100)}%`, sub: e.scope })),
  ].sort((a, b) => b.t - a.t).slice(0, 6);

  const weakAction = (id: string) => (s.lessons[id as keyof typeof s.lessons]?.completed ? `/practice?concept=${id}` : `/learn/${id}`);

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>{greeting()}{s.name ? `, ${s.name}` : ''} 👋</h1>
          <p>{plan.length ? `Today's plan: ${plan.length} step${plan.length === 1 ? '' : 's'} · about ${planMinutes(plan)} minutes.` : 'You\'re caught up — great time for a mixed review or practice exam.'}</p>
        </div>
        {examDays !== null && examDays >= 0 && <span className="chip warn"><Icon name="clock" size={13} /> Exam in {examDays} day{examDays === 1 ? '' : 's'}</span>}
      </div>

      <div className="dash-grid">
        <div className="stack" style={{ gap: 18 }}>
          {/* The Pathway — the guided journey */}
          <PathwayHero />
          {cont && cont.step > 0 && (
            <a className="plan-item" href={`#/learn/${cont.id}`}>
              <span className="plan-num"><Icon name="book" size={14} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div className="bold small">Resume free study: {cont.concept.title}</div><div className="tiny muted">Step {Math.min(cont.step + 1, cont.total)} of {cont.total} · ~{cont.minutesLeft} min left</div></div>
              <Icon name="right" size={16} />
            </a>
          )}

          {/* Stats */}
          <div className="grid grid-4" style={{ gap: 12 }}>
            <div className="card pad-sm stat-card row" style={{ gap: 12 }}>
              <Ring value={overall} size={52} label={`${Math.round(overall * 100)}`} color="var(--primary)" ariaLabel={`Overall mastery ${Math.round(overall * 100)} percent`} />
              <div><div className="k">Overall mastery</div><div className="small muted">{masteredCount}/{CONCEPTS.length} mastered</div></div>
            </div>
            <div className="card pad-sm stat-card"><div className="k">Problems solved</div><div className="v">{solved}</div><div className="tiny muted">{today.problems} today</div></div>
            <div className="card pad-sm stat-card"><div className="k">Accuracy (recent)</div><div className="v">{acc === null ? '—' : `${Math.round(acc * 100)}%`}</div><div className="tiny muted">last {Math.min(60, s.attempts.length)} answers</div></div>
            <div className="card pad-sm stat-card"><div className="k">Study time</div><div className="v">{fmtDuration(weekMs)}</div><div className="tiny muted">this week · {fmtDuration(totalMs)} total</div></div>
          </div>

          {/* Today's plan */}
          <div className="card">
            <div className="card-title">
              <h2>Today's plan</h2>
              <span className="small muted">{Math.round(today.ms / 60000)} / {s.settings.dailyGoal} min</span>
            </div>
            <Bar value={goalPct} color={goalPct >= 1 ? 'var(--success-strong)' : undefined} label="Daily goal progress" />
            <div className="stack-sm mt">
              <PathwayPlanItem />
              {plan.map((p, i) => (
                <a key={p.id} className="plan-item" href={`#${p.route}`}>
                  <span className="plan-num">{i + 1}</span>
                  <Icon name={PLAN_ICON[p.kind] ?? 'target'} size={18} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="bold small">{p.title}</div>
                    <div className="tiny muted">{p.detail} · <i>{p.reason}</i></div>
                  </div>
                  <span className="chip">{p.minutes} min</span>
                </a>
              ))}
              {!plan.length && <div className="small muted">Nothing queued. Try <a href="#/practice?mode=mixed">mixed practice</a>.</div>}
            </div>
          </div>

          {/* Course progress */}
          <div className="card">
            <div className="card-title"><h2>Course progress</h2><LinkBtn to="/progress" className="btn ghost sm">Details <Icon name="right" size={14} /></LinkBtn></div>
            <div className="stack-sm">
              {UNITS.map((u) => {
                const ids = u.sections.flatMap((x) => x.concepts);
                const m = ids.reduce((a, id) => a + mm[id].overall, 0) / ids.length;
                const lessons = ids.filter((id) => s.lessons[id]?.completed).length;
                return (
                  <a key={u.id} href="#/learn" className="row" style={{ color: 'var(--text)', padding: '6px 0' }}>
                    <span className="unit-badge" style={{ background: `var(--${u.color})`, width: 34, height: 34, borderRadius: 10, fontSize: '0.85rem' }}>{u.number}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row between small"><b>{u.title}</b><span className="muted">{lessons}/{ids.length} lessons · {Math.round(m * 100)}%</span></div>
                      <Bar value={m} color={`var(--${u.color})`} label={`${u.title} mastery`} />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Activity */}
          <div className="card">
            <div className="card-title"><h2>Recent activity</h2></div>
            {activity.length ? (
              <div className="list">
                {activity.map((a, i) => (
                  <div className="list-item small" key={i}>
                    <span aria-hidden="true">{a.icon}</span>
                    <div style={{ flex: 1 }}><b>{a.text}</b> <span className="muted">· {a.sub}</span></div>
                    <span className="tiny muted nowrap">{timeAgo(a.t, now)}</span>
                  </div>
                ))}
              </div>
            ) : <div className="small muted">Your activity will show up here.</div>}
          </div>
        </div>

        {/* Right column */}
        <div className="stack" style={{ gap: 18 }}>
          <div className="card">
            <div className="card-title">
              <h3>Streak & level</h3>
              <LinkBtn to="/progress" className="btn ghost sm">Achievements</LinkBtn>
            </div>
            <div className="row" style={{ gap: 18 }}>
              <div className="center"><div className="big-num">🔥{streak}</div><div className="tiny muted">day streak · best {s.streak.best}</div></div>
              <div style={{ flex: 1 }}>
                <div className="row between small"><b>Level {level}</b><span className="muted">{s.xp - xpForLevel(level)} / {xpForLevel(level + 1) - xpForLevel(level)} XP</span></div>
                <Bar value={(s.xp - xpForLevel(level)) / (xpForLevel(level + 1) - xpForLevel(level))} label="Level progress" />
                <div className="tiny muted mt-sm">{s.xp} XP total</div>
              </div>
            </div>
            {recentAch.length > 0 && (
              <div className="row wrap mt" style={{ gap: 6 }}>
                {recentAch.map((a) => <span key={a!.id} className="chip" title={a!.description}>{a!.icon} {a!.title}</span>)}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">
              <h3>Review due</h3>
              {due.length > 0 && <LinkBtn to="/review" className="btn primary sm">Start review</LinkBtn>}
            </div>
            {due.length ? (
              <div className="stack-sm">
                {due.slice(0, 5).map((id) => (
                  <div key={id} className="row small"><span className="dot" style={{ background: 'var(--warn)' }} /><span style={{ flex: 1 }}>{CONCEPT_BY_ID[id].title}</span><span className="tiny muted">{Math.round(mm[id].retention * 100)}% retained</span></div>
                ))}
                {due.length > 5 && <div className="tiny muted">+{due.length - 5} more</div>}
              </div>
            ) : (
              <div className="small muted">Nothing due. {(() => {
                const next = CONCEPTS.map((c) => s.concepts[c.id]?.srs?.due ?? Infinity).filter((d) => d > now).sort((a, b) => a - b)[0];
                return next && next < Infinity ? `Next review ${dueIn(next, now)}.` : 'Complete a lesson to schedule your first review.';
              })()}</div>
            )}
          </div>

          <div className="card">
            <div className="card-title"><h3>Weak areas</h3>{open.length > 0 && <LinkBtn to="/mistakes" className="btn ghost sm">{open.length} mistakes</LinkBtn>}</div>
            {weak.length ? (
              <div className="stack-sm" style={{ gap: 2 }}>
                {weak.map((w) => (
                  <button key={w.id} className="weak-row" onClick={() => navigate(weakAction(w.id))} title={s.lessons[w.id]?.completed ? 'Practice this concept' : 'Start the lesson'}>
                    <Ring value={w.info.overall} size={34} stroke={4} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="small bold">{CONCEPT_BY_ID[w.id].title}</div>
                      <div className="tiny muted">{STATUS_LABEL[w.info.status].label} · {w.info.missing[0] ?? 'Keep practicing'}</div>
                    </div>
                    <Icon name="right" size={16} />
                  </button>
                ))}
              </div>
            ) : <div className="small muted">Weak areas appear once you've practiced a few concepts.</div>}
            {(() => {
              const top = Object.entries(open.reduce<Record<string, number>>((acc, m) => (m.misconception ? { ...acc, [m.misconception]: (acc[m.misconception] ?? 0) + 1 } : acc), {})).sort((a, b) => b[1] - a[1])[0];
              const mis = top && MISCONCEPTION_BY_ID[top[0]];
              return mis ? <div className="callout warn small mt"><b>Pattern spotted:</b> {mis.title} ({top[1]}×). <a href={`#/mistakes?m=${mis.id}`}>See the fix</a></div> : null;
            })()}
          </div>

          <div className="card">
            <div className="card-title"><h3>Quick practice</h3></div>
            <div className="grid grid-2" style={{ gap: 8 }}>
              <LinkBtn to="/practice?mode=quick" className="btn"><Icon name="zap" size={16} /> 5-minute quiz</LinkBtn>
              <LinkBtn to="/practice?mode=mixed" className="btn"><Icon name="shuffle" size={16} /> Mixed</LinkBtn>
              <LinkBtn to="/practice?mode=method" className="btn"><Icon name="help" size={16} /> Which method?</LinkBtn>
              <LinkBtn to="/practice?mode=graph" className="btn"><Icon name="chart" size={16} /> Read graphs</LinkBtn>
            </div>
          </div>

          {strong.length > 0 && (
            <div className="card">
              <div className="card-title"><h3>Strongest concepts</h3></div>
              <div className="stack-sm">
                {strong.map((x) => (
                  <div key={x.id} className="row small">
                    <span className="dot" style={{ background: masteryColor(x.info.overall, x.info.mastered) }} />
                    <span style={{ flex: 1 }}>{CONCEPT_BY_ID[x.id].title}</span>
                    <b>{Math.round(x.info.overall * 100)}%</b>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-title"><h3>Boss battles</h3><LinkBtn to="/boss" className="btn ghost sm">All</LinkBtn></div>
            <div className="stack-sm">
              {BOSSES.map((b) => {
                const rec = s.bosses[b.id];
                const unit = UNITS.find((u) => u.id === b.unit)!;
                return (
                  <a key={b.id} href={`#/boss/${b.id}`} className="row small" style={{ color: 'var(--text)' }}>
                    <span aria-hidden="true">{rec?.cleared ? '🏆' : '🐉'}</span>
                    <span style={{ flex: 1 }}>{b.title} <span className="muted">· Unit {unit.number}</span></span>
                    {rec && <span className="tiny muted">best {Math.round(rec.best * 100)}%</span>}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PathwayPlanItem() {
  const s = useLearner();
  const view = useMemo(() => computeView(s, PATHWAY), [s]);
  const cur = view.current;
  if (!cur && view.wall) {
    const weak = view.wall.status.weakest[0];
    return (
      <a className="plan-item" href={`#/pathway/review/${weak}`} style={{ borderColor: 'color-mix(in srgb, var(--warning) 45%, var(--border))' }}>
        <span className="plan-num">🧱</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="bold small">The Pathway: break the mastery wall</div>
          <div className="tiny muted">Quick review of {CONCEPT_BY_ID[weak].title} · {view.wall.region.spec.name} is at {Math.round(view.wall.status.mastery * 100)}% of the {Math.round(WALL_THRESHOLD * 100)}% needed.</div>
        </div>
        <span className="chip">3 min</span>
      </a>
    );
  }
  if (!cur) return null;
  return (
    <a className="plan-item" href={`#/pathway/play/${cur.id}`} style={{ borderColor: 'color-mix(in srgb, var(--primary) 40%, var(--border))' }}>
      <span className="plan-num">🗺️</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="bold small">The Pathway: {cur.kind === 'level' ? `Level ${cur.number} — ${cur.title}` : cur.title}</div>
        <div className="tiny muted">{cur.kind === 'level' ? `${LEVEL_TYPE_META[cur.type].label} · ${cur.concepts.map((c) => CONCEPT_BY_ID[c].title).join(', ')}` : 'Battle'} · <i>Your next step on the journey.</i></div>
      </div>
      <span className="chip">{cur.kind === 'level' ? `${cur.minutes} min` : '10 min'}</span>
    </a>
  );
}

function PathwayHero() {
  const s = useLearner();
  const view = useMemo(() => computeView(s, PATHWAY), [s]);
  const st = journeyStats(s, PATHWAY);
  const cur = view.current;
  const regionIndex = cur ? cur.regionIndex : view.wall ? view.wall.region.index : PATHWAY.regions.length - 1;
  const region = PATHWAY.regions[regionIndex].spec;
  const wallAt = view.wall ? PATHWAY.main.indexOf(view.wall.region.main[view.wall.region.main.length - 1]) + 1 : PATHWAY.main.length;
  const idx = cur ? PATHWAY.main.findIndex((n) => n.id === cur.id) : wallAt;
  const ahead = PATHWAY.main.slice(Math.max(0, idx - 2), idx + 5);
  const started = st.levelsDone > 0 || Object.keys(s.pathway.levels).length > 0;
  return (
    <div className="hero-card pw-dash-hero">
      <div className="eyebrow">🗺️ The Pathway · Region {region.number} — {region.name}</div>
      <h2>{cur ? (cur.kind === 'level' ? `Level ${cur.number}: ${cur.title}` : `${cur.kind === 'boss' ? 'Boss' : 'Mini-boss'}: ${cur.title}`) : s.pathway.completedAt ? 'Journey complete!' : 'Mastery wall ahead'}</h2>
      <p style={{ margin: 0 }}>{cur?.kind === 'level' ? `${LEVEL_TYPE_META[cur.type].emoji} ${LEVEL_TYPE_META[cur.type].label} · ${LEVEL_TYPE_META[cur.type].blurb}` : cur ? 'A battle that tests everything before it.' : view.wall ? `${view.wall.region.spec.name} mastery is ${Math.round(view.wall.status.mastery * 100)}% — reach ${Math.round(WALL_THRESHOLD * 100)}% to continue. A few quick reviews will do it.` : 'You crossed every region.'}</p>
      <div className="pw-dash-strip" aria-hidden="true">
        {ahead.map((n) => {
          const stt = view.states[n.id];
          return <span key={n.id} className={`pw-dash-dot ${stt} kind-${n.kind} ${cur?.id === n.id ? 'cur' : ''}`} title={n.title}>{n.kind === 'boss' || n.kind === 'mini-boss' ? n.emoji : stt === 'completed' || stt === 'mastered' ? '✓' : n.kind === 'level' ? n.number : ''}</span>;
        })}
      </div>
      <div className="hero-meta">
        <span>{st.levelsDone} / {st.levelCount} levels</span>
        <span>{st.bossesDefeated} / {st.bossCount} bosses</span>
        <span>★ {st.stars}</span>
      </div>
      <Bar value={st.pct} className="white" label="Journey progress" />
      <div className="row wrap mt">
        {cur ? <LinkBtn to={`/pathway/play/${cur.id}`} className="btn white"><Icon name="play" size={16} /> {started ? 'Continue Pathway' : 'Begin the Pathway'}</LinkBtn>
          : view.wall ? <LinkBtn to={`/pathway/review/${view.wall.status.weakest[0]}`} className="btn white wrap-btn"><Icon name="repeat" size={16} /> Review {CONCEPT_BY_ID[view.wall.status.weakest[0]].title}</LinkBtn> : null}
        <LinkBtn to="/pathway" className="btn ghost"><span style={{ color: '#fff' }}>Open the map</span></LinkBtn>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
