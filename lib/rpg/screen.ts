// The indexed framebuffer and its drawing verbs. 256x192 palette indices,
// drawn back-to-front each frame, then presented to a canvas in one pass.

import { K, PALETTE_RGB, T, type PaletteTable } from "@/lib/rpg/palette";

export const SCREEN_W = 256;
export const SCREEN_H = 192;

/** Rows 0..HORIZON-1 are sky; the ground plane starts just below. */
export const HORIZON = 60;
/** First row of the HUD strip; the scene owns rows above it. */
export const HUD_TOP = 152;

export interface Sprite {
  w: number;
  h: number;
  /** Palette indices, T for transparent, row-major. */
  data: Uint8Array;
  /**
   * Leaves rather than cloth or stone. Blown up close, a solid field of this
   * art is punched through with sky (see `blitScaled`) — a canopy two paces
   * away is gaps and light, and painting it as a slab is what made the near
   * field the weakest thing on screen.
   */
  canopy?: boolean;
}

/** Parse string-art rows + char->palette legend into an indexed sprite. */
export function sprite(rows: string[], legend: Record<string, number>): Sprite {
  const h = rows.length;
  const w = rows[0].length;
  const data = new Uint8Array(w * h).fill(T);
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row.charAt(x);
      if (ch !== ".") data[y * w + x] = legend[ch] ?? T;
    }
  }
  return { w, h, data };
}

/** The same, for art that is foliage: see `Sprite.canopy`. */
export function foliage(rows: string[], legend: Record<string, number>): Sprite {
  return { ...sprite(rows, legend), canopy: true };
}

/** Deterministic 2D hash -> 0..999. Same recipe as the concept art. */
export function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = (h * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) % 1000;
}

/**
 * A 4x4 ordered dither expressed as an offset in source pixels. Used to break
 * up the seams of a heavily magnified sprite (see `blitScaled`). The values
 * are the Bayer sequence rescaled to +/- half a pixel.
 */
const JITTER = [
  -0.47, 0.03, -0.34, 0.16, 0.28, -0.22, 0.41, -0.09, -0.28, 0.22, -0.41, 0.09,
  0.47, -0.03, 0.34, -0.16,
];

/**
 * Past this magnification a source pixel covers a visible tile of screen
 * rather than a pixel of it, and nearest-neighbour reads as a grid of flat
 * squares instead of as art.
 */
const SOFTEN_AT = 2.6;

/**
 * How far, in source pixels, a jittered sample may wander. Just under half a
 * pixel: the stipple eats into both sides of a seam and never reaches past
 * the neighbouring pixel, so fine detail survives while flat edges dissolve.
 */
const SOFTEN_REACH = 0.96;

/**
 * Magnification past which a canopy is thinned. Higher than SOFTEN_AT: at
 * three times life size the art still carries its own texture, and it is only
 * beyond that the solid runs in it turn into slabs.
 */
const LEAF_AT = 3;

/** Fraction of the dither matrix that becomes gaps in a thinned canopy. */
const LEAF_GAP = 0.24;

/**
 * True where `spr` runs on at (sx, sy) — the pixel has at least two of its
 * four neighbours in its own colour, so it is part of a mass rather than a
 * detail. Canopy art is a green/black dither, so demanding all four match
 * finds almost nothing; two is what separates a leaf bank from a twig.
 */
function inFlatField(spr: Sprite, sx: number, sy: number): boolean {
  if (sx < 1 || sy < 1 || sx >= spr.w - 1 || sy >= spr.h - 1) return false;
  const c = spr.data[sy * spr.w + sx];
  let same = 0;
  if (spr.data[sy * spr.w + sx - 1] === c) same++;
  if (spr.data[sy * spr.w + sx + 1] === c) same++;
  if (spr.data[(sy - 1) * spr.w + sx] === c) same++;
  if (spr.data[(sy + 1) * spr.w + sx] === c) same++;
  return same >= 2;
}

export class Screen {
  readonly fb = new Uint8Array(SCREEN_W * SCREEN_H);
  /**
   * The RGB the framebuffer's indices resolve to. Set per frame from the
   * player's position (see regions.ts); the drawing verbs never consult it, so
   * changing it repaints everything already drawn and nothing has to be redrawn.
   */
  palette: PaletteTable = PALETTE_RGB;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly image: ImageData;
  /** Scratch histogram for the minifying blit; reused to stay allocation-free. */
  private readonly tally = new Uint16Array(16);

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.image = ctx.createImageData(SCREEN_W, SCREEN_H);
  }

  /** Squared RGB distance between two palette entries, in the table in force. */
  private colourDistance(a: number, b: number): number {
    const [ar, ag, ab] = this.palette[a];
    const [br, bg, bb] = this.palette[b];
    const dr = ar - br;
    const dg = ag - bg;
    const db = ab - bb;
    return dr * dr + dg * dg + db * db;
  }

  clear(colour = K): void {
    this.fb.fill(colour);
  }

  px(x: number, y: number, colour: number): void {
    if (x >= 0 && x < SCREEN_W && y >= 0 && y < SCREEN_H) {
      this.fb[y * SCREEN_W + x] = colour;
    }
  }

  rect(x: number, y: number, w: number, h: number, colour: number): void {
    const x0 = Math.max(0, x | 0);
    const y0 = Math.max(0, y | 0);
    const x1 = Math.min(SCREEN_W, (x + w) | 0);
    const y1 = Math.min(SCREEN_H, (y + h) | 0);
    for (let yy = y0; yy < y1; yy++) {
      this.fb.fill(colour, yy * SCREEN_W + x0, yy * SCREEN_W + x1);
    }
  }

  /** Blit at integer position and integer scale (pixel-art enlargement). */
  blit(spr: Sprite, x: number, y: number, scale = 1): void {
    for (let sy = 0; sy < spr.h; sy++) {
      for (let sx = 0; sx < spr.w; sx++) {
        const colour = spr.data[sy * spr.w + sx];
        if (colour !== T) {
          this.rect(x + sx * scale, y + sy * scale, scale, scale, colour);
        }
      }
    }
  }

  /**
   * Billboard blit: destination is `dw`x`dh` pixels, nearest-neighbour sampled,
   * anchored at bottom-centre (bx, by). Fractional sizes are how distant
   * things stay small. `dither` fades far billboards into the dark:
   * 0 solid, 1 checkerboard, 2 sparse (1 in 4). `tint` paints every opaque
   * pixel one colour, which is how a silhouette gets smeared into a halo.
   * `depth` is the per-column wall distance from the raycaster: any column
   * whose wall is nearer than `z` is skipped, so stone hides what is behind
   * it. Without it billboards paint straight over the walls.
   *
   * Past SOFTEN_AT the sample point is jittered by an ordered dither, so the
   * seam between two source pixels becomes a stipple instead of a hard step.
   * Without it a tree three paces away is a grid of flat squares with square
   * holes in it: the art is 34 pixels wide and the screen wants 170.
   */
  blitScaled(
    spr: Sprite,
    bx: number,
    by: number,
    dw: number,
    dh: number,
    dither = 0,
    tint?: number,
    depth?: Float32Array | null,
    z = 0,
  ): void {
    const w = Math.max(1, Math.round(dw));
    const h = Math.max(1, Math.round(dh));
    const x0 = Math.round(bx - w / 2);
    const y0 = Math.round(by - h);
    const soften = w >= spr.w * SOFTEN_AT && h >= spr.h * SOFTEN_AT;
    // The opposite end of the same problem softening answers. Shrinking hard,
    // one source pixel per destination pixel is the wrong question to ask: a
    // skeleton drawn from bone-wide white lines lands its samples in the gaps
    // and disappears, and whichever pixels do survive are the ones the
    // rounding happened to pick, so the sprite crawls as it scales. Past this
    // ratio each destination pixel takes a vote of the block it covers, and
    // thin work thickens into a silhouette instead of dissolving into speckle.
    const shrunk = spr.w > w * 1.3 && spr.h > h * 1.3;
    const thin = soften && spr.canopy === true && w >= spr.w * LEAF_AT;
    const stepX = spr.w / w;
    const stepY = spr.h / h;
    // Clipped to the screen rather than trusting `px` to drop what falls off
    // it. A billboard at arm's length is a thousand pixels wide and mostly
    // off-frame, and every one of those pixels now costs a dither.
    const dyEnd = Math.min(h, SCREEN_H - y0);
    const dxEnd = Math.min(w, SCREEN_W - x0);
    for (let dy = Math.max(0, -y0); dy < dyEnd; dy++) {
      const py = y0 + dy;
      const rowY = (dy + 0.5) * stepY;
      const flat = Math.min(spr.h - 1, Math.floor(dy * stepY));
      for (let dx = Math.max(0, -x0); dx < dxEnd; dx++) {
        const px = x0 + dx;
        if (depth && px >= 0 && px < SCREEN_W && depth[px] < z) continue;
        if (dither === 1 && ((px + py) & 1) !== 0) continue;
        if (dither === 2 && ((px & 1) !== 0 || (py & 1) !== 0)) continue;
        let sx: number;
        let sy: number;
        if (soften) {
          // Two taps of the same matrix, read on transposed axes, so the
          // horizontal and vertical wander do not agree and the seams break
          // into a stipple rather than a staircase of diagonals.
          const cell = (py & 3) * 4 + (px & 3);
          const wander = JITTER[cell];
          sx = Math.floor((dx + 0.5) * stepX + wander * SOFTEN_REACH);
          sy = Math.floor(rowY + JITTER[(px & 3) * 4 + (py & 3)] * SOFTEN_REACH);
          if (sx < 0) sx = 0;
          else if (sx >= spr.w) sx = spr.w - 1;
          if (sy < 0) sy = 0;
          else if (sy >= spr.h) sy = spr.h - 1;
          if (thin && wander > LEAF_GAP && inFlatField(spr, sx, sy)) continue;
        } else {
          sx = Math.min(spr.w - 1, Math.floor(dx * stepX));
          sy = flat;
        }
        const colour = shrunk
          ? this.vote(
              spr,
              sx,
              Math.min(spr.w, Math.max(sx + 1, Math.ceil((dx + 1) * stepX))),
              sy,
              Math.min(spr.h, Math.max(sy + 1, Math.ceil((dy + 1) * stepY))),
            )
          : spr.data[sy * spr.w + sx];
        if (colour !== T) this.px(px, py, tint ?? colour);
      }
    }
  }

  /**
   * The commonest opaque colour in a source block, or T when too little of
   * the block is covered to be worth drawing. The coverage threshold is what
   * decides how a shrinking sprite dies: too high and line art evaporates,
   * too low and every distant creature bloats into the same blob.
   */
  private vote(spr: Sprite, x0: number, x1: number, y0: number, y1: number): number {
    const counts = this.tally;
    counts.fill(0);
    let opaque = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const c = spr.data[y * spr.w + x];
        if (c === T) continue;
        counts[c]++;
        opaque++;
      }
    }
    const total = (x1 - x0) * (y1 - y0);
    if (opaque * 4 < total) return T;
    let best = T;
    let bestCount = 0;
    for (let c = 0; c < 16; c++) {
      if (counts[c] > bestCount) {
        bestCount = counts[c];
        best = c;
      }
    }
    return best;
  }

  /**
   * The "designed clash" pass: reduce every 8x8 cell of the region drawn so
   * far to its two most frequent colours (the cell's ink and paper). Runs on
   * the background only — sprites drawn after it are exempt, like a real
   * Spectrum game compositing software sprites over attribute-safe art.
   */
  attributePass(yTop = 0, yBottom = HUD_TOP): void {
    const counts = new Uint16Array(16);
    for (let cy = yTop; cy < yBottom; cy += 8) {
      for (let cx = 0; cx < SCREEN_W; cx += 8) {
        counts.fill(0);
        for (let y = cy; y < Math.min(cy + 8, yBottom); y++) {
          for (let x = cx; x < cx + 8; x++) counts[this.fb[y * SCREEN_W + x]]++;
        }
        let ink = K;
        let paper = K;
        let best = -1;
        let second = -1;
        for (let c = 0; c < 16; c++) {
          if (counts[c] > best) {
            second = best;
            paper = ink;
            best = counts[c];
            ink = c;
          } else if (counts[c] > second) {
            second = counts[c];
            paper = c;
          }
        }
        if (second <= 0) continue; // already one colour
        for (let y = cy; y < Math.min(cy + 8, yBottom); y++) {
          for (let x = cx; x < cx + 8; x++) {
            const i = y * SCREEN_W + x;
            const colour = this.fb[i];
            if (colour !== ink && colour !== paper) {
              // Snap strays to the nearer survivor in RGB, not by the bright
              // bit: a bright-white pixel in a white-on-black cell must land
              // on white, and matching bright bits would send it to black.
              this.fb[i] =
                this.colourDistance(colour, ink) <= this.colourDistance(colour, paper)
                  ? ink
                  : paper;
            }
          }
        }
      }
    }
  }

  /** Write the framebuffer to the backing 256x192 canvas. */
  present(): void {
    const out = this.image.data;
    for (let i = 0; i < this.fb.length; i++) {
      const [r, g, b] = this.palette[this.fb[i]];
      const o = i * 4;
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = 255;
    }
    this.ctx.putImageData(this.image, 0, 0);
  }
}
