// Living-woodland flora and the henge stones. String bitmaps, one char per
// pixel, '.' transparent. These are the lush counterpart to the dead moor
// trees in art.ts — the two woods must never be mistaken for each other.

import { C, G, K, W, Y, BC, BG, BW, BY } from "@/lib/rpg/palette";
import { sprite } from "@/lib/rpg/screen";

/**
 * A great spreading oak of the living greenwood — broad, lobed,
 * heavy with leaf. The opposite of the moor's dead limbs.
 * (34x41)
 */
export const TREE_OAK = sprite(
  [
    ".......hghgh.gg....hghgh..g.g.....",
    "........hgggggk...hgggkgggkgkg....",
    "......ghgggggggg..ghgggggggkgg....",
    "......khkgggkghkk..gkgggkgkgkg....",
    "......gggggggggkghghgggkgggkgg....",
    "......kgkgkgkggghgkgkgkgkgkggg....",
    "......gggkgkgkggggggkggggkgg......",
    ".....gkgkgkgggggkgkgkgkgkgkg..h...",
    ".....ggggggkggggggggggghgg..ghgh..",
    ".....gkgkgkgkgkgkgkgkgkkkg.ghghghg",
    "ghghgkgkkhghgkgggkgkgkgkg....hgggg",
    ".ghhkkhhkgggkgkgkgkggkkhgg.gkgggkg",
    "ggggghgggggggggkgkgkgkggggghgggggg",
    "hgkgggggggkgkgkkkgkghgkgkgkgggkgkg",
    ".ggggggggggggggkkk.hgggggggggkggg.",
    ".gkgkgkgkgkgkgkgkg.hkgkgkgkgkgkgkg",
    ".ggkgggggggkgggkgkgggggggggkgggkgg",
    "ggkgkgkgkgkgkgkkkkkgggkgkgkgkgkgkg",
    "gkgggkgggkgkgggkgkgggggggggkgkgkg.",
    "kgkhhgkhkkkgk.ghkghkkgkghgggkkkg.g",
    "g.gkgggggkgkg.ghgggggggkghghggkkgg",
    "..kkggkgkgkkggkgkgkgkkkghgggggkgkg",
    ".hgggggggkgg.ggggggggkkkgggggkgggg",
    "...gkgkgkgkgkgkgkgkgkgkgkgkgkgkgk.",
    "...ggggkgkgk..gggggkgggkgggkggggg.",
    "..kgkgkgggkg.gkgkgkgkgkgkgkgkgg...",
    "..gkgkggkggggkgggkgkkggggkgkgkg...",
    "..kgkgg.kgkgkgkgkkkgkkkgkgkgkg....",
    ".....ggggggkggggggkggggkggg.......",
    ".........gkgg.ggkkkgkgkgg.k.......",
    ".........gggg.ggkkkg..gg..........",
    "..............ggkkkg..............",
    "..............ggkkkg..............",
    "..............ggkkkg..............",
    "..............ggkkkg..............",
    "..............ggkkkg..............",
    ".............ggkkkkkg.............",
    ".............ggkkkkkg.............",
    "............ggkkkkkkkg............",
    "............ggkkkkkkkg............",
    "...........gggggggggggg...........",
  ],
  { g: G, h: BG, k: K },
);

/**
 * A birch: pale marked bole, airy crown you can see sky through.
 * (20x38)
 */
export const TREE_BIRCH = sprite(
  [
    ".......hg.gg........",
    "........ggkg........",
    "........gkgkg.......",
    ".ghg.k.gkkkkkgh.....",
    "...ggggkgkgkgggg.gg.",
    "..ggkgk.kgwgggkkggk.",
    "..g.gkg.ggw..ggkg...",
    "k...kgg.kgg.gkhgg...",
    "ghggg..ggggggkgggh..",
    ".gkgkgkggwgg.g.gkgg.",
    "gggkgkgg.kk.....gkgg",
    "k.ggkgkgkkw.kgggkgk.",
    "..ghgggg.ww.gggg....",
    "....ggkggww.ggg.....",
    "...ggkg.wwg.gkggg.g.",
    "hg.gkgg.kkkgkkgkkg..",
    "..gkg..hghkkgg.ggggg",
    "hgkgkg..ggkg...gkgg.",
    ".gggg.gggkgggg.ggg..",
    "kgg..g..wgg.hgh.....",
    "....gh.ggwkgggggg...",
    "....hgkgwgw..gkg....",
    "....gkgggww.gggg....",
    "...gggk.kkw...g.k...",
    "...g...gwww.g.......",
    "........wwgg........",
    "........wgg.g.......",
    "........kgw.........",
    "........www.........",
    "........www.........",
    "........kkw.........",
    "........kww.........",
    "........www.........",
    "........www.........",
    "........wkkw........",
    "........wwww........",
    ".......wwwkk........",
    ".......wwwww........",
  ],
  { g: G, h: BG, k: K, w: W },
);

/**
 * A living conifer, dense and tiered.
 * (21x42)
 */
export const TREE_PINE_LIVE = sprite(
  [
    "..........k..........",
    ".........kgg.........",
    ".........gkg.........",
    ".........kgk.........",
    "........ggkgg........",
    "........gkgkg........",
    "........ggkgg........",
    ".......hgkgkgg.......",
    "........ggkggg.......",
    ".......ggkgkgk.......",
    "......ggkgggkgg......",
    ".......kgkgkkk.......",
    "......ggggkgggg......",
    ".....hghgkgkgkgg.....",
    "......ggkgkgkg.......",
    "......gkgkgkggg......",
    "......ggggkgggg......",
    "......gkgkgkgkg......",
    ".....gggggkggggg.....",
    "....gkkkgkgkkkgkg....",
    "....ggggggkgkgggg....",
    ".....kgkgkgkgkggg....",
    "...g.gggkgkgkggg.....",
    "....gkgkkkgkgkgkg....",
    "...gggkgggggggkggg...",
    "...kgkkkgkgkgkkkgk...",
    "...ghgggkgggkggggg...",
    "..gkgkgkgkgkgkgkggg..",
    ".ghg.gggggkgkgggggg..",
    "...hgkgkgkgkgkggg.g..",
    "...gggggkgggkgkgkg...",
    "...kgkgkgkgkkkgkgk...",
    "..ggggkgggkgkgkgggg..",
    ".kgkgkkkgkkkgkkkgkgk.",
    ".ggghgkgkgkgkgggkggg.",
    ".hgkghggkggkgkgkgggg.",
    "gghg.ghggggggg.gggg.g",
    "...h....ggkg.g....g..",
    ".........gkg.........",
    ".........gkg.........",
    ".........gkg.........",
    ".........ggg.........",
  ],
  { g: G, h: BG, k: K },
);

/**
 * A low leafy shrub.
 * (16x10)
 */
export const BUSH = sprite(
  [
    "....gh.....h....",
    ".......hk..h....",
    ".hghggggg.gggg..",
    "..gghgkgkgggkg..",
    "ghggggggggggghg.",
    ".gggkgkgkgkgggkg",
    ".gggggggggggggg.",
    "g.ggkgkgkgk.ggkg",
    "g..kgggkggg.g.g.",
    "......g..g......",
  ],
  { g: G, h: BG, k: K },
);

/** A mossed fallen trunk, drawn as bright green line-work over black. */
export const FALLEN_LOG = sprite(
  [
    "............................",
    "....gggggggggggggggg........",
    "..gggkkkkkkkkkkkkkkgg.......",
    ".ggkkwkkkkkkkkkkkwkkgg......",
    "ggkkkwwwkkkkkkkwwwkkkgg.....",
    "gkkkkkkwkkkkkkkkkwkkkkg.....",
    "ggkkkkkkkkkkkkkkkkkkkgg.....",
    ".gggggggggggggggggggg......",
    "...h...h.....h...h..........",
    "..hhh.hh.....hh.hhh.........",
    "............................",
  ],
  { g: G, h: BG, k: K, w: W },
);

/** Yellow caps and leaf-litter in a sparse woodland clump. */
export const MUSHROOM_PATCH = sprite(
  [
    ".....................",
    "...y...........y.....",
    "..yyy....w....yyy....",
    ".yYyyy..www..yyyYy...",
    "...y.....w.....y.....",
    "...w.....w.....w.....",
    "g..w..g..w..g..w..g..",
    ".gg..ggg...ggg..ggg..",
    "g..g....g.g...g....g.",
    ".....................",
  ],
  { g: G, w: W, y: Y, Y: BY },
);

/**
 * Two sarsens carrying a lintel — the henge, and far taller than
 * anyone who walks up to it.
 * (46x54)
 */
export const TRILITHON = sprite(
  [
    "..............................................",
    ".......wwwwwwwwwwwwwwwww......wwwwwwwwwwww....",
    "..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.",
    "wwwwwwwwkwkwkwkwkwkwkwkwwwwwwwkwkwkwkwkwkwwwww",
    "wwwkwkwkkwkkkkkkkkkkkkkkwkwwwkkkkwkkkwkkkkwkww",
    "wwkwkkkkkkkkkkkkkkkkwkkkkkkkkkkkkkkkwkkkkkkkkw",
    "wkwkkkkkkkkwkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkw",
    "wwkkkkkkkkkkkkkkkkkkkkkkkkkkkwkkkkwkwkkkkkkkkw",
    "wkwkkkkkkwkkkkkwkkkkkkkkkkkkwkkkkkkkkkkkkkkkkw",
    "wwkkkkkkkkkkkkwkkkkkkkkkkkwkkkkkkkkkkkwkkkkkkw",
    "wwwkkkkkkkkkkkkkwkkkkkkkwkkkkkkkkkkkkkkkkkkwww",
    "..wwkkkkkkkkkkkkkkkkkwwwwwwwwkkkkkkkkkkkkkw...",
    "....wkwkkkwkkkkkkwwww........wwkwwkkkkkkkw....",
    "....wwkkkkkkkkkkw............wkkkkkkkkkkkw....",
    "....wkkkkkkkkkkkw............wwkkkkkwkkkkw....",
    "....wwkwkkwkkkkkw............wkkkkkkkkkkkw....",
    "....wkwkkkkkwkwkw............wwkkkkkkkkkkw....",
    "....wwkkkkkkkkkw.............wkkkkkkkkkkkw....",
    "....wkwkkkkkkkkw.............wwkkkkkkkkkkw....",
    "....wwkkkkkkkkkw.............wkkkkkkwkkkww....",
    "....wkwkkwkkkkkkw............wwkkkwkkkkkkkw...",
    "....wwkkkkkkkkkkkw...........wkkkwkkwwkkkkw...",
    "...wwkkkkkkkkkkwkw...........wwkkkkkwkkkkkw...",
    "...wkkkkkkkkkkwkww...........wkkkkkkwkkkkkw...",
    "...wwkkkkkwkkkkkkw..........wkwkkkkkwkkkkww...",
    "...wkwkkkkkkkkkkkw..........wwwkkkkkkkkkkkw...",
    "....wkwkkkwkkkkkkw..........wkwkkkkkwkkkkkw...",
    "....wwwwkwwkkkkkkw..........wwkkkkkkwkkkkkw...",
    "....wwwkkwwkkkkwkw..........wkwkwkkkkkkkkw....",
    "....wwkkkkwkkwkkkw..........wwkkkkkkkkkkkw....",
    "...wwkkkkkkkkkkkkw..........wkwkkkkkwkkkkw....",
    "...wkkkkkkkkkkkkkw..........wwwwkkkkwkkkkw....",
    "...wwkkkkkkkwkkkkw...........wwkkkkwkkkkwkw...",
    "...wkkkkwkwkkkkkkw...........wkkkkkkkkkkkkw...",
    "...wwkkkkkkkkkkkkw...........wwkkkkkkkkkkkw...",
    "...wkkkkkwwkkkkkkw..........wwkwkkkkwkkkkkkw..",
    "...wwkkkkkwkkkkkkw..........wkwkwkkkkkkkkkkw..",
    "..wwkkkkkkwkkkkkkw..........wwkkkkkkwkkkkkkw..",
    "..wkwkkkkwwkkkkkkw..........wkwkwwkkwkkkkkkw..",
    "..wwkkkkkkwkkkkkw...........wwkwkkkkwkwkkkkw..",
    "..wkwkwkkkwkkkkkw...........wkwkkkkkwkkwwwww..",
    "...wkkkkkkkkkkkkw...........wwkkkkkkwkkwkkkw..",
    "...wwkkkkkwkkkkww............wwkkkkkwkkkkkkw..",
    "...wkkkkkkwkkkkkkw...........wkkkkkkkkkkkkkw..",
    "..wwwkwkkkkkkkkkkw...........wwkkkkkwkkwkkkw..",
    "..wwwkkkwwkwkkkkw............gkkkkkkwkwkkkw...",
    "..wkgkkkkkkkkkkkw...........gkwkkkkkkkkkkkw...",
    "..wgkwkkkkwkkkkkw...........wgkkkkkkkkkkkkw...",
    "..gkgkkkkkkkkkwkw...........gkgkkkkkkkkkkkkw..",
    "..wgkgkkkkkkkkkkkg..........wgkkkkkkwkkkkkkg..",
    "..gkgkkkkkkkkkkkgw..........gkgwkkkkkkkkkwgkg.",
    "..wgkgkkkkkkkkkgkg..........wgkkkkkkkkkkkgkgw.",
    "..gkwkkkkkkkkkkkgw..........wkwkkkkkkkkkkkgwg.",
    ".wwgwwwwwwwwwwwgwg..........wwwwwwwwwwwwwwwgww",
  ],
  { w: W, k: K, g: G },
);

/**
 * A single towering standing stone, weathered and leaning.
 * (18x46)
 */
export const SARSEN_TALL = sprite(
  [
    "...........www....",
    "..........wwkkw...",
    "........wwwkkkkw..",
    "........wwkkkkkw..",
    ".......wwkkkkkwww.",
    ".......wkkkkkkkww.",
    ".......wwkkkkkkkw.",
    ".......wkkkkkkwww.",
    "......wkwwkkkw....",
    "......wwkwkkkw....",
    "......wkwkwkww....",
    "......wwkwkkkkww..",
    "......wwwwwkkkkw..",
    "......wwkwkkwkkw..",
    ".....wwkkwkkwwww..",
    ".....wkkkkkkkkkw..",
    ".....wwkkwkkkkkkw.",
    "......wwkkkkwwkkw.",
    "......wkwwkwwkkkw.",
    "......wwkwkkwkkww.",
    ".....wwkkkkkwkwww.",
    ".....wkkkwkkww....",
    ".....wwkkkkkkw....",
    "....wwkkkwkww.....",
    "....wkwkkwkwwwww..",
    "....wwkkkwwkwkkw..",
    "....wkwkwwkkkkw...",
    "....wwkkkwkkwkw...",
    "...wwwkkkwkkwkkw..",
    "....wwkwwkkkwkkw..",
    "....wwwkkwkkwkkw..",
    "...wkwwwwwkkwkkw..",
    "...wwkkkkwkkkkkkw.",
    "...wkkkkkkkkkkkww.",
    "...wwkkkkkkkwkw...",
    "...wkkkkkwkkkww...",
    "...wwkkkkkkkwkw...",
    "...wkkkkkkkkkkkww.",
    "..gkwkkwkkkkkkkw..",
    "..wgkkkkkkkkwkkw..",
    "..gkgkkkkkkkwwkw..",
    "..wgkkkkkkkkwkkw..",
    "..gkgkkwkkwkkkkkw.",
    ".wkgkkkkkwkkkgkkw.",
    ".wgkgkwkkkkkkkkkw.",
    ".wwgwwwwwwwwwgwww.",
  ],
  { w: W, k: K, g: G },
);

/**
 * A great stone lying on its side, half sunk, grown over.
 * (40x14)
 */
export const SARSEN_FALLEN = sprite(
  [
    "........................................",
    "........................................",
    "............wwwwwww.....................",
    ".........wwwwwwwwwwwww..................",
    "......wwwwwwwkwkwkwwwwwwwww.............",
    "....wwwwwkkkkkkkkkkkkkwwwwwww...........",
    "...wwwwkwkkkkkkkkkkkkkwkwkwwwwww........",
    "...wkkkkkkkkkkkkkkkkkkkkkkkkkwwww.......",
    "..wkkkkkkkkkwwwkwkwkkwwkkwkkkkwkww......",
    "..wkkwkkkwkkkkkkkkkkkkkkwkkkkkkkkww.....",
    "..wkkwkwkkkkkkkkkkkkkwkkkkkkkwwkkwww....",
    ".wkkkkkkkkkkkkkkkkwkkkkkkkkkkkwkkkkww...",
    ".wkgkkkkgkkkkkwkgkkkkkkkkgkkkkkgkwkkw...",
    ".wwgkgwwgkkkwkgwgkkgwkwwkgkgwkwgkwgkwk..",
  ],
  { w: W, k: K, g: G },
);

/**
 * A benign woodland spirit: a drifting light, no face, no malice.
 * (14x18)
 */
export const SPIRIT_WISP = sprite(
  [
    ".......c......",
    "......ccc.....",
    ".....cci......",
    "......cicc....",
    "....cciicc....",
    "...cciiiic....",
    "...ccihhic....",
    "....cihiicc...",
    "....ciiiicc...",
    "....cciiic....",
    ".....ciicc....",
    ".....ccc......",
    "......i.c.....",
    ".......c......",
    ".....i........",
    "........c.....",
    "......c.......",
    ".........c....",
  ],
  { c: C, i: BC, h: BW },
);
