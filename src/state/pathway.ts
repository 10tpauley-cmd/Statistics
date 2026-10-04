import type { ConceptId, LearnerState, PathwayLevelRecord } from '../engine/types';
import { addXp, dayKey, touchDay, type LearnerEvent } from '../engine/learner';
import { levelXp } from '../engine/pathway/progress';
import { emit, getState, setState } from './store';
import { recordBoss, announceEvents, checkAchievementsNow } from './actions';

function patch(s: LearnerState, fn: (p: LearnerState['pathway']) => Partial<LearnerState['pathway']>): LearnerState {
  return { ...s, pathway: { ...s.pathway, ...fn(s.pathway) } };
}

/** Remember where you are inside a level so leaving and coming back resumes there. */
export function savePathwayStep(levelId: string, step: number) {
  setState((s) => {
    const cur: PathwayLevelRecord = s.pathway.levels[levelId] ?? { stars: 0, best: 0, plays: 0 };
    if (cur.step === step) return s;
    return patch(s, (p) => ({ levels: { ...p.levels, [levelId]: { ...cur, step } } }));
  });
}

export interface LevelCompletion {
  xp: number;
  firstTime: boolean;
  stars: number;
  prevStars: number;
}

/** Finish a level. XP is paid in full once; replays only earn XP for newly reached stars (no farming). */
export function completePathwayLevel(levelId: string, stars: number, accuracy: number): LevelCompletion {
  const now = Date.now();
  const prev = getState().pathway.levels[levelId];
  const firstTime = !prev?.completedAt;
  const prevStars = prev?.stars ?? 0;
  const xp = levelXp(prevStars, firstTime, stars);
  let ev: LearnerEvent[] = [];
  setState((s) => {
    const cur: PathwayLevelRecord = s.pathway.levels[levelId] ?? { stars: 0, best: 0, plays: 0 };
    const rec: PathwayLevelRecord = { stars: Math.max(cur.stars, stars), best: Math.max(cur.best, accuracy), plays: cur.plays + 1, completedAt: cur.completedAt ?? now, step: 0 };
    ev = [];
    const next = addXp(patch(s, (p) => ({ levels: { ...p.levels, [levelId]: rec } })), xp, 'pathway', now, ev);
    return touchDay(next, now, {});
  });
  announceEvents(ev);
  checkAchievementsNow();
  return { xp, firstTime, stars, prevStars };
}

export function completeEncounter(id: string): number {
  if (getState().pathway.encounters[id]) return 0;
  const now = Date.now();
  let ev: LearnerEvent[] = [];
  setState((s) => {
    ev = [];
    return addXp(patch(s, (p) => ({ encounters: { ...p.encounters, [id]: now } })), 15, 'encounter', now, ev);
  });
  announceEvents(ev);
  return 15;
}

export interface BattleOutcome {
  passed: boolean;
  firstClear: boolean;
  xp: number;
  unitBonus: number;
}

/**
 * Record a mini-boss / unit boss / final boss battle. Unit bosses also update the existing boss
 * records (so /boss and the Pathway agree) and pay a one-time unit-completion bonus.
 */
export function recordPathwayBattle(nodeId: string, kind: 'mini-boss' | 'boss', score: number, threshold: number, opts: { bossId?: string; final?: boolean } = {}): BattleOutcome {
  const now = Date.now();
  const prev = getState().pathway.battles[nodeId];
  const passed = score >= threshold;
  const firstClear = passed && !prev?.passed;
  const xp = firstClear ? (kind === 'mini-boss' ? 60 : opts.final ? 500 : 0) : 0;
  const unitBonus = firstClear && kind === 'boss' && !opts.final ? 250 : 0;
  let ev: LearnerEvent[] = [];
  setState((s) => {
    ev = [];
    const b = { best: Math.max(prev?.best ?? 0, score), passed: !!prev?.passed || passed, t: now, plays: (prev?.plays ?? 0) + 1 };
    let next = patch(s, (p) => ({ battles: { ...p.battles, [nodeId]: b }, ...(opts.final && passed && !p.completedAt ? { completedAt: now } : {}) }));
    next = addXp(next, xp + unitBonus, kind === 'mini-boss' ? 'mini-boss' : 'unit-complete', now, ev);
    return touchDay(next, now, {});
  });
  // Existing boss system: records best score, awards its own clear XP and celebration once.
  if (kind === 'boss' && opts.bossId && !opts.final) recordBoss(opts.bossId, score, { quiet: true });
  announceEvents(ev);
  checkAchievementsNow();
  return { passed, firstClear, xp: xp + (kind === 'boss' && !opts.final && firstClear ? 150 : 0), unitBonus };
}

export function markIntroSeen(regionId: string) {
  setState((s) => (s.pathway.introsSeen.includes(regionId) ? s : patch(s, (p) => ({ introsSeen: [...p.introsSeen, regionId] }))));
}

export function markCeremony(id: string) {
  setState((s) => (s.pathway.ceremonies.includes(id) ? s : patch(s, (p) => ({ ceremonies: [...p.ceremonies, id] }))));
}

/** Returns true if this is the first Pathway visit of a new day (for the welcome-back card). */
export function notePathwayVisit(): { newDay: boolean; previous: string } {
  const today = dayKey(Date.now());
  const previous = getState().pathway.lastVisit;
  if (previous !== today) setState((s) => patch(s, () => ({ lastVisit: today })));
  return { newDay: !!previous && previous !== today, previous };
}

export function noteQuickReview(concept: ConceptId) {
  setState((s) => patch(s, (p) => ({ quickReviews: { ...p.quickReviews, [concept]: Date.now() } })));
  emit({ kind: 'toast', tone: 'info', icon: '🔄', title: 'Review complete', body: 'Back to the Pathway.' });
}
