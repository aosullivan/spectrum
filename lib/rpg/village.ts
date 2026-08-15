// A small occupied village east of the ley. Architecture is box geometry so
// buildings turn and collide correctly; the bitmaps are only people and props.

import { BW, BY, K, W, Y } from "@/lib/rpg/palette";
import type { Billboard } from "@/lib/rpg/projection";
import { sprite } from "@/lib/rpg/screen";
import type { Box } from "@/lib/rpg/structures";

export const VILLAGE_POS = { x: 430, y: 1100 } as const;

function roof(
  x: number,
  y: number,
  width: number,
  depth: number,
  eave: number,
  levels: number,
): Box[] {
  const boxes: Box[] = [];
  for (let i = 0; i < levels; i++) {
    boxes.push({
      x,
      y,
      w: width + 10,
      d: depth + 10 - i * (depth / levels),
      base: eave + i * 6,
      top: eave + (i + 1) * 6,
      detail: "roof",
    });
  }
  return boxes;
}

const inn = { x: VILLAGE_POS.x, y: VILLAGE_POS.y + 70 };
const west = { x: VILLAGE_POS.x - 112, y: VILLAGE_POS.y - 38 };
const east = { x: VILLAGE_POS.x + 116, y: VILLAGE_POS.y - 22 };

export const VILLAGE_BOXES: readonly Box[] = [
  // The inn: broad frontage, wardless oak door, chimney and deep roof.
  { x: inn.x, y: inn.y, w: 116, d: 78, base: 0, top: 52, detail: "timber" },
  ...roof(inn.x, inn.y, 116, 78, 52, 6),
  { x: inn.x, y: inn.y - 40, w: 25, d: 3, base: 0, top: 38, detail: "timberDoor" },
  { x: inn.x + 35, y: inn.y + 9, w: 13, d: 15, base: 73, top: 101, detail: "wall" },

  // Two smaller cottages framing the lane.
  { x: west.x, y: west.y, w: 72, d: 58, base: 0, top: 43, detail: "timber" },
  ...roof(west.x, west.y, 72, 58, 43, 5),
  { x: west.x, y: west.y - 30, w: 18, d: 3, base: 0, top: 31, detail: "timberDoor" },
  { x: west.x - 22, y: west.y + 6, w: 10, d: 12, base: 61, top: 82, detail: "wall" },

  { x: east.x, y: east.y, w: 68, d: 62, base: 0, top: 45, detail: "timber" },
  ...roof(east.x, east.y, 68, 62, 45, 5),
  { x: east.x, y: east.y - 32, w: 18, d: 3, base: 0, top: 32, detail: "timberDoor" },
  { x: east.x + 20, y: east.y + 8, w: 10, d: 12, base: 63, top: 84, detail: "wall" },
  // The well's stone curb is low but still stops movement.
  { x: VILLAGE_POS.x + 3, y: VILLAGE_POS.y - 34, w: 25, d: 25, base: 0, top: 9, detail: "wall" },
];

export const VILLAGE_WELL = sprite(
  [
    ".......WWWWWW.......",
    ".....WWWKWWKWWW.....",
    "....WWKKKKKKKKWW....",
    "...WWKKKKKKKKKKWW...",
    "...WKKKKKKKKKKKKW...",
    "...WWWWWWWWWWWWWW...",
    "....WKWKWKWKWKWK....",
    "....WWWWWWWWWWWW....",
    ".....WKKKKKKKKW.....",
    ".....WKWKWKWKWK.....",
    ".....WKKKKKKKKW.....",
    ".....WWWWWWWWWW.....",
    "......WKKKKKKW......",
    "......WWWWWWWW......",
    ".....WW......WW.....",
    "....WW........WW....",
  ],
  { W: BW, K },
);

export const INN_SIGN = sprite(
  [
    ".......W.......",
    ".......W.......",
    "....WWWWWWW....",
    "....WYYYYYW....",
    "....WYKYKYW....",
    "....WYKYKYW....",
    "....WYYYYYW....",
    "....WYKYYYW....",
    "....WYYYYYW....",
    "....WWWWWWW....",
    ".......W.......",
    ".......W.......",
    "......WWW......",
  ],
  { W: BW, Y: Y, K },
);

/** An apron-clad innkeeper, kept mostly monochrome like the references. */
export const VILLAGE_INNKEEPER = sprite(
  [
    ".....HHHHH.....",
    "....HwwwwwH....",
    "....HwkkkwH....",
    "....HwwwwwH....",
    ".....HwwwH.....",
    "...HHwwwwwHH...",
    "..HwwwwwwwwwH..",
    "..HwwHHHHHwwH..",
    "..HwwHwwwHwwH..",
    ".HwwwHwwwHwwwH.",
    ".HwwwHwwwHwwwH.",
    ".HwwwHwwwHwwwH.",
    "..HwwHwwwHwwH..",
    "..HwwHwwwHwwH..",
    "..HwwHHHHHwwH..",
    "...HwwwwwwwH...",
    "...HwwwHwwwH...",
    "...HwwwHwwwH...",
    "...HwwwHwwwH...",
    "...Hww...wwH...",
    "..HHww...wwHH..",
    ".HHH.......HHH.",
  ],
  { H: BW, w: W, k: K },
);

/** A hooded villager carrying a small lantern through the lane. */
export const VILLAGE_WANDERER = sprite(
  [
    ".....HHHHH.....",
    "....HwwwwwH....",
    "...HwwwwwwwH...",
    "...HwwkkkwwH...",
    "....HwwwwwH....",
    "...HHwwwwwHH.H.",
    "..HwwwwwwwwwHH.",
    "..HwwwwwwwwwH..",
    ".HwwwwwwwwwwwH.",
    ".HwwwwwwwwwwwH.",
    ".HwwwwwwwwwwwH.",
    "..HwwwwwwwwwH..",
    "..HwwwwwwwwwH..",
    "...HwwwHwwwH...",
    "...HwwwHwwwH.y.",
    "...HwwwHwwwHyyy",
    "...HwwwHwwwH.y.",
    "...HwwwHwwwH.H.",
    "...Hww...wwH.H.",
    "..HHw.....wHHH.",
    ".HHH.......HHH.",
  ],
  { H: BW, w: W, k: K, y: BY },
);

export const VILLAGE_PROPS: readonly Billboard[] = [
  {
    x: VILLAGE_POS.x + 3,
    y: VILLAGE_POS.y - 34,
    sprite: VILLAGE_WELL,
    height: 23,
    solid: 12,
  },
  {
    x: inn.x + 37,
    y: inn.y - 43,
    sprite: INN_SIGN,
    height: 22,
    elevate: 24,
  },
];
