// The control panel: a compact Dragontorc-style spell strip matching the
// Wraithlight reference frames. It is drawn after the attribute pass, so the
// full Spectrum palette remains available for crisp runes and status lights.

import { glyph } from "@/lib/rpg/assets";
import { B, BC, BG, BW, BY, C, G, K, M, W, Y } from "@/lib/rpg/palette";
import { HUD_TOP, SCREEN_W, type Screen, type Sprite } from "@/lib/rpg/screen";

/** Retained for the area-map and game-state instrument model. */
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
  carried: readonly string[];
  place: string;
  x: number;
  y: number;
  yaw: number;
  blips: readonly Blip[];
  plan?: { rows: readonly string[]; cell: number };
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

/** Compass point for a yaw. Yaw 0 faces north. */
export function headingOf(yaw: number): string {
  const turn = Math.PI * 2;
  const a = ((yaw % turn) + turn) % turn;
  return POINTS[Math.round(a / (Math.PI / 4)) % 8];
}

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

/** Tiny inventory marks sit before the gems without changing the HUD grid. */
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
 * The reference composition: spell name on the left, four runes across the
 * right, then one long lifeforce rail with gems at its end.
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
    const bx = 139 + i * 28;
    const selected = i === p.selectedRune;
    drawWindow(s, bx, 154, 26, 20, selected ? BC : B);
    s.blit(p.runes[i], bx + 9, 159);
    if (selected) s.rect(bx + 9, 171, 8, 1, BW);
  }

  drawText(s, "LIFEFORCE", 4, 179, 1, W);
  s.rect(52, 177, 176, 12, K);
  s.rect(52, 177, 176, 1, W);
  s.rect(52, 188, 176, 1, W);
  s.rect(52, 177, 1, 12, W);
  s.rect(227, 177, 1, 12, W);
  s.rect(54, 179, 172, 1, B);

  const segments = 17;
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

  drawCarried(s, 213, 182, p.carried);
  drawGems(s, 235, 181, p.gems);
}
