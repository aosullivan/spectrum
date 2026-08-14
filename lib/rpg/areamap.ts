// The AREA MAP: a chart of the known land, opened with M. Modal — the world
// stops while she reads it — fully revealed, and deliberately places-only.
// Creatures are the radar's business; this is where things ARE, not who is
// moving. A fixed chart, so the four places hold positions you can learn.

import { drawText, drawWindow } from "@/lib/rpg/panel";
import { textWidth } from "@/lib/rpg/assets";
import { B, BC, BG, BM, BW, BY, C, G, K, W } from "@/lib/rpg/palette";
import { SCREEN_H, SCREEN_W, type Screen } from "@/lib/rpg/screen";
import {
  CIRCLE_POS,
  GROVE_POS,
  HENGE_POS,
  KEEP_POS,
  WOODS_EDGE_X,
} from "@/lib/rpg/world";

/** The charted region. Beyond it the map has nothing to say. */
const CHART = { x0: -700, x1: 900, y0: 150, y1: 1550 };

/** Where the chart is drawn on screen. */
const VIEW = { x: 14, y: 26, w: 228, h: 150 };

const SCALE = Math.min(
  VIEW.w / (CHART.x1 - CHART.x0),
  VIEW.h / (CHART.y1 - CHART.y0),
);

/** World point to chart pixel. North (+y) is up, so the y axis inverts. */
function plot(wx: number, wy: number): { px: number; py: number } {
  const cx = VIEW.x + VIEW.w / 2;
  const cy = VIEW.y + VIEW.h / 2;
  const mx = (CHART.x0 + CHART.x1) / 2;
  const my = (CHART.y0 + CHART.y1) / 2;
  return {
    px: Math.round(cx + (wx - mx) * SCALE),
    py: Math.round(cy - (wy - my) * SCALE),
  };
}

/**
 * `side` pushes a label clear of its neighbours — the circle and the grove
 * sit close enough on the chart that both labels to the right collide.
 */
const PLACES = [
  { pos: KEEP_POS, name: "THE KEEP", side: 1, dy: 0 },
  { pos: CIRCLE_POS, name: "STONE CIRCLE", side: -1, dy: 0 },
  { pos: GROVE_POS, name: "THE GROVE", side: 1, dy: -6 },
  { pos: HENGE_POS, name: "THE HENGE", side: 1, dy: 0 },
];

/** A tower glyph for a built place; a ring of stones for the old ones. */
function drawPlaceMark(s: Screen, px: number, py: number, built: boolean): void {
  if (built) {
    s.rect(px - 3, py - 4, 7, 1, BW);
    s.px(px - 3, py - 5, BW);
    s.px(px - 1, py - 5, BW);
    s.px(px + 1, py - 5, BW);
    s.px(px + 3, py - 5, BW);
    s.rect(px - 2, py - 3, 5, 5, W);
    s.rect(px - 1, py - 1, 2, 2, K);
  } else {
    for (const [dx, dy] of [
      [0, -3],
      [3, -1],
      [2, 2],
      [-2, 2],
      [-3, -1],
    ]) {
      s.px(px + dx, py + dy, W);
      s.px(px + dx, py + dy - 1, BW);
    }
  }
}

/**
 * Draw the chart. `cam` is where she stands; her arrow pins to the border
 * with a marker if she has wandered off the edge of the known world.
 */
export function drawAreaMap(
  s: Screen,
  cam: { x: number; y: number; yaw: number },
  place: string,
): void {
  s.clear();

  // Frame and title.
  drawWindow(s, 4, 4, SCREEN_W - 8, SCREEN_H - 8, B);
  drawText(s, "AREA MAP", 12, 10, 2, BY);
  drawText(s, place, 150, 12, 1, BG);
  s.rect(12, 22, SCREEN_W - 24, 1, B);

  // The land: ancient woods west, the lush grove, moor between.
  const step = 2;
  for (let py = VIEW.y; py < VIEW.y + VIEW.h; py += step) {
    for (let px = VIEW.x; px < VIEW.x + VIEW.w; px += step) {
      // Invert the plot to ask what is at this pixel.
      const cx = VIEW.x + VIEW.w / 2;
      const cy = VIEW.y + VIEW.h / 2;
      const wx = (CHART.x0 + CHART.x1) / 2 + (px - cx) / SCALE;
      const wy = (CHART.y0 + CHART.y1) / 2 - (py - cy) / SCALE;
      const inGrove =
        Math.hypot(wx - GROVE_POS.x, wy - GROVE_POS.y) < 190;
      if (inGrove) {
        if ((px + py) % 4 === 0) s.px(px, py, BG);
        else if ((px + py) % 2 === 0) s.px(px, py, G);
      } else {
        // Dead woodland to the west: sparser and dimmer than the grove, and
        // with a ragged edge — a treeline is not a ruled boundary.
        const fray = Math.sin(wy * 0.011) * 46 + Math.sin(wy * 0.031) * 22;
        if (wx < WOODS_EDGE_X + fray && (px * 3 + py) % 6 === 0) {
          s.px(px, py, G);
        }
      }
    }
  }

  // The leyline, the road she travels: bright, running north to the keep.
  for (let wy = CHART.y0; wy <= KEEP_POS.y; wy += 4) {
    const { px, py } = plot(0, wy);
    s.px(px, py, BC);
    if (wy % 40 < 4) s.px(px + 1, py, C);
  }

  // Places, and their names.
  for (const p of PLACES) {
    const { px, py } = plot(p.pos.x, p.pos.y);
    drawPlaceMark(s, px, py, p.name === "THE KEEP");
    const width = textWidth(p.name, 1);
    const lx =
      p.side > 0
        ? Math.min(px + 6, VIEW.x + VIEW.w - width)
        : Math.max(px - 6 - width, VIEW.x);
    drawText(s, p.name, lx, py + 4 + p.dy, 1, BW);
  }

  // Her position — an arrow if she is on the chart, a pinned marker if not.
  const offX = cam.x < CHART.x0 || cam.x > CHART.x1;
  const offY = cam.y < CHART.y0 || cam.y > CHART.y1;
  const clampedX = Math.max(CHART.x0, Math.min(CHART.x1, cam.x));
  const clampedY = Math.max(CHART.y0, Math.min(CHART.y1, cam.y));
  const { px, py } = plot(clampedX, clampedY);
  const off = offX || offY;
  // Magenta: nothing else on the chart uses it, so she never disappears
  // into the white of a place mark or the green of the grove.
  const ink = off ? BY : BM;
  s.rect(px - 2, py - 2, 5, 5, K);
  s.rect(px - 1, py - 1, 3, 3, ink);
  s.px(px, py, BW);
  // A stalk showing which way she faces.
  const fx = Math.round(Math.sin(cam.yaw) * 5);
  const fy = -Math.round(Math.cos(cam.yaw) * 5);
  for (let i = 2; i <= 5; i++) {
    s.px(px + Math.round((fx * i) / 5), py + Math.round((fy * i) / 5), ink);
  }
  if (off) {
    const away = Math.round(
      Math.hypot(cam.x - clampedX, cam.y - clampedY),
    );
    drawText(s, `${away} BEYOND THE CHART`, VIEW.x, VIEW.y + VIEW.h + 2, 1, BY);
  }

  // Legend.
  const ly = SCREEN_H - 16;
  s.rect(12, ly - 4, SCREEN_W - 24, 1, B);
  s.rect(14, ly + 1, 3, 3, BM);
  drawText(s, "YOU", 20, ly, 1, W);
  s.px(48, ly + 2, BC);
  s.px(49, ly + 2, BC);
  drawText(s, "LEYLINE", 54, ly, 1, W);
  s.px(100, ly + 2, G);
  s.px(102, ly + 1, BG);
  drawText(s, "WOODS", 108, ly, 1, W);
  drawText(s, "M CLOSES", 190, ly, 1, BY);
}
