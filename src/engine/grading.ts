import type { AnswerSpec, Question } from './types';
import { parseNumber, fmt } from '../lib/stats/format';
import { MISCONCEPTION_BY_ID } from '../content/misconceptions';

export interface GradeResult {
  correct: boolean;
  score: number; // 0..1
  misconception?: string;
  title: string;
  message: string;
  yourAnswer: string;
  correctAnswer: string;
  close?: boolean;
}

export function correctAnswerText(a: AnswerSpec): string {
  if (a.kind === 'mc') return a.options.filter((o) => o.correct).map((o) => o.text).join(' / ');
  if (a.kind === 'numeric') return `${fmt(a.value, 4)}${a.unit && a.unit !== '%' ? ` ${a.unit}` : a.unit === '%' ? '%' : ''}`;
  return a.rubric.model;
}

function withinTol(v: number, target: number, tol: number) {
  return Math.abs(v - target) <= Math.max(tol, 1e-9);
}

/** Grade an objective answer (mc option id or numeric text). Text answers are graded elsewhere (async). */
export function gradeObjective(answer: AnswerSpec, response: string): GradeResult {
  if (answer.kind === 'mc') {
    const opt = answer.options.find((o) => o.id === response);
    const correctText = correctAnswerText(answer);
    if (!opt) return { correct: false, score: 0, title: 'Choose an answer', message: 'Pick one of the options.', yourAnswer: '', correctAnswer: correctText };
    if (opt.correct) return { correct: true, score: 1, title: '', message: opt.why ?? '', yourAnswer: opt.text, correctAnswer: correctText };
    const mis = opt.misconception ? MISCONCEPTION_BY_ID[opt.misconception] : undefined;
    return {
      correct: false,
      score: 0,
      misconception: opt.misconception,
      title: mis ? `Not quite — ${mis.title.toLowerCase()}` : 'Not quite',
      message: opt.why ?? (mis ? mis.short : ''),
      yourAnswer: opt.text,
      correctAnswer: correctText,
    };
  }
  if (answer.kind === 'numeric') {
    const correctText = correctAnswerText(answer);
    let v = parseNumber(response);
    if (v === null) return { correct: false, score: 0, title: 'That isn\'t a number I can read', message: 'Enter a number like 0.25, 1/4, or 25%.', yourAnswer: response, correctAnswer: correctText };
    const targets = [answer.value, ...(answer.accept ?? [])];
    const typedPct = response.includes('%');
    if (answer.unit === '%') {
      // Expected value is in percent units (e.g. 40.5). Accept "40.5", "40.5%", or "0.405".
      if (typedPct) v = v * 100;
      else if (Math.abs(v) <= 1 && Math.abs(answer.value) > 1) v = v * 100;
    } else if (!typedPct && Math.abs(answer.value) <= 1 && Math.abs(v) > 1 && Math.abs(v) <= 100) {
      // Expected a proportion but the student typed a percent without the % sign.
      if (withinTol(v / 100, answer.value, Math.max(answer.tol, 0.0005))) v = v / 100;
    }
    const tol = Math.max(answer.tol, Math.abs(answer.value) * 0.0005);
    if (targets.some((t) => withinTol(v!, t, tol))) return { correct: true, score: 1, title: '', message: '', yourAnswer: response, correctAnswer: correctText };
    // Specific wrong-answer detectors
    for (const w of answer.wrong ?? []) {
      if (withinTol(v, w.value, w.tol ?? tol)) {
        const mis = w.misconception ? MISCONCEPTION_BY_ID[w.misconception] : undefined;
        return { correct: false, score: 0, misconception: w.misconception, title: mis ? `Not quite — ${mis.title.toLowerCase()}` : 'Not quite', message: w.why, yourAnswer: response, correctAnswer: correctText };
      }
    }
    // Close: likely rounding
    const rel = Math.abs(v - answer.value) / Math.max(Math.abs(answer.value), 1e-9);
    if (rel < 0.03 || Math.abs(v - answer.value) <= tol * 4) {
      return { correct: false, score: 0.5, close: true, misconception: 'arithmetic', title: 'So close — check your rounding', message: 'Your setup looks right, but the value is a little off. Keep more decimals until the final step.', yourAnswer: response, correctAnswer: correctText };
    }
    if (Math.sign(v) !== Math.sign(answer.value) && withinTol(-v, answer.value, tol)) {
      return { correct: false, score: 0.25, misconception: 'z-sign', title: 'Right size, wrong sign', message: 'Check the direction: should the answer be positive or negative?', yourAnswer: response, correctAnswer: correctText };
    }
    return { correct: false, score: 0, title: 'Not quite', message: 'Compare your work with the solution steps to find where it went off track.', yourAnswer: response, correctAnswer: correctText };
  }
  return { correct: false, score: 0, title: '', message: '', yourAnswer: response, correctAnswer: '' };
}

const PRAISE: Record<string, string[]> = {
  calculation: ['✓ Correct! Clean calculation.', '✓ Nailed the arithmetic and the setup.', '✓ Correct — every step lined up.'],
  method: ['✓ Correct! You recognized the situation before reaching for a formula.', '✓ Right tool for the job.'],
  interpretation: ['✓ Correct! You read the meaning, not just the number.', '✓ Exactly — that\'s the statistical meaning.'],
  'multi-step': ['✓ Correct! You chose the right method AND executed it correctly.', '✓ Every step checks out.'],
  default: ['✓ Correct!', '✓ That\'s right.', '✓ Correct — nicely reasoned.'],
};

export function praise(q: Question, hintsUsed: number, ms: number): { title: string; perfect: boolean } {
  const perfect = hintsUsed === 0 && q.level >= 5;
  if (perfect && (q.type === 'multi-step' || q.type === 'exam' || q.level >= 6)) {
    return { title: '🔥 PERFECT SOLVE — right method, right calculation, no hints.', perfect: true };
  }
  const pool = PRAISE[q.type] ?? PRAISE.default;
  const base = pool[Math.floor((ms / 997) % pool.length)] ?? pool[0];
  if (hintsUsed === 0) return { title: base, perfect };
  return { title: `${base.replace('✓ ', '✓ ')} (${hintsUsed} hint${hintsUsed > 1 ? 's' : ''} used)`, perfect: false };
}

/** Credit multiplier for hint usage (STEP 15): independent solves count more. */
export function hintCredit(hintsUsed: number, totalHints: number) {
  if (hintsUsed <= 0) return 1;
  if (totalHints > 0 && hintsUsed >= totalHints) return 0.25; // full walkthrough
  return Math.max(0.35, 1 - 0.15 * hintsUsed);
}
