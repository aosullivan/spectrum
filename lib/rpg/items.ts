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
 * The torc again with every fixed highlight removed, so exactly one glint
 * can travel round the ring: top-left, then the right shoulder, then the
 * bottom. Three frames is enough for the eye to read it as one moving
 * point rather than three sparks flickering at once.
 */
function torcGlint(rows: string[]): typeof ITEM_TORC {
  return sprite(rows, { Y: Y, y: BY, w: BW });
}

const ITEM_TORC_A = torcGlint([
  "....yy..yy....",
  "..wwyy..yYy...",
  "...Yyy..yyY...",
  "..yyyY..yyyy..",
  ".YYY......yYY.",
  ".Yyy......yYy.",
  ".yY........Yy.",
  ".Yy........Yy.",
  ".YYY......yYy.",
  "..yYy....YYY..",
  "...YyYyYyyy...",
  "....yyYyyY....",
]);

const ITEM_TORC_B = torcGlint([
  "....yy..yy....",
  "..yyyy..yYy...",
  "...Yyy..yyY...",
  "..yyyY..yyyy..",
  ".YYY......ywY.",
  ".Yyy......ywy.",
  ".yY........Yy.",
  ".Yy........Yy.",
  ".YYY......yYy.",
  "..yYy....YYY..",
  "...YyYyYyyy...",
  "....yyYyyY....",
]);

const ITEM_TORC_C = torcGlint([
  "....yy..yy....",
  "..yyyy..yYy...",
  "...Yyy..yyY...",
  "..yyyY..yyyy..",
  ".YYY......yYY.",
  ".Yyy......yYy.",
  ".yY........Yy.",
  ".Yy........Yy.",
  ".YYY......yYy.",
  "..yYy....YYY..",
  "...YyYwwyyy...",
  "....yyYyyY....",
]);

/** Three frames at a lazy 4fps: a glint travelling round the gold. */
export const TORC_FRAMES = [ITEM_TORC_A, ITEM_TORC_B, ITEM_TORC_C];

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

// The key gets no glint. Its art is already white, so a bright-white
// highlight has nothing to contrast against — at pickup size the frames were
// indistinguishable. The ley-pool underneath does the marking instead.

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
