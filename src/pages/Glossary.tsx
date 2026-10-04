import { useMemo, useState } from 'react';
import { GLOSSARY, GLOSSARY_BY_ID } from '../content/glossary';
import { FORMULA_BY_ID } from '../content/formulas';
import { CONCEPT_BY_ID } from '../content/concepts';
import { useLearner } from '../state/store';
import { toggleBookmark, isBookmarked } from '../state/actions';
import { navigate } from '../lib/router';
import { Rich, TeX, plain } from '../components/ui/Rich';
import { Icon } from '../components/ui/Icon';
import { SourceTag, Empty } from '../components/ui';
import { Visual } from '../components/charts/Charts';

export function GlossaryPage({ query }: { query: URLSearchParams }) {
  const s = useLearner();
  const [q, setQ] = useState('');
  const sel = query.get('t');
  const entry = sel ? GLOSSARY_BY_ID[sel] : null;
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return GLOSSARY.filter((g) => !qq || `${g.term} ${(g.aliases ?? []).join(' ')} ${plain(g.definition)}`.toLowerCase().includes(qq)).sort((a, b) => a.term.localeCompare(b.term));
  }, [q]);
  const groups = useMemo(() => {
    const m = new Map<string, typeof list>();
    list.forEach((g) => {
      const k = /[a-z]/i.test(g.term[0]) ? g.term[0].toUpperCase() : '#';
      m.set(k, [...(m.get(k) ?? []), g]);
    });
    return [...m.entries()];
  }, [list]);
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Glossary</h1>
          <p>{GLOSSARY.length} course terms — definition, intuition, an example, and where it appears in your course packet.</p>
        </div>
      </div>
      <div className="split">
        <div className="card pad-sm sticky-list">
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter terms…" aria-label="Filter glossary" />
          <div className="mt-sm">
            {groups.map(([letter, items]) => (
              <div key={letter}>
                <div className="palette-group">{letter}</div>
                {items.map((g) => (
                  <a key={g.id} href={`#/glossary?t=${g.id}`} className={`palette-item small ${sel === g.id ? 'active' : ''}`}>{g.term}</a>
                ))}
              </div>
            ))}
            {!list.length && <div className="small muted" style={{ padding: 8 }}>No terms match.</div>}
          </div>
        </div>
        <div>
          {entry ? (
            <div className="card">
              <div className="card-title">
                <div>
                  <h2>{entry.term}</h2>
                  {entry.aliases?.length ? <div className="tiny muted">Also: {entry.aliases.join(', ')}</div> : null}
                </div>
                <button className="btn ghost sm icon" onClick={() => toggleBookmark({ kind: 'glossary', ref: entry.id, title: entry.term })} aria-label="Bookmark term"><Icon name="bookmark" size={16} className={isBookmarked(s, 'glossary', entry.id) ? 'bookmarked' : ''} /></button>
              </div>
              <Rich text={entry.definition} className="q-prompt" />
              <div className="why-box mt-sm"><div className="section-title" style={{ marginBottom: 4 }}>Intuition</div><Rich text={entry.intuition} /></div>
              <div className="mt"><div className="section-title">Example</div><Rich text={entry.example} /></div>
              {entry.visual && <div className="mt"><Visual spec={entry.visual} /></div>}
              {entry.formula && FORMULA_BY_ID[entry.formula] && (
                <div className="mt"><div className="section-title">Formula</div><a href={`#/formulas?f=${entry.formula}`} className="answer-hero" style={{ display: 'block', color: 'var(--text)' }}><TeX src={FORMULA_BY_ID[entry.formula].latex} /> <span className="small muted">— {FORMULA_BY_ID[entry.formula].name}</span></a></div>
              )}
              {entry.mistake && <div className="callout warn small mt"><b>Common mistake:</b> <Rich text={entry.mistake} as="span" /></div>}
              {entry.related.length > 0 && (
                <div className="mt"><div className="section-title">Related terms</div>
                  <div className="row wrap" style={{ gap: 6 }}>{entry.related.map((r) => GLOSSARY_BY_ID[r]).filter(Boolean).map((r) => <button key={r.id} className="chip" onClick={() => navigate(`/glossary?t=${r.id}`)}>{r.term}</button>)}</div>
                </div>
              )}
              <div className="row wrap between mt">
                <SourceTag source={entry.source} />
                <a href={`#/learn/${entry.concept}`} className="small">Lesson: {CONCEPT_BY_ID[entry.concept].title} →</a>
              </div>
            </div>
          ) : (
            <Empty icon="📖" title="Pick a term">Choose a term from the list, or press <span className="kbd">/</span> to search everything.</Empty>
          )}
        </div>
      </div>
    </div>
  );
}
