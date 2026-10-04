import { describe, expect, it } from 'vitest';
import { REGION_CONTENT, REGION_FINAL, PATHWAY } from '../src/content/pathway';
import { validateRegion, validateCoverage } from '../src/engine/pathway/validate';
import { segmentsFor } from '../src/engine/pathway/build';
import { WIDGETS } from '../src/components/interactive/registry';
import { WIDGET_IDS } from '../src/engine/pathway/widgetIds';

describe('pathway content', () => {
  REGION_CONTENT.forEach((rc) => {
    it(`region ${rc.region.unit} is valid`, () => {
      expect(validateRegion(rc)).toEqual([]);
    });
  });
  it('final region is valid', () => {
    expect(validateRegion(REGION_FINAL, { final: true })).toEqual([]);
  });
  it('every course concept is on the Pathway', () => {
    expect(validateCoverage([...REGION_CONTENT, REGION_FINAL])).toEqual([]);
  });
  it('every level builds a playable segment list that starts with an intro and ends with completion', () => {
    for (const n of PATHWAY.main) {
      if (n.kind !== 'level') continue;
      const segs = segmentsFor(n);
      expect(segs[0].kind, n.id).toBe('intro');
      expect(segs[segs.length - 1].kind, n.id).toBe('complete');
      expect(segs.length, n.id).toBeGreaterThanOrEqual(4);
    }
  });
  it('widget id list matches the registry', () => {
    expect([...WIDGET_IDS].sort()).toEqual(Object.keys(WIDGETS).sort());
  });
});
