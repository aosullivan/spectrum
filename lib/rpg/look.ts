// The look flags. The renderer consults this mutable singleton so aesthetic
// variants can be toggled per frame — from a grab script or a debug key —
// without forking the drawing code. The defaults are the Relief look the
// user adopted on 2026-08-15 (superseding Dusk, adopted earlier the same
// day); the older looks survive as presets for A/B.
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
   * The key: daylight instead of the moonlit night. Each region's palette
   * installs its day terrain rows (see Mood in palette.ts), the ground walks
   * a six-step ramp through earth and ochre before it reaches green, distance
   * fades into haze rather than into the dark, and the sky loses its stars and
   * its moon for a sun. Only meaningful with `ramps` on — the terrain rows are
   * where the whole key lives.
   */
  daylight: boolean;
}

/** The look as first shipped: void-black moor and the 8x8 clash. */
const CLASSIC: Look = {
  earth: false,
  skyGlow: false,
  attribute: "8x8",
  ramps: false,
  hills: false,
  daylight: false,
};

/** Earth-floored ground, horizon glow, 8x1 weave. */
const DUSK: Look = {
  earth: true,
  skyGlow: true,
  attribute: "8x1",
  ramps: false,
  hills: false,
  daylight: false,
};

/** Dusk under ULAplus value ramps, standing on the rolling heightfield. */
const RELIEF: Look = { ...DUSK, ramps: true, hills: true };

/** Relief with the sun up: the same world, lighter, and earthier underfoot. */
const DAYLIGHT: Look = { ...RELIEF, daylight: true };

export const LOOK: Look = { ...DAYLIGHT };

export function setLook(look: Partial<Look>): void {
  Object.assign(LOOK, look);
}

/**
 * Is the sun up? The whole key lives in the ULAplus terrain rows, so it can
 * only be up on a look that has them — asking this rather than the raw flag
 * keeps the older looks reachable without them sprouting a daylight half.
 */
export function daylight(): boolean {
  return LOOK.daylight && LOOK.ramps;
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
  night: { ...RELIEF },
  daylight: { ...DAYLIGHT },
};
