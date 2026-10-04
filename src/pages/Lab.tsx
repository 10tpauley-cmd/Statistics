import type { ConceptId, WidgetId } from '../engine/types';
import { WIDGETS, Widget } from '../components/interactive/registry';
import { CONCEPT_BY_ID } from '../content/concepts';
import { UNITS } from '../content/units';
import { Icon } from '../components/ui/Icon';
import { LinkBtn } from '../components/ui';
import { navigate } from '../lib/router';

const DESCRIPTIONS: Partial<Record<WidgetId, string>> = {
  sampling: 'Draw samples five ways and watch which methods are biased.',
  'drag-mean': 'Drag values and watch the mean chase outliers while the median stays put.',
  spread: 'See deviations, squares, and the standard deviation build up.',
  lln: 'Flip thousands of coins and watch the proportion settle.',
  'scatter-fit': 'Beat the least-squares line if you can.',
  'free-throws': 'Simulate the buzzer-beater and see the binomial emerge.',
};

export function LabPage({ query }: { query: URLSearchParams }) {
  const sel = query.get('w') as WidgetId | null;
  if (sel && WIDGETS[sel]) {
    const w = WIDGETS[sel];
    const concept = CONCEPT_BY_ID[w.concept as ConceptId];
    return (
      <div className="content">
        <a href="#/lab" className="small"><Icon name="left" size={14} /> All simulations</a>
        <div className="page-head mt-sm">
          <div>
            <h1>{w.title}</h1>
            <p>Part of <a href={`#/learn/${concept.id}`}>{concept.title}</a>. Play freely — nothing here is graded.</p>
          </div>
          <LinkBtn to={`/practice?concept=${concept.id}`} className="btn">Practice this idea <Icon name="right" size={14} /></LinkBtn>
        </div>
        <Widget id={sel} />
      </div>
    );
  }
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Simulation lab</h1>
          <p>Every interactive from the lessons in one place. Change the data, run thousands of trials, and see statistics happen.</p>
        </div>
      </div>
      {UNITS.map((u) => {
        const list = (Object.keys(WIDGETS) as WidgetId[]).filter((id) => CONCEPT_BY_ID[WIDGETS[id].concept as ConceptId]?.unit === u.id);
        if (!list.length) return null;
        return (
          <section key={u.id} className="unit-block">
            <div className="section-title">Unit {u.number} — {u.title}</div>
            <div className="grid grid-3" style={{ gap: 10 }}>
              {list.map((id) => (
                <button key={id} className="card interactive" style={{ textAlign: 'left', color: 'var(--text)' }} onClick={() => navigate(`/lab?w=${id}`)}>
                  <div className="row between"><Icon name="flask" size={20} /><span className="chip">{CONCEPT_BY_ID[WIDGETS[id].concept as ConceptId].title}</span></div>
                  <h3 className="mt-sm" style={{ marginBottom: 4 }}>{WIDGETS[id].title}</h3>
                  {DESCRIPTIONS[id] && <p className="small muted" style={{ margin: 0 }}>{DESCRIPTIONS[id]}</p>}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
