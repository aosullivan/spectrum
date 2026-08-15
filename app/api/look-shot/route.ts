// Dev-only headless renderer for the RPG. The browser pane on this machine
// throttles a hidden tab to about 1Hz and stalls fetches in it, so driving the
// game through a real page is unreliable; this renders frames server-side
// instead and writes them to screenshots/ as PNGs.
//
//   GET /api/look-shot?id=game&scale=3&steps=420&walk=1   a real game frame
//   GET /api/look-shot?id=game&bench=250                  ms/frame for render()
//   GET /api/look-shot?id=map&cx=200&cy=700&span=4        groundColour top-down
//
// `bench` reports the cost of one renderFrame against the 16.67ms budget.
// `clash` reports how many 8x8 cells hold more than two colours before the
// attribute pass — how much of the art the pass has to destroy.

import { deflateSync } from "node:zlib";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { Game, emptyInput } from "@/lib/rpg/game";
import { paletteAt } from "@/lib/rpg/regions";
import { HUD_TOP, SCREEN_H, SCREEN_W, Screen } from "@/lib/rpg/screen";
import { groundColour } from "@/lib/rpg/world";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, body: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

/** Minimal RGB PNG writer — no filtering, one filter byte per row. */
function png(width: number, height: number, rgb: Uint8Array): Buffer {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgb.buffer, rgb.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** The Screen only needs these two to construct; the framebuffer is read raw. */
const headlessCtx = {
  createImageData: (w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  }),
  putImageData: () => {},
} as unknown as CanvasRenderingContext2D;

/**
 * How many 8x8 cells hold more than two colours. Ramp-shaded ground should
 * score near zero: a smooth field only ever mixes two neighbouring steps.
 */
function countOverfullCells(s: Screen, bottom: number): number {
  let overfull = 0;
  const seen = new Set<number>();
  for (let cy = 0; cy < bottom; cy += 8) {
    for (let cx = 0; cx < SCREEN_W; cx += 8) {
      seen.clear();
      for (let y = cy; y < Math.min(cy + 8, bottom); y++) {
        for (let x = cx; x < cx + 8; x++) seen.add(s.fb[y * SCREEN_W + x]);
      }
      if (seen.size > 2) overfull++;
    }
  }
  return overfull;
}

export async function GET(req: Request): Promise<Response> {
  if (process.env.NODE_ENV !== "development") {
    return new Response("dev only", { status: 404 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id") === "map" ? "map" : "game";
  const scale = Math.max(1, Math.min(6, Number(url.searchParams.get("scale") ?? 3)));

  const screen = new Screen(headlessCtx);
  let benchMs = 0;

  if (id === "map") {
    // A flat top-down plot of groundColour across the world bands, so the
    // biomes can be checked without walking to each one. No perspective and
    // no clash pass: this is the terrain function itself, not a game frame.
    const cx = Number(url.searchParams.get("cx") ?? 0);
    const cy = Number(url.searchParams.get("cy") ?? 700);
    const span = Number(url.searchParams.get("span") ?? 4);
    screen.palette = paletteAt(cx, cy);
    for (let y = 0; y < SCREEN_H; y++) {
      for (let x = 0; x < SCREEN_W; x++) {
        const wx = cx + (x - SCREEN_W / 2) * span;
        const wy = cy - (y - SCREEN_H / 2) * span;
        screen.fb[y * SCREEN_W + x] = groundColour(wx, wy, 1, 0, x, y, 1);
      }
    }
  } else {
    const game = new Game();
    const input = emptyInput();
    const steps = Math.max(0, Math.min(3600, Number(url.searchParams.get("steps") ?? 0)));
    input.forward = url.searchParams.get("walk") === "1";
    input.right = url.searchParams.get("turn") === "1";
    for (let i = 0; i < steps; i++) game.update(1 / 60, input);
    game.render(screen);
    const reps = Math.max(0, Math.min(300, Number(url.searchParams.get("bench") ?? 0)));
    if (reps > 0) {
      // Let the JIT settle first, and give the dev server a moment after any
      // recompile — a cold module reads two-thirds faster than a warm one and
      // will happily tell you a change made the renderer quicker.
      for (let i = 0; i < 20; i++) game.render(screen);
      const started = performance.now();
      for (let i = 0; i < reps; i++) game.render(screen);
      benchMs = (performance.now() - started) / reps;
    }
  }

  // Through the table the frame was actually drawn under — game.render sets
  // it from the camera's region, and it differs from the default everywhere
  // but the moor, and now under the other key everywhere at all.
  const table = screen.palette;
  const w = SCREEN_W * scale;
  const h = SCREEN_H * scale;
  const rgb = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const sy = (y / scale) | 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b] = table[screen.fb[sy * SCREEN_W + ((x / scale) | 0)]];
      const o = (y * w + x) * 3;
      rgb[o] = r;
      rgb[o + 1] = g;
      rgb[o + 2] = b;
    }
  }

  const path = join(process.cwd(), "screenshots", `look-${id}.png`);
  await writeFile(path, png(w, h, rgb));
  return Response.json({
    path,
    w,
    h,
    clash: {
      overfullCells: countOverfullCells(screen, HUD_TOP),
      sceneCells: (SCREEN_W / 8) * (HUD_TOP / 8),
    },
    benchMsPerFrame: benchMs ? Number(benchMs.toFixed(2)) : undefined,
  });
}
