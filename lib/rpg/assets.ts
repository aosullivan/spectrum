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
 * The spirit-mage: the Seeker of Light, seen from behind, hood up, staff in
 * her right hand and the robe tapering to a wisp. Back view is the only one
 * the game ever shows, so the hood is solid — there is no face to draw — and
 * the reading comes from the cyan: crystal above, hem below.
 * (22x32)
 */
export const HERO = sprite(
  [
    "..................C...",
    ".................CHC..",
    "......HHHH......cCHCc.",
    ".....HwwwwH......CHC..",
    "....HwwwwwwH......C...",
    "....HwwwwwwH......H...",
    "....HwwwwwwH......H...",
    "....HHwwwwHH......H...",
    "...HHwwwwwwHH.....H...",
    "..HHwwkkkkwwHH....H...",
    "..HwwwwwwwwwwH....H...",
    "..HwwwwwwwwwwHwwwHH...",
    "..HwwkwwwwkwwH....H...",
    "..HwwkwwwwkwwH....H...",
    "..HwwkwwwwkwwH....H...",
    "..HwwkwwwwkwwH....H...",
    "..HwwkwwwwkwwH....H...",
    "..HwwkwwwwkwwH....H...",
    "...HwkwwwwkwH.....H...",
    "...HwkwwwwkwH.....H...",
    "....HwwwwwwH......H...",
    "....HwwwwwwH......H...",
    ".....HwwwwH.......H...",
    ".....cwwwwc.......H...",
    "......cwwc........H...",
    "......cCCc........c...",
    ".......CC.............",
    ".......Cc.............",
    "........c.............",
    "........c.............",
    ".......c.c............",
    "......c...c...........",
  ],
  { w: W, H: BW, k: K, c: C, C: BC },
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

/** A dolmen — two uprights and a capstone. */
export const DOLMEN = sprite(
  [
    ".wwwwwwwww.",
    ".wwwwwwwww.",
    "..w.....w..",
    ".wkw...wkw.",
    ".wkw...wkw.",
    ".wkw...wkw.",
    ".wkw...wkw.",
  ],
  { w: W, k: K },
);

/** Standing stones, three sizes. */
export const STONE_S = sprite([".w.", "wkw", "wkw", "wkw", ".w."], { w: W, k: K });
export const STONE_M = sprite(
  [".ww.", "wkkw", "wkkw", "wkkw", "wkkw", ".ww."],
  { w: W, k: K },
);
export const STONE_L = sprite(
  [".www.", "wkkkw", "wkkkw", "wkkkw", "wkkkw", "wkkkw", "wkkkw", ".www."],
  { w: W, k: K },
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
