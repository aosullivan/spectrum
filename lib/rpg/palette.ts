// The 15 Spectrum colours as an indexed palette. Every pixel the engine touches
// is a palette index; RGB exists only at present time (and in the CSS shell).
//
// Index layout mirrors the ULA: 0-7 normal, 8-15 bright (8 = bright black is
// unused — the Spectrum has no bright black, so index 8 is reserved and never
// emitted by art or terrain).

export const K = 0; // black
export const B = 1; // blue
export const R = 2; // red
export const M = 3; // magenta
export const G = 4; // green
export const C = 5; // cyan
export const Y = 6; // yellow
export const W = 7; // white
export const BB = 9; // bright blue
export const BR = 10; // bright red
export const BM = 11; // bright magenta
export const BG = 12; // bright green
export const BC = 13; // bright cyan
export const BY = 14; // bright yellow
export const BW = 15; // bright white

/** Transparent marker for sprite data (never a drawable colour). */
export const T = 255;

const DIM = 0xd8;

/** Palette index -> [r, g, b]. Index 8 (bright black) renders as black. */
export const PALETTE_RGB: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0],
  [0, 0, DIM],
  [DIM, 0, 0],
  [DIM, 0, DIM],
  [0, DIM, 0],
  [0, DIM, DIM],
  [DIM, DIM, 0],
  [DIM, DIM, DIM],
  [0, 0, 0],
  [0, 0, 255],
  [255, 0, 0],
  [255, 0, 255],
  [0, 255, 0],
  [0, 255, 255],
  [255, 255, 0],
  [255, 255, 255],
];
