// Rolling relief for the open world: smooth value-noise hills, flattened to
// level aprons around every built site so walls, stones and the leyline road
// keep their footing. Height is a pure function of world position — the same
// determinism rule as the rest of the terrain.

import { LOOK } from "@/lib/rpg/look";
import { hash } from "@/lib/rpg/screen";
import {
  CIRCLE_POS,
  GROVE_POS,
  GROVE_R,
  HENGE_POS,
  KEEP_POS,
  VILLAGE_POS,
} from "@/lib/rpg/world";

/** Smoothly interpolated lattice noise, 0..1. */
function vnoise(x: number, y: number, cell: number, seed: number): number {
  const gx = Math.floor(x / cell);
  const gy = Math.floor(y / cell);
  const fx = x / cell - gx;
  const fy = y / cell - gy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const h00 = hash(gx ^ seed, gy);
  const h10 = hash((gx + 1) ^ seed, gy);
  const h01 = hash(gx ^ seed, gy + 1);
  const h11 = hash((gx + 1) ^ seed, gy + 1);
  const a = h00 + (h10 - h00) * sx;
  const b = h01 + (h11 - h01) * sx;
  return (a + (b - a) * sy) / 999;
}

/** Level aprons: centre, fully-flat radius, and feather-out radius. */
const APRONS: ReadonlyArray<{ x: number; y: number; r0: number; r1: number }> = [
  { x: KEEP_POS.x, y: KEEP_POS.y, r0: 280, r1: 460 },
  { x: VILLAGE_POS.x, y: VILLAGE_POS.y, r0: 210, r1: 340 },
  { x: GROVE_POS.x, y: GROVE_POS.y, r0: GROVE_R + 30, r1: GROVE_R + 150 },
  { x: HENGE_POS.x, y: HENGE_POS.y, r0: 250, r1: 390 },
  { x: CIRCLE_POS.x, y: CIRCLE_POS.y, r0: 120, r1: 210 },
];

function smooth01(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/**
 * Ground elevation at a world point, in world units. Zero when the look has
 * hills off, and zero along the leyline corridor and inside site aprons —
 * the road runs the valley floor, which is also why you can see it at all.
 */
export function terrainHeight(wx: number, wy: number): number {
  if (!LOOK.hills) return 0;
  // Two octaves: long moor swells and short heather humps.
  const swell = (vnoise(wx, wy, 310, 0x51) - 0.5) * 2 * 46;
  const humps = (vnoise(wx, wy, 92, 0x9d) - 0.5) * 2 * 9;
  let factor = smooth01((Math.abs(wx) - 30) / 95);
  for (const a of APRONS) {
    const d = Math.hypot(wx - a.x, wy - a.y);
    factor = Math.min(factor, smooth01((d - a.r0) / (a.r1 - a.r0)));
  }
  return (swell + humps) * factor;
}
