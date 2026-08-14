// Items you can carry off, and the marker that says "leave here".
// String bitmaps, one char per pixel, '.' transparent.

import { C, K, M, W, Y, BC, BW, BY } from "@/lib/rpg/palette";
import { sprite } from "@/lib/rpg/screen";

/**
 * The quest artifact: an open torc of twisted gold.
 * (14x12)
 */
export const ITEM_TORC = sprite(
  [
    "....yy..yy....",
    "..wywy..yYy...",
    "...Yyy..yyY...",
    "..yyyY..yyyyw.",
    ".YYY......yYY.",
    ".Yyy......yYy.",
    ".yY........Yy.",
    ".Yy........Yy.",
    ".YYY......yYy.",
    "..yYy....YYYw.",
    "...YyYyYyyy...",
    "....yyYyyY....",
  ],
  { Y: Y, y: BY, w: BW },
);

/**
 * An old iron key, bow pierced and bit notched.
 * (9x16)
 */
export const ITEM_KEY = sprite(
  [
    "...WWW...",
    "..WWwWW..",
    ".WWkkkWW.",
    ".WWkkkWW.",
    ".WWkkkWW.",
    "..WWWWW..",
    "...WkW...",
    "...WkW...",
    "...WkW...",
    "..WWWWW..",
    "...WkW...",
    "...WkWWW.",
    "...WkWWW.",
    "...WkW...",
    "...WkWWW.",
    "...WWWWW.",
  ],
  { W: W, k: K, w: BW },
);

/**
 * A rolled vellum scroll tied with a faded ribbon.
 * (14x12)
 */
export const ITEM_SCROLL = sprite(
  [
    "..WWWWWWWWWWW.",
    ".WWWWWWWmmWWWW",
    "WkkkWWkWmmWcWW",
    "WkWkWkWWmmWWcW",
    "WkkkWWkWmmWWWW",
    "WWWWWkWWmmWcWW",
    "WkWWWkWWmmWWWk",
    "kkkWkkkWmmkWkk",
    ".kkkkkkkmmkkk.",
    "........mm....",
    ".......mm.....",
    "......mm......",
  ],
  { W: W, k: K, m: M, c: C },
);

/**
 * The way out: a doorway filled with ley-light, spilling onto
 * the floor. Meant to be unmistakable from across a dark chamber.
 * (28x34)
 */
export const EXIT_ARCH = sprite(
  [
    ".............w..............",
    "..............w.............",
    ".............w..............",
    ".WWWWWWWWWWWWWWWWWWWWWWWWWW.",
    ".WkkkkkWkkkkkcckkkkkWkkkkkW.",
    ".WkkkkkWkkkkcwwckkkkWkkkkkW.",
    ".WkkkkkWkkkkkcckkkkkWkkkkkW.",
    ".WWWWWWWWWWWWWWWWWWWWWWWWWW.",
    ".WkkWkkkkkWWWWWWWWckkkkWkkW.",
    "..WkWkkkkWcCCwwCCcWkkkkWkW..",
    "..WkWkkkWccCCwwCCccWckkWkW..",
    "..WkWkkWCCCCwwwwCCCCWkkWkW..",
    "..WWWWWWcccCCwwCCcccWWWWWW..",
    "..WkkWkWcccCCwwCCcccWkWkkW..",
    "..WkkWkWcccCCwwCCcccWkWkkW..",
    "..WkkWkWcccCCwwCCcccWkWkkW..",
    "..WWWWWWCCCCwwwwCCCCWWWWWW..",
    "..WkWkkWcccCCwwCCcccWkkWkW..",
    "..WkWkkWcccCCwwCCcccWkkWkW..",
    "..WkWkkWcccCCwwCCcccWkkWkW..",
    "..WWWWWWcccCCwwCCcccWWWWWW..",
    "..WkkWkWCCCCwwwwCCCCWkWkkW..",
    "..WkkWkWcccCCwwCCcccWkWkkW..",
    "..WkkWkWcccCCwwCCcccWkWkkW..",
    "..WWWWWWcccCCwwCCcccWWWWWW..",
    "..WkkkkWcccCCwwCCcccWkkkkW..",
    "WWkkkkkWCCCCwwwwCCCCWkkkkkWW",
    "WWWWWWWWcccCCwwCCcccWWWWWWWW",
    "....c.cccCCCCCCCCCCcccc.....",
    "...c.c.ccCCCCCCCCCCccc.c.c..",
    "c.ccccccccccccccccccccccc.c.",
    ".c.c.c.c.c.c.c.c.c.c.c.c.c.c",
    "c.c.ccc.ccc.ccc.ccc.ccc.c.c.",
    ".c...c.c.c.c.c.c.c.c.c...c..",
  ],
  { W: W, k: K, w: BW, c: C, C: BC },
);
