import { useMemo, useState } from 'react';
import type { ConceptId } from '../engine/types';
import { useLearner } from '../state/store';
import { resolveMistake } from '../state/actions';
import { MISCONCEPTION_BY_ID, MISCONCEPTIONS } from '../content/misconceptions';
import { CONCEPT_BY_ID } from '../content/concepts';
import { Rich, plain } from '../components/ui/Rich';
import { Icon } from '../components/ui/Icon';
import { Empty, LinkBtn, Seg, timeAgo } from '../components/ui';

/** STEP 11 — the Mistake Bank: every miss, grouped by the misconception behind it. */
export function MistakesPage({ query }: { query: URLSearchParams }) {
  const s = useLearner();
  const focusMis = query.get('m');
  const [view, setView] = useState<'patterns' | 'concepts' | 'all'>('patterns');
  const [showResolved, setShowResolved] = useState(false);
  const list = s.mistakes.filter((m) => showResolved || !m.resolved);
  const open = s.mistakes.filter((m) => !m.resolved);
  const resolved = s.mistakes.length - open.length;

  const byMis = useMemo(() => {
    const g = new Map<string, typeof list>();
    list.forEach((m) => {
      const k = m.misconception ?? '__none';
      g.set(k, [...(g.get(k) ?? []), m]);
    });
    return [...g.entries()].sort((a, b) => (a[0] === focusMis ? -1 : b[0] === focusMis ? 1 : b[1].length - a[1].length));
  }, [list, focusMis]);
  const byConcept = useMemo(() => {
    const g = new Map<ConceptId, typeof list>();
    list.forEach((m) => g.set(m.concept, [...(g.get(m.concept) ?? []), m]));
    return [...g.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [list]);

  const focused = focusMis ? MISCONCEPTION_BY_ID[focusMis] ?? MISCONCEPTIONS.find((m) => m.id === focusMis) : null;

  const Item = ({ m }: { m: (typeof list)[number] }) => (
    <details className="part" style={{ opacity: m.resolved ? 0.6 : 1 }}>
      <summary className="row small" style={{ cursor: 'pointer' }}>
        <span>{m.resolved ? '✅' : '❌'}</span>
        <span style={{ flex: 1, minWidth: 0 }}><b>{CONCEPT_BY_ID[m.concept].title}</b> · {plain(m.prompt).slice(0, 80)}{plain(m.prompt).length > 80 ? '…' : ''}</span>
        <span className="tiny muted nowrap">{timeAgo(m.t)}</span>
      </summary>
      <Rich text={m.prompt} className="small mt-sm" />
      <div className="grid grid-2 mt-sm" style={{ gap: 8 }}>
        <div className="callout small" style={{ background: 'var(--danger-soft)', borderColor: 'transparent' }}><b>You answered:</b> {m.yourAnswer || '—'}</div>
        <div className="callout success small"><b>Correct:</b> {plain(m.correctAnswer)}</div>
      </div>
      {m.why && <Rich text={m.why} className="small mt-sm" />}
      <div className="row wrap mt-sm">
        {!m.resolved && <LinkBtn to={`/practice?concept=${m.concept}`} className="btn sm primary">Practice a fresh variant</LinkBtn>}
        {!m.resolved && <button className="btn sm ghost" onClick={() => resolveMistake(m.id)}>I understand it now</button>}
      </div>
    </details>
  );

  if (!s.mistakes.length) {
    return (
      <div className="content narrow">
        <div className="page-head"><div><h1>Mistake bank</h1></div></div>
        <Empty icon="🧺" title="No mistakes yet" action={<LinkBtn to="/practice" className="btn primary">Start practicing</LinkBtn>}>Every wrong answer lands here automatically, labeled with the misconception behind it. Fix them with fresh variants until they're gone.</Empty>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Mistake bank</h1>
          <p>{open.length} open · {resolved} resolved. Getting a fresh variant right resolves a mistake automatically.</p>
        </div>
        <div className="row wrap">
          {open.length > 0 && <LinkBtn to="/practice?mode=mistakes" className="btn primary"><Icon name="repeat" size={16} /> Retry all ({open.length})</LinkBtn>}
        </div>
      </div>
      {focused && (
        <div className="card mb" style={{ borderColor: 'var(--warn)' }}>
          <div className="section-title" style={{ color: 'var(--warn)' }}>Misconception</div>
          <h2 style={{ marginBottom: 4 }}>{focused.title}</h2>
          <p className="small muted">{focused.short}</p>
          <div className="callout success"><b>The fix:</b> <Rich text={focused.fix} as="span" /></div>
          <div className="row wrap mt-sm" style={{ gap: 6 }}>{focused.concepts.map((c) => <a key={c} className="chip" href={`#/learn/${c}`}>{CONCEPT_BY_ID[c].title}</a>)}</div>
        </div>
      )}
      <div className="row wrap between mb">
        <Seg options={[{ id: 'patterns', label: 'By misconception' }, { id: 'concepts', label: 'By concept' }, { id: 'all', label: 'Newest first' }]} value={view} onChange={setView} label="Group mistakes" />
        <label className="row small"><input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> Show resolved</label>
      </div>
      {!list.length && <Empty icon="🎉" title="All mistakes resolved">Turn on “Show resolved” to look back at them.</Empty>}
      {view === 'patterns' && (
        <div className="stack">
          {byMis.map(([k, items]) => {
            const mis = MISCONCEPTION_BY_ID[k];
            return (
              <div key={k} className="card">
                <div className="card-title">
                  <div>
                    {mis && items.length > 1 && <div className="section-title" style={{ color: 'var(--warn)', marginBottom: 2 }}>Recurring pattern</div>}
                    <h3>{mis ? mis.title : 'Other mistakes'}</h3>
                    {mis && <div className="small muted">{mis.short}</div>}
                  </div>
                  <span className="chip danger">{items.filter((m) => !m.resolved).length} open</span>
                </div>
                {mis && <div className="callout success small mb"><b>The fix:</b> <Rich text={mis.fix} as="span" /></div>}
                <div className="stack-sm">{items.slice(0, 6).map((m) => <Item key={m.id} m={m} />)}</div>
                {items.length > 6 && <div className="tiny muted mt-sm">+{items.length - 6} more</div>}
              </div>
            );
          })}
        </div>
      )}
      {view === 'concepts' && (
        <div className="stack">
          {byConcept.map(([c, items]) => (
            <div key={c} className="card">
              <div className="card-title"><h3>{CONCEPT_BY_ID[c].title}</h3><LinkBtn to={`/practice?concept=${c}`} className="btn sm">Practice</LinkBtn></div>
              <div className="stack-sm">{items.slice(0, 6).map((m) => <Item key={m.id} m={m} />)}</div>
            </div>
          ))}
        </div>
      )}
      {view === 'all' && <div className="stack-sm">{list.slice(0, 60).map((m) => <Item key={m.id} m={m} />)}</div>}
    </div>
  );
}
