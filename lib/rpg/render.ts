// The Leyline renderer: azimuth-anchored sky, Mode-7 rotating ground plane,
// painter-sorted billboards, the hovering hero, and the windowed HUD.

import {
  HERO,
  MOON,
  RUNE_GATE,
  RUNE_LEY,
  RUNE_MOON,
  RUNE_WARD,
  SPELL_DOT,
  glyph,
  textWidth,
} from "@/lib/rpg/assets";
import { B, BC, BW, BY, C, G, K, W } from "@/lib/rpg/palette";
import {
  CAM_BACK,

  FOCAL,
  drawBillboards,
  eyeHeight,
  eyeOf,
  forward,
  type Billboard,
  type CameraState,
} from "@/lib/rpg/projection";
import { drawPanel, type Blip } from "@/lib/rpg/panel";
import { HORIZON, HUD_TOP, SCREEN_W, Screen, hash } from "@/lib/rpg/screen";
import { featuresNear, groundColour } from "@/lib/rpg/world";

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

const MOON_AZIMUTH = 5.1;

function drawSky(s: Screen, yaw: number): void {
  const scroll = Math.round(yaw * SKY_PX_PER_RAD);
  // Sparse cold stars, anchored to azimuth so they wheel as you turn.
  for (let y = 2; y < HORIZON - 3; y += 3) {
    for (let x = 0; x < SCREEN_W; x += 7) {
      const wx = (((x + scroll) % SKY_PERIOD) + SKY_PERIOD) % SKY_PERIOD;
      const h = hash(wx - (wx % 7), y);
      if (h < 30) s.px(x + (h % 5), y + ((h >> 3) % 3), h % 9 === 0 ? BW : W);
    }
  }
  // The moon holds its bearing in the sky.
  const d = wrapAngle(MOON_AZIMUTH - yaw);
  if (Math.abs(d) < 1.1) {
    s.blit(MOON, Math.round(128 + d * SKY_PX_PER_RAD) - 5, 8);
  }
  // Broken horizon line and the haunted-forest skyline, azimuth-anchored.
  for (let x = 0; x < SCREEN_W; x++) {
    const wx = (((x + scroll) % SKY_PERIOD) + SKY_PERIOD) % SKY_PERIOD;
    if (((wx >> 2) & 1) === 0 && hash(wx, 59) < 700) s.px(x, HORIZON - 1, G);
    const t = hash(wx - (wx % 23), 777);
    if (t < 160) {
      const tx = (t % 19) + wx - (wx % 23);
      if (tx === wx) {
        const th = 3 + (t % 3);
        for (let k = 0; k < th; k++) s.px(x, HORIZON - 2 - k, G);
        s.px(x - 1, HORIZON - 2 - th, G);
        s.px(x + 1, HORIZON - 1 - th + (t % 2), G);
      }
    }
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
    // Distance dither: detail thins as the world recedes into the dark.
    const fade = z > 2200 ? 3 : z > 1200 ? 2 : z > 650 ? 1 : 0;
    const footprint = z / FOCAL;
    const rowBase = sy * SCREEN_W;
    for (let sx = 0; sx < SCREEN_W; sx++) {
      const l = ((sx - 128) * z) / FOCAL;
      const wx = cx + sin * z + cos * l;
      const wy = cy + cos * z - sin * l;
      const colour = groundColour(wx, wy, footprint, t);
      if (colour === K) continue;
      // Leyline light never fades with distance and skips the clash pass.
      if (colour === BC || colour === C) {
        ley.push(rowBase + sx, colour);
        continue;
      }
      if (fade === 1 && (sx + sy) % 2 !== 0) continue;
      if (fade === 2 && ((sx & 3) !== 0 || (sy & 1) !== 0)) continue;
      if (fade === 3 && (colour === G || (sx & 7) !== 0)) continue;
      s.fb[rowBase + sx] = colour;
    }
  }
  return ley;
}

// --------------------------------------------------------------------- hero

function drawHero(s: Screen, t: number): void {
  const bob = Math.round(Math.sin(t * 2.1) * 2);
  const x = 128 - HERO.w; // scale 2 -> width 2*w, centred
  const y = 84 + bob;
  s.blit(HERO, x, y, 2);
  // Ley-glow pooling beneath the trailing wisp.
  for (let gy = 145; gy < 151; gy++) {
    const pw = gy - 141;
    for (let gx = 128 - pw; gx <= 128 + pw; gx++) {
      if (((gx + gy) & 1) === 0) {
        s.px(gx, gy + (bob >> 1), Math.abs(gx - 128) < 2 ? BC : C);
      }
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
  /** Where she is, named. */
  place: string;
  /** What she is carrying. */
  carried: readonly string[];
  /** Everything alive near enough for the radar. */
  blips: readonly Blip[];
  /** Set indoors: the radar draws this room plan instead of a compass. */
  plan?: { rows: readonly string[]; cell: number };
}

/** The control panel lives in its own module; this passes it the camera. */
function drawHud(s: Screen, hud: HudState, cam: CameraState): void {
  drawPanel(s, {
    spellName: hud.spellName,
    runes: RUNES,
    selectedRune: hud.selectedRune,
    lifeforce: hud.lifeforce,
    gems: hud.gems,
    carried: hud.carried,
    place: hud.place,
    x: cam.x,
    y: cam.y,
    yaw: cam.yaw,
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
  cam: CameraState,
): void {
  drawHero(s, t);
  if (overlay?.dialogue) drawDialogue(s, overlay.dialogue, t);
  else if (overlay?.prompt) drawPrompt(s, overlay.prompt);
  drawHud(s, hud, cam);
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
  plat: { x: number; y: number; half: number; height: number },
): void {
  const { fx, fy } = forward(cam.yaw);
  const { ex, ey } = eyeOf(cam);
  // Height of the eye above the platform, not above the moor.
  const above = eyeHeight(cam) - plat.height;
  if (above <= 0) return;
  for (let sy = HORIZON + 1; sy < HUD_TOP; sy++) {
    const dist = (above * FOCAL) / (sy - HORIZON);
    if (dist > plat.half * 3) continue;
    for (let sx = 0; sx < SCREEN_W; sx++) {
      const lat = ((sx - 128) * dist) / FOCAL;
      const wx = ex + fx * dist + fy * lat;
      const wy = ey + fy * dist - fx * lat;
      if (Math.abs(wx - plat.x) > plat.half || Math.abs(wy - plat.y) > plat.half) {
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
  platform?: { x: number; y: number; half: number; height: number },
): void {
  s.clear();
  drawSky(s, cam.yaw);
  const ley = drawGround(s, cam, t);
  if (platform) drawPlatform(s, cam, platform);
  s.attributePass(0, HUD_TOP);
  for (let i = 0; i < ley.length; i += 2) s.fb[ley[i]] = ley[i + 1];
  const features = featuresNear(cam.x, cam.y, 900).filter(
    (f) => !(f.id && omit?.has(f.id)),
  );
  drawBillboards(s, cam, [...features, ...entities], t);
  drawOverlay(s, hud, t, overlay, cam);
}
