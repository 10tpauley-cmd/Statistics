import type { Attempt, ConceptId, ConceptState, Dimension, DimState, LearnerState, MistakeEntry, Question, QType, StudyMode } from './types';
import { DIMENSIONS } from './types';
import { CONCEPT_BY_ID, CONCEPTS } from '../content/concepts';
import { retention, reviewSrs, startSrs, isDue, DAY } from './srs';
import { hintCredit } from './grading';

/* ---------------- Constants ---------------- */

export const DIM_WEIGHTS: Record<Dimension, number> = { recognize: 0.15, calculate: 0.25, interpret: 0.25, apply: 0.2, explain: 0.15 };
export const EVIDENCE_NEEDED = 3; // weighted pieces of evidence for full credit in a dimension
export const MASTERY_THRESHOLD = 0.85;
export const DIM_THRESHOLD = 0.7;
const MAX_ATTEMPTS_KEPT = 4000;

export type Status = 'new' | 'learning' | 'weak' | 'needs-review' | 'mastered';

export interface MasteryInfo {
  overall: number; // effective (after forgetting)
  raw: number;
  dims: Record<Dimension, number>;
  applicable: Dimension[];
  status: Status;
  mastered: boolean;
  missing: string[];
  retention: number;
  level: number;
  accuracy: number | null;
  attempts: number;
}

export type LearnerEvent =
  | { kind: 'xp'; amount: number; reason: string }
  | { kind: 'level-up'; level: number }
  | { kind: 'mastered'; concept: ConceptId }
  | { kind: 'concept-level'; concept: ConceptId; level: number; dir: 'up' | 'down' }
  | { kind: 'achievement'; id: string };

/* ---------------- Construction ---------------- */

function emptyDim(): DimState {
  return { score: 0, evidence: 0, last: 0 };
}

export function emptyConceptState(): ConceptState {
  return {
    dims: { recognize: emptyDim(), calculate: emptyDim(), interpret: emptyDim(), apply: emptyDim(), explain: emptyDim() },
    level: 1,
    upStreak: 0,
    downStreak: 0,
    attempts: 0,
    correct: 0,
    hints: 0,
    timeMs: 0,
    noHintHighLevel: 0,
    lastPracticed: 0,
    srs: null,
  };
}

export function cs(state: LearnerState, id: ConceptId): ConceptState {
  return state.concepts[id] ?? emptyConceptState();
}

/* ---------------- Mastery ---------------- */

export function dimValue(d: DimState) {
  return d.score * Math.min(1, d.evidence / EVIDENCE_NEEDED);
}

export function masteryInfo(state: LearnerState, id: ConceptId, now = Date.now()): MasteryInfo {
  const c = cs(state, id);
  const concept = CONCEPT_BY_ID[id];
  const applicable = concept.dims;
  const dims = Object.fromEntries(DIMENSIONS.map((d) => [d, dimValue(c.dims[d])])) as Record<Dimension, number>;
  const wsum = applicable.reduce((a, d) => a + DIM_WEIGHTS[d], 0);
  const raw = applicable.reduce((a, d) => a + DIM_WEIGHTS[d] * dims[d], 0) / wsum;
  const ret = c.srs ? retention(c.srs, now) : 1;
  const overall = raw * ret;
  const missing: string[] = [];
  for (const d of applicable) {
    if (dims[d] < DIM_THRESHOLD) missing.push(MISSING_TEXT[d]);
  }
  if (c.noHintHighLevel < 1) missing.push('Solve a level 5+ problem without hints');
  const mastered = overall >= MASTERY_THRESHOLD && missing.length === 0;
  const recent = state.attempts.filter((a) => a.concept === id).slice(-8);
  const accuracy = recent.length ? recent.reduce((a, t) => a + (t.correct ? 1 : t.partial ?? 0), 0) / recent.length : null;
  let status: Status;
  const lesson = state.lessons[id];
  if (c.attempts === 0 && !lesson?.completed && !(c.dims.explain.evidence > 0)) status = 'new';
  else if (mastered) status = 'mastered';
  else if (isDue(c.srs, now)) status = 'needs-review';
  else if (c.attempts >= 4 && (overall < 0.45 || (accuracy !== null && accuracy < 0.5))) status = 'weak';
  else status = 'learning';
  return { overall, raw, dims, applicable, status, mastered, missing, retention: ret, level: c.level, accuracy, attempts: c.attempts };
}

const MISSING_TEXT: Record<Dimension, string> = {
  recognize: 'Recognize it (identification questions)',
  calculate: 'Calculate it accurately',
  interpret: 'Interpret what results mean',
  apply: 'Apply it to new real-world situations',
  explain: 'Explain it in your own words (Teach It / free response)',
};

export function overallMastery(state: LearnerState, now = Date.now()) {
  const vals = CONCEPTS.map((c) => masteryInfo(state, c.id, now).overall * c.importance);
  const w = CONCEPTS.reduce((a, c) => a + c.importance, 0);
  return vals.reduce((a, b) => a + b, 0) / w;
}

export function unitMastery(state: LearnerState, unit: string, now = Date.now()) {
  const list = CONCEPTS.filter((c) => c.unit === unit);
  return list.reduce((a, c) => a + masteryInfo(state, c.id, now).overall, 0) / list.length;
}

/* ---------------- Recording evidence ---------------- */

export interface AttemptInput {
  question: Pick<Question, 'id' | 'generatorId' | 'concept' | 'level' | 'type' | 'dims' | 'hints' | 'prompt'>;
  correct: boolean;
  partial?: number; // 0..1 (free response / close answers)
  hintsUsed: number;
  ms: number;
  mode: StudyMode;
  misconception?: string;
  yourAnswer?: string;
  correctAnswer?: string;
  why?: string;
  dimsOverride?: Dimension[];
  now?: number;
}

export function dayKey(t: number) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function levelWeight(level: number) {
  return 0.6 + 0.12 * (Math.max(1, Math.min(7, level)) - 1);
}

/** Diminishing returns for repeated generators / identical questions (STEP 33). */
export function noveltyWeight(state: LearnerState, qid: string, gen: string, now: number) {
  const recent = state.attempts.filter((a) => now - a.t < DAY);
  if (state.attempts.some((a) => a.qid === qid)) return 0.1;
  const sameGen = recent.filter((a) => a.gen === gen).length;
  return 1 / (1 + 0.6 * sameGen);
}

export function recordAttempt(state: LearnerState, input: AttemptInput): { state: LearnerState; events: LearnerEvent[] } {
  const now = input.now ?? Date.now();
  const q = input.question;
  const id = q.concept;
  const concept = CONCEPT_BY_ID[id];
  const events: LearnerEvent[] = [];
  const before = masteryInfo(state, id, now);
  const prevC = cs(state, id);
  const c: ConceptState = structuredClone(prevC);

  const credit = hintCredit(input.hintsUsed, q.hints.length);
  const outcome = input.correct ? credit : Math.max(0, Math.min(1, input.partial ?? 0)) * 0.8;
  const w = levelWeight(q.level) * noveltyWeight(state, q.id, q.generatorId, now);
  const dims = (input.dimsOverride ?? q.dims).filter((d) => concept.dims.includes(d));
  for (const d of dims) {
    const ds = c.dims[d];
    const alpha = Math.min(0.6, 0.35 * w);
    // Placement evidence starts low; first real evidence moves the score quickly.
    ds.score = ds.evidence === 0 ? outcome * Math.min(1, w) : ds.score + alpha * (outcome - ds.score);
    ds.evidence += w;
    ds.last = now;
  }

  c.attempts += 1;
  if (input.correct) c.correct += 1;
  c.hints += input.hintsUsed;
  c.timeMs += input.ms;
  c.lastPracticed = now;
  if (input.correct && input.hintsUsed === 0 && q.level >= 5) c.noHintHighLevel += 1;

  // Adaptive difficulty (STEP 12)
  if (input.mode !== 'exam' && input.mode !== 'placement' && input.mode !== 'final') {
    if (input.correct && input.hintsUsed === 0) {
      c.upStreak += 1;
      c.downStreak = 0;
    } else if (input.correct) {
      c.upStreak += 0.5;
      c.downStreak = 0;
    } else {
      c.downStreak += 1;
      c.upStreak = 0;
    }
    const need = c.level < 4 ? 2 : 3;
    if (c.upStreak >= need && c.level < 7) {
      c.level += 1;
      c.upStreak = 0;
      events.push({ kind: 'concept-level', concept: id, level: c.level, dir: 'up' });
    } else if (c.downStreak >= 2 && c.level > 1) {
      c.level -= 1;
      c.downStreak = 0;
      events.push({ kind: 'concept-level', concept: id, level: c.level, dir: 'down' });
    }
  }

  // Spaced repetition (STEP 10)
  if (!c.srs) {
    if (input.correct) c.srs = startSrs(now);
  } else if (isDue(c.srs, now)) {
    c.srs = reviewSrs(c.srs, outcome, now);
  } else if (!input.correct && c.srs.step >= 2) {
    c.srs = { ...c.srs, due: Math.min(c.srs.due, now + DAY) };
  }

  const attempt: Attempt = {
    t: now, qid: q.id, gen: q.generatorId, concept: id, level: q.level, type: q.type,
    correct: input.correct, partial: input.partial, hints: input.hintsUsed, ms: input.ms, mode: input.mode, misconception: input.misconception,
  };

  let mistakes = state.mistakes;
  if (!input.correct && input.mode !== 'placement') {
    const entry: MistakeEntry = {
      id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
      t: now, concept: id, type: q.type, level: q.level, prompt: q.prompt,
      yourAnswer: input.yourAnswer ?? '', correctAnswer: input.correctAnswer ?? '', why: input.why ?? '',
      misconception: input.misconception, resolved: false, qid: q.id, gen: q.generatorId,
    };
    mistakes = [entry, ...mistakes].slice(0, 600);
  } else if (input.correct) {
    // Correctly answering a fresh variant resolves the oldest open mistake from the same generator.
    const idx = mistakes.findIndex((m) => !m.resolved && m.gen === q.generatorId && m.qid !== q.id);
    if (idx >= 0 && (input.mode === 'mistakes' || state.attempts.slice(-30).some((a) => a.gen === q.generatorId && a.correct))) {
      mistakes = mistakes.map((m, i) => (i === idx ? { ...m, resolved: true } : m));
    }
  }

  // XP
  let xp = 0;
  if (input.correct) {
    xp = Math.round(10 * (1 + 0.2 * (q.level - 1)) * credit);
    if (input.hintsUsed === 0 && q.level >= 5) xp += 10;
  } else if ((input.partial ?? 0) > 0) xp = Math.round(4 * (input.partial ?? 0));
  if (input.mode === 'placement') xp = Math.min(xp, 5);

  const next: LearnerState = {
    ...state,
    concepts: { ...state.concepts, [id]: c },
    attempts: [...state.attempts, attempt].slice(-MAX_ATTEMPTS_KEPT),
    mistakes,
  };
  const withXp = addXp(next, xp, 'answer', now, events);
  // Study time comes from the activity heartbeat (addStudyTime), not per-answer durations, to avoid double counting.
  const touched = touchDay(withXp, now, { problems: 1, correct: input.correct ? 1 : 0 });

  const after = masteryInfo(touched, id, now);
  let finalState = touched;
  if (after.mastered && !before.mastered && !prevC.masteredAt) {
    finalState = { ...finalState, concepts: { ...finalState.concepts, [id]: { ...c, masteredAt: now } } };
    events.push({ kind: 'mastered', concept: id });
    finalState = addXp(finalState, 100, 'mastery', now, events);
  }
  return { state: finalState, events };
}

/** Evidence from Teach-It, retrieval challenges, and lesson recall (explain dimension). */
export function recordExplanation(state: LearnerState, id: ConceptId, score: number, mode: StudyMode, now = Date.now()) {
  const c = structuredClone(cs(state, id));
  const d = c.dims.explain;
  const w = mode === 'teach' ? 1.3 : 0.7;
  d.score = d.evidence === 0 ? score * Math.min(1, w) : d.score + Math.min(0.6, 0.4 * w) * (score - d.score);
  d.evidence += w;
  d.last = now;
  if (mode === 'teach' && score >= 0.6) {
    const i = c.dims.interpret;
    i.score = i.evidence === 0 ? score * 0.6 : i.score + 0.15 * (score - i.score);
    i.evidence += 0.4;
  }
  c.lastPracticed = now;
  return touchDay({ ...state, concepts: { ...state.concepts, [id]: c } }, now, {});
}

/** Placement results seed initial evidence with low weight (never mastery on their own). */
export function seedFromPlacement(state: LearnerState, results: { concept: ConceptId; correct: boolean; level: number }[], now = Date.now()) {
  const concepts = { ...state.concepts };
  const byConcept = new Map<ConceptId, { c: number; n: number }>();
  results.forEach((r) => {
    const cur = byConcept.get(r.concept) ?? { c: 0, n: 0 };
    byConcept.set(r.concept, { c: cur.c + (r.correct ? 1 : 0), n: cur.n + 1 });
  });
  byConcept.forEach((v, id) => {
    const c = structuredClone(cs(state, id));
    const acc = v.c / v.n;
    for (const d of ['recognize', 'calculate', 'apply'] as Dimension[]) {
      if (!CONCEPT_BY_ID[id].dims.includes(d)) continue;
      c.dims[d] = { score: acc * 0.8, evidence: 0.8 * v.n, last: now };
    }
    c.level = acc >= 1 ? 3 : acc > 0 ? 2 : 1;
    c.placement = acc >= 1 ? 'known' : acc > 0 ? 'partial' : 'unknown';
    if (acc >= 0.5) c.srs = { step: 0, due: now + 2 * DAY, last: now, reps: 0, lapses: 0 };
    concepts[id] = c;
  });
  return { ...state, concepts, placement: 'done' as const };
}

/* ---------------- XP, levels, streaks ---------------- */

export function xpForLevel(level: number) {
  return 75 * level * (level - 1);
}

export function levelFromXp(xp: number) {
  let l = 1;
  while (xpForLevel(l + 1) <= xp) l++;
  return l;
}

export function addXp(state: LearnerState, amount: number, reason: string, now: number, events: LearnerEvent[]): LearnerState {
  if (amount <= 0) return state;
  const before = levelFromXp(state.xp);
  const xp = state.xp + amount;
  const after = levelFromXp(xp);
  events.push({ kind: 'xp', amount, reason });
  if (after > before) events.push({ kind: 'level-up', level: after });
  const key = dayKey(now);
  const day = state.daily[key] ?? { ms: 0, problems: 0, correct: 0, xp: 0 };
  return { ...state, xp, daily: { ...state.daily, [key]: { ...day, xp: day.xp + amount } } };
}

export function touchDay(state: LearnerState, now: number, add: { ms?: number; problems?: number; correct?: number }): LearnerState {
  const key = dayKey(now);
  const day = state.daily[key] ?? { ms: 0, problems: 0, correct: 0, xp: 0 };
  const daily = { ...state.daily, [key]: { ...day, ms: day.ms + (add.ms ?? 0), problems: day.problems + (add.problems ?? 0), correct: day.correct + (add.correct ?? 0) } };
  let streak = state.streak;
  if (streak.lastDay !== key) {
    const yesterday = dayKey(now - DAY);
    const current = streak.lastDay === yesterday ? streak.current + 1 : 1;
    streak = { current, best: Math.max(streak.best, current), lastDay: key };
  }
  return { ...state, daily, streak };
}

/** Streak shown to the user: broken if the last study day is before yesterday. */
export function liveStreak(state: LearnerState, now = Date.now()) {
  const k = dayKey(now);
  const y = dayKey(now - DAY);
  return state.streak.lastDay === k || state.streak.lastDay === y ? state.streak.current : 0;
}

/* ---------------- Analytics helpers ---------------- */

export function accuracy(state: LearnerState, filter?: (a: Attempt) => boolean) {
  const list = filter ? state.attempts.filter(filter) : state.attempts;
  if (!list.length) return null;
  return list.reduce((a, t) => a + (t.correct ? 1 : t.partial ?? 0), 0) / list.length;
}

export function typeAccuracy(state: LearnerState) {
  const groups: Partial<Record<QType, { c: number; n: number }>> = {};
  state.attempts.forEach((a) => {
    const g = groups[a.type] ?? { c: 0, n: 0 };
    g.c += a.correct ? 1 : a.partial ?? 0;
    g.n += 1;
    groups[a.type] = g;
  });
  return groups;
}

export function misconceptionCounts(state: LearnerState, onlyOpen = true) {
  const counts: Record<string, number> = {};
  state.mistakes.filter((m) => !onlyOpen || !m.resolved).forEach((m) => {
    if (m.misconception) counts[m.misconception] = (counts[m.misconception] ?? 0) + 1;
  });
  return counts;
}

/** Conceptual vs calculation performance split (STEP 32). */
export function conceptualVsCalc(state: LearnerState) {
  const calcTypes: QType[] = ['calculation', 'multi-step', 'exam'];
  const calc = accuracy(state, (a) => calcTypes.includes(a.type));
  const concept = accuracy(state, (a) => !calcTypes.includes(a.type));
  return { calc, concept };
}
