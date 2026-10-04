import type { Bookmark, ConceptId, ExamRecord, FrqFeedback, LearnerState, Note, SessionRecord, Settings, StudyMode, TeachRecord } from '../engine/types';
import { addXp, masteryInfo, recordAttempt, recordExplanation, seedFromPlacement, touchDay, type AttemptInput, type LearnerEvent } from '../engine/learner';
import { ACHIEVEMENTS, newAchievements } from '../engine/achievements';
import { CONCEPT_BY_ID } from '../content/concepts';
import { BOSS_BY_ID } from '../content/boss';
import { emit, getState, replaceState, setState, defaultState, hydrate } from './store';
import { playSound } from '../lib/sound';
import { resetCombo } from '../lib/fx';

/* ---------------- Event fan-out ---------------- */

function announce(events: LearnerEvent[], s: LearnerState) {
  for (const e of events) {
    if (e.kind === 'level-up') {
      emit({ kind: 'celebrate', strength: 'big', title: `Level ${e.level}!`, body: 'Your learner level went up.' });
      playSound('levelup', s.settings.sound);
    } else if (e.kind === 'mastered') {
      emit({ kind: 'celebrate', strength: 'big', title: 'Concept mastered', body: CONCEPT_BY_ID[e.concept].title });
      emit({ kind: 'mascot', mood: 'proud', text: `You mastered ${CONCEPT_BY_ID[e.concept].title}! I'll still bring it back for review so it sticks.` });
      playSound('levelup', s.settings.sound);
    } else if (e.kind === 'concept-level' && e.dir === 'up') {
      emit({ kind: 'toast', tone: 'info', icon: '⬆️', title: `${CONCEPT_BY_ID[e.concept].title}: level ${e.level}`, body: LEVEL_NAMES[e.level] });
    } else if (e.kind === 'concept-level' && e.dir === 'down') {
      emit({ kind: 'toast', tone: 'info', icon: '🧭', title: `${CONCEPT_BY_ID[e.concept].title}: back to level ${e.level}`, body: 'We\'ll rebuild this step by step.' });
    }
  }
}

/** Public wrappers so other action modules (e.g. the Pathway) share the same event + achievement fan-out. */
export function announceEvents(events: LearnerEvent[]) {
  announce(events, getState());
}

export function checkAchievementsNow() {
  checkAchievements();
}

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Recognition', 2: 'Basic application', 3: 'Normal application', 4: 'Interpretation', 5: 'Mixed problems', 6: 'Exam-style', 7: 'Mastery',
};

function checkAchievements() {
  const ids = newAchievements(getState());
  if (!ids.length) return;
  const now = Date.now();
  setState((s) => {
    const ach = { ...s.achievements };
    ids.forEach((id) => (ach[id] = now));
    const ev: LearnerEvent[] = [];
    return addXp({ ...s, achievements: ach }, 25 * ids.length, 'achievement', now, ev);
  });
  ids.forEach((id) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id)!;
    emit({ kind: 'toast', tone: 'success', icon: a.icon, title: `Achievement: ${a.title}`, body: a.description });
  });
}

/* ---------------- Sessions ---------------- */

let active: SessionRecord | null = null;

export function activeSession() {
  return active;
}

/** Mode of the running study session, if any (graded modes keep feedback effects quiet). */
export function activeSessionMode(): StudyMode | null {
  return active?.mode ?? null;
}

export function startSession(mode: StudyMode, concepts: ConceptId[] = []): SessionRecord {
  const s = getState();
  if (active && active.mode === mode) return active;
  if (active) endSession();
  resetCombo(); // a combo never carries from one session (or an exam) into the next
  active = {
    id: `s-${Date.now()}`, start: Date.now(), mode, concepts: [...concepts], problems: 0, correct: 0, hints: 0, xp: 0, activeMs: 0,
    masteryBefore: Object.fromEntries(concepts.map((c) => [c, masteryInfo(s, c).overall])),
  };
  return active;
}

function noteConcept(id: ConceptId) {
  if (!active) return;
  if (!active.concepts.includes(id)) {
    active.concepts.push(id);
    if (active.masteryBefore[id] === undefined) active.masteryBefore[id] = masteryInfo(getState(), id).overall;
  }
}

/** Ends the session and returns its summary (null if nothing happened). */
export function endSession(): SessionRecord | null {
  if (!active) return null;
  const s = getState();
  const rec: SessionRecord = { ...active, end: Date.now(), masteryAfter: Object.fromEntries(active.concepts.map((c) => [c, masteryInfo(s, c).overall])) };
  active = null;
  if (rec.problems === 0 && rec.activeMs < 30000) return null;
  setState((st) => ({ ...st, sessions: [rec, ...st.sessions].slice(0, 300) }));
  return rec;
}

/** Called by the study-time heartbeat. */
export function addStudyTime(ms: number) {
  if (active) active.activeMs += ms;
  setState((s) => touchDay(s, Date.now(), { ms }));
}

/* ---------------- Answers ---------------- */

export function answerQuestion(input: AttemptInput): LearnerEvent[] {
  let events: LearnerEvent[] = [];
  const before = getState().xp;
  setState((s) => {
    const r = recordAttempt(s, input);
    events = r.events;
    return r.state;
  });
  const after = getState();
  if (active) {
    active.problems += 1;
    if (input.correct) active.correct += 1;
    active.hints += input.hintsUsed;
    active.xp += after.xp - before;
    noteConcept(input.question.concept);
  }
  announce(events, after);
  checkAchievements();
  return events;
}

/* ---------------- Lessons ---------------- */

export function setLessonStep(id: ConceptId, step: number, opts: { wrongCheck?: boolean } = {}) {
  setState((s) => {
    const cur = s.lessons[id] ?? { step: 0, completed: false, checksWrong: 0 };
    return { ...s, lessons: { ...s.lessons, [id]: { ...cur, step: Math.max(cur.completed ? cur.step : 0, step), checksWrong: (cur.checksWrong ?? 0) + (opts.wrongCheck ? 1 : 0) } } };
  });
  if (active) noteConcept(id);
}

export function completeLesson(id: ConceptId) {
  const now = Date.now();
  let ev: LearnerEvent[] = [];
  const wasDone = getState().lessons[id]?.completed;
  setState((s) => {
    const cur = s.lessons[id] ?? { step: 0, completed: false, checksWrong: 0 };
    const perfect = (cur.checksWrong ?? 0) === 0;
    let next: LearnerState = { ...s, lessons: { ...s.lessons, [id]: { ...cur, completed: true, completedAt: cur.completedAt ?? now, perfect: cur.perfect || perfect, step: CONCEPT_BY_ID[id].lesson.length } } };
    // Completing a lesson schedules the first spaced review for tomorrow.
    const c = next.concepts[id];
    if (!c?.srs) {
      const base = c ?? undefined;
      next = { ...next, concepts: { ...next.concepts, [id]: { ...(base ?? emptyFor()), srs: { step: 0, due: now + 86400000, last: now, reps: 0, lapses: 0 } } } };
    }
    if (!wasDone) {
      ev = [];
      next = addXp(next, 50, 'lesson', now, ev);
    }
    return touchDay(next, now, {});
  });
  if (!wasDone) {
    emit({ kind: 'celebrate', strength: 'small', title: 'Lesson complete', body: CONCEPT_BY_ID[id].title });
    playSound('complete', getState().settings.sound);
  }
  announce(ev, getState());
  checkAchievements();
}

function emptyFor() {
  return {
    dims: { recognize: { score: 0, evidence: 0, last: 0 }, calculate: { score: 0, evidence: 0, last: 0 }, interpret: { score: 0, evidence: 0, last: 0 }, apply: { score: 0, evidence: 0, last: 0 }, explain: { score: 0, evidence: 0, last: 0 } },
    level: 1, upStreak: 0, downStreak: 0, attempts: 0, correct: 0, hints: 0, timeMs: 0, noHintHighLevel: 0, lastPracticed: 0, srs: null,
  };
}

/* ---------------- Explain-it evidence ---------------- */

const normText = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Records a Teach It explanation. Resubmitting the same text earns no new evidence (anti-gaming). */
export function recordTeach(concept: ConceptId, text: string, feedback: FrqFeedback): { duplicate: boolean } {
  const now = Date.now();
  const score = feedback.score / 100;
  if (getState().teach.some((t) => t.concept === concept && normText(t.text) === normText(text))) return { duplicate: true };
  const rec: TeachRecord = { id: `t-${now}`, t: now, concept, text, score, graded: feedback.source, feedback };
  let ev: LearnerEvent[] = [];
  setState((s) => {
    let next = recordExplanation({ ...s, teach: [rec, ...s.teach].slice(0, 200) }, concept, score, 'teach', now);
    ev = [];
    next = addXp(next, Math.round(30 * score), 'teach', now, ev);
    return next;
  });
  if (active) noteConcept(concept);
  announce(ev, getState());
  checkAchievements();
  return { duplicate: false };
}

export function recordRecall(concept: ConceptId, score: number) {
  setState((s) => recordExplanation(s, concept, score, 'recall'));
  if (active) noteConcept(concept);
}

/* ---------------- Exams, bosses, placement ---------------- */

export function recordExam(rec: ExamRecord) {
  const now = Date.now();
  let ev: LearnerEvent[] = [];
  setState((s) => {
    ev = [];
    return addXp({ ...s, exams: [rec, ...s.exams].slice(0, 100) }, Math.round(rec.score * 100), 'exam', now, ev);
  });
  announce(ev, getState());
  checkAchievements();
}

/** Record a boss attempt; returns the clear XP paid (150 on the first clear, otherwise 0). */
export function recordBoss(id: string, score: number, opts: { quiet?: boolean } = {}): number {
  const now = Date.now();
  const cleared = score >= 0.7;
  const prev = getState().bosses[id];
  let ev: LearnerEvent[] = [];
  setState((s) => {
    ev = [];
    const next = { ...s, bosses: { ...s.bosses, [id]: { best: Math.max(prev?.best ?? 0, score), t: now, cleared: prev?.cleared || cleared } } };
    return cleared && !prev?.cleared ? addXp(next, 150, 'boss', now, ev) : next;
  });
  if (cleared && !prev?.cleared && !opts.quiet) emit({ kind: 'celebrate', strength: 'big', title: 'Boss defeated!', body: BOSS_BY_ID[id]?.title });
  announce(ev, getState());
  checkAchievements();
  return cleared && !prev?.cleared ? 150 : 0;
}

export function finishPlacement(results: { concept: ConceptId; correct: boolean; level: number }[]) {
  setState((s) => seedFromPlacement(s, results));
}

export function skipPlacement() {
  setState((s) => ({ ...s, placement: 'skipped' }));
}

/* ---------------- Bookmarks & notes ---------------- */

export function toggleBookmark(b: Omit<Bookmark, 'id' | 't'>) {
  const s = getState();
  const existing = s.bookmarks.find((x) => x.kind === b.kind && x.ref === b.ref);
  if (existing) {
    setState((st) => ({ ...st, bookmarks: st.bookmarks.filter((x) => x.id !== existing.id) }));
    emit({ kind: 'toast', tone: 'info', icon: '🔖', title: 'Removed from Saved' });
    return false;
  }
  setState((st) => ({ ...st, bookmarks: [{ ...b, id: `b-${Date.now()}`, t: Date.now() }, ...st.bookmarks] }));
  emit({ kind: 'toast', tone: 'success', icon: '🔖', title: 'Saved', body: b.title });
  return true;
}

export function isBookmarked(s: LearnerState, kind: Bookmark['kind'], ref: string) {
  return s.bookmarks.some((x) => x.kind === kind && x.ref === ref);
}

export function saveNote(concept: ConceptId, text: string, id?: string) {
  const now = Date.now();
  setState((s) => {
    if (id) return { ...s, notes: s.notes.map((n) => (n.id === id ? { ...n, text, updated: now } : n)) };
    const note: Note = { id: `n-${now}`, concept, text, t: now, updated: now };
    return { ...s, notes: [note, ...s.notes] };
  });
}

export function deleteNote(id: string) {
  setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
}

export function tryFormula(id: string) {
  setState((s) => (s.formulasTried.includes(id) ? s : { ...s, formulasTried: [...s.formulasTried, id] }));
  checkAchievements();
}

export function resolveMistake(id: string) {
  setState((s) => ({ ...s, mistakes: s.mistakes.map((m) => (m.id === id ? { ...m, resolved: true } : m)) }));
}

/* ---------------- Settings & data ---------------- */

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function setName(name: string) {
  setState((s) => ({ ...s, name }));
}

export function exportData(): string {
  const s = getState();
  return JSON.stringify({ ...s, settings: { ...s.settings, aiKey: '' } }, null, 2);
}

export function importData(json: string): { ok: boolean; message: string } {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || !('attempts' in parsed)) return { ok: false, message: 'That file doesn\'t look like a Stat Lab backup.' };
    const keepKey = getState().settings.aiKey;
    const next = hydrate(parsed);
    next.settings.aiKey = next.settings.aiKey || keepKey;
    replaceState(next);
    return { ok: true, message: 'Progress restored.' };
  } catch {
    return { ok: false, message: 'Could not read that file (invalid JSON).' };
  }
}

export function resetAll() {
  const keep = getState().settings;
  replaceState({ ...defaultState(), settings: keep });
}
