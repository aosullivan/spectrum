// The indexed framebuffer and its drawing verbs. 256x192 palette indices,
// drawn back-to-front each frame, then presented to a canvas in one pass.

import { K, PALETTE_RGB, T } from "@/lib/rpg/palette";

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

/** Squared RGB distance between two palette entries. */
function colourDistance(a: number, b: number): number {
  const [ar, ag, ab] = PALETTE_RGB[a];
  const [br, bg, bb] = PALETTE_RGB[b];
  const dr = ar - br;
  const dg = ag - bg;
  const db = ab - bb;
  return dr * dr + dg * dg + db * db;
}

/** Deterministic 2D hash -> 0..999. Same recipe as the concept art. */
export function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = (h * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) % 1000;
}

export class Screen {
  readonly fb = new Uint8Array(SCREEN_W * SCREEN_H);
  private readonly ctx: CanvasRenderingContext2D;
  private readonly image: ImageData;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.image = ctx.createImageData(SCREEN_W, SCREEN_H);
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
    for (let dy = 0; dy < h; dy++) {
      const sy = Math.min(spr.h - 1, Math.floor((dy * spr.h) / h));
      const py = y0 + dy;
      for (let dx = 0; dx < w; dx++) {
        const px = x0 + dx;
        if (depth && px >= 0 && px < SCREEN_W && depth[px] < z) continue;
        if (dither === 1 && ((px + py) & 1) !== 0) continue;
        if (dither === 2 && ((px & 1) !== 0 || (py & 1) !== 0)) continue;
        const sx = Math.min(spr.w - 1, Math.floor((dx * spr.w) / w));
        const colour = spr.data[sy * spr.w + sx];
        if (colour !== T) this.px(px, py, tint ?? colour);
      }
    }
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
              this.fb[i] = colourDistance(colour, ink) <= colourDistance(colour, paper)
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
      const [r, g, b] = PALETTE_RGB[this.fb[i]];
      const o = i * 4;
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = 255;
    }
    this.ctx.putImageData(this.image, 0, 0);
  }
}
