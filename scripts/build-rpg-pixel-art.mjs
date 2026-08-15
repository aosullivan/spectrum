import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const source = path.join(
  root,
  "images/a94a8999-335f-4aff-852b-864a640594df.png",
);
const characterSource = path.join(
  root,
  "images/0fae0a70-0059-4773-a627-4d0e718da98c.png",
);
const enemySource = path.join(
  root,
  "images/2d4649b2-2e5f-48c0-ab72-8877969b22e3.png",
);
const destination = path.join(root, "lib/rpg/reference-art.generated.ts");

const { data, info } = await sharp(source)
  .extract({ left: 0, top: 0, width: 362, height: 283 })
  .resize(256, 192, { fit: "fill", kernel: sharp.kernel.nearest })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

function colourAt(x, y) {
  const offset = (y * info.width + x) * info.channels;
  return [data[offset], data[offset + 1], data[offset + 2]];
}

function isRed(r, g, b) {
  return r > 68 && r > g * 1.65 && r > b * 1.4;
}

function isYellow(r, g, b) {
  return r > 115 && g > 75 && b < 80 && r < g * 2.4;
}

const dragonPixels = [];
for (let y = 0; y < 140; y++) {
  for (let x = 0; x < info.width; x++) {
    const [r, g, b] = colourAt(x, y);
    if (isRed(r, g, b)) dragonPixels.push([x, y]);
  }
}

const minX = Math.min(...dragonPixels.map(([x]) => x));
const maxX = Math.max(...dragonPixels.map(([x]) => x));
const minY = Math.min(...dragonPixels.map(([, y]) => y));
const maxY = Math.max(...dragonPixels.map(([, y]) => y));
const dragonWidth = maxX - minX + 1;
const dragonHeight = maxY - minY + 1;
const barrier = new Uint8Array(dragonWidth * dragonHeight);
const exterior = new Uint8Array(dragonWidth * dragonHeight);

for (let y = 0; y < dragonHeight; y++) {
  for (let x = 0; x < dragonWidth; x++) {
    const [r, g, b] = colourAt(minX + x, minY + y);
    if (isRed(r, g, b)) barrier[y * dragonWidth + x] = 1;
  }
}

const queue = [];
function addExterior(x, y) {
  if (x < 0 || x >= dragonWidth || y < 0 || y >= dragonHeight) return;
  const index = y * dragonWidth + x;
  if (barrier[index] || exterior[index]) return;
  exterior[index] = 1;
  queue.push([x, y]);
}

for (let x = 0; x < dragonWidth; x++) {
  addExterior(x, 0);
  addExterior(x, dragonHeight - 1);
}
for (let y = 0; y < dragonHeight; y++) {
  addExterior(0, y);
  addExterior(dragonWidth - 1, y);
}
for (let cursor = 0; cursor < queue.length; cursor++) {
  const [x, y] = queue[cursor];
  addExterior(x - 1, y);
  addExterior(x + 1, y);
  addExterior(x, y - 1);
  addExterior(x, y + 1);
}

const dragonRows = [];
for (let y = 0; y < dragonHeight; y++) {
  let row = "";
  for (let x = 0; x < dragonWidth; x++) {
    const [r, g, b] = colourAt(minX + x, minY + y);
    if (isYellow(r, g, b) && !exterior[y * dragonWidth + x]) row += "y";
    else if (isRed(r, g, b)) row += r > 155 ? "R" : "r";
    else row += exterior[y * dragonWidth + x] ? "." : "k";
  }
  dragonRows.push(row);
}

function pixelClass(r, g, b) {
  const high = Math.max(r, g, b);
  const bright = high > 185;
  if (g > r * 1.25 && b > r * 1.25) return bright ? "C" : "c";
  if (r > g * 1.3 && b > g * 1.3) return bright ? "M" : "m";
  if (g > r * 1.3 && g > b * 1.18) return bright ? "G" : "g";
  if (r > g * 1.35 && r > b * 1.35) return bright ? "R" : "r";
  if (r > b * 1.45 && g > b * 1.45) return bright ? "Y" : "y";
  return bright ? "W" : "w";
}

async function sheetSpriteRows(file, box) {
  const result = await sharp(file)
    .extract(box)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = result.data;
  const width = result.info.width;
  const height = result.info.height;
  const channels = result.info.channels;
  const ink = new Uint8Array(width * height);
  const barrier = new Uint8Array(width * height);
  const exteriorMask = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * channels;
      if (Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]) >= 55) {
        ink[y * width + x] = 1;
      }
    }
  }
  // Preserve a black keyline around the coloured concept art. It prevents
  // green terrain from showing through dark outlines after projection.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let oy = -1; oy <= 1 && !barrier[y * width + x]; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && ink[ny * width + nx]) {
            barrier[y * width + x] = 1;
            break;
          }
        }
      }
    }
  }

  const flood = [];
  const addExteriorPixel = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const index = y * width + x;
    if (barrier[index] || exteriorMask[index]) return;
    exteriorMask[index] = 1;
    flood.push([x, y]);
  };
  for (let x = 0; x < width; x++) {
    addExteriorPixel(x, 0);
    addExteriorPixel(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    addExteriorPixel(0, y);
    addExteriorPixel(width - 1, y);
  }
  for (let cursor = 0; cursor < flood.length; cursor++) {
    const [x, y] = flood[cursor];
    addExteriorPixel(x - 1, y);
    addExteriorPixel(x + 1, y);
    addExteriorPixel(x, y - 1);
    addExteriorPixel(x, y + 1);
  }

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (exteriorMask[index]) {
        row += ".";
        continue;
      }
      if (!ink[index]) {
        row += "k";
        continue;
      }
      const offset = index * channels;
      row += pixelClass(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
    }
    rawRows.push(row);
  }

  const occupied = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rawRows[y][x] !== ".") occupied.push([x, y]);
    }
  }
  const left = Math.max(0, Math.min(...occupied.map(([x]) => x)) - 1);
  const right = Math.min(width - 1, Math.max(...occupied.map(([x]) => x)) + 1);
  const top = Math.max(0, Math.min(...occupied.map(([, y]) => y)) - 1);
  const bottom = Math.min(height - 1, Math.max(...occupied.map(([, y]) => y)) + 1);
  return rawRows.slice(top, bottom + 1).map((row) => row.slice(left, right + 1));
}

const heroBackRows = await sheetSpriteRows(characterSource, {
  left: 1028,
  top: 326,
  width: 52,
  height: 72,
});
const heroStaffRows = await sheetSpriteRows(characterSource, {
  left: 894,
  top: 326,
  width: 22,
  height: 72,
});
const skeletonRows = await sheetSpriteRows(characterSource, {
  left: 1080,
  top: 884,
  width: 88,
  height: 118,
});
const wraithRows = await sheetSpriteRows(characterSource, {
  left: 925,
  top: 888,
  width: 70,
  height: 106,
});
const bruteRows = await sheetSpriteRows(enemySource, {
  left: 242,
  top: 302,
  width: 76,
  height: 84,
});
const goblinRows = await sheetSpriteRows(enemySource, {
  left: 247,
  top: 460,
  width: 74,
  height: 99,
});

const rows = (values) => values.map((row) => `  ${JSON.stringify(row)},`).join("\n");
const output = `// Generated by scripts/build-rpg-pixel-art.mjs. Do not edit by hand.\n\nimport { BC, BG, BM, BR, BW, BY, C, G, K, M, R, W, Y } from "@/lib/rpg/palette";\nimport { sprite } from "@/lib/rpg/screen";\n\nconst SHEET_INKS = { c: C, C: BC, g: G, G: BG, m: M, M: BM, r: R, R: BR, w: W, W: BW, y: Y, Y: BY, k: K };\n\nexport const REFERENCE_HERO_BACK = sprite(\n[\n${rows(heroBackRows)}\n],\nSHEET_INKS,\n);\n\nexport const REFERENCE_HERO_STAFF = sprite(\n[\n${rows(heroStaffRows)}\n],\nSHEET_INKS,\n);\n\nexport const REFERENCE_DRAGON = sprite(\n[\n${rows(dragonRows)}\n],\nSHEET_INKS,\n);\n\nexport const REFERENCE_SKELETON = sprite(\n[\n${rows(skeletonRows)}\n],\nSHEET_INKS,\n);\n\nexport const REFERENCE_WRAITH = sprite(\n[\n${rows(wraithRows)}\n],\nSHEET_INKS,\n);\n\nexport const REFERENCE_BRUTE = sprite(\n[\n${rows(bruteRows)}\n],\nSHEET_INKS,\n);\n\nexport const REFERENCE_GOBLIN = sprite(\n[\n${rows(goblinRows)}\n],\nSHEET_INKS,\n);\n`;

await mkdir(path.dirname(destination), { recursive: true });
await writeFile(destination, output);
console.log(
  `Built sheet sprites: hero ${heroBackRows[0].length}x${heroBackRows.length}, ` +
    `dragon ${dragonWidth}x${dragonHeight}, skeleton ${skeletonRows[0].length}x${skeletonRows.length}`,
);
