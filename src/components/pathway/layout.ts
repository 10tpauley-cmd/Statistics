import type { BuiltRegion, Pathway, PathNode } from '../../engine/pathway/types';
import { makeRng } from '../../lib/stats/random';

export interface PlacedNode {
  node: PathNode;
  x: number;
  y: number;
  size: number;
  side: 'left' | 'right' | 'center';
}

export interface PlacedRegion {
  region: BuiltRegion;
  top: number;
  bottom: number;
  gateY: number; // y of the region gate banner (top of region)
  landmarks: { kind: string; label: string; x: number; y: number; scale: number; flip: boolean }[];
  decorations: { kind: number; x: number; y: number; scale: number; flip: boolean }[];
}

export interface PathLayout {
  width: number;
  height: number;
  nodes: PlacedNode[]; // main path, in order
  encounters: (PlacedNode & { anchor: PlacedNode })[];
  regions: PlacedRegion[];
  byId: Record<string, PlacedNode>;
}

export const GATE_H = 440;
const LEVEL_STEP = 140;
const MINI_STEP = 180;
const BOSS_STEP = 270;
const LANDMARK_GAP = 210;

export const NODE_SIZE = { level: 74, 'mini-boss': 96, boss: 132, encounter: 52 } as const;

/** Position every node along a winding road. Pure function of the world + width (deterministic). */
export function layoutPathway(p: Pathway, width: number): PathLayout {
  const W = Math.max(320, Math.min(width, 900));
  const cx = W / 2;
  const amp = Math.min(W * 0.3, 230);
  const nodes: PlacedNode[] = [];
  const encounters: PathLayout['encounters'] = [];
  const regions: PlacedRegion[] = [];
  const byId: Record<string, PlacedNode> = {};
  let y = 0;

  p.regions.forEach((r, ri) => {
    const top = y;
    const gateY = y;
    y += GATE_H;
    const rng = makeRng(9001 + ri * 77);
    const landmarks: PlacedRegion['landmarks'] = [];
    const phase = ri * 1.7;
    let k = 0;
    let avoid: 'left' | 'right' | null = null; // keep the road away from a landmark just placed
    r.main.forEach((n) => {
      const isBoss = n.kind === 'boss';
      const isMini = n.kind === 'mini-boss';
      if (isBoss) y += 50;
      else if (isMini) y += 30;
      // Gentle S-curves with an occasional wider switchback; bosses sit on the center line.
      const swing = Math.sin(k * 0.82 + phase) + 0.35 * Math.sin(k * 0.31 + phase * 2);
      let x = isBoss ? cx : isMini ? cx + amp * 0.35 * Math.sign(swing || 1) : cx + amp * Math.max(-1, Math.min(1, swing / 1.2));
      if (avoid === 'right' && x > cx - 20) x = cx - Math.abs(x - cx) * 0.6 - 30;
      if (avoid === 'left' && x < cx + 20) x = cx + Math.abs(x - cx) * 0.6 + 30;
      avoid = null;
      const placed: PlacedNode = { node: n, x, y: y + (isBoss ? NODE_SIZE.boss / 2 : 0), size: NODE_SIZE[n.kind], side: isBoss ? 'center' : x < cx ? 'left' : 'right' };
      nodes.push(placed);
      byId[n.id] = placed;
      y += isBoss ? BOSS_STEP : isMini ? MINI_STEP : LEVEL_STEP;
      k++;
      const lm = r.spec.landmarks.find((l) => l.afterLevel === n.id);
      if (lm) {
        const side: 'left' | 'right' = x < cx ? 'right' : 'left';
        const lx = side === 'right' ? Math.min(W - 105, cx + amp * 0.95) : Math.max(105, cx - amp * 0.95);
        landmarks.push({ kind: lm.kind, label: lm.label, x: lx, y: y + 40, scale: 0.9, flip: rng.bool() });
        y += LANDMARK_GAP;
        avoid = side;
      }
    });
    r.encounters.forEach((e) => {
      const anchor = byId[e.afterNode];
      if (!anchor) return;
      const dir = anchor.x < cx ? 1 : -1;
      const ex = Math.max(48, Math.min(W - 48, anchor.x + dir * Math.min(170, W * 0.28)));
      const placed = { node: e as PathNode, x: ex, y: anchor.y + 58, size: NODE_SIZE.encounter, side: (dir > 0 ? 'right' : 'left') as PlacedNode['side'], anchor };
      encounters.push(placed);
      byId[e.id] = placed;
    });
    y += 60;
    const bottom = y;
    // Scatter decorations in the open space beside the road.
    const decorations: PlacedRegion['decorations'] = [];
    const regionNodes = nodes.filter((n) => n.node.regionIndex === ri);
    const pathXAt = (yy: number) => {
      let best = regionNodes[0];
      for (const n of regionNodes) if (Math.abs(n.y - yy) < Math.abs(best.y - yy)) best = n;
      return best?.x ?? cx;
    };
    const count = Math.round((bottom - top - GATE_H) / 52);
    for (let i = 0; i < count; i++) {
      const dy = top + GATE_H + rng.float(0, bottom - top - GATE_H, 0);
      const px = pathXAt(dy);
      const leftRoom = px - 70, rightRoom = W - px - 70;
      const goLeft = leftRoom > rightRoom ? rng.bool(0.8) : rng.bool(0.2);
      const room = goLeft ? leftRoom : rightRoom;
      if (room < 40) continue;
      const dx = goLeft ? rng.float(16, Math.max(17, px - 90), 0) : rng.float(Math.min(W - 17, px + 90), W - 16, 0);
      if (encounters.some((e) => Math.hypot(e.x - dx, e.y - dy) < 70)) continue;
      if (regionNodes.some((n) => Math.abs(n.x - dx) < 115 && dy - n.y > -70 && dy - n.y < 110)) continue;
      if (landmarks.some((l) => Math.hypot(l.x - dx, l.y - dy) < 110)) continue;
      decorations.push({ kind: rng.int(0, 5), x: dx, y: dy, scale: rng.float(0.7, 1.25, 2), flip: rng.bool() });
    }
    regions.push({ region: r, top, bottom, gateY, landmarks, decorations });
  });

  return { width: W, height: y + 80, nodes, encounters, regions, byId };
}

/** Smooth road through points (Catmull–Rom → cubic Bézier). */
export function roadPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.22;
    const c1x = p1.x + (p2.x - p0.x) * t, c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t, c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}
