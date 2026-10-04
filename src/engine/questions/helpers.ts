import type { Rng } from '../../lib/stats/random';
import type { AnswerSpec, ConceptId, Dimension, Generator, McOption, QType, Question, QuestionPart, TeachRubric } from '../types';
import { fmt } from '../../lib/stats/format';

/** [text, correct?, why?, misconceptionId?] */
export type Opt = [string, boolean?, string?, string?];

export function mc(rng: Rng, opts: Opt[], shuffle = true): AnswerSpec {
  const options: McOption[] = opts.map(([text, correct, why, misconception], i) => ({
    id: String.fromCharCode(97 + i),
    text,
    correct: !!correct,
    why,
    misconception,
  }));
  return { kind: 'mc', options: shuffle ? relabel(rng.shuffle(options)) : options };
}

function relabel(options: McOption[]): McOption[] {
  return options.map((o, i) => ({ ...o, id: String.fromCharCode(97 + i) }));
}

export function num(
  value: number,
  tol: number,
  extra: { unit?: string; accept?: number[]; wrong?: { value: number; tol?: number; misconception?: string; why: string }[] } = {},
): AnswerSpec {
  return { kind: 'numeric', value, tol, ...extra };
}

export function text(rubric: TeachRubric): AnswerSpec {
  return { kind: 'text', rubric };
}

/** Default tolerance: half a unit in the last displayed decimal, but at least 0.5% relative. */
export function tolFor(value: number, decimals = 2) {
  return Math.max(0.5 * 10 ** -decimals, Math.abs(value) * 0.005);
}

export interface QInput {
  concept: ConceptId;
  level: number;
  type: QType;
  dims?: Dimension[];
  prompt: string;
  context?: string;
  answer: AnswerSpec;
  hints?: string[];
  solution?: string[];
  takeaway?: string;
  visual?: Question['visual'];
  parts?: QuestionPart[];
  interpretFollowUp?: QuestionPart;
  source?: Question['source'];
  method?: string;
  calculator?: boolean;
}

const DEFAULT_DIMS: Record<QType, Dimension[]> = {
  recognition: ['recognize'],
  calculation: ['calculate'],
  interpretation: ['interpret'],
  conceptual: ['recognize', 'interpret'],
  misconception: ['interpret'],
  'real-world': ['apply'],
  graph: ['interpret'],
  'multi-step': ['calculate', 'apply'],
  method: ['apply', 'recognize'],
  exam: ['apply', 'calculate'],
  'free-response': ['explain', 'interpret'],
};

/** Build a Question; generator id + seed are attached by `makeQuestion`. */
export function build(input: QInput): Omit<Question, 'id' | 'generatorId'> {
  return {
    concept: input.concept,
    level: input.level,
    type: input.type,
    dims: input.dims ?? DEFAULT_DIMS[input.type],
    prompt: input.prompt,
    context: input.context,
    answer: input.answer,
    hints: input.hints ?? [],
    solution: input.solution ?? [],
    takeaway: input.takeaway ?? '',
    visual: input.visual,
    parts: input.parts,
    interpretFollowUp: input.interpretFollowUp,
    source: input.source,
    method: input.method,
    calculator: input.calculator,
  };
}

export function gen(
  id: string,
  concept: ConceptId,
  title: string,
  levels: number[],
  type: QType,
  make: (rng: Rng, level: number) => Omit<Question, 'id' | 'generatorId'>,
  dims?: Dimension[],
): Generator {
  return {
    id,
    concept,
    title,
    levels,
    type,
    dims: dims ?? DEFAULT_DIMS[type],
    make: (rng, level) => {
      const q = make(rng, level);
      return { ...q, dims: dims ?? q.dims, id: `${id}#${rng.seed}`, generatorId: id };
    },
  };
}

export const f = fmt;

/** Round to d decimals as a number. */
export function r(x: number, d = 2) {
  const k = 10 ** d;
  return Math.round(x * k) / k;
}

export function list(xs: number[], d = 2) {
  return xs.map((x) => fmt(x, d)).join(', ');
}

export function part(label: string, prompt: string, answer: AnswerSpec, explain: string): QuestionPart {
  return { label, prompt, answer, explain };
}

/** Generic small rubric for free-response interpretation questions. */
export function frqRubric(prompt: string, items: { id: string; idea: string; patterns: string[]; weight?: number }[], model: string, misconceptions: { patterns: string[]; message: string }[] = []): TeachRubric {
  return { prompt, items: items.map((i) => ({ weight: 1, ...i })), misconceptions, model };
}
