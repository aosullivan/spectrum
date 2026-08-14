// The Leyline renderer: azimuth-anchored sky, Mode-7 rotating ground plane,
// painter-sorted billboards, the hovering hero, and the windowed HUD.

import {
  GEM_EMPTY,
  GEM_FULL,
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
import { B, BC, BG, BW, BY, C, G, K, W } from "@/lib/rpg/palette";
import {
  CAM_BACK,
  CAM_HEIGHT,
  FOCAL,
  drawBillboards,
  type Billboard,
  type CameraState,
} from "@/lib/rpg/projection";
import { HORIZON, HUD_TOP, SCREEN_W, Screen, hash } from "@/lib/rpg/screen";
import { DEAD_WOOD_X, featuresNear, groundColour } from "@/lib/rpg/world";

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

function drawSky(s: Screen, yaw: number, dead: boolean): void {
  const scroll = Math.round(yaw * SKY_PX_PER_RAD);
  const skyline = dead ? W : G;
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
    if (((wx >> 2) & 1) === 0 && hash(wx, 59) < 700) s.px(x, HORIZON - 1, skyline);
    const t = hash(wx - (wx % 23), 777);
    if (t < 160) {
      const tx = (t % 19) + wx - (wx % 23);
      if (tx === wx) {
        const th = 3 + (t % 3);
        for (let k = 0; k < th; k++) s.px(x, HORIZON - 2 - k, skyline);
        s.px(x - 1, HORIZON - 2 - th, skyline);
        s.px(x + 1, HORIZON - 1 - th + (t % 2), skyline);
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
  for (let sy = HORIZON; sy < HUD_TOP; sy++) {
    const depth = sy - HORIZON || 0.5;
    const z = (CAM_HEIGHT * FOCAL) / depth;
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
  // Authored at final size, so scale 1 — upscaling a small sprite is what
  // made the old hero read as 2x2 blocks.
  const x = 128 - (HERO.w >> 1);
  const y = 84 + bob;
  // Ley-glow pools on the ground UNDER the mage, so it goes down first —
  // drawn after, it washed over the robe.
  for (let gy = 146; gy < 152; gy++) {
    const pw = (gy - 144) * 2;
    for (let gx = 128 - pw; gx <= 128 + pw; gx++) {
      if (((gx + gy) & 1) === 0) {
        s.px(gx, gy, Math.abs(gx - 128) < 3 ? BC : C);
      }
    }
  }
  s.blit(HERO, x, y, 1);
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
  /** 0..17 half-steps of lifeforce (17 segments, last may be half). */
  lifeforce: number;
  gems: [boolean, boolean, boolean];
}

function drawHud(s: Screen, hud: HudState): void {
  s.rect(0, HUD_TOP, 256, 40, K);
  s.rect(0, HUD_TOP, 256, 1, W);
  s.rect(0, 191, 256, 1, W);
  s.rect(0, HUD_TOP, 1, 40, W);
  s.rect(255, HUD_TOP, 1, 40, W);
  s.rect(0, HUD_TOP + 1, 256, 1, B);
  s.rect(0, 190, 256, 1, B);
  for (const [px, py] of [
    [0, HUD_TOP],
    [254, HUD_TOP],
    [0, 190],
    [254, 190],
  ]) {
    s.rect(px, py, 2, 2, BW);
  }

  // Spell window.
  s.rect(4, 155, 132, 1, B);
  s.rect(4, 173, 132, 1, B);
  s.rect(4, 155, 1, 19, B);
  s.rect(135, 155, 1, 19, B);
  s.blit(SPELL_DOT, 10, 161);
  drawText(s, hud.spellName, 19, 159, 2, BY);

  // Rune quick-slots.
  for (let i = 0; i < RUNES.length; i++) {
    const bx = 141 + i * 28;
    const sel = i === hud.selectedRune;
    const frame = sel ? BC : B;
    s.rect(bx, 155, 24, 1, frame);
    s.rect(bx, 173, 24, 1, frame);
    s.rect(bx, 155, 1, 19, frame);
    s.rect(bx + 23, 155, 1, 19, frame);
    s.blit(RUNES[i], bx + 8, 160);
    if (sel) s.rect(bx + 8, 171, 8, 1, BW);
  }

  // Lifeforce.
  drawText(s, "LIFEFORCE", 8, 180, 1, W);
  s.rect(52, 176, 178, 1, W);
  s.rect(52, 188, 178, 1, W);
  s.rect(52, 176, 1, 13, W);
  s.rect(229, 176, 1, 13, W);
  const full = hud.lifeforce >> 1;
  const half = hud.lifeforce % 2 === 1;
  for (let seg = 0; seg < 17; seg++) {
    const sx = 54 + seg * 10;
    if (seg < full) {
      s.rect(sx, 179, 8, 7, G);
      s.rect(sx, 179, 8, 1, BG);
    } else if (seg === full && half) {
      for (let y = 179; y < 186; y++) {
        for (let x = sx; x < sx + 8; x++) {
          if (((x + y) & 1) === 0) s.px(x, y, G);
        }
      }
    }
  }
  const gems = [GEM_FULL, GEM_FULL, GEM_FULL];
  for (let i = 0; i < 3; i++) {
    s.blit(hud.gems[i] ? gems[i] : GEM_EMPTY, 234 + i * 7, 179);
  }
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
  overlay?: OverlayState,
): void {
  drawHero(s, t);
  if (overlay?.dialogue) drawDialogue(s, overlay.dialogue, t);
  else if (overlay?.prompt) drawPrompt(s, overlay.prompt);
  drawHud(s, hud);
}

export function renderFrame(
  s: Screen,
  cam: CameraState,
  entities: readonly Billboard[],
  hud: HudState,
  t: number,
  overlay?: OverlayState,
): void {
  s.clear();
  drawSky(s, cam.yaw, cam.x < DEAD_WOOD_X);
  const ley = drawGround(s, cam, t);
  s.attributePass(0, HUD_TOP);
  for (let i = 0; i < ley.length; i += 2) s.fb[ley[i]] = ley[i + 1];
  drawBillboards(s, cam, [...featuresNear(cam.x, cam.y, 900), ...entities]);
  drawOverlay(s, hud, t, overlay);
}
