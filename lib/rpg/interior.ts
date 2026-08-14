// Interiors: grid-plan rooms drawn with a raycaster, sharing the outdoor
// camera exactly. Walls are white line-work over black — stone courses and
// corner posts rather than filled texture — so a chamber reads like the
// keep's facade seen from the inside.

import { NPC_SEER, NPC_SHADE } from "@/lib/rpg/bestiary";
import { EXIT_ARCH, ITEM_KEY, ITEM_TORC } from "@/lib/rpg/items";
import { BC, BW, BY, C, K, W, Y } from "@/lib/rpg/palette";
import type { Actor } from "@/lib/rpg/interact";
import {
  BANNER,
  BRAZIER,
  LEY_FONT,
  TORCH_FLAME_ALT,
  WALL_TORCH,
} from "@/lib/rpg/props";
import { ROOF_HATCH, STAIR_DOOR } from "@/lib/rpg/tower";
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
export const CELL = 64;
/** Wall height in world units. */
const WALL_H = 104;
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
    "#############",
    "####.....####",
    "####.....####",
    "#####...#####",
    "#...........#",
    "#...........#",
    "#...........#",
    "#####...#####",
    "#####...#####",
    "######X######",
  ],
  props: [
    // The sanctum, and what the whole crossing was for.
    at(6, 1.3, LEY_FONT, 34, { solid: 17 }),
    // Great hall: braziers at the corners, banners on the far wall.
    at(1.2, 4.6, BRAZIER, 30, { solid: 12, light: 92 }),
    at(10.8, 4.6, BRAZIER, 30, { solid: 12, light: 92 }),
    at(3.6, 4.15, BANNER, 34, { elevate: 34 }),
    at(8.4, 4.15, BANNER, 34, { elevate: 34 }),
    // Sconces lighting the way in.
    at(4.6, 5.5, WALL_TORCH, 22, { elevate: 40, frames: TORCH_FRAMES, light: 66 }),
    at(7.4, 5.5, WALL_TORCH, 22, { elevate: 40, frames: TORCH_FRAMES, light: 66 }),
    at(5.15, 7.6, WALL_TORCH, 22, { elevate: 38, frames: TORCH_FRAMES, light: 66 }),
    at(7.85, 7.6, WALL_TORCH, 22, { elevate: 38, frames: TORCH_FRAMES, light: 66 }),
  ],
  actors: [
    {
      // The archway that used to be scenery: now the way up the tower.
      ...at(6, 3.35, STAIR_DOOR, 76),
      id: "keep-stair",
      reach: 48,
      label: "CLIMB THE TOWER STAIR",
      interaction: { kind: "enter", site: "tower" },
    },
    {
      ...at(6, 8.7, EXIT_ARCH, 82),
      id: "keep-exit",
      reach: 60,
      label: "LEAVE THE KEEP",
      interaction: { kind: "exit" },
    },
    {
      ...at(3.1, 5.5, NPC_SHADE, 30),
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
      ...at(9.1, 5.9, ITEM_TORC, 13),
      id: "keep-torc",
      reach: 34,
      label: "TAKE THE TORC",
      interaction: {
        kind: "pickup",
        item: "TORC",
        onTake: "YOU TAKE THE TORC. IT IS WARM, AND IT HUMS LIKE A STRUCK WIRE.",
      },
    },
    {
      ...at(4.6, 1.6, NPC_SEER, 26),
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
      ...at(10.2, 4.7, ITEM_KEY, 15),
      id: "keep-key",
      reach: 34,
      label: "TAKE THE IRON KEY",
      interaction: {
        kind: "pickup",
        item: "IRON KEY",
        onTake: "AN OLD IRON KEY, COLD AS THE FLOOR IT LAY ON. SOMETHING HERE STILL LOCKS.",
      },
    },
  ],
  leyCellX: 6,
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
      ...at(2, 7, STAIR_DOOR, 60),
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
  return { x, y: y - CAM_BACK * 0.5, yaw: Math.PI };
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
  const R = 14;
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
 */
function litness(interior: Interior, wx: number, wy: number): number {
  let best = 0;
  for (const p of interior.props) {
    if (!p.light) continue;
    const dx = wx - p.x;
    const dy = wy - p.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= p.light) continue;
    // Quadratic falloff: a torch should make a pool, not floodlight a hall.
    const v = (1 - d / p.light) ** 2;
    if (v > best) best = v;
  }
  return best;
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
  if (d < 2) return BC;
  if (d < 6 && (Math.floor(wx) + Math.floor(wy)) % 2 === 0) return C;
  const jx = ((wx % CELL) + CELL) % CELL;
  const jy = ((wy % CELL) + CELL) % CELL;
  if (jx < 1.4 || jy < 1.4) return W;
  return K;
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

/** 4x4 ordered dither — how you get flat tone out of a single ink. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function toned(x: number, y: number, level: number): boolean {
  return BAYER[(y & 3) * 4 + (x & 3)] < level * 16;
}

/**
 * The tone ladder. Four steps is all a one-ink display can hold apart;
 * anything finer turns into the uniform screen-door that gave the walls
 * their "textured" look in the first place.
 */
const TONES = [0.5, 0.34, 0.2, 0.1];

/**
 * Walls as flat FACES, not textured columns: group the columns that hit the
 * same wall face, fill each with one ordered-dither tone, and outline it.
 * Faces turned away from the eye carry less tone — Knight Lore's trick for
 * reading a corner without spending a second colour, and the reason a
 * chamber reads as solid stone rather than a tiled grid.
 */
function drawWalls(s: Screen, interior: Interior, cam: CameraState): void {
  const hits = castColumns(interior, cam);
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

    // ONE flat tone for the whole face, picked from a short ladder. Flat
    // shading is the point: a face that shades smoothly reads as a textured
    // surface, a face that holds one tone reads as a plane of stone.
    const mid = hits[(x + end) >> 1] ?? face;
    const band = mid.z < 150 ? 0 : mid.z < 320 ? 1 : mid.z < 640 ? 2 : 3;
    const level = TONES[Math.min(TONES.length - 1, band + (face.side === 0 ? 1 : 0))];

    for (let cx = x; cx <= end; cx++) {
      const col = hits[cx];
      if (!col) continue;
      const y0 = Math.max(0, Math.ceil(col.top));
      const y1 = Math.min(HUD_TOP - 1, Math.floor(col.bot));
      if (y1 < y0) continue;
      // Adjacent lit faces are parted by a black seam, and the wall meets
      // ceiling and floor on a bright line — Ultimate's grammar for reading
      // solid geometry with one ink.
      const seam = cx === x || cx === end;
      for (let y = y0; y <= y1; y++) {
        const i = y * SCREEN_W + cx;
        if (y === y0 || y === y1) s.fb[i] = BW;
        else if (seam) s.fb[i] = K;
        else if (toned(cx, y, level)) s.fb[i] = W;
      }
    }
    x = end + 1;
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
  // A few motes of dust in the dark above, so the ceiling is not dead space.
  for (let y = 4; y < HORIZON - 6; y += 5) {
    for (let x = 6; x < SCREEN_W; x += 11) {
      if (hash(x, y + 31) < 22) s.px(x, y, W);
    }
  }
  drawFloor(s, interior, cam);
  drawWalls(s, interior, cam);
  s.attributePass(0, HUD_TOP);
  drawBillboards(s, cam, [...interior.props, ...visibleActors, ...entities], t);
}
