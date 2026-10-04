import { useSyncExternalStore } from 'react';

/** Transient UI state (not persisted with learner data). */
export interface UiState {
  focus: boolean;
  focusStart: number;
  focusMinutes: number;
  sidebarOpen: boolean;
  searchOpen: boolean;
}

let ui: UiState = { focus: false, focusStart: 0, focusMinutes: 25, sidebarOpen: false, searchOpen: false };
const ls = new Set<() => void>();

export function setUi(patch: Partial<UiState>) {
  ui = { ...ui, ...patch };
  ls.forEach((l) => l());
}

export function getUi() {
  return ui;
}

export function useUi() {
  return useSyncExternalStore((l) => (ls.add(l), () => ls.delete(l)), getUi, getUi);
}

export function toggleFocus(on = !ui.focus) {
  setUi({ focus: on, focusStart: on ? Date.now() : 0, sidebarOpen: false });
}
