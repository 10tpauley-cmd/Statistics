import { useSyncExternalStore } from 'react';
import type { ConceptId } from '../engine/types';

/** What the learner is looking at right now — shared with the Mu mascot so help is contextual. */
export interface TutorFocus {
  page: string;
  concept?: ConceptId;
  question?: { prompt: string; context?: string; answered: boolean; hintsShown: number; totalHints: number; solution?: string[] };
}

let focus: TutorFocus = { page: 'Dashboard' };
const ls = new Set<() => void>();

export function setTutorFocus(patch: Partial<TutorFocus>) {
  focus = { ...focus, ...patch };
  ls.forEach((l) => l());
}

export function clearQuestionFocus() {
  if (!focus.question) return;
  focus = { ...focus, question: undefined };
  ls.forEach((l) => l());
}

export function getTutorFocus() {
  return focus;
}

export function useTutorFocus() {
  return useSyncExternalStore((l) => (ls.add(l), () => ls.delete(l)), getTutorFocus, getTutorFocus);
}
