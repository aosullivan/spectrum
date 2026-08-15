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
import { B, BC, BW, BY, C, G, K, W } from "@/lib/rpg/palette";
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
  DEAD_WOOD_X,
  HERMITAGE_BOXES,
  HERMITAGE_POS,
  KEEP_BOXES,
  KEEP_GATE_Y,
  KEEP_POS,
  VILLAGE_POS,
  featuresNear,
  groundColour,
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

/** Night air thickening toward the horizon. Two steps is all it needs. */
const SKY_RAMP: Ramp = [K, B];

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

function drawSky(s: Screen, yaw: number, dead: boolean): void {
  const scroll = Math.round(yaw * SKY_PX_PER_RAD);
  const skyline = dead ? W : G;
  // A black sky is still a graded sky: a thin dither of blue into black low
  // down is what stops the upper frame reading as a void. It has to stay
  // faint — much past a fifth coverage it stops being air and becomes a
  // painted band competing with the horizon. It goes first, so the stars and
  // the copse sit on top of it rather than being swallowed.
  const glowTop = HORIZON - 18;
  for (let y = glowTop; y < HORIZON; y++) {
    const level = ((y - glowTop) / 18) * 0.2;
    for (let x = 0; x < SCREEN_W; x++) {
      if (rampColour(SKY_RAMP, level, x, y) !== K) s.px(x, y, B);
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
  }
  // Stars, anchored to azimuth so they wheel as you turn, and denser in a
  // band across the sky — a night this dark should have a milky way in it.
  for (let y = 2; y < HORIZON - 3; y += 3) {
    for (let x = 0; x < SCREEN_W; x += 7) {
      const wx = (((x + scroll) % SKY_PERIOD) + SKY_PERIOD) % SKY_PERIOD;
      const h = hash(wx - (wx % 7), y);
      // The band runs at a slant, so turning sweeps along it.
      const band = Math.abs(y - (14 + Math.sin((wx / SKY_PERIOD) * Math.PI * 2) * 13));
      const threshold = band < 9 ? 210 - band * 14 : 62;
      if (h >= threshold) continue;
      const py = y + ((h >> 3) % 3);
      if (py > HORIZON - 1 - Math.max(far[x] ?? 0, near[x] ?? 0)) continue;
      s.px(x + (h % 5), py, h % 9 === 0 ? BW : W);
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
    if (((wx >> 1) & 1) === 0 || hash(wx, 407) < 500) s.px(x, crest, dead ? W : BW);
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
    if (t >= (dead ? 420 : 210)) continue;
    const tx = x + (t % 5) - 2;
    const th = 8 + (t % (dead ? 15 : 11));
    const ink = dead || t % 4 !== 0 ? W : G;
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
      if (colour === BC || colour === C) {
        ley.push(rowBase + sx, colour);
        continue;
      }
      s.fb[rowBase + sx] = colour;
    }
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
  drawSky(s, cam.yaw, cam.x < DEAD_WOOD_X);
  const ley = drawGround(s, cam, t);
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
    ...collectBillboards(cam, [...distantKeep, ...features, ...entities], t),
  ];
  jobs.sort((a, b) => b.z - a.z);
  for (const j of jobs) j.paint(s);
  if (lightning && t < lightning.until) drawLightning(s, cam, t, lightning);
  drawOverlay(s, hud, t, overlay);
}
