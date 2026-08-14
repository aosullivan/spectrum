// The bestiary: everything alive in the world that is not the player.
// String bitmaps, one char per pixel, '.' transparent — the agreed format.

import { BC, BG, BM, BR, BW, BY, C, G, K, M, R, W, Y } from "@/lib/rpg/palette";
import { sprite } from "@/lib/rpg/screen";

/**
 * The great wyrm of the moor. Enormous, and — so far as anyone\n * has dared find out — perfectly civil.
 * (68x46)
 */
export const DRAGON = sprite(
  [
    "........rrr..r......................................................",
    "........rr..rrr.....................................................",
    "........rr.rrr..............................r.rhhhhhh...............",
    ".......rr.rrr..................h.....r.rhhhhhhhhhhhr.r..............",
    ".......rrrrr..................rhrhhhhhhhhhhhr.r.r.r.r.r.............",
    "......rrrrr....................hhhhhhr.r.r.r.r.r.r.r.r..............",
    "....rrrkrrrrr.................rhhhhhhhh.r.r.r.r.r.r.r.r.............",
    "....rreerrrrr..................h.hhh.hhhhhhr.r.r.r.r.r.r............",
    "...rrrrrrrrrrr..................r.hhh.r.rhhhhhh.r.r.r.r.r...........",
    "...rrrrrrrrrrr.................r.r.rhh.r.r.r.hhhhhhr.r.r.r..........",
    "...rrrrrrrrhrrr.................r.r.rhhhr.r.r.r.rhhhhhh.r.r.........",
    "...rrrrrrrrrhhrr.................r.r.r.hhr.r.r.r.r.r.hhhhhhh........",
    "....t.t.trtrrhhhr...............r.r.r.r.hhh.r.r.r.r.r.r.rhhhh.......",
    ".........rrrrrrhhr...........h...rhr.r.r.hhh.r.r.r.r.r.r.r.r........",
    "..........rrrrrrhhhr........hh...hh.r.r.r.rhh.r.r.r.r.r.r.r.........",
    "...........rrrrrrrhhr...h...hh...hhr.r.h.r.rhhhr.r.r.r.r.r..........",
    ".............rrrrrrrhr.hh...hhh..hhhr.hhr.r.r.hhr.r.r.r.r...........",
    "..............rrrrrrrhhhh..hhhh.hhhh.rhh.r.r.r.hhh.r.r.r............",
    "...............rrrrrrrhhhh.hhhh.hhhh..hhh.r.r.r.hhh.r.r.............",
    "................rrrrrrhhhh......r....hhhh......r.rhh.r..............",
    "..................rrrkhhhhhrrrrrrrrrrhhhhr.........hh...............",
    "...................rrrkkrrrhrrkkrrrrrrrrrrrrr.......................",
    "....................rrrkkrrrrrrrkkkrrrrrrrrrrr......................",
    "....................rrrrkkrrrrrrrrkkkkrrrrrrrrr.....................",
    "...................rrrrrrrkrrrrrrrrrrkkkkrrrrrr.....................",
    "...................rrrrrrrrrrrrrrrrrrrrrkkkrrrr.....................",
    "...................rrrrrrrrrrrrrrrrrrrrrrrrkkrrr....................",
    "..................rrrrrrrrrrrrrrrrrrrrrrrrrrrrr.....................",
    "...................rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr..................",
    "...................rkkrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr..............",
    "...................rrrkkkrhrhrhrhrhrhrhrhrhrrrrrrrrrrrrr............",
    "....................rrrhkkkhrhrhrhrhrhrkrhrhrrrrrrrrrrrrrr..........",
    ".....................rhrhkkkkrhrhrhrhrhkhrh..rrrrrrrrrrrrrr.........",
    "........................rkrhrkkhrhrhrhrkkhr......rrrrrrrrrrrr.......",
    "........................kkhrhrhrhrhrhrhrkrh.........rrrrrrrrrrr.....",
    "........................kkrh....r......hkhr...........rrrrrrrrrr....",
    ".......................rkrrr...........rkkrr............rrrrrrrrr...",
    ".......................rkrrr...........rrkrr..............rrrrrrrr..",
    ".......................rkrr.............rkrr...............rrrrrrr..",
    "......................rrrrr.............rrrrr................rrrrrr.",
    ".....................rrrrrr.............rrrrrr...............rrrrrrr",
    "....................rrrrrr...............rrrrrr...............rrrrrr",
    "...................rrrrrr.................rrrrrr...............rrrrr",
    "....................rrrr...................rrrr................rrrrr",
    ".....................r.......................r..................rrrr",
    ".................................................................rrr",
  ],
  { r: R, h: BR, e: BY, t: W, k: K },
);

/**
 * A barrow-ghoul, walking bones — skull, ribs and not much else, picked
 * out in white line-work because bone is the one thing in the moor that
 * is genuinely pale.
 * (12x18)
 */
export const GHOUL = sprite(
  [
    "....HHHH....",
    "...HwwwwH...",
    "...HkwwkH...",
    "...HwwwwH...",
    "....HwwH....",
    "....wHHw....",
    "..w.HHHH.w..",
    ".ww.HwwH.ww.",
    ".w..HHHH..w.",
    ".w..HwwH..w.",
    "....HHHH....",
    "....wHHw....",
    "...HH..HH...",
    "...w....w...",
    "...H....H...",
    "...w....w...",
    "..HH....HH..",
    ".HH......HH.",
  ],
  { w: W, H: BW, k: K },
);

/**
 * A goblin scout — horned, tailed, and carrying a stolen trident it has
 * not worked out how to use.
 * (12x16)
 */
export const GOBLIN = sprite(
  [
    ".m......m...",
    "..mm..mm....",
    "...hhhh.....",
    "..hkhhkh....",
    "..hhhhhhw.w.",
    "...mmmm.www.",
    "..mmmmmm.w..",
    ".mmmmmmm.w..",
    "mmmmmmmm.w..",
    ".mmmmmmm.w..",
    "..mmmmmm.w..",
    "..mm..mm.w..",
    "..mm..mm.w..",
    "..m....m.w..",
    ".mm....mm...",
    ".mm....mm.h.",
  ],
  { m: M, h: BM, k: K, w: W },
);

/**
 * An orc of the deep holds — broad, tusked and slow to reason.
 * (12x16)
 */
export const ORC = sprite(
  [
    "...mmmmmm...",
    "..mmmmmmmm..",
    "..mmrmmrmm..",
    "..mmmmmmmm..",
    "..mwmmmmwm..",
    "...mmmmmm...",
    ".mmmmmmmmmm.",
    "mmmmmmmmmmmm",
    "mmmmmmmmmmmm",
    "mmmmmmmmmmmm",
    ".mmmmmmmmmm.",
    "..mmmmmmmm..",
    "..mmm..mmm..",
    "..mmm..mmm..",
    "..mm....mm..",
    ".mmm....mmm.",
  ],
  { m: M, r: BR, w: W },
);

/**
 * A moor-spider, low and wide, eight eyes and no manners.
 * (16x12)
 */
export const SPIDER = sprite(
  [
    "w.............w.",
    ".w...........w..",
    "..ww.......ww...",
    "w...w..ww..w...w",
    ".w..wwwwwwww..w.",
    "..wwwrwwwwrwww..",
    "..wwwwwwwwwwww..",
    "..w.wwwwwwww.w..",
    ".w...wwwwww...w.",
    "w..w..wwww..w..w",
    "..w....ww....w..",
    ".w......w.....w.",
  ],
  { w: W, r: BR },
);

/**
 * A forester of the greenwood: hooded, green-clad, spear grounded. Bright
 * green edges the dark green body, so a warden reads against the moor's
 * own green rather than dissolving into it.
 * (13x16)
 */
export const ELF_ARCHER = sprite(
  [
    "....GGG....H.",
    "..GGGGGGG..H.",
    "....gggg...w.",
    "....gkkg...w.",
    "....gggg...w.",
    "...GGGGGG..w.",
    "..GggggggG.w.",
    "..GggggggG.w.",
    "..GggggggG.w.",
    "...gggggg..w.",
    "...gggggg..w.",
    "...gg..gg..w.",
    "...gg..gg..w.",
    "...gg..gg..w.",
    "..GGg..gGG...",
    ".GG......GG..",
  ],
  { g: G, G: BG, w: W, H: BW, k: K },
);

/**
 * The lady of the pool: light standing up out of still water,
 * arms opening. She blesses what comes to her and asks nothing.
 * (18x30)
 */
export const WATER_SPIRIT = sprite(
  [
    ".......hwwh.......",
    "......hbwwbh......",
    ".....hbwwwwbh.....",
    ".....hbwwwwbh.....",
    "......hbwwbh......",
    "......cbwwbc......",
    "....c.cbwwbc.c....",
    "...cb.cbwwbc.bc...",
    "..cbb.cbwwbc.bbc..",
    "..cbbccbwwbccbbc..",
    "..cbbbbbwwbbbbbc..",
    "..cbbbbbwwbbbbbc..",
    "...cbbbbwwbbbbc...",
    "....cbbbwwbbbc....",
    "....cbbbwwbbbc....",
    "....cbbbwwbbbc....",
    "...ccbbbwwbbbcc...",
    "...cbbbbwwbbbbc...",
    "...cbbb.ww.bbbc...",
    "...cbb..ww..bbc...",
    "...cbb.cwwc.bbc...",
    "...cb.ccwwcc.bc...",
    "....c.cbwwbc.c....",
    "....ccbbwwbbcc....",
    "...c.cbbwwbbc.c...",
    "..c...cbwwbc...c..",
    "..c....cwwc....c..",
    ".c...c.cwwc.c...c.",
    "....c...cc...c....",
    "..c...c.cc.c...c..",
  ],
  { c: C, b: BC, w: BW, h: BW },
);

/**
 * A ring of ripple-light, laid on the water behind her.
 * (16x7)
 */
export const POOL_RIPPLE = sprite(
  [
    "....cccccccc....",
    "..cc........cc..",
    ".c............c.",
    "c..............c",
    ".c............c.",
    "..cc........cc..",
    "....cccccccc....",
  ],
  { c: BC },
);

/**
 * A wanderer of the greenwood under a wide brim, leaning on a staff. Grey
 * cloth edged in white — the neutral folk take no colour of their own, which
 * is how you tell them from the greenwood's green and the dead's cyan.
 * (14x24)
 */
export const NPC_HERMIT = sprite(
  [
    "......HHH.....",
    ".....HwwwH....",
    "...HHHHHHHHH..",
    ".....wkkkw....",
    ".H...wwwww....",
    ".H..HwwwwwH...",
    ".H..HwwwwwH...",
    ".H.HHwwwwwHH..",
    ".H.HwwwwwwwH..",
    ".H.HwwwwwwwH..",
    ".HHHwwwwwwwH..",
    ".H.HwwwwwwwH..",
    ".H.HwwHwwHwwH.",
    ".H.HwwHwwHwwH.",
    ".H.HwwHwwHwwH.",
    ".H.HwwHwwHwwH.",
    ".H.HwwwwwwwH..",
    ".H.HwwwwwwwH..",
    ".H..HwwwwwH...",
    ".H..HwwwwwH...",
    ".H..Hww.wwH...",
    ".H..Hw...wH...",
    "....HH...HH...",
    "...HH.....HH..",
  ],
  { w: W, H: BW, k: K },
);

/**
 * The ghost of a knight, still in his ruined helm, one arm
 * raised in warning. You can see the wall through his ribs.
 * (14x24)
 */
export const NPC_SHADE = sprite(
  [
    ".....CCCC.....",
    "....CccccC....",
    "....CkcckC....",
    "....CccccC....",
    ".....CccC.....",
    "......cc......",
    "...CccccccC...",
    ".C.CccccccC.C.",
    ".C.CccccccC.C.",
    ".C.CccccccC.C.",
    "..CCccccccCC..",
    "...CccccccC...",
    "...Ccc..ccC...",
    "...Ccc..ccC...",
    "...Ccc..ccC...",
    "...CccccccC...",
    "...CccccccC...",
    "....CccccC....",
    "....CccccC....",
    "....Cc.ccC....",
    ".....c.c.c....",
    "....c...c.c...",
    "...c.....c....",
    "..c.......c...",
  ],
  { c: C, C: BC, k: K },
);

/**
 * A seated scholar under a wide brim, a small ley-light cupped in her
 * hands. Yellow is the scholarly ink on this sheet, and it is the only
 * warm colour indoors — which is why the sanctum reads as occupied.
 * (14x20)
 */
export const NPC_SEER = sprite(
  [
    "......YYY.....",
    ".....YyyyY....",
    "...YYYYYYYYY..",
    ".....ykkky....",
    "......yyy.....",
    "....YyyyyyY...",
    "...YyyyyyyyY..",
    "...YyycccyyY..",
    "...YyycHcyyY..",
    "...YyycccyyY..",
    "...YyyyyyyyY..",
    "..YyyyyyyyY...",
    "..YyyyyyyyY...",
    "..YyyyyyyyY...",
    ".YyyyyyyyyyY..",
    ".YyyyyyyyyyY..",
    ".YyyyyyyyyyY..",
    "YyyyyyyyyyyyY.",
    "YyyyyyyyyyyyY.",
    ".YYYYYYYYYYYY.",
  ],
  { y: Y, Y: BY, H: BW, c: BC, k: K },
);
