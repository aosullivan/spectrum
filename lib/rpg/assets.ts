// All drawable art, authored as string bitmaps (one char per pixel) — the
// agreed authoring format. Adapted from the approved "Leyline" concept image.

import { B, BC, BG, BM, BW, BY, C, G, K, M, W, Y } from "@/lib/rpg/palette";
import { sprite, type Sprite } from "@/lib/rpg/screen";

// ---------------------------------------------------------------- pixel font

const GLYPHS: Record<string, string[]> = {
  A: [".ww.", "w..w", "wwww", "w..w", "w..w"],
  B: ["www.", "w..w", "www.", "w..w", "www."],
  C: [".www", "w...", "w...", "w...", ".www"],
  D: ["www.", "w..w", "w..w", "w..w", "www."],
  E: ["www", "w..", "ww.", "w..", "www"],
  F: ["www", "w..", "ww.", "w..", "w.."],
  G: [".www", "w...", "w.ww", "w..w", ".www"],
  H: ["w..w", "w..w", "wwww", "w..w", "w..w"],
  I: ["www", ".w.", ".w.", ".w.", "www"],
  J: ["..www", "...w.", "...w.", "w..w.", ".ww.."],
  K: ["w..w", "w.w.", "ww..", "w.w.", "w..w"],
  L: ["w..", "w..", "w..", "w..", "www"],
  M: ["w...w", "ww.ww", "w.w.w", "w...w", "w...w"],
  N: ["w...w", "ww..w", "w.w.w", "w..ww", "w...w"],
  O: [".ww.", "w..w", "w..w", "w..w", ".ww."],
  P: ["www.", "w..w", "www.", "w...", "w..."],
  Q: [".ww..", "w..w.", "w..w.", "w.ww.", ".ww.w"],
  R: ["www.", "w..w", "www.", "w.w.", "w..w"],
  S: [".www", "w...", ".ww.", "...w", "www."],
  T: ["www", ".w.", ".w.", ".w.", ".w."],
  U: ["w..w", "w..w", "w..w", "w..w", ".ww."],
  V: ["w...w", "w...w", "w...w", ".w.w.", "..w.."],
  W: ["w...w", "w...w", "w.w.w", "w.w.w", ".w.w."],
  X: ["w...w", ".w.w.", "..w..", ".w.w.", "w...w"],
  Y: ["w.w", "w.w", ".w.", ".w.", ".w."],
  Z: ["www", "..w", ".w.", "w..", "www"],
  "0": [".ww.", "w..w", "w..w", "w..w", ".ww."],
  "1": [".w.", "ww.", ".w.", ".w.", "www"],
  "2": ["ww.", "..w", ".w.", "w..", "www"],
  "3": ["ww.", "..w", ".w.", "..w", "ww."],
  "4": ["w.w", "w.w", "www", "..w", "..w"],
  "5": ["www", "w..", "ww.", "..w", "ww."],
  "6": [".ww", "w..", "ww.", "w.w", ".w."],
  "7": ["www", "..w", ".w.", ".w.", ".w."],
  "8": [".w.", "w.w", ".w.", "w.w", ".w."],
  "9": [".w.", "w.w", ".ww", "..w", "ww."],
  ".": [".", ".", ".", ".", "w"],
  ",": [".", ".", ".", "w", "w"],
  "'": ["w", "w", ".", ".", "."],
  "!": ["w", "w", "w", ".", "w"],
  "?": ["ww.", "..w", ".w.", "...", ".w."],
  "-": ["...", "...", "www", "...", "..."],
  ":": [".", "w", ".", "w", "."],
  ";": [".", "w", ".", "w", "w"],
};

const glyphCache = new Map<string, Sprite>();

/** Width in pixels of `s` drawn at `scale` (for centring). */
export function textWidth(s: string, scale = 1): number {
  let w = 0;
  for (const ch of s) w += ((GLYPHS[ch]?.[0].length ?? 3) + 1) * scale;
  return w - scale;
}

export function glyph(ch: string, colour: number): Sprite | null {
  const rows = GLYPHS[ch];
  if (!rows) return null;
  const key = `${ch}:${colour}`;
  let spr = glyphCache.get(key);
  if (!spr) {
    spr = sprite(rows, { w: colour });
    glyphCache.set(key, spr);
  }
  return spr;
}

// -------------------------------------------------------------------- actors

/**
 * The spirit-mage, seen from behind: the Seeker of Light, hooded, hovering,
 * staff held out with a ley-light burning at its head, and the cloak trimmed
 * in cyan at collar and hem. Authored at native 44x64 and drawn at scale 1 —
 * an upscaled small sprite is what made the old one blocky.
 * (44x64)
 */
export const HERO = sprite(
  [
    "............................................",
    "............................................",
    "............................................",
    "............................................",
    "............................................",
    "......................h............c........",
    "...................hwwwwkw..................",
    "..................hwwwwwwww.................",
    ".................hwwwwwwkwkw...c...c........",
    "................hwwhhkkwwkwkw....ccccc......",
    "................hwhhhhkkkwkwk...ccchcccc....",
    "................hwhhhhkkkkwkw...cchhhcc.....",
    "................hwkhhhkkkkkwk...chhhhhc.....",
    "...............hwwkkkkkkkkwwwk..cchhhcc.....",
    "................hwkkkkkkkkkwk...ccchccc.....",
    "................hwkkkkkkkkwkw.c..ccccc......",
    "................hwkkkkkkkkkwk....wwc........",
    "................hwwkkkkkkkwkw....www........",
    ".................hwwkkkkkwkw.....www........",
    "..................hwwwwwwww......www........",
    "................hwwwwwwwkwkw......ww........",
    ".............hccccccccccccccckwk..ww........",
    ".............hwwwwwwwwwwwwkwkwkw..ww........",
    ".............hwwwwwwwwwwwwwwwwwk..ww........",
    ".............hwwwwwwwwwwkwkwkwk...ww........",
    ".............hwwwwkwwwkwwwkwwkw...ww........",
    ".............hwwwkwwwwkwwwkwkwkw..ww........",
    "............hwwwwkwwwwkwwwkwwwwk..ww........",
    "...........hwwwwwkwwkwkwkwkwkwkwk.ww........",
    "...........hwwwwwkwwwwkwwwkwwkwkwkww........",
    "..........hwwwwwwkwwwwkwwwkwkwkwkwww........",
    "..........hwwwwwwkwwwwkwwwkwwwwkwwww........",
    "...........hwwwwwkwwwwkwkwkwkwkwkwww........",
    "...........hwwwwwkwwwwkwwwkwwkwkwkww........",
    "..........hwwwwwwkwwwwkwwwkwkwkwkwww........",
    "..........hwwwwwkwwwwwkwwwwkwwwkwwww........",
    ".........hwwwwwwkwwwkwkwkwkkkwkwkwww........",
    ".........hwwwwwwkwwwwwkwwwwkwkwwwkww........",
    ".........hwwwwwwkwwwwwkwwwkkkwkwkwww........",
    "..........hwwwwwkwwwwwkwwwwkwwwkwwww........",
    "...........hwwwwkwwwwwkwkwkkkwkwkwww........",
    "...........hwwwwkwwwwwkwwwwkwkwkwkww........",
    "..........hwwwwwkwwwwwkwwwkkkwkwkwww........",
    "..........hwwwwwkwwwwwkwwwwkwwwkwwww........",
    "..........hwwwwwkwwwwwkwkwkkkwkwkwww........",
    "...........hwwwwkwwwwwkwwwwkwkwkwkww........",
    ".............hwkwwwwwwkwwwkwkwkwk.ww........",
    "..............hkwwwwwwkwwwwwkwwk..ww........",
    "..............hkwwwwwwkwkwkwkwk...ww........",
    ".............hwkwwwwwwkwwwwwkkwk..ww........",
    ".............hwkwwwwwwkwwwkwkwkw..ww........",
    ".............hwwwwwwwwwwwwwwwwwk..ww........",
    "..............hcccccccccccccccc...ww........",
    "................hcccccccccccc.....ww........",
    ".................hwwwwwwkwk.......ww........",
    "....................www...........ww........",
    "....................www...........www.......",
    "....................cww...........www.......",
    ".....................wwwc.........www.......",
    ".....................www..........www.......",
    ".....................www..........www.......",
    ".....................www...........w........",
    ".....................www....................",
    "............................................",
  ],
  { w: W, k: K, h: BW, c: BC },
);

/**
 * A wraith: cold light in the shape of a person, hollow-eyed, going to
 * tatters from the hem up. Cyan throughout — the spectral dead all share
 * one ink, so a haunt is known before it is recognised.
 * (20x20)
 */
export const WRAITH = sprite(
  [
    "........CCCC........",
    "......CCccccCC......",
    ".....CccccccccC.....",
    ".....CckkcckkcC.....",
    ".....CccccccccC.....",
    "......CccccccC......",
    ".......CccccC.......",
    "....CCccccccccCC....",
    "...CccccccccccccC...",
    "...CccccccccccccC...",
    "..CccccccccccccccC..",
    "..CccccccccccccccC..",
    "..Ccccc.cc.cccccC...",
    "...Cccc..cc..cccC...",
    "...Ccc...cc...ccC...",
    "....Cc...cc...cC....",
    ".....c...cc...c.....",
    ".....c....c....c....",
    "......c.......c.....",
    ".......c.....c......",
  ],
  { c: C, C: BC, k: K },
);

// ----------------------------------------------------------------- landmarks

// The far-distance stones only ever draw at four to nine pixels (closer,
// they swap to the big sarsen art), and at that size an outline around a
// black interior reads as a hollow zero on the horizon. They are solid pale
// mass: a bright cap toward the moon, one dark bite low on the lee side.

/** A dolmen — two solid uprights under a lit capstone. */
export const DOLMEN = sprite(
  [
    "WWWWWWWWWWW",
    "Wwwwwwwwwww",
    ".www...www.",
    ".wwk...wwk.",
    ".www...www.",
    ".wwk...wwk.",
    ".www...www.",
  ],
  { w: W, W: BW, k: K },
);

/** Standing stones, three sizes. */
export const STONE_S = sprite(
  [".W.", "Www", "www", "wwk", "ww."],
  { w: W, W: BW, k: K },
);
export const STONE_M = sprite(
  [".Ww.", "Wwww", "Wwww", "wwwk", "wwww", ".wwk"],
  { w: W, W: BW, k: K },
);
export const STONE_L = sprite(
  ["..W..", ".Www.", "Wwwww", "Wwwww", "wwwwk", "wwwww", "wwwwk", ".wkw."],
  { w: W, W: BW, k: K },
);

export const BOULDER = sprite(
  ["..wwww..", ".wkkkkw.", "wkkkkkkw", "wkkkkkkw", ".wkkkkw.", "..wwww.."],
  { w: W, k: K },
);

/** Thin cold crescent moon. */
export const MOON = sprite(
  [
    "......ww..",
    "....www...",
    "...ww.....",
    "..ww......",
    "..Hw......",
    ".Hw.......",
    ".Hw.......",
    ".Hw.......",
    "..Hw......",
    "..ww......",
    "...ww.....",
    "....www...",
    "......ww..",
  ],
  { w: W, H: BW },
);

// ---------------------------------------------------------------------- HUD

export const RUNE_LEY = sprite(
  ["...w...", "..w.w..", ".w...w.", "..w.w..", "...w...", "...w...", "...w...", "...w...", "...w..."],
  { w: W },
);
export const RUNE_GATE = sprite(
  ["..www..", ".w...w.", "w.....w", "w.....w", "w.....w", "w.....w", "w.....w", "w.....w", "w.....w"],
  { w: W },
);
export const RUNE_MOON = sprite(
  ["...ww..", "..w....", ".w.....", ".w.....", ".w.....", ".w.....", ".w.....", "..w....", "...ww.."],
  { w: W },
);
export const RUNE_WARD = sprite(
  ["w.....w", ".w...w.", "..w.w..", "...w...", "..w.w..", ".w...w.", "w.....w", "...w...", "...w..."],
  { w: W },
);

export const SPELL_DOT = sprite([".c.", "cCc", ".c."], { c: C, C: BW });
export const GEM_FULL = sprite(
  ["..m..", ".mmm.", "mmHmm", ".mmm.", "..m.."],
  { m: M, H: BW },
);
export const GEM_EMPTY = sprite(
  ["..m..", ".m.m.", "m...m", ".m.m.", "..m.."],
  { m: M },
);

// Re-export the handful of palette names the renderer wants alongside art.
export { B, BC, BG, BM, BW, BY, C, G, K, M, W, Y };
