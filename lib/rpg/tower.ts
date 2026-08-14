// Art for the keep's stair and roof, authored as string bitmaps.
// The parapet tiles horizontally: its left and right edges each carry a
// half-gap, so butted copies make uniform merlons with the seam falling in
// the middle of a crenel, never through a stone.

import { BW, C, K, W } from "@/lib/rpg/palette";
import { sprite } from "@/lib/rpg/screen";

/** A section of battlement seen from inside the roof. Tiles left-to-right. (32x22) */
export const PARAPET = sprite(
  [
    "...WWWWWWWWWW......WWWWWWWWWW...",
    "...WKKKWKKKKW......WKKKKKWKKW...",
    "...WKKKWKKKKW......WKKKKKWKKW...",
    "...WKKKWKKKKW......WKKKKKWKKW...",
    "...WKKKKKKKKW......WKKKKKKKKW...",
    "...WKKKKKKKKW......WKKKKKKKKW...",
    "WWWWKKKKKKKKWWWWWWWWKKKKKKKKWWWW",
    "KWKWKKKKKKKKWWKWKWKWKKKKKKKKWWKW",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "KWKWWWKWKWKWKWKWKWKWWWKWKWKWKWKW",
    "WKWKWKWKWKWKWKWKWKWKWKWKWKWKWKWK",
    "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
    "WKWKWKWKWKWKWKWKWKWKWKWKWKWKWKWK",
    "KKKKKKKKKKKKWKKKKKKKKKKKKKKKWKKK",
    "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
    "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
    "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
    "KKKKKKKKKKKKWKKKKKKKKKKKKKKKWKKK",
    "KKKKKKKKKKKKWKKKKKKKKKKKKKKKWKKK",
    "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
    "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
    "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
  ],
  { W: W, K: K },
);

/** An arched door with worn treads rising into the dark, lit from above. (21x30) */
export const STAIR_DOOR = sprite(
  [
    "WWWWWWWWWWWWWWWWWWWWW",
    "KKKKKKKKKKKKKKKKKKKKK",
    "KKKKKKKKKKKKKKKKKKKKK",
    "KKKKKKKKKKKKKKKKKKKKK",
    "WWWWWWWKKKWKKKKWWWWWW",
    "KKWKKKKKKWWWKKKKKKKWK",
    "KKWKKKKWWWWWWWKKKKKWK",
    "KKWKKKWWKKKKKWWKKKKWK",
    "KKWKKWWKKKKKKKWWKKKWK",
    "WWWWKWWKKKKKKKWWKWWWW",
    "KWKKWWKKKKKKKKKWWKKWK",
    "KWKKWKKCKCKCwCKCWKKWK",
    "KWKKWWKKCKCKCwCKWKKWK",
    "KWKKWKKKKKKKKKKKWKKWK",
    "WWWWWKKKKKCKCKCKWWWWW",
    "WKKKWKKKKKKKKKKKWKWKK",
    "WKKKWKKKKKKCKCKKWKWKK",
    "WKKKWKKKKKKKKKKKWKWKK",
    "WKKKWKKKKKKKKKKKWKWKK",
    "WWWWWKKKKCKCKCKKWWWWW",
    "KKWKWWKKKKKKKKKWWWKKK",
    "KKWKWKWWWWWKWWWKWWKKK",
    "KKWKWKKKKKKKKKKKWWKKK",
    "KKWKWKKKKKKKKKKKWWKKK",
    "WWWWWKWWKKWWWWWKWWWWW",
    "KKKKWKKKKKKKKKKKWKKKK",
    "KKKKWKKKKKKKKKKKWKKKK",
    "KKKKWWWWWWWWWKWWWKKKK",
    "WWWWWWWWWWWWWWWWWWWWW",
    "KKKKKKKKKKKKKKKKKKKKK",
  ],
  { W: W, K: K, C: C, w: BW },
);

/** Seen from above on the roof: the way back down. (22x14) */
export const ROOF_HATCH = sprite(
  [
    "....KKKKKKKKKKKKKK....",
    "....KKKKKKKKKKKKKK....",
    "...WKKKKKKKKKKKKKKK...",
    "...WKKKKKKKKKKKKKKW...",
    "...WKKKKKKKKKKKKKKW...",
    "...WKKKKKKKKKKKKKKW...",
    "..WWWKWWKWWKKKKKKKKW..",
    "..WKKKKKKKKWKKKKKKKW..",
    "..WWWWWWWWWWKKKKKKKW..",
    "..WKKKKKKKKKWKKKKKKW..",
    ".WKWWWWWWWWWWKKKKKKKW.",
    ".WKKKKKKKKKKKKKKKKKKW.",
    "WWWWWWWWWWWWWWWWWWWWWW",
    ".KKKKKKKKKKKKKKKKKKKK.",
  ],
  { W: W, K: K },
);

/** An iron fire-basket on the roof, cold and unlit. (17x26) */
export const BEACON = sprite(
  [
    "..W..W..W..W..W..",
    "..W..W..W..W..W..",
    "..WWWWWWWWWWWWW..",
    "..WKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKW..",
    "..WWWWWWWWWWWWW..",
    "..WKKWKKWKKWKKW..",
    "..WWWWWWWWWWWWW..",
    "..WKKWKKWKKWKKW..",
    "..WKKWKKWKKWKKW..",
    "..WWWWWWWWWWWWW..",
    "....W..WKW..W....",
    ".....W.WKW.W.....",
    "......WWKWW......",
    ".......WKW.......",
    ".......WKWW......",
    ".......WKWW......",
    ".......WKW.......",
    ".......WWW.......",
    ".......WKW.......",
    ".......WKW.......",
    "......WWKWW......",
    ".....W.WKW.W.....",
    "....WWWWWWWWW....",
    "....WKKKKKKKW....",
    "....KKKKKKKKK....",
  ],
  { W: W, K: K },
);
