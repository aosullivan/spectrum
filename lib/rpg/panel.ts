// The control panel: the mage's instruments. Forty rows at the foot of the
// screen holding her spell, her runes, her lifeforce, what she carries,
// where she is — and a heading-up radar of what is near.
//
// The panel is drawn AFTER the attribute pass, so unlike the world it is
// exempt from the two-colours-per-cell rule and may use the full palette.

import { glyph } from "@/lib/rpg/assets";
import {
  B,
  BC,
  BG,
  BR,
  BW,
  BY,
  C,
  G,
  K,
  M,
  W,
  Y,
} from "@/lib/rpg/palette";
import { HUD_TOP, SCREEN_W, type Screen, type Sprite } from "@/lib/rpg/screen";

/** How far the radar sees, in world units — about two screens of moor. */
export const RADAR_RANGE = 290;

export interface Blip {
  x: number;
  y: number;
  hostile: boolean;
}

export interface PanelState {
  spellName: string;
  runes: readonly Sprite[];
  selectedRune: number;
  /** 0..1. */
  lifeforce: number;
  gems: readonly boolean[];
  /** What she is carrying, as short names — "TORC", "IRON KEY". */
  carried: readonly string[];
  /** Where she is, named: THE MOOR, THE KEEP, ANCIENT WOODS. */
  place: string;
  /** Camera position and facing, for the radar. */
  x: number;
  y: number;
  yaw: number;
  /** Everything alive near enough to matter. */
  blips: readonly Blip[];
  /**
   * Indoors the radar becomes a room plan instead of a compass rose:
   * the grid, the cell size, and nothing else.
   */
  plan?: { rows: readonly string[]; cell: number };
}

// ------------------------------------------------------------- primitives

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

/** A framed window in the established manner: black field, bright corners. */
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

/** Compass point for a yaw. Yaw 0 faces north. */
export function headingOf(yaw: number): string {
  const turn = Math.PI * 2;
  const a = ((yaw % turn) + turn) % turn;
  return POINTS[Math.round(a / (Math.PI / 4)) % 8];
}

// ------------------------------------------------------------------ radar

/**
 * Heading-up radar. The world is rotated by the mage's facing so that "up"
 * is always the way she is looking — left on the dial is left through the
 * window, with no mental arithmetic while something is charging at you.
 */
function drawRadar(
  s: Screen,
  x0: number,
  y0: number,
  size: number,
  p: PanelState,
): void {
  const half = size / 2;
  const cx = x0 + Math.floor(half);
  const cy = y0 + Math.floor(half);
  s.rect(x0, y0, size, size, K);

  // Rotate by -yaw: turning right swings the world left under the needle.
  const sin = Math.sin(-p.yaw);
  const cos = Math.cos(-p.yaw);
  const toDial = (wx: number, wy: number) => {
    const rx = wx - p.x;
    const ry = wy - p.y;
    return {
      px: cx + Math.round(((rx * cos - ry * sin) / RADAR_RANGE) * half),
      py: cy - Math.round(((rx * sin + ry * cos) / RADAR_RANGE) * half),
    };
  };
  const inside = (px: number, py: number) =>
    px >= x0 && px < x0 + size && py >= y0 && py < y0 + size;

  if (p.plan) {
    // Indoors: draw the room plan she is standing in, walls as dim blocks.
    const { rows, cell } = p.plan;
    const scale = 3;
    const originX = cx - Math.round((p.x / cell) * scale);
    const originY = cy - Math.round((p.y / cell) * scale);
    for (let ry = 0; ry < rows.length; ry++) {
      for (let rx = 0; rx < rows[ry].length; rx++) {
        const ch = rows[ry].charAt(rx);
        if (ch === "#") continue;
        const px = originX + rx * scale;
        const py = originY + ry * scale;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            if (inside(px + dx, py + dy)) {
              s.px(px + dx, py + dy, ch === "X" ? BY : B);
            }
          }
        }
      }
    }
  } else {
    // The leyline runs north along world x = 0; sample it as a thread.
    for (let d = -RADAR_RANGE; d <= RADAR_RANGE; d += 2) {
      const { px, py } = toDial(0, p.y + d);
      if (inside(px, py)) s.px(px, py, C);
    }
  }

  for (const b of p.blips) {
    if (Math.abs(b.x - p.x) > RADAR_RANGE || Math.abs(b.y - p.y) > RADAR_RANGE) {
      continue;
    }
    const { px, py } = toDial(b.x, b.y);
    if (!inside(px, py)) continue;
    if (b.hostile) {
      // Threats read heavier than friends, without needing a second ink.
      s.px(px, py, BR);
      if (inside(px + 1, py)) s.px(px + 1, py, BR);
      if (inside(px, py + 1)) s.px(px, py + 1, BR);
      if (inside(px + 1, py + 1)) s.px(px + 1, py + 1, BR);
    } else {
      s.px(px, py, BC);
    }
  }

  // The mage at the centre, with the way she is facing drawn up the dial.
  for (let i = 1; i <= 4; i++) if (inside(cx, cy - i)) s.px(cx, cy - i, i > 2 ? W : BW);
  s.px(cx, cy, BW);
  s.px(cx - 1, cy, BW);
  s.px(cx + 1, cy, BW);
  s.px(cx, cy + 1, BW);
}

// -------------------------------------------------------------- trinkets

function drawGems(s: Screen, x: number, y: number, lit: readonly boolean[]): void {
  for (let i = 0; i < lit.length; i++) {
    const gx = x + i * 6;
    if (lit[i]) {
      s.px(gx + 2, y, M);
      s.rect(gx + 1, y + 1, 3, 1, M);
      s.px(gx + 2, y + 1, BW);
      s.px(gx + 2, y + 2, M);
      s.px(gx, y + 1, M);
      s.px(gx + 4, y + 1, M);
    } else {
      s.px(gx + 2, y, M);
      s.px(gx, y + 1, M);
      s.px(gx + 4, y + 1, M);
      s.px(gx + 2, y + 2, M);
    }
  }
}

/** Small glyphs for what she carries — inert until now, and it showed. */
function drawCarried(s: Screen, x: number, y: number, carried: readonly string[]): void {
  let cx = x;
  for (const item of carried) {
    if (item === "TORC") {
      s.rect(cx + 1, y, 4, 1, Y);
      s.px(cx, y + 1, BY);
      s.px(cx + 5, y + 1, BY);
      s.px(cx, y + 2, Y);
      s.px(cx + 5, y + 2, Y);
      s.px(cx + 2, y + 3, Y);
      s.px(cx + 3, y + 3, Y);
      cx += 8;
    } else {
      // A key, and the fallback for anything else she picks up.
      s.rect(cx + 1, y, 3, 1, W);
      s.px(cx, y + 1, W);
      s.px(cx + 4, y + 1, W);
      s.rect(cx + 2, y + 2, 1, 4, W);
      s.px(cx + 3, y + 3, W);
      s.px(cx + 3, y + 5, W);
      cx += 7;
    }
  }
}

// ------------------------------------------------------------------ panel

/**
 * Layout A: spell and runes across the top band, vitals and bearings across
 * the bottom, radar in the right corner where the eye rests between glances
 * at the road ahead.
 */
export function drawPanel(s: Screen, p: PanelState): void {
  s.rect(0, HUD_TOP, SCREEN_W, 40, K);
  s.rect(0, HUD_TOP, SCREEN_W, 1, W);
  s.rect(0, 191, SCREEN_W, 1, W);
  s.rect(0, HUD_TOP, 1, 40, W);
  s.rect(SCREEN_W - 1, HUD_TOP, 1, 40, W);
  s.rect(0, HUD_TOP + 1, SCREEN_W, 1, B);
  s.rect(0, 190, SCREEN_W, 1, B);

  // Current spell.
  drawWindow(s, 3, 154, 122, 17);
  drawText(s, p.spellName, 8, 159, 2, BY);

  // Rune quick-slots.
  for (let i = 0; i < p.runes.length && i < 4; i++) {
    const bx = 128 + i * 20;
    const chosen = i === p.selectedRune;
    drawWindow(s, bx, 154, 19, 17, chosen ? BC : B);
    s.blit(p.runes[i], bx + 6, 158);
    if (chosen) s.rect(bx + 6, 168, 7, 1, BW);
  }

  // Lifeforce.
  drawText(s, "LIFEFORCE", 3, 174, 1, W);
  const barW = 100;
  s.rect(3, 181, barW, 8, K);
  s.rect(3, 181, barW, 1, W);
  s.rect(3, 188, barW, 1, W);
  s.rect(3, 181, 1, 8, W);
  s.rect(2 + barW, 181, 1, 8, W);
  const inner = barW - 4;
  const on = Math.round(inner * Math.max(0, Math.min(1, p.lifeforce)));
  for (let i = 0; i < inner; i++) {
    const bx = 5 + i;
    if (i < on) {
      s.rect(bx, 183, 1, 5, G);
      s.px(bx, 183, BG);
    } else if (i < on + 3) {
      for (let k = 0; k < 5; k++) if ((i + k) % 2 === 0) s.px(bx, 183 + k, G);
    }
  }

  // Where she is, and which way she is looking.
  drawText(s, p.place, 108, 174, 1, BG);
  drawText(s, headingOf(p.yaw), 108, 183, 1, BC);

  drawGems(s, 176, 174, p.gems);
  drawCarried(s, 176, 182, p.carried);

  drawWindow(s, 213, 153, 40, 38, B);
  drawRadar(s, 215, 155, 36, p);
}
