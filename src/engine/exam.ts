import type { ConceptId, ExamRecord, Question, UnitId } from './types';
import { CONCEPTS, CONCEPT_BY_ID } from '../content/concepts';
import { UNITS, unitOf } from '../content/units';
import { makeRng } from '../lib/stats/random';
import { generatorsFor, makeQuestion, levelFor } from './questions';
import { METHOD_GENERATORS } from './questions/method';

export type ExamScope = 'exam1' | 'exam2' | 'final' | `unit-${UnitId}`;

export const EXAM_SCOPES: { id: ExamScope; title: string; description: string; units: UnitId[] }[] = [
  { id: 'exam1', title: 'Exam #1', description: 'Ch. 1, 2, and 12 — matches the PDF\'s Exam #1 Review', units: ['u1', 'u2', 'u3'] },
  { id: 'exam2', title: 'Exam #2', description: 'Ch. 3 and 4 — probability and random variables', units: ['u4', 'u5'] },
  ...UNITS.map((u) => ({ id: `unit-${u.id}` as ExamScope, title: `Unit ${u.number} test`, description: u.title, units: [u.id] as UnitId[] })),
];

export function scopeConcepts(scope: ExamScope): ConceptId[] {
  if (scope === 'final') return CONCEPTS.map((c) => c.id);
  const s = EXAM_SCOPES.find((x) => x.id === scope)!;
  return CONCEPTS.filter((c) => s.units.includes(c.unit)).map((c) => c.id);
}

/**
 * Build a randomized, mixed exam. Questions are exam-style (levels 5–6), cover every concept in scope
 * (weighted by importance), and include method-selection and (for the final) free-response items.
 */
export function buildExam(scope: ExamScope, count: number, seed = Date.now()): Question[] {
  const rng = makeRng(seed);
  const pool = scopeConcepts(scope);
  const order = rng.shuffle(pool).sort((a, b) => CONCEPT_BY_ID[b].importance - CONCEPT_BY_ID[a].importance);
  const chosen: ConceptId[] = [];
  for (let pass = 0; pass < 50 && chosen.length < count; pass++) {
    for (const id of order) {
      if (chosen.length >= count) break;
      if (chosen.filter((x) => x === id).length >= Math.ceil(count / pool.length) + (CONCEPT_BY_ID[id].importance >= 5 ? 1 : 0)) continue;
      chosen.push(id);
    }
  }
  const out: Question[] = [];
  const usedGen = new Set<string>();
  const wantFrq = scope === 'final' ? Math.max(2, Math.round(count / 12)) : 0;
  let frqs = 0;
  rng.shuffle(chosen).forEach((id, i) => {
    let gens = generatorsFor(id).filter((g) => !usedGen.has(g.id));
    if (!gens.length) gens = generatorsFor(id);
    const allowFrq = frqs < wantFrq;
    const nonFrq = gens.filter((g) => g.type !== 'free-response');
    const frqGens = gens.filter((g) => g.type === 'free-response');
    const g = allowFrq && frqGens.length && rng.bool(0.5) ? rng.pick(frqGens) : rng.pick(nonFrq.length ? nonFrq : gens);
    if (g.type === 'free-response') frqs++;
    usedGen.add(g.id);
    const lvl = levelFor(g, rng.pick([5, 6, 6]));
    out.push(makeQuestion(g, lvl, seed + i * 7919));
  });
  // Swap ~1 in 8 for a method-selection question in scope.
  const methodCount = Math.max(1, Math.round(count / 8));
  for (let k = 0; k < methodCount; k++) {
    for (let tries = 0; tries < 20; tries++) {
      const q = makeQuestion(METHOD_GENERATORS[0], 6, seed + 100003 * (k + 1) + tries);
      if (pool.includes(q.concept)) {
        out[(k * 5 + 3) % out.length] = q;
        break;
      }
    }
  }
  return out;
}

/** Placement test: one question per key concept, levels 2–3, no free response. */
export const PLACEMENT_CONCEPTS: ConceptId[] = ['pop-sample', 'data-types', 'sampling', 'bias', 'center', 'shape', 'position', 'std-dev', 'outliers', 'correlation', 'regression', 'residuals', 'prob-rules', 'conditional', 'independence', 'expected-value', 'binomial'];

export function buildPlacement(seed = Date.now()): Question[] {
  const rng = makeRng(seed);
  return PLACEMENT_CONCEPTS.map((id, i) => {
    const gens = generatorsFor(id).filter((g) => g.type !== 'free-response' && g.levels.some((l) => l <= 3));
    const g = rng.pick(gens.length ? gens : generatorsFor(id));
    return makeQuestion(g, levelFor(g, 3), seed + i * 104729);
  });
}

export interface ExamAnalysis {
  score: number;
  byUnit: { unit: UnitId; title: string; correct: number; total: number }[];
  byConcept: { id: ConceptId; correct: number; total: number }[];
  strongest?: string;
  weakest?: string;
  commonError?: { id: string; count: number };
  recommended: ConceptId[];
}

export function analyzeExam(rec: ExamRecord): ExamAnalysis {
  const byConcept = Object.entries(rec.byConcept).map(([id, v]) => ({ id: id as ConceptId, correct: v!.correct, total: v!.total }));
  const byUnitMap = new Map<UnitId, { correct: number; total: number }>();
  byConcept.forEach((c) => {
    const u = unitOf(c.id).id;
    const cur = byUnitMap.get(u) ?? { correct: 0, total: 0 };
    byUnitMap.set(u, { correct: cur.correct + c.correct, total: cur.total + c.total });
  });
  const byUnit = [...byUnitMap.entries()].map(([unit, v]) => ({ unit, title: UNITS.find((u) => u.id === unit)!.title, ...v }));
  const ranked = byUnit.slice().sort((a, b) => b.correct / b.total - a.correct / a.total);
  const errs = Object.entries(rec.misconceptions).sort((a, b) => b[1] - a[1]);
  const weakConcepts = byConcept.filter((c) => c.correct / c.total < 0.75).sort((a, b) => a.correct / a.total - b.correct / b.total).map((c) => c.id);
  return {
    score: rec.score,
    byUnit,
    byConcept,
    strongest: ranked[0]?.title,
    weakest: ranked.length > 1 ? ranked[ranked.length - 1].title : undefined,
    commonError: errs[0] ? { id: errs[0][0], count: errs[0][1] } : undefined,
    recommended: weakConcepts.slice(0, 4),
  };
}
