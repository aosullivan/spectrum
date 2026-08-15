// The AREA MAP, opened with M. Modal — the world stops while she reads it —
// and it shows one of two things depending on where she is standing.
//
// Outdoors it is a fixed chart of the known land, fully revealed, so the
// places hold positions you can learn. The chart's bounds contain everywhere
// she can walk: "beyond the chart" has to mean she has genuinely left the
// known world, not that she has not moved yet.
//
// Indoors it is the plan of the room she is in. The outdoor chart plotted
// with a room coordinate is nonsense — it pinned her to a corner and reported
// her seventy units off the edge of a country she was standing in the middle
// of.
//
// Both carry a compass and mark what is moving nearby, because the map is the
// only place in the game with the room to draw them, and the Seer sends you
// looking for a key in the east alcove.

import {
  drawText,
  drawWindow,
  headingOf,
  MARK_INK,
  type MarkKind,
} from "@/lib/rpg/panel";
import { textWidth } from "@/lib/rpg/assets";
import { B, BC, BG, BM, BR, BW, BY, C, G, K, W, Y } from "@/lib/rpg/palette";
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
 * over in VIEW are blank, holding the compass and the place names that
 * overhang the edge. The south edge reaches past the spawn, so she is never
 * off her own map.
 */
const CHART = { x0: -780, x1: 1000, y0: -60, y1: 1580 };

/** Where the chart may be drawn. Wider than the land, for the labels. */
const VIEW = { x: 14, y: 26, w: 228, h: 136 };

/**
 * One line under the chart, and the reason VIEW stops short of the legend.
 * The off-chart notice used to be drawn two pixels below the chart, which put
 * it straight through the legend; giving it a row of its own means no reading
 * of the map can ever put two lines of text on top of each other.
 */
const CAPTION_Y = 164;

/** The legend strip, and the rule above it. */
const LEGEND_Y = SCREEN_H - 16;

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

/** What a mark on the map stands for. Places are drawn separately. */
export type { MarkKind };

export interface MapMark {
  x: number;
  y: number;
  kind: MarkKind;
}

/** The plan of the room she is standing in, drawn instead of the land. */
export interface RoomPlan {
  /** Row strings: '#' solid, '.' floor, 'X' the way back out. */
  rows: readonly string[];
  /** World units per cell. */
  cell: number;
  /** Which column the ley vein runs down, so the plan matches the floor. */
  leyCellX: number;
}

export interface MapState {
  cam: { x: number; y: number; yaw: number };
  /** Where she is, named — the same caption the panel shows. */
  place: string;
  /** Living things and loose treasure near enough to be worth marking. */
  marks: readonly MapMark[];
  /** Set indoors. Absent outdoors, when the chart is drawn instead. */
  plan?: RoomPlan;
}

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
 * A creature or a loose item. Every mark is bedded on black first, for the
 * same reason the place names are: a cyan blip on the cyan leyline, or a
 * green one in the grove, is no mark at all.
 */
function drawMark(s: Screen, px: number, py: number, kind: MarkKind): void {
  s.rect(px - 2, py - 2, 5, 5, K);
  const ink = MARK_INK[kind];
  if (kind === "foe") {
    // A cross, so a hostile reads differently from everything else even
    // before you have worked out what the colours mean.
    s.rect(px - 1, py, 3, 1, ink);
    s.rect(px, py - 1, 1, 3, ink);
  } else {
    s.rect(px - 1, py - 1, 3, 3, ink);
    s.px(px, py, BW);
  }
}

/** Her arrow: a body, and a stalk showing which way she faces. */
function drawHero(
  s: Screen,
  px: number,
  py: number,
  yaw: number,
  ink: number,
): void {
  s.rect(px - 2, py - 2, 5, 5, K);
  s.rect(px - 1, py - 1, 3, 3, ink);
  s.px(px, py, BW);
  const fx = Math.sin(yaw) * 5;
  const fy = -Math.cos(yaw) * 5;
  for (let i = 2; i <= 5; i++) {
    s.px(px + Math.round((fx * i) / 5), py + Math.round((fy * i) / 5), ink);
  }
}

// ------------------------------------------------------------------ compass

const ROSE = { x: 31, y: 46, r: 9 };

/**
 * A compass in the chart's left margin. It is here because the game asks for
 * it — the Seer will tell you there is a key in the east alcove, and until
 * now nothing on screen could tell you which way east was.
 */
function drawCompass(s: Screen, yaw: number): void {
  for (let a = 0; a < 32; a++) {
    const t = (a / 32) * Math.PI * 2;
    s.px(
      ROSE.x + Math.round(Math.sin(t) * ROSE.r),
      ROSE.y - Math.round(Math.cos(t) * ROSE.r),
      a % 8 === 0 ? W : B,
    );
  }
  drawText(s, "N", ROSE.x - 2, ROSE.y - ROSE.r - 7, 1, BY);
  drawText(s, "S", ROSE.x - 2, ROSE.y + ROSE.r + 3, 1, W);
  drawText(s, "E", ROSE.x + ROSE.r + 3, ROSE.y - 2, 1, W);
  drawText(s, "W", ROSE.x - ROSE.r - 8, ROSE.y - 2, 1, W);

  // The needle, in her own colour, so the map has one thing that means "you".
  const fx = Math.sin(yaw);
  const fy = -Math.cos(yaw);
  for (let i = 0; i <= ROSE.r - 2; i++) {
    s.px(ROSE.x + Math.round(fx * i), ROSE.y + Math.round(fy * i), BM);
    if (i > 2) s.px(ROSE.x - Math.round(fx * i), ROSE.y - Math.round(fy * i), B);
  }
  s.px(ROSE.x, ROSE.y, BW);
}

// -------------------------------------------------------------------- chart

/**
 * The land, in the three bands the terrain actually has: dead wood west, open
 * moor down the middle carrying the leyline, living greenwood east. Charting
 * only the western trees was what made the map look half empty — one solid
 * block of texture on the left and bare paper everywhere else.
 *
 * Every pattern below is screen-anchored and tested on (px + py), so the scan
 * has to start on an even pixel: from an odd corner the sum is odd everywhere
 * and each dither silently draws nothing at all.
 */
function drawLand(s: Screen): void {
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
}

function drawChart(s: Screen, state: MapState): void {
  drawLand(s);

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

  for (const mark of state.marks) {
    if (
      mark.x < CHART.x0 ||
      mark.x > CHART.x1 ||
      mark.y < CHART.y0 ||
      mark.y > CHART.y1
    ) {
      continue;
    }
    const { px, py } = plot(mark.x, mark.y);
    drawMark(s, px, py, mark.kind);
  }

  // Her position — an arrow if she is on the chart, a pinned marker if not.
  const { cam } = state;
  const off =
    cam.x < CHART.x0 || cam.x > CHART.x1 || cam.y < CHART.y0 || cam.y > CHART.y1;
  const clampedX = Math.max(CHART.x0, Math.min(CHART.x1, cam.x));
  const clampedY = Math.max(CHART.y0, Math.min(CHART.y1, cam.y));
  const { px, py } = plot(clampedX, clampedY);
  // Magenta: nothing else on the chart uses it, so she never disappears into
  // the white of a place mark or the green of the grove. Yellow if she has
  // left the chart, because then the arrow is a pin, not a position.
  drawHero(s, px, py, cam.yaw, off ? BY : BM);

  if (off) {
    const away = Math.round(Math.hypot(cam.x - clampedX, cam.y - clampedY));
    drawText(s, `${away} BEYOND THE CHART`, VIEW.x, CAPTION_Y, 1, BY);
  } else {
    drawText(
      s,
      `EAST ${Math.round(cam.x)}   NORTH ${Math.round(cam.y)}`,
      VIEW.x,
      CAPTION_Y,
      1,
      G,
    );
  }
}

// --------------------------------------------------------------------- plan

/**
 * The room she is standing in, north up like the chart, so the compass means
 * the same thing on both. Grid row 0 is the low-y (southern) edge of the
 * plan, so it is drawn at the BOTTOM.
 */
function drawPlan(s: Screen, state: MapState, plan: RoomPlan): void {
  const cols = Math.max(...plan.rows.map((r) => r.length));
  const rows = plan.rows.length;
  const size = Math.max(4, Math.min(VIEW.w / cols, VIEW.h / rows) | 0);
  const x0 = VIEW.x + ((VIEW.w - cols * size) >> 1);
  const y0 = VIEW.y + ((VIEW.h - rows * size) >> 1);

  /** Top-left of grid cell (cx, cy), with row 0 at the bottom. */
  const cellAt = (cx: number, cy: number) => ({
    px: x0 + cx * size,
    py: y0 + (rows - 1 - cy) * size,
  });
  /** Room world units to screen, sharing the plan's north-up orientation. */
  const place = (wx: number, wy: number) => ({
    px: Math.round(x0 + (wx / plan.cell) * size),
    py: Math.round(y0 + rows * size - (wy / plan.cell) * size),
  });

  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const ch = plan.rows[cy].charAt(cx) || "#";
      const { px, py } = cellAt(cx, cy);
      if (ch === "#") {
        // Stone, as a quarter-tone lattice. A half-tone reads as the subject
        // of the drawing; the room is the subject and the stone is its border.
        // A square lattice, not a diagonal one — anything on a diagonal at
        // this size resolves into stripes.
        for (let y = py; y < py + size; y += 2) {
          for (let x = px; x < px + size; x += 2) s.px(x, y, W);
        }
      } else {
        // Floor: a dim joint at each corner, so the room reads as flagged
        // ground rather than as a hole in the drawing.
        s.px(px, py, B);
        s.px(px + size - 1, py, B);
        s.px(px, py + size - 1, B);
        s.px(px + size - 1, py + size - 1, B);
        if (ch === "X") {
          s.rect(px + 2, py + 2, size - 4, size - 4, BY);
          s.rect(px + 3, py + 3, size - 6, size - 6, Y);
        }
      }
    }
  }

  // The ley vein down the floor, the one thing she can see underfoot and on
  // the plan at the same time. It runs the open floor only — it is a light in
  // the flags, not a wire through the walls.
  const vein = x0 + Math.round((plan.leyCellX + 0.5) * size);
  for (let cy = 0; cy < rows; cy++) {
    if (plan.rows[cy].charAt(plan.leyCellX) === "#") continue;
    const { py } = cellAt(plan.leyCellX, cy);
    for (let y = py; y < py + size; y += 2) s.px(vein, y, BC);
  }

  for (const mark of state.marks) {
    const { px, py } = place(mark.x, mark.y);
    drawMark(s, px, py, mark.kind);
  }

  const { px, py } = place(state.cam.x, state.cam.y);
  drawHero(s, px, py, state.cam.yaw, BM);
}

// -------------------------------------------------------------------- frame

/** One swatch and its word in the legend strip. */
function legendItem(
  s: Screen,
  x: number,
  label: string,
  draw: (sx: number) => void,
): void {
  draw(x);
  drawText(s, label, x + 6, LEGEND_Y, 1, W);
}

export function drawAreaMap(s: Screen, state: MapState): void {
  s.clear();

  drawWindow(s, 4, 4, SCREEN_W - 8, SCREEN_H - 8, B);
  drawText(s, "AREA MAP", 12, 10, 2, BY);
  drawText(s, state.place, SCREEN_W - 12 - textWidth(state.place, 1), 12, 1, BG);
  s.rect(12, 22, SCREEN_W - 24, 1, B);

  if (state.plan) drawPlan(s, state, state.plan);
  else drawChart(s, state);

  drawCompass(s, state.cam.yaw);
  const facing = `FACING ${headingOf(state.cam.yaw)}`;
  drawText(
    s,
    facing,
    VIEW.x + VIEW.w - textWidth(facing, 1),
    CAPTION_Y,
    1,
    BY,
  );

  s.rect(12, LEGEND_Y - 4, SCREEN_W - 24, 1, B);
  legendItem(s, 14, "YOU", (x) => s.rect(x, LEGEND_Y + 1, 3, 3, BM));
  if (state.plan) {
    legendItem(s, 48, "WAY OUT", (x) => s.rect(x, LEGEND_Y + 1, 3, 3, BY));
    legendItem(s, 100, "STONE", (x) => {
      s.px(x, LEGEND_Y + 1, W);
      s.px(x + 2, LEGEND_Y + 1, W);
      s.px(x + 1, LEGEND_Y + 2, W);
      s.px(x, LEGEND_Y + 3, W);
      s.px(x + 2, LEGEND_Y + 3, W);
    });
  } else {
    legendItem(s, 48, "LEYLINE", (x) => {
      s.px(x, LEGEND_Y + 2, BC);
      s.px(x + 1, LEGEND_Y + 2, BC);
    });
    legendItem(s, 100, "WOODS", (x) => {
      s.px(x, LEGEND_Y + 2, G);
      s.px(x + 2, LEGEND_Y + 1, BG);
    });
  }
  legendItem(s, 150, "FOE", (x) => {
    s.rect(x, LEGEND_Y + 2, 3, 1, BR);
    s.rect(x + 1, LEGEND_Y + 1, 1, 3, BR);
  });
  drawText(s, "M CLOSES", 190, LEGEND_Y, 1, BY);
}
