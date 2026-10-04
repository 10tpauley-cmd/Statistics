import { useSyncExternalStore } from 'react';
import type { LearnerState, Settings } from '../engine/types';

export const STORAGE_KEY = 'statlab.learner.v1';
export const STATE_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  sound: true,
  reducedMotion: false,
  mascot: true,
  mascotReactions: true,
  aiKey: '',
  aiEnabled: true,
  dailyGoal: 30,
  examDate: '',
  fontScale: 1,
};

export function defaultState(now = Date.now()): LearnerState {
  return {
    version: STATE_VERSION,
    createdAt: now,
    name: '',
    placement: 'pending',
    concepts: {},
    lessons: {},
    attempts: [],
    mistakes: [],
    sessions: [],
    daily: {},
    xp: 0,
    streak: { current: 0, best: 0, lastDay: '' },
    achievements: {},
    bookmarks: [],
    notes: [],
    teach: [],
    exams: [],
    bosses: {},
    formulasTried: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

/** Merge a loaded/imported object with defaults so new fields never crash old saves. */
export function hydrate(raw: unknown): LearnerState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<LearnerState>;
  return {
    ...base,
    ...r,
    version: STATE_VERSION,
    streak: { ...base.streak, ...(r.streak ?? {}) },
    settings: { ...DEFAULT_SETTINGS, ...(r.settings ?? {}) },
    concepts: r.concepts ?? {},
    lessons: r.lessons ?? {},
    attempts: Array.isArray(r.attempts) ? r.attempts : [],
    mistakes: Array.isArray(r.mistakes) ? r.mistakes : [],
    sessions: Array.isArray(r.sessions) ? r.sessions : [],
    bookmarks: Array.isArray(r.bookmarks) ? r.bookmarks : [],
    notes: Array.isArray(r.notes) ? r.notes : [],
    teach: Array.isArray(r.teach) ? r.teach : [],
    exams: Array.isArray(r.exams) ? r.exams : [],
    formulasTried: Array.isArray(r.formulasTried) ? r.formulasTried : [],
    daily: r.daily ?? {},
    achievements: r.achievements ?? {},
    bosses: r.bosses ?? {},
  };
}

let storageOk = true;
function load(): LearnerState {
  try {
    const txt = localStorage.getItem(STORAGE_KEY);
    return txt ? hydrate(JSON.parse(txt)) : defaultState();
  } catch {
    storageOk = false;
    return defaultState();
  }
}

let state: LearnerState = typeof window === 'undefined' ? defaultState() : load();
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

function persist() {
  if (typeof window === 'undefined') return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(flush, 120);
}

export function flush() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageOk = true;
  } catch {
    storageOk = false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
  // Keep multiple tabs in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state = hydrate(JSON.parse(e.newValue));
        listeners.forEach((l) => l());
      } catch {
        /* ignore */
      }
    }
  });
}

export function isStorageAvailable() {
  return storageOk;
}

export function getState() {
  return state;
}

export function setState(updater: (s: LearnerState) => LearnerState) {
  const next = updater(state);
  if (next === state) return;
  state = next;
  persist();
  listeners.forEach((l) => l());
}

export function replaceState(next: LearnerState) {
  state = next;
  flush();
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useLearner(): LearnerState {
  return useSyncExternalStore(subscribe, getState, getState);
}

/* ---------------- App event bus (toasts, celebrations, mascot reactions) ---------------- */

export type AppEvent =
  | { kind: 'toast'; title: string; body?: string; tone?: 'success' | 'info' | 'warn' | 'error'; icon?: string }
  | { kind: 'celebrate'; strength: 'small' | 'big'; title: string; body?: string }
  | { kind: 'mascot'; mood: 'happy' | 'proud' | 'encourage' | 'thinking' | 'wave'; text: string }
  | { kind: 'mascot-open'; prompt?: string }
  | { kind: 'hint-request' }
  | { kind: 'search-open' };

const eventListeners = new Set<(e: AppEvent) => void>();
export function emit(e: AppEvent) {
  eventListeners.forEach((l) => l(e));
}
export function onAppEvent(l: (e: AppEvent) => void) {
  eventListeners.add(l);
  return () => {
    eventListeners.delete(l);
  };
}
