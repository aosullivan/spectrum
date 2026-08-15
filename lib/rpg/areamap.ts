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
  GREENWOOD_X,
  GROVE_POS,
  HENGE_POS,
  HERMITAGE_POS,
  KEEP_POS,
  DEAD_WOOD_X,
  VILLAGE_POS,
} from "@/lib/rpg/world";

/**
 * The charted region. Beyond it the map has nothing to say — and it says so
 * by stopping: the land is drawn only inside CHART, and the margins left
 * over in VIEW are blank, holding the place names that overhang the edge.
 * The south edge reaches past the spawn, so she is never off her own map.
 */
const CHART = { x0: -780, x1: 1000, y0: -60, y1: 1580 };

/** Where the chart may be drawn. Wider than the land, for the labels. */
const VIEW = { x: 14, y: 26, w: 228, h: 142 };

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
 * `side` turns a label back towards the middle of the chart at the two
 * extremes — the henge is the easternmost place and the hermitage the
 * westernmost, so each labels inward or its name runs off the paper.
 */
const PLACES = [
  { pos: KEEP_POS, name: "THE KEEP", side: 1, dy: 0, built: true },
  { pos: VILLAGE_POS, name: "THE VILLAGE", side: 1, dy: 0, built: true },
  // The hermitage and the henge sit on opposite edges at nearly the same
  // latitude, and their names reach towards each other; drop one a row.
  { pos: HENGE_POS, name: "THE HENGE", side: -1, dy: 0, built: false },
  { pos: HERMITAGE_POS, name: "THE HERMITAGE", side: 1, dy: 5, built: true },
  { pos: GROVE_POS, name: "THE GROVE", side: 1, dy: 0, built: false },
  { pos: CIRCLE_POS, name: "STONE CIRCLE", side: -1, dy: 0, built: false },
];

/** The chart's own rectangle on screen, centred in the wider VIEW. */
const EDGE = {
  x0: Math.round(VIEW.x + VIEW.w / 2 - ((CHART.x1 - CHART.x0) * SCALE) / 2),
  x1: Math.round(VIEW.x + VIEW.w / 2 + ((CHART.x1 - CHART.x0) * SCALE) / 2),
  y0: Math.round(VIEW.y + VIEW.h / 2 - ((CHART.y1 - CHART.y0) * SCALE) / 2),
  y1: Math.round(VIEW.y + VIEW.h / 2 + ((CHART.y1 - CHART.y0) * SCALE) / 2),
};

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

  // The land, in the three bands the terrain actually has: dead wood west,
  // open moor down the middle carrying the leyline, living greenwood east.
  // Charting only the western trees was what made the map look half empty —
  // one solid block of texture on the left and bare paper everywhere else.
  // Every pattern below is screen-anchored and tested on (px + py), so the
  // scan has to start on an even pixel: from an odd corner the sum is odd
  // everywhere and each dither silently draws nothing at all.
  const step = 2;
  const cx = VIEW.x + VIEW.w / 2;
  const cy = VIEW.y + VIEW.h / 2;
  for (let py = EDGE.y0 + (EDGE.y0 & 1); py < EDGE.y1; py += step) {
    for (let px = EDGE.x0 + (EDGE.x0 & 1); px < EDGE.x1; px += step) {
      // Invert the plot to ask what is at this pixel.
      const wx = (CHART.x0 + CHART.x1) / 2 + (px - cx) / SCALE;
      const wy = (CHART.y0 + CHART.y1) / 2 - (py - cy) / SCALE;

      // The sacred grove reads as canopy dense enough to be a place, not
      // just more trees: it is the only solid green on the chart.
      if (Math.hypot(wx - GROVE_POS.x, wy - GROVE_POS.y) < 190) {
        if ((px + py) % 4 === 0) s.px(px, py, BG);
        else if ((px + py) % 2 === 0) s.px(px, py, G);
        continue;
      }

      // A treeline is not a ruled boundary; fray both of them.
      const fray = Math.sin(wy * 0.011) * 46 + Math.sin(wy * 0.031) * 22;
      const east = Math.sin(wy * 0.009) * 40 + Math.sin(wy * 0.027) * 26;

      if (wx < DEAD_WOOD_X + fray) {
        // Two glades hold the western places open. Without them the wood
        // closes over the stones and the hut and they read as marks
        // floating on texture rather than clearings you can walk into.
        if (Math.hypot(wx - CIRCLE_POS.x, wy - CIRCLE_POS.y) < 150) continue;
        if (Math.hypot(wx - HERMITAGE_POS.x, wy - HERMITAGE_POS.y) < 170) {
          continue;
        }
        // Dying, so: dim, sparse, and thinning as it meets the moor.
        const deep = (DEAD_WOOD_X + fray - wx) / 170;
        if ((px * 3 + py) % 6 === 0 && (deep > 1 || (px + py) % 4 === 0)) {
          s.px(px, py, G);
        }
      } else if (wx > GREENWOOD_X + east) {
        // Living, so: the same scatter at full strength, lit with bright
        // growth. A regular lattice here fills in as a solid green slab and
        // swallows the grove, which has to stay the densest thing charted.
        if (Math.hypot(wx - HENGE_POS.x, wy - HENGE_POS.y) < 150) continue;
        if ((px * 3 + py) % 6 === 0) s.px(px, py, G);
        else if ((px * 5 + py) % 14 === 0) s.px(px, py, BG);
      }
    }
  }

  // Corner ticks marking where the surveyed land stops. A full box would
  // fight the window frame; the corners say "edge of the chart" quietly.
  for (const [ex, ey, sx, sy] of [
    [EDGE.x0, EDGE.y0, 1, 1],
    [EDGE.x1, EDGE.y0, -1, 1],
    [EDGE.x0, EDGE.y1, 1, -1],
    [EDGE.x1, EDGE.y1, -1, -1],
  ] as const) {
    for (let i = 0; i < 7; i++) {
      s.px(ex + sx * i, ey, B);
      s.px(ex, ey + sy * i, B);
    }
  }

  // The leyline, the road she travels: bright, running north to the keep.
  for (let wy = CHART.y0; wy <= KEEP_POS.y; wy += 4) {
    const { px, py } = plot(0, wy);
    s.px(px, py, BC);
    if (wy % 40 < 4) s.px(px + 1, py, C);
  }

  // Places, and their names. Labels may overhang the land into the margins,
  // which is what the margins are for; they clamp to VIEW, not to the chart.
  // Mark and name both sit on cleared paper — white line-work laid straight
  // over the woodland dither is unreadable at this size — and every clearing
  // is cut before anything is written into any of them, because interleaved
  // one place's mark erases the middle of its neighbour's name.
  const laid = PLACES.map((p) => {
    const { px, py } = plot(p.pos.x, p.pos.y);
    const width = textWidth(p.name, 1);
    return {
      ...p,
      px,
      py,
      width,
      lx:
        p.side > 0
          ? Math.min(px + 6, VIEW.x + VIEW.w - width)
          : Math.max(px - 6 - width, VIEW.x),
      ly: py + 4 + p.dy,
    };
  });
  for (const p of laid) {
    s.rect(p.px - 5, p.py - 7, 11, 12, K);
    s.rect(p.lx - 2, p.ly - 1, p.width + 4, 7, K);
  }
  for (const p of laid) {
    drawPlaceMark(s, p.px, p.py, p.built);
    drawText(s, p.name, p.lx, p.ly, 1, BW);
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
    // Inside the chart on a cleared strip. Below it lay on top of the
    // legend, which put two lines of text through each other.
    const away = Math.round(
      Math.hypot(cam.x - clampedX, cam.y - clampedY),
    );
    const note = `${away} BEYOND THE CHART`;
    const width = textWidth(note, 1);
    s.rect(EDGE.x0 + 1, EDGE.y1 - 9, width + 4, 8, K);
    drawText(s, note, EDGE.x0 + 3, EDGE.y1 - 8, 1, BY);
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
