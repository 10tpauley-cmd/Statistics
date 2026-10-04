import type { ConceptId, Generator, Question, QType } from '../types';
import { makeRng, randomSeed } from '../../lib/stats/random';
import { UNIT1_GENERATORS } from './unit1';
import { UNIT2_GENERATORS } from './unit2';
import { UNIT3_GENERATORS } from './unit3';
import { UNIT4_GENERATORS } from './unit4';
import { UNIT5_GENERATORS } from './unit5';
import { METHOD_GENERATORS, METHOD_CASES } from './method';
import { EXTRA_GENERATORS } from './extra';

export const GENERATORS: Generator[] = [...UNIT1_GENERATORS, ...UNIT2_GENERATORS, ...UNIT3_GENERATORS, ...UNIT4_GENERATORS, ...UNIT5_GENERATORS, ...EXTRA_GENERATORS];
export const ALL_GENERATORS: Generator[] = [...GENERATORS, ...METHOD_GENERATORS];
export const GENERATOR_BY_ID: Record<string, Generator> = Object.fromEntries(ALL_GENERATORS.map((g) => [g.id, g]));

export function generatorsFor(concept: ConceptId): Generator[] {
  return GENERATORS.filter((g) => g.concept === concept);
}

/** Concepts that have method-selection cases. */
export const METHOD_CONCEPTS = new Set(METHOD_CASES.map((c) => c.concept));

export function makeQuestion(gen: Generator, level: number, seed = randomSeed()): Question {
  return gen.make(makeRng(seed), level);
}

/** Regenerate a question from its id (`genId#seed`) — used for mistake review and bookmarks. */
export function questionFromId(qid: string, level = 3): Question | null {
  const [gid, seedStr] = qid.split('#');
  const g = GENERATOR_BY_ID[gid];
  if (!g) return null;
  return makeQuestion(g, level, Number(seedStr));
}

export interface PickOptions {
  concept: ConceptId;
  level: number;
  avoidGenerators?: string[]; // recently used
  preferTypes?: QType[];
  excludeTypes?: QType[];
  rand?: () => number;
}

/** Choose a generator for a concept near the requested level, avoiding recent repeats (anti-gaming). */
export function pickGenerator(opts: PickOptions): Generator | null {
  const rand = opts.rand ?? Math.random;
  let pool = generatorsFor(opts.concept).filter((g) => !opts.excludeTypes?.includes(g.type));
  if (!pool.length) return null;
  const score = (g: Generator) => {
    const dist = Math.min(...g.levels.map((l) => Math.abs(l - opts.level)));
    let s = 10 - dist * 3;
    if (opts.avoidGenerators?.includes(g.id)) s -= 6 + 2 * (opts.avoidGenerators.length - opts.avoidGenerators.lastIndexOf(g.id) < 3 ? 1 : 0);
    if (opts.preferTypes?.includes(g.type)) s += 3;
    return s + rand() * 2.5;
  };
  pool = pool.slice().sort((a, b) => score(b) - score(a));
  return pool[0];
}

export function levelFor(gen: Generator, desired: number) {
  return gen.levels.reduce((best, l) => (Math.abs(l - desired) < Math.abs(best - desired) ? l : best), gen.levels[0]);
}
