// The look flags. The renderer consults this mutable singleton so aesthetic
// variants can be toggled per frame — from a grab script or a debug key —
// without forking the drawing code. The defaults are the day key over Relief
// with the peopled skyline ring (adopted 2026-08-15, last of four rounds that
// day: Dusk, Relief, the graveyard-concept night key, then the sun coming up
// over it); every earlier look survives as a preset for A/B, the moonlit
// night among them.
//
// Two dials from the first prototype round — undergrowth cover and the
// banded distance fade — retired in the merge with main's dither-shading
// work: the mat density and the smooth `far` falloff in world.ts do those
// jobs better, for every look at once.

/**
 * How the designed-clash pass runs. "8x8" is the true ULA grid; "8x1" keeps
 * two colours per 8x1 strip (the Timex hi-colour fiction — far less blocky,
 * still attribute-shaped); "off" drops the clash entirely.
 */
export type AttributeMode = "8x8" | "8x1" | "off";

/**
 * The key: what light the world is under. Every mode swaps the ULAplus
 * anchors a region authored and picks the ladder the ground mat walks —
 * nothing else in the engine changes, because the anchors are where a
 * region's weather lives.
 *
 * The night gradations (2026-08 round, from the graveyard concept frame) are
 * how much of the frame's brightness the ground is allowed to keep: "sky"
 * lifts the zenith to a just-visible navy and fills in the starfield but
 * leaves the ground alone; "meadow" additionally walks the ground ramp
 * through the lit-soil step so bright green ink survives only at tuft
 * crests; "moonlit" removes ink green from the mat entirely.
 *
 * "day" (2026-08-15, from the user's lit-landscape reference) is the sun up:
 * daylight soil and sky anchors, and the same all-soil mat moonlit uses, for
 * the same reason. Green marks growth, never ground — the one rule that
 * holds at every hour, and the only thing keeping a lush biome from reading
 * as a lawn.
 */
export type KeyMode = "off" | "sky" | "meadow" | "moonlit" | "day";

/**
 * The skyline ring (design law two made visible): sites beyond their draw
 * range keep a silhouette on the horizon at their true bearing, sized by
 * true distance. "sites" draws the real places only; "peopled" adds
 * azimuth-anchored ruin fragments and lone menhirs between them, so any
 * turn of the camera sweeps something past. The keep is exempt — its
 * distant billboard already draws at any range.
 */
export type SkylineMode = "off" | "sites" | "peopled";

export interface Look {
  /** Bare ground floors at a deep earth tone (palette index 8), not black. */
  earth: boolean;
  /** Thin dithered horizon glow rising into the night sky. */
  skyGlow: boolean;
  attribute: AttributeMode;
  /**
   * The ULAplus fiction: terrain and sky shade through 4-step value ramps
   * (palette 16..23) — soil-floored ground, a gradient night sky, the
   * leyline's verge lit. Subsumes `earth` and `skyGlow`.
   */
  ramps: boolean;
  /** Rolling value-noise relief; ridges occlude and stand against the sky. */
  hills: boolean;
  /**
   * The finer ULAplus rows: ground and sky ramps at twice the resolution,
   * masonry shaded through a stone ladder instead of a white dither, and
   * distance spent in value — a far billboard steps down its own ramp rather
   * than being dithered into holes. Needs `ramps`, which is where the ground
   * and sky ladders come from in the first place.
   */
  shades: boolean;
  key: KeyMode;
  skyline: SkylineMode;
}

/** The look as first shipped: void-black moor and the 8x8 clash. */
const CLASSIC: Look = {
  earth: false,
  skyGlow: false,
  attribute: "8x8",
  ramps: false,
  hills: false,
  shades: false,
  key: "off",
  skyline: "off",
};

/** Earth-floored ground, horizon glow, 8x1 weave. */
const DUSK: Look = {
  earth: true,
  skyGlow: true,
  attribute: "8x1",
  ramps: false,
  hills: false,
  shades: false,
  key: "off",
  skyline: "off",
};

/** Dusk under ULAplus value ramps, standing on the rolling heightfield. */
const RELIEF: Look = { ...DUSK, ramps: true, hills: true };

/** Relief with the ramps at full ULAplus depth. */
const SHADED: Look = { ...RELIEF, shades: true };

/**
 * Shaded relief under the moonlit night key: navy zenith, deep starfield,
 * all-soil mat — green ink marks growth, light marks light, the ground
 * keeps neither.
 */
const MOONLIT_NIGHT: Look = { ...SHADED, key: "moonlit" };

/**
 * The moonlit night with the peopled skyline ring: far sites hold their
 * bearing on the horizon, with ruin stubs and lone menhirs between them.
 * Adopted 2026-08-15, the same round as the night key.
 */
const RINGED_NIGHT: Look = { ...MOONLIT_NIGHT, skyline: "peopled" };

/**
 * The same world with the sun up, adopted 2026-08-15 from the user's
 * lit-landscape reference. It differs from the moonlit night in the anchors
 * alone: the ground walks the identical all-soil ladder, because the rule
 * that keeps green off the ground holds at noon exactly as it holds at
 * midnight.
 */
const RINGED_DAY: Look = { ...RINGED_NIGHT, key: "day" };

export const LOOK: Look = { ...RINGED_DAY };

export function setLook(look: Partial<Look>): void {
  Object.assign(LOOK, look);
}

/** Is the sun up? Asked wherever night and day want different drawing. */
export function daylight(): boolean {
  return LOOK.key === "day";
}

/**
 * Does the ground mat end in soil rather than climbing into ink green? True
 * under both the keys anyone actually plays in — the moonlit night and the
 * day — and the reason neither of them can produce a neon field.
 */
export function allSoilMat(): boolean {
  return LOOK.key === "moonlit" || LOOK.key === "day";
}

/**
 * One preset per question the prototype rounds asked, kept for side-by-side
 * renders: each changes a single thing against `classic`, `dusk` combines
 * the first round, and `relief` is the adopted default.
 */
export const LOOK_PRESETS: Record<string, Look> = {
  baseline: { ...CLASSIC },
  earth: { ...CLASSIC, earth: true },
  skyglow: { ...CLASSIC, skyGlow: true },
  weave: { ...CLASSIC, attribute: "8x1" },
  smooth: { ...CLASSIC, attribute: "off" },
  dusk: { ...DUSK },
  ramps: { ...DUSK, ramps: true },
  relief: { ...RELIEF },
  shaded: { ...SHADED },
  nightsky: { ...SHADED, key: "sky" },
  nightmeadow: { ...SHADED, key: "meadow" },
  nightmoonlit: { ...MOONLIT_NIGHT },
  skysites: { ...MOONLIT_NIGHT, skyline: "sites" },
  skypeopled: { ...RINGED_NIGHT },
  night: { ...RINGED_NIGHT },
  day: { ...RINGED_DAY },
};
