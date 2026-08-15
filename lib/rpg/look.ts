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
   * The finer ULAplus rows: ground and sky ramps at twice the resolution,
   * masonry shaded through a stone ladder instead of a white dither, and
   * distance spent in value — a far billboard steps down its own ramp rather
   * than being dithered into holes. Needs `ramps`, which is where the ground
   * and sky ladders come from in the first place.
   */
  shades: boolean;
}

/** The look as first shipped: void-black moor and the 8x8 clash. */
const CLASSIC: Look = {
  earth: false,
  skyGlow: false,
  attribute: "8x8",
  ramps: false,
  hills: false,
  shades: false,
};

/** Earth-floored ground, horizon glow, 8x1 weave. */
const DUSK: Look = {
  earth: true,
  skyGlow: true,
  attribute: "8x1",
  ramps: false,
  hills: false,
  shades: false,
};

/** Dusk under ULAplus value ramps, standing on the rolling heightfield. */
const RELIEF: Look = { ...DUSK, ramps: true, hills: true };

/** Relief with the ramps at full ULAplus depth. */
const SHADED: Look = { ...RELIEF, shades: true };

export const LOOK: Look = { ...SHADED };

export function setLook(look: Partial<Look>): void {
  Object.assign(LOOK, look);
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
};
