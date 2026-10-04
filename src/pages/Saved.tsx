import { useState } from 'react';
import type { Bookmark, ConceptId, Question } from '../engine/types';
import { useLearner } from '../state/store';
import { toggleBookmark, deleteNote, saveNote } from '../state/actions';
import { questionFromId, GENERATOR_BY_ID } from '../engine/questions';
import { CONCEPT_BY_ID } from '../content/concepts';
import { QuestionCard } from '../components/question/QuestionCard';
import { Rich } from '../components/ui/Rich';
import { Icon } from '../components/ui/Icon';
import { Empty, Modal, Tabs, timeAgo } from '../components/ui';
import { navigate } from '../lib/router';

const KIND: Record<Bookmark['kind'], { label: string; icon: string }> = {
  concept: { label: 'Concepts', icon: 'book' },
  formula: { label: 'Formulas', icon: 'sigma' },
  glossary: { label: 'Terms', icon: 'list' },
  question: { label: 'Questions', icon: 'help' },
  mistake: { label: 'Mistakes', icon: 'alert' },
  explanation: { label: 'Explanations', icon: 'bulb' },
};

function routeFor(b: Bookmark) {
  if (b.kind === 'concept') return `/learn/${b.ref}`;
  if (b.kind === 'formula') return `/formulas?f=${b.ref}`;
  if (b.kind === 'glossary') return `/glossary?t=${b.ref}`;
  return null;
}

export function SavedPage({ query }: { query: URLSearchParams }) {
  const s = useLearner();
  const [tab, setTab] = useState<'saved' | 'notes'>(query.get('tab') === 'notes' ? 'notes' : 'saved');
  const [retry, setRetry] = useState<Question | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const kinds = (Object.keys(KIND) as Bookmark['kind'][]).filter((k) => s.bookmarks.some((b) => b.kind === k));
  const noteGroups = [...new Set(s.notes.map((n) => n.concept))] as ConceptId[];

  const openQuestion = (b: Bookmark) => {
    const gid = b.ref.split('#')[0];
    const g = GENERATOR_BY_ID[gid];
    const q = questionFromId(b.ref, g ? g.levels[Math.floor(g.levels.length / 2)] : 3);
    if (q) setRetry(q);
  };

  return (
    <div className="content narrow">
      <div className="page-head">
        <div>
          <h1>Saved & notes</h1>
          <p>Bookmarked concepts, formulas, terms, and questions — plus every note you've written.</p>
        </div>
      </div>
      <Tabs tabs={[{ id: 'saved', label: `Saved (${s.bookmarks.length})` }, { id: 'notes', label: `Notes (${s.notes.length})` }]} value={tab} onChange={setTab} />
      <div className="mt">
        {tab === 'saved' && (s.bookmarks.length === 0 ? (
          <Empty icon="🔖" title="Nothing saved yet">Tap the bookmark icon on any concept, formula, term, or question to keep it here.</Empty>
        ) : (
          <div className="stack">
            {kinds.map((k) => (
              <div key={k} className="card">
                <div className="section-title"><Icon name={KIND[k].icon} size={12} /> {KIND[k].label}</div>
                <div className="list">
                  {s.bookmarks.filter((b) => b.kind === k).map((b) => {
                    const r = routeFor(b);
                    return (
                      <div key={b.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {r ? <a href={`#${r}`} className="bold small">{b.title}</a> : <span className="bold small">{b.title}</span>}
                          {b.snapshot && b.kind === 'question' && <Rich text={b.snapshot} className="small muted mt-sm" />}
                          <div className="tiny muted">{timeAgo(b.t)}</div>
                        </div>
                        {b.kind === 'question' && <button className="btn sm" onClick={() => openQuestion(b)}>Try again</button>}
                        <button className="btn ghost sm icon" aria-label="Remove bookmark" onClick={() => toggleBookmark({ kind: b.kind, ref: b.ref, title: b.title })}><Icon name="trash" size={14} /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
        {tab === 'notes' && (s.notes.length === 0 ? (
          <Empty icon="📝" title="No notes yet">Open any lesson and use its Notes tab to write ideas in your own words.</Empty>
        ) : (
          <div className="stack">
            {noteGroups.map((c) => (
              <div key={c} className="card">
                <div className="card-title"><h3><a href={`#/learn/${c}`}>{CONCEPT_BY_ID[c].title}</a></h3></div>
                <div className="list">
                  {s.notes.filter((n) => n.concept === c).map((n) => (
                    <div key={n.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                      {editing?.id === n.id ? (
                        <div style={{ flex: 1 }}>
                          <textarea className="textarea" value={editing.text} onChange={(e) => setEditing({ id: n.id, text: e.target.value })} aria-label="Edit note" />
                          <div className="row mt-sm"><button className="btn primary sm" onClick={() => { saveNote(c, editing.text, n.id); setEditing(null); }}>Save</button><button className="btn ghost sm" onClick={() => setEditing(null)}>Cancel</button></div>
                        </div>
                      ) : (
                        <>
                          <div style={{ flex: 1, whiteSpace: 'pre-wrap' }} className="small">{n.text}<div className="tiny muted mt-sm">{timeAgo(n.updated)}</div></div>
                          <button className="btn ghost sm icon" aria-label="Edit note" onClick={() => setEditing({ id: n.id, text: n.text })}><Icon name="edit" size={14} /></button>
                          <button className="btn ghost sm icon" aria-label="Delete note" onClick={() => deleteNote(n.id)}><Icon name="trash" size={14} /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Modal open={!!retry} onClose={() => setRetry(null)} title="Saved question" wide>
        {retry && <QuestionCard question={retry} mode="practice" onDone={() => setRetry(null)} nextLabel="Done" />}
      </Modal>
      <div className="tiny muted mt">Tip: press <span className="kbd">/</span> anywhere to search saved concepts, formulas and terms. <button className="link-btn" onClick={() => navigate('/learn')}>Browse the course</button></div>
    </div>
  );
}
