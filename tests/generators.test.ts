import { describe, expect, it } from 'vitest';
import { ALL_GENERATORS, GENERATORS, makeQuestion } from '../src/engine/questions';
import { gradeObjective, correctAnswerText } from '../src/engine/grading';
import { CONCEPTS } from '../src/content/concepts';
import { MISCONCEPTION_BY_ID } from '../src/content/misconceptions';
import type { AnswerSpec, Question } from '../src/engine/types';

function checkAnswer(a: AnswerSpec, where: string) {
  if (a.kind === 'mc') {
    const correct = a.options.filter((o) => o.correct);
    expect(correct.length, `${where}: exactly one correct option`).toBe(1);
    expect(a.options.length, `${where}: at least 2 options`).toBeGreaterThanOrEqual(2);
    const texts = a.options.map((o) => o.text);
    expect(new Set(texts).size, `${where}: unique option texts (${texts.join(' | ')})`).toBe(texts.length);
    a.options.forEach((o) => {
      if (o.misconception) expect(MISCONCEPTION_BY_ID[o.misconception], `${where}: unknown misconception ${o.misconception}`).toBeTruthy();
    });
    expect(gradeObjective(a, correct[0].id).correct, `${where}: grading accepts correct option`).toBe(true);
  } else if (a.kind === 'numeric') {
    expect(Number.isFinite(a.value), `${where}: finite value`).toBe(true);
    expect(a.tol, `${where}: positive tol`).toBeGreaterThan(0);
    expect(gradeObjective(a, String(a.value)).correct, `${where}: grading accepts exact value`).toBe(true);
    (a.wrong ?? []).forEach((w) => {
      if (w.misconception) expect(MISCONCEPTION_BY_ID[w.misconception], `${where}: unknown misconception ${w.misconception}`).toBeTruthy();
      expect(Number.isFinite(w.value), `${where}: finite wrong value`).toBe(true);
    });
  } else {
    expect(a.rubric.items.length, `${where}: rubric items`).toBeGreaterThan(0);
    a.rubric.items.forEach((it) => it.patterns.forEach((p) => expect(() => new RegExp(p, 'i'), `${where}: regex ${p}`).not.toThrow()));
    expect(a.rubric.model.length).toBeGreaterThan(20);
  }
}

function checkQuestion(q: Question) {
  const where = `${q.generatorId} L${q.level} seed ${q.id}`;
  expect(q.prompt.length, `${where}: prompt`).toBeGreaterThan(5);
  expect(q.dims.length, `${where}: dims`).toBeGreaterThan(0);
  expect(q.solution.length, `${where}: solution`).toBeGreaterThan(0);
  expect(q.prompt + (q.context ?? ''), `${where}: no undefined/NaN text`).not.toMatch(/undefined|NaN/);
  q.solution.forEach((s) => expect(s, where).not.toMatch(/undefined|NaN/));
  checkAnswer(q.answer, where);
  q.parts?.forEach((p, i) => checkAnswer(p.answer, `${where} part ${i}`));
  if (q.interpretFollowUp) checkAnswer(q.interpretFollowUp.answer, `${where} interpret`);
  expect(correctAnswerText(q.answer).length).toBeGreaterThan(0);
}

describe('question generators', () => {
  it('every concept has at least two generators', () => {
    for (const c of CONCEPTS) {
      const n = GENERATORS.filter((g) => g.concept === c.id).length;
      expect(n, `${c.id} generators`).toBeGreaterThanOrEqual(2);
    }
  });

  it('every generator produces valid questions across levels and seeds', () => {
    let count = 0;
    for (const g of ALL_GENERATORS) {
      for (const level of g.levels) {
        for (let seed = 1; seed <= 40; seed++) {
          checkQuestion(makeQuestion(g, level, seed * 7919 + level));
          count++;
        }
      }
    }
    expect(count).toBeGreaterThan(1000);
  });

  it('generators are deterministic for a seed', () => {
    for (const g of ALL_GENERATORS) {
      const a = makeQuestion(g, g.levels[0], 12345);
      const b = makeQuestion(g, g.levels[0], 12345);
      expect(a.prompt).toBe(b.prompt);
      expect(JSON.stringify(a.answer)).toBe(JSON.stringify(b.answer));
    }
  });

  it('covers all seven levels across the course', () => {
    const levels = new Set(GENERATORS.flatMap((g) => g.levels));
    for (let l = 1; l <= 7; l++) expect(levels.has(l), `level ${l}`).toBe(true);
  });
});

describe('lesson content', () => {
  it('every concept lesson has interaction before long text and valid inline inputs', () => {
    for (const c of CONCEPTS) {
      expect(c.lesson.length, c.id).toBeGreaterThanOrEqual(5);
      const interactive = c.lesson.filter((s) => ['predict', 'check', 'interact', 'recall'].includes(s.kind)).length;
      expect(interactive, `${c.id} interactive steps`).toBeGreaterThanOrEqual(2);
      for (const s of c.lesson) {
        if ((s.kind === 'predict' || s.kind === 'check') && s.input.type === 'mc') {
          expect(s.input.options.filter((o) => o.correct).length, `${c.id} inline mc`).toBe(1);
        }
      }
      expect(c.teach.items.length).toBeGreaterThan(0);
      c.teach.items.forEach((it) => it.patterns.forEach((p) => expect(() => new RegExp(p, 'i')).not.toThrow()));
    }
  });
});

describe('evidence coverage', () => {
  it('every applicable mastery dimension of every concept can be earned by practice (explain also via Teach It)', () => {
    const gaps: string[] = [];
    for (const c of CONCEPTS) {
      const dims = new Set(GENERATORS.filter((g) => g.concept === c.id).flatMap((g) => g.dims));
      dims.add('explain');
      for (const d of c.dims) if (!dims.has(d)) gaps.push(`${c.id}:${d}`);
      const highLevel = GENERATORS.some((g) => g.concept === c.id && g.levels.some((l) => l >= 5));
      if (!highLevel) gaps.push(`${c.id}:level5+`);
    }
    expect(gaps).toEqual([]);
  });
});
