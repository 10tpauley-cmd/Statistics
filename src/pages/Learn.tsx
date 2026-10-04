import { useLearner } from '../state/store';
import { navigate } from '../lib/router';
import { UNITS } from '../content/units';
import { CONCEPT_BY_ID } from '../content/concepts';
import { BOSSES } from '../content/boss';
import { unitBossReady } from '../engine/planner';
import { useMasteryMap, STATUS_LABEL } from '../components/hooks';
import { Ring, LinkBtn, Bar } from '../components/ui';
import { Icon } from '../components/ui/Icon';

export function LearnPage() {
  const s = useLearner();
  const mm = useMasteryMap(s);
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Course path</h1>
          <p>Five units in the order the ideas build on each other. Every lesson cites its pages in your course packet.</p>
        </div>
        <div className="row wrap">
          <LinkBtn to="/map" className="btn"><Icon name="map" size={16} /> Concept map</LinkBtn>
          <LinkBtn to="/pathway" className="btn primary"><Icon name="map" size={16} /> Guided: The Pathway</LinkBtn>
          {s.placement !== 'done' && <LinkBtn to="/placement" className="btn"><Icon name="target" size={16} /> Placement test</LinkBtn>}
        </div>
      </div>

      {UNITS.map((u) => {
        const ids = u.sections.flatMap((x) => x.concepts);
        const m = ids.reduce((a, id) => a + mm[id].overall, 0) / ids.length;
        const boss = BOSSES.find((b) => b.unit === u.id);
        const bossReady = unitBossReady(s, u.id);
        const cleared = boss && s.bosses[boss.id]?.cleared;
        return (
          <section className="unit-block" key={u.id} aria-labelledby={`unit-${u.id}`}>
            <div className="unit-head">
              <span className="unit-badge" style={{ background: `var(--${u.color})` }}>{u.number}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 id={`unit-${u.id}`} style={{ margin: 0 }}>{u.title}</h2>
                <div className="small muted">{u.subtitle} · {u.chapter} · {u.exam}</div>
              </div>
              <Ring value={m} size={48} color={`var(--${u.color})`} ariaLabel={`Unit ${u.number} mastery ${Math.round(m * 100)} percent`} />
            </div>
            {u.sections.map((sec) => (
              <div key={sec.id} style={{ marginBottom: 12 }}>
                <div className="section-title">Section {sec.id} — {sec.title} <span className="faint">· PDF p. {sec.pages.slice().sort((a, b) => a - b)[0]}{sec.pages.length > 1 ? `–${Math.max(...sec.pages)}` : ''}</span></div>
                <div className="grid grid-3" style={{ gap: 10 }}>
                  {sec.concepts.map((id) => {
                    const c = CONCEPT_BY_ID[id];
                    const info = mm[id];
                    const lesson = s.lessons[id];
                    const prereqsMissing = c.prereqs.filter((p) => !s.lessons[p]?.completed && mm[p].overall < 0.4);
                    const st = STATUS_LABEL[info.status];
                    return (
                      <button key={id} className="card interactive concept-card" style={{ textAlign: 'left', width: '100%', color: 'var(--text)' }} onClick={() => navigate(`/learn/${id}`)}>
                        <Ring value={info.overall} size={46} stroke={5} mastered={info.mastered} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3>{c.title}</h3>
                          <p>{c.short}</p>
                          <div className="row wrap mt-sm" style={{ gap: 6 }}>
                            <span className={`chip ${st.tone}`}>{st.label}</span>
                            {lesson && !lesson.completed && lesson.step > 0 && <span className="chip primary">Step {lesson.step + 1}/{c.lesson.length}</span>}
                            {lesson?.completed && <span className="chip"><Icon name="check" size={12} /> Lesson</span>}
                            <span className="tiny muted">{c.minutes} min</span>
                          </div>
                          {prereqsMissing.length > 0 && info.status === 'new' && (
                            <div className="tiny muted mt-sm">Best after: {prereqsMissing.map((p) => CONCEPT_BY_ID[p].title).join(', ')}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {boss && (
              <div className="card flat row wrap" style={{ borderStyle: 'dashed', gap: 14 }}>
                <span style={{ fontSize: '1.8rem' }} aria-hidden="true">{cleared ? '🏆' : '🐉'}</span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="bold">Unit {u.number} boss: {boss.title}</div>
                  <div className="small muted">{boss.tagline} {bossReady ? '' : '(Unlocks fully after every lesson in this unit — you can still try it now.)'}</div>
                  {s.bosses[boss.id] && <div className="mt-sm" style={{ maxWidth: 240 }}><Bar value={s.bosses[boss.id].best} label="Best boss score" /></div>}
                </div>
                <LinkBtn to={`/boss/${boss.id}`} className={`btn ${bossReady && !cleared ? 'primary' : ''}`}><Icon name="swords" size={16} /> {cleared ? 'Replay' : 'Fight'}</LinkBtn>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
