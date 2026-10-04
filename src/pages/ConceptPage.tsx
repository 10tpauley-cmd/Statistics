import { useEffect, useState } from 'react';
import type { ConceptId } from '../engine/types';
import { DIM_LABEL } from '../engine/types';
import { useLearner } from '../state/store';
import { toggleBookmark, isBookmarked, saveNote, deleteNote, startSession, endSession, recordRecall } from '../state/actions';
import { masteryInfo } from '../engine/learner';
import { LEVEL_NAMES } from '../state/actions';
import { CONCEPT_BY_ID } from '../content/concepts';
import { unitOf, sectionOf } from '../content/units';
import { MISCONCEPTION_BY_ID } from '../content/misconceptions';
import { GLOSSARY_BY_ID } from '../content/glossary';
import { STATUS_LABEL } from '../components/hooks';
import { LessonPlayer } from '../components/lesson/LessonPlayer';
import { FormulaCard } from '../components/FormulaCard';
import { Rich, plain } from '../components/ui/Rich';
import { Icon } from '../components/ui/Icon';
import { Ring, Bar, Tabs, SourceTag, LinkBtn, Modal, masteryColor, timeAgo } from '../components/ui';
import { navigate } from '../lib/router';

type Tab = 'lesson' | 'overview' | 'why' | 'notes';

function WhyContent({ id }: { id: ConceptId }) {
  const c = CONCEPT_BY_ID[id];
  return (
    <div className="stack">
      <div className="why-box">
        <div className="section-title" style={{ marginBottom: 6 }}>🔍 Think of it like this</div>
        <Rich text={c.why.analogy} />
      </div>
      <div>
        <div className="section-title">Why it works</div>
        <Rich text={c.why.body} />
      </div>
      <div className="callout">
        <b>🧠 Memory trick:</b> <Rich text={c.memoryTrick} as="span" />
      </div>
      {c.confusedWith.length > 0 && (
        <div>
          <div className="section-title">Don't confuse it with…</div>
          <div className="stack-sm">
            {c.confusedWith.map((x) => (
              <div key={x.id} className="small"><a href={`#/learn/${x.id}`}><b>{CONCEPT_BY_ID[x.id].title}</b></a> — {x.why}</div>
            ))}
          </div>
        </div>
      )}
      <div className="tiny muted">Analogies and intuition are supporting explanations added to help the course ideas click.</div>
    </div>
  );
}

function RecallCards({ id }: { id: ConceptId }) {
  const c = CONCEPT_BY_ID[id];
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const [rated, setRated] = useState<Record<number, boolean>>({});
  return (
    <div className="stack-sm">
      {c.recall.map((r, i) => (
        <div key={i} className="recall-box">
          <Rich text={r.prompt} className="bold small" />
          {shown[i] ? (
            <>
              <div className="callout small mt-sm"><Rich text={r.answer} /></div>
              {!rated[i] ? (
                <div className="row wrap mt-sm">
                  <span className="tiny muted">Did you get it?</span>
                  {([['Yes', 1], ['Partly', 0.6], ['No', 0.2]] as const).map(([l, v]) => (
                    <button key={l} className="btn sm" onClick={() => { recordRecall(id, v); setRated((m) => ({ ...m, [i]: true })); }}>{l}</button>
                  ))}
                </div>
              ) : <div className="tiny muted mt-sm">Logged — thanks for being honest. That's what makes the review schedule accurate.</div>}
            </>
          ) : (
            <button className="btn sm mt-sm" onClick={() => setShown((m) => ({ ...m, [i]: true }))}><Icon name="eye" size={14} /> Answer from memory, then reveal</button>
          )}
        </div>
      ))}
    </div>
  );
}

function NotesPanel({ id }: { id: ConceptId }) {
  const s = useLearner();
  const notes = s.notes.filter((n) => n.concept === id);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="note">{editing ? 'Edit note' : 'Add a note in your own words'}</label>
        <textarea id="note" className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Mean gets pulled toward the tail; median resists outliers." />
      </div>
      <div className="row">
        <button className="btn primary sm" disabled={!text.trim()} onClick={() => { saveNote(id, text.trim(), editing ?? undefined); setText(''); setEditing(null); }}>{editing ? 'Save changes' : 'Save note'}</button>
        {editing && <button className="btn ghost sm" onClick={() => { setEditing(null); setText(''); }}>Cancel</button>}
      </div>
      {notes.length === 0 ? <div className="small muted">No notes yet. Writing things in your own words is one of the best ways to remember them.</div> : (
        <div className="list">
          {notes.map((n) => (
            <div key={n.id} className="list-item" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, whiteSpace: 'pre-wrap' }} className="small">{n.text}<div className="tiny muted mt-sm">{timeAgo(n.updated)}</div></div>
              <button className="btn ghost sm icon" aria-label="Edit note" onClick={() => { setEditing(n.id); setText(n.text); }}><Icon name="edit" size={14} /></button>
              <button className="btn ghost sm icon" aria-label="Delete note" onClick={() => deleteNote(n.id)}><Icon name="trash" size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConceptPage({ id }: { id: ConceptId }) {
  const s = useLearner();
  const c = CONCEPT_BY_ID[id];
  const unit = unitOf(id);
  const section = sectionOf(id);
  const info = masteryInfo(s, id);
  const [tab, setTab] = useState<Tab>('lesson');
  const [whyOpen, setWhyOpen] = useState(false);
  const saved = isBookmarked(s, 'concept', id);
  const lesson = s.lessons[id];

  useEffect(() => {
    startSession('lesson', [id]);
    return () => { endSession(); };
  }, [id]);

  return (
    <div className="content">
      <div className="small muted" style={{ marginBottom: 6 }}>
        <a href="#/learn">Course path</a> › Unit {unit.number}: {unit.title} › {section?.id} {section?.title}
      </div>
      <div className="page-head" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ marginBottom: 6 }}>{c.title}</h1>
          <p style={{ marginTop: 0 }}>{c.short}</p>
          <div className="row wrap mt-sm" style={{ gap: 6 }}>
            <SourceTag source={c.source} />
            <span className="chip">~{c.minutes} min</span>
            <span className="chip" title="How hard this concept usually is">Difficulty {'●'.repeat(c.difficulty)}{'○'.repeat(5 - c.difficulty)}</span>
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setWhyOpen(true)}><Icon name="help" size={16} /> Why does this work?</button>
          <button className="btn icon" onClick={() => toggleBookmark({ kind: 'concept', ref: id, title: c.title })} aria-label={saved ? 'Remove bookmark' : 'Bookmark concept'} title="Bookmark">
            <Icon name="bookmark" size={16} className={saved ? 'bookmarked' : ''} />
          </button>
        </div>
      </div>

      <div className="lesson-wrap">
        <div style={{ minWidth: 0 }}>
          <Tabs<Tab> tabs={[{ id: 'lesson', label: lesson?.completed ? 'Lesson ✓' : 'Lesson' }, { id: 'overview', label: 'Overview' }, { id: 'why', label: 'Why it works' }, { id: 'notes', label: `Notes${s.notes.some((n) => n.concept === id) ? ` (${s.notes.filter((n) => n.concept === id).length})` : ''}` }]} value={tab} onChange={setTab} />
          <div className="mt">
            {tab === 'lesson' && <LessonPlayer concept={c} />}
            {tab === 'overview' && (
              <div className="stack" style={{ gap: 16 }}>
                <div className="card">
                  <h3>What you'll be able to do</h3>
                  <div className="grid grid-2" style={{ gap: 12 }}>
                    {([['Know', c.know], ['Understand', c.understand], ['Calculate', c.calculate], ['Interpret', c.interpret]] as const).filter(([, l]) => l.length).map(([t, l]) => (
                      <div key={t}>
                        <div className="section-title">{t}</div>
                        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{l.map((x) => <li key={x}>{x}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                </div>
                {c.misconceptions.length > 0 && (
                  <div className="card">
                    <h3>Common traps</h3>
                    <div className="stack-sm">
                      {c.misconceptions.map((mid) => MISCONCEPTION_BY_ID[mid]).filter(Boolean).map((m) => (
                        <div key={m.id} className="callout warn small"><b>{m.title}</b> — {m.short}<div className="mt-sm"><b>The fix:</b> <Rich text={m.fix} as="span" /></div></div>
                      ))}
                    </div>
                  </div>
                )}
                {c.formulas.length > 0 && (
                  <div className="stack-sm">
                    <h3 style={{ margin: 0 }}>Formulas</h3>
                    {c.formulas.map((f) => <FormulaCard key={f} formula={f} compact />)}
                  </div>
                )}
                {c.recall.length > 0 && (
                  <div className="card">
                    <h3>Retrieval challenge</h3>
                    <RecallCards id={id} />
                  </div>
                )}
                {c.glossary.length > 0 && (
                  <div className="card">
                    <h3>Key terms</h3>
                    <div className="row wrap" style={{ gap: 6 }}>
                      {c.glossary.map((g) => GLOSSARY_BY_ID[g]).filter(Boolean).map((g) => (
                        <a key={g.id} className="chip" href={`#/glossary?t=${g.id}`} title={plain(g.definition)}>{g.term}</a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {tab === 'why' && <div className="card"><WhyContent id={id} /></div>}
            {tab === 'notes' && <div className="card"><NotesPanel id={id} /></div>}
          </div>
        </div>

        <aside className="lesson-side stack" style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 16px)' }}>
          <div className="card">
            <div className="row" style={{ gap: 14 }}>
              <Ring value={info.overall} size={64} mastered={info.mastered} />
              <div>
                <div className="bold">{Math.round(info.overall * 100)}% mastery</div>
                <span className={`chip ${STATUS_LABEL[info.status].tone}`}>{STATUS_LABEL[info.status].label}</span>
                <div className="tiny muted mt-sm">Level {info.level} · {LEVEL_NAMES[info.level]}</div>
              </div>
            </div>
            <div className="dim-bars mt">
              {info.applicable.map((d) => (
                <div className="dim-bar" key={d}>
                  <span>{DIM_LABEL[d]}</span>
                  <Bar value={info.dims[d]} color={masteryColor(info.dims[d])} label={`${DIM_LABEL[d]} evidence`} />
                  <span className="tiny muted" style={{ textAlign: 'right' }}>{Math.round(info.dims[d] * 100)}%</span>
                </div>
              ))}
            </div>
            {info.retention < 0.99 && <div className="tiny muted mt-sm">Memory: {Math.round(info.retention * 100)}% — a review will restore it.</div>}
            {!info.mastered && info.missing.length > 0 && (
              <div className="mt">
                <div className="section-title">To master this, still needed</div>
                <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{info.missing.slice(0, 4).map((m) => <li key={m}>{m}</li>)}</ul>
              </div>
            )}
          </div>
          <div className="card stack-sm">
            <button className="btn primary block" onClick={() => navigate(`/practice?concept=${id}`)}><Icon name="target" size={16} /> Practice ({info.attempts} done)</button>
            <button className="btn block" onClick={() => navigate(`/teach?concept=${id}`)}><Icon name="chat" size={16} /> Teach it back</button>
            <button className="btn block" onClick={() => setTab('overview')}><Icon name="brain" size={16} /> Retrieval challenge</button>
          </div>
          {c.related.length > 0 && (
            <div className="card">
              <div className="section-title">Connected ideas</div>
              <div className="row wrap" style={{ gap: 6 }}>
                {[...c.prereqs.map((p) => ({ id: p, pre: true })), ...c.related.filter((r) => !c.prereqs.includes(r)).map((r) => ({ id: r, pre: false }))].map((x) => (
                  <a key={x.id} href={`#/learn/${x.id}`} className={`chip ${x.pre ? 'primary' : ''}`} title={x.pre ? 'Prerequisite' : 'Related'}>{x.pre ? '↑ ' : ''}{CONCEPT_BY_ID[x.id].title}</a>
                ))}
              </div>
            </div>
          )}
          <LinkBtn to="/map" className="btn ghost sm">See the full concept map <Icon name="right" size={14} /></LinkBtn>
        </aside>
      </div>

      <Modal open={whyOpen} onClose={() => setWhyOpen(false)} title={`Why does ${c.title.toLowerCase()} work?`} wide>
        <WhyContent id={id} />
      </Modal>
    </div>
  );
}
