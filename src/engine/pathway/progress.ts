import type { ConceptId, LearnerState } from '../types';
import { masteryInfo } from '../learner';
import { dueReviews } from '../planner';
import { CONCEPT_BY_ID } from '../../content/concepts';
import type { BuiltRegion, EncounterNode, LevelNode, Pathway, PathNode } from './types';

export type NodeState = 'locked' | 'available' | 'in-progress' | 'completed' | 'mastered';

/** Minimum average mastery of a region's concepts before the next region opens (the "mastery wall"). */
export const WALL_THRESHOLD = 0.5;
export const MINI_PASS = 0.6;
export const BOSS_PASS = 0.7;

type MainNode = Pathway['main'][number];

export function nodeDone(s: LearnerState, n: PathNode): boolean {
  if (n.kind === 'level') return !!s.pathway.levels[n.id]?.completedAt;
  if (n.kind === 'encounter') return !!s.pathway.encounters[n.id];
  return !!s.pathway.battles[n.id]?.passed;
}

export function regionMastery(s: LearnerState, r: BuiltRegion, now = Date.now()) {
  if (!r.concepts.length) return 0;
  return r.concepts.reduce((a, c) => a + masteryInfo(s, c, now).overall, 0) / r.concepts.length;
}

export interface WallStatus {
  ok: boolean;
  requirements: { label: string; met: boolean }[];
  mastery: number;
  weakest: ConceptId[];
}

/** What it takes to leave a region: every level, every mini-boss, the boss, and a minimum mastery level. */
export function wallStatus(s: LearnerState, r: BuiltRegion, now = Date.now()): WallStatus {
  const levels = r.main.filter((n) => n.kind === 'level');
  const minis = r.main.filter((n) => n.kind === 'mini-boss');
  const boss = r.main.find((n) => n.kind === 'boss');
  const mastery = regionMastery(s, r, now);
  const requirements = [
    { label: `Complete all ${levels.length} levels`, met: levels.every((n) => nodeDone(s, n)) },
    ...(minis.length ? [{ label: `Pass ${minis.length === 1 ? 'the mini-boss' : `all ${minis.length} mini-bosses`}`, met: minis.every((n) => nodeDone(s, n)) }] : []),
    { label: `Defeat ${boss?.title ?? 'the boss'}`, met: !!boss && nodeDone(s, boss) },
    { label: `Reach ${Math.round(WALL_THRESHOLD * 100)}% region mastery (now ${Math.round(mastery * 100)}%)`, met: mastery >= WALL_THRESHOLD },
  ];
  const weakest = r.concepts.map((c) => ({ c, m: masteryInfo(s, c, now).overall })).sort((a, b) => a.m - b.m).slice(0, 3).map((x) => x.c);
  return { ok: requirements.every((q) => q.met), requirements, mastery, weakest };
}

export interface PathwayView {
  states: Record<string, NodeState>;
  current: MainNode | null;
  /** Region whose mastery wall is currently holding the journey back (all content done, mastery too low). */
  wall: { region: BuiltRegion; status: WallStatus } | null;
  /** Walls that check out now but aren't recorded yet — persist them so later decay can't re-lock the road. */
  newlyPassed: string[];
}

function allMastered(s: LearnerState, concepts: ConceptId[], now: number) {
  return concepts.length > 0 && concepts.every((c) => masteryInfo(s, c, now).mastered);
}

/** Node states along the path. Exactly one main-path node is "current"; everything after it is locked but visible. */
export function computeView(s: LearnerState, p: Pathway, now = Date.now()): PathwayView {
  const states: Record<string, NodeState> = {};
  let current: MainNode | null = null;
  let wall: PathwayView['wall'] = null;
  const newlyPassed: string[] = [];
  const passed = s.pathway.wallsPassed ?? [];
  let open = true;
  let prevRegion = -1;
  for (const n of p.main) {
    if (n.regionIndex !== prevRegion) {
      const before = p.regions[prevRegion];
      // A wall is checked until it's crossed once; progress already made beyond it also counts as crossed.
      const crossed = before && (passed.includes(before.spec.id) || p.regions[n.regionIndex].main.some((m) => nodeDone(s, m)));
      if (before && open && !crossed) {
        const status = wallStatus(s, before, now);
        if (!status.ok) { open = false; wall = { region: before, status }; }
        else newlyPassed.push(before.spec.id);
      }
      prevRegion = n.regionIndex;
    }
    if (nodeDone(s, n)) {
      states[n.id] = n.kind === 'level' && allMastered(s, n.concepts, now) ? 'mastered' : 'completed';
      continue;
    }
    if (!open) { states[n.id] = 'locked'; continue; }
    states[n.id] = n.kind === 'level' && (s.pathway.levels[n.id]?.step ?? 0) > 0 ? 'in-progress' : 'available';
    current = n;
    open = false;
  }
  for (const r of p.regions) {
    for (const e of r.encounters) {
      const anchor = p.nodes[e.afterNode];
      states[e.id] = s.pathway.encounters[e.id] ? 'completed' : anchor && nodeDone(s, anchor) ? 'available' : 'locked';
    }
  }
  return { states, current, wall, newlyPassed };
}

/** Nodes you may open: anything not locked (completed nodes stay replayable). */
export function canOpen(view: PathwayView, n: PathNode) {
  return view.states[n.id] !== 'locked';
}

export interface JourneyStats {
  levelsDone: number;
  levelCount: number;
  regionsDone: number;
  regionCount: number;
  bossesDefeated: number;
  bossCount: number;
  minisDone: number;
  miniCount: number;
  stars: number;
  maxStars: number;
  pct: number; // share of main-path nodes completed
  encountersDone: number;
  encounterCount: number;
}

export function journeyStats(s: LearnerState, p: Pathway): JourneyStats {
  const levels = p.main.filter((n): n is LevelNode => n.kind === 'level');
  const minis = p.main.filter((n) => n.kind === 'mini-boss');
  const bosses = p.main.filter((n) => n.kind === 'boss');
  const encounters = p.regions.flatMap((r) => r.encounters);
  const regionsDone = p.regions.filter((r) => r.main.every((n) => nodeDone(s, n))).length;
  const done = p.main.filter((n) => nodeDone(s, n)).length;
  return {
    levelsDone: levels.filter((n) => nodeDone(s, n)).length, levelCount: levels.length,
    regionsDone, regionCount: p.regions.length,
    bossesDefeated: bosses.filter((n) => nodeDone(s, n)).length, bossCount: bosses.length,
    minisDone: minis.filter((n) => nodeDone(s, n)).length, miniCount: minis.length,
    stars: levels.reduce((a, n) => a + (s.pathway.levels[n.id]?.stars ?? 0), 0), maxStars: levels.length * 3,
    pct: p.main.length ? done / p.main.length : 0,
    encountersDone: encounters.filter((e) => nodeDone(s, e)).length, encounterCount: encounters.length,
  };
}

/* ---------------- Stars ---------------- */

export interface LevelPerformance {
  graded: number; // number of graded items
  score: number; // sum of item scores (0..1 each), first attempt only
  hints: number;
}

/**
 * Stars reflect real performance on the FIRST attempt at each item of this play:
 * ★ completed · ★★ ≥70% with at most 2 hints · ★★★ ≥90% with no hints.
 * Replays generate fresh questions, so stars can't be farmed by memorizing answers.
 */
export function starsFor(p: LevelPerformance): 1 | 2 | 3 {
  if (!p.graded) return 1;
  const acc = p.score / p.graded;
  if (acc >= 0.9 && p.hints === 0) return 3;
  if (acc >= 0.7 && p.hints <= 2) return 2;
  return 1;
}

/** XP for finishing a level: full reward once; replays only pay for newly earned stars. */
export function levelXp(prevStars: number, firstTime: boolean, stars: number) {
  if (firstTime) return 20 + 10 * stars;
  return Math.max(0, stars - prevStars) * 10;
}

/* ---------------- Reviews & recommendations ---------------- */

/** Spaced-repetition reviews due, pinned beside the most recent completed level that taught each concept. */
export function reviewMarkers(s: LearnerState, p: Pathway, now = Date.now()): Record<string, ConceptId[]> {
  const out: Record<string, ConceptId[]> = {};
  for (const c of dueReviews(s, now)) {
    const host = [...p.main].reverse().find((n) => n.kind === 'level' && n.concepts.includes(c) && nodeDone(s, n));
    if (host) (out[host.id] ??= []).push(c);
  }
  return out;
}

/**
 * After a level, decide whether to detour through a quick review first.
 * Triggers when a concept went badly in this level (<60%) or the mastery engine flags it as weak —
 * unless it was reviewed in the last few hours (never nag in a loop).
 */
export function recommendAfterLevel(s: LearnerState, perConcept: Partial<Record<ConceptId, { score: number; n: number }>>, now = Date.now()): { concept: ConceptId; reason: string } | null {
  const candidates = (Object.entries(perConcept) as [ConceptId, { score: number; n: number }][])
    .filter(([, v]) => v.n >= 1)
    .map(([c, v]) => ({ c, acc: v.score / v.n, info: masteryInfo(s, c, now) }))
    .filter((x) => now - (s.pathway.quickReviews[x.c] ?? 0) > 4 * 3600_000)
    .filter((x) => x.acc < 0.6 || x.info.status === 'weak')
    .sort((a, b) => a.acc - b.acc);
  const top = candidates[0];
  if (!top) return null;
  const title = CONCEPT_BY_ID[top.c].title;
  return { concept: top.c, reason: top.acc < 0.6 ? `You got ${Math.round(top.acc * 100)}% on ${title} in this level.` : `${title} is showing up as a weak spot in your mastery profile.` };
}

export function encounterAvailable(view: PathwayView, e: EncounterNode) {
  return view.states[e.id] === 'available';
}

export function regionOf(p: Pathway, n: PathNode) {
  return p.regions[n.regionIndex];
}

/** Index of the first region that isn't finished (the "current destination"). */
export function currentRegionIndex(s: LearnerState, p: Pathway) {
  const i = p.regions.findIndex((r) => !r.main.every((n) => nodeDone(s, n)));
  return i < 0 ? p.regions.length - 1 : i;
}
