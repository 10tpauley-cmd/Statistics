import { useState } from 'react';
import type { Formula } from '../engine/types';
import { FORMULA_BY_ID } from '../content/formulas';
import { CONCEPT_BY_ID } from '../content/concepts';
import { parseNumber, fmt } from '../lib/stats/format';
import { tryFormula, toggleBookmark, isBookmarked } from '../state/actions';
import { useLearner } from '../state/store';
import { Rich, TeX } from './ui/Rich';
import { Icon } from './ui/Icon';
import { SourceTag, SupportingTag, LinkBtn } from './ui';

/** STEP 7 — a formula taught properly: symbols, meaning, when (not) to use it, memory trick, example, your turn. */
export function FormulaCard({ formula, compact = false }: { formula: Formula | string; compact?: boolean }) {
  const f = typeof formula === 'string' ? FORMULA_BY_ID[formula] : formula;
  const s = useLearner();
  const [open, setOpen] = useState(!compact);
  const [stepsShown, setStepsShown] = useState(0);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<null | boolean>(null);
  const [showHint, setShowHint] = useState(false);
  if (!f) return null;
  const saved = isBookmarked(s, 'formula', f.id);
  const check = () => {
    if (!f.yourTurn) return;
    const v = parseNumber(guess);
    if (v === null) return;
    const ok = Math.abs(v - f.yourTurn.answer) <= f.yourTurn.tol;
    setResult(ok);
    if (ok) tryFormula(f.id);
  };
  return (
    <div className="card flat" id={`formula-${f.id}`}>
      <div className="card-title">
        <div>
          <h3>{f.name}</h3>
          <div className="row wrap mt-sm" style={{ gap: 6 }}>
            <span className="chip">{CONCEPT_BY_ID[f.concept].title}</span>
            {f.supporting && <SupportingTag />}
          </div>
        </div>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn ghost sm icon" aria-label={saved ? 'Remove from saved' : 'Save formula'} title="Save" onClick={() => toggleBookmark({ kind: 'formula', ref: f.id, title: f.name })}>
            <Icon name="bookmark" size={16} className={saved ? 'bookmarked' : ''} />
          </button>
          {compact && <button className="btn ghost sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? 'Less' : 'Learn it'}</button>}
        </div>
      </div>
      <div className="answer-hero center" style={{ padding: '10px 12px' }}><TeX src={f.latex} display /></div>
      <Rich text={f.meaning} className="small mt-sm" />
      {open && (
        <div className="stack mt-sm">
          <div>
            <div className="section-title">What each symbol means</div>
            <div className="table-scroll">
              <table className="data-table">
                <tbody>
                  {f.symbols.map((sy) => (
                    <tr key={sy.sym}><td className="rh" style={{ width: 90 }}><TeX src={sy.sym} /></td><td style={{ textAlign: 'left' }}>{sy.meaning}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-2" style={{ gap: 10 }}>
            <div className="callout success"><b>Use it when…</b><Rich text={f.whenToUse} className="small" /></div>
            <div className="callout warn"><b>Don't use it when…</b><Rich text={f.whenNotToUse} className="small" /></div>
          </div>
          <div className="why-box"><div className="section-title" style={{ marginBottom: 4 }}>🧠 Memory trick</div><Rich text={f.memoryTrick} className="small" /></div>
          <div>
            <div className="section-title">Worked example</div>
            <Rich text={f.example.prompt} className="small" />
            <div className="calc-steps mt-sm">
              {f.example.steps.slice(0, stepsShown).map((st, i) => <div className="calc-step small" key={i}><Rich text={st} /></div>)}
            </div>
            {stepsShown < f.example.steps.length ? (
              <div className="row mt-sm">
                <button className="btn sm" onClick={() => setStepsShown((n) => n + 1)}>Show step {stepsShown + 1} of {f.example.steps.length}</button>
                <button className="btn sm ghost" onClick={() => setStepsShown(f.example.steps.length)}>Show all</button>
              </div>
            ) : (
              <div className="callout small mt-sm"><b>Answer:</b> <Rich text={f.example.answer} as="span" /></div>
            )}
          </div>
          <div className="callout warn small"><b>Common mistake:</b> <Rich text={f.commonMistake} as="span" /></div>
          {f.yourTurn && (
            <div className="part" style={{ borderColor: 'var(--primary)' }}>
              <div className="part-label"><Icon name="pen" size={12} /> Your turn</div>
              <Rich text={f.yourTurn.prompt} className="small" />
              <div className="numeric-row mt-sm">
                <input className="input" inputMode="decimal" value={guess} placeholder="Your answer" aria-label="Your answer" onChange={(e) => { setGuess(e.target.value); setResult(null); }} onKeyDown={(e) => e.key === 'Enter' && check()} />
                <button className="btn primary sm" onClick={check} disabled={!guess}>Check</button>
                {!showHint && <button className="btn ghost sm" onClick={() => setShowHint(true)}><Icon name="bulb" size={14} /> Hint</button>}
              </div>
              {showHint && <div className="hint-box small"><Rich text={f.yourTurn.hint} /></div>}
              {result !== null && (
                <p className="small mt-sm" style={{ marginBottom: 0, color: result ? 'var(--success)' : 'var(--danger)' }}>
                  {result ? `✓ Correct — ${fmt(f.yourTurn.answer, 4)}. You've used this formula yourself.` : 'Not yet — check each symbol\'s value and try again.'}
                </p>
              )}
            </div>
          )}
          <div className="row wrap between">
            <SourceTag source={f.source} />
            <LinkBtn to={`/practice?concept=${f.concept}`} className="btn sm ghost">Practice {CONCEPT_BY_ID[f.concept].title} <Icon name="right" size={14} /></LinkBtn>
          </div>
        </div>
      )}
    </div>
  );
}
