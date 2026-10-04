import type { ConceptId, FrqFeedback, TeachRubric } from '../engine/types';
import { evaluateOffline } from '../engine/frq';
import { gradeFreeResponse, AiError } from './ai';
import { CONCEPT_BY_ID } from '../content/concepts';
import { getState } from '../state/store';
import { plain } from '../components/ui/Rich';

export function aiAvailable() {
  const s = getState().settings;
  return s.aiEnabled && s.aiKey.trim().length > 10;
}

export function conceptFacts(id: ConceptId) {
  const c = CONCEPT_BY_ID[id];
  return [
    `Summary: ${c.short}`,
    ...c.know.map((k) => `Know: ${k}`),
    ...c.understand.map((k) => `Understand: ${k}`),
    ...c.interpret.map((k) => `Interpret: ${k}`),
    `Intuition: ${plain(c.why.body)}`,
  ].join('\n');
}

export function sourceText(id: ConceptId) {
  const c = CONCEPT_BY_ID[id];
  return `PDF pp. ${c.source.pages.slice().sort((a, b) => a - b).join(', ')} — ${c.source.section}`;
}

export interface FrqResult {
  feedback: FrqFeedback;
  aiError?: string;
}

/** Grade a free-response answer: Claude when a key is configured, otherwise the offline rubric. */
export async function gradeFrq(args: { concept: ConceptId; prompt: string; context?: string; rubric: TeachRubric; answer: string; mode: 'teach' | 'frq' }): Promise<FrqResult> {
  const offline = evaluateOffline(args.rubric, args.answer);
  if (!aiAvailable()) return { feedback: offline };
  const s = getState().settings;
  try {
    const feedback = await gradeFreeResponse({
      apiKey: s.aiKey.trim(),
      conceptTitle: CONCEPT_BY_ID[args.concept].title,
      conceptSummary: conceptFacts(args.concept),
      source: sourceText(args.concept),
      context: args.context ? plain(args.context) : undefined,
      prompt: plain(args.prompt),
      rubric: args.rubric,
      answer: args.answer,
      mode: args.mode,
    });
    return { feedback };
  } catch (e) {
    return { feedback: offline, aiError: e instanceof AiError ? e.message : 'AI feedback failed; showing offline rubric check.' };
  }
}
