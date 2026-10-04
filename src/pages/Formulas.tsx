import { useEffect, useMemo, useState } from 'react';
import { FORMULAS } from '../content/formulas';
import { CONCEPT_BY_ID } from '../content/concepts';
import { UNITS } from '../content/units';
import { FormulaCard } from '../components/FormulaCard';
import { TeX, plain } from '../components/ui/Rich';
import { Icon } from '../components/ui/Icon';
import { Seg, SupportingTag, Empty } from '../components/ui';
import { useLearner } from '../state/store';

export function FormulasPage({ query }: { query: URLSearchParams }) {
  const s = useLearner();
  const target = query.get('f');
  const [q, setQ] = useState('');
  const [unit, setUnit] = useState<string>('all');
  const [view, setView] = useState<'learn' | 'sheet'>('learn');
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return FORMULAS.filter((f) => (unit === 'all' || CONCEPT_BY_ID[f.concept].unit === unit) && (!qq || `${f.name} ${plain(f.meaning)} ${CONCEPT_BY_ID[f.concept].title} ${f.symbols.map((x) => x.meaning).join(' ')}`.toLowerCase().includes(qq)));
  }, [q, unit]);
  useEffect(() => {
    if (target) setTimeout(() => document.getElementById(`formula-${target}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [target]);
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Formula sheet</h1>
          <p>Every formula in the course — what each symbol means, when to use it, when not to, and a problem to try. {s.formulasTried.length}/{FORMULAS.filter((f) => f.yourTurn).length} tried yourself.</p>
        </div>
        <Seg options={[{ id: 'learn', label: 'Learn' }, { id: 'sheet', label: 'Quick sheet' }]} value={view} onChange={setView} label="View" />
      </div>
      <div className="row wrap mb">
        <div className="search-trigger" style={{ cursor: 'text', maxWidth: 380 }}>
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search formulas (e.g. slope, binomial, IQR)" aria-label="Search formulas" style={{ border: 0, background: 'transparent', outline: 'none', flex: 1 }} />
        </div>
        <div className="row wrap" style={{ gap: 6 }}>
          <button className={`chip ${unit === 'all' ? 'primary' : ''}`} onClick={() => setUnit('all')}>All</button>
          {UNITS.map((u) => <button key={u.id} className={`chip ${unit === u.id ? 'primary' : ''}`} onClick={() => setUnit(u.id)}>Unit {u.number}</button>)}
        </div>
      </div>
      {!list.length && <Empty title="No formulas match">Try a different word.</Empty>}
      {view === 'sheet' ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th className="rh">Formula</th><th>Expression</th><th style={{ textAlign: 'left' }}>Use it when</th></tr></thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id}>
                  <td className="rh"><a href={`#/formulas?f=${f.id}`} onClick={() => setView('learn')}>{f.name}</a>{f.supporting && <div><SupportingTag /></div>}</td>
                  <td><TeX src={f.latex} /></td>
                  <td style={{ textAlign: 'left' }} className="small">{plain(f.whenToUse)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          {list.map((f) => <FormulaCard key={f.id + (target === f.id ? '-open' : '')} formula={f} compact={target !== f.id} />)}
        </div>
      )}
    </div>
  );
}
