import { describe, expect, it } from 'vitest';
import { defaultState } from '../src/state/store';
import { PATHWAY } from '../src/content/pathway';
import { miniBossSlots, segmentsFor, reviewSegments, taskCount } from '../src/engine/pathway/build';
import { computeView, journeyStats, starsFor, levelXp, wallStatus, recommendAfterLevel, reviewMarkers, WALL_THRESHOLD } from '../src/engine/pathway/progress';
import { recordAttempt, recordExplanation } from '../src/engine/learner';
import type { LearnerState } from '../src/engine/types';
import { generatorsFor, makeQuestion } from '../src/engine/questions';

const T0 = new Date('2026-09-01T12:00:00').getTime();

function completeThrough(s: LearnerState, upToIndex: number): LearnerState {
  const levels = { ...s.pathway.levels };
  const battles = { ...s.pathway.battles };
  PATHWAY.main.slice(0, upToIndex + 1).forEach((n) => {
    if (n.kind === 'level') levels[n.id] = { stars: 2, best: 0.8, plays: 1, completedAt: T0 };
    else battles[n.id] = { best: 0.9, passed: true, t: T0, plays: 1 };
  });
  return { ...s, pathway: { ...s.pathway, levels, battles } };
}

describe('pathway structure', () => {
  it('places mini-bosses about every 8–10 levels and never right before the boss', () => {
    expect(miniBossSlots(6)).toEqual([]);
    expect(miniBossSlots(16)).toEqual([8]);
    expect(miniBossSlots(24)).toEqual([8, 16]);
    expect(miniBossSlots(31)).toEqual([8, 16, 23]);
    for (const n of [12, 18, 20, 26, 32]) {
      const slots = miniBossSlots(n);
      const gaps = [slots[0], ...slots.slice(1).map((v, i) => v - slots[i]), n - slots[slots.length - 1]];
      gaps.forEach((g) => expect(g).toBeGreaterThanOrEqual(5));
    }
  });

  it('every region ends with its boss and every boss is a multi-phase battle', () => {
    for (const r of PATHWAY.regions) {
      const last = r.main[r.main.length - 1];
      expect(last.kind).toBe('boss');
      if (last.kind === 'boss' && r.main.length > 1) expect(last.phases.length).toBeGreaterThanOrEqual(4);
    }
    PATHWAY.main.filter((n) => n.kind === 'mini-boss').forEach((m) => {
      if (m.kind !== 'mini-boss') return;
      expect(m.phases.length).toBe(3);
      expect(taskCount(m.phases)).toBe(6);
      expect(m.covers.length).toBeGreaterThan(0);
    });
  });

  it('level types produce different shapes (not every level is the same quiz)', () => {
    const shapes = new Set(PATHWAY.main.filter((n) => n.kind === 'level').map((n) => (n.kind === 'level' ? segmentsFor(n).map((x) => x.kind).join('>') : '')));
    expect(shapes.size).toBeGreaterThan(6);
  });

  it('every concept taught by lesson levels completes its lesson exactly once', () => {
    const taught = new Set<string>();
    const finished = new Map<string, number>();
    PATHWAY.main.forEach((n) => {
      if (n.kind !== 'level' || n.type !== 'lesson') return;
      taught.add(n.concepts[0]);
      segmentsFor(n).forEach((x) => { if (x.kind === 'lesson-step' && x.last) finished.set(x.concept, (finished.get(x.concept) ?? 0) + 1); });
    });
    expect(taught.size).toBeGreaterThan(10);
    for (const c of taught) expect(finished.get(c), c).toBe(1);
  });

  it('quick review levels are playable for every concept', () => {
    const segs = reviewSegments('std-dev', 3);
    expect(segs[0].kind).toBe('intro');
    expect(segs.filter((x) => x.kind === 'question').length).toBe(3);
  });
});

describe('pathway progress', () => {
  it('a new learner sees the first level as current and everything else locked but visible', () => {
    const v = computeView(defaultState(T0), PATHWAY, T0);
    expect(v.current?.id).toBe(PATHWAY.main[0].id);
    expect(v.states[PATHWAY.main[0].id]).toBe('available');
    expect(v.states[PATHWAY.main[1].id]).toBe('locked');
    expect(Object.keys(v.states).length).toBeGreaterThanOrEqual(PATHWAY.main.length);
  });

  it('completing a node unlocks exactly the next one; resume point shows in-progress', () => {
    let s = completeThrough(defaultState(T0), 0);
    let v = computeView(s, PATHWAY, T0);
    expect(v.states[PATHWAY.main[0].id]).toBe('completed');
    expect(v.current?.id).toBe(PATHWAY.main[1].id);
    s = { ...s, pathway: { ...s.pathway, levels: { ...s.pathway.levels, [PATHWAY.main[1].id]: { stars: 0, best: 0, plays: 0, step: 3 } } } };
    v = computeView(s, PATHWAY, T0);
    expect(v.states[PATHWAY.main[1].id]).toBe('in-progress');
  });

  it('the mastery wall holds the next region until the region is genuinely mastered', () => {
    const r1 = PATHWAY.regions[0];
    const lastIdx = PATHWAY.main.indexOf(r1.main[r1.main.length - 1]);
    const s = completeThrough(defaultState(T0), lastIdx);
    const v = computeView(s, PATHWAY, T0);
    const firstOfR2 = PATHWAY.regions[1].main[0];
    expect(v.states[firstOfR2.id]).toBe('locked');
    expect(v.wall?.region.spec.id).toBe(r1.spec.id);
    const w = wallStatus(s, r1, T0);
    expect(w.ok).toBe(false);
    expect(w.requirements.find((q) => q.label.includes('mastery'))?.met).toBe(false);
    expect(w.mastery).toBeLessThan(WALL_THRESHOLD);
  });

  it('a crossed mastery wall stays open even if mastery decays later', () => {
    const r1 = PATHWAY.regions[0];
    const lastIdx = PATHWAY.main.indexOf(r1.main[r1.main.length - 1]);
    const firstOfR2 = PATHWAY.regions[1].main[0];
    const s = completeThrough(defaultState(T0), lastIdx);
    // Recorded as passed → no re-check.
    const passed = computeView({ ...s, pathway: { ...s.pathway, wallsPassed: [r1.spec.id] } }, PATHWAY, T0);
    expect(passed.wall).toBeNull();
    expect(passed.current?.id).toBe(firstOfR2.id);
    // Progress already made beyond the wall also counts as crossed (older saves).
    const beyond = computeView(completeThrough(defaultState(T0), lastIdx + 1), PATHWAY, T0);
    expect(beyond.wall).toBeNull();
    expect(beyond.current?.id).toBe(PATHWAY.regions[1].main[1].id);
    // A wall that is still holding isn't reported as newly passed.
    expect(computeView(s, PATHWAY, T0).newlyPassed).toEqual([]);
  });

  it('stars are tied to first-try accuracy and hints', () => {
    expect(starsFor({ graded: 0, score: 0, hints: 0 })).toBe(1);
    expect(starsFor({ graded: 5, score: 5, hints: 0 })).toBe(3);
    expect(starsFor({ graded: 5, score: 5, hints: 1 })).toBe(2);
    expect(starsFor({ graded: 5, score: 4, hints: 0 })).toBe(2);
    expect(starsFor({ graded: 5, score: 3, hints: 0 })).toBe(1);
    expect(starsFor({ graded: 5, score: 4, hints: 3 })).toBe(1);
  });

  it('replays cannot farm XP: only newly earned stars pay', () => {
    expect(levelXp(0, true, 2)).toBe(40);
    expect(levelXp(2, false, 2)).toBe(0);
    expect(levelXp(2, false, 1)).toBe(0);
    expect(levelXp(2, false, 3)).toBe(10);
  });

  it('journey stats count levels, bosses and stars', () => {
    const s = completeThrough(defaultState(T0), 2);
    const st = journeyStats(s, PATHWAY);
    expect(st.levelCount).toBe(PATHWAY.levelCount);
    expect(st.levelsDone).toBeGreaterThanOrEqual(2);
    expect(st.pct).toBeGreaterThan(0);
  });

  it('recommends a quick review after a rough level, but not twice in a row', () => {
    let s = defaultState(T0);
    expect(recommendAfterLevel(s, { center: { score: 3, n: 3 } }, T0)).toBeNull();
    const rec = recommendAfterLevel(s, { center: { score: 3, n: 3 }, 'std-dev': { score: 0.5, n: 2 } }, T0);
    expect(rec?.concept).toBe('std-dev');
    s = { ...s, pathway: { ...s.pathway, quickReviews: { 'std-dev': T0 - 1000 } } };
    expect(recommendAfterLevel(s, { 'std-dev': { score: 0.5, n: 2 } }, T0)).toBeNull();
  });

  it('due spaced reviews appear as markers beside the level that taught them', () => {
    let s = completeThrough(defaultState(T0), 3);
    const lvl = PATHWAY.main.slice(0, 4).find((n) => n.kind === 'level')!;
    const c = lvl.concepts[0];
    const g = generatorsFor(c)[0];
    s = recordAttempt(s, { question: makeQuestion(g, g.levels[0], 1), correct: true, hintsUsed: 0, ms: 1000, mode: 'practice', now: T0 }).state;
    s = recordExplanation(s, c, 0.9, 'teach', T0);
    const markers = reviewMarkers(s, PATHWAY, T0 + 3 * 86400000);
    expect(Object.values(markers).flat()).toContain(c);
  });
});
