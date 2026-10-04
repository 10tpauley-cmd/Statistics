import { useMemo } from 'react';
import type { ConceptId, LearnerState } from '../engine/types';
import { masteryInfo, type MasteryInfo } from '../engine/learner';
import { CONCEPTS } from '../content/concepts';

/** Mastery for every concept, computed once per learner-state change. */
export function useMasteryMap(s: LearnerState): Record<ConceptId, MasteryInfo> {
  return useMemo(() => {
    const now = Date.now();
    return Object.fromEntries(CONCEPTS.map((c) => [c.id, masteryInfo(s, c.id, now)])) as Record<ConceptId, MasteryInfo>;
  }, [s]);
}

export const STATUS_LABEL: Record<MasteryInfo['status'], { label: string; tone: string }> = {
  new: { label: 'Not started', tone: '' },
  learning: { label: 'Learning', tone: 'info' },
  weak: { label: 'Needs work', tone: 'danger' },
  'needs-review': { label: 'Review due', tone: 'warn' },
  mastered: { label: 'Mastered', tone: 'success' },
};
