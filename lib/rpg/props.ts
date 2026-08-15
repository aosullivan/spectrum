// Interior props, authored as string bitmaps (one char per pixel, '.'
// transparent). Drawn to stand out against near-black chambers — the K fill
// is load-bearing: invisible on black, but it occludes the wall behind so a
// font reads as a solid object rather than a wire outline.

import { C, K, M, R, W, Y, BM, BR, BW, BY } from "@/lib/rpg/palette";
import { sprite } from "@/lib/rpg/screen";

/**
 * Iron sconce bolted to a wall, burning: a fat teardrop of flame with a
 * white-hot heart, over a black iron cup and bracket. Frame 1 of 2.
 * (9x18)
 */
export const WALL_TORCH = sprite(
  [
    "....Y....",
    "...YY..Y.",
    ".Y.YYY...",
    "..YYYYY..",
    "..YYHYY..",
    ".YYHHHY..",
    ".YHHLHHY.",
    ".YHHLHHY.",
    ".YHHHHHY.",
    ".YRHHHRY.",
    "..RRHRR..",
    ".WWWWWWW.",
    ".WKKKKKW.",
    "..WKKKW..",
    "WWWWWWWWW",
    "W..WKW..W",
    "...WKW...",
    "...WWW...",
  ],
  { W: W, K: K, Y: Y, H: BY, R: R, L: BW },
);

/**
 * The same sconce, flame breathing. Frame 2 of 2 — the bracket
 * pixels are identical so the fire flickers in place.
 * (9x18)
 */
export const TORCH_FLAME_ALT = sprite(
  [
    ".Y..Y....",
    "....YY...",
    "...YYY.Y.",
    "..YYYYY..",
    "..YHYYY..",
    "..YHHHYY.",
    ".YHLHHHY.",
    ".YHLLHHY.",
    ".YHHHHHY.",
    ".YRHHHRY.",
    "..RRHRR..",
    ".WWWWWWW.",
    ".WKKKKKW.",
    "..WKKKW..",
    "WWWWWWWWW",
    "W..WKW..W",
    "...WKW...",
    "...WWW...",
  ],
  { W: W, K: K, Y: Y, H: BY, R: R, L: BW },
);

/**
 * Standing torchère: a tall iron stand with a small cresset bowl and a
 * teardrop of flame. Slim on purpose — the old broad brazier's stacked
 * bands of flame, coals and bowl voted down to a burger at hall range.
 * (12x26)
 */
export const BRAZIER = sprite(
  [
    "....YY......",
    "...YYYY..Y..",
    "..YYHHYY....",
    "..YHHLHY.Y..",
    "..YHLLHHY...",
    "..YHHHHHY...",
    "...YRHRY....",
    "....RRR.....",
    "...WWWWW....",
    "...WKKKW....",
    "....WKW.....",
    ".....W......",
    ".....W......",
    ".....W......",
    ".....W......",
    ".....W......",
    ".....W......",
    "....WWW.....",
    ".....W......",
    ".....W......",
    ".....W......",
    ".....W......",
    "....W.W.....",
    "...W...W....",
    "..W.....W...",
    ".WW.....WW..",
  ],
  { W: W, K: K, Y: Y, H: BY, R: R, L: BW },
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
 * A hall banner off the keep's better days: purple field hung from an
 * iron rod, gold bands and a gold leyflower sigil, hem cut to a point.
 * (12x25)
 */
export const BANNER = sprite(
  [
    "WWWWWWWWWWWW",
    ".W..W..W..W.",
    "GGGGGGGGGGGG",
    "GMSMMMMMMMMG",
    "GMSMMMMMMMMG",
    "GMS..gg..MMG",
    "GMS.gggg.MMG",
    "GMSg.gg.gMMG",
    "GMSggggggMMG",
    "GMS..gg..MMG",
    "GMS.gggg.MMG",
    "GMSMMMMMMMMG",
    "GMSMMMMMMMMG",
    "GMSMMMMMMMMG",
    "GGGGGGGGGGGG",
    "GMSMMMMMMMMG",
    ".GMSMMMMMMG.",
    ".GMSMMMMMMG.",
    "..GMMMMMMG..",
    "..GSMMMMMG..",
    "...GMMMMG...",
    "...GMMMMG...",
    "....GMMG....",
    "....GMMG....",
    ".....GG.....",
  ],
  { K: K, W: W, M: M, S: BM, G: Y, g: BY },
);

/**
 * Its partner across the hall: the same cut in deep red, carrying
 * a gold tower rather than the flower.
 * (12x25)
 */
export const BANNER_RED = sprite(
  [
    "WWWWWWWWWWWW",
    ".W..W..W..W.",
    "GGGGGGGGGGGG",
    "GRSRRRRRRRRG",
    "GRSRRRRRRRRG",
    "GRSg.gg.gRRG",
    "GRSggggggRRG",
    "GRS.gggg.RRG",
    "GRS.gggg.RRG",
    "GRS.g..g.RRG",
    "GRSggggggRRG",
    "GRSRRRRRRRRG",
    "GRSRRRRRRRRG",
    "GRSRRRRRRRRG",
    "GGGGGGGGGGGG",
    "GRSRRRRRRRRG",
    ".GRSRRRRRRG.",
    ".GRSRRRRRRG.",
    "..GRRRRRRG..",
    "..GSRRRRRG..",
    "...GRRRRG...",
    "...GRRRRG...",
    "....GRRG....",
    "....GRRG....",
    ".....GG.....",
  ],
  { K: K, W: W, R: R, S: BR, G: Y, g: BY },
);
