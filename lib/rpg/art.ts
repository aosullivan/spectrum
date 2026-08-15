// Production art for the Leyline world, authored as string bitmaps
// (one char per pixel, '.' transparent) — the agreed authoring format.
// Drawn against the approved "V2 Leyline" concept; see docs/rpg-design.md.

import { C, G, K, W, Y, BC, BG, BW, BY } from "@/lib/rpg/palette";
import { sprite } from "@/lib/rpg/screen";

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

// The wood itself, per the approved concept: bare bone-white trees against
// the black sky. Drawn as MASS — trunks four and five pixels wide, limbs two
// — because bone-wide line art dies into loose dots by fourteen pixels (see
// the skeleton measurement). Lit edge to the moon (west), body plain white,
// knots bitten out in black, a green tuft or two holding each to the ground.

/**
 * A great bone elm: candelabra limbs rising from a single trunk, each
 * forking into fine twigs at the crown. The tallest silhouette in the wood.
 * (27x40)
 */
export const TREE_GNARLED_A = sprite(
  [
    ".....b.........b...........",
    ".....bw........bw.b....b...",
    ".....ww........www....bw...",
    "...b.bw........ww.....ww...",
    "....www........bw....bw....",
    ".....ww........ww....ww.b..",
    "......bw.......ww...bw.w...",
    "......ww......bw....ww.....",
    "......ww......ww...bw......",
    ".......bw.....ww...ww......",
    ".......ww.....ww..ww.......",
    ".......ww....bw...ww.......",
    "........bw...ww..ww.bw.....",
    "........ww...ww..ww...w....",
    "........ww...ww.bw.........",
    ".........bw..ww.ww.........",
    ".........ww..ww.ww.........",
    "..........bw.wwww..........",
    "..........ww.wwwk..........",
    "..........wwbwwwk..........",
    "...........bwwwwk..........",
    "...........bwwwwk..........",
    "...........bwwwwk..........",
    "...........bwwkwk..........",
    "...........bwwwk...........",
    "...........bwwwk...........",
    "...........bkwwk...........",
    "...........bwwwk...........",
    "...........bwwwk...........",
    "...........bwwwk...........",
    "...........bwwwk...........",
    "...........bwwwk...........",
    "...........bwwwwk..........",
    "...........bwwwwk..........",
    "..........bwwwwwk..........",
    "..........bwwwwwkk.........",
    ".........bwwwwwwwkk........",
    "........bww.wwk..kw........",
    "......g.bw..gww..gw.g......",
    ".........g..g.g...g........",
  ],
  { w: W, b: BW, k: K, g: G },
);

/**
 * A broad bone oak: short fat bole, limbs thrown wide and elbowed, one
 * snapped stub ending in splinters. Reads as age where the elm reads as
 * height. (31x30)
 */
export const TREE_GNARLED_C = sprite(
  [
    "..........b.........b..........",
    "...b......w.........w....b.....",
    "...w......wb........wb...w.....",
    "...wb.....bw........ww...wb....",
    "....wb....ww........ww..bw.....",
    "....bw....ww.......bw...ww.....",
    ".....wwb..bw.......ww...ww.....",
    "......wwb.ww......bw...bww.....",
    ".......wwbww......ww...ww......",
    "........wwww.....bw...ww.......",
    "........bwww.....ww..bww.......",
    ".........www....bw...ww.kk.....",
    ".........wwk....ww..bww........",
    ".........bww....ww..ww.........",
    "..........ww...bw..bww.........",
    "..........ww...ww..ww..........",
    "..........bww..wwwww...........",
    "...........wwwwwwww............",
    "..........bwwwwwwk.............",
    "..........bwwwwwwk.............",
    "..........bwwkwwwk.............",
    "..........bwwwwwwk.............",
    "..........bwwwwwwk.............",
    "..........bwwwwwwk.............",
    "..........bwwwwwwk.............",
    ".........bwwwwwwwkk............",
    ".........bwwwwwwwkk............",
    "........bwww.wwwwkkk...........",
    "......g.bww..gww.kk.g..........",
    ".........g..g..g....g..........",
  ],
  { w: W, b: BW, k: K, g: G },
);

/** A young bone tree, wind-bent, one clean fork. (13x18) */
export const TREE_GNARLED_B = sprite(
  [
    ".....b.......",
    ".....w....b..",
    ".....wb...w..",
    "..b..bw..w...",
    "..w...w.bw...",
    "...w..wbw....",
    "...bw.ww.....",
    "....wwww.....",
    ".....ww......",
    ".....ww......",
    ".....wk......",
    ".....ww......",
    "....bww......",
    "....bww......",
    "....bwk......",
    "...bwwwk.....",
    "..g.www.g....",
    "....g.g......",
  ],
  { w: W, b: BW, k: K, g: G },
);

/** A dead pine spike: drooped stub whorls on a solid mast. (11x24) */
export const TREE_DEAD_PINE = sprite(
  [
    ".....b.....",
    ".....w.....",
    "....bw.....",
    "....ww.....",
    "...b.w.....",
    "....www....",
    "....ww.b...",
    "...bww.w...",
    "..b.www....",
    "...wwww....",
    "....ww.....",
    "....ww.b...",
    "....ww..b..",
    "...bwww.w..",
    "..b.www....",
    "...wwww....",
    "....wk.....",
    "....ww.....",
    "....wk.....",
    "....ww.....",
    "...bwwk....",
    "...bwwk....",
    "..gwwwwg...",
    "....g.g....",
  ],
  { w: W, b: BW, k: K, g: G },
);

/**
 * The far wood: a hand-drawn glyph for trees at range, so the shrink never
 * has to invent one. Serves as the base sprite under an lod swap — the big
 * art only appears once the projection can afford it. (8x11)
 */
export const TREE_BONE_FAR = sprite(
  [
    "b....b..",
    "w....w..",
    "wb..bw..",
    ".w..w...",
    ".wb.w.b.",
    "..www.w.",
    "..wwww..",
    "...ww...",
    "...wk...",
    "...ww...",
    "..bwwk..",
  ],
  { w: W, b: BW, k: K },
);

// The stones, per the concept: hulking pale monoliths under caps of moss —
// the green laid ON the stone the way the wood's green is laid on the ground.
// Bodies are solid mass with the moon on the west edge and shadow bitten out
// of the lee; the moss cap is what says these have stood since before names.

/**
 * Rune-carved standing stone: a fat weathered slab under a moss cap, carved
 * cyan runes down the face. The old menhir was a sliver — at play scale it
 * read as a fence post, not a thing raised by forgotten hands.
 * (14x22)
 */
export const MENHIR = sprite(
  [
    "....hgg.......",
    "...hgggg......",
    "..hggggg.g....",
    "..bwwgggg.....",
    "..bwwwwgk.....",
    ".bwwwwwwk.....",
    ".bwwcwwwk.....",
    ".bwwwwwwwk....",
    ".bwwwwkwwk....",
    "bwwwcwwwwk....",
    "bwwwwwwwwk....",
    "bwwwwwwkwwk...",
    "bwwwcwwwwwk...",
    "bwwwwwwwwwk...",
    "bwwwwwwwwwk...",
    "bwwwwkwwwwk...",
    "bwwwwwwwwwk...",
    ".bwwwwwwwwk...",
    ".bwwwwwwwwwk..",
    ".bwwwwwwwwwk..",
    "gwwwwwwwwwwkg.",
    ".g.gkkkkkg.g..",
  ],
  { w: W, b: BW, k: K, c: C, g: G, h: BG },
);

/**
 * The same slab where the ley runs through it: a live cyan seam wandering
 * down the face and grounding at the foot. Serves the waymark stones within
 * sight of the line, so the ley reads as a thing the stones answer to.
 * (14x22)
 */
export const MENHIR_LEY = sprite(
  [
    "....hgg.......",
    "...hgggg......",
    "..hggggg.g....",
    "..bwwgigg.....",
    "..bwwwcgk.....",
    ".bwwwwcwk.....",
    ".bwwwiwwk.....",
    ".bwwwcwwwk....",
    ".bwwwwcwwk....",
    "bwwwwwiwwk....",
    "bwwwwwcwwk....",
    "bwwwwwciwwk...",
    "bwwwwwwciwk...",
    "bwwwwwwcwwk...",
    "bwwwwwwiwwk...",
    "bwwwwwcwwwk...",
    "bwwwwwiwwwk...",
    ".bwwwwcwwwk...",
    ".bwwwwciwwwk..",
    ".bwwwwwcwwwk..",
    "gwwwwwiwwwwkg.",
    ".g.gkiikkg.g..",
  ],
  { w: W, b: BW, k: K, c: C, i: BC, g: G, h: BG },
);

/**
 * A tilted boulder-stone, moss riding its upper flank the way it does on
 * the reference stones: green on the weather side, bare pale rock below.
 * (17x12)
 */
export const STONE_LEANING = sprite(
  [
    "......hgg........",
    ".....hggggb......",
    "....hgggwwwb.....",
    "...bwwgwwwwwk....",
    "...bwwwwwwwwk....",
    "..bwwwwwkwwwwk...",
    "..bwwwwwwwwwkk...",
    ".bwwwwkwwwwwkk...",
    ".bwwwwwwwwwkkk...",
    "bwwwwwwwwwkkk....",
    "bwwwwwwwwwwkk....",
    ".ggwkkkkkgg......",
  ],
  { w: W, b: BW, k: K, g: G, h: BG },
);

/**
 * Two mossy field boulders sharing a footing — the low rounded stones the
 * reference scatters at the wood's feet. (19x9)
 */
export const BOULDER_MOSSY = sprite(
  [
    "....hg.......hg....",
    "..hggggb...hgggg...",
    ".bwgggwwk.bwgggwk..",
    ".bwwwwwwk.bwwwwwk..",
    "bwwwwwwwwkbwwwwwwk.",
    "bwwwwkwwwkbwwkwwwk.",
    "bwwwwwwwkkbwwwwwkk.",
    ".bwwwwwkk..bwwwkk..",
    "..g.kk.g....kk.g...",
  ],
  { w: W, b: BW, k: K, g: G, h: BG },
);
