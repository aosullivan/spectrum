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

import { BC, BW, K, W } from "@/lib/rpg/palette";
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
  /** Optional world-anchored surface treatment. */
  detail?: "wall" | "tower" | "gate" | "door" | "timber" | "timberDoor" | "roof";
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

function drawLine(
  s: Screen,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colour: number,
): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const sx = x < tx ? 1 : -1;
  const dy = -Math.abs(ty - y);
  const sy = y < ty ? 1 : -1;
  let error = dx + dy;
  while (true) {
    s.px(x, y, colour);
    if (x === tx && y === ty) break;
    const twice = error * 2;
    if (twice >= dy) {
      error += dy;
      x += sx;
    }
    if (twice <= dx) {
      error += dx;
      y += sy;
    }
  }
}

/** Stone courses, staggered joints, quoins and arrow slits on one wall face. */
function paintFaceDetail(
  s: Screen,
  box: Box,
  edge: readonly [number, number][],
  toCam: (wx: number, wy: number, h: number) => CamPoint,
  faceDepth: number,
): void {
  if (!box.detail || faceDepth > 900) return;
  const [a, b] = edge;
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const point = (along: number, height: number) => {
    const p = toCam(
      a[0] + (b[0] - a[0]) * along,
      a[1] + (b[1] - a[1]) * along,
      height,
    );
    if (p.z < NEAR) return null;
    return { x: 128 + (p.lat * FOCAL) / p.z, y: heightRow(p.h, p.z) };
  };
  const stroke = (
    fromAlong: number,
    fromHeight: number,
    toAlong: number,
    toHeight: number,
    colour: number,
  ) => {
    const from = point(fromAlong, fromHeight);
    const to = point(toAlong, toHeight);
    if (from && to) drawLine(s, from.x, from.y, to.x, to.y, colour);
  };

  if (box.detail === "door" || box.detail === "timberDoor") {
    // Ignore the thin door's edge faces. Its broad face is a dark oak slab
    // picked out with pale planks and a cyan ward, not another stone panel.
    if (length < box.w * 0.75) return;
    for (let d = 8; d < length; d += 9) {
      stroke(d / length, box.base + 3, d / length, box.top - 3, W);
    }
    stroke(0.03, box.base + 18, 0.97, box.base + 18, BW);
    stroke(0.03, box.base + 48, 0.97, box.base + 48, BW);
    if (box.detail === "door") {
      stroke(0.5, box.base + 25, 0.38, box.base + 35, BC);
      stroke(0.38, box.base + 35, 0.5, box.base + 45, BC);
      stroke(0.5, box.base + 45, 0.62, box.base + 35, BC);
      stroke(0.62, box.base + 35, 0.5, box.base + 25, BC);
    }
    return;
  }

  if (box.detail === "timber") {
    stroke(0.02, box.base + 7, 0.98, box.base + 7, BW);
    stroke(0.02, box.top - 7, 0.98, box.top - 7, BW);
    for (const along of [0.22, 0.5, 0.78]) {
      stroke(along, box.base + 5, along, box.top - 5, BW);
    }
    stroke(0.03, box.base + 9, 0.49, box.top - 9, W);
    stroke(0.49, box.top - 9, 0.97, box.base + 9, W);
    stroke(0.03, box.top - 9, 0.49, box.base + 9, W);
    stroke(0.49, box.base + 9, 0.97, box.top - 9, W);
    return;
  }

  if (box.detail === "roof") {
    for (let d = 7; d < length; d += 10) {
      const along = d / length;
      stroke(along, box.base + 1, along, box.top - 1, W);
    }
    stroke(0.01, box.base + 2, 0.99, box.base + 2, K);
    stroke(0.01, box.top - 2, 0.99, box.top - 2, BW);
    return;
  }

  const course = box.detail === "tower" ? 13 : 15;
  let band = 0;
  for (let h = box.base + course; h < box.top - 2; h += course) {
    stroke(0.02, h, 0.98, h, K);
    const offset = band % 2 === 0 ? 0 : 11;
    for (let d = 22 + offset; d < length - 7; d += 22) {
      const along = d / length;
      stroke(along, h - course + 2, along, h - 2, K);
    }
    band++;
  }

  // Bright alternating corner stones keep tower edges readable against the
  // black sky without filling the whole wall white.
  for (let h = box.base + 8; h < box.top - 4; h += 18) {
    stroke(0, h, 0.1, h, BW);
    stroke(0.9, h + 7, 1, h + 7, BW);
  }

  if (box.detail === "tower" || box.detail === "gate") {
    const slots = length > 54 ? [0.34, 0.66] : [0.5];
    for (const along of slots) {
      const spread = Math.min(0.035, 2 / length);
      const low = box.base + Math.min(38, (box.top - box.base) * 0.34);
      const high = Math.min(box.top - 15, low + 22);
      stroke(along - spread, low, along - spread, high, BW);
      stroke(along + spread, low, along + spread, high, BW);
      stroke(along, low + 1, along, high - 1, K);
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
      out.push({
        z,
        paint: (s) => {
          paintPolygon(
            s,
            screen,
            b.detail === "door" || b.detail === "timberDoor" ? 0 : level,
          );
          paintFaceDetail(s, b, f.pts, toCam, z);
        },
      });
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
