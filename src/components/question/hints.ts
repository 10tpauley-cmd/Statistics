import type { Question } from '../../engine/types';
import { CONCEPT_BY_ID } from '../../content/concepts';
import { FORMULA_BY_ID } from '../../content/formulas';

export interface HintStep {
  label: string;
  text: string;
}

/**
 * Progressive hints (STEP 15): conceptual clue → relevant formula → values that matter →
 * first step → full walkthrough. Built from the question's own hints plus course formulas.
 */
export function progressiveHints(q: Question): HintStep[] {
  const out: HintStep[] = [];
  const own = q.hints.slice();
  const labels = ['Concept clue', 'What matters', 'First step', 'Next step'];
  if (own.length) out.push({ label: labels[0], text: own.shift()! });
  const concept = CONCEPT_BY_ID[q.concept];
  const fid = concept.formulas.find((id) => FORMULA_BY_ID[id]);
  const isCalc = q.answer.kind === 'numeric' || q.type === 'calculation' || q.type === 'multi-step' || q.type === 'exam';
  if (fid && isCalc && !q.hints.some((h) => h.includes('='))) {
    const fm = FORMULA_BY_ID[fid];
    out.push({ label: 'Formula', text: `${fm.name}: $${fm.latex.replace(/\\dfrac/g, '\\frac').replace(/\\qquad/g, '\\quad')}$` });
  }
  own.forEach((h, i) => out.push({ label: labels[Math.min(i + 1, labels.length - 1)], text: h }));
  out.push({ label: 'Walkthrough', text: q.solution.map((s, i) => `${i + 1}. ${s}`).join('\n') });
  return out.slice(0, 6);
}
