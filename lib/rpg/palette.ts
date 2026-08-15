// The 15 Spectrum colours as an indexed palette. Every pixel the engine touches
// is a palette index; RGB exists only at present time (and in the CSS shell).
//
// Index layout mirrors the ULA: 0-7 normal, 8-15 bright. Index 8 — bright
// black on real hardware, which does not exist — is the *earth* slot: a tone
// darker than any normal colour that only terrain may emit, and only when
// LOOK.earth is on (see look.ts). With the flag off nothing emits it and the
// strict 15-colour fiction holds.
//
// A *table* is the sixteen RGB triples those indices resolve to. The art never
// knows which table is in force, so a region can be repainted wholesale without
// touching a single sprite: see regions.ts for which part of the world gets
// which table.
//
// Every region's table comes in two keys, night and day, differing only in the
// eight ULAplus terrain rows — see `Mood` below.

import { LOOK } from "@/lib/rpg/look";

export const K = 0; // black
export const B = 1; // blue
export const R = 2; // red
export const M = 3; // magenta
export const G = 4; // green
export const C = 5; // cyan
export const Y = 6; // yellow
export const W = 7; // white
export const E = 8; // earth: terrain-only deep tone (see look.ts)
export const BB = 9; // bright blue
export const BR = 10; // bright red
export const BM = 11; // bright magenta
export const BG = 12; // bright green
export const BC = 13; // bright cyan
export const BY = 14; // bright yellow
export const BW = 15; // bright white

// The ULAplus rows (the `ramps` look): terrain-and-sky-only value ramps.
// Sprites and HUD never touch them, so the 15-colour art rules still hold
// for everything that moves.
/** Ground ramp, dark..lit = RAMP_G0..RAMP_G0+3. */
export const RAMP_G0 = 16;
/** Sky ramp, zenith..horizon = RAMP_S0..RAMP_S0+3. */
export const RAMP_S0 = 20;

/** Transparent marker for sprite data (never a drawable colour). */
export const T = 255;

export type PaletteTable = ReadonlyArray<readonly [number, number, number]>;

/**
 * A region's weather under both keys. The sixteen ULA words are the region's
 * *paint* and never change with the hour — sprites, HUD and line-work must
 * look like themselves at noon and at midnight — so a mood only swaps the
 * eight ULAplus terrain rows, which are its *light*.
 */
export interface Mood {
  readonly night: PaletteTable;
  readonly day: PaletteTable;
}

/**
 * Thirty-two `rrggbb` words in four lines of eight. The first two are the ULA
 * in index order — normal row, then bright — so a mood reads like the
 * hardware. Index 8 is its earth tone: the colour of bare ground when
 * LOOK.earth is on, darker than every normal colour so black stays black for
 * water, sky and sprite work.
 *
 * The last two lines are the ULAplus fiction, one per key: the ground ramp
 * (16..19, dark to lit) followed by the sky ramp (20..23, zenith to horizon).
 * Line three is the night key, line four the day. Used only when LOOK.ramps
 * is on; which of the two is installed is LOOK.daylight (see `lit`).
 */
function mood(...hex: string[]): Mood {
  const rgb = hex.map(
    (h) =>
      [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ] as const,
  );
  return { night: rgb.slice(0, 24), day: [...rgb.slice(0, 16), ...rgb.slice(24, 32)] };
}

/** The table a mood shows under the look's key. */
export function lit(m: Mood): PaletteTable {
  return LOOK.daylight ? m.day : m.night;
}

/**
 * Pure primaries at 0xD8, brights at 0xFF: the emulator default. The open
 * moor's weather. By day the ground walks turned earth up through dry ochre
 * into turf — the four soil rows carry the earth colours the night key had no
 * use for — under a sky that opens from azure to a pale horizon.
 */
export const ULA_STANDARD = mood(
  "000000", "0000d8", "d80000", "d800d8", "00d800", "00d8d8", "d8d800", "d8d8d8",
  "101c0a", "0000ff", "ff0000", "ff00ff", "00ff00", "00ffff", "ffff00", "ffffff",
  "0b1407", "13220b", "1d3410", "2a4a18", "04060a", "0a1226", "121e44", "1c2f66",
  "3c2e1c", "6f5228", "8c7a30", "86b83c", "3d72c4", "55a0d4", "86cce0", "bceaf0",
);

/** Hues pulled off the pure axes toward what a period CRT put on the glass. */
export const PAL_TELEVISION = mood(
  "0a0c12", "1a1ea8", "c22a20", "c034a8", "1ea838", "1cb0b4", "d0b23a", "c4c4c0",
  "141c12", "303ae8", "f63e30", "f848e0", "3eee56", "44f4f6", "fae860", "fcfcf8",
  "0e150d", "162112", "20301a", "2c4024", "060810", "0c1220", "141e38", "1e2c52",
  "34301e", "5c5828", "78843a", "62b048", "4a7ab8", "62a6c8", "92d0d8", "c4ece8",
);

/** Same hues, normal row dropped to 0x98: the bright bit becomes a value step. */
export const DEEP_CONTRAST = mood(
  "000000", "000098", "980000", "980098", "009800", "009898", "989800", "989898",
  "0e160a", "0000ff", "ff0000", "ff00ff", "00ff00", "00ffff", "ffff00", "ffffff",
  "0a1206", "121e0a", "1a2c10", "243c16", "040608", "081020", "101c3c", "182c58",
  "342818", "645020", "8c7c2c", "68b034", "3468bc", "4ca0d4", "84cce4", "c0ecf4",
);

/** True black ground, deep saturated normals, brights kept hot. */
export const JEWEL = mood(
  "000000", "00208c", "b01818", "a8208c", "00963c", "00a4a8", "c8a020", "c8ccc4",
  "0c1806", "2854ff", "ff382c", "ff48d0", "30e058", "40e8f0", "ffe048", "ffffff",
  "0a1405", "12220a", "1c3410", "264a16", "030509", "091126", "111d46", "1a2e6a",
  "3a2c18", "6c5024", "a08034", "70bc34", "2c6cc8", "48a8dc", "80cce8", "bcecf8",
);

/**
 * A cold cast over everything, with red left hot so fire still reads warm.
 * Daylight over the grove is the coolest in the world: silvered turf, and a
 * sky whose blue keeps more of its blue than the moor's does.
 */
export const MOONLIT = mood(
  "06080f", "1a2a96", "ac2030", "96309e", "128a64", "189cbe", "bebe96", "b0bece",
  "0e1820", "3c58ff", "f04848", "dc5af0", "3cebb4", "60f0ff", "ecf0be", "ecf6ff",
  "0b1418", "12222a", "1a323c", "24444c", "05070e", "0b1424", "12203e", "1c305a",
  "2c3c38", "4c6458", "6e8c74", "80c498", "3a6cb0", "5298c8", "8cc4d4", "bce4e8",
);

/**
 * Amber, olive and bone over a black with warmth in it: firelight, late sun.
 * By day the dead wood stands on dust and dry bracken under a sky the heat
 * has bleached toward straw at the horizon.
 */
export const EMBER_DUSK = mood(
  "0e0806", "2e1c8c", "d02c14", "c83078", "78a028", "3ca0a0", "e2a428", "d0c4b0",
  "1c1208", "5c48f0", "ff5828", "ff60a8", "ace848", "78ece0", "ffd058", "fff8e8",
  "150d06", "221709", "31220e", "422f14", "0a0510", "180b28", "281444", "3c2060",
  "463018", "745224", "a08238", "b4c850", "5c80bc", "84aacc", "b4cedc", "e8e8c8",
);

/** Palette index -> [r, g, b]. The table in force when no region says otherwise. */
export const PALETTE_RGB: PaletteTable = ULA_STANDARD.day;
