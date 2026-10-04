import { describe, expect, it } from 'vitest';
import { defaultState } from '../src/state/store';
import { masteryInfo, recordAttempt, recordExplanation, levelFromXp, xpForLevel, noveltyWeight } from '../src/engine/learner';
import { reviewSrs, startSrs, DAY, REVIEW_LADDER, retention } from '../src/engine/srs';
import { todayPlan, nextLessonConcept, dueReviews } from '../src/engine/planner';
import { buildExam, buildPlacement, scopeConcepts, PLACEMENT_CONCEPTS } from '../src/engine/exam';
import { evaluateOffline } from '../src/engine/frq';
import { CONCEPT_BY_ID } from '../src/content/concepts';
import { generatorsFor, makeQuestion } from '../src/engine/questions';
import type { LearnerState, Question } from '../src/engine/types';

const T0 = new Date('2026-09-01T12:00:00').getTime();

function answer(s: LearnerState, q: Question, correct: boolean, opts: { hints?: number; now?: number; mode?: 'practice' | 'review' } = {}) {
  return recordAttempt(s, { question: q, correct, hintsUsed: opts.hints ?? 0, ms: 20000, mode: opts.mode ?? 'practice', now: opts.now ?? T0 }).state;
}

describe('no fake mastery', () => {
  it('many correct recognition answers alone never produce mastery', () => {
    let s = defaultState(T0);
    const g = generatorsFor('center').find((x) => x.type === 'recognition' || x.type === 'conceptual')!;
    for (let i = 0; i < 40; i++) s = answer(s, makeQuestion(g, g.levels[0], 1000 + i), true, { now: T0 + i * 60000 });
    const m = masteryInfo(s, 'center', T0 + DAY / 2);
    expect(m.mastered).toBe(false);
    expect(m.missing.length).toBeGreaterThan(0);
  });

  it('mastery requires evidence across dimensions plus an independent high-level solve and explanation', () => {
    let s = defaultState(T0);
    let t = T0;
    const gens = generatorsFor('std-dev').filter((g) => g.type !== 'free-response');
    for (let round = 0; round < 12; round++) {
      for (const g of gens) {
        const lvl = g.levels[g.levels.length - 1];
        s = answer(s, makeQuestion(g, lvl, 50000 + round * 31 + lvl), true, { now: (t += 3 * 3600_000) });
      }
    }
    // still missing explanation evidence (std-dev includes "explain")
    expect(masteryInfo(s, 'std-dev', t).dims.explain).toBeLessThan(0.7);
    for (let i = 0; i < 4; i++) s = recordExplanation(s, 'std-dev', 0.95, 'teach', (t += 3600_000));
    const m = masteryInfo(s, 'std-dev', t);
    expect(m.mastered).toBe(true);
  });
});

describe('diminishing returns and adaptivity', () => {
  it('repeating the identical question is worth almost nothing', () => {
    let s = defaultState(T0);
    const g = generatorsFor('center')[0];
    const q = makeQuestion(g, 2, 42);
    s = answer(s, q, true);
    expect(noveltyWeight(s, q.id, q.generatorId, T0 + 1000)).toBeCloseTo(0.1);
    const fresh = makeQuestion(g, 2, 43);
    expect(noveltyWeight(s, fresh.id, fresh.generatorId, T0 + 1000)).toBeLessThan(1);
    expect(noveltyWeight(s, fresh.id, fresh.generatorId, T0 + 2 * DAY)).toBe(1);
  });

  it('levels go up after consecutive independent solves and down after misses', () => {
    let s = defaultState(T0);
    const g = generatorsFor('center')[0];
    s = answer(s, makeQuestion(g, 1, 1), true);
    s = answer(s, makeQuestion(g, 1, 2), true);
    expect(s.concepts.center!.level).toBe(2);
    s = answer(s, makeQuestion(g, 2, 3), false);
    s = answer(s, makeQuestion(g, 2, 4), false);
    expect(s.concepts.center!.level).toBe(1);
  });

  it('hints reduce credit', () => {
    const g = generatorsFor('std-dev')[0];
    const a = answer(defaultState(T0), makeQuestion(g, 3, 9), true, { hints: 0 });
    const b = answer(defaultState(T0), makeQuestion(g, 3, 9), true, { hints: 4 });
    expect(a.concepts['std-dev']!.dims.calculate.score).toBeGreaterThan(b.concepts['std-dev']!.dims.calculate.score);
  });

  it('wrong answers create mistake bank entries with misconceptions', () => {
    const g = generatorsFor('std-dev')[0];
    const q = makeQuestion(g, 3, 9);
    const s = recordAttempt(defaultState(T0), { question: q, correct: false, hintsUsed: 0, ms: 1000, mode: 'practice', misconception: 'sd-divide-n', yourAnswer: '2.9', correctAnswer: '3.6', now: T0 }).state;
    expect(s.mistakes).toHaveLength(1);
    expect(s.mistakes[0].misconception).toBe('sd-divide-n');
  });
});

describe('spaced repetition and forgetting', () => {
  it('climbs the ladder on strong reviews and resets on weak ones', () => {
    let srs = startSrs(T0);
    expect(srs.due).toBe(T0 + DAY);
    srs = reviewSrs(srs, 1, T0 + DAY);
    expect(srs.step).toBe(1);
    expect(srs.due).toBe(T0 + DAY + REVIEW_LADDER[1] * DAY);
    srs = reviewSrs(srs, 0.2, T0 + 5 * DAY);
    expect(srs.step).toBe(0);
    expect(srs.lapses).toBe(1);
  });

  it('overdue concepts lose displayed mastery and appear in due reviews', () => {
    let s = defaultState(T0);
    const g = generatorsFor('center')[0];
    s = answer(s, makeQuestion(g, 2, 5), true);
    expect(retention(s.concepts.center!.srs, T0 + 30 * DAY)).toBeLessThan(1);
    expect(dueReviews(s, T0 + 2 * DAY)).toContain('center');
  });
});

describe('planner, exams, placement', () => {
  it('plans placement and the first lesson for a new learner', () => {
    const plan = todayPlan(defaultState(T0), T0);
    expect(plan[0].kind).toBe('placement');
    expect(plan.some((p) => p.kind === 'learn')).toBe(true);
    expect(nextLessonConcept(defaultState(T0))).toBe('pop-sample');
  });

  it('builds exams that stay in scope and cover many concepts', () => {
    const qs = buildExam('exam1', 20, 777);
    expect(qs).toHaveLength(20);
    const scope = scopeConcepts('exam1');
    qs.forEach((q) => expect(scope).toContain(q.concept));
    expect(new Set(qs.map((q) => q.concept)).size).toBeGreaterThanOrEqual(10);
    const fin = buildExam('final', 30, 99);
    expect(fin.some((q) => q.answer.kind === 'text')).toBe(true);
  });

  it('placement covers its concepts with objective questions', () => {
    const qs = buildPlacement(5);
    expect(qs.map((q) => q.concept)).toEqual(PLACEMENT_CONCEPTS);
    qs.forEach((q) => expect(q.answer.kind).not.toBe('text'));
  });
});

describe('offline free-response evaluation', () => {
  it('rewards complete explanations and flags misconceptions', () => {
    const rubric = CONCEPT_BY_ID['std-dev'].teach;
    const good = evaluateOffline(rubric, 'The standard deviation is the typical distance of the data from the mean. You subtract the mean from each value to get deviations, square them because deviations add to zero, divide by n − 1 for a sample, and take the square root to get back to the original units. A smaller SD means more consistent data.');
    expect(good.score).toBeGreaterThanOrEqual(85);
    const weak = evaluateOffline(rubric, 'It is the range of the data.');
    expect(weak.score).toBeLessThan(40);
    expect(weak.misconceptions.length).toBeGreaterThan(0);
  });
});

describe('xp levels', () => {
  it('level thresholds are monotonic', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(xpForLevel(5))).toBe(5);
    expect(levelFromXp(xpForLevel(5) - 1)).toBe(4);
  });
});
