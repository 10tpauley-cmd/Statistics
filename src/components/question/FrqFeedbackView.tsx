import type { FrqFeedback } from '../../engine/types';
import { Rich } from '../ui/Rich';
import { Ring } from '../ui';
import { Icon } from '../ui/Icon';

const VERDICT: Record<FrqFeedback['verdict'], { label: string; tone: string }> = {
  excellent: { label: 'Excellent', tone: 'success' },
  good: { label: 'Good', tone: 'success' },
  partial: { label: 'Partly there', tone: 'warn' },
  'needs-work': { label: 'Needs work', tone: 'danger' },
};

export function FrqFeedbackView({ fb, aiError }: { fb: FrqFeedback; aiError?: string }) {
  const v = VERDICT[fb.verdict];
  return (
    <div className="feedback" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
      <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
        <Ring value={fb.score / 100} size={64} label={`${fb.score}`} ariaLabel={`Score ${fb.score} out of 100`} />
        <div style={{ flex: 1 }}>
          <div className="row wrap" style={{ gap: 6 }}>
            <span className={`chip ${v.tone}`}>{v.label}</span>
            <span className={`chip ${fb.source === 'ai' ? 'primary' : ''}`}>
              <Icon name={fb.source === 'ai' ? 'sparkles' : 'list'} size={12} /> {fb.source === 'ai' ? 'AI feedback (Claude)' : 'Offline rubric check'}
            </span>
            <span className="chip">Clarity {fb.clarity.score}/5</span>
          </div>
          <p className="small muted mt-sm" style={{ marginBottom: 0 }}>{fb.clarity.comment}</p>
          {aiError && <p className="small" style={{ color: 'var(--warn)', marginTop: 6, marginBottom: 0 }}>{aiError}</p>}
          {fb.source === 'offline' && !aiError && <p className="tiny muted" style={{ marginTop: 6, marginBottom: 0 }}>Offline checks look for key ideas. Add a Claude API key in Settings for detailed AI feedback on your wording.</p>}
        </div>
      </div>
      <div className="grid grid-2 mt">
        <div>
          <div className="section-title" style={{ color: 'var(--success)' }}>What you got right</div>
          {fb.strengths.length ? <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{fb.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="small muted">Nothing matched yet — use the model answer below as a guide.</p>}
        </div>
        <div>
          <div className="section-title" style={{ color: 'var(--danger)' }}>What's missing</div>
          {fb.missing.length ? <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{fb.missing.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="small muted">Nothing important missing. 🎯</p>}
        </div>
      </div>
      {fb.misconceptions.length > 0 && (
        <div className="callout warn mt">
          <b>Misconception to fix</b>
          {fb.misconceptions.map((m, i) => <div key={i} className="small mt-sm"><span className="muted">{m.text}:</span> {m.correction}</div>)}
        </div>
      )}
      <details className="mt">
        <summary className="small bold" style={{ cursor: 'pointer' }}>Rubric breakdown</summary>
        <div className="stack-sm mt-sm">
          {fb.rubric.map((r) => (
            <div key={r.id} className="row small" style={{ alignItems: 'flex-start' }}>
              <span className={`chip ${r.met === 'yes' ? 'success' : r.met === 'partial' ? 'warn' : 'danger'}`} style={{ minWidth: 64, justifyContent: 'center' }}>{r.met === 'yes' ? 'Met' : r.met === 'partial' ? 'Partial' : 'Missing'}</span>
              <div><b>{r.idea}</b><div className="muted">{r.comment}</div></div>
            </div>
          ))}
        </div>
      </details>
      <div className="solution">
        <div className="section-title">A strong answer</div>
        <Rich text={fb.improvedAnswer} />
      </div>
      {fb.followUp && <p className="small mt-sm" style={{ marginBottom: 0 }}><b>Think about:</b> {fb.followUp}</p>}
    </div>
  );
}
