// The look flags. The renderer consults this mutable singleton so aesthetic
// variants can be toggled per frame — from a grab script or a debug key —
// without forking the drawing code. The defaults are the Relief look the
// user adopted on 2026-08-15 (superseding Dusk, adopted earlier the same
// day); the older looks survive as presets for A/B.

/**
 * How the designed-clash pass runs. "8x8" is the true ULA grid; "8x1" keeps
 * two colours per 8x1 strip (the Timex hi-colour fiction — far less blocky,
 * still attribute-shaped); "off" drops the clash entirely.
 */
export type AttributeMode = "8x8" | "8x1" | "off";

/**
 * How ground detail recedes into the dark. "thin" is the original scheme:
 * three hard bands of ever-sparser survivors, which reads as columns of
 * grit. "bayer" fades continuously through an ordered 4x4 mask instead.
 */
export type FadeMode = "thin" | "bayer";

export interface Look {
  /** Undergrowth coverage multiplier; 1 is the classic moor. */
  cover: number;
  /** Bare ground becomes a deep earth tone (palette index 8) instead of black. */
  earth: boolean;
  /** Dithered horizon glow rising into the night sky. */
  skyGlow: boolean;
  attribute: AttributeMode;
  fade: FadeMode;
  /**
   * The ULAplus fiction: terrain and sky resolve through 4-step value ramps
   * (palette 16..23) — shaded ground, gradient night sky, a lit leyline
   * verge. Subsumes `earth` and `skyGlow`.
   */
  ramps: boolean;
  /** Rolling value-noise relief; ridges occlude and stand against the sky. */
  hills: boolean;
}

/** The look as first shipped: void-black moor, 8x8 clash, banded fade. */
const CLASSIC: Look = {
  cover: 1,
  earth: false,
  skyGlow: false,
  attribute: "8x8",
  fade: "thin",
  ramps: false,
  hills: false,
};

/** Denser ground, earth-toned bare soil, horizon glow, 8x1 weave, bayer fade. */
const DUSK: Look = {
  cover: 2.2,
  earth: true,
  skyGlow: true,
  attribute: "8x1",
  fade: "bayer",
  ramps: false,
  hills: false,
};

/** Dusk under ULAplus value ramps, standing on the rolling heightfield. */
const RELIEF: Look = { ...DUSK, ramps: true, hills: true };

export const LOOK: Look = { ...RELIEF };

export function setLook(look: Partial<Look>): void {
  Object.assign(LOOK, look);
}

/** Ordered-dither thresholds 0..15; keep a pixel when its cell < coverage. */
// prettier-ignore
export const BAYER4 = new Uint8Array([
   0,  8,  2, 10,
  12,  4, 14,  6,
   3, 11,  1,  9,
  15,  7, 13,  5,
]);

/**
 * One preset per question the prototype round asked, kept for side-by-side
 * renders: each changes a single thing against `classic`, and `dusk` is the
 * adopted combination.
 */
export const LOOK_PRESETS: Record<string, Look> = {
  baseline: { ...CLASSIC },
  carpet: { ...CLASSIC, cover: 3.2 },
  earth: { ...CLASSIC, earth: true },
  skyglow: { ...CLASSIC, skyGlow: true },
  weave: { ...CLASSIC, attribute: "8x1" },
  smooth: { ...CLASSIC, attribute: "off", fade: "bayer" },
  dusk: { ...DUSK },
  ramps: { ...DUSK, ramps: true },
  relief: { ...RELIEF },
};
