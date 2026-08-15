// Ordered dithering and colour ramps.
//
// This is the technique behind dense two-colour shading: a *smooth* field
// (light, lushness, distance) is resolved into *two adjacent palette colours*
// mixed at pixel level. That matters for authenticity as much as for looks —
// a cell shaded from one ramp step to the next holds exactly two colours, so
// it survives the attribute pass untouched instead of losing detail to the
// two-colour vote.

/** 8x8 Bayer matrix, 0..63. Finer than the 4x4 used by walls and masonry. */
const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

/** Ordered-dither threshold at a screen pixel, 0..1. */
export function bayer(x: number, y: number): number {
  return BAYER8[(y & 7) * 8 + (x & 7)] / 64;
}

/**
 * A ramp is a dark-to-light run of palette indices. `level` 0..1 walks it;
 * the fraction between two steps becomes a dither mix of just those two.
 */
export type Ramp = readonly number[];

export function rampColour(ramp: Ramp, level: number, x: number, y: number): number {
  const l = Math.max(0, Math.min(0.99999, level)) * (ramp.length - 1);
  const step = Math.floor(l);
  return bayer(x, y) < l - step ? ramp[step + 1] : ramp[step];
}

/** Value noise on a `cell`-sized lattice, smoothstep-interpolated, 0..1. */
export function noise(
  hash: (x: number, y: number) => number,
  x: number,
  y: number,
  cell: number,
): number {
  const gx = Math.floor(x / cell);
  const gy = Math.floor(y / cell);
  const fx = x / cell - gx;
  const fy = y / cell - gy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(gx, gy) / 1000;
  const b = hash(gx + 1, gy) / 1000;
  const c = hash(gx, gy + 1) / 1000;
  const d = hash(gx + 1, gy + 1) / 1000;
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

/** Two octaves of `noise`, which is enough to break up a flat field. */
export function fbm(
  hash: (x: number, y: number) => number,
  x: number,
  y: number,
  cell: number,
): number {
  return noise(hash, x, y, cell) * 0.65 + noise(hash, x + 91, y - 57, cell / 3) * 0.35;
}
