import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Mu, type MuMood } from './Mu';
import { onAppEvent, getState, useLearner } from '../../state/store';
import { useTutorFocus, getTutorFocus } from '../../state/tutor';
import { navigate } from '../../lib/router';
import type { ChatTurn } from '../../lib/ai';
import { aiAvailable, conceptFacts, sourceText } from '../../lib/frqService';
import { todayPlan, weakConcepts } from '../../engine/planner';
import { misconceptionCounts } from '../../engine/learner';
import { CONCEPTS, CONCEPT_BY_ID } from '../../content/concepts';
import { GLOSSARY } from '../../content/glossary';
import { FORMULAS } from '../../content/formulas';
import { MISCONCEPTION_BY_ID } from '../../content/misconceptions';
import { plain } from '../ui/Rich';
import { Icon } from '../ui/Icon';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
  action?: { label: string; route: string };
  offline?: boolean;
}

// Conversation survives page changes for the whole visit.
let history: Msg[] = [];

/* ---------------- Offline brain (works with no API key) ---------------- */

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Names a glossary entry answers to: term, aliases, the term without its "(abbrev)", and the abbreviation itself. */
function namesOf(e: (typeof GLOSSARY)[number]) {
  const paren = e.term.match(/\(([^)]+)\)/)?.[1].split(/,\s*/) ?? [];
  return [e.term, e.term.replace(/\s*\(.*\)/, ''), ...paren, ...(e.aliases ?? [])].map((n) => n.toLowerCase().trim()).filter((n) => n.length >= 2);
}

function findTerm(q: string) {
  const t = q.toLowerCase();
  let best: { e: (typeof GLOSSARY)[number]; len: number } | null = null;
  for (const e of GLOSSARY) {
    for (const n of namesOf(e)) {
      if (new RegExp(`(^|[^a-z0-9])${esc(n)}($|[^a-z0-9])`).test(t) && (!best || n.length > best.len)) best = { e, len: n.length };
    }
  }
  return best?.e ?? null;
}

function findConcept(q: string) {
  const t = q.toLowerCase();
  return CONCEPTS.find((c) => t.includes(c.title.toLowerCase())) ?? null;
}

function findFormula(q: string) {
  const t = q.toLowerCase();
  return FORMULAS.find((f) => t.includes(f.name.toLowerCase())) ?? null;
}

function explainConcept(id: string): Msg {
  const c = CONCEPT_BY_ID[id as keyof typeof CONCEPT_BY_ID];
  return { role: 'assistant', offline: true, text: `**${c.title}** — ${plain(c.short)}\n\n**Think of it like this:** ${plain(c.why.analogy)}\n\n${plain(c.why.body)}`, action: { label: 'Open the lesson', route: `/learn/${c.id}` } };
}

function planMsg(): Msg {
  const plan = todayPlan(getState());
  if (!plan.length) return { role: 'assistant', offline: true, text: 'You\'re all caught up! Try a mixed review or an exam to test yourself.', action: { label: 'Mixed review', route: '/practice?mode=mixed' } };
  const first = plan[0];
  return {
    role: 'assistant', offline: true,
    text: `Here's what I'd do next:\n\n**${first.title}** — ${first.reason}${plan.length > 1 ? `\n\nAfter that: ${plan.slice(1, 3).map((p) => p.title).join(', ')}.` : ''}`,
    action: { label: `Start: ${first.title}`, route: first.route },
  };
}

function offlineReply(q: string): Msg {
  const t = q.toLowerCase();
  if (/\b(next|study|plan|what should i)\b/.test(t)) return planMsg();
  if (/\bhint\b/.test(t)) {
    const f = getTutorFocus();
    if (f.question && !f.question.answered) {
      window.dispatchEvent(new CustomEvent('statlab:hint'));
      return { role: 'assistant', offline: true, text: f.question.hintsShown >= f.question.totalHints ? 'You\'ve seen every hint for this one — the last one walks through it. Take it step by step!' : 'I added the next hint right under the problem. 👇 Try one step before asking for another — that\'s what builds the skill.' };
    }
    return { role: 'assistant', offline: true, text: 'Open a practice problem and I can drop hints into it one at a time.', action: { label: 'Quick practice', route: '/practice?mode=quick' } };
  }
  const formula = findFormula(t);
  if (formula) return { role: 'assistant', offline: true, text: `**${formula.name}**\n\n${plain(formula.meaning)}\n\n**Use it when:** ${plain(formula.whenToUse)}\n\n**Memory trick:** ${plain(formula.memoryTrick)}`, action: { label: 'See it on the formula sheet', route: `/formulas?f=${formula.id}` } };
  const term = findTerm(t);
  if (term) return { role: 'assistant', offline: true, text: `**${term.term}:** ${plain(term.definition)}\n\n**Intuition:** ${plain(term.intuition)}\n\n**Example:** ${plain(term.example)}`, action: { label: 'Open in glossary', route: `/glossary?t=${term.id}` } };
  const concept = findConcept(t);
  if (concept) return explainConcept(concept.id);
  return {
    role: 'assistant', offline: true,
    text: 'Offline, I can define course terms ("what is IQR?"), explain formulas ("standard deviation formula"), give hints on the problem you\'re working on, and tell you what to study next.\n\nFor open-ended questions, add your Claude API key in Settings, and I can answer anything about the course.',
    action: { label: 'Open Settings', route: '/settings' },
  };
}

function learnerSummary() {
  const s = getState();
  const weak = weakConcepts(s, 3).map((w) => `${CONCEPT_BY_ID[w.id].title} (${Math.round(w.info.overall * 100)}%)`);
  const mis = Object.entries(misconceptionCounts(s)).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => MISCONCEPTION_BY_ID[id]?.title).filter(Boolean);
  return [weak.length ? `Weakest started topics: ${weak.join(', ')}` : 'Just getting started', mis.length ? `Recurring mistakes: ${mis.join('; ')}` : ''].filter(Boolean).join('. ');
}

/** Light formatting for chat text: **bold** and line breaks. */
function ChatText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>))}</>;
}

/* ---------------- Dock ---------------- */

export function MascotDock() {
  const s = useLearner();
  const focus = useTutorFocus();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(history);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [bubble, setBubble] = useState<{ text: string; mood: MuMood; id: number } | null>(null);
  const [mood, setMood] = useState<MuMood>('idle');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);
  const enabled = s.settings.mascot;

  useEffect(() => { history = msgs; }, [msgs]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs, busy]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);

  const push = (m: Msg) => setMsgs((xs) => [...xs, m]);

  const send = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput('');
    const userMsg: Msg = { role: 'user', text: q };
    const convo = [...history, userMsg];
    setMsgs(convo);
    if (!aiAvailable()) {
      setMood('thinking');
      setTimeout(() => { push(offlineReply(q)); setMood('happy'); }, 250);
      return;
    }
    setBusy(true);
    setMood('thinking');
    abortRef.current = false;
    const f = getTutorFocus();
    const turns: ChatTurn[] = convo.filter((m) => !m.offline || m.role === 'user').slice(-12).map((m) => ({ role: m.role, content: m.text }));
    try {
      let acc = '';
      setMsgs((xs) => [...xs, { role: 'assistant', text: '' }]);
      const { streamTutorReply } = await import('../../lib/ai');
      for await (const chunk of streamTutorReply(getState().settings.aiKey, turns, {
        page: f.page,
        conceptTitle: f.concept ? CONCEPT_BY_ID[f.concept].title : undefined,
        conceptFacts: f.concept ? conceptFacts(f.concept) : undefined,
        source: f.concept ? sourceText(f.concept) : undefined,
        currentQuestion: f.question ? `${f.question.context ? f.question.context + '\n' : ''}${f.question.prompt}${f.question.answered && f.question.solution ? `\nWorked solution: ${f.question.solution.join(' → ')}` : ''}` : undefined,
        questionAnswered: f.question?.answered,
        learnerSummary: learnerSummary(),
      })) {
        if (abortRef.current) break;
        acc += chunk;
        setMsgs((xs) => [...xs.slice(0, -1), { role: 'assistant', text: acc }]);
      }
      setMood('happy');
    } catch (e) {
      const fallback = offlineReply(q);
      setMsgs((xs) => [...xs.slice(0, -1), { role: 'assistant', offline: true, text: `⚠️ ${(e as Error).message}\n\nHere's what I can tell you offline:\n\n${fallback.text}`, action: fallback.action }]);
      setMood('encourage');
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // Reactions + open requests from the rest of the app
  useEffect(() => onAppEvent((e) => {
    if (e.kind === 'mascot') {
      if (!getState().settings.mascotReactions || !getState().settings.mascot) return;
      const id = Date.now();
      setBubble({ text: e.text, mood: e.mood, id });
      setMood(e.mood);
      window.setTimeout(() => { setBubble((b) => (b?.id === id ? null : b)); setMood('idle'); }, 5200);
    } else if (e.kind === 'mascot-open') {
      setOpen(true);
      setBubble(null);
      if (e.prompt) setTimeout(() => send(e.prompt!), 60);
    }
  }), [send]);

  // "?" toggles Mu; Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable;
      if (e.key === '?' && !typing && getState().settings.mascot) { e.preventDefault(); setOpen((o) => !o); setBubble(null); }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!enabled) return null;

  const locked = focus.page.includes('(no help available)');
  const q = focus.question;
  const c = focus.concept ? CONCEPT_BY_ID[focus.concept] : null;
  const chips: { label: string; run: () => void }[] = [];
  if (q && !q.answered) chips.push({ label: '💡 Give me a hint', run: () => send('Can you give me a hint?') });
  if (q && !q.answered && aiAvailable()) chips.push({ label: 'What\'s the first step?', run: () => send('What is the first step for this problem? Don\'t tell me the answer.') });
  if (q && q.answered) chips.push({ label: 'Explain this solution', run: () => (aiAvailable() ? send('Explain the solution to this problem step by step, and why it works.') : (push({ role: 'user', text: 'Explain this solution' }), push({ role: 'assistant', offline: true, text: `Here's the path:\n\n${(q.solution ?? []).map((st, i) => `${i + 1}. ${st}`).join('\n')}` }))) });
  if (c) {
    chips.push({ label: `Explain ${c.title} simply`, run: () => (aiAvailable() ? send(`Explain ${c.title} simply, with an everyday analogy.`) : (push({ role: 'user', text: `Explain ${c.title} simply` }), push(explainConcept(c.id)))) });
    chips.push({ label: 'Memory trick', run: () => { push({ role: 'user', text: `Memory trick for ${c.title}?` }); push({ role: 'assistant', offline: true, text: `🧠 ${plain(c.memoryTrick)}` }); } });
    if (c.misconceptions.length) chips.push({ label: 'Common traps', run: () => { push({ role: 'user', text: `Common mistakes with ${c.title}?` }); push({ role: 'assistant', offline: true, text: c.misconceptions.slice(0, 3).map((id) => MISCONCEPTION_BY_ID[id]).filter(Boolean).map((m) => `**${m.title}** — ${plain(m.fix)}`).join('\n\n') }); } });
  }
  chips.push({ label: 'What should I study next?', run: () => { push({ role: 'user', text: 'What should I study next?' }); push(planMsg()); } });
  chips.push({ label: 'Quiz me', run: () => { setOpen(false); navigate('/practice?mode=quick'); } });
  chips.push({ label: 'Calculator', run: () => { setOpen(false); navigate('/calculator'); } });

  const greeting: ReactNode = (
    <div className="msg mu">
      Hi{s.name ? ` ${s.name}` : ''}! I'm <b>Mu</b> (like μ, the mean). {q ? 'I can see the problem you\'re on. Want a hint?' : c ? `We're on ${c.title}. Ask me anything about it.` : 'Ask me about any course topic, or tap a button below.'}
      {!aiAvailable() && <div className="tiny muted mt-sm">Offline mode: glossary, formulas, hints and planning. Add a Claude API key in Settings for full conversations.</div>}
    </div>
  );

  return (
    <>
      {!open && bubble && (
        <button className="mascot-bubble" onClick={() => { setOpen(true); setBubble(null); }} style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--text)' }}>
          {bubble.text}
        </button>
      )}
      {!open && (
        <button className="mascot-fab" onClick={() => { setOpen(true); setBubble(null); }} aria-label="Ask Mu, your statistics helper (shortcut: ?)" title="Ask Mu (press ?)">
          <Mu mood={bubble ? bubble.mood : mood === 'idle' ? 'wave' : mood} size={64} className={bubble ? '' : 'mascot-idle'} />
        </button>
      )}
      {open && (
        <div className="mascot-panel" role="dialog" aria-label="Mu helper">
          <div className="mascot-head">
            <Mu mood={busy ? 'thinking' : mood} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="bold">Mu</div>
              <div className="tiny muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {aiAvailable() ? '✨ Claude-powered tutor' : 'Offline helper'} · {focus.page}
              </div>
            </div>
            {msgs.length > 0 && <button className="btn ghost sm" onClick={() => setMsgs([])} title="Clear conversation">Clear</button>}
            <button className="btn ghost icon sm" onClick={() => setOpen(false)} aria-label="Close Mu"><Icon name="x" /></button>
          </div>
          {locked ? (
            <div className="mascot-msgs"><div className="msg mu">I'm staying quiet during tests so your results show what <b>you</b> know. 🤐 Finish up and I'll help you review every question you missed!</div></div>
          ) : (<>
          <div className="mascot-msgs" ref={listRef} aria-live="polite">
            {greeting}
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.role === 'user' ? 'me' : 'mu'}`}>
                {m.text ? <ChatText text={m.text} /> : <span className="typing" aria-label="Mu is typing"><i /><i /><i /></span>}
                {m.action && (
                  <div className="mt-sm"><button className="btn sm" onClick={() => { setOpen(false); navigate(m.action!.route); }}>{m.action.label} <Icon name="right" size={14} /></button></div>
                )}
              </div>
            ))}
          </div>
          <div className="mascot-chips">
            {chips.slice(0, 6).map((ch) => <button key={ch.label} className="chip" onClick={ch.run} disabled={busy}>{ch.label}</button>)}
          </div>
          <form className="mascot-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input ref={inputRef} className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={aiAvailable() ? 'Ask Mu anything about stats…' : 'Try "what is IQR?"'} aria-label="Message Mu" />
            {busy ? (
              <button type="button" className="btn icon" onClick={() => (abortRef.current = true)} aria-label="Stop"><Icon name="x" /></button>
            ) : (
              <button type="submit" className="btn primary icon" disabled={!input.trim()} aria-label="Send"><Icon name="send" size={16} /></button>
            )}
          </form>
          </>)}
        </div>
      )}
    </>
  );
}
