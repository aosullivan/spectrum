// Production art for the Leyline world, authored as string bitmaps
// (one char per pixel, '.' transparent) — the agreed authoring format.
// Drawn against the approved "V2 Leyline" concept; see docs/rpg-design.md.

import { C, G, K, W, Y, BC, BG, BW, BY } from "@/lib/rpg/palette";
import { foliage, sprite } from "@/lib/rpg/screen";

/**
 * The keep at hero range: ruined left crown, collapsed curtain notch,
 * gutted right tower, and the ley-lit arch you will one day walk through.
 * (96x61)
 */
export const KEEP_NEAR = sprite(
  [
    "................................................................................................",
    "................................................................................................",
    "...WWW..WWW.....................................................................................",
    "...WKW..WKW.....................................................................................",
    "...WKW..WKW..WWW................................................................................",
    "...WKW..WKW..WKW..WW............................................................................",
    "..WWKWWWWKWWWWKWWWWWWW..........................................................................",
    "..WKKKKKKKKKKKKKKKKKKW.................WWW..WWW..WWW............................................",
    "..WKKKKKKKKKKKKKKKKKKW.................WKW..WKW..WKW.......................WWW..................",
    "..WKKKKKKKKKKKKKKKKKKW.................WKW..WKW..WKW..WW...................WKW..................",
    "..WKKKKKKKKKKKKKKKKKKW................WWKWWWWKWWWWKWWWWWWW.................WKW..................",
    "..WKKKKKKKKKKKKKKKKKKW................WKKKKKKKKKKKKKKKKKKW.................WKW..................",
    "..WKKKKKKKKKKKKKKKKKKW................WKWKKWKKWKKWKKWKKWKW.................WKWWW................",
    "..WKKKKKKKKKKKKKKKKKKW................WKKKKKKKKKKKKKKKKKKW................WWKWWWWW..............",
    "..WKKKKKKKKKKKKKKKKKKW................WKKKKKKKKKKKKKKKKKKW................WKKKKWWWWW............",
    "..WKKKKKWKKKKKKKKKKKKW................WKKKKKKKKLKKKKKKKKKW................WKKKKKKWWWWW..........",
    "..WKKKKKWKKKKKKKKKKKKW................WKKKKKKKKLKKKKKKKKKW................WKKKKKKKKWWWWW........",
    "..WKKKKKWKKKKKKKKKKKKW................WKKKKKKCCHCCKKKKKKKW................WKKKKKKKKKKWWWWW......",
    "..WKKKKKWKKKKKKKKKKKKW................WKKKKKKKKLKKKKKKKKKW................WKKKKKKKKKKKKWWWWW....",
    "..WKKKKKKKKKKKKKKKKKKW.WWW..WWW..WWW..WKKKKKKKKLKKKKKKKKKWWWW.............WKKKKKKKKKKKKKKWWW....",
    "..WKKKKKKKKKKKKKKKKKKW.WKW..WKW..WKW..WKKKKKKKKLKKKKKKKKKWWKW.............WKWWKKKKKKKKKKKKKWWW..",
    "..WKKKKKKKKKKKKKKKKKKW.WKW..WKW..WKW..WKKKKKKKKKKKKKKKKKKWWKW.............WKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWWWKWWWWKWWWWKWWWWKKKWWKKKKKKKKKKKKKWWKW.............WKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKKKWKKW.............WKKKKKKKKKKKKKKKKKKW..",
    "..WKKWWKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKWWKKKKKKKKKKKKKKKWKKW.............WKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKKKWKKW............WWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKKKWKKKWW.......WWWWWKKKKKW...WKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKWWKKWKKWWKKKKKKKKKKKKWKKKKKKKWWWWKKKWWKKWKKKKW......WWWWKWKKKKW.....WKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKKKKWLHHLWKKKKKKWKKKKW......WKKKKWKKKKW.....WKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKKKWLLHHLLWKKKKKWKKKKW.....WWKKKKWKKKKKW....WKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKKWCLLHHLLCWKKKKWKKKKWW....WKKKKKWKKKKKKW..WKKKKKKKKW..",
    "..WKKKKKKKKKKKWKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKW....WKWWKKWKKKKKKKWWKKKKKKKKKW..",
    "..WKKKKKKKKKKKWKKKKKKWKKKKKWKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKWWKKW....WKKKKKWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKWKKKKKKWKKKKKWKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKW...WWKKKKKWKKKKKKKKKKKKWWKKKKW..",
    "..WKKKWWKKKKKKWKKKKKKWKKKKKWKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKWW..WKKKKKKWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKWKKKKKKKKKKWKFKWCCLLHHLLCCWKFKWKKKKKKW..WKKKKKKWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKFFWCCLLHHLLCCWFFKWKKKKKKW.WWKKKKKKWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKYYWCCLLHHLLCCWYYKWKKKKKKWWWKKKKKKKWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKFFWCCLLHHLLCCWFFKWKKKKKKKWWKKKKKKKWKKKWKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKWWKKKKKKKKWKKKKKKKKKKKKKKKKWKYYWCCLLHHLLCCWYYKWKKKKKKKKKKKKKKKKWKKKWKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKFFWCCLLHHLLCCWFFKWKKKKKKKKKKKKKKKKWKKKWKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKWWKKKKKWKWWWCCLLHHLLCCWWWKWKKKKKKKKKKKKKKKKWKKKWKKKKKKWWKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKWWKKKKKKKKKWKKKWKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKGKKKW..",
    "..WKKKKKWKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKKWWKKKKKKKWKKKKKKKKKKKKKGVKKKW..",
    "..WKKKKKWKKKKKKKKKKKKWKKKKKKKKKKKKWWKKWKKKWCCLLHHLLCCWKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKGKKKW..",
    "..WKKKKKWKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKKKKKKKKKKKWKKKKKWWKKKKKKKKGKKW..",
    "..WKKKKKWKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKWWWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKGKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKWKKKKKKKKKWKKKKKKKKKKKKKKKGKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKGKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKWWKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWWWKWCCLLHHLLCCWKKKWKKKKKKKKKKKKWWKKWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKWWKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKWWKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKKKKKKKKKKKWKWWKKKKKKKKKKKKKKKW..",
    "..WKWWKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKKKW..",
    "..WKKKKKKKKKKKKKKKKKKWKKKKKKKKKKKKKKKKWKKKWCCLLHHLLCCWKKKWKKKKKWWWWKKKKKKKWKKKKKKKKKKKKKKKKKKWGV",
    "GVWKKKKKKKKKKKKKKKKKKWGKKKKKKKKKKKKKKKWKKKCCCLLHHLLCCCKKKWKKKKWKKKKWKKKKGKWKKKKKKKKKKKKKKKKKKW.G",
    "GGWKKKKKKKKKKKKKKKKKKWKGKKKKKKKKKKKKKKWKKCLCCLLHHLLCCLCKKWKKKKKKKKKKGKKKKGWKKKKKKKKKKKKKKKKKKWG.",
  ],
  { K: K, W: W, C: C, L: BC, H: BW, Y: Y, F: BY, G: G, V: BG },
);

/** The keep at middle distance — same silhouette family, gate as a slot. (46x26) */
export const KEEP_MID = sprite(
  [
    "WW...WW...WW......................WW...WW...WW",
    "WW...WW...WW......................WW...WW...WW",
    "WWWWWWWWWWWW......................WWWWWWWWWWWW",
    ".WKKKKKKKKW........................WKKKKKKKKW.",
    ".WKKKKKKKKW........................WKKKKKKKKW.",
    ".WKKKKKKKKW........................WKKKKKKKKW.",
    ".WKKKWKKKKW........................WKKKKWKKKW.",
    ".WKKKWKKKKW........................WKKKKWKKKW.",
    ".WKKKWKKKKW.....WW..WW..WW..WW.....WKKKKWKKKW.",
    ".WKKKKKKKKW.....WW..WW..WW..WW.....WKKKKKKKKW.",
    ".WKKKKKKKKW.....WWWWWWWWWWWWWW.....WKKKKKKKKW.",
    ".WKKKKKKKKW.....WKKKKKKKKKKKKW.....WKKKKKKKKW.",
    ".WKKKKKKKKW.....WKKKKKWWKKKKKW.....WKKKKKKKKW.",
    ".WKKKKKKKKW.WW..WKKKKKWWKKKKKW.WW..WKKKKKKKKW.",
    ".WKKKKKKKKW.WW..WKKKKKKKKKKKKW.WW..WKKKKKKKKW.",
    ".WKKKKKKKKWWWWWWWKKKKKKKKKKKKWWWWWWWKKKKKKKKW.",
    ".WKKKWKKKKWKKKKKWKKKKKKKKKKKKWKKKKKWKKKKWKKKW.",
    ".WKKKWKKKKWKKKKKWKKKKKWWKKKKKWKKKKKWKKKKWKKKW.",
    ".WKKKWKKKKWKKKKKWKKKKWccWKKKKWKKKKKWKKKKWKKKW.",
    ".WKKKKKKKKWKKKKKWKKKKWccWKKKKWKKKKKWKKKKKKKKW.",
    ".WKKKKKKKKWKKKKKWKKyKWccWKyKKWKKKKKWKKKKKKKKW.",
    ".WKKKKKKKKWKKKKKWKKKKWhhWKKKKWKKKKKWKKKKKKKKW.",
    ".WKKKKKKKKWKKKKKWKKKKWhhWKKKKWKKKKKWKKKKKKKKW.",
    ".WKKKKKKKKWKKKKKWKKKKWhhWKKKKWKKKKKWKKKKKKKKW.",
    ".WKKKKKKKKWKKKKKWKKKKWccWKKKKWKKKKKWKKKKKKKKW.",
    ".WWWWWWWWWWWWWWWWWWWWWccWWWWWWWWWWWWWWWWWWWWW.",
  ],
  { W: W, K: K, c: BC, h: BW, y: Y },
);

/** The keep on the horizon: a silhouette with one cyan spark of gate-light. (21x12) */
export const KEEP_FAR = sprite(
  [
    "WW.WW...........WW.WW",
    "WW.WW...........WW.WW",
    "WWWWW...........WWWWW",
    "WKKKW..WW.W.WW..WKKKW",
    "WKKKW..WWWWWWW..WKKKW",
    "WKKKW..WKKKKKW..WKKKW",
    "WKKKWWWWKKKKKWWWWKKKW",
    "WKKKWKKWKKKKKWKKWKKKW",
    "WKKKWKKWKKKKKWKKWKKKW",
    "WKKKWKKWKKcKKWKKWKKKW",
    "WKKKWKKWKKhKKWKKWKKKW",
    "WWWWWWWWWWcWWWWWWWWWW",
  ],
  { W: W, K: K, c: BC, h: BW },
);

/** Big leafless gnarled tree. (20x26) */
export const TREE_GNARLED_A = sprite(
  [
    ".b..................",
    "..g.................",
    "..g.................",
    "...g.............b..",
    "...g..g..b.......g..",
    "....gg...g......g...",
    "....g....g......g...",
    ".....g..g......g....",
    ".....g..g......g....",
    "......g.g.....g.....",
    ".......g......g.....",
    ".......gg....g.g....",
    "........gg..g...g...",
    ".........ggg....g...",
    "..........gg........",
    "..........gg.g......",
    "..........ggg.......",
    ".........gg.........",
    ".........gg.........",
    "..........gg........",
    "..........gg........",
    "..........gg........",
    ".........ggg........",
    "........ggggg.......",
    ".......gg..gg.......",
    "......g......gg.....",
  ],
  { g: W, b: BW },
);

/** Smaller bent tree — a distinct silhouette from its big sibling. (14x20) */
export const TREE_GNARLED_B = sprite(
  [
    "..........b...",
    "..........g...",
    ".........g....",
    ".........g...b",
    "..........g..g",
    "..........g..g",
    "..........g.g.",
    ".........ggg..",
    ".......gg...g.",
    "......gg.....b",
    "...g..gg......",
    "....ggg.......",
    ".....gg.......",
    ".....gg.......",
    "....gg........",
    "....gg........",
    "....gg........",
    "....gg........",
    "....gg........",
    "...gggg.......",
  ],
  { g: W, b: BW },
);

/** A bare spike of a dead pine. (10x22) */
export const TREE_DEAD_PINE = foliage(
  [
    ".....g....",
    "....g.....",
    "....g.....",
    "....gg....",
    "....g.g...",
    "...gg.....",
    "..g.g.....",
    "....g.....",
    "...gg.....",
    "....gg....",
    "....g.g...",
    "...gg.....",
    "..g.g.....",
    "....gg....",
    "....g.g...",
    "....g.....",
    "....g.....",
    "....gg....",
    "....g.g...",
    "...gg..g..",
    "..g.g.....",
    "...ggg....",
  ],
  { g: W },
);

/**
 * Rune-carved standing stone: a solid tapering slab, lit edge to the moon,
 * shadow bitten out of the lee, three carved cyan runes down the face with
 * a bright heart in the middle one. The old menhir was an outline around a
 * black interior — on black paper, a stone-shaped hole.
 * (9x16)
 */
export const MENHIR = sprite(
  [
    "...WW....",
    "...Www...",
    "..Wwww...",
    "..Wccwk..",
    "..Wcwww..",
    "..Wccwk..",
    ".wwwwwk..",
    ".Wwccww..",
    ".Wwwiwwk.",
    ".Wwccwww.",
    ".Wwwwwwk.",
    ".wwcwwww.",
    "Wwwwcwwk.",
    "Wwwcwwkk.",
    "Wwwwwwww.",
    ".ggkkkg..",
  ],
  { w: W, W: BW, k: K, c: C, i: BC, g: G },
);

/**
 * The same slab where the ley runs through it: a live cyan seam wandering
 * down the face. Serves the waymark stones standing within sight of the
 * line, so the ley reads as a thing the stones answer to.
 * (9x16)
 */
export const MENHIR_LEY = sprite(
  [
    "...Ww....",
    "...Wcw...",
    "..Wwiw...",
    "..Wcwww..",
    "..Wiwwk..",
    "..Wwcww..",
    ".Wwwiwk..",
    ".wwwcww..",
    ".Wwcwwww.",
    ".Wwiwwwk.",
    ".Wwwcwww.",
    ".wwwiwwk.",
    "Wwwwcwww.",
    "Wwwcwwkk.",
    "Wwwiwwww.",
    ".g.ii.g..",
  ],
  { w: W, W: BW, k: K, c: C, i: BC, g: G },
);

/**
 * Squat tilted boulder-stone as solid mass: lit rim, shadow clump eaten out
 * of the lee side, one crack from the crown, turf against the base.
 * (12x10)
 */
export const STONE_LEANING = sprite(
  [
    "....WWw.....",
    "...Wwwkww...",
    "...Wwwwkww..",
    "..Wwwwwkwww.",
    "..Wwwwwwkkw.",
    ".Wwwwwwwwkw.",
    ".Wwwwwwkkkw.",
    ".Wwwwwwkkww.",
    "..Wwwwwwww..",
    "..gg.kk.g...",
  ],
  { w: W, W: BW, k: K, g: G },
);
