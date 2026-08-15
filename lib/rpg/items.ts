// Items you can carry off, and the marker that says "leave here".
// String bitmaps, one char per pixel, '.' transparent.

import { B, C, K, M, W, Y, BC, BW, BY } from "@/lib/rpg/palette";
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
 * The way out: a round-arched doorway of solid stone flooded with
 * ley-light, a white-hot seam down its centre, the glow spilling out
 * across the flags. Meant to be unmistakable from across a dark chamber.
 * (26x36)
 */
export const EXIT_ARCH = sprite(
  [
    ".........BBBBBBBB.........",
    ".......BBBBBBBBBBBB.......",
    ".....BBBBBBKBBBBBBBB......",
    "....BBBBBWWWWWWWWBBBBB....",
    "...BBBKBBWccCCccWBBKBBB...",
    "..BBBBBWWcCCLLCCcWWBBBBB..",
    "..BBKBBWcCCLLLLCCcWBBKBB..",
    ".BBBBBWcCCCLLLLCCCcWBBBBB.",
    ".BBKBBWcCCCLLLLCCCcWBBKBB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BKBBWccCCCLLLLCCCccWBBKB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BBKBWccCCCLLLLCCCccWBKBB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BKBBWccCCCLLLLCCCccWBBKB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BBKBWccCCCLLLLCCCccWBKBB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BKBBWccCCCLLLLCCCccWBBKB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BBKBWccCCCLLLLCCCccWBKBB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    ".BBBBWccCCCLLLLCCCccWBBBB.",
    "BBBBBWcCCCCLLLLCCCCcWBBBBB",
    "BBKBBWcCCCCLLLLCCCCcWBBKBB",
    "....cccCCCCLLLLCCCCccc....",
    "..c.ccCCCCCLLLLCCCCCcc.c..",
    ".c.cccCCCCCcLLcCCCCCccc.c.",
    ".c.c.c.c.cCcCcCc.c.c.c.c.c",
    "..c...c..cCc..cCc..c...c..",
  ],
  { B: B, K: K, W: W, c: C, C: BC, L: BW },
);
