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
import { DOLMEN, STONE_L, STONE_M, STONE_S } from "@/lib/rpg/assets";
import {
  BUSH,
  FALLEN_LOG,
  MUSHROOM_PATCH,
  SARSEN_FALLEN,
  SARSEN_TALL,
  TREE_BIRCH,
  TREE_OAK,
  TREE_PINE_LIVE,
  TRILITHON,
} from "@/lib/rpg/flora";
import { fbm, rampColour, type Ramp } from "@/lib/rpg/dither";
import { B, BB, BC, BG, C, G, K, W } from "@/lib/rpg/palette";
import { hash, type Sprite } from "@/lib/rpg/screen";
import type { Box } from "@/lib/rpg/structures";
import {
  VILLAGE_BOXES,
  VILLAGE_POS,
  VILLAGE_PROPS,
} from "@/lib/rpg/village";

export { VILLAGE_POS } from "@/lib/rpg/village";

// ------------------------------------------------------------------- places

/** The keep the player can see from spawn and walk to. */
export const KEEP_POS = { x: 0, y: 1400 };
/** Shared exterior/interior footprint. */
export const KEEP_SIZE = { width: 288, depth: 320 } as const;
/** The visible south threshold where the leyline enters the keep. */
export const KEEP_GATE_Y = KEEP_POS.y - KEEP_SIZE.depth / 2;
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
 * Biome ground ramps, dark to light. Every one starts at black: the moor is
 * lit by nothing but the leyline, and shadow is the ground's resting state.
 * Steps are neighbours in tone, so a cell shaded between two of them holds
 * exactly two colours and survives the attribute pass unaltered.
 */
const GROUND_RAMP: Ramp = [K, K, G, BG];

/**
 * Smooth 0..1 crossing between two world coordinates. The bands used to
 * differ by which ramp they picked, which put a hard seam down the map where
 * one gave way to the next — invisible when the ground was sparse marks,
 * glaring once it is shaded. Every biome now sits on the one ramp and differs
 * only in how far up it it sits, blended across a wide margin.
 */
function band(v: number, a: number, b: number): number {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * How far up its ramp the ground mat sits, and so how much of the near moor
 * is lit at all. This is the dial between the two things the look wants at
 * once: the design's black-dominant moor, and the density that makes dither
 * shading read as ground rather than as scattered marks.
 *
 * The noise field averages 0.5, so this lands almost exactly on the fraction
 * of near ground that takes green. It is touchy — the ramp step is a hard
 * boundary, so 0.8 thins back out into the old line-work and 1.2 closes the
 * mat over and hands the frame to green. Distance scales it down on top.
 */
const MAT_DENSITY = 1.05;

/**
 * Ground colour at a world point, or K for bare dark earth.
 * The look: black dominates; the ground is *shaded* rather than stippled —
 * a smooth lushness field resolved into two neighbouring ramp colours by an
 * ordered dither. The cyan leyline runs north along x=0 to the keep gate.
 *
 * `footprint` is how many world units one screen pixel spans at this depth —
 * distant samples widen thin features (the leyline must reach the horizon)
 * and thin out point features (or they alias into noise).
 *
 * `sx`/`sy` are the *screen* pixel being painted. The dither threshold has to
 * be screen-anchored, like the attribute grid: fixed to the glass while the
 * world turns beneath it. Anchored in world space it swims and aliases as the
 * camera rotates. `far` is the distance falloff, 1 near and 0 at the horizon;
 * it scales the whole field, so detail thins into the dark on its own instead
 * of needing cutoffs.
 */
export function groundColour(
  wx: number,
  wy: number,
  footprint = 1,
  t = 0,
  sx = 0,
  sy = 0,
  far = 1,
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
  // --- village lane and yard: a swept yard, not moorland ---
  // Bare earth with a cobble stipple, and no mat over it — the village reads
  // as trodden ground precisely because the shading stops at its edge.
  const vx = wx - VILLAGE_POS.x;
  const vy = wy - VILLAGE_POS.y;
  const villageSquare = Math.abs(vx) < 82 && Math.abs(vy) < 138;
  const southLane = Math.abs(vx) < 17 && vy > -250 && vy < -100;
  if (villageSquare || southLane) {
    const cobble = hash(ix >> 1, iy >> 1);
    if (cobble < 95 && (ix + iy) % 3 === 0) return W;
    if ((iy & 15) === 0 && (ix & 7) < 3) return W;
    return K;
  }

  // --- the leyline: bright core, dithered fringe, shining to the horizon ---
  const ax = Math.abs(wx);
  if (wy < KEEP_POS.y) {
    const core = Math.max(1.6, footprint * 0.7);
    if (ax < core) return footprint > 3 || (iy & 7) < 3 ? BC : C;
    if (ax < core + 3.4) return (ix + iy) % 2 === 0 ? C : K;
    if (ax < core + 6.4) return hash(ix, iy) < 140 ? C : K;
  }

  // --- the mat: two octaves of noise dithered into a ramp ---
  let level = (fbm(hash, wx, wy, 90) * 0.62 + fbm(hash, wx, wy, 26) * 0.38) * MAT_DENSITY;

  // --- biome: dying woodland west, living greenwood east, moor between ---
  const dead = 1 - band(wx, DEAD_WOOD_X - 130, DEAD_WOOD_X + 130);
  const greenwood = band(wx, GREENWOOD_EDGE_X - 130, GREENWOOD_EDGE_X + 130);
  // The greenwood lift stays small on purpose: much past this the field never
  // dips back below the ramp's black step and the wood goes solid green.
  level += greenwood * 0.12 - dead * 0.5;

  // --- the living ground ringing the sacred pool lifts the whole field ---
  if (gd < GROVE_R) level += 0.34 * (1 - gd / GROVE_R);

  // --- moss patches: elliptical blooms on a coarse lattice ---
  const mx = Math.floor(wx / 56);
  const my = Math.floor(wy / 56);
  const mh = hash(mx, my ^ 0x55);
  if (mh < 300 && footprint < 6) {
    const cx = mx * 56 + 12 + (mh % 32);
    const cy = my * 56 + 12 + ((mh >> 3) % 32);
    const dx = wx - cx;
    const dy = (wy - cy) * 2.6;
    if (dx * dx + dy * dy < 230) level += 0.16;
  }

  // --- tufts standing proud, and bare scrapes worn through ---
  // Per-pixel detail only survives close up; further out it aliases into
  // noise, and the falloff is already thinning the field for us.
  //
  // This is the one part of the shading that is not attribute-cheap. The
  // smooth field crosses at most one ramp step inside an 8x8 cell, so it
  // leaves the clash pass almost nothing to do (measured: 18 of 608 cells
  // over two colours). These per-pixel jumps are large enough to skip a step,
  // which takes it to 179 of 608. It stays because the pass absorbs it
  // invisibly — strays merge to the nearest ramp neighbour, which is a tonal
  // nudge rather than a break — and because without it the ground shades too
  // smoothly to read as 8-bit. Widen the jumps and that stops being true.
  if (footprint < 3) {
    const tuft = hash(ix, iy);
    if (tuft < 70 + greenwood * 25) level += 0.22;
    else if (tuft > 972) level -= 0.4;
  }

  // --- loose stones scattered through it ---
  if (
    dead < 0.5 &&
    footprint < 2.5 &&
    hash(ix >> 2, iy >> 2) < 5 &&
    (ix & 3) < 2 &&
    (iy & 3) < 2
  ) {
    return W;
  }

  return rampColour(GROUND_RAMP, level * far, sx, sy);
}

// ------------------------------------------------------------------ features

export interface Feature {
  /** Named so a scene can omit it — you cannot see the keep from its roof. */
  id?: string;
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
 * and a gatehouse built from two piers under a lintel. A warded oak door
 * closes the opening and marks the direct transition into the roofed hall.
 */
export const KEEP_BOXES: readonly Box[] = [
  // Four corner towers establish the same footprint as the nine-cell hall.
  { x: KEEP_POS.x - 108, y: KEEP_POS.y - 124, w: 72, d: 72, base: 0, top: 120, detail: "tower" },
  { x: KEEP_POS.x + 108, y: KEEP_POS.y - 124, w: 72, d: 72, base: 0, top: 104, detail: "tower" },
  { x: KEEP_POS.x - 108, y: KEEP_POS.y + 124, w: 72, d: 72, base: 0, top: 108, detail: "tower" },
  { x: KEEP_POS.x + 108, y: KEEP_POS.y + 124, w: 72, d: 72, base: 0, top: 96, detail: "tower" },
  // Front wall split around a real 56-unit opening, plus the other sides.
  { x: KEEP_POS.x - 86, y: KEEP_GATE_Y + 14, w: 116, d: 28, base: 0, top: 76, detail: "wall" },
  { x: KEEP_POS.x + 86, y: KEEP_GATE_Y + 14, w: 116, d: 28, base: 0, top: 76, detail: "wall" },
  { x: KEEP_POS.x, y: KEEP_POS.y + 146, w: 288, d: 28, base: 0, top: 76, detail: "wall" },
  { x: KEEP_POS.x - 130, y: KEEP_POS.y, w: 28, d: 320, base: 0, top: 76, detail: "wall" },
  { x: KEEP_POS.x + 130, y: KEEP_POS.y, w: 28, d: 320, base: 0, top: 76, detail: "wall" },
  // Gatehouse piers project south of the wall; the lintel is high enough to
  // pass beneath and is therefore absent from ground collision.
  { x: KEEP_POS.x - 44, y: KEEP_GATE_Y - 9, w: 32, d: 46, base: 0, top: 98, detail: "gate" },
  { x: KEEP_POS.x + 44, y: KEEP_GATE_Y - 9, w: 32, d: 46, base: 0, top: 98, detail: "gate" },
  { x: KEEP_POS.x, y: KEEP_GATE_Y - 8, w: 52, d: 3, base: 0, top: 70, detail: "door" },
  { x: KEEP_POS.x, y: KEEP_GATE_Y - 9, w: 120, d: 46, base: 74, top: 98, detail: "gate" },
  // Crenellations use the same wall runs, so the silhouette follows the
  // collision footprint rather than an unrelated facade.
  ...crenellate(KEEP_POS.x - 108, KEEP_POS.y - 124, 72, 72, 120, 7),
  ...crenellate(KEEP_POS.x + 108, KEEP_POS.y - 124, 72, 72, 104, 7).filter(
    (_, i) => i !== 1 && i !== 4,
  ),
  ...crenellate(KEEP_POS.x - 108, KEEP_POS.y + 124, 72, 72, 108, 7),
  ...crenellate(KEEP_POS.x + 108, KEEP_POS.y + 124, 72, 72, 96, 7),
  ...crenellate(KEEP_POS.x - 86, KEEP_GATE_Y + 14, 116, 28, 76, 8),
  ...crenellate(KEEP_POS.x + 86, KEEP_GATE_Y + 14, 116, 28, 76, 8),
  ...crenellate(KEEP_POS.x, KEEP_POS.y + 146, 288, 28, 76, 18),
  ...crenellateY(KEEP_POS.x - 130, KEEP_POS.y, 28, 320, 76, 20),
  ...crenellateY(KEEP_POS.x + 130, KEEP_POS.y, 28, 320, 76, 20),
  ...crenellate(KEEP_POS.x, KEEP_GATE_Y - 9, 120, 46, 98, 8),
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

/** Merlons along a north/south wall. */
function crenellateY(
  cx: number,
  cy: number,
  w: number,
  d: number,
  top: number,
  count: number,
): Box[] {
  const out: Box[] = [];
  const pitch = d / count;
  for (let i = 0; i < count; i += 2) {
    out.push({
      x: cx,
      y: cy - d / 2 + pitch * (i + 0.5),
      w,
      d: pitch * 0.86,
      base: top,
      top: top + 9,
    });
  }
  return out;
}

/** The fixed, hand-placed world: the stone circle and the henge. */
const PLACED: Feature[] = [
  ...VILLAGE_PROPS,
  // Opening tableau: pale sarsens establish the near, middle, and far planes
  // visible in the reference frame while remaining ordinary world objects.
  { x: 126, y: 220, sprite: SARSEN_FALLEN, height: 22 },
  { x: -138, y: 236, sprite: SARSEN_TALL, height: 62 },
  { x: 92, y: 244, sprite: MENHIR, height: 42 },
  { x: -236, y: 410, sprite: SARSEN_TALL, height: 70 },
  { x: 178, y: 390, sprite: SARSEN_TALL, height: 68 },

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
  const treeRolls = greenwood ? 4 : woods ? 4 : 1;
  for (let i = 0; i < treeRolls; i++) {
    const h = hash(cx * 5 + i, cy * 7 + i * 3);
    if (h < (greenwood ? 520 : woods ? 620 : 90)) {
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
    for (let i = 0; i < 2; i++) {
      const sh = hash((cx ^ 0x51ed) + i * 31, cy ^ 0x2f9a);
      if (sh < 560) {
        out.push({
          x: baseX + (sh % CHUNK),
          y: baseY + ((sh >> 5) % CHUNK),
          sprite: BUSH,
          height: 11 + (sh % 4) * 3,
        });
      }
    }
    // Fallen timber and small bright fungi break the wood into authored
    // clearings like the reference, rather than an even wall of tree cards.
    const dh = hash(cx ^ 0x63d1, cy ^ 0x4ac7);
    if (dh < 330) {
      out.push({
        x: baseX + ((dh * 3) % CHUNK),
        y: baseY + ((dh * 7) % CHUNK),
        sprite: dh < 190 ? FALLEN_LOG : MUSHROOM_PATCH,
        height: dh < 190 ? 14 : 10,
      });
    }
  }
  // Boulders and lone stones, sparse everywhere.
  const bh = hash(cx ^ 0x9e37, cy ^ 0x79b9);
  if (bh < 180) {
    const kind = bh % 3;
    out.push({
      x: baseX + (bh % CHUNK),
      y: baseY + ((bh >> 2) % CHUNK),
      sprite: kind === 0 ? SARSEN_FALLEN : kind === 1 ? STONE_LEANING : MENHIR,
      height: 8 + (bh % 5) * 2,
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
 * Glide into the warded door and cross directly into the roofed hall.
 * `trigger` is shallow so the transition happens at the timber threshold.
 */
export const GATE = {
  halfW: 28,
  y: KEEP_GATE_Y + 10,
  trigger: 18,
  doorstepY: KEEP_GATE_Y - 34,
} as const;

/**
 * Solid footprints the hero cannot glide through. The keep is a wall, not a
 * poster: you pull up at its facade, with only the scripted door passable.
 */
const WORLD_COLLIDERS = [...KEEP_BOXES, ...VILLAGE_BOXES].filter(
  (box) =>
    box.base === 0 && box.detail !== "door" && box.detail !== "timberDoor",
);
const OUTDOOR_BODY_R = 10;

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
    WORLD_COLLIDERS.some(
      (box) =>
        Math.abs(x - box.x) < box.w / 2 + OUTDOOR_BODY_R &&
        Math.abs(y - box.y) < box.d / 2 + OUTDOOR_BODY_R,
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
