// Shared camera and projection. Outdoors and indoors use the SAME numbers —
// that is what makes gliding through the keep gate feel continuous rather
// than like two different games stitched together.

import { BC, BW, C, K } from "@/lib/rpg/palette";
import { HORIZON, HUD_TOP, SCREEN_W, type Screen, type Sprite } from "@/lib/rpg/screen";

/** Distance from eye to projection plane, in pixels. */
export const FOCAL = 110;
/** Eye height above the ground plane, in world units. */
export const CAM_HEIGHT = 26;
/** How far behind the hero the eye sits. */
export const CAM_BACK = 32;

export interface CameraState {
  x: number;
  y: number;
  yaw: number;
}

/** Unit forward vector for a yaw. +y is north at yaw 0. */
export function forward(yaw: number): { fx: number; fy: number } {
  return { fx: Math.sin(yaw), fy: Math.cos(yaw) };
}

/** The eye sits behind the hero, so the hero is visible in frame. */
export function eyeOf(cam: CameraState): { ex: number; ey: number } {
  const { fx, fy } = forward(cam.yaw);
  return { ex: cam.x - fx * CAM_BACK, ey: cam.y - fy * CAM_BACK };
}

/** Screen row where the ground plane sits at perpendicular depth `z`. */
export function groundRow(z: number): number {
  return HORIZON + (CAM_HEIGHT * FOCAL) / z;
}

/** Screen row of a point `h` world units above the ground at depth `z`. */
export function heightRow(h: number, z: number): number {
  return HORIZON + ((CAM_HEIGHT - h) * FOCAL) / z;
}

export interface Billboard {
  x: number;
  y: number;
  sprite: Sprite;
  /** World height in units; width follows the sprite's aspect. */
  height: number;
  /** Landmarks keep a minimum on-screen size and never dither. */
  landmark?: boolean;
  /** Detail levels, best first, chosen by on-screen pixel height. */
  lod?: ReadonlyArray<{ minH: number; sprite: Sprite }>;
  /** World units above the floor — how a sconce hangs on a wall. */
  elevate?: number;
  /** Body radius in world units; omitted props can be walked through. */
  solid?: number;
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
): SpriteDraw[] {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  const drawn: {
    z: number;
    screenX: number;
    baseY: number;
    h: number;
    sprite: Sprite;
    landmark?: boolean;
    glow?: boolean;
    highlight?: boolean;
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
    if (it.landmark) h = Math.max(h, 7);
    else if (h < 1.5 || h > HUD_TOP * 2.5) continue;
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
    // standing on the flags.
    const baseY = groundRow(z) - ((it.elevate ?? 0) * FOCAL) / z;
    drawn.push({
      z,
      screenX,
      baseY,
      h,
      sprite,
      landmark: it.landmark,
      glow: it.glow,
      highlight: it.highlight,
    });
  }

  return drawn.map((it) => {
    const w = (it.h * it.sprite.w) / it.sprite.h;
    const footY = Math.min(it.baseY, HUD_TOP);
    // Far billboards dissolve into the dark like the terrain does — but
    // landmarks never do: they already swap to low-detail LOD art at range,
    // and a dithered castle reads as noise instead of a destination.
    const dither = it.landmark ? 0 : it.z > 1600 ? 2 : it.z > 800 ? 1 : 0;
    return {
      z: it.z,
      paint: (s: Screen) => {
        // The pool goes down first, so what stands in it occludes it.
        if (it.glow) drawGlow(s, it.screenX, footY, w, t, depth, it.z);
        if (it.highlight) {
          drawHalo(s, it.sprite, it.screenX, footY, w, it.h, depth, it.z);
        }
        s.blitScaled(it.sprite, it.screenX, footY, w, it.h, dither, undefined, depth, it.z);
      },
    };
  });
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
