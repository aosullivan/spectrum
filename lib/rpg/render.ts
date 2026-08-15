// The Leyline renderer: azimuth-anchored sky, Mode-7 rotating ground plane,
// painter-sorted billboards, the hovering hero, and the windowed HUD.

import {
  MOON,
  RUNE_GATE,
  RUNE_LEY,
  RUNE_MOON,
  RUNE_WARD,
  SPELL_DOT,
  glyph,
  textWidth,
} from "@/lib/rpg/assets";
import { KEEP_MID, KEEP_NEAR } from "@/lib/rpg/art";
import { rampColour, type Ramp } from "@/lib/rpg/dither";
import { LOOK } from "@/lib/rpg/look";
import {
  B,
  BC,
  BW,
  BY,
  C,
  G,
  K,
  R,
  RAMP_S0,
  RAMP_S_N,
  W,
  Y,
  isLeyLight,
} from "@/lib/rpg/palette";
import { terrainHeight } from "@/lib/rpg/terrain";
import {
  REFERENCE_HERO_BACK,
  REFERENCE_HERO_STAFF,
} from "@/lib/rpg/reference-art.generated";
import {
  CAM_BACK,

  FOCAL,
  collectBillboards,
  eyeHeight,
  eyeOf,
  forward,
  heightRow,
  type Billboard,
  type CameraState,
} from "@/lib/rpg/projection";
import { drawPanel, type Blip, type DialPlan } from "@/lib/rpg/panel";
import { collectFaces } from "@/lib/rpg/structures";
import { HORIZON, HUD_TOP, SCREEN_W, Screen, hash } from "@/lib/rpg/screen";
import {
  CIRCLE_POS,
  GROVE_POS,
  HENGE_POS,
  HERMITAGE_BOXES,
  HERMITAGE_POS,
  KEEP_BOXES,
  KEEP_GATE_Y,
  KEEP_POS,
  VILLAGE_POS,
  bareRampTop,
  deadness,
  featuresNear,
  groundColour,
  groundRamp,
} from "@/lib/rpg/world";
import { VILLAGE_BOXES } from "@/lib/rpg/village";

export type { Billboard as WorldEntity, CameraState };

/** Pixels of sky per radian of yaw (linearised; good enough at this FOV). */
const SKY_PX_PER_RAD = 149;
const SKY_PERIOD = Math.round(Math.PI * 2 * SKY_PX_PER_RAD);

function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// ---------------------------------------------------------------------- sky

// The opening view mirrors the reference frame: moon over the western stones,
// wyrm to the left, and the keep straight up the leyline.
const MOON_AZIMUTH = -0.72;

/** Where the sun went down, and where the old woods' afterglow still sits. */
const EMBER_AZIMUTH = 2.5;

/** Night air thickening toward the horizon. Two steps is all it needs. */
const SKY_RAMP: Ramp = [K, B];

/** The ULAplus sky rows: a real zenith-to-horizon gradient (see palette.ts). */
const SKY_RAMP_ULAPLUS: Ramp = [RAMP_S0, RAMP_S0 + 2, RAMP_S0 + 4, RAMP_S0 + 6];

/**
 * The same gradient with a step between each pair. Sky is a third of the
 * frame and almost entirely flat field, so it is where the ordered dither
 * shows most: four steps over sixty rows leaves three visible bands of weave,
 * and seven leaves none.
 */
const SKY_RAMP_SHADED: Ramp = Array.from({ length: RAMP_S_N }, (_, i) => RAMP_S0 + i);

/**
 * Height of a range of hills above the horizon at an azimuth, in pixels.
 * Built from harmonics of the sky's own period so the land closes on itself
 * exactly once per turn — a ridge that did not wrap would tear as you spun.
 */
function ridgeAt(wx: number, range: number): number {
  const a = (wx / SKY_PERIOD) * Math.PI * 2;
  // The harmonics have to be high enough to undulate within ONE SCREEN. The
  // view spans about a quarter of a turn, so a ridge built from the first
  // two or three harmonics is very nearly flat across the picture and reads
  // as a dashed rule drawn across the sky rather than as hills.
  if (range === 0) {
    return (
      15 +
      Math.sin(a * 2 + 0.3) * 6 +
      Math.sin(a * 5 + 1.1) * 4 +
      Math.sin(a * 9 + 2.3) * 2.5
    );
  }
  return (
    7 +
    Math.sin(a * 3 + 0.4) * 5 +
    Math.sin(a * 7 + 2.0) * 3.5 +
    Math.sin(a * 13 + 1.4) * 2
  );
}

// ------------------------------------------------------------- skyline ring
//
// Design law two made visible (the `skyline` look): a site whose real
// geometry has culled keeps its place on the horizon — a one-to-two colour
// silhouette at its TRUE bearing, sized by its true distance, standing on
// the near ridge like the copse does. Each fades in over a dithered band
// past its cull range, so the handoff from real geometry never pops. The
// keep is exempt on purpose: its distant billboard already draws at any
// range, and two keeps are worse than one.

interface SkySite {
  x: number;
  y: number;
  /** World size of the silhouette mass. */
  w: number;
  h: number;
  /** Range its real geometry stops drawing at — the fade-in starts here. */
  cull: number;
  kind: "village" | "henge" | "grove" | "stones" | "hut";
}

const SKY_SITES: SkySite[] = [
  { ...VILLAGE_POS, w: 170, h: 46, cull: 850, kind: "village" },
  { ...HENGE_POS, w: 320, h: 60, cull: 900, kind: "henge" },
  { ...GROVE_POS, w: 360, h: 78, cull: 900, kind: "grove" },
  { ...CIRCLE_POS, w: 300, h: 30, cull: 900, kind: "stones" },
  { ...HERMITAGE_POS, w: 64, h: 34, cull: 700, kind: "hut" },
];

/**
 * Column mass with a crest, per-pixel dithered by `fade`. Pale masses are
 * moonlit stone — a W/K weave dense enough to eat the stars behind it —
 * with a near-solid crest; dark masses (leafed crowns) are the absence of
 * stars with a dashed crest.
 */
function silhouetteColumn(
  s: Screen,
  x: number,
  foot: number,
  top: number,
  fade: number,
  crest: number,
  dark = false,
): void {
  if (top <= 0) return;
  for (let yy = foot - top; yy <= foot; yy++) {
    if (yy < 2) continue;
    if (hash(x, yy * 3 + 41) >= fade * 1024) continue;
    let ink: number;
    if (yy === foot - top) ink = hash(x, 883) < 680 ? crest : dark ? K : W;
    else if (dark) ink = K;
    else ink = hash(x, yy * 7 + 3) < 540 ? W : K;
    s.px(x, yy, ink);
  }
}

function drawSiteShape(
  s: Screen,
  site: SkySite,
  cx: number,
  sw: number,
  sh: number,
  fade: number,
): void {
  const half = sw >> 1;
  for (let j = -half; j <= half; j++) {
    const x = cx + j;
    if (x < 0 || x >= SCREEN_W) continue;
    const foot = s.horizonRow[x] - 1;
    let top = 0;
    let crest = W;
    let dark = false;
    switch (site.kind) {
      case "village": {
        // Two gabled masses, the second lower, ridge catching the moon.
        const split = Math.round(sw * 0.42) - half;
        const block = j < split ? sh : Math.max(2, Math.round(sh * 0.62));
        const edge = j === -half || j === half || j === split;
        top = block - (edge ? 1 : 0);
        break;
      }
      case "henge": {
        // Three trilithons: paired posts under a lintel, sky between.
        const g = Math.max(4, Math.round(sw / 3));
        const inGroup = (j + half) % g;
        const post = inGroup < 2 || inGroup >= g - 2;
        if (post) top = sh;
        else if (sh >= 4) {
          // Lintels hang at the posts' height, not on the ridge.
          for (let yy = foot - sh; yy < foot - sh + 2; yy++) {
            if (yy >= 2 && hash(x, yy * 3 + 41) < fade * 1024) s.px(x, yy, W);
          }
        }
        break;
      }
      case "grove": {
        // A broadleaf crown: stepped, still leafed — the one green crest.
        const n = hash(cx + (j >> 2), 313) % 400;
        top = Math.max(1, Math.round(sh * (0.55 + n / 900)));
        crest = hash(x, 714) < 560 ? G : W;
        dark = true;
        break;
      }
      case "stones": {
        // A ring seen edge-on: pale nubs in a row, sky between them.
        if ((j + half) % 3 === 0) top = 2 + (hash(cx + j, 515) % 2);
        break;
      }
      case "hut": {
        top = sh - Math.min(Math.abs(j), 1);
        break;
      }
    }
    silhouetteColumn(s, x, foot, top, fade, crest, dark);
  }
  // A hearth left burning: the one warm pixel on the night skyline.
  if (site.kind === "village" && sh >= 4 && fade > 0.5) {
    const hx = cx - (half >> 1);
    if (hx >= 0 && hx < SCREEN_W) s.px(hx, s.horizonRow[hx] - 2, Y);
  }
}

function drawSkylineRing(s: Screen, cam: CameraState): void {
  if (LOOK.skyline === "off") return;
  const yaw = cam.yaw;
  for (const site of SKY_SITES) {
    const dx = site.x - cam.x;
    const dy = site.y - cam.y;
    const dist = Math.hypot(dx, dy);
    if (dist < site.cull) continue;
    const d = wrapAngle(Math.atan2(dx, dy) - yaw);
    if (Math.abs(d) > 1.15) continue;
    const cx = Math.round(128 + d * SKY_PX_PER_RAD);
    const scale = SKY_PX_PER_RAD / dist;
    const sh = Math.max(2, Math.min(16, Math.round(site.h * scale)));
    const sw = Math.max(4, Math.min(34, Math.round(site.w * scale)));
    const fade = Math.min(1, (dist - site.cull) / 250);
    drawSiteShape(s, site, cx, sw, sh, fade);
  }
  if (LOOK.skyline !== "peopled") return;
  // Between the real places, ruin the horizon a little: broken wall stubs
  // and lone menhirs at fixed azimuths, so any turn sweeps something past.
  // Nameless dressing, same fiction as the ranges behind them.
  const scroll = Math.round(yaw * SKY_PX_PER_RAD);
  for (let x = -6; x < SCREEN_W + 6; x += 16) {
    const wx = (((x + scroll) % SKY_PERIOD) + SKY_PERIOD) % SKY_PERIOD;
    const cell = wx - (wx % 16);
    const t = hash(cell, 2029);
    if (t >= 96) continue;
    const tx = x + (t % 9) - 4;
    if (tx < 0 || tx >= SCREEN_W) continue;
    if (t < 66) {
      // A wall stub, one end still standing a little taller.
      const rw = 3 + (t % 4);
      const rh = 2 + ((t >> 2) % 3);
      for (let j = 0; j < rw; j++) {
        const x2 = tx + j;
        if (x2 >= SCREEN_W) break;
        const top = rh + (j === 0 ? 1 : 0) - ((t >> (j & 7)) & 1);
        silhouetteColumn(s, x2, s.horizonRow[x2] - 1, top, 1, W);
      }
    } else {
      // A lone menhir: a pale sliver you could walk toward and never reach.
      const foot = s.horizonRow[tx] - 1;
      const mh = 3 + (t % 2);
      for (let yy = foot - mh; yy <= foot; yy++) {
        if (yy >= 2) s.px(tx, yy, yy === foot - mh ? W : hash(tx, yy * 7 + 3) < 540 ? W : K);
      }
    }
  }
}

/**
 * `dead` is how much of the sky the old woods own, 0..1 — a fade rather than
 * the hard switch at DEAD_WOOD_X it used to be, so the band's own weather
 * comes up as you walk into it instead of snapping over in one step.
 */
function drawSky(s: Screen, cam: CameraState, dead: number): void {
  const yaw = cam.yaw;
  const deep = dead > 0.5;
  const scroll = Math.round(yaw * SKY_PX_PER_RAD);
  const skyline = deep ? W : G;
  // The sky's ground tone goes down first, so the stars, the ranges and the
  // copse all stand in front of it. Under the ULAplus ramps it is a true
  // zenith-to-horizon gradient through the palette's sky rows; otherwise a
  // thin dither of blue into black low down — faint on purpose, since much
  // past a fifth coverage it stops being air and becomes a painted band
  // competing with the horizon.
  if (LOOK.ramps) {
    const ramp = LOOK.shades ? SKY_RAMP_SHADED : SKY_RAMP_ULAPLUS;
    for (let y = 0; y < HORIZON; y++) {
      const level = Math.pow(y / (HORIZON - 1), 1.7);
      for (let x = 0; x < SCREEN_W; x++) {
        s.px(x, y, rampColour(ramp, level, x, y));
      }
    }
  } else if (LOOK.skyGlow) {
    const glowTop = HORIZON - 18;
    for (let y = glowTop; y < HORIZON; y++) {
      const level = ((y - glowTop) / 18) * 0.2;
      for (let x = 0; x < SCREEN_W; x++) {
        if (rampColour(SKY_RAMP, level, x, y) !== K) s.px(x, y, B);
      }
    }
  }
  // The land itself, standing between the stars and the moor: a far range
  // and a nearer one. Hills on a black sky are not painted, they are the
  // absence of stars, so their profile is worked out first and everything
  // above is drawn against it.
  const far: number[] = [];
  const near: number[] = [];
  for (let x = 0; x < SCREEN_W; x++) {
    const wx = (((x + scroll) % SKY_PERIOD) + SKY_PERIOD) % SKY_PERIOD;
    far.push(ridgeAt(wx, 0));
    near.push(ridgeAt(wx, 1));
    // The ranges are part of the visible skyline: fold their crest into
    // horizonRow so horizon dressing stands on whatever the eye reads as
    // the land's edge — these ridges here, the relief's crest when it
    // climbs higher (the ground pass keeps the minimum).
    s.horizonRow[x] = Math.min(
      s.horizonRow[x],
      HORIZON - 1 - Math.round(Math.max(far[x], near[x])),
    );
  }
  // Stars, anchored to azimuth so they wheel as you turn, and denser in a
  // band across the sky — a night this dark should have a milky way in it.
  // The night look deepens the field: a finer grid, three magnitudes with
  // the faintest in blue, a dust of blue grain along the band, and the odd
  // great star drawn as a cross — the one light in the sky you could name.
  const rich = LOOK.night !== "off";
  const stepX = rich ? 5 : 7;
  for (let y = 2; y < HORIZON - 3; y += rich ? 2 : 3) {
    for (let x = 0; x < SCREEN_W; x += stepX) {
      const wx = (((x + scroll) % SKY_PERIOD) + SKY_PERIOD) % SKY_PERIOD;
      const h = hash(wx - (wx % stepX), y);
      // The band runs at a slant, so turning sweeps along it.
      const band = Math.abs(y - (14 + Math.sin((wx / SKY_PERIOD) * Math.PI * 2) * 13));
      const ceiling = HORIZON - 1 - Math.max(far[x] ?? 0, near[x] ?? 0);
      const threshold = rich
        ? band < 11
          ? 250 - band * 16
          : 74
        : band < 9
          ? 210 - band * 14
          : 62;
      if (h >= threshold) {
        // Stars too faint to resolve: a grain of blue dust in the band.
        if (rich && band < 10 && hash(wx, y * 13 + 5) < 76 - band * 7) {
          const dy = y + ((h >> 2) % 2);
          if (dy <= ceiling) s.px(x + (h % stepX), dy, B);
        }
        continue;
      }
      const py = y + ((h >> 3) % 3);
      if (py > ceiling) continue;
      const px = x + (h % 5);
      if (!rich) {
        s.px(px, py, h % 9 === 0 ? BW : W);
        continue;
      }
      s.px(px, py, h % 29 === 0 ? BW : h % 3 === 0 ? W : B);
      if (h === 0 && py > 2 && py < ceiling - 2) {
        // A great star: bright heart, four faint points.
        s.px(px - 1, py, W);
        s.px(px + 1, py, W);
        s.px(px, py - 1, W);
        s.px(px, py + 1, W);
        s.px(px, py, BW);
      }
    }
  }
  // The moon holds its bearing in the sky.
  const d = wrapAngle(MOON_AZIMUTH - yaw);
  if (Math.abs(d) < 1.1) {
    const mx = Math.round(128 + d * SKY_PX_PER_RAD) - 10;
    // A thin halo hugging the disc: thinning outward so it reads as air
    // around the moon rather than as a panel pasted behind it.
    for (let hy = -4; hy <= 26; hy++) {
      for (let hx = -6; hx <= 28; hx++) {
        const n = Math.sqrt((hx - 11) ** 2 / 210 + (hy - 11) ** 2 / 175);
        if (n > 1 || n < 0.62) continue;
        if (hash(mx + hx, hy * 3) > 340 * (1 - n)) continue;
        s.px(mx + hx, 6 + hy, W);
      }
    }
    s.blit(MOON, mx, 6, 2);
  }
  // The dying sun. EMBER_DUSK is a table of amber, olive and bone described in
  // palette.ts as firelight and late sun, and nothing in the band ever emitted
  // the warm end of it — the wood is bone-white by decision, and the sky over
  // it was the same cold gradient the moor gets. This is the light those
  // colours are supposed to be lit BY, put back on the one bearing it can come
  // from, banked low in the west where the sun went.
  //
  // It may be warm and bright this low in the frame for the same reason the
  // leyline may: it is a light SOURCE, and everything stands in front of it.
  // Pale haze over the same rows does the opposite — on black paper, adding
  // light to the far field makes it the brightest thing on screen and drags it
  // forward, which is how the moor's earlier attempt at horizon mist failed.
  if (dead > 0.02) {
    const centre = 128 + wrapAngle(EMBER_AZIMUTH - yaw) * SKY_PX_PER_RAD;
    for (let x = 0; x < SCREEN_W; x++) {
      // Wide and low. Narrower than this it reads as a second moon; and with
      // the falloff squared it rises to a point over the bearing and becomes
      // a mountain standing in the sky, so the profile is deliberately flatter
      // than linear across the middle and only steepens at the edges.
      const across = 1 - Math.min(1, Math.abs(x - centre) / 104);
      if (across <= 0) continue;
      // Banked on the near ridge rather than on the horizon row: everything
      // from that crest down is about to be filled solid black as the near
      // range's mass, so a glow drawn at the horizon is painted out entirely.
      // Sitting above the crest also puts the hills in front of it, black
      // against the light, which is what a sunset behind a ridge looks like.
      const base = HORIZON - 1 - Math.round(near[x]);
      const reach = 16 * Math.pow(across, 0.7) * dead;
      for (let y = base; y > base - reach; y--) {
        const up = (base - y) / Math.max(1, reach);
        // Never solid even at its heart — about two-thirds cover along the
        // skyline, falling away fast, so it stays air rather than paint.
        if (hash(x * 3, y * 7 + 5) > 660 * (1 - up) ** 1.8) continue;
        s.px(x, y, up < 0.22 ? BY : up < 0.62 ? Y : R);
      }
    }
  }
  // The far range: a moonlit slope, drawn as a flank that thins downward.
  // A crest line alone is a wire strung across the sky — hills only read as
  // land when the ground below the crest has some light on it.
  for (let x = 0; x < SCREEN_W; x++) {
    const wx = (((x + scroll) % SKY_PERIOD) + SKY_PERIOD) % SKY_PERIOD;
    const crest = HORIZON - 1 - Math.round(far[x]);
    for (let y = crest; y < HORIZON; y++) {
      const down = (y - crest) / Math.max(1, HORIZON - crest);
      const lit = y === crest ? 880 : 130 * (1 - down) ** 2;
      if (hash(wx, y * 7 + 11) < lit) s.px(x, y, W);
    }
  }
  // The near range in front of it, unlit: a black mass that eats the far
  // slope, with one bright edge where the moon catches its top. It belongs
  // here in the sky pass, behind everything standing on the ground — drawn
  // after the billboards it lays a dashed white rule across the treetops.
  for (let x = 0; x < SCREEN_W; x++) {
    const wx = (((x + scroll) % SKY_PERIOD) + SKY_PERIOD) % SKY_PERIOD;
    const crest = HORIZON - 1 - Math.round(near[x]);
    for (let y = crest; y < HORIZON; y++) s.px(x, y, K);
    if (((wx >> 1) & 1) === 0 || hash(wx, 407) < 500) s.px(x, crest, deep ? W : BW);
  }
  // A distant copse made from individual trunks and branches. It shares the
  // sky's azimuth, so it turns continuously instead of sliding as a pasted
  // image.
  //
  // Sparse on purpose, and rooted on the near ridge rather than on the
  // horizon row: a continuous picket of white deadwood along the skyline is
  // the same value and the same band as the hills behind it, and the two
  // together read as one strip of noise. A few trees standing against the
  // sky on a hilltop are worth more than forty in a row.
  for (let x = -5; x < SCREEN_W + 5; x += 8) {
    const wx = (((x + scroll) % SKY_PERIOD) + SKY_PERIOD) % SKY_PERIOD;
    const cell = wx - (wx % 8);
    const t = hash(cell, 1313);
    if (t >= (deep ? 420 : 210)) continue;
    const tx = x + (t % 5) - 2;
    const th = 8 + (t % (deep ? 15 : 11));
    const ink = deep || t % 4 !== 0 ? W : G;
    // Stand them on the ridge the eye reads as the near skyline.
    const foot =
      HORIZON - 1 - Math.round(near[Math.max(0, Math.min(SCREEN_W - 1, tx))] ?? 0);
    for (let k = 0; k < th; k++) {
      if (k < 3 || ((k + t) & 3) !== 0) s.px(tx, foot - k, ink);
    }
    for (let k = 4; k < th - 1; k += 4) {
      const reach = 1 + ((t >> (k % 8)) & 3);
      const by = foot - k;
      for (let arm = 1; arm <= reach; arm++) {
        s.px(tx - arm, by - Math.floor(arm / 2), ink);
        if ((t + k) % 3 !== 0) s.px(tx + arm, by - Math.ceil(arm / 2), ink);
      }
    }
  }
  // Low scrub catching the light along the foot of the near ridge. The old
  // broken horizon line has gone with it: the ridge crest IS the skyline
  // now, and two skylines a few pixels apart only ever read as one smear.
  for (let x = 0; x < SCREEN_W; x++) {
    const wx = (((x + scroll) % SKY_PERIOD) + SKY_PERIOD) % SKY_PERIOD;
    const t = hash(wx - (wx % 23), 777);
    if (t >= 200) continue;
    const tx = (t % 19) + wx - (wx % 23);
    if (tx !== wx) continue;
    const th = 2 + (t % 3);
    for (let k = 0; k < th; k++) s.px(x, HORIZON - 2 - k, skyline);
    s.px(x + 1, HORIZON - 1 - th + (t % 2), skyline);
  }
}

// ------------------------------------------------------------------- ground

/**
 * Draw the ground plane. Leyline pixels are returned instead of drawn:
 * the leyline is light, not paint, so it is composited after the attribute
 * pass (a 2px cyan core must not lose a cell's two-colour vote to moor
 * green and vanish).
 */
function drawGround(s: Screen, cam: CameraState, t: number): number[] {
  const ley: number[] = [];
  const sin = Math.sin(cam.yaw);
  const cos = Math.cos(cam.yaw);
  const cx = cam.x - sin * CAM_BACK;
  const cy = cam.y - cos * CAM_BACK;
  const eyeY = eyeHeight(cam);
  for (let sy = HORIZON; sy < HUD_TOP; sy++) {
    const depth = sy - HORIZON || 0.5;
    // Raising the eye pushes the same screen row further out across the
    // moor — the whole trick behind the view from the tower top.
    const z = (eyeY * FOCAL) / depth;
    // Distance falloff: the ground is shaded, so the whole field simply gets
    // darker with range and the dither thins itself out. The curve has to be
    // gentle in z — perspective crushes the far half of the world into a few
    // scanlines, and a linear falloff spends the entire fade in about four of
    // them, which puts a hard edge back on the horizon.
    const far = 1 - Math.min(1, (z / 2400) ** 0.55);
    const footprint = z / FOCAL;
    const rowBase = sy * SCREEN_W;
    for (let sx = 0; sx < SCREEN_W; sx++) {
      const l = ((sx - 128) * z) / FOCAL;
      const wx = cx + sin * z + cos * l;
      const wy = cy + cos * z - sin * l;
      const colour = groundColour(wx, wy, footprint, t, sx, sy, far);
      if (colour === K) continue;
      // Leyline light never fades with distance and skips the clash pass.
      if (isLeyLight(colour)) {
        ley.push(rowBase + sx, colour);
        continue;
      }
      s.fb[rowBase + sx] = colour;
    }
  }
  return ley;
}

/**
 * Slope shading: move a colour one step along the look's ground ramp.
 * Colours that are not on the ramp — stones, water, cobbles — keep their
 * own light and pass through untouched.
 */
function shiftInRamp(colour: number, shade: number, top = Infinity): number {
  const ramp = groundRamp();
  const i = ramp.indexOf(colour);
  if (i < 0) return colour;
  const ceiling = Math.min(ramp.length - 1, top);
  return ramp[Math.min(ceiling, Math.max(0, i + shade))];
}

/**
 * The relief ground: per-column voxel-space march over the heightfield.
 * Near-to-far, each column fills upward from the last drawn row, so a near
 * ridge naturally occludes the valley behind it and crests rise past the
 * flat-world horizon into the sky. Returns leyline light for post-pass
 * compositing, exactly like the flat renderer.
 */
function drawGroundRelief(s: Screen, cam: CameraState, t: number): number[] {
  const ley: number[] = [];
  const sin = Math.sin(cam.yaw);
  const cos = Math.cos(cam.yaw);
  const cx = cam.x - sin * CAM_BACK;
  const cy = cam.y - cos * CAM_BACK;
  const eyeAbs = eyeHeight(cam) + terrainHeight(cam.x, cam.y);
  // Ridges occlude what stands behind them: every painted ground pixel
  // records its depth, and blitScaled refuses to paint a farther sprite
  // over a nearer hillside.
  const gz = s.acquireGroundZ();
  /** Ridges may climb this far into the sky before a column stops. */
  const CAP = 14;
  for (let sx = 0; sx < SCREEN_W; sx++) {
    let bottom = HUD_TOP;
    let prevRow = HUD_TOP + 8;
    let prevWx = cx;
    let prevWy = cy;
    let prevH = eyeAbs - eyeHeight(cam);
    let prevZ = 1;
    for (let z = 12; z < 3800 && bottom > CAP; z += 2 + z * 0.02) {
      const l = ((sx - 128) * z) / FOCAL;
      const wx = cx + sin * z + cos * l;
      const wy = cy + cos * z - sin * l;
      const h = terrainHeight(wx, wy);
      const row = HORIZON + ((eyeAbs - h) * FOCAL) / z;
      if (row < bottom) {
        // Slopes rising away present their face to the viewer and catch
        // the moon; falling ground turns away into shadow. The step is in
        // ramp rungs, so a finer ramp needs more of them to shift a hillside
        // by the same amount of light.
        const grade = (h - prevH) / Math.max(1, z - prevZ);
        const step = LOOK.shades ? 2 : 1;
        const shade = grade > 0.055 ? step : grade < -0.055 ? -step : 0;
        // The same falloff as the flat renderer, so a hillside recedes on
        // exactly the terms the level moor does.
        const far = 1 - Math.min(1, (z / 2400) ** 0.55);
        const top = Math.max(Math.ceil(row), CAP);
        for (let y = bottom - 1; y >= top; y--) {
          const f = (y - row) / (prevRow - row);
          const swx = wx + (prevWx - wx) * f;
          const swy = wy + (prevWy - wy) * f;
          let colour = groundColour(swx, swy, z / FOCAL, t, sx, y, far);
          const idx = y * SCREEN_W + sx;
          if (isLeyLight(colour)) {
            // Leyline light overlays after the clash pass; the hillside
            // under it is mid-ramp soil, not a hole.
            ley.push(idx, colour);
            colour = rampColour(groundRamp(), 0.45 * far, sx, y);
          } else if (shade !== 0) {
            // A moonlit slope steps one rung up the ground ladder — and that
            // ladder runs on past bare soil into turf, so in the dead wood a
            // slope facing the moon can grow the grass the band is defined by
            // not having. It is a small effect on its own; it is the litter
            // drifts that make it worth stopping, since they put much more of
            // this floor on the top soil rung for the slope to step off.
            colour = shiftInRamp(
              colour,
              shade,
              deadness(swx) > 0.5 ? bareRampTop() : Infinity,
            );
          }
          s.fb[idx] = colour;
          gz[idx] = z;
        }
        bottom = top;
      }
      prevRow = row;
      prevWx = wx;
      prevWy = wy;
      prevH = h;
      prevZ = z;
    }
    s.horizonRow[sx] = Math.min(s.horizonRow[sx], bottom);
  }
  return ley;
}

// --------------------------------------------------------------------- hero

function drawHero(s: Screen, t: number): void {
  const bob = Math.round(Math.sin(t * 2.1) * 2);
  const overlap = 4;
  const groupW = REFERENCE_HERO_BACK.w + REFERENCE_HERO_STAFF.w - overlap;
  const x = 128 - (groupW >> 1);
  const y = HUD_TOP - Math.max(REFERENCE_HERO_BACK.h, REFERENCE_HERO_STAFF.h) - 2 + bob;
  // Ley-glow pools on the ground UNDER the mage, so it goes down first —
  // drawn after, it washed over the robe.
  const glowY = HUD_TOP - 3;
  for (let gy = glowY - 3; gy <= glowY + 1; gy++) {
    const dy = gy - glowY;
    const half = Math.max(3, Math.round(Math.sqrt(Math.max(0, 1 - (dy * dy) / 16)) * 13));
    for (let gx = 128 - half; gx <= 128 + half; gx++) {
      const edge = Math.abs(gx - 128) > half - 3;
      if (!edge && ((gx + gy) & 1) !== 0) continue;
      s.px(gx, gy, Math.abs(gx - 128) < 2 ? BC : C);
    }
  }
  s.blit(REFERENCE_HERO_BACK, x, y, 1);
  s.blit(REFERENCE_HERO_STAFF, x + REFERENCE_HERO_BACK.w - overlap, y, 1);
}

export interface LightningState {
  /** World-space impact point. */
  x: number;
  y: number;
  height: number;
  hit: boolean;
  seed: number;
  until: number;
}

function lightningLine(
  s: Screen,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  colour: number,
): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const sx = x < tx ? 1 : -1;
  const dy = -Math.abs(ty - y);
  const sy = y < ty ? 1 : -1;
  let error = dx + dy;
  while (true) {
    if (y < HUD_TOP) s.px(x, y, colour);
    if (x === tx && y === ty) break;
    const twice = error * 2;
    if (twice >= dy) {
      error += dy;
      x += sx;
    }
    if (twice <= dx) {
      error += dx;
      y += sy;
    }
  }
}

/** A jagged cyan-white channel from the staff head to its world-space end. */
export function drawLightning(
  s: Screen,
  cam: CameraState,
  t: number,
  bolt: LightningState,
): void {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  const dx = bolt.x - ex;
  const dy = bolt.y - ey;
  const z = dx * fx + dy * fy;
  if (z < 12) return;

  const lat = dx * fy - dy * fx;
  const endX = 128 + (lat * FOCAL) / z;
  const endY = heightRow(bolt.height, z, eyeHeight(cam));
  const bob = Math.round(Math.sin(t * 2.1) * 2);
  const overlap = 4;
  const groupW = REFERENCE_HERO_BACK.w + REFERENCE_HERO_STAFF.w - overlap;
  const heroX = 128 - (groupW >> 1);
  const heroY =
    HUD_TOP - Math.max(REFERENCE_HERO_BACK.h, REFERENCE_HERO_STAFF.h) - 2 + bob;
  const startX =
    heroX + REFERENCE_HERO_BACK.w - overlap + Math.round(REFERENCE_HERO_STAFF.w * 0.55);
  const startY = heroY + 8;
  const segments = 9;
  let lastX = startX;
  let lastY = startY;
  for (let i = 1; i <= segments; i++) {
    const p = i / segments;
    const taper = Math.sin(p * Math.PI);
    const jitterX = i === segments ? 0 : ((hash(bolt.seed * 43 + i, 701) % 13) - 6) * taper;
    const jitterY = i === segments ? 0 : ((hash(bolt.seed * 71, i * 37) % 7) - 3) * taper;
    const x = startX + (endX - startX) * p + jitterX;
    const y = startY + (endY - startY) * p + jitterY;
    lightningLine(s, lastX - 1, lastY, x - 1, y, C);
    lightningLine(s, lastX + 1, lastY, x + 1, y, BC);
    lightningLine(s, lastX, lastY, x, y, BW);
    lastX = x;
    lastY = y;
  }

  if (bolt.hit) {
    const burst = 5 + (bolt.seed & 1);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      lightningLine(
        s,
        endX,
        endY,
        endX + Math.cos(a) * burst,
        endY + Math.sin(a) * burst,
        i % 2 === 0 ? BW : BC,
      );
    }
  }
}

// ---------------------------------------------------------------------- HUD

function drawText(
  s: Screen,
  text: string,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  let cx = x;
  for (const ch of text) {
    const g = glyph(ch, colour);
    if (g) {
      s.blit(g, cx, y, scale);
      cx += (g.w + 1) * scale;
    } else {
      cx += 4 * scale;
    }
  }
}

const RUNES = [RUNE_LEY, RUNE_GATE, RUNE_MOON, RUNE_WARD];

export interface HudState {
  spellName: string;
  selectedRune: number;
  /** 0..1. */
  lifeforce: number;
  gems: [boolean, boolean, boolean];
  /** Where she is, named. Captions the area map. */
  place: string;
  /** What she is carrying. */
  carried: readonly string[];
  /** Where she stands and which way she looks, for the corner dial. */
  cam: { x: number; y: number; yaw: number };
  /** What the dial marks. Refreshed each frame, in place. */
  blips: readonly Blip[];
  /** Set indoors; the dial draws the room instead of the moor. */
  plan?: DialPlan;
}

/** The control panel lives in its own module. */
function drawHud(s: Screen, hud: HudState): void {
  drawPanel(s, {
    spellName: hud.spellName,
    runes: RUNES,
    selectedRune: hud.selectedRune,
    lifeforce: hud.lifeforce,
    gems: hud.gems,
    carried: hud.carried,
    cam: hud.cam,
    blips: hud.blips,
    plan: hud.plan,
  });
}

// ------------------------------------------------------------ text windows

/** A framed window in the Dragontorc manner: black field, double border. */
function drawWindow(s: Screen, x: number, y: number, w: number, h: number): void {
  s.rect(x, y, w, h, K);
  s.rect(x, y, w, 1, BW);
  s.rect(x, y + h - 1, w, 1, BW);
  s.rect(x, y, 1, h, BW);
  s.rect(x + w - 1, y, 1, h, BW);
  s.rect(x + 2, y + 2, w - 4, 1, B);
  s.rect(x + 2, y + h - 3, w - 4, 1, B);
  s.rect(x + 2, y + 2, 1, h - 4, B);
  s.rect(x + w - 3, y + 2, 1, h - 4, B);
}

export interface OverlayState {
  /** One-line "walk up to it" hint, e.g. "E  SPEAK TO THE HERMIT". */
  prompt: string | null;
  /**
   * An open conversation or a wrapped notice, already broken to the window
   * width. An empty `name` renders as a plain message with no speaker.
   */
  dialogue: { name: string; lines: readonly string[]; more: boolean } | null;
}

function drawPrompt(s: Screen, text: string): void {
  const w = Math.min(244, textWidth(text, 1) + 22);
  const x = 128 - (w >> 1);
  const y = 132;
  drawWindow(s, x, y, w, 18);
  s.blit(SPELL_DOT, x + 6, y + 7);
  drawText(s, text, x + 13, y + 6, 1, BY);
}

function drawDialogue(
  s: Screen,
  d: NonNullable<OverlayState["dialogue"]>,
  t: number,
): void {
  const named = d.name.length > 0;
  const top = named ? 17 : 7;
  const h = top + 3 + d.lines.length * 9;
  const y = HUD_TOP - h - 4;
  drawWindow(s, 6, y, 244, h);
  if (named) {
    drawText(s, d.name, 14, y + 6, 1, BC);
    s.rect(14, y + 13, 228, 1, B);
  }
  for (let i = 0; i < d.lines.length; i++) {
    drawText(s, d.lines[i], 14, y + top + i * 9, 1, named ? W : BY);
  }
  // A blinking chevron, so "there is more" is unmistakable.
  if (d.more && Math.floor(t * 2) % 2 === 0) {
    for (let i = 0; i < 4; i++) s.rect(232 - i, y + h - 8 - i, 1 + i * 2, 1, BY);
  }
}

// -------------------------------------------------------------------- frame

/**
 * The hero, the HUD, and any open window, composited over whatever scene was
 * drawn. Outdoors and indoors share this so the mage, her spellbook and her
 * conversations never change shape.
 */
export function drawOverlay(
  s: Screen,
  hud: HudState,
  t: number,
  overlay: OverlayState | undefined,
): void {
  drawHero(s, t);
  if (overlay?.dialogue) drawDialogue(s, overlay.dialogue, t);
  else if (overlay?.prompt) drawPrompt(s, overlay.prompt);
  drawHud(s, hud);
}

/**
 * Stone leads under the mage's feet: a floor plane at `height`, drawn only
 * where it lies inside the platform's footprint so the moor still shows
 * beyond the battlements. Without this you can see the ground straight
 * through the roof you are standing on.
 */
function drawPlatform(
  s: Screen,
  cam: CameraState,
  plat: { x: number; y: number; halfX: number; halfY: number; height: number },
): void {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  // Height of the eye above the platform, not above the moor.
  const above = eyeHeight(cam) - plat.height;
  if (above <= 0) return;
  for (let sy = HORIZON + 1; sy < HUD_TOP; sy++) {
    const dist = (above * FOCAL) / (sy - HORIZON);
    if (dist > Math.max(plat.halfX, plat.halfY) * 3) continue;
    for (let sx = 0; sx < SCREEN_W; sx++) {
      const lat = ((sx - 128) * dist) / FOCAL;
      const wx = ex + fx * dist + fy * lat;
      const wy = ey + fy * dist - fx * lat;
      if (Math.abs(wx - plat.x) > plat.halfX || Math.abs(wy - plat.y) > plat.halfY) {
        continue;
      }
      // Big flags, sparse joints — the same language as the floors below.
      const jx = ((wx % 48) + 48) % 48;
      const jy = ((wy % 48) + 48) % 48;
      s.fb[sy * SCREEN_W + sx] = jx < 1.4 || jy < 1.4 ? W : K;
    }
  }
}

export function renderFrame(
  s: Screen,
  cam: CameraState,
  entities: readonly Billboard[],
  hud: HudState,
  t: number,
  overlay?: OverlayState,
  /** Features to leave out — you cannot see the keep from its own roof. */
  omit?: ReadonlySet<string>,
  /** A raised stone surface you are standing on, e.g. the keep's leads. */
  platform?: { x: number; y: number; halfX: number; halfY: number; height: number },
  /** Current cast, if its brief flash has not expired. */
  lightning?: LightningState,
): void {
  s.clear();
  drawSky(s, cam, deadness(cam.x));
  const ley = LOOK.hills ? drawGroundRelief(s, cam, t) : drawGround(s, cam, t);
  // The far sites' silhouettes stand where the drawn land actually meets the
  // sky — after the ground pass so the relief cannot swallow them, before
  // the attribute pass so they clash-vote like any background art.
  drawSkylineRing(s, cam);
  if (platform) drawPlatform(s, cam, platform);
  s.attributePass(0, HUD_TOP);
  for (let i = 0; i < ley.length; i += 2) s.fb[ley[i]] = ley[i + 1];
  const features = featuresNear(cam.x, cam.y, 900).filter(
    (f) => !(f.id && omit?.has(f.id)),
  );
  const keepDistance = Math.hypot(cam.x - KEEP_POS.x, cam.y - KEEP_GATE_Y);
  const villageDistance = Math.hypot(cam.x - VILLAGE_POS.x, cam.y - VILLAGE_POS.y);
  const hermitageDistance = Math.hypot(
    cam.x - HERMITAGE_POS.x,
    cam.y - HERMITAGE_POS.y,
  );
  const distantKeep: Billboard[] =
    !omit?.has("keep") && keepDistance > 800
      ? [{
          x: KEEP_POS.x,
          y: KEEP_GATE_Y + 14,
          sprite: KEEP_MID,
          height: 220,
          landmark: true,
          maxScreenHeight: 30,
          lod: [{ minH: 17, sprite: KEEP_NEAR }],
        }]
      : [];
  // Masonry and sprites are interleaved by depth, so a tree in front of the
  // keep occludes it and one behind does not. Standing on the keep's own
  // leads, its masonry is omitted — you cannot see a building from inside it.
  const jobs = [
    ...(omit?.has("keep") || keepDistance > 800 ? [] : collectFaces(cam, KEEP_BOXES)),
    ...(villageDistance > 850 ? [] : collectFaces(cam, VILLAGE_BOXES)),
    ...(hermitageDistance > 700 ? [] : collectFaces(cam, HERMITAGE_BOXES)),
    ...collectBillboards(
      cam,
      [...distantKeep, ...features, ...entities],
      t,
      null,
      LOOK.hills ? terrainHeight : null,
    ),
  ];
  jobs.sort((a, b) => b.z - a.z);
  for (const j of jobs) j.paint(s);
  if (lightning && t < lightning.until) drawLightning(s, cam, t, lightning);
  drawOverlay(s, hud, t, overlay);
}
