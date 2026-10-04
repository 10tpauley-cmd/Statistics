import type { SrsState } from './types';

/** Review ladder in days (STEP 10): tomorrow → 3 → 7 → 14 → 30 → 60 → 120. */
export const REVIEW_LADDER = [1, 3, 7, 14, 30, 60, 120];
export const DAY = 24 * 60 * 60 * 1000;

export function startSrs(now: number): SrsState {
  return { step: 0, due: now + REVIEW_LADDER[0] * DAY, last: now, reps: 0, lapses: 0 };
}

/**
 * Update after a review of a concept. `quality` 0..1 = performance across the review items
 * (accuracy discounted for hints). Strong → climb the ladder; okay → hold; weak → back to day 1.
 */
export function reviewSrs(s: SrsState | null, quality: number, now: number): SrsState {
  const cur = s ?? startSrs(now);
  let step = cur.step;
  let lapses = cur.lapses;
  if (quality >= 0.85) step = Math.min(step + 1, REVIEW_LADDER.length - 1);
  else if (quality >= 0.6) step = Math.max(step, 0); // hold
  else {
    step = 0;
    lapses += 1;
  }
  return { step, due: now + REVIEW_LADDER[step] * DAY, last: now, reps: cur.reps + 1, lapses };
}

export function isDue(s: SrsState | null | undefined, now: number) {
  return !!s && s.due <= now;
}

/** How overdue (in units of the current interval). 0 if not due. */
export function overdueRatio(s: SrsState | null | undefined, now: number) {
  if (!s || s.due > now) return 0;
  const interval = REVIEW_LADDER[s.step] * DAY;
  return (now - s.due) / interval;
}

/** Retention estimate used to decay displayed mastery when a review is overdue (forgetting). */
export function retention(s: SrsState | null | undefined, now: number) {
  const o = overdueRatio(s, now);
  if (o <= 0) return 1;
  return Math.max(0.55, Math.exp(-0.35 * o));
}
