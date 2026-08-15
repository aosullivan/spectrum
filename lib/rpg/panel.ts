// The control panel: a compact Dragontorc-style spell strip matching the
// Wraithlight reference frames, and in the right-hand corner the local dial —
// a heading-up radar of the ground she is actually standing on.
//
// It is drawn after the attribute pass, so the full Spectrum palette remains
// available for crisp runes and status lights.
//
// The dial and the AREA MAP are two instruments, not one drawn twice: the map
// is a chart of fixed places, opened deliberately, and the dial is what is
// near and moving, read at a glance. They share an ink vocabulary — defined
// here, since this is the module the map already imports — so a red cross
// means the same thing on both.

import { glyph } from "@/lib/rpg/assets";
import { B, BC, BG, BM, BR, BW, BY, C, G, K, M, W, Y } from "@/lib/rpg/palette";
import { HUD_TOP, SCREEN_W, type Screen, type Sprite } from "@/lib/rpg/screen";
import { DEAD_WOOD_X, GREENWOOD_X } from "@/lib/rpg/world";

/** What a mark on either instrument stands for. */
export type MarkKind = "foe" | "friend" | "item" | "way";

export const MARK_INK: Record<MarkKind, number> = {
  foe: BR,
  friend: BC,
  item: BY,
  way: BG,
};

/** How far the dial sees outdoors, in world units — about two screens of moor. */
export const RADAR_RANGE = 290;

/**
 * Indoors it tightens to about a room's width: at this range a grid cell is
 * three pixels, so the keep's nine-cell hall spans the dial and she can see
 * the shape of the room she is in rather than a smudge in the middle of it.
 */
const PLAN_RANGE = 170;

export interface Blip {
  x: number;
  y: number;
  kind: MarkKind;
}

/** The plan of the room she is in, when there is one. Rows run south to north. */
export interface DialPlan {
  readonly rows: readonly string[];
  /** World units per cell. */
  readonly cell: number;
  /** Which column the ley vein runs down. */
  readonly leyCellX: number;
}

export interface PanelState {
  spellName: string;
  runes: readonly Sprite[];
  selectedRune: number;
  /** 0..1. */
  lifeforce: number;
  gems: readonly boolean[];
  carried: readonly string[];
  /** Where she stands and which way she looks. The dial is heading-up. */
  cam: { x: number; y: number; yaw: number };
  /** Everything near enough to be worth a mark. */
  blips: readonly Blip[];
  /** Set indoors; the dial draws the room instead of the moor. */
  plan?: DialPlan;
}

export function drawText(
  s: Screen,
  str: string,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  let cx = x;
  for (const ch of str) {
    const g = glyph(ch, colour);
    if (g) {
      s.blit(g, cx, y, scale);
      cx += (g.w + 1) * scale;
    } else {
      cx += 4 * scale;
    }
  }
}

/** Black panel with a cool Spectrum border and bright corner pins. */
export function drawWindow(
  s: Screen,
  x: number,
  y: number,
  w: number,
  h: number,
  ink = B,
): void {
  s.rect(x, y, w, h, K);
  s.rect(x, y, w, 1, ink);
  s.rect(x, y + h - 1, w, 1, ink);
  s.rect(x, y, 1, h, ink);
  s.rect(x + w - 1, y, 1, h, ink);
  s.px(x, y, BW);
  s.px(x + w - 1, y, BW);
  s.px(x, y + h - 1, BW);
  s.px(x + w - 1, y + h - 1, BW);
}

const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** Compass point for a yaw. Yaw 0 faces north; the area map draws it. */
export function headingOf(yaw: number): string {
  const turn = Math.PI * 2;
  const a = ((yaw % turn) + turn) % turn;
  return POINTS[Math.round(a / (Math.PI / 4)) % 8];
}

// ------------------------------------------------------------------- dial

/**
 * Thirty-two pixels square, inset in its own window in the corner. Both
 * origins are EVEN on purpose: every texture below is screen-anchored and
 * tested on sums of px and py, so from an odd corner a two-step scan gives an
 * odd sum at every sample and the dither silently draws nothing at all.
 */
const DIAL = { x: 218, y: 156, size: 32 };

/**
 * Half the horizontal field of view. The renderer's focal length is 110 and
 * the screen is 256 across, so the window spans a little under a right angle.
 * The dial ticks the same wedge at its rim — enough to tell a blip she can
 * see from one at her back, without ruling an X across a 32-pixel dial.
 */
const HALF_FOV = Math.atan(128 / 110);

/** The four sides of a pixel, hoisted so a blip pass allocates nothing. */
const CROSS = [
  [0, -1],
  [-1, 0],
  [1, 0],
  [0, 1],
] as const;

/**
 * Heading-up: the world turns under a fixed needle, so left on the dial is
 * left through the window with no mental arithmetic while something is
 * charging at you. Screen up is her forward (sin yaw, cos yaw) and screen
 * right is that turned a quarter clockwise, (cos yaw, -sin yaw).
 */
function drawDial(s: Screen, p: PanelState): void {
  const { x, y, size } = DIAL;
  const half = size / 2;
  const cx = x + (size >> 1);
  const cy = y + (size >> 1);
  const range = p.plan ? PLAN_RANGE : RADAR_RANGE;
  const sin = Math.sin(p.cam.yaw);
  const cos = Math.cos(p.cam.yaw);
  const perUnit = half / range;

  s.rect(x, y, size, size, K);

  /** World point to dial pixel. */
  const toDial = (wx: number, wy: number) => {
    const rx = wx - p.cam.x;
    const ry = wy - p.cam.y;
    return {
      px: cx + Math.round((rx * cos - ry * sin) * perUnit),
      py: cy - Math.round((rx * sin + ry * cos) * perUnit),
    };
  };
  const inside = (px: number, py: number) =>
    px >= x && px < x + size && py >= y && py < y + size;

  if (p.plan) drawRoom(s, p.plan, p, cx, cy, sin, cos, range);
  else drawGround(s, p, cx, cy, sin, cos, range);

  // The edge of what she can see, ticked at the rim only. Drawn full length
  // it ruled an X across the dial and read as two more things in the world.
  for (let side = -1; side <= 1; side += 2) {
    const wx = Math.sin(HALF_FOV) * side;
    const wy = -Math.cos(HALF_FOV);
    for (let i = half - 3; i <= half + 5; i++) {
      const px = cx + Math.round(wx * i);
      const py = cy + Math.round(wy * i);
      if (inside(px, py)) s.px(px, py, B);
    }
  }

  // Every mark is bedded on black first: a cyan friend on the ley thread, or
  // a green way on the woodland stipple, is no mark at all.
  for (const b of p.blips) {
    const { px, py } = toDial(b.x, b.y);
    const ink = MARK_INK[b.kind];
    if (b.kind === "foe") {
      // Threats read heavier than everything else without spending a second
      // ink: a two-pixel block on a cleared field.
      for (let dy = -1; dy <= 2; dy++) {
        for (let dx = -1; dx <= 2; dx++) {
          if (inside(px + dx, py + dy)) s.px(px + dx, py + dy, K);
        }
      }
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          if (inside(px + dx, py + dy)) s.px(px + dx, py + dy, ink);
        }
      }
    } else {
      // One pixel, cleared on its four sides only. A full field is three
      // cells wide indoors, and rubbed out the lit way-out it stands on.
      for (const [dx, dy] of CROSS) {
        if (inside(px + dx, py + dy)) s.px(px + dx, py + dy, K);
      }
      if (inside(px, py)) s.px(px, py, ink);
    }
  }

  // Her, at the centre, in the map's magenta — the one ink that means "you"
  // on both instruments — with a stalk up the dial for the way she faces.
  s.rect(cx - 1, cy - 1, 3, 3, K);
  for (let i = 1; i <= 3; i++) s.px(cx, cy - i, BM);
  s.px(cx, cy, BW);
}

/**
 * The moor, in the three bands the terrain has: dead wood west, open ground
 * down the middle carrying the leyline, living greenwood east. The two woods
 * take the chart's own recipe at the chart's own densities, so a glance at
 * the dial and a glance at the map agree about which side the trees are on.
 */
function drawGround(
  s: Screen,
  p: PanelState,
  cx: number,
  cy: number,
  sin: number,
  cos: number,
  range: number,
): void {
  const { x, y, size } = DIAL;
  const half = size / 2;
  // On the two-pixel grid the chart uses. Sampled every pixel instead, these
  // moduli stop being a scatter and resolve into diagonal stripes.
  for (let py = y; py < y + size; py += 2) {
    for (let px = x; px < x + size; px += 2) {
      // Invert the heading-up rotation to ask what is under this pixel.
      const side = ((px - cx) / half) * range;
      const along = ((cy - py) / half) * range;
      const wx = p.cam.x + side * cos + along * sin;
      const wy = p.cam.y - side * sin + along * cos;
      // One term of fray, not the chart's two: eighteen world units to the
      // pixel here, so a treeline's wander is worth a pixel or two at most.
      const edge = Math.sin(wy * 0.011) * 46;
      if (wx < DEAD_WOOD_X + edge) {
        // Dying, so: dim, sparse, and never bright.
        if ((px * 3 + py) % 12 === 0) s.px(px, py, G);
      } else if (wx > GREENWOOD_X + edge) {
        // Living, so: the same scatter at full strength, lit with growth.
        if ((px * 3 + py) % 6 === 0) s.px(px, py, G);
        else if ((px * 5 + py) % 14 === 0) s.px(px, py, BG);
      }
    }
  }

  // The leyline, the road she travels, running north along world x = 0. Half
  // its pixels, so it reads as a thread laid over the ground rather than as a
  // cyan bar cutting the dial in two.
  const rx = -p.cam.x;
  for (let ry = -range; ry <= range; ry += 3) {
    const px = cx + Math.round(((rx * cos - ry * sin) * half) / range);
    const py = cy - Math.round(((rx * sin + ry * cos) * half) / range);
    if (((px + py) & 1) === 0 && px >= x && px < x + size && py >= y && py < y + size) {
      s.px(px, py, C);
    }
  }
}

/**
 * The room she is standing in: floor as a dim field, stone left black, the
 * way out lit, and the ley vein down the floor she can see underfoot. Drawn
 * by asking each pixel which cell it lands in, so it turns with the heading
 * like everything else on the dial.
 */
function drawRoom(
  s: Screen,
  plan: DialPlan,
  p: PanelState,
  cx: number,
  cy: number,
  sin: number,
  cos: number,
  range: number,
): void {
  const { x, y, size } = DIAL;
  const half = size / 2;
  for (let py = y; py < y + size; py++) {
    for (let px = x; px < x + size; px++) {
      const side = ((px - cx) / half) * range;
      const along = ((cy - py) / half) * range;
      const wx = p.cam.x + side * cos + along * sin;
      const wy = p.cam.y - side * sin + along * cos;
      const gx = Math.floor(wx / plan.cell);
      const gy = Math.floor(wy / plan.cell);
      if (gy < 0 || gy >= plan.rows.length || gx < 0) continue;
      const ch = plan.rows[gy].charAt(gx);
      if (ch === "" || ch === "#") continue;
      // The way out solid, everything else a half-tone. As slabs the floor
      // swallowed the marks standing on it and the ley vein read as a river.
      if (ch === "X") s.px(px, py, BY);
      else if (((px + py) & 1) === 0) {
        s.px(px, py, gx === plan.leyCellX ? C : B);
      }
    }
  }
}

// --------------------------------------------------------------- trinkets

function drawGems(s: Screen, x: number, y: number, lit: readonly boolean[]): void {
  for (let i = 0; i < lit.length; i++) {
    const gx = x + i * 6;
    s.px(gx + 2, y, M);
    s.px(gx, y + 2, M);
    s.px(gx + 4, y + 2, M);
    s.px(gx + 2, y + 4, M);
    if (lit[i]) {
      s.rect(gx + 1, y + 1, 3, 3, M);
      s.px(gx + 2, y + 2, BW);
    } else {
      s.px(gx + 1, y + 1, M);
      s.px(gx + 3, y + 1, M);
      s.px(gx + 1, y + 3, M);
      s.px(gx + 3, y + 3, M);
    }
  }
}

/** Tiny inventory marks sit under the gems without changing the HUD grid. */
function drawCarried(s: Screen, x: number, y: number, carried: readonly string[]): void {
  let cx = x;
  for (const item of carried.slice(0, 2)) {
    if (item === "TORC") {
      s.rect(cx + 1, y, 4, 1, Y);
      s.px(cx, y + 1, BY);
      s.px(cx + 5, y + 1, BY);
      s.px(cx + 2, y + 3, Y);
      s.px(cx + 3, y + 3, Y);
      cx += 8;
    } else {
      s.rect(cx + 1, y, 3, 1, W);
      s.px(cx, y + 1, W);
      s.px(cx + 4, y + 1, W);
      s.rect(cx + 2, y + 2, 1, 4, W);
      s.px(cx + 3, y + 3, W);
      cx += 7;
    }
  }
}

/**
 * The reference composition, with the right-hand corner given back to the
 * dial: spell name on the left, four runes across the middle, then the
 * lifeforce rail with the gems and what she carries stacked at its end.
 */
export function drawPanel(s: Screen, p: PanelState): void {
  s.rect(0, HUD_TOP, SCREEN_W, 40, K);
  s.rect(0, HUD_TOP, SCREEN_W, 1, BC);
  s.rect(0, 191, SCREEN_W, 1, BC);
  s.rect(0, HUD_TOP, 1, 40, C);
  s.rect(SCREEN_W - 1, HUD_TOP, 1, 40, C);
  s.rect(0, HUD_TOP + 1, SCREEN_W, 1, B);
  s.rect(0, 190, SCREEN_W, 1, B);

  for (const x of [0, SCREEN_W - 2]) {
    s.rect(x, HUD_TOP, 2, 2, BW);
    s.rect(x, 190, 2, 2, BW);
  }

  drawWindow(s, 3, 154, 133, 20, B);
  s.px(7, 162, BC);
  s.px(6, 163, C);
  s.px(8, 163, C);
  s.px(7, 164, BC);
  drawText(s, p.spellName, 12, 159, 2, BY);

  for (let i = 0; i < p.runes.length && i < 4; i++) {
    const bx = 139 + i * 18;
    const selected = i === p.selectedRune;
    drawWindow(s, bx, 154, 17, 20, selected ? BC : B);
    s.blit(p.runes[i], bx + 5, 159);
    if (selected) s.rect(bx + 5, 171, 7, 1, BW);
  }

  drawText(s, "LIFEFORCE", 4, 179, 1, W);
  s.rect(52, 177, 134, 12, K);
  s.rect(52, 177, 134, 1, W);
  s.rect(52, 188, 134, 1, W);
  s.rect(52, 177, 1, 12, W);
  s.rect(185, 177, 1, 12, W);
  s.rect(54, 179, 130, 1, B);

  const segments = 13;
  const filled = Math.max(0, Math.min(segments, p.lifeforce * segments));
  for (let i = 0; i < segments; i++) {
    const sx = 54 + i * 10;
    if (i + 1 <= filled) {
      s.rect(sx, 181, 8, 6, G);
      s.rect(sx, 181, 8, 1, BG);
    } else if (i < filled) {
      for (let py = 0; py < 6; py++) {
        for (let px = 0; px < 8; px++) {
          if (((px + py) & 1) === 0) s.px(sx + px, 181 + py, G);
        }
      }
    } else {
      s.rect(sx, 181, 8, 1, B);
    }
  }

  drawGems(s, 191, 177, p.gems);
  drawCarried(s, 191, 183, p.carried);

  drawWindow(s, 216, 154, 36, 36, B);
  drawDial(s, p);
}
