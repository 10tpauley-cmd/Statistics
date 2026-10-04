import type { ConceptId, LearnerState } from './types';
import { CONCEPTS, CONCEPT_BY_ID } from '../content/concepts';
import { UNITS } from '../content/units';
import { cs, masteryInfo } from './learner';
import { overdueRatio } from './srs';

export interface PlanItem {
  id: string;
  kind: 'placement' | 'review' | 'mistakes' | 'learn' | 'practice' | 'mixed' | 'teach' | 'recall' | 'boss' | 'method';
  title: string;
  detail: string;
  minutes: number;
  concept?: ConceptId;
  concepts?: ConceptId[];
  route: string;
  reason: string;
}

export function startedConcepts(state: LearnerState) {
  return CONCEPTS.filter((c) => cs(state, c.id).attempts > 0 || state.lessons[c.id]?.completed);
}

export function nextLessonConcept(state: LearnerState): ConceptId | null {
  const notDone = CONCEPTS.filter((c) => !state.lessons[c.id]?.completed);
  if (!notDone.length) return null;
  const ready = notDone.find((c) => c.prereqs.every((p) => state.lessons[p]?.completed || masteryInfo(state, p).overall >= 0.4));
  return (ready ?? notDone[0]).id;
}

export function inProgressLesson(state: LearnerState): ConceptId | null {
  const c = CONCEPTS.find((x) => {
    const l = state.lessons[x.id];
    return l && !l.completed && l.step > 0;
  });
  return c?.id ?? null;
}

export function weakConcepts(state: LearnerState, n = 5, now = Date.now()) {
  return startedConcepts(state)
    .map((c) => ({ id: c.id, info: masteryInfo(state, c.id, now) }))
    .filter((x) => !x.info.mastered)
    .sort((a, b) => a.info.overall - b.info.overall)
    .slice(0, n);
}

export function strongConcepts(state: LearnerState, n = 5, now = Date.now()) {
  return startedConcepts(state)
    .map((c) => ({ id: c.id, info: masteryInfo(state, c.id, now) }))
    .filter((x) => x.info.overall > 0.2)
    .sort((a, b) => b.info.overall - a.info.overall)
    .slice(0, n);
}

export function dueReviews(state: LearnerState, now = Date.now()): ConceptId[] {
  return CONCEPTS.filter((c) => {
    const s = cs(state, c.id).srs;
    return s && s.due <= now;
  })
    .sort((a, b) => overdueRatio(cs(state, b.id).srs, now) - overdueRatio(cs(state, a.id).srs, now))
    .map((c) => c.id);
}

export function upcomingReviews(state: LearnerState, now = Date.now(), days = 7) {
  return CONCEPTS.map((c) => ({ id: c.id, due: cs(state, c.id).srs?.due ?? Infinity }))
    .filter((x) => x.due > now && x.due < now + days * 86400000)
    .sort((a, b) => a.due - b.due);
}

export function openMistakes(state: LearnerState) {
  return state.mistakes.filter((m) => !m.resolved);
}

function needsExplain(state: LearnerState, id: ConceptId) {
  const info = masteryInfo(state, id);
  return state.lessons[id]?.completed && info.dims.explain < 0.6;
}

export function unitBossReady(state: LearnerState, unitId: string) {
  const unit = UNITS.find((u) => u.id === unitId)!;
  const ids = unit.sections.flatMap((s) => s.concepts);
  return ids.every((id) => state.lessons[id]?.completed);
}

export function todayPlan(state: LearnerState, now = Date.now()): PlanItem[] {
  const items: PlanItem[] = [];
  const started = startedConcepts(state);
  if (state.placement === 'pending' && started.length === 0) {
    items.push({ id: 'placement', kind: 'placement', title: 'Find my level', detail: '16 quick questions across the course', minutes: 10, route: '/placement', reason: 'So your path starts at the right place.' });
  }
  const due = dueReviews(state, now).slice(0, 4);
  if (due.length) {
    items.push({ id: 'review', kind: 'review', title: `Review ${due.map((d) => CONCEPT_BY_ID[d].title).slice(0, 2).join(' & ')}${due.length > 2 ? ` +${due.length - 2}` : ''}`, detail: 'Spaced-repetition reviews due today', minutes: Math.min(12, 3 * due.length + 2), concepts: due, route: '/review', reason: 'These are due — reviewing now locks them into long-term memory.' });
  }
  const open = openMistakes(state);
  if (open.length >= 2) {
    items.push({ id: 'mistakes', kind: 'mistakes', title: 'Fix recent mistakes', detail: `${open.length} open in your Mistake Bank`, minutes: 6, route: '/practice?mode=mistakes', reason: 'Fresh variants of questions you missed.' });
  }
  const cont = inProgressLesson(state);
  const next = cont ?? nextLessonConcept(state);
  if (next) {
    const c = CONCEPT_BY_ID[next];
    items.push({ id: `learn-${next}`, kind: 'learn', title: `${cont ? 'Continue' : 'Learn'}: ${c.title}`, detail: c.short, minutes: c.minutes, concept: next, route: `/learn/${next}`, reason: cont ? 'Pick up where you left off.' : 'Next step on your path.' });
  }
  const weak = weakConcepts(state, 3, now).filter((w) => !due.includes(w.id) && w.id !== next);
  if (weak.length) {
    const w = weak[0];
    items.push({ id: `practice-${w.id}`, kind: 'practice', title: `Practice: ${CONCEPT_BY_ID[w.id].title}`, detail: `Mastery ${Math.round(w.info.overall * 100)}% — adaptive problems at level ${w.info.level}`, minutes: 8, concept: w.id, route: `/practice?concept=${w.id}`, reason: 'Your weakest started topic.' });
  }
  if (started.length >= 3) {
    items.push({ id: 'mixed', kind: 'mixed', title: 'Mixed review', detail: 'Interleaved problems — you decide which method applies', minutes: 8, route: '/practice?mode=mixed', reason: 'Mixing topics trains method selection.' });
  }
  const explainGap = started.find((c) => needsExplain(state, c.id));
  if (explainGap) {
    items.push({ id: `teach-${explainGap.id}`, kind: 'teach', title: `Teach It: ${explainGap.title}`, detail: 'Explain it in your own words', minutes: 5, concept: explainGap.id, route: `/teach?concept=${explainGap.id}`, reason: 'Explaining is required for mastery.' });
  }
  for (const u of UNITS) {
    if (unitBossReady(state, u.id) && !state.bosses[`boss-${u.id}`]?.cleared) {
      items.push({ id: `boss-${u.id}`, kind: 'boss', title: `Boss: Unit ${u.number}`, detail: `${u.title} — the culminating challenge`, minutes: 12, route: `/boss/boss-${u.id}`, reason: 'You finished every lesson in this unit.' });
      break;
    }
  }
  // Fit to the daily goal while keeping at least two items.
  const goal = state.settings.dailyGoal;
  const out: PlanItem[] = [];
  let total = 0;
  for (const it of items) {
    if (out.length >= 2 && total + it.minutes > goal + 8) continue;
    out.push(it);
    total += it.minutes;
  }
  return out;
}

export function planMinutes(items: PlanItem[]) {
  return items.reduce((a, b) => a + b.minutes, 0);
}

export function continueTarget(state: LearnerState) {
  const id = inProgressLesson(state) ?? nextLessonConcept(state);
  if (!id) return null;
  const c = CONCEPT_BY_ID[id];
  const step = state.lessons[id]?.step ?? 0;
  return { id, concept: c, step, total: c.lesson.length, minutesLeft: Math.max(2, Math.round(c.minutes * (1 - step / c.lesson.length))) };
}

/** Choose concepts for interleaved (mixed) practice: started concepts, weighted to weak/overdue ones. */
export function mixedPool(state: LearnerState, now = Date.now()): ConceptId[] {
  const started = startedConcepts(state).map((c) => c.id);
  if (started.length < 2) return CONCEPTS.slice(0, 6).map((c) => c.id);
  const weights = started.map((id) => {
    const info = masteryInfo(state, id, now);
    return { id, w: 1 + (1 - info.overall) * 2 + (info.status === 'needs-review' ? 1.5 : 0) };
  });
  return weights.sort((a, b) => b.w - a.w).map((x) => x.id);
}
