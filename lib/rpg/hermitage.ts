// The hermitage: one turf-and-timber hut in a clearing deep in the ancient
// woods, and the small evidence of a man living alone — split wood under a
// lean-to, herbs drying on a rack, a hearth still warm. Architecture is box
// geometry like the village, so the hut turns and collides correctly; the
// bitmaps are only the props.
//
// He is the one lit thing west of the leyline. The dead wood around him has
// no other reason to be walked into, so the hut has to be worth the walk.

import { BW, BY, G, K, W, Y, BG } from "@/lib/rpg/palette";
import type { Billboard } from "@/lib/rpg/projection";
import { sprite } from "@/lib/rpg/screen";
import type { Box } from "@/lib/rpg/structures";

export const HERMITAGE_POS = { x: -540, y: 900 } as const;
/** Trees are cleared inside this radius, so the hut is a glade not a thicket. */
export const HERMITAGE_R = 170;

const hut = { x: HERMITAGE_POS.x, y: HERMITAGE_POS.y + 10 };
const shed = { x: HERMITAGE_POS.x - 58, y: HERMITAGE_POS.y + 4 };

/**
 * A stepped cone. The village's `roof` narrows one axis and comes out as a
 * ridge; thatch over a round hut has to draw in on both, so it ends in a
 * smoke-hole rather than a gable.
 */
function cone(
  x: number,
  y: number,
  width: number,
  depth: number,
  eave: number,
  levels: number,
  rise = 6,
): Box[] {
  const out: Box[] = [];
  for (let i = 0; i < levels; i++) {
    const taper = 1 - (i / levels) * 0.82;
    out.push({
      x,
      y,
      w: width * taper,
      d: depth * taper,
      base: eave + i * rise,
      top: eave + (i + 1) * rise,
      detail: "roof",
    });
  }
  return out;
}

export const HERMITAGE_BOXES: readonly Box[] = [
  // The hut proper: low walls you would stoop to enter, under deep thatch.
  { x: hut.x, y: hut.y, w: 64, d: 58, base: 0, top: 30, detail: "timber" },
  ...cone(hut.x, hut.y, 76, 70, 30, 7),
  { x: hut.x, y: hut.y - 30, w: 16, d: 3, base: 0, top: 24, detail: "timberDoor" },

  // A lean-to against the west wall, open to the south, holding the wood.
  { x: shed.x, y: shed.y, w: 32, d: 36, base: 0, top: 19, detail: "timber" },
  { x: shed.x, y: shed.y, w: 40, d: 44, base: 19, top: 25, detail: "roof" },
  { x: shed.x, y: shed.y - 2, w: 36, d: 40, base: 25, top: 30, detail: "roof" },
];

/**
 * A cord of cut rounds stacked between two stakes, end grain facing out —
 * every log a disc with a shaded seam and a pith dot, one split half-log
 * resting tilted across the top. The old pile was ruled courses of white
 * and its wkwk texture sampled into brick, never into wood.
 * (26x13)
 */
export const WOODPILE = sprite(
  [
    "WW......................Ww",
    "ww.WWW..................ww",
    "ww.wwwWWWWWw..WWw.......ww",
    "ww....wwwkwwwwwwwwWWw...ww",
    "ww......wwkwwwwwwwwww...ww",
    "ww....wwwwwkwwwwkwwwkw..ww",
    "ww...wwwwwwwwwwwwwwwwww.ww",
    "ww...wwwwwwwkwwwwwwwwkwwww",
    "ww.wwwwwkwwwwkwwwwkwwwk.ww",
    "wwwwwwwwwwwwwwwwwwwwwwwwww",
    "wwwwkwwwwwwwwwkwwwwwwwwwww",
    "wwwwwkwwwwkwwwwkwwwwkwwkww",
    "ww.www..www..www..www.w.ww",
  ],
  { w: W, W: BW, k: K },
);

/**
 * Bunches hung to dry on a pole between two posts — the only green growing
 * thing for half a mile, and he had to go and fetch it.
 * (18x16)
 */
export const HERB_RACK = sprite(
  [
    "..H............H..",
    "..HHHHHHHHHHHHHH..",
    "..H.g...g...g..H..",
    "..H.G...G...G..H..",
    "..H.GG.GG..GG..H..",
    "..H.GG.GG..GG..H..",
    "..H..G..G...G..H..",
    "..H..g..g...g..H..",
    "..H............H..",
    "..H............H..",
    "..H............H..",
    "..H............H..",
    "..H............H..",
    "..H............H..",
    ".HH............HH.",
    ".HH............HH.",
  ],
  { H: BW, G: G, g: BG },
);

/**
 * The hearth ring, embers banked. Frame 1 of 2 — the stones are identical
 * between frames so only the fire moves.
 * (18x9)
 */
export const HEARTH = sprite(
  [
    "....HHH..HHH......",
    "...HwwwHHwwwH.....",
    "..HwwHHHHHHwwH....",
    "..HwH..yy..HwH....",
    "..HwH.yYYy.HwH....",
    "..HwHH.yy.HHwH....",
    "..HwwwHHHHwwwH....",
    "...HwwwwwwwwH.....",
    "....HHHHHHHH......",
  ],
  { H: BW, w: W, y: Y, Y: BY },
);

/** The same hearth, the fire breathing. Frame 2 of 2. (18x9) */
export const HEARTH_ALT = sprite(
  [
    "....HHH..HHH......",
    "...HwwwHHwwwH.....",
    "..HwwHHHHHHwwH....",
    "..HwH.yYy..HwH....",
    "..HwH.YYYy.HwH....",
    "..HwHH.YY.HHwH....",
    "..HwwwHHHHwwwH....",
    "...HwwwwwwwwH.....",
    "....HHHHHHHH......",
  ],
  { H: BW, w: W, y: Y, Y: BY },
);

export const HERMITAGE_PROPS: readonly Billboard[] = [
  {
    x: HERMITAGE_POS.x + 6,
    y: HERMITAGE_POS.y - 58,
    sprite: HEARTH,
    frames: [HEARTH, HEARTH_ALT],
    fps: 5,
    height: 11,
  },
  {
    x: shed.x + 2,
    y: shed.y - 26,
    sprite: WOODPILE,
    height: 14,
  },
  {
    x: HERMITAGE_POS.x + 56,
    y: HERMITAGE_POS.y - 26,
    sprite: HERB_RACK,
    height: 21,
  },
];
