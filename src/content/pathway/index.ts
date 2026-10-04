import { buildPathway } from '../../engine/pathway/build';
import type { RegionContent } from '../../engine/pathway/types';
import { REGION_U1 } from './region-u1';
import { REGION_U2 } from './region-u2';
import { REGION_U3 } from './region-u3';
import { REGION_U4 } from './region-u4';
import { REGION_U5 } from './region-u5';
import { REGION_FINAL } from './final';

/** Authored regions in journey order (course order from the PDF). */
export const REGION_CONTENT: RegionContent[] = [REGION_U1, REGION_U2, REGION_U3, REGION_U4, REGION_U5];
export { REGION_FINAL };

/** The built world — generated from data, never hard-coded in components. */
export const PATHWAY = buildPathway(REGION_CONTENT, REGION_FINAL);
