// Interiors: grid-plan rooms drawn with a raycaster, sharing the outdoor
// camera exactly. Walls are white line-work over black — stone courses and
// corner posts rather than filled texture — so a chamber reads like the
// keep's facade seen from the inside.

import { NPC_SEER, NPC_SHADE } from "@/lib/rpg/bestiary";
import { EXIT_ARCH, ITEM_KEY, ITEM_TORC, TORC_FRAMES } from "@/lib/rpg/items";
import { BC, BW, BY, C, K, W, Y } from "@/lib/rpg/palette";
import type { Actor } from "@/lib/rpg/interact";
import {
  BANNER,
  BRAZIER,
  LEY_FONT,
  TORCH_FLAME_ALT,
  WALL_TORCH,
} from "@/lib/rpg/props";
import { ROOF_HATCH } from "@/lib/rpg/tower";
import {
  CAM_BACK,
  CAM_HEIGHT,
  FOCAL,
  drawBillboards,
  eyeHeight,
  eyeOf,
  forward,
  groundRow,
  heightRow,
  type Billboard,
  type CameraState,
} from "@/lib/rpg/projection";
import {
  HORIZON,
  HUD_TOP,
  SCREEN_W,
  Screen,
  hash,
  type Sprite,
} from "@/lib/rpg/screen";

/** World units per grid cell. */
export const CELL = 32;
/** Wall height in world units. */
const WALL_H = 104;
/** Height of one masonry course, in world units. */
const COURSE_H = 26;
/** Length of one stone along a wall face, in world units. */
const STONE_W = 32;
/** How high the keep's roof stands above the moor. */
export const ROOF_HEIGHT = 108;

export interface Interior {
  readonly id: string;
  /** People, items and the way out. */
  readonly actors: readonly Actor[];
  /** Row strings: '#' solid, '.' floor, 'X' the way back outdoors. */
  readonly plan: readonly string[];
  /** Props standing in the room, in world units. */
  readonly props: readonly Billboard[];
  /** Where a ley vein runs across the floor, in cell x. */
  readonly leyCellX: number;
  /**
   * A stair: as the mage walks from `baseY` to `topY` (world units) the
   * floor under her rises from 0 to `rise`. Continuous, so the climb is
   * real time rather than a cut to another room.
   */
  readonly climb?: { baseY: number; topY: number; rise: number };
  /**
   * Height of this room's walls. A stair shaft needs walls taller than the
   * climb itself, or you rise above your own stonework and the shaft turns
   * into a fence.
   */
  readonly wallHeight?: number;
}

/** Floor height under a point in this interior. Flat rooms return 0. */
export function floorHeightAt(interior: Interior, y: number): number {
  const c = interior.climb;
  if (!c) return 0;
  const t = (c.baseY - y) / (c.baseY - c.topY);
  return c.rise * Math.max(0, Math.min(1, t));
}

/** A prop placed by grid cell rather than raw world units. */
function at(
  cx: number,
  cy: number,
  sprite: Sprite,
  height: number,
  extra: Partial<Billboard> = {},
): Billboard {
  return { x: (cx + 0.5) * CELL, y: (cy + 0.5) * CELL, sprite, height, ...extra };
}

/** Torches breathe: two frames alternating, bracket pixels identical. */
const TORCH_FRAMES = [WALL_TORCH, TORCH_FLAME_ALT];

/**
 * The keep: a south entrance corridor, a great hall, and a sanctum at the
 * back holding the ley-font. Row 0 is the far (north) end.
 */
export const KEEP_INTERIOR: Interior = {
  id: "keep",
  plan: [
    "#########",
    "###...###",
    "###...###",
    "###...###",
    "#.......#",
    "#.......#",
    "#.......#",
    "###...###",
    "###...###",
    "####X####",
  ],
  props: [
    // The sanctum, and what the whole crossing was for.
    at(4, 1.3, LEY_FONT, 34, { solid: 12 }),
    // Great hall: braziers at the corners, banners on the far wall.
    at(1.2, 4.6, BRAZIER, 30, { solid: 12, light: 62 }),
    at(6.8, 4.6, BRAZIER, 30, { solid: 12, light: 62 }),
    at(2.4, 4.15, BANNER, 34, { elevate: 34 }),
    at(5.6, 4.15, BANNER, 34, { elevate: 34 }),
    // Sconces lighting the way in.
    at(2.8, 5.5, WALL_TORCH, 22, { elevate: 40, frames: TORCH_FRAMES, light: 44 }),
    at(5.2, 5.5, WALL_TORCH, 22, { elevate: 40, frames: TORCH_FRAMES, light: 44 }),
    at(3.15, 7.6, WALL_TORCH, 22, { elevate: 38, frames: TORCH_FRAMES, light: 44 }),
    at(4.85, 7.6, WALL_TORCH, 22, { elevate: 38, frames: TORCH_FRAMES, light: 44 }),
  ],
  actors: [
    {
      // The archway that used to be scenery: now the way up the tower.
      ...at(4, 3.35, EXIT_ARCH, 76),
      id: "keep-stair",
      reach: 48,
      label: "CLIMB THE TOWER STAIR",
      interaction: { kind: "enter", site: "tower" },
    },
    {
      ...at(4, 8.7, EXIT_ARCH, 82),
      id: "keep-exit",
      reach: 60,
      label: "LEAVE THE KEEP",
      interaction: { kind: "exit" },
    },
    {
      ...at(2.1, 5.5, NPC_SHADE, 30),
      id: "keep-shade",
      reach: 42,
      label: "SPEAK TO THE SHADE",
      interaction: {
        kind: "talk",
        name: "THE SHADE",
        lines: [
          "I HELD THIS GATE FOR NINE WINTERS. THE COLD TOOK ME BEFORE THE ENEMY DID.",
          "THE LEY RUNS DEEP UNDER THIS FLOOR. FOLLOW IT NORTH AND IT WILL SHOW YOU THE FONT.",
          "TAKE WHAT YOU FIND THERE. IT IS NO USE TO THE DEAD.",
        ],
      },
    },
    {
      ...at(6.1, 5.9, ITEM_TORC, 13, { glow: true, frames: TORC_FRAMES, fps: 4 }),
      id: "keep-torc",
      reach: 56,
      label: "TAKE THE TORC",
      interaction: {
        kind: "pickup",
        item: "TORC",
        onTake: "YOU TAKE THE TORC. IT IS WARM, AND IT HUMS LIKE A STRUCK WIRE.",
      },
    },
    {
      ...at(3.35, 1.6, NPC_SEER, 26),
      id: "keep-seer",
      reach: 40,
      label: "SPEAK TO THE SEER",
      interaction: {
        kind: "talk",
        name: "THE SEER",
        lines: [
          "I SAT DOWN HERE TO READ THE WATER AND I HAVE NOT STOOD UP SINCE. THAT WAS SOME TIME AGO.",
          "THE FONT SHOWS WHAT THE LEY REMEMBERS. IT REMEMBERS A DRAGON, AND IT REMEMBERS A KING.",
          "THERE IS A KEY IN THE EAST ALCOVE. I HAVE NO USE FOR DOORS.",
        ],
      },
    },
    {
      ...at(6.5, 4.7, ITEM_KEY, 15, { glow: true }),
      id: "keep-key",
      reach: 56,
      label: "TAKE THE IRON KEY",
      interaction: {
        kind: "pickup",
        item: "IRON KEY",
        onTake: "AN OLD IRON KEY, COLD AS THE FLOOR IT LAY ON. SOMETHING HERE STILL LOCKS.",
      },
    },
  ],
  leyCellX: 4,
};

/**
 * The keep's stair: a straight flight rising the height of the wall. Walk
 * north and the floor comes up under you; the shaft's stonework slides down
 * past the eye as you go. 'X' at the foot returns you to the great hall.
 */
export const TOWER_INTERIOR: Interior = {
  id: "tower",
  plan: [
    "#####",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "##X##",
  ],
  props: [
    at(1.4, 5.6, WALL_TORCH, 20, { elevate: 34, frames: TORCH_FRAMES }),
    at(3.6, 3.4, WALL_TORCH, 20, { elevate: 34, frames: TORCH_FRAMES }),
  ],
  actors: [
    {
      ...at(2, 1.15, ROOF_HATCH, 26),
      id: "tower-roof",
      reach: 48,
      label: "CLIMB OUT ONTO THE ROOF",
      interaction: { kind: "roof" },
    },
    {
      ...at(2, 7, EXIT_ARCH, 60),
      id: "tower-down",
      reach: 44,
      label: "GO BACK DOWN",
      interaction: { kind: "exit" },
    },
  ],
  leyCellX: 2,
  // Rise the full height of the wall over the length of the flight.
  climb: { baseY: 7 * CELL, topY: 1.2 * CELL, rise: ROOF_HEIGHT },
  // Stonework well above the top of the climb, so there is always shaft
  // overhead however high she has risen.
  wallHeight: ROOF_HEIGHT + WALL_H,
};

export function cellAt(interior: Interior, cx: number, cy: number): string {
  if (cy < 0 || cy >= interior.plan.length) return "#";
  const row = interior.plan[cy];
  if (cx < 0 || cx >= row.length) return "#";
  return row.charAt(cx);
}

function solid(interior: Interior, cx: number, cy: number): boolean {
  return cellAt(interior, cx, cy) === "#";
}

/** Distance from a point to the first interior wall along `yaw`. */
export function interiorRayRange(
  interior: Interior,
  x: number,
  y: number,
  yaw: number,
  maximum: number,
): number {
  const fx = Math.sin(yaw);
  const fy = Math.cos(yaw);
  for (let distance = 6; distance <= maximum; distance += 3) {
    const wx = x + fx * distance;
    const wy = y + fy * distance;
    if (solid(interior, Math.floor(wx / CELL), Math.floor(wy / CELL))) {
      return Math.max(8, distance - 3);
    }
  }
  return maximum;
}

/** Centre of a cell in world units. */
export function cellCentre(cx: number, cy: number): { x: number; y: number } {
  return { x: (cx + 0.5) * CELL, y: (cy + 0.5) * CELL };
}

/** Where the player stands (and which way they face) on entering. */
export function entryOf(interior: Interior): CameraState {
  const exitRow = interior.plan.findIndex((r) => r.includes("X"));
  const exitCol = interior.plan[exitRow].indexOf("X");
  const { x, y } = cellCentre(exitCol, exitRow);
  // Face up the plan (toward row 0), and stand far enough in that the eye —
  // which trails CAM_BACK behind — is already inside the doorway.
  return { x, y: y - Math.min(CAM_BACK * 0.75, CELL * 0.75), yaw: Math.PI };
}

/** True when the player has stepped back onto the exit cell. */
export function onExit(interior: Interior, x: number, y: number): boolean {
  return cellAt(interior, Math.floor(x / CELL), Math.floor(y / CELL)) === "X";
}

/** Slide a move against the room's walls, keeping a body radius clear. */
export function resolveInteriorMove(
  interior: Interior,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): { x: number; y: number } {
  const R = 8;
  const blocked = (x: number, y: number) => {
    for (const [ox, oy] of [
      [-R, -R],
      [R, -R],
      [-R, R],
      [R, R],
    ]) {
      if (solid(interior, Math.floor((x + ox) / CELL), Math.floor((y + oy) / CELL))) {
        return true;
      }
    }
    // Furniture stops you too — you should not be able to drift through the
    // font you crossed the moor for.
    for (const prop of interior.props) {
      if (prop.solid === undefined) continue;
      const dx = x - prop.x;
      const dy = y - prop.y;
      const reach = prop.solid + R;
      if (dx * dx + dy * dy < reach * reach) return true;
    }
    return false;
  };
  if (!blocked(toX, toY)) return { x: toX, y: toY };
  if (!blocked(toX, fromY)) return { x: toX, y: fromY };
  if (!blocked(fromX, toY)) return { x: fromX, y: toY };
  return { x: fromX, y: fromY };
}

// ------------------------------------------------------------------- light

/**
 * How brightly the room's fires reach a point on the floor, 0..1. Torch
 * light is the one warm thing in a keep made of white line-work, and it is
 * what stops a chamber reading as a diagram.
 *
 * Pools are summed rather than maxed — two fires facing each other across a
 * hall brighten the middle, which is the whole reason for lighting it from
 * both sides — and the falloff is cubic. Quadratic left a quarter of full
 * brightness still standing at half the radius, which is what turned the
 * flags into one flat sheet of yellow instead of two pools of firelight.
 */
function litness(interior: Interior, wx: number, wy: number): number {
  let total = 0;
  for (const p of interior.props) {
    if (!p.light) continue;
    const dx = wx - p.x;
    const dy = wy - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= p.light) continue;
    total += (1 - d / p.light) ** 3;
  }
  return Math.min(1, total);
}

// ------------------------------------------------------------------- floor

/**
 * Flagstones are one per grid cell — big slabs, not a fine tiling. A dense
 * grid reads as texture (and no Spectrum game could afford texture); sparse
 * slab joints read as architecture.
 */
function floorColour(interior: Interior, wx: number, wy: number): number {
  const veinX = (interior.leyCellX + 0.5) * CELL;
  const d = Math.abs(wx - veinX);
  // The core is broken along its length rather than solid: crossed at a
  // glancing angle a solid vein turns the whole near floor into one cyan
  // slab, which reads as a painted stripe instead of light under stone.
  if (d < 1.6) return Math.floor(wy) % 5 === 0 ? C : BC;
  if (d < 6 && (Math.floor(wx) + Math.floor(wy)) % 2 === 0) return C;
  const jx = ((wx % CELL) + CELL) % CELL;
  const jy = ((wy % CELL) + CELL) % CELL;
  if (jx < 1.4 || jy < 1.4) return W;
  return K;
}

/**
 * 4x4 ordered dither. The walls no longer need it — they fill solid — but
 * firelight does: a torch pool has to fade out over the flags, and a hard
 * edge on a pool of light reads as a painted disc.
 */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function toned(x: number, y: number, level: number): boolean {
  return BAYER[(y & 3) * 4 + (x & 3)] < level * 16;
}

/**
 * The ceiling, as beams crossing the hall.
 *
 * It is the same plane as the floor, mirrored above the eye, so a beam and a
 * flagstone joint at the same depth land on rows equidistant from the
 * horizon and the room closes. Without it the chamber has no lid: everything
 * above the wall tops is void, and a room open to a black sky reads as a pen
 * rather than an interior. Beams only — a full coffered grid up there would
 * out-draw the floor, and the floor is where the player is looking.
 */
function drawCeiling(s: Screen, interior: Interior, cam: CameraState): void {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  const above = (interior.wallHeight ?? WALL_H) - eyeHeight(cam);
  if (above <= 2) return;
  for (let sy = 1; sy < HORIZON; sy++) {
    const dist = (above * FOCAL) / (HORIZON - sy);
    // Far beams converge into a single flickering line; let them go dark and
    // keep the vanishing point clean.
    if (dist > 620) continue;
    const faint = dist > 380;
    for (let sx = 0; sx < SCREEN_W; sx++) {
      const lat = ((sx - 128) * dist) / FOCAL;
      const wx = ex + fx * dist + fy * lat;
      const wy = ey + fy * dist - fx * lat;
      // One beam per grid cell, crossing the room's short axis, with a
      // ridge purlin running the length of it.
      const beam = ((wy % CELL) + CELL) % CELL < 2.2;
      const purlin = Math.abs(((wx % CELL) + CELL) % CELL - CELL / 2) < 1.1;
      if (!beam && !purlin) continue;
      if (faint && (sx + sy) % 2 !== 0) continue;
      s.fb[sy * SCREEN_W + sx] = beam ? W : C;
    }
  }
}

function drawFloor(s: Screen, interior: Interior, cam: CameraState): void {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  for (let sy = HORIZON + 1; sy < HUD_TOP; sy++) {
    const dist = (CAM_HEIGHT * FOCAL) / (sy - HORIZON);
    // Past this the slab joints alias into speckle, so the far floor goes
    // dark and only the ley vein carries on into the black.
    if (dist > 700) continue;
    const faint = dist > 480;
    for (let sx = 0; sx < SCREEN_W; sx++) {
      const lat = ((sx - 128) * dist) / FOCAL;
      const wx = ex + fx * dist + fy * lat;
      const wy = ey + fy * dist - fx * lat;
      const colour = floorColour(interior, wx, wy);
      // Firelight pools on the flags before anything else is drawn on them.
      const lit = litness(interior, wx, wy);
      // Firelight only fills the dark between the flags — the slab joints
      // stay white, so the floor keeps its drawing under the glow.
      if (colour === K && lit > 0.05 && toned(sx, sy, lit * 0.72)) {
        s.fb[sy * SCREEN_W + sx] = lit > 0.55 ? BY : Y;
        continue;
      }
      if (colour === K) continue;
      if (faint && colour === W && (sx + sy) % 2 !== 0) continue;
      s.fb[sy * SCREEN_W + sx] = colour;
    }
  }
}

// ------------------------------------------------------------------- walls

interface Hit {
  mapX: number;
  mapY: number;
  side: number;
  z: number;
  top: number;
  bot: number;
  /** Where on the wall the ray landed, in world units — used for lighting. */
  hitX: number;
  hitY: number;
}

/** One DDA per screen column; null where the ray escaped the plan. */
function castColumns(interior: Interior, cam: CameraState): (Hit | null)[] {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  const eyeY = eyeHeight(cam);
  const rx = fy;
  const ry = -fx;
  const px = ex / CELL;
  const py = ey / CELL;
  const out: (Hit | null)[] = [];

  for (let sx = 0; sx < SCREEN_W; sx++) {
    const k = (sx - 128) / FOCAL;
    const dirX = fx + rx * k;
    const dirY = fy + ry * k;

    let mapX = Math.floor(px);
    let mapY = Math.floor(py);
    const deltaX = dirX === 0 ? Infinity : Math.abs(1 / dirX);
    const deltaY = dirY === 0 ? Infinity : Math.abs(1 / dirY);
    const stepX = dirX < 0 ? -1 : 1;
    const stepY = dirY < 0 ? -1 : 1;
    let sideDistX = dirX < 0 ? (px - mapX) * deltaX : (mapX + 1 - px) * deltaX;
    let sideDistY = dirY < 0 ? (py - mapY) * deltaY : (mapY + 1 - py) * deltaY;

    let side = 0;
    let hit = false;
    for (let guard = 0; guard < 64 && !hit; guard++) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaY;
        mapY += stepY;
        side = 1;
      }
      if (solid(interior, mapX, mapY)) hit = true;
    }
    if (!hit) {
      out.push(null);
      continue;
    }

    const perp =
      side === 0
        ? (mapX - px + (1 - stepX) / 2) / dirX
        : (mapY - py + (1 - stepY) / 2) / dirY;
    const z = perp * CELL;
    if (z <= 1) {
      out.push(null);
      continue;
    }
    out.push({
      mapX,
      mapY,
      side,
      z,
      // Walls are anchored to absolute zero, so climbing brings their tops
      // down toward the eye — the sensation of rising through a shaft. The
      // base is clipped to the floor at the mage's feet, which hides the
      // stonework below the step she is standing on.
      top: heightRow(interior.wallHeight ?? WALL_H, z, eyeY),
      bot: Math.min(groundRow(z, eyeY), groundRow(z)),
      // Where on the wall the ray landed, so firelight can warm the stone.
      hitX: (px + perp * dirX) * CELL,
      hitY: (py + perp * dirY) * CELL,
    });
  }
  return out;
}

/**
 * Walls as flat FACES, not textured columns: group the columns that hit the
 * same wall face, fill it solid BLACK, and draw it in white line-work — the
 * keep's facade seen from the inside, and the same polarity as everything
 * else in the game. Solid is the point either way: a dithered face lets what
 * is behind it show through and reads as mesh. Filling with paper rather
 * than ink is what keeps a chamber from turning the screen white.
 *
 * With the body black, every line carries the geometry: the joint where the
 * wall meets floor and ceiling, the vertical seam at each corner, and a
 * course line partway up to give the stone a scale to be read against.
 */
function drawWalls(s: Screen, interior: Interior, cam: CameraState): Float32Array {
  const hits = castColumns(interior, cam);
  // Per-column wall distance, handed to the billboard pass so stone can hide
  // what stands behind it. Infinity where the ray escaped the plan.
  const depth = new Float32Array(SCREEN_W).fill(Infinity);
  for (let i = 0; i < SCREEN_W; i++) {
    const hit = hits[i];
    if (hit) depth[i] = hit.z;
  }
  let x = 0;
  while (x < SCREEN_W) {
    const face = hits[x];
    if (!face) {
      x++;
      continue;
    }
    let end = x;
    while (end + 1 < SCREEN_W) {
      const next = hits[end + 1];
      if (
        !next ||
        next.mapX !== face.mapX ||
        next.mapY !== face.mapY ||
        next.side !== face.side
      ) {
        break;
      }
      end++;
    }

    const mid = hits[(x + end) >> 1] ?? face;
    // The two whites are the only value steps there are, and they are spent
    // on the one distinction worth having: near faces come forward, far ones
    // sit back. Faces square to the plan's two axes take different ones so
    // that a corner reads as a corner rather than as a line on a flat hole.
    const line = mid.z < 200 && face.side === 0 ? BW : W;

    // Courses at fixed WORLD heights, projected per column, so they converge
    // with the face instead of running parallel to the screen.
    const height = interior.wallHeight ?? WALL_H;
    const eyeY = eyeHeight(cam);
    const courses: number[] = [];
    for (let h = COURSE_H; h < height - 1; h += COURSE_H) courses.push(h);
    // A one-column corner post on a face two pixels wide is the whole face.
    const post = end - x >= 3;

    for (let cx = x; cx <= end; cx++) {
      const col = hits[cx];
      if (!col) continue;
      const y0 = Math.max(0, Math.ceil(col.top));
      const y1 = Math.min(HUD_TOP - 1, Math.floor(col.bot));
      if (y1 < y0) continue;
      const seam = post && (cx === x || cx === end);
      // Distance along this face, so the stones stay put on the wall as the
      // camera moves rather than sliding across it.
      const along = col.side === 0 ? col.hitY : col.hitX;
      // How hard the room's fires strike this piece of stone. The raycaster
      // has always worked out where on the wall each ray lands; until now
      // nothing used it, and an unlit wall is what made the chamber read as
      // a diagram — a room with no light in it has no reason to look solid.
      const lit = litness(interior, col.hitX, col.hitY);
      for (let y = y0; y <= y1; y++) {
        const i = y * SCREEN_W + cx;
        if (seam) s.fb[i] = line;
        else if (lit > 0.06 && toned(cx, y, lit * 0.8)) s.fb[i] = lit > 0.5 ? BY : Y;
        else s.fb[i] = K;
      }
      if (seam) continue;
      for (const h of courses) {
        const row = Math.round(heightRow(h, col.z, eyeY));
        if (row > y0 && row < y1) s.fb[row * SCREEN_W + cx] = line;
        // Every other course is offset half a stone: running bond, which is
        // what stops the joints stacking into an unbroken vertical line.
        const bond = (Math.round(h / COURSE_H) & 1) === 0 ? 0 : STONE_W / 2;
        const j = ((along + bond) % STONE_W + STONE_W) % STONE_W;
        if (j >= 1.6) continue;
        const below = Math.round(heightRow(h - COURSE_H, col.z, eyeY));
        for (let y = Math.max(y0, row + 1); y < Math.min(y1, below); y++) {
          s.fb[y * SCREEN_W + cx] = line;
        }
      }
      // Wall head and floor joint stay solid: they are the room's outline.
      s.fb[y1 * SCREEN_W + cx] = line;
      s.fb[y0 * SCREEN_W + cx] = line;
    }
    x = end + 1;
  }
  return depth;
}

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
}

function projectPoint(
  cam: CameraState,
  wx: number,
  wy: number,
  height: number,
): ProjectedPoint | null {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  const dx = wx - ex;
  const dy = wy - ey;
  const z = dx * fx + dy * fy;
  if (z < 5) return null;
  return {
    x: 128 + ((dx * fy - dy * fx) * FOCAL) / z,
    y: heightRow(height, z, eyeHeight(cam)),
    z,
  };
}

function drawDepthLine(
  s: Screen,
  depth: Float32Array,
  from: ProjectedPoint | null,
  to: ProjectedPoint | null,
  colour: number,
): void {
  if (!from || !to) return;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y))));
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const x = Math.round(from.x + (to.x - from.x) * p);
    const y = Math.round(from.y + (to.y - from.y) * p);
    const z = from.z + (to.z - from.z) * p;
    if (x < 0 || x >= SCREEN_W || y < 0 || y >= HUD_TOP) continue;
    if (depth[x] + 1 >= z) s.px(x, y, colour);
  }
}

/** Stone treads fixed to the keep plan, so they turn with the chamber. */
function drawKeepStairs(
  s: Screen,
  interior: Interior,
  cam: CameraState,
  depth: Float32Array,
): void {
  if (interior.id !== "keep") return;
  const centreX = 4.5 * CELL;
  const nearY = 4.28 * CELL;
  const farY = 1.82 * CELL;
  const halfWidth = 23;
  const count = 10;
  const rise = 68;
  // Nothing sensible can be drawn from inside the flight: every tread in
  // front of the eye projects wider than the screen and fills the chamber
  // with its own risers. Standing level with the foot of the stair is as
  // close as the drawing goes.
  const { ey } = eyeOf(cam);
  if (ey < nearY) return;
  // Each step is a tread and the riser under it, both filled solid before
  // their edges go on. A bright line per step with the chamber showing
  // between them reads as a ladder hung in the air; what makes it a stair is
  // the dark face beneath every tread.
  for (let i = 0; i < count; i++) {
    const p = i / count;
    const q = (i + 1) / count;
    const treadY = nearY + (farY - nearY) * p;
    const backY = nearY + (farY - nearY) * q;
    const low = p * rise;
    const high = q * rise;
    const tread = [
      projectPoint(cam, centreX - halfWidth, treadY, low),
      projectPoint(cam, centreX + halfWidth, treadY, low),
      projectPoint(cam, centreX + halfWidth, backY, low),
      projectPoint(cam, centreX - halfWidth, backY, low),
    ];
    const riser = [
      projectPoint(cam, centreX - halfWidth, backY, low),
      projectPoint(cam, centreX + halfWidth, backY, low),
      projectPoint(cam, centreX + halfWidth, backY, high),
      projectPoint(cam, centreX - halfWidth, backY, high),
    ];
    if (tread.some((c) => c === null)) continue;
    fillQuad(s, depth, tread as ProjectedPoint[], K);
    if (riser.every((c) => c !== null)) {
      fillQuad(s, depth, riser as ProjectedPoint[], K);
      drawDepthLine(s, depth, riser[3], riser[2], i % 2 === 0 ? BW : W);
    }
    // Nosing, and the stringers running up the flanks of the flight.
    drawDepthLine(s, depth, tread[0], tread[1], W);
    drawDepthLine(s, depth, tread[0], tread[3], W);
    drawDepthLine(s, depth, tread[1], tread[2], W);
  }
}

/** Fill a convex projected quad, honouring the wall depth buffer. */
function fillQuad(
  s: Screen,
  depth: Float32Array,
  quad: readonly ProjectedPoint[],
  colour: number,
): void {
  const top = Math.max(0, Math.floor(Math.min(...quad.map((p) => p.y))));
  const bottom = Math.min(HUD_TOP - 1, Math.ceil(Math.max(...quad.map((p) => p.y))));
  const z = quad.reduce((a, p) => a + p.z, 0) / quad.length;
  for (let y = top; y <= bottom; y++) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < quad.length; i++) {
      const a = quad[i];
      const b = quad[(i + 1) % quad.length];
      if (a.y === b.y) continue;
      const t = (y - a.y) / (b.y - a.y);
      if (t < 0 || t > 1) continue;
      const x = a.x + (b.x - a.x) * t;
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
    if (lo > hi) continue;
    const x0 = Math.max(0, Math.round(lo));
    const x1 = Math.min(SCREEN_W - 1, Math.round(hi));
    for (let x = x0; x <= x1; x++) {
      if (depth[x] + 1 < z) continue;
      s.fb[y * SCREEN_W + x] = colour;
    }
  }
}

// ------------------------------------------------------------------- frame

export function renderInterior(
  s: Screen,
  interior: Interior,
  cam: CameraState,
  entities: readonly Billboard[],
  t = 0,
  visibleActors: readonly Billboard[] = interior.actors,
): void {
  s.clear();
  drawCeiling(s, interior, cam);
  // A few motes of dust hanging in the dark between the beams.
  for (let y = 4; y < HORIZON - 6; y += 5) {
    for (let x = 6; x < SCREEN_W; x += 11) {
      if (hash(x, y + 31) < 22) s.px(x, y, W);
    }
  }
  drawFloor(s, interior, cam);
  const depth = drawWalls(s, interior, cam);
  s.attributePass(0, HUD_TOP);
  drawKeepStairs(s, interior, cam, depth);
  const actors = visibleActors.filter(
    (actor) => (actor as Billboard & { id?: string }).id !== "keep-stair",
  );
  drawBillboards(s, cam, [...interior.props, ...actors, ...entities], t, depth);
}
