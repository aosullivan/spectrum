// The open world: deterministic terrain sampling plus chunked feature
// placement. World units are roughly "pixels at the hero's depth"; +x is
// east, +y is north. Everything is derived from hashes — no stored map yet
// (authored biome data arrives with the first dungeon milestone).

import {
  MENHIR,
  STONE_LEANING,
  TREE_DEAD_PINE,
  TREE_GNARLED_A,
  TREE_GNARLED_B,
} from "@/lib/rpg/art";
import { BOULDER, DOLMEN, STONE_L, STONE_M, STONE_S } from "@/lib/rpg/assets";
import {
  BUSH,
  SARSEN_FALLEN,
  SARSEN_TALL,
  TREE_BIRCH,
  TREE_OAK,
  TREE_PINE_LIVE,
  TRILITHON,
} from "@/lib/rpg/flora";
import { B, BB, BC, BG, C, G, K } from "@/lib/rpg/palette";
import { hash, type Sprite } from "@/lib/rpg/screen";
import type { Box } from "@/lib/rpg/structures";

// ------------------------------------------------------------------- places

/** The keep the player can see from spawn and walk to. */
export const KEEP_POS = { x: 0, y: 1400 };
/** A stone circle off the leyline — landmark and future save shrine. */
export const CIRCLE_POS = { x: 300, y: 520 };
/** The sacred grove: still water, living ground, and the lady who rises. */
export const GROVE_POS = { x: 470, y: 430 };
const POOL_R = 62;
const GROVE_R = 190;
/**
 * The world splits into three bands. West of WOODS_EDGE_X the moor decays
 * into ancient dead woodland — bare gnarled limbs, nothing living. East of
 * GREENWOOD_EDGE_X it becomes living greenwood: oak, birch, bracken, and
 * the henge. Between them lies the open moor with the leyline running north.
 */
export const DEAD_WOOD_X = -260;
const WOODS_EDGE_X = DEAD_WOOD_X;
const GREENWOOD_EDGE_X = 260;
/** The henge stands deep in the greenwood. */
export const HENGE_POS = { x: 760, y: 760 };

// ------------------------------------------------------------------ terrain

/**
 * Ground colour at a world point, or K for bare dark earth.
 * The look: black dominates; green line-work and tufts; the cyan leyline
 * runs north along x=0 from spawn to the keep gate.
 *
 * `footprint` is how many world units one screen pixel spans at this depth —
 * distant samples widen thin features (the leyline must reach the horizon)
 * and thin out point features (or they alias into noise).
 */
export function groundColour(
  wx: number,
  wy: number,
  footprint = 1,
  t = 0,
): number {
  const ix = Math.floor(wx);
  const iy = Math.floor(wy);

  // --- the sacred pool: still water, ringed by ripple-light ---
  const gx = wx - GROVE_POS.x;
  const gy = wy - GROVE_POS.y;
  const gd = Math.sqrt(gx * gx + gy * gy);
  if (gd < POOL_R) {
    if (gd > POOL_R - 3) return BC;                       // bright rim
    // Rings travelling outward, so the surface is never quite still.
    const ring = (gd - t * 7) % 17;
    if (ring >= 0 && ring < 1.6) return C;
    if ((ix + iy) % 2 === 0) return B;
    return hash(ix, iy + 4242) < 60 ? BB : K;
  }
  // --- and the living ground that rings it ---
  if (gd < GROVE_R) {
    const lush = hash(ix, iy + 8080);
    if (lush < 150) return (ix + iy) % 2 === 0 ? G : BG;
    if (lush < 175) return BG;
  }

  // --- the leyline: bright core, dithered fringe, shining to the horizon ---
  const ax = Math.abs(wx);
  if (wy < KEEP_POS.y) {
    const core = Math.max(1.6, footprint * 0.7);
    if (ax < core) return footprint > 3 || (iy & 7) < 3 ? BC : C;
    if (ax < core + 3.4) return (ix + iy) % 2 === 0 ? C : K;
    if (ax < core + 6.4) return hash(ix, iy) < 140 ? C : K;
  }

  // --- moss patches: elliptical dithered blobs on a coarse lattice ---
  const mx = Math.floor(wx / 56);
  const my = Math.floor(wy / 56);
  const mh = hash(mx, my ^ 0x55);
  if (mh < 300 && footprint < 6) {
    const cx = mx * 56 + 12 + (mh % 32);
    const cy = my * 56 + 12 + ((mh >> 3) % 32);
    const dx = wx - cx;
    const dy = (wy - cy) * 2.6;
    if (dx * dx + dy * dy < 230) {
      if ((ix + iy) % 2 === 0 && hash(ix, iy + 9000) < 820) return G;
      if (hash(ix, iy + 9100) < 8) return BG;
    }
  }

  // --- grass tufts; both woodlands pack them denser than the open moor ---
  const woods = wx < WOODS_EDGE_X;
  const greenwood = wx > GREENWOOD_EDGE_X;
  const cell = woods || greenwood ? 7 : 11;
  const tx = Math.floor(wx / cell);
  const ty = Math.floor(wy / cell);
  const th = hash(tx, ty);
  // The old forest is dying: barely any ground cover left under it.
  const lively = woods ? 90 : greenwood ? 560 : 170;
  const density = footprint > 9 ? 25 : footprint > 3 ? 70 : lively;
  if (th < (footprint <= 3 ? lively : density)) {
    const px = tx * cell + (th % cell);
    const py = ty * cell + ((th >> 4) % cell);
    const dx = ix - px;
    const dy = iy - py;
    if (dy === 0 && dx >= -1 && dx <= 1) return greenwood && th < 60 ? BG : G;
    if (dy === -1 && dx === 0) return G;
  }

  // --- faint world-anchored contour dashes tie the ground together ---
  if ((iy & 31) === 0 && (ix & 7) < 3 && hash(ix >> 3, iy) < 500) return G;

  return K;
}

// ------------------------------------------------------------------ features

export interface Feature {
  x: number;
  y: number;
  sprite: Sprite;
  /** World height in units; width follows the sprite's aspect. */
  height: number;
  /** Landmarks stay visible (min on-screen scale) at any distance. */
  landmark?: boolean;
  /**
   * Level-of-detail swaps, best first: the first entry whose `minH`
   * (on-screen pixel height) the projection reaches is drawn instead of
   * `sprite`. Lets the keep grow a real facade as the player approaches.
   */
  lod?: ReadonlyArray<{ minH: number; sprite: Sprite }>;
}

const CHUNK = 96;
const chunkCache = new Map<string, Feature[]>();

/**
 * The keep, as masonry rather than a poster: two towers, a curtain wall,
 * and a gatehouse built from two piers under a lintel — so the archway is
 * a real hole you can see through and fly into.
 */
export const KEEP_BOXES: readonly Box[] = [
  { x: KEEP_POS.x - 72, y: KEEP_POS.y, w: 48, d: 48, base: 0, top: 120 },
  { x: KEEP_POS.x + 72, y: KEEP_POS.y, w: 48, d: 48, base: 0, top: 104 },
  { x: KEEP_POS.x, y: KEEP_POS.y + 6, w: 150, d: 28, base: 0, top: 76 },
  { x: KEEP_POS.x - 27, y: KEEP_POS.y - 14, w: 26, d: 46, base: 0, top: 98 },
  { x: KEEP_POS.x + 27, y: KEEP_POS.y - 14, w: 26, d: 46, base: 0, top: 98 },
  { x: KEEP_POS.x, y: KEEP_POS.y - 14, w: 80, d: 46, base: 74, top: 98 },
  // Crenellations: a merlon is just a small box on a parapet. The gap on
  // the right tower is where the crown came down.
  ...crenellate(KEEP_POS.x - 72, KEEP_POS.y, 48, 48, 120, 5),
  ...crenellate(KEEP_POS.x + 72, KEEP_POS.y, 48, 48, 104, 5).filter(
    (_, i) => i !== 1 && i !== 4,
  ),
  ...crenellate(KEEP_POS.x, KEEP_POS.y + 6, 150, 28, 76, 11),
  ...crenellate(KEEP_POS.x, KEEP_POS.y - 14, 80, 46, 98, 6),
];

/** Merlons along the top of a box: the tooth-and-gap of a battlement. */
function crenellate(
  cx: number,
  cy: number,
  w: number,
  d: number,
  top: number,
  count: number,
): Box[] {
  const out: Box[] = [];
  const pitch = w / count;
  for (let i = 0; i < count; i += 2) {
    out.push({
      x: cx - w / 2 + pitch * (i + 0.5),
      y: cy,
      w: pitch * 0.86,
      d,
      base: top,
      top: top + 9,
    });
  }
  return out;
}

/** The fixed, hand-placed world: the stone circle and the henge. */
const PLACED: Feature[] = [
  { x: CIRCLE_POS.x, y: CIRCLE_POS.y, sprite: DOLMEN, height: 26 },
  { x: CIRCLE_POS.x - 34, y: CIRCLE_POS.y - 14, sprite: STONE_L, height: 18 },
  { x: CIRCLE_POS.x + 30, y: CIRCLE_POS.y - 10, sprite: MENHIR, height: 16 },
  { x: CIRCLE_POS.x - 20, y: CIRCLE_POS.y + 26, sprite: STONE_M, height: 14 },
  { x: CIRCLE_POS.x + 22, y: CIRCLE_POS.y + 22, sprite: STONE_L, height: 17 },
  { x: CIRCLE_POS.x + 2, y: CIRCLE_POS.y + 34, sprite: STONE_S, height: 10 },
  { x: CIRCLE_POS.x - 48, y: CIRCLE_POS.y + 6, sprite: MENHIR, height: 15 },

  // The henge: five trilithons in a ring, each far taller than the mage,
  // with outliers fallen around them.
  ...[0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    return {
      x: HENGE_POS.x + Math.sin(a) * 150,
      y: HENGE_POS.y + Math.cos(a) * 150,
      sprite: TRILITHON,
      height: 112,
      landmark: true,
    };
  }),
  ...[0, 1, 2, 3, 4, 5].map((i) => {
    const a = (i / 6) * Math.PI * 2;
    return {
      x: HENGE_POS.x + Math.sin(a) * 250,
      y: HENGE_POS.y + Math.cos(a) * 250,
      sprite: i % 3 === 0 ? SARSEN_FALLEN : SARSEN_TALL,
      height: i % 3 === 0 ? 26 : 84,
    };
  }),

  // Oaks and birches standing around the sacred pool.
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const a = (i / 8) * Math.PI * 2 + 0.4;
    return {
      x: GROVE_POS.x + Math.sin(a) * 172,
      y: GROVE_POS.y + Math.cos(a) * 172,
      sprite: i % 3 === 0 ? TREE_BIRCH : TREE_OAK,
      height: i % 3 === 0 ? 58 : 70,
    };
  }),
];

function chunkFeatures(cx: number, cy: number): Feature[] {
  const key = `${cx},${cy}`;
  const hit = chunkCache.get(key);
  if (hit) return hit;

  const out: Feature[] = [];
  const baseX = cx * CHUNK;
  const baseY = cy * CHUNK;
  const woods = baseX < WOODS_EDGE_X;
  const greenwood = baseX > GREENWOOD_EDGE_X;
  // A stand per wooded chunk, the odd lone tree out on the open moor.
  const treeRolls = woods || greenwood ? 3 : 1;
  for (let i = 0; i < treeRolls; i++) {
    const h = hash(cx * 5 + i, cy * 7 + i * 3);
    if (h < (woods || greenwood ? 700 : 90)) {
      const kind = h % 5;
      const living = greenwood
        ? kind < 2
          ? TREE_OAK
          : kind < 4
            ? TREE_BIRCH
            : TREE_PINE_LIVE
        : kind < 2
          ? TREE_GNARLED_A
          : kind < 4
            ? TREE_GNARLED_B
            : TREE_DEAD_PINE;
      out.push({
        x: baseX + (h % CHUNK),
        y: baseY + ((h >> 3) % CHUNK),
        sprite: living,
        height: (greenwood ? 56 : 34) + (h % 5) * 6,
      });
    }
  }
  // Bracken and scrub, only where things still grow.
  if (greenwood) {
    const sh = hash(cx ^ 0x51ed, cy ^ 0x2f9a);
    if (sh < 620) {
      out.push({
        x: baseX + (sh % CHUNK),
        y: baseY + ((sh >> 5) % CHUNK),
        sprite: BUSH,
        height: 12 + (sh % 3) * 3,
      });
    }
  }
  // Boulders and lone stones, sparse everywhere.
  const bh = hash(cx ^ 0x9e37, cy ^ 0x79b9);
  if (bh < 120) {
    const kind = bh % 3;
    out.push({
      x: baseX + (bh % CHUNK),
      y: baseY + ((bh >> 2) % CHUNK),
      sprite: kind === 0 ? BOULDER : kind === 1 ? STONE_LEANING : STONE_S,
      height: 6 + (bh % 4) * 2,
    });
  }

  // Keep the leyline clear of clutter, and keep the sacred clearing and the
  // henge ring genuinely open — scattered woodland inside them would stand
  // between the player and the thing they came to see.
  const clear = out.filter((f) => {
    if (Math.abs(f.x) < 14 && f.y < KEEP_POS.y) return false;
    if (Math.hypot(f.x - GROVE_POS.x, f.y - GROVE_POS.y) < GROVE_R) return false;
    if (Math.hypot(f.x - HENGE_POS.x, f.y - HENGE_POS.y) < 210) return false;
    return true;
  });
  chunkCache.set(key, clear);
  return clear;
}

/**
 * The gate is a hole in the keep's wall: glide into it and you are inside.
 * `depth` is how far the gap runs back through the wall; `trigger` is how
 * close to the keep's heart you must get before the scene cuts to the
 * interior — small, so you fly right under the arch first rather than being
 * swallowed while the castle is still ahead of you.
 */
export const GATE = { halfW: 15, depth: 132, trigger: 26 } as const;

/**
 * Solid footprints the hero cannot glide through. The keep is a wall, not a
 * poster: you pull up at its facade — except at the gate, where `gapHalfW`
 * leaves the arch open.
 */
const BLOCKERS: ReadonlyArray<{
  x: number;
  y: number;
  halfW: number;
  halfD: number;
  gapHalfW?: number;
}> = [
  // Deep enough that pulling up at the wall frames the whole facade —
  // towers and all — rather than pressing the player's nose against the gate.
  {
    x: KEEP_POS.x,
    y: KEEP_POS.y,
    halfW: 92,
    halfD: GATE.depth,
    gapHalfW: GATE.halfW,
  },
];

/**
 * Slide a move against solid footprints: try the full move, then each axis
 * alone, so grazing a wall glides along it instead of sticking.
 */
export function resolveMove(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): { x: number; y: number } {
  const blocked = (x: number, y: number) =>
    BLOCKERS.some(
      (b) =>
        Math.abs(x - b.x) < b.halfW &&
        Math.abs(y - b.y) < b.halfD &&
        !(b.gapHalfW !== undefined && Math.abs(x - b.x) < b.gapHalfW),
    );
  if (!blocked(toX, toY)) return { x: toX, y: toY };
  if (!blocked(toX, fromY)) return { x: toX, y: fromY };
  if (!blocked(fromX, toY)) return { x: fromX, y: toY };
  return { x: fromX, y: fromY };
}

/** All features within `radius` of (x, y), plus every landmark. */
export function featuresNear(x: number, y: number, radius: number): Feature[] {
  const out: Feature[] = [];
  const c0x = Math.floor((x - radius) / CHUNK);
  const c1x = Math.floor((x + radius) / CHUNK);
  const c0y = Math.floor((y - radius) / CHUNK);
  const c1y = Math.floor((y + radius) / CHUNK);
  for (let cy = c0y; cy <= c1y; cy++) {
    for (let cx = c0x; cx <= c1x; cx++) out.push(...chunkFeatures(cx, cy));
  }
  for (const f of PLACED) {
    const dx = f.x - x;
    const dy = f.y - y;
    if (f.landmark || dx * dx + dy * dy < radius * radius) out.push(f);
  }
  return out;
}
