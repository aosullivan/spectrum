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

import { drawText, drawWindow, headingOf } from "@/lib/rpg/panel";
import { textWidth } from "@/lib/rpg/assets";
import { B, BC, BG, BM, BR, BW, BY, C, G, K, W, Y } from "@/lib/rpg/palette";
import { SCREEN_H, SCREEN_W, hash, type Screen } from "@/lib/rpg/screen";
import {
  CIRCLE_POS,
  GROVE_POS,
  GROVE_R,
  HENGE_POS,
  KEEP_POS,
  DEAD_WOOD_X,
  GREENWOOD_EDGE_X,
  VILLAGE_POS,
} from "@/lib/rpg/world";

/**
 * The charted region. It has to hold the whole walkable world with room to
 * spare: she spawns at y=40 and the keep's back wall stands at y=1560, so a
 * chart starting at y=150 declared the opening view of the game off the map.
 * The margins past the outermost place are deliberate — a chart whose edge
 * runs through a named region reads as a bug rather than as a frontier.
 */
const CHART = { x0: -900, x1: 1100, y0: -60, y1: 1620 };

/**
 * The band of screen the chart may use: under the title rule, and stopping
 * clear of the caption row. Everything below CAPTION_Y belongs to the legend.
 */
const VIEW = { x: 14, y: 26, w: 228, h: 136 };

/** One line under the chart: her coordinates, or how far off it she is. */
const CAPTION_Y = 164;

/** The legend strip, and the rule above it. */
const LEGEND_Y = SCREEN_H - 16;

const CHART_W = CHART.x1 - CHART.x0;
const CHART_H = CHART.y1 - CHART.y0;

/** One scale for both axes: a chart you can learn cannot be stretched. */
const SCALE = Math.min(VIEW.w / CHART_W, VIEW.h / CHART_H);

const PLOT_W = Math.round(CHART_W * SCALE);
const PLOT_H = Math.round(CHART_H * SCALE);

/**
 * Where the charted land actually lands on screen. The world is taller than
 * it is wide and the screen is the other way round, so the chart sits in the
 * middle of VIEW with a margin either side — which is where the compass and
 * the longer place names live.
 */
const PLOT = {
  x: VIEW.x + ((VIEW.w - PLOT_W) >> 1),
  y: VIEW.y + ((VIEW.h - PLOT_H) >> 1),
  w: PLOT_W,
  h: PLOT_H,
};

/** World point to chart pixel. North (+y) is up, so the y axis inverts. */
function plot(wx: number, wy: number): { px: number; py: number } {
  return {
    px: PLOT.x + Math.round(((wx - CHART.x0) / CHART_W) * PLOT.w),
    py: PLOT.y + Math.round(((CHART.y1 - wy) / CHART_H) * PLOT.h),
  };
}

/** What the land is at a chart pixel — the inverse of `plot`. */
function unplot(px: number, py: number): { wx: number; wy: number } {
  return {
    wx: CHART.x0 + ((px - PLOT.x) / PLOT.w) * CHART_W,
    wy: CHART.y1 - ((py - PLOT.y) / PLOT.h) * CHART_H,
  };
}

/** A treeline is not a ruled boundary: wobble the edge of the woods. */
function fray(wy: number): number {
  return Math.sin(wy * 0.011) * 46 + Math.sin(wy * 0.031) * 22;
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
  { pos: VILLAGE_POS, name: "THE VILLAGE", side: 1, dy: 0 },
];

/** What a mark on the map stands for. Places are drawn separately. */
export type MarkKind = "foe" | "friend" | "item" | "way";

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

const MARK_INK: Record<MarkKind, number> = {
  foe: BR,
  friend: BC,
  item: BY,
  way: BG,
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
 * A creature or a loose item. Every mark is bedded on black first: a cyan
 * blip on the cyan leyline, or a green one in the grove, is no mark at all.
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
    const px = ROSE.x + Math.round(Math.sin(t) * ROSE.r);
    const py = ROSE.y - Math.round(Math.cos(t) * ROSE.r);
    s.px(px, py, a % 8 === 0 ? W : B);
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
 * The land itself. The grove is the only near-solid thing on the chart, so it
 * reads as the one lush place; the two woods share a density and differ in
 * brightness, because one is living and one is dying; the moor is bare but for
 * the odd tuft. Scatters are hashed rather than patterned — a modulo lattice
 * at this scale turns into diagonal stripes and reads as a drawing error.
 */
function drawLand(s: Screen): void {
  for (let py = PLOT.y; py < PLOT.y + PLOT.h; py++) {
    for (let px = PLOT.x; px < PLOT.x + PLOT.w; px++) {
      const { wx, wy } = unplot(px, py);
      if (Math.hypot(wx - GROVE_POS.x, wy - GROVE_POS.y) < GROVE_R) {
        if (((px + py) & 1) === 0) s.px(px, py, BG);
        else if (hash(px, py) < 420) s.px(px, py, G);
      } else if (wx < DEAD_WOOD_X + fray(wy)) {
        // Dead standing timber: bare upright ticks, never a bright pixel.
        if (hash(px, py + 400) < 90) {
          s.px(px, py, G);
          s.px(px, py - 1, G);
        }
      } else if (wx > GREENWOOD_EDGE_X - fray(wy + 700)) {
        const h = hash(px, py + 800);
        if (h < 55) s.px(px, py, BG);
        else if (h < 260) s.px(px, py, G);
      } else if (hash(px, py + 1200) < 22) {
        s.px(px, py, G);
      }
    }
  }
}

/** The leyline, the road she travels: bright, running north to the keep. */
function drawLeyline(s: Screen): void {
  const step = 1 / SCALE;
  for (let wy = CHART.y0; wy <= KEEP_POS.y; wy += step) {
    const { px, py } = plot(0, wy);
    s.px(px, py, BC);
    if (Math.floor(wy / step) % 4 === 0) s.px(px + 1, py, C);
  }
}

function drawChart(s: Screen, state: MapState): void {
  drawLand(s);
  // A dashed edge, so where the survey stops is a stated fact rather than the
  // place the drawing happened to run out.
  for (let x = PLOT.x; x < PLOT.x + PLOT.w; x += 3) {
    s.px(x, PLOT.y - 2, B);
    s.px(x, PLOT.y + PLOT.h + 1, B);
  }
  for (let y = PLOT.y; y < PLOT.y + PLOT.h; y += 3) {
    s.px(PLOT.x - 2, y, B);
    s.px(PLOT.x + PLOT.w + 1, y, B);
  }
  drawLeyline(s);

  // The one region the game names but never drew: the dying wood in the west.
  // Cleared to black first, or a dim caption over a green scatter is unreadable.
  const woods = plot(DEAD_WOOD_X - 320, 1180);
  s.rect(woods.px - 18, woods.py - 2, 38, 19, K);
  drawText(s, "ANCIENT", woods.px - 16, woods.py, 1, W);
  drawText(s, "WOODS", woods.px - 12, woods.py + 8, 1, W);

  for (const p of PLACES) {
    const { px, py } = plot(p.pos.x, p.pos.y);
    drawPlaceMark(s, px, py, p.name === "THE KEEP" || p.name === "THE VILLAGE");
    const width = textWidth(p.name, 1);
    // Labels may run out into the margins either side of the chart; that is
    // what the margins are for.
    const lx =
      p.side > 0
        ? Math.min(px + 6, VIEW.x + VIEW.w - width)
        : Math.max(px - 6 - width, VIEW.x);
    const ly = py + 4 + p.dy;
    // Cleared to black first: a place name laid straight over the woodland
    // scatter is the one thing on the chart you cannot afford to misread.
    s.rect(lx - 1, ly - 1, width + 2, 7, K);
    drawText(s, p.name, lx, ly, 1, BW);
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

/**
 * The caption row under the chart. It exists so the off-chart notice has
 * somewhere to go: it used to be drawn two pixels below the chart, which put
 * it straight on top of the legend, and her pinned marker landed in the same
 * strip. Since she spawns off-chart no longer, it usually carries her
 * position instead.
 */
function drawFacing(s: Screen, yaw: number): void {
  const word = `FACING ${headingOf(yaw)}`;
  drawText(s, word, VIEW.x + VIEW.w - textWidth(word, 1), CAPTION_Y, 1, BY);
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
  drawFacing(s, state.cam.yaw);

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
