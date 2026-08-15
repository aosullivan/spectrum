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
 * A barrow-ghoul, walking bones. Built as bone MASS with black carved out —
 * two sockets in a solid skull, rib slits cut into the chest rather than
 * stripes across it, a black waist, one arm hanging clear and one raised to
 * a claw. The old one drew ribs as full-width bands and read as a mummy
 * from ninety units out; and the raised claw echoes the reference skeleton
 * it hands off to up close, so the LOD swap stops changing the creature.
 * (15x19)
 */
export const GHOUL = sprite(
  [
    ".....WWWWW.....",
    "....Wwwwwww....",
    "....wkwwkww...W",
    ".....wwwww.w.w.",
    "......wkw...ww.",
    ".......w....ww.",
    "....Wwwwwwww...",
    ".Ww.wkkwwww....",
    ".ww.wwwwkkw....",
    ".ww.wkkwwww....",
    ".ww..wwwww.....",
    ".ww....w.......",
    ".ww.wwwwwww....",
    "w.w.www.www....",
    "....ww...ww....",
    "....wk...kw....",
    "....ww...ww....",
    "....ww...ww....",
    "...Www...wwW...",
  ],
  { w: W, W: BW, k: K },
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
 * A forester of the greenwood: hooded, cloaked, spear grounded and
 * gripped. Shoulders broader than the hood and an arm crossing to the
 * shaft — a plain hooded taper at this size is a small conifer.
 * (14x18)
 */
export const ELF_ARCHER = sprite(
  [
    ".....G....H...",
    ".....G...Hw...",
    "....GgG...w...",
    "....kgk...w...",
    "....Ggg...w...",
    ".....G....w...",
    "..GGGgGGG.w...",
    "..Ggggggg.w...",
    "..GggggggHw...",
    "..Gggggg.Gw...",
    ".G.Ggggg..w...",
    ".G.Ggggg..w...",
    ".GGggggg..w...",
    "....G.G...w...",
    "....G.G...w...",
    "....G..G..w...",
    "...G...G..w...",
    "..Gg...GG.w...",
  ],
  { g: G, G: BG, w: W, H: BW, k: K },
);

/**
 * The lady of the pool, redrawn as a figure instead of a totem: a crowned
 * head tilted over one shoulder, hair streaming aside as if underwater, one
 * arm held out over the water offering a mote of light, and from the waist
 * down a waterfall — vertical bright streams with the pool showing through
 * the gaps — meeting the surface in a lit ring.
 *
 * Asymmetry is the whole redesign. The old sprite was mirror-symmetric and
 * read as a cyan cactus at every distance; nothing alive is symmetric, and
 * at fourteen pixels the flying hair and the offered arm are what say
 * "woman" rather than "pillar".
 *
 * Three frames, base rows edited per frame: the cascade's gaps slide, the
 * mote pulses and lets a droplet fall, the hair drifts. At range the frame
 * differences vote-average into a shimmer, which is the right thing for a
 * spirit to do.
 * (22x36)
 */
const LADY_ROWS: readonly string[] = [
  "......................",
  "......................",
  "........w.w.w.........",
  ".........bbb..........",
  ".....cc.bwwwb.........",
  "...cccc.bwwwb.........",
  ".c.ccc..bkwkb.........",
  "..ccc....bwb..........",
  ".cs.c.....w...........",
  "......bbbbwbbbb.......",
  ".c....bccwcccbcc......",
  "......bccwcckb..cc..w.",
  "....cc.bccwccb....cb..",
  "....cc.bccwccb........",
  ".....cc.bcwccb........",
  ".....cc.bcckcb........",
  "......c.bcccb.........",
  "........bcccb.........",
  ".......bcccccb........",
  ".......c.cbc.cb.......",
  "......cc.cbc.cbc......",
  "......c.bcbc.cb.c.....",
  ".....cc.cbcc.cbc.c....",
  ".....c.ccb.c.cb.cc....",
  ".....c.cbc.cc.bc.c....",
  "....cc.cb.c.cb.cc.c...",
  "....c.ccbc.ccb.c.c....",
  "....c.cb.c.cbc.cc.c...",
  "...cc.cbc.c.cb.c.cc...",
  "...c.ccb.cc.cbc.c.c...",
  "...c.cwbc.c.cb.cc.c...",
  "..cc.cb.c.ccb.c.cc.c..",
  "..c.ccbc.c.cbw.cc.c...",
  "..c.cb.cc.c.cb.c.cc...",
  "..sbbc.bbcbbc.bbcbs...",
  ".cc..cc...bb...cc..cc.",
];
const LADY_LEGEND = { c: C, b: BC, w: BW, s: W, k: K };

/** One animation frame: the base figure with a handful of rows replaced. */
function ladyFrame(edits: Record<number, string>): ReturnType<typeof sprite> {
  return sprite(
    LADY_ROWS.map((row, i) => edits[i] ?? row),
    LADY_LEGEND,
  );
}

export const WATER_SPIRIT_FRAMES = [
  ladyFrame({}),
  ladyFrame({
    1: "....................w.",
    6: "c...cc..bkwkb.........",
    8: "..cs.c....w...........",
    11: "......bccwcckb..cc.ww.",
    19: ".......cc.bc.cb.......",
    22: ".....c.cbc.cc.bc.c....",
    24: ".....cc.cbcc.cbc.c....",
    25: "....c.cb.c.cbc.cc.c...",
    27: "....cc.cb.c.cb.cc.c...",
    28: "...c.ccb.cc.cbc.c.c...",
    29: "...cc.cbc.c.cb.c.cc...",
    30: "...c.cbbc.c.cb.cc.c...",
    31: "..c.ccb.c.cb.cc.c.cc..",
    33: "..c.cb.cc.cwcb.c.cc...",
  }),
  ladyFrame({
    6: ".cc.cc..bkwkb.........",
    8: ".c.sc.....w...........",
    11: "......bccwcckb..cc....",
    13: "....cc.bccwccb......w.",
    15: ".....cc.bckccb........",
    19: ".......c.cbcc.b.......",
    20: "......c.ccbc.cbc......",
    23: ".....c.cbc.cc.bc.c....",
    24: ".....c.ccb.c.cb.cc....",
    25: "....cc.b.cc.cb.cc.c...",
    29: "...c.ccb.cc.cbc.cc....",
    32: "..c.ccbc.c.cbb.cc.c...",
    34: "..sbbcb.bcbbc.bbcbs...",
    35: ".cc...cc..bb..cc...cc.",
  }),
] as const;

/** The base frame, for anything that wants her without the animation. */
export const WATER_SPIRIT = WATER_SPIRIT_FRAMES[0];

/**
 * A wanderer of the greenwood under a wide brim, leaning on a staff. Grey
 * cloth edged in white — the neutral folk take no colour of their own, which
 * is how you tell them from the greenwood's green and the dead's cyan.
 *
 * Because he has no colour of his own, the outline has to carry him: a brim
 * wider than his shoulders, a staff standing clear of the body, and black
 * carved between beard, arm and the fall of the coat. Undivided, a single
 * grey mass this size is a bell with a hat on it.
 * (16x24)
 */
export const NPC_HERMIT = sprite(
  [
    "................",
    ".............HH.",
    ".............HH.",
    "...HHHHHHHHH..H.",
    "..HHHHwwwHHHH.H.",
    "......kwk.....H.",
    ".....HwwwH....H.",
    ".....HwwwH....H.",
    ".....HwwwH....H.",
    ".....kwwwk....H.",
    "....HwkkkwHH..H.",
    "....HwwwwkkkHHH.",
    "....HwwwwwH...H.",
    "....HwkwwwH...H.",
    "....HwwwwkH...H.",
    "...HwwkwwwwH..H.",
    "...HwwwwwkwH..H.",
    "...HwwkwwwwH..H.",
    "...HwwwwwkwH..H.",
    "...HwwkwwwwH..H.",
    "..HwwwwwwkwwH.H.",
    "..HwwHHwwHwHH.H.",
    "...HH..HH.H...H.",
    "....H...H.....H.",
  ],
  { w: W, H: BW, k: K },
);

/**
 * The ghost of a knight, still in his ruined helm, one arm raised in
 * warning. You can see the wall through his ribs.
 *
 * The raised arm is what tells him apart at twenty pixels, and the notch out
 * of the helm's crest does more for "ruined" than any amount of detail on
 * the face. The ribs are cut clean through and the legs fray out instead of
 * ending in feet, so he is transparent where the old solid figure only
 * claimed to be.
 * (14x24)
 */
export const NPC_SHADE = sprite(
  [
    "........C.....",
    "......C.C.....",
    "....CCcCC.....",
    "....CcccC.....",
    ".CC.CkkkC.....",
    ".CC.CcccC.....",
    "..CCCCcCC.....",
    "..CC..C.......",
    "...CCCcCCC....",
    "...CcccccC....",
    "...CkkkkkcC...",
    "...CcckcccC...",
    "...CkkkkkC.C..",
    "...CcccccC.C..",
    "...CkkkkkC.C..",
    "...CcCccCC....",
    "...CC.CC.C....",
    "...C.CC.CC....",
    "....CC.CC.....",
    "....C.CC......",
    ".....CC.......",
    "...C.C.CC.....",
    "....C..C......",
    ".....C........",
  ],
  { c: C, C: BC, k: K },
);

/**
 * A seated scholar under a wide brim, a small ley-light cupped in her hands.
 * Yellow is the scholarly ink on this sheet, and it is the only warm colour
 * indoors — which is why the sanctum reads as occupied.
 *
 * Drawn in folds rather than as a filled shape: she stands two paces from the
 * eye at the moment you speak to her, and a flat cone of one yellow at that
 * size is a placeholder next to a moor drawn entirely in stipple. Black is
 * doing the work — every shadow in the robe is paper showing through.
 * (16x24)
 */
export const NPC_SEER = sprite(
  [
    "......YYYY......",
    ".....YyyyyY.....",
    ".....YyyyyY.....",
    "....YyyyyyyY....",
    ".YYYYYYYYYYYYYY.",
    ".YyyyyyyyyyyyyY.",
    "..YkkkkkkkkkkY..",
    "...ykkkkkkkky...",
    "...ykccyycckY...",
    "...ykccyycckY...",
    "...yyykkkkyyy...",
    "....yyykkyyy....",
    "..Yyyyyyyyyyyy..",
    ".Yyyyyyyyyyyyyy.",
    ".Yykyyykyyyykyy.",
    "Yyykyyykkyyykyyy",
    "Yyykyyykkyyykyyy",
    "Yyykywwwwwwykyyy",
    "Yyykywwcccwwykyy",
    "YyykywwcHcwwykyy",
    "Yyykywwcccwwykyy",
    "Yyykywwwwwwykyyy",
    "Yyykyyyyyyyykyyy",
    ".YYYYYYYYYYYYYY.",
  ],
  { y: Y, Y: BY, H: BW, w: W, c: BC, k: K },
);
