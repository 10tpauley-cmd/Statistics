import type { ConceptId, Unit } from '../engine/types';

/** Course structure derived from the PDF (see docs/CURRICULUM.md §2). */
export const UNITS: Unit[] = [
  {
    id: 'u1',
    number: 1,
    title: 'Sampling & Data',
    subtitle: 'Who we study, what we measure, and how bias sneaks in',
    chapter: 'Ch. 1',
    color: 'u1',
    exam: 'Exam #1',
    sections: [
      { id: '1.1–1.2', title: 'Key Terms, Sampling, and Variation', pages: [64, 65, 66], concepts: ['pop-sample', 'data-types', 'cat-displays', 'sampling'] },
      { id: '1.3–1.4', title: 'Frequency Tables, Experimental Design, Ethics', pages: [60, 61, 62, 63], concepts: ['freq-tables', 'experiments', 'bias', 'investigative'] },
    ],
  },
  {
    id: 'u2',
    number: 2,
    title: 'Describing Data',
    subtitle: 'Graphs, center, shape, position, spread, and comparisons',
    chapter: 'Ch. 2',
    color: 'u2',
    exam: 'Exam #1',
    sections: [
      { id: '2.1–2.2, 2.5', title: 'Graphs of Quantitative Data & Measures of Center', pages: [57, 58, 59, 22, 23], concepts: ['quant-graphs', 'center'] },
      { id: '2.4, 2.6', title: 'Measures of Shape, Position, and Boxplots', pages: [53, 54, 55, 56, 20, 21], concepts: ['shape', 'position', 'boxplots'] },
      { id: '2.7', title: 'Measures of Spread', pages: [50, 51, 52, 17, 18, 19], concepts: ['range-iqr', 'std-dev', 'outliers', 'z-score'] },
      { id: '2.8', title: 'Comparing Distributions', pages: [48, 49, 15, 16], concepts: ['compare'] },
    ],
  },
  {
    id: 'u3',
    number: 3,
    title: 'Two Quantitative Variables',
    subtitle: 'Scatterplots, correlation, regression, and residuals',
    chapter: 'Ch. 12',
    color: 'u3',
    exam: 'Exam #1',
    sections: [
      { id: '12.1–12.3, 12.5', title: 'Two Quantitative Variables and Regression', pages: [43, 44, 45, 46, 47, 10, 11, 12, 13, 14], concepts: ['scatter', 'correlation', 'regression', 'r-squared', 'residuals'] },
    ],
  },
  {
    id: 'u4',
    number: 4,
    title: 'Probability',
    subtitle: 'Sample spaces, rules, conditional probability, independence',
    chapter: 'Ch. 3',
    color: 'u4',
    exam: 'Exam #2',
    sections: [
      { id: '3.1–3.5', title: 'Probability Topics', pages: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 5, 6, 7, 8, 9], concepts: ['prob-basics', 'prob-rules', 'conditional', 'independence', 'trees-venn'] },
    ],
  },
  {
    id: 'u5',
    number: 5,
    title: 'Discrete Random Variables',
    subtitle: 'Probability distributions, expected value, and the binomial model',
    chapter: 'Ch. 4',
    color: 'u5',
    exam: 'Exam #2',
    sections: [
      { id: '4.1–4.2', title: 'Probability Distributions', pages: [28, 29, 30, 3, 4], concepts: ['prob-dist', 'expected-value', 'transform'] },
      { id: '4.3', title: 'Binomial Distributions', pages: [24, 25, 26, 27], concepts: ['binomial'] },
    ],
  },
];

export const CONCEPT_ORDER: ConceptId[] = UNITS.flatMap((u) => u.sections.flatMap((s) => s.concepts));

export function unitOf(id: ConceptId): Unit {
  return UNITS.find((u) => u.sections.some((s) => s.concepts.includes(id)))!;
}

export function sectionOf(id: ConceptId) {
  for (const u of UNITS) for (const s of u.sections) if (s.concepts.includes(id)) return s;
  return undefined;
}
