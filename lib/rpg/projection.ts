// Shared camera and projection. Outdoors and indoors use the SAME numbers —
// that is what makes gliding through the keep gate feel continuous rather
// than like two different games stitched together.

import { BC, BG, BR, BW, BY, C, K } from "@/lib/rpg/palette";
import {
  HORIZON,
  HUD_TOP,
  SCREEN_W,
  flippedV,
  type Screen,
  type Sprite,
} from "@/lib/rpg/screen";

/** Distance from eye to projection plane, in pixels. */
export const FOCAL = 110;
/** Eye height above the ground plane, in world units. */
export const CAM_HEIGHT = 26;
/** How far behind the hero the eye sits. */
export const CAM_BACK = 32;
/** Most a billboard may be blown up past the size it was drawn at. */
const MAX_MAGNIFY = 4;

export interface CameraState {
  x: number;
  y: number;
  yaw: number;
  /**
   * Height of the floor under the mage, in world units. Ground level is 0;
   * climbing the keep stair raises it. Because the camera stays level, the
   * horizon line never moves — height simply compresses the ground plane
   * toward it, which is exactly what looking out from a tower looks like.
   */
  elev?: number;
}

/** Unit forward vector for a yaw. +y is north at yaw 0. */
export function forward(yaw: number): { fx: number; fy: number } {
  return { fx: Math.sin(yaw), fy: Math.cos(yaw) };
}

/** Height of the eye above absolute zero, for a camera at `elev`. */
export function eyeHeight(cam: CameraState): number {
  return CAM_HEIGHT + (cam.elev ?? 0);
}

/** The eye sits behind the hero, so the hero is visible in frame. */
export function eyeOf(cam: CameraState): { ex: number; ey: number } {
  const { fx, fy } = forward(cam.yaw);
  return { ex: cam.x - fx * CAM_BACK, ey: cam.y - fy * CAM_BACK };
}

/**
 * Screen row where a surface at world height `h` sits at depth `z`, seen
 * from an eye `eyeY` above zero. Defaults keep the old ground-level call
 * sites honest: groundRow(z) is still "the floor at your feet".
 */
export function surfaceRow(h: number, z: number, eyeY = CAM_HEIGHT): number {
  return HORIZON + ((eyeY - h) * FOCAL) / z;
}

/** Screen row where the ground plane sits at perpendicular depth `z`. */
export function groundRow(z: number, eyeY = CAM_HEIGHT): number {
  return HORIZON + (eyeY * FOCAL) / z;
}

/** Screen row of a point `h` world units above the ground at depth `z`. */
export function heightRow(h: number, z: number, eyeY = CAM_HEIGHT): number {
  return HORIZON + ((eyeY - h) * FOCAL) / z;
}

export interface Billboard {
  x: number;
  y: number;
  sprite: Sprite;
  /** World height in units; width follows the sprite's aspect. */
  height: number;
  /** Landmarks keep a minimum on-screen size and never dither. */
  landmark?: boolean;
  /** Keep very large actors framed at interaction range. */
  maxScreenHeight?: number;
  /** Detail levels, best first, chosen by on-screen pixel height. */
  lod?: ReadonlyArray<{ minH: number; sprite: Sprite }>;
  /** World units above the floor — how a sconce hangs on a wall. */
  elevate?: number;
  /** Body radius in world units; omitted props can be walked through. */
  solid?: number;
  /** World height of the floor this prop stands on (0 = the ground). */
  stands?: number;
  /** Radius in world units over which this prop throws warm light. */
  light?: number;
  /** Cycled at `fps` when present, for flame flicker and the like. */
  frames?: readonly Sprite[];
  fps?: number;
  /**
   * Stands in a pool of ley-light. Reserved for things you can carry off:
   * the ley marks what it wants moved, which is why people never glow and
   * items always do.
   */
  glow?: boolean;
  /** Within arm's reach — draw it haloed, so "now" is unmistakable. */
  highlight?: boolean;
  /** Remaining hostile energy, 0..1. Omitted for non-combatants. */
  energy?: number;
  /**
   * Standing in still water: paint a dimmed, foreshortened, upside-down
   * copy below the foot line. Only meaningful over the pool — a reflection
   * on grass is a stain.
   */
  mirror?: boolean;
}

/**
 * Project billboards against the camera and paint them back-to-front.
 * Shared by the open world and interiors so props behave identically in both.
 */
export interface SpriteDraw {
  z: number;
  paint: (s: Screen) => void;
}

/**
 * Project billboards and return them as depth-tagged paint jobs, so the
 * caller can interleave them with other drawables (building faces) instead
 * of drawing sprites strictly on top.
 */
export function collectBillboards(
  cam: CameraState,
  items: readonly Billboard[],
  t = 0,
  /** Per-column wall distance from the interior raycaster; null outdoors. */
  depth: Float32Array | null = null,
  /** Ground elevation sampler when the relief look is on; null keeps flat. */
  terrain: ((x: number, y: number) => number) | null = null,
): SpriteDraw[] {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  const eyeY = eyeHeight(cam) + (terrain ? terrain(cam.x, cam.y) : 0);
  const drawn: {
    z: number;
    screenX: number;
    baseY: number;
    h: number;
    sprite: Sprite;
    landmark?: boolean;
    framedAtHud?: boolean;
    glow?: boolean;
    highlight?: boolean;
    energy?: number;
    mirror?: boolean;
    /** Screen pixels between the foot line and the surface it hovers over. */
    hoverPx?: number;
  }[] = [];

  for (const it of items) {
    const dx = it.x - ex;
    const dy = it.y - ey;
    const z = dx * fx + dy * fy;
    // Anything this close is effectively enveloping the eye; drawing it just
    // smears one sprite over the whole screen.
    if (z < 20) continue;
    const lat = dx * fy - dy * fx;
    const screenX = 128 + (lat * FOCAL) / z;
    if (screenX < -80 || screenX > SCREEN_W + 80) continue;
    let h = (it.height * FOCAL) / z;
    let framedAtHud = false;
    if (it.landmark) {
      h = Math.max(h, 7);
    } else if (h < 1.5 || h > HUD_TOP * 2.5) {
      continue;
    }
    // Nothing is drawn at more than a few times the size it was drawn at.
    // Past that there is no more information in the sprite, only bigger
    // pixels: a forty-by-fourteen fallen sarsen taken to nine times scale
    // is three hundred and seventy pixels of flat grey with black slabs in
    // it, which reads as a brick wall rather than as a stone you are
    // standing beside.
    h = Math.min(h, it.sprite.h * MAX_MAGNIFY);
    if (it.maxScreenHeight !== undefined && h > it.maxScreenHeight) {
      h = it.maxScreenHeight;
      framedAtHud = true;
    }
    let sprite = it.sprite;
    if (it.frames && it.frames.length > 0) {
      const step = Math.floor(t * (it.fps ?? 7)) % it.frames.length;
      sprite = it.frames[step];
    }
    if (it.lod) {
      for (const level of it.lod) {
        if (h >= level.minH) {
          sprite = level.sprite;
          break;
        }
      }
    }
    // Elevated props hang above the floor — a sconce on a wall, not a lamp
    // standing on the flags. `stands` lifts the whole prop to a storey, so
    // battlements on the roof sit at roof height rather than in the mud.
    // Under the relief look everything also stands on its hillside.
    const baseY =
      groundRow(z, eyeY) -
      (((it.elevate ?? 0) + (it.stands ?? 0) + (terrain ? terrain(it.x, it.y) : 0)) *
        FOCAL) /
        z;
    drawn.push({
      z,
      screenX,
      baseY,
      h,
      sprite,
      landmark: it.landmark,
      framedAtHud,
      glow: it.glow,
      highlight: it.highlight,
      energy: it.energy,
      mirror: it.mirror,
      hoverPx: ((it.elevate ?? 0) * FOCAL) / z,
    });
  }

  return drawn.map((it) => {
    const w = (it.h * it.sprite.w) / it.sprite.h;
    // Ordinary props continue below the HUD as the player passes them. A
    // deliberately height-capped actor stays fully framed once the cap is
    // reached; otherwise the HUD hides more of it and creates false shrinkage.
    const footY = it.framedAtHud
      ? Math.max(it.h + 2, Math.min(it.baseY, HUD_TOP))
      : Math.min(it.baseY, HUD_TOP);
    // Aerial perspective. Far billboards thin into the dark like the terrain
    // does, and they have to start doing it much nearer than the old eight
    // hundred units: once stone was drawn as solid pale mass rather than as
    // speckle, forty distant sarsens stacked into one white band along the
    // horizon and buried the hills behind it. Halving at 420 and quartering
    // at 900 is what puts air between the moor and its skyline.
    //
    // Landmarks never dissolve: they already swap to low-detail LOD art at
    // range, and a dithered castle reads as noise instead of a destination.
    const dither = it.landmark ? 0 : it.z > 900 ? 2 : it.z > 420 ? 1 : 0;
    return {
      z: it.z,
      paint: (s: Screen) => {
        // The reflection goes down before everything: a flipped copy of the
        // sprite hanging below the water line, foreshortened and broken to
        // a sparse dither so it reads as light on the surface rather than
        // as a second creature. A hovering thing's image starts below the
        // surface by the same (squashed) gap it floats above it.
        if (it.mirror) {
          const squash = 0.55;
          const surfaceY = it.baseY + (it.hoverPx ?? 0);
          const rh = it.h * squash;
          const bottom = surfaceY + ((it.hoverPx ?? 0) + it.h) * squash;
          if (bottom > surfaceY) {
            s.blitScaled(
              flippedV(it.sprite),
              it.screenX,
              bottom,
              w,
              rh,
              2,
              undefined,
              depth,
              it.z,
            );
          }
        }
        // The pool goes down first, so what stands in it occludes it.
        if (it.glow) drawGlow(s, it.screenX, footY, w, t, depth, it.z);
        if (it.highlight) {
          drawHalo(s, it.sprite, it.screenX, footY, w, it.h, depth, it.z);
        }
        s.blitScaled(it.sprite, it.screenX, footY, w, it.h, dither, undefined, depth, it.z);
        if (it.energy !== undefined) {
          drawEnergyBar(s, it.screenX, footY - it.h - 5, w, it.energy);
        }
      },
    };
  });
}

function drawEnergyBar(
  s: Screen,
  cx: number,
  top: number,
  spriteWidth: number,
  energy: number,
): void {
  if (top < 1 || top >= HUD_TOP - 5) return;
  const innerW = Math.max(8, Math.min(28, Math.round(spriteWidth)));
  const x = Math.round(cx - innerW / 2) - 1;
  const y = Math.round(top);
  const value = Math.max(0, Math.min(1, energy));
  const fill = Math.round(innerW * value);
  const ink = value > 0.55 ? BG : value > 0.25 ? BY : BR;
  s.rect(x, y, innerW + 2, 5, K);
  s.rect(x, y, innerW + 2, 1, BW);
  s.rect(x, y + 4, innerW + 2, 1, BW);
  s.px(x, y + 2, BW);
  s.px(x + innerW + 1, y + 2, BW);
  if (fill > 0) s.rect(x + 1, y + 1, fill, 3, ink);
}

/**
 * A pool of ley-light on the floor. Dithered rather than solid — a filled
 * cyan blob reads as a painted disc, a dithered one reads as light — and
 * breathing slowly so it is never mistaken for a flagstone.
 */
function drawGlow(
  s: Screen,
  cx: number,
  baseY: number,
  w: number,
  t: number,
  depth: Float32Array | null,
  z: number,
): void {
  const pulse = 1 + Math.sin(t * 2.2) * 0.12;
  const rx = Math.max(3, Math.round(w * 0.7 * pulse));
  const ry = Math.max(2, Math.round(rx * 0.42));
  // A small pool cannot afford to be dithered: half of three pixels is one,
  // and one cyan pixel in front of a dithered wall is indistinguishable from
  // the wall. Close up it dithers, far off it goes solid — the opposite of
  // the distance fade, and the only way it survives the far end of the hall.
  const solid = rx <= 7;
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      const n = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
      if (n > 1) continue;
      const x = Math.round(cx) + dx;
      const y = Math.round(baseY) + dy;
      if (y < HORIZON || y >= HUD_TOP) continue;
      if (depth && x >= 0 && x < SCREEN_W && depth[x] < z) continue;
      if (!solid && ((x + y) & 1) !== 0) continue;
      s.px(x, y, n < 0.4 ? BC : C);
    }
  }
}

/**
 * The silhouette smeared outward and painted — the cheap way to outline a
 * sprite when you cannot afford a second copy of the art. Two rings, not
 * one: black on the outside, bright white inside it. A lone bright ring is
 * invisible against a near wall (both are bright white) and a lone black one
 * is invisible against the floor, so the pair is what makes "in reach" read
 * everywhere in the room. Billboards draw after the attribute pass, so both
 * rings keep their colour whatever cell they land in.
 */
function drawHalo(
  s: Screen,
  sprite: Sprite,
  cx: number,
  baseY: number,
  w: number,
  h: number,
  depth: Float32Array | null,
  z: number,
): void {
  const ring = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [ox, oy] of ring) {
    s.blitScaled(sprite, cx + ox * 2, baseY + oy * 2, w, h, 0, K, depth, z);
  }
  for (const [ox, oy] of ring) {
    s.blitScaled(sprite, cx + ox, baseY + oy, w, h, 0, BW, depth, z);
  }
}

/** Paint billboards alone, back to front. */
export function drawBillboards(
  s: Screen,
  cam: CameraState,
  items: readonly Billboard[],
  t = 0,
  depth: Float32Array | null = null,
): void {
  const jobs = collectBillboards(cam, items, t, depth);
  jobs.sort((a, b) => b.z - a.z);
  for (const j of jobs) j.paint(s);
}
