// Which palette table each part of the world is painted in.
//
// The Spectrum has one palette at a time, so this is not a lighting model: the
// whole screen — sky, ground, sprites, HUD — resolves through whichever table
// the player is standing in. Crossing between regions therefore has to be
// gradual, or the picture snaps. Every edge is a fade band, and the table the
// renderer receives is usually a blend of two.
//
// This module sits downstream of both palette.ts and world.ts on purpose:
// world.ts imports colour indices from palette.ts, so the region mapping cannot
// live in either of them without a cycle.

import {
  EMBER_DUSK,
  MOONLIT,
  PAL_TELEVISION,
  ULA_STANDARD,
  type PaletteTable,
} from "@/lib/rpg/palette";
import {
  DEAD_WOOD_X,
  GREENWOOD_EDGE_X,
  GROVE_POS,
  GROVE_R,
} from "@/lib/rpg/world";

/** World units either side of a band edge over which one table becomes another. */
const BAND_FADE = 130;
/** The grove's edge is softer still — you should not be able to name the line. */
const GROVE_FADE = 70;

/** Smoothstep from 0 at `lo` to 1 at `hi`. */
function ramp(v: number, lo: number, hi: number): number {
  const t = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}

function newTable(): [number, number, number][] {
  return Array.from({ length: 16 }, () => [0, 0, 0] as [number, number, number]);
}

// Blending runs every frame, so the two working tables are reused rather than
// reallocated. `into` is never one of the inputs, which keeps the aliasing
// question from arising at all.
const banded = newTable();
const blended = newTable();

function mix(
  a: PaletteTable,
  b: PaletteTable,
  t: number,
  into: [number, number, number][],
): PaletteTable {
  if (t <= 0) return a;
  if (t >= 1) return b;
  for (let i = 0; i < 16; i++) {
    for (let c = 0; c < 3; c++) {
      into[i][c] = Math.round(a[i][c] + (b[i][c] - a[i][c]) * t);
    }
  }
  return into;
}

/**
 * The table for a world position.
 *
 * West to east the world runs dead wood, moor, greenwood, and each band has its
 * own weather: the old wood is dying under a late warm sun, the moor is the
 * cold electric baseline, the greenwood is softened like a picture on a
 * television. The grove overrides whichever band it sits in — still water under
 * a moon is the one place that should not look like the forest around it.
 */
export function paletteAt(x: number, y: number): PaletteTable {
  let out: PaletteTable = ULA_STANDARD;
  if (x < DEAD_WOOD_X + BAND_FADE) {
    out = mix(
      EMBER_DUSK,
      ULA_STANDARD,
      ramp(x, DEAD_WOOD_X - BAND_FADE, DEAD_WOOD_X + BAND_FADE),
      banded,
    );
  } else if (x > GREENWOOD_EDGE_X - BAND_FADE) {
    out = mix(
      ULA_STANDARD,
      PAL_TELEVISION,
      ramp(x, GREENWOOD_EDGE_X - BAND_FADE, GREENWOOD_EDGE_X + BAND_FADE),
      banded,
    );
  }
  const grove = Math.hypot(x - GROVE_POS.x, y - GROVE_POS.y);
  if (grove < GROVE_R + GROVE_FADE) {
    out = mix(
      MOONLIT,
      out,
      ramp(grove, GROVE_R - GROVE_FADE, GROVE_R + GROVE_FADE),
      blended,
    );
  }
  return out;
}
