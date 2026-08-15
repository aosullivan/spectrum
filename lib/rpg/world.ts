// The open world: deterministic terrain sampling plus chunked feature
// placement. World units are roughly "pixels at the hero's depth"; +x is
// east, +y is north. Everything is derived from hashes — no stored map yet
// (authored biome data arrives with the first dungeon milestone).

import {
  BOULDER_MOSSY,
  DEAD_BRACKEN,
  FUNGI_SHELF,
  MENHIR,
  MENHIR_LEY,
  STONE_LEANING,
  TREE_BONE_FAR,
  TREE_DEAD_PINE,
  TREE_GNARLED_A,
  TREE_GNARLED_B,
  TREE_GNARLED_C,
} from "@/lib/rpg/art";
import { DOLMEN, STONE_L, STONE_M, STONE_S } from "@/lib/rpg/assets";
import {
  BUSH,
  FALLEN_LOGS,
  FLOWERS,
  MUSHROOM_PATCH,
  REEDS,
  SARSEN_FALLEN,
  SARSEN_TALL,
  TREE_BIRCH,
  TREE_OAK,
  TREE_WILLOW,
  TRILITHON,
} from "@/lib/rpg/flora";
import { fbm, rampColour, type Ramp } from "@/lib/rpg/dither";
import {
  HERMITAGE_BOXES,
  HERMITAGE_POS,
  HERMITAGE_PROPS,
  HERMITAGE_R,
} from "@/lib/rpg/hermitage";
import { LOOK } from "@/lib/rpg/look";
import {
  B,
  BC,
  BG,
  BW,
  C,
  E,
  G,
  K,
  R,
  RAMP_G0,
  RAMP_G_N,
  RAMP_L0,
  W,
  Y,
} from "@/lib/rpg/palette";
import { hash, type Sprite } from "@/lib/rpg/screen";
import type { Box } from "@/lib/rpg/structures";
import {
  VILLAGE_BOXES,
  VILLAGE_DOORWAYS,
  VILLAGE_POS,
  VILLAGE_PROPS,
  VILLAGE_YARD,
  inVillageClearing,
  type Doorway,
} from "@/lib/rpg/village";

export { VILLAGE_POS } from "@/lib/rpg/village";
export type { Doorway } from "@/lib/rpg/village";
export { HERMITAGE_BOXES, HERMITAGE_POS } from "@/lib/rpg/hermitage";

// ------------------------------------------------------------------- places

/**
 * Places are laid out as a journey, not a cluster. The leyline is the spine:
 * it runs due north from spawn to the keep, and the named places alternate
 * east and west of it in bands, one destination per band. Nothing shares a
 * band with anything else, so from any of them the next is a walk across
 * open ground rather than a step sideways — and the ancient wood west of the
 * line gets two of its own, or it is half the map with nothing in it.
 *
 *      y 1400   THE KEEP ......................... on the line
 *      y 1100   .............. THE VILLAGE ....... east
 *      y  900   THE HERMITAGE ..... THE HENGE .... west / far east
 *      y  500   STONE CIRCLE ...... THE GROVE .... west / east
 *      y   40   spawn ............................ on the line
 */

/** The keep the player can see from spawn and walk to. */
export const KEEP_POS = { x: 0, y: 1400 };
/** Shared exterior/interior footprint. */
export const KEEP_SIZE = { width: 288, depth: 320 } as const;
/** The visible south threshold where the leyline enters the keep. */
export const KEEP_GATE_Y = KEEP_POS.y - KEEP_SIZE.depth / 2;
/** A stone circle off the leyline — landmark and future save shrine. */
export const CIRCLE_POS = { x: -340, y: 520 };
/** Trees stand off the stones, or the circle is invisible inside the wood. */
const CIRCLE_R = 150;
/** The sacred grove: still water, living ground, and the lady who rises. */
export const GROVE_POS = { x: 500, y: 560 };
const POOL_R = 62;
export const GROVE_R = 190;
/**
 * The world splits into three bands. West of WOODS_EDGE_X the moor decays
 * into ancient dead woodland — bare gnarled limbs, nothing living. East of
 * GREENWOOD_EDGE_X it becomes living greenwood: oak, birch, bracken, and
 * the henge. Between them lies the open moor with the leyline running north.
 */
export const DEAD_WOOD_X = -260;
const WOODS_EDGE_X = DEAD_WOOD_X;
export const GREENWOOD_X = 260;
export const GREENWOOD_EDGE_X = GREENWOOD_X;
/** The henge stands deep in the greenwood. */
export const HENGE_POS = { x: 840, y: 980 };
const HENGE_R = 210;

// ------------------------------------------------------------------ terrain

/**
 * Biome ground ramps, dark to light. The field and the dither above them
 * never change; the look only changes what darkness is made of. Classic
 * starts at black — the moor lit by nothing but the leyline, shadow as the
 * ground's resting state. The earth look floors it at the region's earth
 * tone instead. The ULAplus look walks the palette's soil rows up into
 * grass, so far ground fades to dark soil rather than to void.
 * Steps are neighbours in tone, so a cell shaded between two of them holds
 * exactly two colours and survives the attribute pass unaltered.
 */
const GROUND_RAMP: Ramp = [K, K, G, BG];
const GROUND_RAMP_EARTH: Ramp = [E, E, G, BG];
/**
 * The soil rows a table authors, then the living greens: the ladder the
 * `ramps` look shipped. Its rungs are the *even* entries of the finer ramp
 * below, so the two differ in resolution and in nothing else.
 */
const GROUND_RAMP_ULAPLUS: Ramp = [
  RAMP_G0,
  RAMP_G0 + 2,
  RAMP_G0 + 4,
  G,
  BG,
];
/**
 * The same ladder with a shade between every pair. The old one crossed from
 * dark soil straight to full green in one step, so all the ground a player
 * actually walks on sat at that step or either side of it and the moor read
 * as two colours in a dither. The rungs in between are where turf lives.
 */
const GROUND_RAMP_SHADED: Ramp = Array.from(
  { length: RAMP_G_N },
  (_, i) => RAMP_G0 + i,
);
// The night-key ladders (see look.ts), one per resolution. The day ladders
// climb from soil into green ink, which is why the near field could go
// neon; at night the mat ends in soil — "moonlit" is the authored soil
// span alone (its adopted coarse form was the four anchors; under shades,
// the same span sampled twice as finely), and "meadow" keeps one green
// step so bright ink survives only at the tuft crests. Green marks growth,
// never ground.
const GROUND_RAMP_NIGHT_MEADOW: Ramp = [
  RAMP_G0,
  RAMP_G0 + 2,
  RAMP_G0 + 4,
  RAMP_G0 + 6,
  G,
];
const GROUND_RAMP_NIGHT_MOONLIT: Ramp = [
  RAMP_G0,
  RAMP_G0 + 2,
  RAMP_G0 + 4,
  RAMP_G0 + 6,
];
/** The soil span of the shaded ladder: interleave(soil), rows 16..22. */
const GROUND_RAMP_NIGHT_MOONLIT_SHADED: Ramp = Array.from(
  { length: 7 },
  (_, i) => RAMP_G0 + i,
);
/** Everything but the bright-green rung: soil, turf bridges, green. */
const GROUND_RAMP_NIGHT_MEADOW_SHADED: Ramp = Array.from(
  { length: RAMP_G_N - 1 },
  (_, i) => RAMP_G0 + i,
);

/** The ground ramp the current look shades through. */
export function groundRamp(): Ramp {
  if (LOOK.ramps) {
    if (LOOK.shades) {
      if (LOOK.night === "meadow") return GROUND_RAMP_NIGHT_MEADOW_SHADED;
      if (LOOK.night === "moonlit") return GROUND_RAMP_NIGHT_MOONLIT_SHADED;
      return GROUND_RAMP_SHADED;
    }
    if (LOOK.night === "meadow") return GROUND_RAMP_NIGHT_MEADOW;
    if (LOOK.night === "moonlit") return GROUND_RAMP_NIGHT_MOONLIT;
    return GROUND_RAMP_ULAPLUS;
  }
  return LOOK.earth ? GROUND_RAMP_EARTH : GROUND_RAMP;
}

/**
 * Index of the highest rung of the ground ramp in force that is still bare
 * earth rather than anything living. Anything shading ground *upward* stops
 * here inside the dead wood, so it cannot manufacture grass in the one band
 * whose premise is that nothing grows there — the relief pass lighting a slope
 * that faces the moon does that, and so do the litter drifts, which is the one
 * that actually needed a ceiling.
 *
 * Derived rather than tabulated: there are seven ground ladders now (coarse
 * and shaded, times day / moonlit / meadow, plus the two non-ULAplus ones) and
 * they disagree about where soil ends — the moonlit pair are soil all the way
 * up and have no living rung at all. A hardcoded index was right for exactly
 * one of them and silently wrong for the rest, so this walks the ramp instead
 * and finds the last rung still inside the authored soil span.
 */
export function bareRampTop(): number {
  const ramp = groundRamp();
  // The non-ULAplus ladders are [K, K, G, BG]: the two black rungs are "bare".
  if (!LOOK.ramps) return 1;
  // interleave(soil) occupies the first seven ULAplus ground rows; everything
  // above them bridges into turf and on into green ink (see palette.ts).
  let top = 0;
  for (let i = 0; i < ramp.length; i++) {
    if (ramp[i] >= RAMP_G0 && ramp[i] <= RAMP_G0 + 6) top = i;
  }
  return top;
}

/**
 * Smooth 0..1 crossing between two world coordinates. The bands used to
 * differ by which ramp they picked, which put a hard seam down the map where
 * one gave way to the next — invisible when the ground was sparse marks,
 * glaring once it is shaded. Every biome now sits on the one ramp and differs
 * only in how far up it it sits, blended across a wide margin.
 */
function band(v: number, a: number, b: number): number {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * How completely the dying wood has taken over at a world x: 1 deep in the old
 * woods, 0 out on the moor. Shared by the ground shading, the relief pass and
 * the sky, all of which need to know how much of the band's own weather to
 * apply — and needing it as a fade, not as the hard edge at DEAD_WOOD_X, or
 * the wood's colour snaps on in a single step as you walk in.
 */
export function deadness(wx: number): number {
  return 1 - band(wx, DEAD_WOOD_X - 130, DEAD_WOOD_X + 130);
}

/**
 * How far up its ramp the ground mat sits, and so how much of the near moor
 * is lit at all. This is the dial between the two things the look wants at
 * once: the design's black-dominant moor, and the density that makes dither
 * shading read as ground rather than as scattered marks.
 *
 * The noise field averages 0.5, so this lands almost exactly on the fraction
 * of near ground that takes green. It is touchy — the ramp step is a hard
 * boundary, so 0.8 thins back out into the old line-work and 1.2 closes the
 * mat over and hands the frame to green. Distance scales it down on top.
 */
const MAT_DENSITY = 1.05;

/**
 * Ground colour at a world point, or K for bare dark earth.
 * The look: the ground is *shaded* rather than stippled — a smooth lushness
 * field resolved into two neighbouring ramp colours by an ordered dither,
 * darkness itself set by the look's ramp (see groundRamp). The cyan leyline
 * runs north along x=0 to the keep gate.
 *
 * `footprint` is how many world units one screen pixel spans at this depth —
 * distant samples widen thin features (the leyline must reach the horizon)
 * and thin out point features (or they alias into noise).
 *
 * `sx`/`sy` are the *screen* pixel being painted. The dither threshold has to
 * be screen-anchored, like the attribute grid: fixed to the glass while the
 * world turns beneath it. Anchored in world space it swims and aliases as the
 * camera rotates. `far` is the distance falloff, 1 near and 0 at the horizon;
 * it scales the whole field, so detail thins into the dark on its own instead
 * of needing cutoffs.
 */
export function groundColour(
  wx: number,
  wy: number,
  footprint = 1,
  t = 0,
  sx = 0,
  sy = 0,
  far = 1,
): number {
  const ix = Math.floor(wx);
  const iy = Math.floor(wy);

  // --- the sacred pool: black glass under the moon ---
  // Still water is not painted water. It is deliberate black — K returned
  // here passes through every look untouched, unlike the mat's darkness,
  // which the look's ramp turns to soil — and everything the water says is
  // laid ON the black: a moon-glade of broken glitter running
  // toward the moon's bearing, single star-glints, two thin rings widening
  // from where the lady stands, and lily pads rafted near the shore. The
  // old look — a solid bright rim around a 50% blue checkerboard — read as
  // a paddling pool; a mirror reads as what it reflects.
  const gx = wx - GROVE_POS.x;
  const gy = wy - GROVE_POS.y;
  const gd = Math.sqrt(gx * gx + gy * gy);
  if (gd < POOL_R) {
    // Lily pads raft in the shallows, never the middle: flat world-plane
    // discs, so perspective foreshortens them like real pads. A moonward
    // bright edge models each one; no flowers — a lone white pixel loses
    // the cell's two-colour vote and becomes grit.
    if (gd > POOL_R - 26 && footprint < 2.6) {
      const px = Math.floor(wx / 9);
      const py = Math.floor(wy / 9);
      const ph = hash(px, py ^ 0x77);
      if (ph < 260) {
        const pcx = px * 9 + 3 + (ph % 4);
        const pcy = py * 9 + 3 + ((ph >> 2) % 4);
        const pdx = wx - pcx;
        const pdy = (wy - pcy) * 1.9;
        if (pdx * pdx + pdy * pdy < 7.5) return pdy < -1.6 ? BG : G;
      }
    }
    // Rings spreading from the lady, thin as a held breath, gone before
    // they reach the shore.
    if (gd < 48) {
      const ring = (((gd - t * 5) % 24) + 24) % 24;
      if (ring < 1.1) return C;
    }
    // The moon-glade: the moon's path laid on the water along its true
    // bearing (see MOON_AZIMUTH), dense at the centre line, frayed at the
    // edges, and twitching pixel by pixel — glitter, not paint.
    const glade = Math.abs(gx * 0.752 + gy * 0.659);
    if (glade < 7) {
      const tw = Math.floor(t * 2.5);
      const sparkle = hash(ix + tw, iy * 3);
      if (sparkle < 300 * (1 - glade / 7)) return sparkle < 55 ? BW : W;
    }
    // Star-glints: single pixels, appearing and going out.
    if (hash(ix * 3 + Math.floor(t * 1.5), iy * 5) < 5) return BW;
    // A whisper of deep blue in the black keeps it reading as water.
    if (hash(ix >> 1, iy >> 1) < 85 && (ix + iy) % 2 === 0) return B;
    return K;
  }
  if (gd < GROVE_R) {
    // The shore: a dark wet lip, then a silvered verge where the moon
    // catches the grass — brightest at the waterline, gone in a few paces.
    if (gd < POOL_R + 2.2) return B;
    if (gd < POOL_R + 10) {
      const vh = hash(ix, iy ^ 0x3c3c);
      if (vh < 350 * (1 - (gd - POOL_R - 2.2) / 8)) return BG;
      if (vh > 986) return W;
    }
    // The pilgrim path: bare trodden earth wandering in from the western
    // tree-gap to the water's edge, the one line that leads the eye (and
    // the feet) straight to the lady.
    if (gx < 4) {
      const wob = ((hash(ix >> 4, 991) % 5) - 2) * 0.9;
      if (Math.abs(gy - wob) < 3.2) {
        return hash(ix, iy + 17) < 55 ? W : K;
      }
    }
  }
  // --- village lane and yard: a swept yard, not moorland ---
  // Bare earth with a cobble stipple, and no mat over it — the village reads
  // as trodden ground precisely because the shading stops at its edge. That
  // edge is frayed against a coarse hash rather than drawn true: a clean
  // ellipse of bare earth reads as a plot someone pegged out, and the yard
  // has to stop short of the treeline anyway, or the ring of grass between
  // the two goes with it.
  const yx = (wx - VILLAGE_YARD.x) / VILLAGE_YARD.rx;
  const yy = (wy - VILLAGE_YARD.y) / VILLAGE_YARD.ry;
  const yard = Math.sqrt(yx * yx + yy * yy);
  const southLane =
    Math.abs(wx - VILLAGE_POS.x) < 17 && wy > 846 && wy < VILLAGE_YARD.y;
  if (yard < 1 - (hash(ix >> 3, iy >> 3) % 80) / 1000 || southLane) {
    const cobble = hash(ix >> 1, iy >> 1);
    if (cobble < 95 && (ix + iy) % 3 === 0) return W;
    if ((iy & 15) === 0 && (ix & 7) < 3) return W;
    return K;
  }

  // --- the hermit's plot: the one bed of living green in the dead wood, and
  // the reason there is anything on his drying rack ---
  const hx = wx - (HERMITAGE_POS.x + 30);
  const hy = wy - (HERMITAGE_POS.y - 76);
  if (Math.abs(hx) < 46 && Math.abs(hy) < 30) {
    // Sown in rows, so it reads as tended rather than as a patch of weed.
    if (Math.abs(hy) > 26 || Math.abs(hx) > 42) return K;
    if (iy % 7 < 3 && hash(ix, iy + 3131) < 620) {
      return hash(ix, iy + 4242) < 90 ? BG : G;
    }
  }

  // --- the leyline: bright core, dithered fringe, shining to the horizon ---
  // The dark halves of the core's breaks and the fringe dither never return
  // black outright: they fall through to the mat, so the gaps in the light
  // show the turf beneath it — on the looks whose ground is soil rather than
  // void, a hard K here read as a burnt strip beside the light.
  const ax = Math.abs(wx);
  if (wy < KEEP_POS.y) {
    const core = Math.max(1.6, footprint * 0.7);
    // Broken along its length near to hand. Walk along the vein rather than
    // across it and a solid core lies over the whole near floor as one flat
    // cyan slab; dashed, it reads as light coming up through the turf.
    if (ax < core) {
      if (footprint > 3) return BC;
      // Broken irregularly, not on a modulo: a strict repeat up the middle
      // of the screen reads as a chain or a ladder rather than as light.
      if (hash(ix, iy) <= 660) return (iy & 3) === 0 ? BC : C;
    } else if (ax < core + 3.4) {
      if ((ix + iy) % 2 === 0) return C;
    } else if (ax < core + 6.4) {
      if (hash(ix, iy) < 140) return C;
    } else if (
      // And a wide, thinning spill either side: the ley is the one light
      // source on the moor, so the ground near it should know about it.
      // Sparse enough that it never competes with the core it is cast from.
      ax < core + 30 &&
      hash(ix, iy + 77) < 120 * (1 - (ax - core - 6.4) / 24)
    ) {
      // The spill used to thin by count alone — the same cyan, fewer of it,
      // which past a few paces is indistinguishable from grit. Graded down
      // the glow ramp it dims as well as thins, so the far edge of the light
      // is light rather than speckle.
      if (!LOOK.shades) return C;
      const out = (ax - core - 6.4) / 24;
      return out < 0.3 ? C : out < 0.62 ? RAMP_L0 + 3 : RAMP_L0 + 2;
    }
  }

  // --- the mat: two octaves of noise dithered into a ramp ---
  let level = (fbm(hash, wx, wy, 90) * 0.62 + fbm(hash, wx, wy, 26) * 0.38) * MAT_DENSITY;

  // --- biome: dying woodland west, living greenwood east, moor between ---
  const dead = deadness(wx);
  const greenwood = band(wx, GREENWOOD_EDGE_X - 130, GREENWOOD_EDGE_X + 130);
  // The eastern wood keeps only a whisper of extra green: the concept's
  // forest floor is black-dominant, moss pooling between the trees rather
  // than a sward closing over — the bone trees need dark ground to stand on.
  level += greenwood * 0.05 - dead * 0.5;

  // --- the living ground ringing the sacred pool ---
  // A gentle lift only: the old 0.34 closed the mat into wall-to-wall mint
  // speckle and the grove lost every shadow it had. The grove reads sacred
  // by being CALMER than the moor — the sward smooths out (the tuft noise
  // below is damped by `grove`), and what light there is gathers at the
  // silvered verge and the glade on the water.
  const grove = gd < GROVE_R ? 1 - gd / GROVE_R : 0;
  level += 0.16 * grove;

  // --- moss patches: elliptical blooms on a coarse lattice ---
  const mx = Math.floor(wx / 56);
  const my = Math.floor(wy / 56);
  const mh = hash(mx, my ^ 0x55);
  if (mh < 300 && footprint < 6) {
    const cx = mx * 56 + 12 + (mh % 32);
    const cy = my * 56 + 12 + ((mh >> 3) % 32);
    const dx = wx - cx;
    const dy = (wy - cy) * 2.6;
    if (dx * dx + dy * dy < 230) level += 0.16;
  }

  // --- tufts standing proud, and bare scrapes worn through ---
  // Per-pixel detail only survives close up; further out it aliases into
  // noise, and the falloff is already thinning the field for us. Damped
  // toward the pool: the grove's sward is tended by something, and calm
  // ground against a busy moor is half of what makes it feel set apart.
  //
  // This is the one part of the shading that is not attribute-cheap. The
  // smooth field crosses at most one ramp step inside an 8x8 cell, so it
  // leaves the clash pass almost nothing to do (measured: 18 of 608 cells
  // over two colours). These per-pixel jumps are large enough to skip a step,
  // which takes it to 179 of 608. It stays because the pass absorbs it
  // invisibly — strays merge to the nearest ramp neighbour, which is a tonal
  // nudge rather than a break — and because without it the ground shades too
  // smoothly to read as 8-bit. Widen the jumps and that stops being true.
  if (footprint < 3) {
    const tuft = hash(ix, iy);
    // Nothing tufts in the dead wood. The moor's grass noise ran through the
    // band unchanged, which put green speckle across a floor whose whole
    // premise is that nothing grows on it.
    if (tuft < (70 + greenwood * 10) * (1 - grove * 0.8) * (1 - dead * 0.9)) {
      level += 0.22;
    } else if (tuft > 972 && grove < 0.3) level -= 0.4;
  }

  // --- the dead wood's floor: leaf litter, not turf ---
  // The band's ground was the mat at its darkest, unbroken: one flat brown
  // slab under white trees, and half of every westward frame spent saying
  // nothing. What is on it now is what the trees dropped when they died.
  //
  // Two layers, because doing it in one is a trap. Drifts come first and carry
  // no new hue at all — they only lift the mat, so the floor gains its texture
  // through the soil rungs it already had. The actual fallen leaves go on top
  // and stay small and sparse: at full saturation and any real coverage, amber
  // stops reading as leaves on a woodland floor and starts reading as litter
  // in the other sense of the word.
  if (dead > 0.2) {
    const dx0 = Math.floor(wx / 34);
    const dy0 = Math.floor(wy / 34);
    const dh = hash(dx0 ^ 0x1b7f, dy0);
    if (dh < 460) {
      const ddx = wx - (dx0 * 34 + 6 + (dh % 22));
      const ddy = (wy - (dy0 * 34 + 6 + ((dh >> 3) % 22))) * 1.8;
      if (ddx * ddx + ddy * ddy < 150) level += 0.24 * dead;
    }
  }
  if (dead > 0.2 && footprint < 2.2) {
    const cell = 5;
    const lx = Math.floor(wx / cell);
    const ly = Math.floor(wy / cell);
    const lh = hash(lx, ly ^ 0x3c1d);
    if (lh < 210 * dead * far) {
      const dx = wx - (lx * cell + (lh % cell));
      const dy = (wy - (ly * cell + ((lh >> 4) % cell))) * 1.6;
      if (dx * dx + dy * dy < 1.1 + (lh % 3) * 0.4) return lh % 4 === 0 ? R : Y;
    }
  }

  // The dead band never climbs into the ramp's living rungs, whatever the
  // noise, the moss and the drifts happen to add up to. The ground ladder runs
  // bare soil up through turf into full green, so a high enough peak in the
  // field grows grass in the one band that must not have any.
  //
  // This is a guard on the drifts above rather than a fix for something that
  // was wrong: measured over twelve frames deep in the wood, the ground
  // ladder's green rungs were 0.06% of ground pixels before this pass and the
  // drifts took that to 0.27%. Small either way — but it is the drifts' own
  // doing, so they pay for it, and the ceiling costs one subtraction.
  if (dead > 0) {
    const ceiling = bareRampTop() / (groundRamp().length - 1);
    level -= Math.max(0, level - ceiling) * dead;
  }

  // --- loose stones scattered through it ---
  if (
    dead < 0.5 &&
    footprint < 2.5 &&
    hash(ix >> 2, iy >> 2) < 5 &&
    (ix & 3) < 2 &&
    (iy & 3) < 2
  ) {
    return W;
  }

  return rampColour(groundRamp(), level * far, sx, sy);
}

// ------------------------------------------------------------------ features

export interface Feature {
  /** Named so a scene can omit it — you cannot see the keep from its roof. */
  id?: string;
  x: number;
  y: number;
  sprite: Sprite;
  /** Body radius in world units. Omitted features can be walked through. */
  solid?: number;
  /** World height in units; width follows the sprite's aspect. */
  height: number;
  /** Landmarks stay visible (min on-screen scale) at any distance. */
  landmark?: boolean;
  /**
   * Level-of-detail swaps, best first: the first entry whose `minH`
   * (on-screen pixel height) the projection reaches is drawn instead of
   * `sprite`. Lets the keep grow a real facade as the player approaches.
   */
  lod?: ReadonlyArray<{ minH: number; sprite: Sprite }>;
}

const CHUNK = 96;
const chunkCache = new Map<string, Feature[]>();

/**
 * The keep, as masonry rather than a poster: two towers, a curtain wall,
 * and a gatehouse built from two piers under a lintel. A warded oak door
 * closes the opening and marks the direct transition into the roofed hall.
 */
export const KEEP_BOXES: readonly Box[] = [
  // Four corner towers establish the same footprint as the nine-cell hall.
  { x: KEEP_POS.x - 108, y: KEEP_POS.y - 124, w: 72, d: 72, base: 0, top: 120, detail: "tower" },
  { x: KEEP_POS.x + 108, y: KEEP_POS.y - 124, w: 72, d: 72, base: 0, top: 104, detail: "tower" },
  { x: KEEP_POS.x - 108, y: KEEP_POS.y + 124, w: 72, d: 72, base: 0, top: 108, detail: "tower" },
  { x: KEEP_POS.x + 108, y: KEEP_POS.y + 124, w: 72, d: 72, base: 0, top: 96, detail: "tower" },
  // Front wall split around a real 56-unit opening, plus the other sides.
  { x: KEEP_POS.x - 86, y: KEEP_GATE_Y + 14, w: 116, d: 28, base: 0, top: 76, detail: "wall" },
  { x: KEEP_POS.x + 86, y: KEEP_GATE_Y + 14, w: 116, d: 28, base: 0, top: 76, detail: "wall" },
  { x: KEEP_POS.x, y: KEEP_POS.y + 146, w: 288, d: 28, base: 0, top: 76, detail: "wall" },
  { x: KEEP_POS.x - 130, y: KEEP_POS.y, w: 28, d: 320, base: 0, top: 76, detail: "wall" },
  { x: KEEP_POS.x + 130, y: KEEP_POS.y, w: 28, d: 320, base: 0, top: 76, detail: "wall" },
  // Gatehouse piers project south of the wall; the lintel is high enough to
  // pass beneath and is therefore absent from ground collision.
  { x: KEEP_POS.x - 44, y: KEEP_GATE_Y - 9, w: 32, d: 46, base: 0, top: 98, detail: "gate" },
  { x: KEEP_POS.x + 44, y: KEEP_GATE_Y - 9, w: 32, d: 46, base: 0, top: 98, detail: "gate" },
  { x: KEEP_POS.x, y: KEEP_GATE_Y - 8, w: 52, d: 3, base: 0, top: 70, detail: "opening" },
  { x: KEEP_POS.x, y: KEEP_GATE_Y - 9, w: 120, d: 46, base: 74, top: 98, detail: "gate" },
  // Crenellations use the same wall runs, so the silhouette follows the
  // collision footprint rather than an unrelated facade.
  ...crenellate(KEEP_POS.x - 108, KEEP_POS.y - 124, 72, 72, 120, 7),
  ...crenellate(KEEP_POS.x + 108, KEEP_POS.y - 124, 72, 72, 104, 7).filter(
    (_, i) => i !== 1 && i !== 4,
  ),
  ...crenellate(KEEP_POS.x - 108, KEEP_POS.y + 124, 72, 72, 108, 7),
  ...crenellate(KEEP_POS.x + 108, KEEP_POS.y + 124, 72, 72, 96, 7),
  ...crenellate(KEEP_POS.x - 86, KEEP_GATE_Y + 14, 116, 28, 76, 8),
  ...crenellate(KEEP_POS.x + 86, KEEP_GATE_Y + 14, 116, 28, 76, 8),
  ...crenellate(KEEP_POS.x, KEEP_POS.y + 146, 288, 28, 76, 18),
  ...crenellateY(KEEP_POS.x - 130, KEEP_POS.y, 28, 320, 76, 20),
  ...crenellateY(KEEP_POS.x + 130, KEEP_POS.y, 28, 320, 76, 20),
  ...crenellate(KEEP_POS.x, KEEP_GATE_Y - 9, 120, 46, 98, 8),
];

/** Merlons along the top of a box: the tooth-and-gap of a battlement. */
function crenellate(
  cx: number,
  cy: number,
  w: number,
  d: number,
  top: number,
  count: number,
): Box[] {
  const out: Box[] = [];
  const pitch = w / count;
  for (let i = 0; i < count; i += 2) {
    out.push({
      x: cx - w / 2 + pitch * (i + 0.5),
      y: cy,
      w: pitch * 0.86,
      d,
      base: top,
      top: top + 9,
    });
  }
  return out;
}

/** Merlons along a north/south wall. */
function crenellateY(
  cx: number,
  cy: number,
  w: number,
  d: number,
  top: number,
  count: number,
): Box[] {
  const out: Box[] = [];
  const pitch = d / count;
  for (let i = 0; i < count; i += 2) {
    out.push({
      x: cx,
      y: cy - d / 2 + pitch * (i + 0.5),
      w,
      d: pitch * 0.86,
      base: top,
      top: top + 9,
    });
  }
  return out;
}

/** The fixed, hand-placed world: the stone circle and the henge. */
const PLACED: Feature[] = [
  ...VILLAGE_PROPS,
  ...HERMITAGE_PROPS,

  // The village's own trees, composed rather than rolled for. The clearing
  // above takes the wood out wholesale, and a bald ellipse in the greenwood
  // looks as wrong as the thicket did — so a few go back, chosen for where
  // they stand: one great oak on the green beside the well, which is the
  // tree a village is built around; two behind the cottages, which put
  // canopy on the skyline without standing between you and a door; and a
  // pair either side of the lane's mouth, so the approach is a way in
  // through trees rather than an opening in a hedge. Nothing stands on the
  // square itself or in front of a frontage.
  ...(
    [
      { x: 372, y: 1032, sprite: TREE_OAK, height: 96 },
      { x: 686, y: 1220, sprite: TREE_OAK, height: 78 },
      { x: 202, y: 1266, sprite: TREE_BIRCH, height: 66 },
      { x: 300, y: 1310, sprite: TREE_OAK, height: 72 },
      { x: 352, y: 966, sprite: TREE_BIRCH, height: 62 },
      { x: 512, y: 966, sprite: TREE_OAK, height: 70 },
      { x: 664, y: 1002, sprite: TREE_BIRCH, height: 58 },
    ] as const
  ).map((t) => ({ ...t })),
  // Scrub along the verge, where the swept ground gives out.
  ...(
    [
      { x: 322, y: 1332, h: 13 },
      { x: 556, y: 1330, h: 12 },
      { x: 198, y: 1148, h: 11 },
      { x: 674, y: 1136, h: 12 },
      { x: 386, y: 982, h: 10 },
    ] as const
  ).map((b) => ({ x: b.x, y: b.y, sprite: BUSH, height: b.h })),
  // Opening tableau: pale sarsens establish the near, middle, and far planes
  // visible in the reference frame while remaining ordinary world objects.
  { x: 126, y: 220, sprite: SARSEN_FALLEN, height: 22 },
  { x: -138, y: 236, sprite: SARSEN_TALL, height: 62 },
  // And bone trees leaning in over the first steps of the ley, so the very
  // first frame is seen through the wood the way the concept frame is.
  {
    x: -88,
    y: 118,
    sprite: TREE_BONE_FAR,
    lod: [{ minH: 20, sprite: TREE_GNARLED_A }],
    height: 62,
  },
  {
    x: 102,
    y: 148,
    sprite: TREE_BONE_FAR,
    lod: [{ minH: 16, sprite: TREE_GNARLED_C }],
    height: 52,
  },
  {
    x: 174,
    y: 264,
    sprite: TREE_BONE_FAR,
    lod: [{ minH: 20, sprite: TREE_GNARLED_A }],
    height: 60,
  },
  // The tableau waymark stands beside the starting ley, so it carries the
  // seam — a cyan spark on the horizon the first time you look north.
  {
    x: 92,
    y: 244,
    sprite: MENHIR_LEY,
    height: 42,
    lod: [{ minH: 11, sprite: SARSEN_TALL }],
  },
  { x: -236, y: 410, sprite: SARSEN_TALL, height: 70 },
  { x: 178, y: 390, sprite: SARSEN_TALL, height: 68 },

  {
    x: CIRCLE_POS.x,
    y: CIRCLE_POS.y,
    sprite: DOLMEN,
    height: 26,
    lod: [{ minH: 14, sprite: TRILITHON }],
  },
  {
    x: CIRCLE_POS.x - 34,
    y: CIRCLE_POS.y - 14,
    sprite: STONE_L,
    height: 18,
    lod: [{ minH: 11, sprite: SARSEN_TALL }],
  },
  {
    x: CIRCLE_POS.x + 30,
    y: CIRCLE_POS.y - 10,
    sprite: MENHIR,
    height: 16,
    lod: [{ minH: 11, sprite: SARSEN_TALL }],
  },
  {
    x: CIRCLE_POS.x - 20,
    y: CIRCLE_POS.y + 26,
    sprite: STONE_M,
    height: 14,
    lod: [{ minH: 10, sprite: SARSEN_TALL }],
  },
  {
    x: CIRCLE_POS.x + 22,
    y: CIRCLE_POS.y + 22,
    sprite: STONE_L,
    height: 17,
    lod: [{ minH: 11, sprite: SARSEN_TALL }],
  },
  {
    x: CIRCLE_POS.x + 2,
    y: CIRCLE_POS.y + 34,
    sprite: STONE_S,
    height: 10,
    lod: [{ minH: 9, sprite: SARSEN_TALL }],
  },
  {
    x: CIRCLE_POS.x - 48,
    y: CIRCLE_POS.y + 6,
    sprite: MENHIR,
    height: 15,
    lod: [{ minH: 10, sprite: SARSEN_TALL }],
  },

  // The henge: five trilithons in a ring, each far taller than the mage,
  // with outliers fallen around them. These are the one place in the world
  // you can put your face against a rock, so they are solid: walking through
  // a megalith is bad enough on its own, and it also puts the eye inside a
  // sprite, where even a capped billboard is a wall of grey.
  ...[0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    return {
      x: HENGE_POS.x + Math.sin(a) * 150,
      y: HENGE_POS.y + Math.cos(a) * 150,
      sprite: TRILITHON,
      height: 112,
      landmark: true,
      solid: 30,
    };
  }),
  // One of the six lands inside the village, so it is dropped: the ring is
  // outliers fallen around the henge, and an outlier fewer on the far side is
  // not something anyone can count.
  ...[0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a = (i / 6) * Math.PI * 2;
      return {
        x: HENGE_POS.x + Math.sin(a) * 250,
        y: HENGE_POS.y + Math.cos(a) * 250,
        sprite: i % 3 === 0 ? SARSEN_FALLEN : SARSEN_TALL,
        height: i % 3 === 0 ? 26 : 84,
        solid: i % 3 === 0 ? 26 : 14,
      };
    })
    .filter((s) => !inVillageClearing(s.x, s.y)),

  // The grove, composed rather than distributed. The old ring — eight
  // near-identical trees at one radius — read as a municipal hedge. Now the
  // willows lean over the water where the moon-glade lands, birches catch
  // the light in the middle distance, the elder oak stands north behind the
  // lady, and the west stays open for the pilgrim path, flanked by two
  // gate-stones where it passes the tree line. Bearings are chosen so the
  // pool reads framed from every approach, never fenced.
  ...(
    [
      { a: 0.85, r: 118, sprite: TREE_WILLOW, height: 66 },
      { a: -2.35, r: 126, sprite: TREE_WILLOW, height: 72 },
      { a: -0.3, r: 168, sprite: TREE_OAK, height: 86 },
      { a: 1.45, r: 150, sprite: TREE_BIRCH, height: 56 },
      { a: 2.2, r: 176, sprite: TREE_BIRCH, height: 60 },
      { a: -1.05, r: 182, sprite: TREE_BIRCH, height: 54 },
      { a: 2.75, r: 190, sprite: TREE_OAK, height: 66 },
      { a: -2.9, r: 196, sprite: TREE_OAK, height: 70 },
      // Gate-stones flanking the path's mouth in the western tree-gap.
      { a: -1.44, r: 148, sprite: SARSEN_TALL, height: 30 },
      { a: -1.72, r: 146, sprite: SARSEN_TALL, height: 24 },
      // Two mossed pilgrim stones at the water's edge.
      { a: -0.55, r: 86, sprite: SARSEN_TALL, height: 26 },
      { a: 1.15, r: 92, sprite: SARSEN_TALL, height: 18 },
    ] as const
  ).map((p) => ({
    x: GROVE_POS.x + Math.sin(p.a) * p.r,
    y: GROVE_POS.y + Math.cos(p.a) * p.r,
    sprite: p.sprite,
    height: p.height,
  })),
  // Reeds stand in the shallows' verge, and flower tufts drift through the
  // sward — small enough to only speak up close, which is exactly when the
  // grove has to feel tended.
  ...([0.5, 1.7, 2.9, -0.95, -2.05] as const).map((a, i) => ({
    x: GROVE_POS.x + Math.sin(a) * (66 + (i % 3) * 3),
    y: GROVE_POS.y + Math.cos(a) * (66 + ((i + 1) % 3) * 3),
    sprite: REEDS,
    height: 10 + (i % 3) * 2,
  })),
  ...([0.25, 1.0, 1.9, 2.6, 3.05, -0.6, -2.3, -2.75] as const).map((a, i) => ({
    x: GROVE_POS.x + Math.sin(a) * (84 + (i * 29) % 64),
    y: GROVE_POS.y + Math.cos(a) * (84 + ((i * 41) % 58)),
    sprite: FLOWERS,
    height: 4 + (i % 2),
  })),
];

function chunkFeatures(cx: number, cy: number): Feature[] {
  const key = `${cx},${cy}`;
  const hit = chunkCache.get(key);
  if (hit) return hit;

  const out: Feature[] = [];
  const baseX = cx * CHUNK;
  const baseY = cy * CHUNK;
  const woods = baseX < WOODS_EDGE_X;
  const greenwood = baseX > GREENWOOD_EDGE_X;
  // The whole wood is bone trees now, per the concept frame: dense stands in
  // both wooded bands, a thinner scatter flanking the open moor so the ley
  // is always seen through trees. Only the grove keeps anything in leaf.
  // The tall silhouettes serve a hand-drawn far glyph until the projection
  // can afford the real art — shrunk past half size, two-pixel limbs lose
  // the block vote and a wood of elms becomes a wood of dashes.
  const treeRolls = greenwood || woods ? 5 : 2;
  for (let i = 0; i < treeRolls; i++) {
    const h = hash(cx * 5 + i, cy * 7 + i * 3);
    if (h < (greenwood ? 600 : woods ? 640 : 260)) {
      const kind = h % 8;
      const inWood = greenwood || woods;
      const tree =
        kind < 3
          ? {
              sprite: TREE_BONE_FAR,
              lod: [{ minH: 20, sprite: TREE_GNARLED_A }],
              height: (inWood ? 44 : 36) + (h % 5) * 8,
            }
          : kind < 5
            ? {
                sprite: TREE_BONE_FAR,
                lod: [{ minH: 16, sprite: TREE_GNARLED_C }],
                height: (inWood ? 32 : 28) + (h % 4) * 7,
              }
            : kind < 7
              ? { sprite: TREE_GNARLED_B, height: 14 + (h % 3) * 6 }
              : { sprite: TREE_DEAD_PINE, height: 28 + (h % 4) * 6 };
      out.push({
        x: baseX + (h % CHUNK),
        y: baseY + ((h >> 3) % CHUNK),
        ...tree,
      });
    }
  }
  // The old wood's own understory: dead bracken thickly, since it is the band's
  // main body of colour at eye level and the thing that stops the middle
  // distance being empty dark between trunks — and fungus rationed hard, since
  // it is the brightest thing on the floor and scattered freely it would read
  // as flowers in a wood that is supposed to be dying.
  if (woods) {
    for (let i = 0; i < 2; i++) {
      const bh = hash((cx ^ 0x2c71) + i * 47, cy ^ 0x6b3d);
      if (bh < 520) {
        out.push({
          x: baseX + (bh % CHUNK),
          y: baseY + ((bh >> 5) % CHUNK),
          sprite: DEAD_BRACKEN,
          height: 9 + (bh % 4) * 2,
        });
      }
    }
    const fh = hash(cx ^ 0x77a3, cy ^ 0x1e59);
    if (fh < 150) {
      out.push({
        x: baseX + ((fh * 3) % CHUNK),
        y: baseY + ((fh * 5) % CHUNK),
        sprite: FUNGI_SHELF,
        height: 6 + (fh % 3),
      });
    }
  }
  // Scrub in the eastern wood — low living bracken under the dead canopy.
  if (greenwood) {
    for (let i = 0; i < 2; i++) {
      const sh = hash((cx ^ 0x51ed) + i * 31, cy ^ 0x2f9a);
      if (sh < 560) {
        out.push({
          x: baseX + (sh % CHUNK),
          y: baseY + ((sh >> 5) % CHUNK),
          sprite: BUSH,
          height: 11 + (sh % 4) * 3,
        });
      }
    }
  }
  // Fallen timber and small bright fungi break both woods into authored
  // clearings, rather than an even wall of tree cards. The hash also picks
  // which deadfall, so the wood is not one repeated log.
  if (greenwood || woods) {
    const dh = hash(cx ^ 0x63d1, cy ^ 0x4ac7);
    if (dh < 330) {
      out.push({
        x: baseX + ((dh * 3) % CHUNK),
        y: baseY + ((dh * 7) % CHUNK),
        sprite: dh < 190 ? FALLEN_LOGS[dh % FALLEN_LOGS.length] : MUSHROOM_PATCH,
        height: dh < 190 ? 14 : 10,
      });
    }
  }
  // Standing stones and mossy boulders, everywhere and no longer shy: the
  // concept scatters real monoliths through the trees, near player height,
  // not ankle stones. Menhirs within sight of the ley carry the live seam
  // instead of runes: waymarks answering the line they stand by.
  const bh = hash(cx ^ 0x9e37, cy ^ 0x79b9);
  if (bh < 240) {
    const kind = bh % 4;
    const sx = baseX + (bh % CHUNK);
    const stone =
      kind === 0
        ? { sprite: SARSEN_FALLEN, height: 10 + (bh % 4) * 3 }
        : kind === 1
          ? { sprite: STONE_LEANING, height: 9 + (bh % 4) * 3 }
          : kind === 2
            ? { sprite: BOULDER_MOSSY, height: 7 + (bh % 3) * 2 }
            : {
                sprite: Math.abs(sx) < 120 ? MENHIR_LEY : MENHIR,
                height: 16 + (bh % 5) * 4,
              };
    out.push({
      x: sx,
      y: baseY + ((bh >> 2) % CHUNK),
      ...stone,
    });
  }

  // Keep the leyline clear of clutter, and keep every named place genuinely
  // open — scattered woodland inside them would stand between the player and
  // the thing they came to see. The two western places need this most: the
  // dead wood is dense enough to swallow a stone circle whole.
  const clear = out.filter((f) => {
    if (Math.abs(f.x) < 14 && f.y < KEEP_POS.y) return false;
    // The village needs this more than any of them. It stands east of
    // GREENWOOD_EDGE_X, where the chunk roll is at its densest — four
    // attempts a chunk at better than even odds — and it was the one named
    // place with no clearing at all, so the wood grew through the houses,
    // stood in the doorways and closed over the lane. Trees inside the
    // village are authored below, not rolled for.
    if (inVillageClearing(f.x, f.y)) return false;
    if (Math.hypot(f.x - GROVE_POS.x, f.y - GROVE_POS.y) < GROVE_R) return false;
    if (Math.hypot(f.x - HENGE_POS.x, f.y - HENGE_POS.y) < HENGE_R) return false;
    if (Math.hypot(f.x - CIRCLE_POS.x, f.y - CIRCLE_POS.y) < CIRCLE_R) return false;
    if (
      Math.hypot(f.x - HERMITAGE_POS.x, f.y - HERMITAGE_POS.y) < HERMITAGE_R
    ) {
      return false;
    }
    return true;
  });
  chunkCache.set(key, clear);
  return clear;
}

/**
 * Every door in the world, keep gate and cottage alike.
 *
 * The keep's threshold used to be a bespoke box test bolted to the side of
 * the update loop, which is why it was the only building you could walk into.
 * One list, one rule: come within `noticeAt` and the leaves swing; come within
 * `enterAt` with them clear and you are through.
 *
 * The gate takes two leaves rather than one — a fifty-unit slab swinging off a
 * single hinge is a barn door — and they open outward like every other door
 * here. Inward was the first instinct, and it made them invisible: swung back
 * into an unlit gateway a black leaf against a black opening says nothing at
 * all. Outward they come round against the moonlit ground in full view, and
 * because each leaf stays on its own side of the arch neither one sweeps the
 * line you walk up.
 */
export const DOORWAYS: readonly Doorway[] = [
  {
    id: "keep-gate",
    site: "keep",
    x: KEEP_POS.x,
    y: KEEP_GATE_Y + 28,
    halfW: 28,
    noticeAt: 96,
    enterAt: 36,
    doorstepY: KEEP_GATE_Y - 34,
    leaves: [
      {
        hx: KEEP_POS.x - 26,
        hy: KEEP_GATE_Y - 8,
        shut: Math.PI / 2,
        swing: 1.62,
        width: 26,
        base: 0,
        top: 70,
        detail: "door",
      },
      {
        hx: KEEP_POS.x + 26,
        hy: KEEP_GATE_Y - 8,
        shut: -Math.PI / 2,
        swing: -1.62,
        width: 26,
        base: 0,
        top: 70,
        detail: "door",
      },
    ],
  },
  ...VILLAGE_DOORWAYS,
];

/**
 * Solid footprints the hero cannot glide through. The keep is a wall, not a
 * poster: you pull up at its facade, with only the scripted door passable.
 */
const WORLD_COLLIDERS = [
  ...KEEP_BOXES,
  ...VILLAGE_BOXES,
  ...HERMITAGE_BOXES,
].filter(
  (box) =>
    box.base === 0 &&
    box.detail !== "door" &&
    box.detail !== "timberDoor" &&
    box.detail !== "opening",
);
const OUTDOOR_BODY_R = 10;

/**
 * Slide a move against solid footprints: try the full move, then each axis
 * alone, so grazing a wall glides along it instead of sticking.
 */
export function resolveMove(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): { x: number; y: number } {
  // Only the handful of authored megaliths are solid; the scattered woodland
  // stays walk-through, or the greenwood becomes a maze of invisible posts.
  const stones = PLACED.filter((f) => f.solid !== undefined);
  const blocked = (x: number, y: number) =>
    WORLD_COLLIDERS.some(
      (box) =>
        Math.abs(x - box.x) < box.w / 2 + OUTDOOR_BODY_R &&
        Math.abs(y - box.y) < box.d / 2 + OUTDOOR_BODY_R,
    ) ||
    stones.some((f) => {
      const dx = x - f.x;
      const dy = y - f.y;
      const reach = (f.solid ?? 0) + OUTDOOR_BODY_R;
      return dx * dx + dy * dy < reach * reach;
    });
  if (!blocked(toX, toY)) return { x: toX, y: toY };
  if (!blocked(toX, fromY)) return { x: toX, y: fromY };
  if (!blocked(fromX, toY)) return { x: fromX, y: toY };
  return { x: fromX, y: fromY };
}

/** All features within `radius` of (x, y), plus every landmark. */
export function featuresNear(x: number, y: number, radius: number): Feature[] {
  const out: Feature[] = [];
  const c0x = Math.floor((x - radius) / CHUNK);
  const c1x = Math.floor((x + radius) / CHUNK);
  const c0y = Math.floor((y - radius) / CHUNK);
  const c1y = Math.floor((y + radius) / CHUNK);
  for (let cy = c0y; cy <= c1y; cy++) {
    for (let cx = c0x; cx <= c1x; cx++) out.push(...chunkFeatures(cx, cy));
  }
  for (const f of PLACED) {
    const dx = f.x - x;
    const dy = f.y - y;
    if (f.landmark || dx * dx + dy * dy < radius * radius) out.push(f);
  }
  return out;
}
