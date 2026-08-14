// The bestiary: everything alive in the world that is not the player.
// String bitmaps, one char per pixel, '.' transparent — the agreed format.

import { BC, BR, BW, BY, C, G, K, M, R, W, Y } from "@/lib/rpg/palette";
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
 * A barrow-ghoul: pale, hunched, and still wearing its own face.
 * (12x18)
 */
export const GHOUL = sprite(
  [
    ".....wwww...",
    "....wwwwww..",
    "...ww.ww.ww.",
    "...wkw.wkw..",
    "...wwwwwwww.",
    "....w.ww.w..",
    "...wwwwwww..",
    "..wwwwwwww..",
    ".ww.wwwwww..",
    "w.w..wwww.w.",
    "w.w..wwww.ww",
    ".ww.wwwwww.w",
    "..w.ww..ww.w",
    "..w.w....w..",
    "....w....w..",
    "...ww....w..",
    "...w.....ww.",
    "..ww......w.",
  ],
  { w: W, k: K },
);

/**
 * A goblin scout with a stolen spear.
 * (12x16)
 */
export const GOBLIN = sprite(
  [
    "..g......g..",
    "..gg....gg..",
    "...gggggg...",
    "..ggrggrgg..",
    "..gggggggg..",
    "...gg..gg...",
    "....gggg....",
    "..s.gggg....",
    "..s.ggggg...",
    "..s.gggggg..",
    "..sggggggg..",
    "..s.gggg....",
    "..s.gg.gg...",
    "..s.gg.gg...",
    "....gg.gg...",
    "...ggg.ggg..",
  ],
  { g: G, r: BR, s: W },
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
 * One of the kind folk of the greenwood, bow strung and watchful.
 * (13x16)
 */
export const ELF_ARCHER = sprite(
  [
    "....yy.......",
    "...yyyy..bb..",
    "..yywwyy.s.b.",
    "..yywwyy.s..b",
    "...yyyy..s..b",
    "....yy...s..b",
    "..yyyyyy.s..b",
    ".yyyyyyyys..b",
    "yy.yyyy.ys..b",
    "y..yyyy..s..b",
    "...yyyy..s..b",
    "...yyyy..s..b",
    "...yy.yy.s.b.",
    "...yy.yy.bb..",
    "...yy.yy.....",
    "..yyy.yyy....",
  ],
  { y: Y, w: BW, b: W, s: C },
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
