// A small occupied village east of the ley. Architecture is box geometry so
// buildings turn and collide correctly; the bitmaps are only people and props.
//
// The houses are sized to the rooms inside them. An interior plan is a grid of
// CELL-sized squares, so a cottage whose footprint is not a whole number of
// cells across cannot have an honest interior — the keep has matched its plan
// since it was built, and the village now does too. That is why the buildings
// are larger than they were: at the old 72x58 a cottage had barely one cell of
// floor once its walls were taken out, and it read as a shed besides.

import { BW, BY, K, W, Y } from "@/lib/rpg/palette";
import type { Billboard } from "@/lib/rpg/projection";
import { sprite } from "@/lib/rpg/screen";
import type { Box, DoorLeaf } from "@/lib/rpg/structures";

export const VILLAGE_POS = { x: 430, y: 1100 } as const;

/**
 * The gap the village keeps in the greenwood, and the swept ground inside it.
 *
 * Two ellipses, not one. The wood stands off the outer one; the trodden yard
 * stops at the inner. What is left between them is a ring of grass, and that
 * verge is what makes the treeline read as a treeline rather than as the edge
 * of a hole cut in the map.
 */
export const VILLAGE_CLEARING = { x: 430, y: 1167, rx: 302, ry: 228 } as const;
export const VILLAGE_YARD = { x: 430, y: 1167, rx: 252, ry: 190 } as const;

/**
 * True inside the gap the village keeps in the wood.
 *
 * This has to be asked of the hand-placed scenery as well as of the chunk
 * rolls. The henge's fallen outliers are laid out on a 250-unit ring about a
 * point off east, and one of them lands at (623, 1105) — which was open moor
 * when the ring was drawn and is now the inside of the east cottage. It stood
 * there as an eighty-unit megalith with a solid body, through the wall and
 * through the room.
 */
export function inVillageClearing(x: number, y: number): boolean {
  const dx = (x - VILLAGE_CLEARING.x) / VILLAGE_CLEARING.rx;
  const dy = (y - VILLAGE_CLEARING.y) / VILLAGE_CLEARING.ry;
  return dx * dx + dy * dy < 1;
}

/**
 * A gabled roof: stacked boxes tapering in depth only, so the ridge runs
 * east-west along the frontage. `rise` is the height of one course.
 */
function roof(
  x: number,
  y: number,
  width: number,
  depth: number,
  eave: number,
  levels: number,
  rise = 6,
): Box[] {
  const boxes: Box[] = [];
  for (let i = 0; i < levels; i++) {
    boxes.push({
      x,
      y,
      w: width + 10,
      d: depth + 10 - i * (depth / levels),
      base: eave + i * rise,
      top: eave + (i + 1) * rise,
      detail: "roof",
    });
  }
  return boxes;
}

/**
 * A building and the doorway through its south wall, as boxes.
 *
 * The house itself is one solid block — you never stand inside the exterior
 * geometry, because crossing the threshold hands you to an interior plan — so
 * the doorway is not a hole cut in a wall but a dark panel laid on its face,
 * with the leaf hung a little in front of that. Shut, the leaf covers the
 * panel exactly; open, the panel is the dark of the room beyond.
 */
interface House {
  x: number;
  y: number;
  w: number;
  d: number;
  eave: number;
  levels: number;
  rise: number;
  doorW: number;
  doorH: number;
  /** Which side of the chimney stack, and how far out it sits. */
  chimney: number;
}

function houseBoxes(h: House): Box[] {
  const face = h.y - h.d / 2;
  return [
    { x: h.x, y: h.y, w: h.w, d: h.d, base: 0, top: h.eave, detail: "timber" },
    ...roof(h.x, h.y, h.w, h.d, h.eave, h.levels, h.rise),
    // The opening, laid on the frontage a whisker proud of the timber, and
    // cut a little wider and taller than the leaf that hangs in it — so a
    // shut door sits inside a jamb and a head instead of floating on the
    // wall with nothing to say it is a hole.
    {
      x: h.x,
      y: face - 1,
      w: h.doorW + 7,
      d: 2,
      base: 0,
      top: h.doorH + 5,
      detail: "opening",
    },
    // The stack, rising past the ridge.
    {
      x: h.x + h.chimney,
      y: h.y + h.d * 0.1,
      w: 14,
      d: 16,
      base: h.eave + h.levels * h.rise - 8,
      top: h.eave + h.levels * h.rise + 22,
      detail: "wall",
    },
  ];
}

/**
 * The leaf hung in a house's doorway: hinged on its west jamb, swinging out
 * and to the south. Outward, because a door that opens away from you does its
 * work off-screen — the whole point is to see the plank face come round.
 */
function houseLeaf(h: House): DoorLeaf {
  return {
    hx: h.x - h.doorW / 2,
    hy: h.y - h.d / 2 - 2.5,
    // Shut, the leaf runs due east from its hinge (yaw is measured from north).
    shut: Math.PI / 2,
    // A little over a right angle, so it stands clear of its own jamb.
    swing: 1.62,
    width: h.doorW,
    base: 0,
    top: h.doorH,
    detail: "timberDoor",
  };
}

// The three houses. All three face south onto the square, so walking in keeps
// the bearing you crossed the threshold on (see `entryOf`), and the well sits
// in the open ground between them.
// Every frontage is five cells, and the buildings differ in what stands
// behind it: the inn runs a bay deeper and a storey taller, the cottages are
// low. A wide shallow house is a shed — and worse, it turns the whole
// frontage toward you at once, so you are looking at nothing but wall.
const INN: House = {
  x: VILLAGE_POS.x,
  y: 1240,
  w: 160,
  d: 192,
  eave: 72,
  levels: 6,
  rise: 7,
  doorW: 28,
  doorH: 46,
  chimney: 60,
};
const WEST: House = {
  x: 268,
  y: 1078,
  w: 160,
  d: 160,
  eave: 52,
  levels: 5,
  rise: 6,
  doorW: 24,
  doorH: 40,
  chimney: -58,
};
const EAST: House = {
  x: 592,
  y: 1088,
  w: 160,
  d: 160,
  eave: 52,
  levels: 5,
  rise: 6,
  doorW: 24,
  doorH: 40,
  chimney: 58,
};

/**
 * The well stands in the square the three houses enclose, but off the lane:
 * dead centre it is the first thing you walk into coming up from the south,
 * and its curb is solid.
 */
export const WELL_POS = { x: 480, y: 1058 } as const;

export const VILLAGE_BOXES: readonly Box[] = [
  ...houseBoxes(INN),
  ...houseBoxes(WEST),
  ...houseBoxes(EAST),
  // The well's stone curb is low but still stops movement.
  { x: WELL_POS.x, y: WELL_POS.y, w: 25, d: 25, base: 0, top: 9, detail: "wall" },
];

/**
 * A door in the world: where it is, what it opens onto, and how close you
 * must be for it to notice you.
 */
export interface Doorway {
  /** Stable id — the game tracks how far each door has swung under this. */
  id: string;
  /** The interior it lets onto, by site id. */
  site: string;
  /** Centre of the opening, and the wall face it is cut into. */
  x: number;
  y: number;
  halfW: number;
  /** How far out the door notices you and begins to swing. */
  noticeAt: number;
  /** How far out you cross the threshold — only once the leaf is clear. */
  enterAt: number;
  /** Where you are put down, and facing, on stepping back out. */
  doorstepY: number;
  /** One leaf for a house door, two for a gate. */
  leaves: readonly DoorLeaf[];
}

export const VILLAGE_DOORWAYS: readonly Doorway[] = (
  [
    { id: "inn", site: "inn", h: INN },
    { id: "west-cottage", site: "west-cottage", h: WEST },
    { id: "east-cottage", site: "east-cottage", h: EAST },
  ] as const
).map(({ id, site, h }) => ({
  id,
  site,
  x: h.x,
  y: h.y - h.d / 2,
  halfW: h.doorW / 2 + 4,
  noticeAt: 52,
  enterAt: 17,
  // Far enough back that stepping out does not immediately walk you in
  // again, near enough that the door is still open behind you.
  doorstepY: h.y - h.d / 2 - 42,
  leaves: [houseLeaf(h)],
}));

export const VILLAGE_WELL = sprite(
  [
    ".......WWWWWW.......",
    ".....WWWKWWKWWW.....",
    "....WWKKKKKKKKWW....",
    "...WWKKKKKKKKKKWW...",
    "...WKKKKKKKKKKKKW...",
    "...WWWWWWWWWWWWWW...",
    "....WKWKWKWKWKWK....",
    "....WWWWWWWWWWWW....",
    ".....WKKKKKKKKW.....",
    ".....WKWKWKWKWK.....",
    ".....WKKKKKKKKW.....",
    ".....WWWWWWWWWW.....",
    "......WKKKKKKW......",
    "......WWWWWWWW......",
    ".....WW......WW.....",
    "....WW........WW....",
  ],
  { W: BW, K },
);

export const INN_SIGN = sprite(
  [
    ".......W.......",
    ".......W.......",
    "....WWWWWWW....",
    "....WYYYYYW....",
    "....WYKYKYW....",
    "....WYKYKYW....",
    "....WYYYYYW....",
    "....WYKYYYW....",
    "....WYYYYYW....",
    "....WWWWWWW....",
    ".......W.......",
    ".......W.......",
    "......WWW......",
  ],
  { W: BW, Y: Y, K },
);

/**
 * The innkeeper: stout, aproned, one hand on his hip and a tankard in the
 * other.
 *
 * The pose is the whole design. He used to be described as arms-akimbo and
 * drawn as a solid fourteen-wide slab — the gaps the comment claimed made him
 * legible were never cut, so at the twenty-odd pixels he is actually seen at
 * he was a white brick with a dot for a head. What reads at that size is
 * black: the notch under each arm, the belt dividing chest from apron, the
 * split between the legs. The tankard is the same trick as the wanderer's
 * lantern — one warm accent held clear of the body, so you can tell at a
 * glance which villager you are looking at.
 * (16x22)
 */
export const VILLAGE_INNKEEPER = sprite(
  [
    "................",
    "......HHHH......",
    ".....HwwwwH.....",
    ".....HkwwkH.....",
    ".....HwwwwH.....",
    "......kwwk......",
    ".......ww.......",
    "....HHwwwwHH....",
    "...HwwwwwwwwH...",
    "..Hw.wwwwww.wH..",
    "..Hw.wwwwww.wwH.",
    "..Hw.wwwwww.Hyy.",
    "..Hw.kkkkkk.HyY.",
    "...HwHHHHHHw.yy.",
    "....HHHHHHHH.HH.",
    "....HHHHHHHH....",
    "....HHHHHHHH....",
    "....www..www....",
    "....Hww..Hww....",
    "....Hww..Hww....",
    "....Hww..Hww....",
    "...HHww..HHww...",
  ],
  { w: W, H: BW, k: K, y: Y, Y: BY },
);

/**
 * A villager mid-stride with a pack and a lit lantern held out at arm's
 * length. The lantern hangs clear of the body on purpose: carried against
 * the chest it merges into the cloth, and the figure goes back to being one
 * more pale upright on the lane.
 * (16x22)
 */
export const VILLAGE_WANDERER = sprite(
  [
    "................",
    "......H.........",
    ".....HwH........",
    "....HkwkH.......",
    ".....HwH........",
    "......H.........",
    "..HHHHwHHH......",
    "..HwwwwwwH......",
    "..HwwwwwwwH.....",
    "..HwwwwwwH.HH...",
    "..HwwwwwwH..H...",
    "...HwwwwwHHHHHH.",
    "...HwwwwwHyyyyy.",
    "...HwwwwwHyYYYy.",
    "...HHwwwwHyyYyy.",
    ".....HwwH.yyyyy.",
    ".....HHHH.HHHHH.",
    "....HH..HH......",
    "....HH..HH......",
    "....HH..HH......",
    "...HH....HH.....",
    "...HH....HH.....",
  ],
  { H: BW, w: W, k: K, y: Y, Y: BY },
);

// ------------------------------------------------------------------ indoors

/**
 * A trestle in the common room: one long board on splayed legs, with a pair
 * of tankards left standing on it. Drawn as mass with the shadow beneath the
 * board carved out, so it survives being shrunk to twenty pixels.
 * (24x12)
 */
export const TRESTLE = sprite(
  [
    "........................",
    ".....y.........y........",
    ".....yy........yy.......",
    "..HHHHHHHHHHHHHHHHHHHH..",
    "..HwwwwwwwwwwwwwwwwwwH..",
    "..HHHHHHHHHHHHHHHHHHHH..",
    "...Hkw............wkH...",
    "...Hkw............wkH...",
    "...Hkw............wkH...",
    "...Hkw............wkH...",
    "..HHkww..........wwkHH..",
  ],
  { H: BW, w: W, k: K, y: BY },
);

/** A stout barrel, hooped. (12x15) */
export const BARREL = sprite(
  [
    "...HHHHHH...",
    "..HwwwwwwH..",
    ".HwwwwwwwwH.",
    ".HHHHHHHHHH.",
    ".HwwwwwwwwH.",
    ".HwwwwwwwwH.",
    ".HwwwwwwwwH.",
    ".HHHHHHHHHH.",
    ".HwwwwwwwwH.",
    ".HwwwwwwwwH.",
    ".HwwwwwwwwH.",
    ".HHHHHHHHHH.",
    ".HwwwwwwwwH.",
    "..HwwwwwwH..",
    "...HHHHHH...",
  ],
  { H: BW, w: W },
);

/** A low bed under a blanket, the pillow bright at the head. (22x11) */
export const BED = sprite(
  [
    "......................",
    "..HHHH................",
    ".HwwwwH...............",
    ".HwwwwHHHHHHHHHHHHHH..",
    ".HHHHHwwwwwwwwwwwwwH..",
    "HHHHHHHHHHHHHHHHHHHHH.",
    "Hkkkkkkkkkkkkkkkkkkkk.",
    "Hw..................w.",
    "Hw..................w.",
    "HH..................HH",
    "......................",
  ],
  { H: BW, w: W, k: K },
);

export const VILLAGE_PROPS: readonly Billboard[] = [
  {
    x: WELL_POS.x,
    y: WELL_POS.y,
    sprite: VILLAGE_WELL,
    height: 23,
    solid: 12,
  },
  {
    x: INN.x + 34,
    y: INN.y - INN.d / 2 - 3,
    sprite: INN_SIGN,
    height: 22,
    elevate: 28,
  },
];
