import type { Concept, ConceptId } from '../../engine/types';
import { UNIT1 } from './unit1';
import { UNIT2 } from './unit2';
import { UNIT3 } from './unit3';
import { UNIT4 } from './unit4';
import { UNIT5 } from './unit5';
import { CONCEPT_ORDER } from '../units';

const ALL = [...UNIT1, ...UNIT2, ...UNIT3, ...UNIT4, ...UNIT5];

export const CONCEPTS: Concept[] = CONCEPT_ORDER.map((id) => {
  const c = ALL.find((x) => x.id === id);
  if (!c) throw new Error(`Missing concept content: ${id}`);
  return c;
});

export const CONCEPT_BY_ID = Object.fromEntries(CONCEPTS.map((c) => [c.id, c])) as Record<ConceptId, Concept>;

export function concept(id: ConceptId): Concept {
  return CONCEPT_BY_ID[id];
}
