// The 15 Spectrum colours as an indexed palette. Every pixel the engine touches
// is a palette index; RGB exists only at present time (and in the CSS shell).
//
// Index layout mirrors the ULA: 0-7 normal, 8-15 bright (8 = bright black is
// unused — the Spectrum has no bright black, so index 8 is reserved and never
// emitted by art or terrain).
//
// A *table* is the sixteen RGB triples those indices resolve to. The art never
// knows which table is in force, so a region can be repainted wholesale without
// touching a single sprite: see regions.ts for which part of the world gets
// which table.

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

export type PaletteTable = ReadonlyArray<readonly [number, number, number]>;

/**
 * Sixteen `rrggbb` words in ULA index order — the normal row on the first
 * line, the bright row on the second, so a table reads like the hardware.
 * Index 8 must repeat index 0: bright black is black.
 */
function table(...hex: string[]): PaletteTable {
  return hex.map(
    (h) =>
      [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ] as const,
  );
}

/** Pure primaries at 0xD8, brights at 0xFF: the emulator default. */
export const ULA_STANDARD = table(
  "000000", "0000d8", "d80000", "d800d8", "00d800", "00d8d8", "d8d800", "d8d8d8",
  "000000", "0000ff", "ff0000", "ff00ff", "00ff00", "00ffff", "ffff00", "ffffff",
);

/** Hues pulled off the pure axes toward what a period CRT put on the glass. */
export const PAL_TELEVISION = table(
  "0a0c12", "1a1ea8", "c22a20", "c034a8", "1ea838", "1cb0b4", "d0b23a", "c4c4c0",
  "0a0c12", "303ae8", "f63e30", "f848e0", "3eee56", "44f4f6", "fae860", "fcfcf8",
);

/** Same hues, normal row dropped to 0x98: the bright bit becomes a value step. */
export const DEEP_CONTRAST = table(
  "000000", "000098", "980000", "980098", "009800", "009898", "989800", "989898",
  "000000", "0000ff", "ff0000", "ff00ff", "00ff00", "00ffff", "ffff00", "ffffff",
);

/** True black ground, deep saturated normals, brights kept hot. */
export const JEWEL = table(
  "000000", "00208c", "b01818", "a8208c", "00963c", "00a4a8", "c8a020", "c8ccc4",
  "000000", "2854ff", "ff382c", "ff48d0", "30e058", "40e8f0", "ffe048", "ffffff",
);

/** A cold cast over everything, with red left hot so fire still reads warm. */
export const MOONLIT = table(
  "06080f", "1a2a96", "ac2030", "96309e", "189678", "189cbe", "bebe96", "b0bece",
  "06080f", "3c58ff", "f04848", "dc5af0", "3cebb4", "60f0ff", "ecf0be", "ecf6ff",
);

/** Amber, olive and bone over a black with warmth in it: firelight, late sun. */
export const EMBER_DUSK = table(
  "0e0806", "2e1c8c", "d02c14", "c83078", "78a028", "3ca0a0", "e2a428", "d0c4b0",
  "0e0806", "5c48f0", "ff5828", "ff60a8", "ace848", "78ece0", "ffd058", "fff8e8",
);

/** Palette index -> [r, g, b]. The table in force when no region says otherwise. */
export const PALETTE_RGB: PaletteTable = ULA_STANDARD;
