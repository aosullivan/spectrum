// The 15 Spectrum colours as an indexed palette. Every pixel the engine touches
// is a palette index; RGB exists only at present time (and in the CSS shell).
//
// Index layout mirrors the ULA: 0-7 normal, 8-15 bright. Index 8 — bright
// black on real hardware, which does not exist — is the *earth* slot: a tone
// darker than any normal colour that only terrain may emit, and only when
// LOOK.earth is on (see look.ts). With the flag off nothing emits it and the
// strict 15-colour fiction holds.
//
// A *table* is the RGB triples those indices resolve to. The art never
// knows which table is in force, so a region can be repainted wholesale without
// touching a single sprite: see regions.ts for which part of the world gets
// which table.
//
// Above the ULA rows sit the ULAplus rows: value ramps that terrain, sky,
// masonry and distance shading walk, and which sprite art never names
// directly. A real ULAplus part gives 64 colours; this table uses 63 of them,
// and every one is derived from the sixteen a table already declares, so a
// new region palette is still authored as sixteen colours and its weather.

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

// ------------------------------------------------------------ ULAplus rows
//
// Each ramp runs dark to light and is *interleaved*: the shades a table
// authors land on the even entries and the engine fills the odd ones with
// their midpoints. So the shipped four-step ladders survive exactly — they
// are the even subset — and every new shade sits between two old ones rather
// than displacing them. That is what makes the old look and the shaded look
// A/B-able: same value curve, sampled twice as finely.
//
// Sprites and the HUD still never name these rows, so the 15-colour art rules
// hold for everything that moves; the ramps are lighting, not paint.

/** Ground: 11 steps, deep soil to lit grass. Evens are the authored soil rows, then G, BG. */
export const RAMP_G0 = 16;
export const RAMP_G_N = 11;
/** Sky: 7 steps, zenith to horizon. Evens are the authored sky rows. */
export const RAMP_S0 = 27;
export const RAMP_S_N = 7;
/** Stone: 7 steps, unlit masonry to a moonlit face. Evens end at W, BW. */
export const RAMP_K0 = 34;
export const RAMP_K_N = 7;
/** Leaf: 7 steps, canopy shadow to lit foliage. Evens end at G, BG. */
export const RAMP_F0 = 41;
export const RAMP_F_N = 7;
/** Glow: 7 steps, deep water to ley-light. Evens end at C, BC. */
export const RAMP_L0 = 48;
export const RAMP_L_N = 7;
/**
 * One dim shade per normal ULA hue, at `DIM0 + (colour & 7)`. Red, blue,
 * magenta and yellow have no ramp of their own; without a rung below them a
 * distant thing painted in one of them cannot recede at all.
 */
export const DIM0 = 55;

/** Total entries in a table. */
export const PALETTE_N = 63;

/** Transparent marker for sprite data (never a drawable colour). */
export const T = 255;

export type Rgb = readonly [number, number, number];
export type PaletteTable = ReadonlyArray<Rgb>;

function rgbOf(hex: string): Rgb {
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ] as const;
}

/**
 * Blend two colours. Straight sRGB, matching how regions.ts crossfades two
 * tables: a ramp built one way and blended another drifts off its own curve
 * halfway between regions, which is exactly where nobody is looking for a
 * bug.
 */
function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ] as const;
}

/**
 * `anchors` laid on the even entries of a `2n-1`-step ramp, odd entries being
 * the midpoint of their neighbours. Interleaving rather than resampling is
 * what keeps an authored ladder intact inside the finer one.
 */
function interleave(anchors: readonly Rgb[]): Rgb[] {
  const out: Rgb[] = [anchors[0]];
  for (let i = 1; i < anchors.length; i++) {
    out.push(mixRgb(anchors[i - 1], anchors[i], 0.5), anchors[i]);
  }
  return out;
}

/**
 * A ramp from the table's own black up to `top`, through a mid anchor, so
 * every family (stone, leaf, ley-light) gets its dark rungs for free from the
 * one colour that names it. The two fractions are where the authored anchors
 * sit: low enough that the bottom of the ramp is nearly out, far enough apart
 * that the steps between them read as separate tones rather than as noise.
 */
function familyRamp(black: Rgb, mid: Rgb, top: Rgb): Rgb[] {
  return interleave([
    mixRgb(black, mid, 0.13),
    mixRgb(black, mid, 0.42),
    mid,
    top,
  ]);
}

/**
 * Twenty-four `rrggbb` words in ULA index order — the normal row on the
 * first line, the bright row on the second, so a table reads like the
 * hardware — plus a third line of authored ULAplus anchors: four soil tones
 * (dark to light) and four sky tones (zenith to horizon). Index 8 is the
 * table's earth tone: the colour of bare ground when LOOK.earth is on,
 * darker than every normal colour so black stays black for water, sky and
 * sprite work.
 *
 * Everything above index 15 is derived from those words: the ramps are the
 * authored anchors interleaved with their own midpoints, and the dim row is
 * each normal hue taken most of the way out. A table therefore still says
 * only what a Spectrum artist would have chosen — sixteen colours and the
 * weather — and the sixty-three the renderer sees follow from it.
 */
function table(...hex: string[]): PaletteTable {
  const ula = hex.slice(0, 16).map(rgbOf);
  const soil = hex.slice(16, 20).map(rgbOf);
  const sky = hex.slice(20, 24).map(rgbOf);
  const black = ula[K];
  const out: Rgb[] = [
    ...ula,
    // Ground climbs out of the soil rows and on into the living greens, so
    // one ramp carries bare earth and turf without a seam where they meet.
    // The soil rows interleave with their own midpoints; the long haul from
    // the top soil to full green gets two bridging tones instead, placed by
    // eye rather than by halving — a midpoint between dark olive and a
    // saturated green is most of the way to the green already, so halving
    // that gap spends a rung on nothing and leaves the climb as steep as it
    // was.
    ...interleave(soil),
    ...[0.28, 0.6].map((t) => mixRgb(soil[3], ula[G], t)),
    ula[G],
    ula[BG],
    ...interleave(sky),
    ...familyRamp(black, ula[W], ula[BW]),
    ...familyRamp(black, ula[G], ula[BG]),
    ...familyRamp(black, ula[C], ula[BC]),
    ...ula.slice(0, 8).map((c) => mixRgb(black, c, 0.38)),
  ];
  if (out.length !== PALETTE_N) {
    throw new Error(`palette table is ${out.length} entries, expected ${PALETTE_N}`);
  }
  return out;
}

/** Pure primaries at 0xD8, brights at 0xFF: the emulator default. */
export const ULA_STANDARD = table(
  "000000", "0000d8", "d80000", "d800d8", "00d800", "00d8d8", "d8d800", "d8d8d8",
  "101c0a", "0000ff", "ff0000", "ff00ff", "00ff00", "00ffff", "ffff00", "ffffff",
  "0b1407", "13220b", "1d3410", "2a4a18", "04060a", "0a1226", "121e44", "1c2f66",
);

/** Hues pulled off the pure axes toward what a period CRT put on the glass. */
export const PAL_TELEVISION = table(
  "0a0c12", "1a1ea8", "c22a20", "c034a8", "1ea838", "1cb0b4", "d0b23a", "c4c4c0",
  "141c12", "303ae8", "f63e30", "f848e0", "3eee56", "44f4f6", "fae860", "fcfcf8",
  "0e150d", "162112", "20301a", "2c4024", "060810", "0c1220", "141e38", "1e2c52",
);

/** Same hues, normal row dropped to 0x98: the bright bit becomes a value step. */
export const DEEP_CONTRAST = table(
  "000000", "000098", "980000", "980098", "009800", "009898", "989800", "989898",
  "0e160a", "0000ff", "ff0000", "ff00ff", "00ff00", "00ffff", "ffff00", "ffffff",
  "0a1206", "121e0a", "1a2c10", "243c16", "040608", "081020", "101c3c", "182c58",
);

/** True black ground, deep saturated normals, brights kept hot. */
export const JEWEL = table(
  "000000", "00208c", "b01818", "a8208c", "00963c", "00a4a8", "c8a020", "c8ccc4",
  "0c1806", "2854ff", "ff382c", "ff48d0", "30e058", "40e8f0", "ffe048", "ffffff",
  "0a1405", "12220a", "1c3410", "264a16", "030509", "091126", "111d46", "1a2e6a",
);

/** A cold cast over everything, with red left hot so fire still reads warm. */
export const MOONLIT = table(
  "06080f", "1a2a96", "ac2030", "96309e", "128a64", "189cbe", "bebe96", "b0bece",
  "0e1820", "3c58ff", "f04848", "dc5af0", "3cebb4", "60f0ff", "ecf0be", "ecf6ff",
  "0b1418", "12222a", "1a323c", "24444c", "05070e", "0b1424", "12203e", "1c305a",
);

/** Amber, olive and bone over a black with warmth in it: firelight, late sun. */
export const EMBER_DUSK = table(
  "0e0806", "2e1c8c", "d02c14", "c83078", "78a028", "3ca0a0", "e2a428", "d0c4b0",
  "1c1208", "5c48f0", "ff5828", "ff60a8", "ace848", "78ece0", "ffd058", "fff8e8",
  "150d06", "221709", "31220e", "422f14", "0a0510", "180b28", "281444", "3c2060",
);

// --------------------------------------------------------------- night key
//
// The `night` look lifts the sky ramp from near-black to a just-visible
// navy: night air instead of void. Each table pairs with four night
// ANCHORS, zenith to horizon, in its own cast — cold navy on the moor,
// softened in the greenwood, warmed toward violet in the ember west — and
// the seven live rows are those anchors interleaved, exactly as table()
// builds the day ramp. Swapping values under fixed indices is what a real
// ULAplus palette reload did, so the fiction holds, and keeping it a
// runtime swap keeps every older preset bit-for-bit when the dial is off.

const NIGHT_SKY: ReadonlyArray<[PaletteTable, readonly Rgb[]]> = [
  [ULA_STANDARD, ["0a1430", "132242", "1c3058", "24386a"].map(rgbOf)],
  [PAL_TELEVISION, ["0c1428", "141f3a", "1c2c50", "263862"].map(rgbOf)],
  [DEEP_CONTRAST, ["0a1226", "101c3a", "182a52", "22386a"].map(rgbOf)],
  [JEWEL, ["0a1230", "121f44", "1a2d5e", "243c78"].map(rgbOf)],
  [MOONLIT, ["0c1626", "14223c", "1c3054", "263e66"].map(rgbOf)],
  [EMBER_DUSK, ["140b26", "22123c", "321c54", "46286c"].map(rgbOf)],
];

/** The tables' own sky rows, copied before any swap so off restores exactly. */
const DAY_SKY: ReadonlyArray<PaletteTable> = NIGHT_SKY.map(([t]) =>
  t.slice(RAMP_S0, RAMP_S0 + RAMP_S_N).map((c) => [...c] as const),
);

let nightApplied = false;

/** Write the day or night sky rows into every table, in place. */
export function applyNightSky(on: boolean): void {
  if (on === nightApplied) return;
  nightApplied = on;
  NIGHT_SKY.forEach(([into, anchors], i) => {
    const rows = on ? interleave(anchors) : DAY_SKY[i];
    for (let r = 0; r < RAMP_S_N; r++) {
      const dst = into[RAMP_S0 + r] as unknown as [number, number, number];
      dst[0] = rows[r][0];
      dst[1] = rows[r][1];
      dst[2] = rows[r][2];
    }
  });
}

/** Palette index -> [r, g, b]. The table in force when no region says otherwise. */
export const PALETTE_RGB: PaletteTable = ULA_STANDARD;

// ------------------------------------------------------------------ dimming
//
// One step darker, in index space rather than in RGB. It has to be index
// space: regions.ts crossfades two tables into a scratch buffer every frame,
// so a mapping computed from RGB would be recomputed per frame or, worse,
// cached and stale. Every table shares this layout, so the chains below hold
// whichever weather the player is standing in.

function chain(base: number, n: number, ...tail: number[]): number[] {
  return [K, ...Array.from({ length: n }, (_, i) => base + i), ...tail];
}

/**
 * The ladders a colour walks down as it recedes. Each is dark to light, and
 * `dimmer` reads them as "the rung below". The ULA colours are spliced into
 * their own family's ladder — a distant white wall steps down through stone,
 * not through some nearest-RGB accident.
 */
const LADDERS: readonly number[][] = [
  // Stone, leaf and ley-light. A family ramp ends on its own copies of the
  // ULA pair that names it, so those two rungs are skipped and the ULA
  // colours spliced in instead: without that the chain spends two of its
  // steps moving between colours that are the same colour, and a distant
  // wall dims by nothing at all.
  [...chain(RAMP_K0, RAMP_K_N - 3), W, RAMP_K0 + RAMP_K_N - 2, BW],
  [...chain(RAMP_F0, RAMP_F_N - 3), G, RAMP_F0 + RAMP_F_N - 2, BG],
  [...chain(RAMP_L0, RAMP_L_N - 3), C, RAMP_L0 + RAMP_L_N - 2, BC],
  chain(RAMP_G0, RAMP_G_N),
  chain(RAMP_S0, RAMP_S_N),
  // The four hues with no ramp of their own get the one dim rung below them.
  ...[B, R, M, Y].map((h) => [K, DIM0 + h, h, h + 8]),
];

/** How many steps of dimming are worth precomputing (see `dimmer`). */
const DIM_STEPS = 4;

const DIM_TABLES: Uint8Array[] = (() => {
  const one = new Uint8Array(PALETTE_N);
  for (let i = 0; i < PALETTE_N; i++) one[i] = i;
  for (const ladder of LADDERS) {
    for (let i = 1; i < ladder.length; i++) one[ladder[i]] = ladder[i - 1];
  }
  one[K] = K;
  const tables = [one];
  for (let step = 1; step < DIM_STEPS; step++) {
    const prev = tables[step - 1];
    const next = new Uint8Array(PALETTE_N);
    for (let i = 0; i < PALETTE_N; i++) next[i] = one[prev[i]];
    tables.push(next);
  }
  return tables;
})();

/**
 * The colour `steps` rungs further from the light — how a thing recedes when
 * there are shades to recede through. Distance used to be spent by dithering
 * a sprite into holes; a ladder spends it in value instead, which is what the
 * eye actually reads as air.
 */
export function dimmed(colour: number, steps: number): number {
  if (steps <= 0 || colour >= PALETTE_N) return colour;
  return DIM_TABLES[Math.min(DIM_STEPS, steps) - 1][colour];
}

/**
 * True for the colours the ground may emit as *light* rather than as paint:
 * the two ULA cyans and the ley-light ramp below them. The renderer holds
 * these back and composites them after the clash pass, or a two-pixel core
 * loses its cell's vote to the turf around it and the leyline goes out.
 */
export function isLeyLight(colour: number): boolean {
  return (
    colour === C ||
    colour === BC ||
    (colour >= RAMP_L0 && colour < RAMP_L0 + RAMP_L_N)
  );
}

/** The whole lookup for one dimming step, for inner loops. */
export function dimTable(steps: number): Uint8Array | null {
  if (steps <= 0) return null;
  return DIM_TABLES[Math.min(DIM_STEPS, steps) - 1];
}
