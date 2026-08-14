// Interior props, authored as string bitmaps (one char per pixel, '.'
// transparent). Drawn to stand out against near-black chambers — the K fill
// is load-bearing: invisible on black, but it occludes the wall behind so a
// font reads as a solid object rather than a wire outline.

import { C, K, M, R, W, Y, BM, BR, BW, BY } from "@/lib/rpg/palette";
import { sprite } from "@/lib/rpg/screen";

/**
 * Iron sconce bolted to a wall, burning. Frame 1 of 2.
 * (9x18)
 */
export const WALL_TORCH = sprite(
  [
    "...Y...Y.",
    ".Y.......",
    "....Y....",
    "...YY....",
    "...YYY...",
    "..YYYY...",
    "..YYHYY..",
    "..YHYHY..",
    ".YYHHHYY.",
    ".YHHHRHY.",
    ".YRHHHHY.",
    ".WWWWWWW.",
    ".WKKKKKW.",
    "..WKKKW..",
    "WWWWWWWWW",
    "W..WKW..W",
    "...WKW...",
    "...WWW...",
  ],
  { W: W, K: K, Y: Y, H: BY, R: R },
);

/**
 * The same sconce, flame breathing. Frame 2 of 2 — the bracket
 * pixels are identical so the fire flickers in place.
 * (9x18)
 */
export const TORCH_FLAME_ALT = sprite(
  [
    ".Y.......",
    "......Y..",
    ".........",
    "..YY...Y.",
    "..YYY....",
    ".YYYY....",
    ".YYHYY...",
    ".YHYHYY..",
    ".YHHHHHY.",
    ".YHHHRHY.",
    ".YRHHHHY.",
    ".WWWWWWW.",
    ".WKKKKKW.",
    "..WKKKW..",
    "WWWWWWWWW",
    "W..WKW..W",
    "...WKW...",
    "...WWW...",
  ],
  { W: W, K: K, Y: Y, H: BY, R: R },
);

/**
 * Standing iron brazier: splayed legs, heaped coals, broad flame.
 * (16x20)
 */
export const BRAZIER = sprite(
  [
    "..Y..........Y..",
    "..........Y.....",
    "......Y.........",
    ".....YY.........",
    ".....YYY..Y.....",
    "....YYYY.YYY....",
    "...YYYYYYYYYY...",
    "..YHYHYHYHYHYY..",
    ".YHHHHHHHHHHHHY.",
    "...YHHHHHHHHY...",
    "...RERERERERE...",
    "..RERERERERERE..",
    ".WWWWWWWWWWWWWW.",
    ".WKKKKKKKKKKKKW.",
    "..WKKKKKKKKKKW..",
    "...WWWWWWWWWW...",
    "....W..WW..W....",
    "...W...WW...W...",
    "..W....WW....W..",
    ".WW....WW....WW.",
  ],
  { W: W, K: K, Y: Y, H: BY, R: R, E: BR },
);

/**
 * The treasure of the keep: a stone font holding a pool of
 * ley-light, motes rising from it.
 * (22x24)
 */
export const LEY_FONT = sprite(
  [
    "..........C....C......",
    ".......C.....C...C....",
    ".....C....L.....C.....",
    ".......L...C..L.......",
    "......WWWWWWWWWW......",
    "....WWCCCLCLCLCCWW....",
    "...WCCCLCLLLLCLCCCW...",
    "...WCCCCLLLLLLCCCCW...",
    "....WWCCLCLCLCCCWW....",
    "....WWWWWWWWWWWWWW....",
    ".....WCKCKCKCKCKW.....",
    "......WKKKCKKKKW......",
    ".......WKKKKKKW.......",
    "........WKKKKW........",
    ".......WWWWWWWW.......",
    "........WKKKKW........",
    "........WKKKKW........",
    "........WKKKKW........",
    ".......WWWWWWWW.......",
    ".....WWWWWWWWWWWW.....",
    ".....WKKWKKKKWKKW.....",
    "...WWWWWWWWWWWWWWWW...",
    "...WKKKWKKKKKKWKKKW...",
    "...WWWWWWWWWWWWWWWW...",
  ],
  { K: K, W: W, C: C, L: BW },
);

/**
 * Freestanding interior archway; the opening is transparent so
 * the chamber beyond shows through.
 * (26x30)
 */
export const INNER_ARCH = sprite(
  [
    "..........WWWWWW..........",
    "........WWWKKKKWWW........",
    "......WWKKWKCCKWKKWW......",
    ".....WWKKKWWCCWWKKKWW.....",
    "....WKKWKKKWKKWKKKWKKW....",
    "...WKKKWWKWWWWWWKWWKKKW...",
    "...WKKKKWW......WWKKKKW...",
    "..WWKKKKW........WKKKKWW..",
    "..WWWKKW..........WKKWWW..",
    ".WKKWWW............WWWKKW.",
    ".WKKKKW............WKKKKW.",
    ".WKKKW..............WKKKW.",
    "WKKKKW..............WKKKKW",
    "WWWWWW..............WWWWWW",
    "WKKKKW..............WKKKKW",
    "WKKKKW..............WKKKKW",
    "WKKKKW..............WKKKKW",
    "WWWWWW..............WWWWWW",
    "WKWKKW..............WKKWKW",
    "WKWKKW..............WKKWKW",
    "WKWKKW..............WKKWKW",
    "WWWWWW..............WWWWWW",
    "WKKKKW..............WKKKKW",
    "WKKKKW..............WKKKKW",
    "WKKKKW..............WKKKKW",
    "WKKKKW..............WKKKKW",
    "WWWWWW..............WWWWWW",
    "WKKWKW..............WKWKKW",
    "WKKWKW..............WKWKKW",
    "WWWWWW..............WWWWWW",
  ],
  { K: K, W: W, C: C },
);

/**
 * A tattered hanging banner, its sigil long faded.
 * (10x22)
 */
export const BANNER = sprite(
  [
    "WWWWWWWWWW",
    "WMMMMMMMMW",
    ".MMMMMMMM.",
    ".MMMMMMMM.",
    ".MMMMMM.M.",
    ".MMKKKKMM.",
    ".MKKSSKKM.",
    ".MKSSSSKM.",
    ".MSSSSSSM.",
    ".MKSSSSKM.",
    ".MKKSSKKM.",
    ".MMKKKKMM.",
    ".M.MMMMMM.",
    ".MMMMMMMM.",
    ".MKMMMKMM.",
    ".MMMMKMMM.",
    ".MKMKMKMM.",
    ".MMKMKMK..",
    ".MMMMMMMM.",
    ".MM.MMMMM.",
    ".MM.MMM...",
    ".M..MM....",
  ],
  { K: K, W: W, M: M, S: BM },
);
