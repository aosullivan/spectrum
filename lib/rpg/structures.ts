// Buildings as real geometry rather than billboards.
//
// A billboard pivots to face the camera, so however you circle it you only
// ever see its front — fine for a spider, wrong for a castle, which has
// corners. These are axis-aligned boxes in world space whose faces are
// projected through the same camera as everything else, so the keep turns
// with the ground the way the leyline does.
//
// Faces are lit from a FIXED WORLD DIRECTION, not from the camera. That is
// what sells it: circle the keep and its walls change brightness because
// their orientation to the light is a property of the world, not of you.

import { BW, K, W } from "@/lib/rpg/palette";
import {
  CAM_HEIGHT,
  FOCAL,
  eyeOf,
  forward,
  heightRow,
  type CameraState,
} from "@/lib/rpg/projection";
import { HUD_TOP, SCREEN_W, type Screen } from "@/lib/rpg/screen";

/** An axis-aligned block of masonry. */
export interface Box {
  /** Centre in world units. */
  x: number;
  y: number;
  /** Extents along east and north. */
  w: number;
  d: number;
  /** Heights above the ground plane. */
  base: number;
  top: number;
}

/** Nothing nearer than this is projected; it would be behind the eye. */
const NEAR = 10;

/** Light comes from the north-west and stays there. */
const LIGHT_X = -0.6;
const LIGHT_Y = 0.8;

/** Flat tones, same ladder as the interior walls. */
const TONES = [0.62, 0.44, 0.28, 0.14];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

interface CamPoint {
  lat: number;
  z: number;
  h: number;
}

/** A face ready to paint, with the depth it should be sorted at. */
export interface FaceDraw {
  z: number;
  paint: (s: Screen) => void;
}

/** Clip a polygon against the near plane in camera space. */
function clipNear(poly: CamPoint[]): CamPoint[] {
  const out: CamPoint[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const aIn = a.z >= NEAR;
    const bIn = b.z >= NEAR;
    if (aIn) out.push(a);
    if (aIn !== bIn) {
      const t = (NEAR - a.z) / (b.z - a.z);
      out.push({
        lat: a.lat + (b.lat - a.lat) * t,
        z: NEAR,
        h: a.h + (b.h - a.h) * t,
      });
    }
  }
  return out;
}

/** Fill a projected convex polygon with one flat dithered tone, then rim it. */
function paintPolygon(
  s: Screen,
  pts: { x: number; y: number }[],
  level: number,
): void {
  if (pts.length < 3) return;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const y0 = Math.max(0, Math.ceil(minY));
  const y1 = Math.min(HUD_TOP - 1, Math.floor(maxY));

  for (let y = y0; y <= y1; y++) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (a.y === b.y) continue;
      if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
        const x = a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
        if (x < lo) lo = x;
        if (x > hi) hi = x;
      }
    }
    if (lo > hi) continue;
    const xa = Math.max(0, Math.ceil(lo));
    const xb = Math.min(SCREEN_W - 1, Math.floor(hi));
    for (let x = xa; x <= xb; x++) {
      const edge = x === xa || x === xb || y === y0 || y === y1;
      if (edge) {
        s.fb[y * SCREEN_W + x] = BW;
      } else if (BAYER[(y & 3) * 4 + (x & 3)] < level * 16) {
        s.fb[y * SCREEN_W + x] = W;
      } else {
        // Opaque: masonry must occlude whatever stands behind it.
        s.fb[y * SCREEN_W + x] = K;
      }
    }
  }
}

/**
 * Project every visible face of every box and return them as paint jobs,
 * each tagged with its depth so the caller can interleave them with sprites.
 */
export function collectFaces(
  cam: CameraState,
  boxes: readonly Box[],
): FaceDraw[] {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  const out: FaceDraw[] = [];

  const toCam = (wx: number, wy: number, h: number): CamPoint => {
    const dx = wx - ex;
    const dy = wy - ey;
    return { lat: dx * fy - dy * fx, z: dx * fx + dy * fy, h };
  };

  for (const b of boxes) {
    const x0 = b.x - b.w / 2;
    const x1 = b.x + b.w / 2;
    const y0 = b.y - b.d / 2;
    const y1 = b.y + b.d / 2;

    // Four walls (outward normal, corner pair) plus the roof.
    const faces: { nx: number; ny: number; pts: [number, number][] }[] = [
      { nx: 0, ny: -1, pts: [[x0, y0], [x1, y0]] }, // south
      { nx: 0, ny: 1, pts: [[x1, y1], [x0, y1]] }, // north
      { nx: -1, ny: 0, pts: [[x0, y1], [x0, y0]] }, // west
      { nx: 1, ny: 0, pts: [[x1, y0], [x1, y1]] }, // east
    ];

    for (const f of faces) {
      // Backface cull: skip walls turned away from the eye.
      const mx = (f.pts[0][0] + f.pts[1][0]) / 2 - ex;
      const my = (f.pts[0][1] + f.pts[1][1]) / 2 - ey;
      if (mx * f.nx + my * f.ny > 0) continue;

      const poly = clipNear([
        toCam(f.pts[0][0], f.pts[0][1], b.top),
        toCam(f.pts[1][0], f.pts[1][1], b.top),
        toCam(f.pts[1][0], f.pts[1][1], b.base),
        toCam(f.pts[0][0], f.pts[0][1], b.base),
      ]);
      if (poly.length < 3) continue;

      let zsum = 0;
      for (const p of poly) zsum += p.z;
      const z = zsum / poly.length;

      const lit = 0.5 + 0.5 * (f.nx * LIGHT_X + f.ny * LIGHT_Y);
      const band = z > 900 ? 2 : z > 420 ? 1 : 0;
      const level = TONES[Math.min(3, band + (lit > 0.62 ? 0 : lit > 0.3 ? 1 : 2))];
      const screen = poly.map((p) => ({
        x: 128 + (p.lat * FOCAL) / p.z,
        y: heightRow(p.h, p.z),
      }));
      out.push({ z, paint: (s) => paintPolygon(s, screen, level) });
    }

    // The roof is only visible from above it. Drawing it while the eye is
    // lower projects an inverted polygon, which smears across the screen.
    if (b.top >= CAM_HEIGHT) continue;
    const roof = clipNear([
      toCam(x0, y0, b.top),
      toCam(x1, y0, b.top),
      toCam(x1, y1, b.top),
      toCam(x0, y1, b.top),
    ]);
    if (roof.length >= 3) {
      let zsum = 0;
      for (const p of roof) zsum += p.z;
      const z = zsum / roof.length;
      const band = z > 900 ? 2 : z > 420 ? 1 : 0;
      const screen = roof.map((p) => ({
        x: 128 + (p.lat * FOCAL) / p.z,
        y: heightRow(p.h, p.z),
      }));
      out.push({
        z: z + 0.5, // ties broken behind the walls that meet it
        paint: (s) => paintPolygon(s, screen, TONES[Math.min(3, band)]),
      });
    }
  }
  return out;
}
