// Living-woodland flora and the henge stones. String bitmaps, one char per
// pixel, '.' transparent. These are the lush counterpart to the dead moor
// trees in art.ts — the two woods must never be mistaken for each other.

import { C, G, K, W, Y, BC, BG, BW, BY } from "@/lib/rpg/palette";
import { foliage, sprite } from "@/lib/rpg/screen";

/**
 * A great spreading oak of the living greenwood — broad, lobed,
 * heavy with leaf. The opposite of the moor's dead limbs.
 *
 * The crown is solid mass with holes punched through it, not a green-black
 * dither. Dither is the wrong tool for a thing whose drawn size varies as
 * much as a tree's: far off, a checkerboard crown samples down into gritty
 * speckle, and close up — where the sprite is magnified several times — it
 * blows up into eight-pixel chequers and the greenwood turns into tiling.
 * Solid lobes with a bright sun side hold their shape at every distance.
 * (34x42)
 */
export const TREE_OAK = foliage(
  [
    "..................................",
    "..............gghh.gg.............",
    "..........g..ghhhg.hhhhhg.........",
    "........g.hh.hhhggghhhghhhg.......",
    ".......ghhgg.hhhhhhhhhgggggg......",
    ".......hhghhhgggghgggghhgggg......",
    "........ghhgggggghgggggghgggg.....",
    ".....g.hhhhgggkgghgggggghhhhhg....",
    "...ghhhhhghhhkkkgggggghhhggghhhg..",
    "..ghhgghggggggkggggggkhgggggggggg.",
    ".....gghggggggggggggkkkgggggggggg.",
    "..h.ggghgggggggggggghkggggggkggg..",
    ".ghgggghgggggggggggghggggggkkkgggg",
    "..hggggggkkkgggggggghgggggggkggg..",
    "..ggggggkkkkkggggggggggggggggggg..",
    "..gggggggkkkggggggggggggkkkgggggg.",
    "...gggggggggggggggggggggkkkggggggg",
    ".ggggggggggggggggggkggggkkkggggggg",
    ".gggggggggggggggggkkkggggggggggggg",
    "...gggggkggggggggggkggggggggggggg.",
    ".....ggkkkgggggggggggggggggggggg..",
    "....ggggkgggggggggggggggggggggg...",
    "......gggggggkgggggggkgggggg......",
    "........gggggkgggggggkgggggg......",
    "........gg.kggkggkkgk.gkggg.......",
    "...........gk.kggggkk.kg..........",
    ".............kkggggkkk............",
    "..............kgkggk.k............",
    "..............kggggkk.............",
    "...............ggggk..............",
    "...............gkggk..............",
    "..............ggggggk.............",
    "..............ggggggk.............",
    "..............gkggggk.............",
    "..............ggggggk.............",
    "..............ggggggk.............",
    "..............gkggggk.............",
    ".............ggggggggk............",
    ".............ggggggggk............",
    ".............gkggggggk............",
    "............ggggggggggg...........",
    "...........ggggggggggggg..........",
  ],
  { g: G, h: BG, k: K },
);

/**
 * A birch: pale marked bole, airy crown you can see sky through. The
 * crown is built from separate clumps with real gaps between them rather
 * than a dithered mass, so "airy" survives being shrunk to ten pixels.
 * (20x38)
 */
export const TREE_BIRCH = foliage(
  [
    "....................",
    "..........g.........",
    "........hhhhh.......",
    ".......hhgggh.......",
    "......ghggggg.g.....",
    ".......ggggggg......",
    "...gh.hgg.g.gg.h....",
    "..ghhghh....gh.gh.g.",
    "...gggggg.g.ghggg.g.",
    "...ggggghhhhhgggg.g.",
    "....ggghgggghhg.gg..",
    ".......hgggggg......",
    "....g..gggggggg..g..",
    ".g.ggg.g.ggggg..gggg",
    ".g.gg.....g....ggggg",
    "..gggg..ggg....ggggg",
    "..g...g..ggg.....g..",
    ".....gg...gggg......",
    "......ggg...........",
    "........gg.gg.ggg...",
    "....gggggwwwgggg....",
    "....gggggwwwggggg...",
    "....g.gggwwwg.g.....",
    "........gwwwg.......",
    ".........kwk........",
    ".........www........",
    ".........www........",
    ".........kww........",
    ".........kwk........",
    ".........www........",
    ".........www........",
    ".........kww........",
    ".........www........",
    ".........www........",
    ".........kwk........",
    ".........kww........",
    ".........wwww.......",
    "........wwwww.......",
  ],
  { g: G, h: BG, k: K, w: W },
);

/**
 * A living conifer: boughs hanging one clear of the next, each with its
 * own shadow beneath and needles reaching past the skirt.
 * (21x42)
 */
export const TREE_PINE_LIVE = foliage(
  [
    ".....................",
    "..........h..........",
    "..........h..........",
    "..........h..........",
    "........hhgkh........",
    "........hggkg........",
    "........hggkk........",
    ".........hkk.........",
    "......hhhggghhh......",
    ".......hgggggk.......",
    ".......hgggggg.......",
    "........hgggg........",
    "..........h.h........",
    ".....hhhhhghghhh.....",
    "......hgggggggg......",
    "......kgggggggg......",
    ".......hgggggg.......",
    "....hhhggggggghhh....",
    ".....hgggggggggg.....",
    ".....kgggggggggg.....",
    "......hgggggggg......",
    "...hhhggggggggghhh...",
    "....hgggggggggggg....",
    ".....hgggggggggg.....",
    ".....kgggggggggg.....",
    "......hgggggggg......",
    "..hhhhggggggggghhhh..",
    "...hgggggggggggggg...",
    "...hgggggggggggggg...",
    "....hgggggggggggg....",
    ".khhggggggggggggghhh.",
    "..kgggggggggggggggg..",
    "..hgggggggggggggggg..",
    "...hgggggggggggggg...",
    "hhhggggggggggggggghhh",
    "hgggggggggggggggggggg",
    ".hgggggggggggggggggg.",
    "..hgggggggggggggggg..",
    "...hgggggkkkgggggg...",
    "....hggggkkkggggg....",
    ".....hgggkkkkggg.....",
    "......hggggggk.......",
  ],
  { g: G, h: BG, k: K },
);

/**
 * A low leafy shrub: two overlapping masses with a lit top edge.
 * (18x11)
 */
export const BUSH = foliage(
  [
    "..................",
    "..................",
    ".......hhhh.......",
    "...h.hhggggh.h....",
    "..hghggggggg..hh..",
    ".ggggggggggghggg..",
    "...ggggggggkggggg.",
    "..ggggkgggggggggg.",
    "..ggggggkggggkg...",
    "...ggg.g....ggg...",
    "..................",
  ],
  { g: G, h: BG, k: K },
);

/**
 * Deadfall. The old log was a green slab with two hair branches — mass with
 * nothing carved into it reads as a lozenge at every distance. Each of these
 * three leads with a drawn feature that survives the shrink: a root plate, a
 * ringed cut face, a splinter burst. They rotate by chunk hash so the wood
 * gets variety instead of one repeated log; see FALLEN_LOGS.
 */

/**
 * An oak deadfall: torn root plate at the butt, heartwood burst in its
 * middle, a knot swelling the top line, one snapped limb, splintered tip.
 * The wood is silvered — a green body camouflages into the greenwood's
 * green-and-black ground mottle; pale dead wood separates the way the
 * sarsens do, and the moss along its back keeps it of the wood.
 * (38x16)
 */
export const FALLEN_LOG = sprite(
  [
    "....................W.................",
    ".....w.............WW.................",
    "....Www............ww.................",
    "....Wwww...........ww.................",
    "..Wwwwwww.........ww..................",
    "Wwwwwwwwww..ghg...ww..................",
    ".Wwwwwwwwkggggggggggg.ghg.............",
    ".Wwwwwwwwkwwwwwwwwwwwggggggg.g........",
    "WwwwwWwwwkwwwwwwwwwwwwwkwwwwgggggwW...",
    ".WwwwwwwwkwwwkkwwwwwwwkwwwwwwkkwwwwwwW",
    ".WwwwwwwwkwwwwwwwkkwwwwwwwkwwwwwwwwwW.",
    ".W.wwwwwwkwwwwwwwwwwwwwwwwwwwkkwww....",
    ".Wwwwwwwwkwwwwwwwwwwkkkwwkkw...g......",
    ".W.wwwww..wkkkwwkkwww.....gg..........",
    "....www.w..g..........................",
    "....w....w............................",
  ],
  { g: G, h: BG, k: K, w: W, W: BW },
);

/**
 * A nurse log: end-grain rings on the cut face, shelf fungus stepping along
 * the flank, and two saplings growing out of the dead wood.
 * (36x16)
 */
export const FALLEN_LOG_NURSE = sprite(
  [
    "............h.......................",
    "...........g.g........h.............",
    "............g........g.g............",
    "............g.........g.............",
    "............g.........g.............",
    "........gg..g.........g.............",
    ".....ggggggggg.gggh...g.............",
    "...Wwwwwwwwwwwgggggggggg.g.g........",
    "...Wkwwwwwwwwwwwwwwwwwwwggggggggg...",
    "..Wwwkwwwwkwwwwkwwwwwwwwwwwwwwwwww..",
    "..Wkwkwwwwkwwwwkwwwwkwwwkwwwwkwwwww.",
    "..WwwkwwwwwwYYYwwwwwkwwwkYYwwkwwwwww",
    "...WkwwwwwwwwywwwYYYYwwwwwywwwwwwkkw",
    "...Wwwwwwwwwwwwwwwyywkkwwwwkkwwwwgg.",
    ".....wwwkkkwwwkkkwwwg...............",
    ".......g............................",
  ],
  { g: G, h: BG, k: K, w: W, W: BW, y: Y, Y: BY },
);

/**
 * A broken-back snag: the butt end propped on a stone, a white splinter
 * burst where the trunk shattered, chips scattered under the break.
 * (38x14)
 */
export const FALLEN_LOG_BROKEN = sprite(
  [
    "..............gwW.....................",
    "............ggwww.....................",
    ".........gggwwwwWW....................",
    "........ggwwwwwwww....................",
    ".....ghgwwwwwwww.w....................",
    "....ggwwwwkkwwwww.....................",
    "..ggwwwwwwwwww....gwgghggggg..........",
    "..wwwwkkwwww......wwwwwwwwwwggggggww..",
    "..wwwwwwww........Wwwwkkwwwwwwwkkwwk..",
    "..wwwwww..........wwwwwwwwwkkwwwwwww..",
    "..wWWww...........wwwwwwwwwwwwwwwwww..",
    "..wwwwww..........wwkkwwwwkkwwwwkkww..",
    "..wwwwww..............................",
    "...wwkk......w...w.w..................",
  ],
  { g: G, h: BG, k: K, w: W, W: BW },
);

/** The deadfall family, indexed by chunk hash where logs are placed. */
export const FALLEN_LOGS = [
  FALLEN_LOG,
  FALLEN_LOG_NURSE,
  FALLEN_LOG_BROKEN,
] as const;

/**
 * Yellow caps and leaf-litter in a sparse woodland clump. Domed, lit
 * from the moon side, each standing on its own stalk with air between.
 * (22x12)
 */
export const MUSHROOM_PATCH = sprite(
  [
    "......................",
    "......................",
    "........YYY...........",
    ".......YyyyY..........",
    "..YYY.YyyyyyY.........",
    ".YyyyYyyyyyyy..YYY....",
    "Yyyyyykkkkkkk.YyyyYYYY",
    ".kkkkk..ww....Yyyyyyyy",
    "..ww....ww....kkkkyyyy",
    "..ww....ww......w..kkk",
    ".gww..g.ww..g.g.w..gw.",
    ".gww..g.ww..g.gww..gw.",
  ],
  { g: G, w: W, y: Y, Y: BY, k: K },
);

/**
 * Two sarsens carrying a lintel — the henge, and far taller than
 * anyone who walks up to it.
 * (46x54)
 */
export const TRILITHON = sprite(
  [
    "..............................................",
    "..............................................",
    "..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWkWWkWWk.",
    "..Wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwkwwk.",
    "...Wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww..",
    ".WWwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwkkwwwwwww..",
    "..kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk...",
    "..Wwwwwwwwwwwwwwwwwwwwwwwwwwwwkkwwkwwwwwwwkkk.",
    "..Wkwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk...",
    "..Wwwwwwwwwwwwwwwwkkkkwwwwwwwwwwkkwwwwwwwwwkk.",
    "..kkkwwwwwwwwwwkwwwwwwkkwwkkwwwwwwwwwwwwwww...",
    ".kkkkkwwwwwwwwwkkkwwwwkkwwkkwwwwwwwwwwwwwwwW..",
    "..kkkkwwwwwwwwwwkkwwwwwwwwkkkwwwwwwwwwwwkkkkk.",
    ".....kwwwwwwkkww.............Wwwwwwwkkwk......",
    "......Wwwwwwwwk..............Wwwwwwwwwkk......",
    "......Wwwwkkwwk..............Wwwwwwwwwkk......",
    "......Wwwwkwwwwk.............Wwwwwwwwwkkk.....",
    "......Wwwwwwwwwk.............Wwwwwwwwwkk......",
    ".......Wwwwwwww.............kwwwwwwwwwww......",
    "......Wwwwwwwww..............Wwwwwwwwwww......",
    "......Wwwwwwwkwk.............Wwwwwwwwkk.......",
    "......Wwwkwwkkk..............kwwwwwwwkk.......",
    "......Wwwwwwwwkk.............kwwwwwkkkk.......",
    "......Wwwwwwwwkk............kwwwwwwkkkk.......",
    "......Wwwwwwwwww.............Wwwwwwwwwk.......",
    "......Wwwwwwwwww.............Wwwwwkkwwkk......",
    "......WwwwwwwwwwW............Wwwwwkwkk........",
    "......Wwwkwwwwwk.............Wwwwwwwkkk.......",
    ".....Wwwwwwwwwwwk............Wwwwwwwkkw.......",
    "......Wwwwwwwwwk.............Wwwkkwwkkw.......",
    ".....kwwwwwwwwkk.............Wwwwwwwwk........",
    "......Wwwwwwwwwkk...........kwwwwwwwwwk.......",
    ".....Wwkkkwkkwwww............Wwwwwwwwww.......",
    ".....WwkwwwkwwwwwW..........Wwwwwwwwwwk.......",
    ".....Wwwwwwwkwwwkk.........kwwwwwwwwwwk.......",
    ".....Wwwwwkkwwwwwkk.........Wwwwwwwwwww.......",
    ".....Wwwwwwwwwwkwkk........Wwwkwwwwwwkw.......",
    ".....Wwwwwwwwwwkwkk........WwwwwwwwwwwwW......",
    ".....Wwwwwwwwwwwwk..........Wwwwwwwwwkk.......",
    "....kwwwwwwwwwwwwwk........Wwwwwwwwwwwkk......",
    ".....Wwwwwwwwwwwkkk........Wwwwwwwwwwkkk......",
    "....kwwwwwwwwwwwkkk.......kwwwwwwwwwkkkk......",
    ".....Wkwwwwwwwwkkkk........Wwwwwwkwwwwkk......",
    ".....Wwwwwwwwwwkkkk.......kwwwwwwwwwwwkkW.....",
    ".....Wwwkkwwwwwwkkw........Wwwwwwwwwwwwkk.....",
    ".....Wwwwwwwwwwkkkw.......Wwwwwwwkkwwwkk......",
    ".....Wwwwwwwwwwkwwk.......Wwwwwwwwwwwwkk......",
    "....Wwwwwwwwwwwwwwkk.....kwwwwwwwwwwwwkk......",
    "....Wwwwwwwwwwwwwwkk.....kwwwwwwwwwwwwwwk.....",
    ".....kwwwwwwwwwwwwk.......Wkwwwwwwwwwwkk......",
    ".....Wwwkkwwwwwwwwkk.....Wkkwwwwwwkkwwkkk.....",
    ".....Wwwkkwwwwwwwwk.......kkkkkkwwkkwwkk......",
    ".....Wwwkkkkwwwwkkkk.....kwwkkwwwwkkkkkk......",
    ".....gkgggkgkgggkkgg....gkggggwwkkgggkgkk.....",
  ],
  { w: W, W: BW, k: K, g: G },
);

/**
 * A single towering standing stone, weathered and leaning. Lit face to
 * the moon, shadow eaten out of the far side in clumps, pits scattered
 * through the middle. A stone lit from nowhere is a grey slab, which is
 * what this was.
 * (18x46)
 */
export const SARSEN_TALL = sprite(
  [
    "..................",
    "..................",
    "..................",
    ".......WWWkkkk....",
    ".......Wwkwkww....",
    "......Wwwwwkww....",
    "......Wwwwwwkk....",
    "......Wwwwwwkkk...",
    ".....Wwwwwwwkkk...",
    ".....Wwwwwwwkkk...",
    "....Wwwwwwwwwwk...",
    ".....Wwwwwwwwwk...",
    "......Wwwwwkwk....",
    ".....Wwwwwwkwk....",
    ".....Wwwwwwwwwk...",
    "....kkkwwwwwwwk...",
    ".....kwwwwwwwk....",
    "....Wwwwwwwwwk....",
    ".....Wwwwwwkkkk...",
    ".....Wwwwwwkkkk...",
    ".....kwwwwkkwk....",
    ".....kwwwwkkwk....",
    "......Wwwwwkk.....",
    ".....Wwwwwwkk.....",
    ".....Wwwwkwkw.....",
    ".....WwkwwwwwW....",
    ".....kkwwwkkw.....",
    "......kwwwkkw.....",
    "......Wwwwwkk.....",
    "......Wwwwwkk.....",
    ".....kwwwwkkk.....",
    "......Wwwwkkk.....",
    ".....kkwwwwkk.....",
    "....Wkkwwwwkk.....",
    ".....kwwwwwkwW....",
    ".....Wwwwwwww.....",
    "....Wwwwwwwww.....",
    "...WwkwwwwwwwW....",
    "...Wwwwwwwwwwwk...",
    "...Wwwwwwwkwwwk...",
    "...Wwwwwwwwwkkk...",
    "...Wwwwwwwwwkkk...",
    "...Wwwwwwwwwkk....",
    "..kwwwwwwwwwkkk...",
    "...Wwwkkkkkkwk....",
    ".kkkgkggggkgkgk...",
  ],
  { w: W, W: BW, k: K, g: G },
);

/**
 * A great stone lying on its side, half sunk, grown over.
 * (40x14)
 */
export const SARSEN_FALLEN = sprite(
  [
    "........................................",
    "........................................",
    "..................k.....................",
    "..............W.k.WWWkWk................",
    "............k.WWwWwkwwwwWWW.............",
    "...........WwWwwwwwwwwwwwwwWWW..........",
    "........WWWwkwwwwwwwwwwwwwwwwwWW........",
    "......WWwwwwwwwwwwwwwwwwwwwkkwwwW.......",
    ".....WwkwwwwwwwwwwwwwwwwwwkwwwwwwWW.....",
    ".....Wwkwwwkkwwwwwwwwwwwwwkwwwwwkww.....",
    "...kkkwwkkkkwwkkwwwwwwwwwwwwwwwwkwkkk...",
    "..kkkkkkkkkkwwkkwwkkwwwwwwkwkkkkkwkkkkk.",
    ".kgkwwkgggwgwgwwkgkkggkkkgggkkkggwwgggw.",
    "........................................",
  ],
  { w: W, W: BW, k: K, g: G },
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
