// Interiors: grid-plan rooms drawn with a raycaster, sharing the outdoor
// camera exactly. Walls are torchlit masonry — blue stone blocks drawn as
// clumped ink on black with dark mortar seams, warmed where the sconces
// burn — over a near-black polished floor that carries every light in the
// room as a reflection streak.

import { NPC_SEER, NPC_SHADE } from "@/lib/rpg/bestiary";
import { EXIT_ARCH, ITEM_KEY, ITEM_TORC, TORC_FRAMES } from "@/lib/rpg/items";
import { LOOK } from "@/lib/rpg/look";
import {
  B,
  BC,
  BW,
  BY,
  C,
  DIM0,
  K,
  R,
  TORCHLIT,
  W,
  Y,
  dimmed,
  type PaletteTable,
} from "@/lib/rpg/palette";
import type { Actor } from "@/lib/rpg/interact";
import {
  BANNER,
  BANNER_RED,
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
/** How high the keep's roof stands above the moor. */
export const ROOF_HEIGHT = 108;

export interface Interior {
  readonly id: string;
  /** People, items and the way out. */
  readonly actors: readonly Actor[];
  /**
   * Row strings: '#' solid, '.' floor, 'X' the way back outdoors. Rows run
   * SOUTH to NORTH, matching the world outside — row 0 is the southern edge,
   * and +y is north indoors exactly as it is on the moor. The keep is entered
   * through its south gate, so row 0 is where the 'X' goes and she walks up
   * the plan on the same bearing she crossed the threshold on. Get this
   * backwards and the compass swings half a turn in the doorway.
   */
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
  /**
   * The table this room is painted in. Stepping through a doorway is the
   * one place the screen may snap to another palette: the light indoors is
   * genuinely different light, and every room-based Spectrum game cut its
   * colours at the door frame.
   */
  readonly palette?: PaletteTable;
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
 * The keep: the south entrance corridor at row 0, a great hall, and the
 * sanctum at the north end holding the ley-font — the same way round as the
 * masonry outside, so walking in through the gate keeps your bearing.
 */
export const KEEP_INTERIOR: Interior = {
  id: "keep",
  plan: [
    "####X####",
    "###...###",
    "###...###",
    "#.......#",
    "#.......#",
    "#.......#",
    "###...###",
    "###...###",
    "###...###",
    "#########",
  ],
  props: [
    // The sanctum, and what the whole crossing was for: the font stands on
    // the dais the stair climbs to, a column of ley-light rising off it.
    at(4, 7.7, LEY_FONT, 30, { solid: 12, stands: 68 }),
    // Torchères flank the dais foot, so the approach to the font is the
    // warmest ground in the keep. They light that corner alone — a sconce
    // pair stacked over them merged into one shapeless blaze.
    at(2.3, 5.1, BRAZIER, 36, { solid: 8, light: 54 }),
    at(5.7, 5.1, BRAZIER, 36, { solid: 8, light: 54 }),
    // Banners hang flush on the hall walls in facing pairs, purple and red
    // about the gold, with one pair flanking the dais itself.
    at(0.62, 3.05, BANNER, 40, { elevate: 52 }),
    at(7.38, 3.05, BANNER_RED, 40, { elevate: 52 }),
    at(0.62, 4.75, BANNER_RED, 40, { elevate: 52 }),
    at(7.38, 4.75, BANNER, 40, { elevate: 52 }),
    at(2.05, 5.4, BANNER, 40, { elevate: 54 }),
    at(5.95, 5.4, BANNER_RED, 40, { elevate: 54 }),
    // Sconces sit tight against the stone so their halos land on it: a pair
    // down the entrance corridor and a pair on the hall's long walls.
    at(2.72, 1.5, WALL_TORCH, 22, { elevate: 42, frames: TORCH_FRAMES, light: 48 }),
    at(5.28, 1.5, WALL_TORCH, 22, { elevate: 42, frames: TORCH_FRAMES, light: 48 }),
    at(0.62, 3.9, WALL_TORCH, 22, { elevate: 44, frames: TORCH_FRAMES, light: 48 }),
    at(7.38, 3.9, WALL_TORCH, 22, { elevate: 44, frames: TORCH_FRAMES, light: 48 }),
  ],
  actors: [
    {
      // The archway that used to be scenery: now the way up the tower. It
      // stands at the head of the dais stair, blazing over the carpet.
      ...at(4, 7.0, EXIT_ARCH, 64, { stands: 49 }),
      id: "keep-stair",
      reach: 52,
      label: "CLIMB THE TOWER STAIR",
      interaction: { kind: "enter", site: "tower" },
    },
    {
      ...at(4, 0.3, EXIT_ARCH, 82, { sheen: C }),
      id: "keep-exit",
      reach: 60,
      label: "LEAVE THE KEEP",
      interaction: { kind: "exit" },
    },
    {
      ...at(2.1, 3.5, NPC_SHADE, 30),
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
      ...at(6.1, 3.1, ITEM_TORC, 13, { glow: true, frames: TORC_FRAMES, fps: 4 }),
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
      // Beside the dais, not on it — she reads the water from floor level.
      ...at(2.6, 6.5, NPC_SEER, 26),
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
      ...at(6.5, 4.3, ITEM_KEY, 15, { glow: true }),
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
  palette: TORCHLIT,
};

/**
 * The keep's stair: a straight flight rising the height of the wall. Walk
 * north and the floor comes up under you; the shaft's stonework slides down
 * past the eye as you go. 'X' at the foot returns you to the great hall.
 */
export const TOWER_INTERIOR: Interior = {
  id: "tower",
  plan: [
    "##X##",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#####",
  ],
  props: [
    // Flush to the shaft walls, so the climb passes through their halos.
    at(0.72, 1.4, WALL_TORCH, 20, { elevate: 36, frames: TORCH_FRAMES, light: 44 }),
    at(3.28, 3.6, WALL_TORCH, 20, { elevate: 36, frames: TORCH_FRAMES, light: 44 }),
  ],
  actors: [
    {
      ...at(2, 5.85, ROOF_HATCH, 26),
      id: "tower-roof",
      reach: 48,
      label: "CLIMB OUT ONTO THE ROOF",
      interaction: { kind: "roof" },
    },
    {
      ...at(2, 0, EXIT_ARCH, 60, { sheen: C }),
      id: "tower-down",
      reach: 44,
      label: "GO BACK DOWN",
      interaction: { kind: "exit" },
    },
  ],
  leyCellX: 2,
  palette: TORCHLIT,
  // Rise the full height of the wall over the length of the flight.
  climb: { baseY: CELL, topY: 6.8 * CELL, rise: ROOF_HEIGHT },
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
  // Face up the plan — north, the bearing she was already travelling on when
  // she crossed the threshold — and stand far enough in that the eye, which
  // trails CAM_BACK behind, is already inside the doorway.
  return { x, y: y + Math.min(CAM_BACK * 0.75, CELL * 0.75), yaw: 0 };
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
 * light is the one warm thing in a keep of cold blue stone, and it is
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

/** A fire in the room: where the flame actually burns, and its reach. */
interface Fire {
  x: number;
  y: number;
  /** Height of the flame above the floor, in world units. */
  z: number;
  r: number;
}

/**
 * The room's fires with their flames located in 3D, for lighting the WALLS:
 * a sconce warms a ring of stone around its own bracket, not the skirting
 * under it, so wall glow needs to know how high each flame burns.
 */
function firesOf(interior: Interior): Fire[] {
  const out: Fire[] = [];
  for (const p of interior.props) {
    if (!p.light) continue;
    out.push({
      x: p.x,
      y: p.y,
      z: (p.elevate ?? 0) + (p.stands ?? 0) + p.height * 0.82,
      r: p.light,
    });
  }
  return out;
}

// ------------------------------------------------------------------- floor

/**
 * Flagstones are one per grid cell — big slabs, not a fine tiling. A dense
 * grid reads as texture (and no Spectrum game could afford texture); sparse
 * slab joints read as architecture. The joints are BLUE, not white: the
 * reference for the whole room is dark polished stone, and a white grid on
 * black floor read as a diagram of a floor rather than a floor.
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
  if (jx < 1.4 || jy < 1.4) return B;
  return K;
}

/**
 * The ceiling, as a dark stone vault.
 *
 * It is the same plane as the floor, mirrored above the eye, so a vault
 * course and a flagstone joint at the same depth land on rows equidistant
 * from the horizon and the room closes. Without it the chamber has no lid:
 * everything above the wall tops is void, and a room open to a black sky
 * reads as a pen rather than an interior.
 *
 * The old white beams are gone — bright line-work overhead pulled the eye
 * off the floor and read as scaffolding. The vault is coursed in the same
 * blue ink as the walls, thin, with a heavier rib each bay, and it loses
 * its ink with distance until the far ceiling is simply dark.
 */
function drawCeiling(s: Screen, interior: Interior, cam: CameraState): void {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  const above = (interior.wallHeight ?? WALL_H) - eyeHeight(cam);
  if (above <= 2) return;
  for (let sy = 1; sy < HORIZON; sy++) {
    const dist = (above * FOCAL) / (HORIZON - sy);
    // The far vault is lost in the dark long before the walls are; what
    // matters overhead is the stone directly above you.
    if (dist > 460) continue;
    const fade = 1 - dist / 460;
    for (let sx = 0; sx < SCREEN_W; sx++) {
      const lat = ((sx - 128) * dist) / FOCAL;
      const wx = ex + fx * dist + fy * lat;
      const wy = ey + fy * dist - fx * lat;
      // Courses cross the room's short axis with black seams between, and
      // every bay a transverse rib runs denser than the field around it.
      const course = ((wy % 16) + 16) % 16;
      if (course < 1.7) continue;
      const rib = ((wy % CELL) + CELL) % CELL < 4.5;
      const density = (rib ? 300 : 120) * fade;
      if (hash(Math.floor(wx / 2) + 17, Math.floor(wy / 2)) < density) {
        s.fb[sy * SCREEN_W + sx] = B;
      }
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
      if (colour === K) {
        // Firelight pools on the flags: a solid heart under the flame,
        // clumped embers toward the rim — never a screen-door disc.
        const lit = litness(interior, wx, wy);
        if (
          lit > 0.5 ||
          (lit > 0.05 &&
            hash(Math.floor(wx / 1.8), Math.floor(wy / 1.8)) < lit * 700)
        ) {
          s.fb[sy * SCREEN_W + sx] = lit > 0.78 ? BY : Y;
          continue;
        }
        // Between and beyond the bright embers, the pool's last reach is
        // the dim amber rung, so firelight fades out through a value
        // instead of stopping at a stipple's edge.
        if (
          LOOK.shades &&
          lit > 0.04 &&
          hash(Math.floor(wx / 1.8) + 5, Math.floor(wy / 1.8)) < lit * 900
        ) {
          s.fb[sy * SCREEN_W + sx] = DIM0 + Y;
          continue;
        }
        // The slab faces carry a sparse blue grit near the eye — polished
        // stone catching what little light there is — and go black with
        // distance by having that ink taken away.
        if (
          dist < 430 &&
          hash(Math.floor(wx / 2.4) + 9, Math.floor(wy / 2.4)) <
            70 * (1 - dist / 430)
        ) {
          s.fb[sy * SCREEN_W + sx] = B;
        }
        continue;
      }
      if (faint && colour === B && (sx + sy) % 2 !== 0) continue;
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

/** World units per masonry course: the stone's own scale, and the room's. */
const COURSE = 24;

/** Blocks lie longer than they are tall, or the face reads as a net. */
const BLOCK = COURSE * 2;

/** Past this a wall has lost all its ink and stands as darkness. */
const WALL_INK_RANGE = 580;

/** Glow at which stone turns from cold blue to firelit, and to white-hot. */
const GLOW_WARM = 0.3;
const GLOW_HOT = 0.72;

/**
 * Walls as MASONRY, drawn the way a stone reads: each block is a SOLID mass
 * of slate ink with its grain CARVED OUT in black, dark mortar seams
 * between blocks, and neighbouring blocks cut to different values — some
 * standing pale, some sunk dark — so a face is ashlar, not wallpaper. A
 * sparse speckle fill was tried first and read as static; a stone is a
 * filled shape with black taken out of it, never black with ink sprinkled
 * on.
 *
 * Three things vary the mass and keep a big face from going flat:
 *
 * - HEIGHT: the ink thins climbing the wall, so chambers are lit from
 *   below and the courses under the vault sit in shadow, exactly as a
 *   torchlit hall should be.
 * - DISTANCE: the ink thins with depth until a far wall is black with a
 *   faint joint line — recession by taking ink away, never by adding haze.
 * - FIRELIGHT: each flame warms a RING of stone around its own bracket, in
 *   3D — the stone goes amber where the halo lands, white-gold at its
 *   heart — so a sconce hangs in a pool of its own light the way the
 *   reference torches do.
 *
 * Junction lines draw at the wall's top and floor, but vertical seams only
 * at TRUE corners — where the face turns or the depth steps. The raycaster
 * groups columns per grid cell, and seaming every group boundary striped
 * flat walls with pilasters that belonged to the plan, not the room.
 */
function drawWalls(
  s: Screen,
  interior: Interior,
  cam: CameraState,
  fires: readonly Fire[],
): Float32Array {
  const hits = castColumns(interior, cam);
  const eyeY = eyeHeight(cam);
  const wallH = interior.wallHeight ?? WALL_H;
  // Per-column wall distance, handed to the billboard pass so stone can hide
  // what stands behind it. Infinity where the ray escaped the plan.
  const depth = new Float32Array(SCREEN_W).fill(Infinity);
  for (let i = 0; i < SCREEN_W; i++) {
    const hit = hits[i];
    if (hit) depth[i] = hit.z;
  }
  // Fires near enough to this column's strike point to matter, with the 2D
  // part of their falloff done once per column.
  const nearFires: { dd2: number; z: number; r: number }[] = [];
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
    //
    // With the dim rungs under it there are more than two, so the same
    // distinction is drawn in tone rather than rationed: the junction lines
    // at the far end of a hall go down the ladder instead of staying at
    // full white, and they recede with the ashlar they belong to.
    const line = LOOK.shades
      ? dimmed(face.side === 0 ? BW : W, mid.z > 300 ? 2 : mid.z > 150 ? 1 : 0)
      : mid.z < 200 && face.side === 0
        ? BW
        : W;

    // A seam draws only where the wall actually turns or steps — a face
    // group ends at every grid cell, and seaming every group boundary
    // striped flat walls with pilasters.
    const before = x > 0 ? hits[x - 1] : null;
    const after = end < SCREEN_W - 1 ? hits[end + 1] : null;
    const first = hits[x];
    const last = hits[end];
    const leftSeam =
      !before ||
      !first ||
      before.side !== face.side ||
      Math.abs(before.z - first.z) > 14;
    const rightSeam =
      !after ||
      !last ||
      after.side !== face.side ||
      Math.abs(after.z - last.z) > 14;

    for (let cx = x; cx <= end; cx++) {
      const col = hits[cx];
      if (!col) continue;
      const y0 = Math.max(0, Math.ceil(col.top));
      const y1 = Math.min(HUD_TOP - 1, Math.floor(col.bot));
      if (y1 < y0) continue;
      const seam = (cx === x && leftSeam) || (cx === end && rightSeam);
      // Where along this face the column lands, and how much of the wall one
      // column of screen covers — which is how wide a joint has to be to stay
      // a hairline whether the stone is two paces off or twenty.
      const along = col.side === 0 ? col.hitY : col.hitX;
      const grain = col.z / FOCAL;
      // How much ink this distance is allowed to keep.
      const inkAt = Math.max(0, 1 - col.z / WALL_INK_RANGE);
      nearFires.length = 0;
      for (const f of fires) {
        const dx = col.hitX - f.x;
        const dy = col.hitY - f.y;
        const dd2 = dx * dx + dy * dy;
        if (dd2 < f.r * f.r) nearFires.push({ dd2, z: f.z, r: f.r });
      }
      for (let y = y0; y <= y1; y++) {
        const i = y * SCREEN_W + cx;
        if (y === y0 || y === y1 || seam) {
          // Far junction lines thin out rather than staying wire-bright.
          if (col.z > 460 && ((cx + y) & 1) !== 0) continue;
          s.fb[i] = line;
          continue;
        }
        // Height on the wall of this row and the next, so a mortar seam is
        // drawn exactly once however many world units the row spans.
        const h = eyeY - ((y - HORIZON) * col.z) / FOCAL;
        const below = eyeY - ((y + 1 - HORIZON) * col.z) / FOCAL;
        const band = Math.floor(h / COURSE);
        // Horizontal mortar: the seam between courses is black absence.
        if (band !== Math.floor(below / COURSE)) continue;
        // Running bond: every other course starts half a block along.
        const offset = (band & 1) === 0 ? 0 : BLOCK / 2;
        const across = (((along - offset) % BLOCK) + BLOCK) % BLOCK;
        // Vertical mortar between blocks, one column of dark.
        if (across < grain * 1.1 + 0.7) continue;
        // Firelight on the stone: a 3D halo around each flame, tighter on
        // the wall than the pool it throws on the floor.
        let glow = 0;
        for (const f of nearFires) {
          const d = Math.sqrt(f.dd2 + (h - f.z) * (h - f.z));
          const rr = f.r * 0.82;
          if (d < rr) glow += (1 - d / rr) ** 1.7;
        }
        const ink = glow > GLOW_HOT ? BY : glow > GLOW_WARM ? Y : B;
        // Each block is cut to its own value: most stand as near-solid
        // slate with grain carved out, and roughly a quarter sit distinctly
        // darker, so a face reads as ashlar of mixed stones. Height and
        // distance thin the mass toward black; firelight drives it solid.
        const bv = hash(
          Math.floor((along - offset) / BLOCK) * 7 + 3,
          band * 13 + 1,
        );
        const hFade = Math.max(0.2, Math.min(1, 1.3 - (h / wallH) * 1.4));
        // Cold stone at the fringe of a halo only brightens a little; it is
        // the WARM zone that runs toward solid. Boosting both the same drew
        // a slab of dense blue around every pool of light.
        const boost = glow > GLOW_WARM ? glow : glow * 0.3;
        let base = 0.62 + (bv % 100) / 330;
        if (bv % 7 < 2) base *= 0.6;
        let density = base * hFade * inkAt + boost;
        // The block's rim holds its shape after distance has thinned the
        // face, so far ashlar keeps its blocks as outlines in the dark.
        const hIn = h - band * COURSE;
        const edge =
          across < grain * 1.3 + 1.9 ||
          across > BLOCK - grain * 1.3 - 1.2 ||
          hIn < grain * 1.2 + 1.1 ||
          hIn > COURSE - grain * 1.2 - 1.1;
        if (edge) density = Math.min(0.96, density * 2.4);
        if (
          density > 0.02 &&
          hash(Math.floor(along / 2.6), Math.floor(h / 2.6)) < density * 1000
        ) {
          s.fb[i] = ink;
        }
      }
    }
    x = end + 1;
  }
  return depth;
}

// ------------------------------------------------------------------- gloss

/**
 * Reflection streaks: every light in the room smears a vertical stripe of
 * itself down the flags toward the eye, the way torchlight lies on a
 * polished floor. This is the single cheapest thing that sells the floor as
 * STONE — the flags can stay nearly black, and it is the streaks that say
 * they are dark because they are polished, not because they are void.
 *
 * Screen-space on purpose: a reflection slides over the surface as the
 * camera moves, so painting it in world space would nail it to the flags
 * and read as a stain.
 */
function drawFloorSheen(
  s: Screen,
  interior: Interior,
  cam: CameraState,
  depth: Float32Array,
  actors: readonly Billboard[],
): void {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  const eyeY = eyeHeight(cam);
  const sources: { x: number; y: number; body: number; core: number; w: number }[] = [];
  for (const p of interior.props) {
    if (p.light) sources.push({ x: p.x, y: p.y, body: Y, core: BY, w: 5.5 });
    else if (p.sheen !== undefined) {
      sources.push({ x: p.x, y: p.y, body: p.sheen, core: BC, w: 8 });
    }
  }
  for (const a of actors) {
    if (a.sheen !== undefined) {
      sources.push({ x: a.x, y: a.y, body: a.sheen, core: BC, w: 8 });
    }
  }
  for (let n = 0; n < sources.length; n++) {
    const src = sources[n];
    const dx = src.x - ex;
    const dy = src.y - ey;
    const z = dx * fx + dy * fy;
    if (z < 26) continue;
    const lat = dx * fy - dy * fx;
    const cx = Math.round(128 + (lat * FOCAL) / z);
    if (cx < -6 || cx >= SCREEN_W + 6) continue;
    const baseRow = Math.max(HORIZON + 1, Math.ceil(groundRow(z, eyeY)));
    const len = Math.floor((HUD_TOP - baseRow) * 0.55);
    if (len < 2) continue;
    const halfW = Math.max(1, Math.round((src.w * FOCAL) / z / 2));
    for (let y = baseRow; y < baseRow + len && y < HUD_TOP; y++) {
      const fade = 1 - (y - baseRow) / len;
      for (let ox = -halfW; ox <= halfW; ox++) {
        const px = cx + ox;
        if (px < 0 || px >= SCREEN_W) continue;
        // A wall standing nearer than the light also stands over its
        // reflection.
        if (depth[px] < z - 8) continue;
        const density =
          fade * (1 - Math.abs(ox) / (halfW + 1)) * 460;
        if (hash(px * 3 + n * 31, y * 5 + n) < density) {
          s.fb[y * SCREEN_W + px] =
            ox === 0 && fade > 0.55 ? src.core : src.body;
        }
      }
    }
  }
}

/**
 * The column of ley-light standing on the sanctum font: a white-hot seam
 * wrapped in cyan, rising off the water and dying out overhead. It is the
 * far focal point of the whole keep — visible over the dais from the
 * moment you step through the gate, the reason to walk north.
 */
function drawSanctumBeam(
  s: Screen,
  interior: Interior,
  cam: CameraState,
  depth: Float32Array,
  t: number,
): void {
  if (interior.id !== "keep") return;
  const font = interior.props.find((p) => p.sprite === LEY_FONT);
  if (!font) return;
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  const dx = font.x - ex;
  const dy = font.y - ey;
  const z = dx * fx + dy * fy;
  if (z < 30) return;
  const lat = dx * fy - dy * fx;
  const cx = Math.round(128 + (lat * FOCAL) / z);
  if (cx < -8 || cx >= SCREEN_W + 8) return;
  const stands = font.stands ?? 0;
  // From the font's rim up past the vault, fading as it climbs.
  const baseH = stands + font.height * 0.72;
  const topH = baseH + 88;
  const yBase = Math.min(HUD_TOP - 1, Math.floor(heightRow(baseH, z, eyeHeight(cam))));
  const yTop = Math.max(0, Math.ceil(heightRow(topH, z, eyeHeight(cam))));
  if (yTop >= yBase) return;
  const halfW = Math.max(1, Math.round((9 * FOCAL) / z / 2));
  const flick = Math.floor(t * 8);
  for (let y = yTop; y <= yBase; y++) {
    const p = (yBase - y) / (yBase - yTop);
    for (let ox = -halfW; ox <= halfW; ox++) {
      const px = cx + ox;
      if (px < 0 || px >= SCREEN_W) continue;
      if (depth[px] < z - 4) continue;
      const core = Math.abs(ox) <= Math.max(0, Math.round(halfW * 0.34));
      const density = (core ? 940 : 420) * (1 - p * 0.6);
      if (hash(px * 5 + flick, y * 3) < density) {
        s.fb[y * SCREEN_W + px] = core ? (p < 0.4 ? BW : BC) : C;
      }
    }
  }
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
  const nearY = 5.72 * CELL;
  const farY = 8.18 * CELL;
  const halfWidth = 23;
  const count = 10;
  const rise = 68;
  // Nothing sensible can be drawn from inside the flight: every tread in
  // front of the eye projects wider than the screen and fills the chamber
  // with its own risers. Standing level with the foot of the stair is as
  // close as the drawing goes.
  //
  // The test follows the plan's bearing, and the plans were reversed so the
  // way out is south and the compass stops lying in the doorway. She now
  // comes at the flight from BELOW its foot in y, not above it.
  const { ey } = eyeOf(cam);
  if (ey > nearY) return;
  // Each step is a tread and the riser under it, both filled solid before
  // their edges go on. A bright line per step with the chamber showing
  // between them reads as a ladder hung in the air; what makes it a stair is
  // the dark face beneath every tread.
  //
  // A red carpet runs up the middle of the flight to the font — the dais is
  // the keep's throne, and the carpet is what says so from the doorway.
  const carpetHalf = 13;
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
    const carpetTread = [
      projectPoint(cam, centreX - carpetHalf, treadY, low),
      projectPoint(cam, centreX + carpetHalf, treadY, low),
      projectPoint(cam, centreX + carpetHalf, backY, low),
      projectPoint(cam, centreX - carpetHalf, backY, low),
    ];
    if (carpetTread.every((c) => c !== null)) {
      fillQuad(s, depth, carpetTread as ProjectedPoint[], R);
      // Gold selvedge up both borders of the runner.
      drawDepthLine(s, depth, carpetTread[0], carpetTread[3], BY);
      drawDepthLine(s, depth, carpetTread[1], carpetTread[2], BY);
    }
    if (riser.every((c) => c !== null)) {
      fillQuad(s, depth, riser as ProjectedPoint[], K);
      const carpetRiser = [
        projectPoint(cam, centreX - carpetHalf, backY, low),
        projectPoint(cam, centreX + carpetHalf, backY, low),
        projectPoint(cam, centreX + carpetHalf, backY, high),
        projectPoint(cam, centreX - carpetHalf, backY, high),
      ];
      if (carpetRiser.every((c) => c !== null)) {
        fillQuad(s, depth, carpetRiser as ProjectedPoint[], R);
      }
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
  const fires = firesOf(interior);
  drawCeiling(s, interior, cam);
  // A few motes of dust hanging in the dark under the vault.
  for (let y = 4; y < HORIZON - 6; y += 5) {
    for (let x = 6; x < SCREEN_W; x += 11) {
      if (hash(x, y + 31) < 22) s.px(x, y, W);
    }
  }
  drawFloor(s, interior, cam);
  const depth = drawWalls(s, interior, cam, fires);
  drawFloorSheen(s, interior, cam, depth, visibleActors);
  s.attributePass(0, HUD_TOP);
  drawKeepStairs(s, interior, cam, depth);
  drawSanctumBeam(s, interior, cam, depth, t);
  // The stair arch draws with everything else now: it stands at the head of
  // the flight as the lit doorway the carpet climbs to.
  drawBillboards(s, cam, [...interior.props, ...visibleActors, ...entities], t, depth);
}
