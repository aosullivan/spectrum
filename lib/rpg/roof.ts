// The top of the keep. Rendered by the OUTDOOR renderer with the eye raised
// to roof height, so the moor, the leyline and the horizon are the real ones
// seen from up there — only the battlements around you are local scenery.

import type { Actor } from "@/lib/rpg/interact";
import { ROOF_HEIGHT } from "@/lib/rpg/interior";
import type { Billboard, CameraState } from "@/lib/rpg/projection";
import { BEACON, PARAPET, ROOF_HATCH } from "@/lib/rpg/tower";
import { KEEP_POS, KEEP_SIZE } from "@/lib/rpg/world";

/** Walkable leads inside the exterior wall footprint. */
const HALF_X = KEEP_SIZE.width / 2 - 20;
const HALF_Y = KEEP_SIZE.depth / 2 - 20;

/** The stone leads themselves, for the renderer to floor you on. */
export const ROOF_PLATFORM = {
  x: KEEP_POS.x,
  y: KEEP_POS.y,
  halfX: HALF_X + 10,
  halfY: HALF_Y + 10,
  height: ROOF_HEIGHT,
};
/** Where the battlements sit, just outside the walkable area. */
const WALL_X = HALF_X + 10;
const WALL_Y = HALF_Y + 10;

/** Where you stand when you climb out of the hatch, facing out over the moor. */
export function roofEntry(): CameraState {
  return { x: KEEP_POS.x, y: KEEP_POS.y - 106, yaw: 0, elev: ROOF_HEIGHT };
}

/** The hatch you climb out of — and back down through. */
export const ROOF_ACTORS: readonly Actor[] = [
  {
    x: KEEP_POS.x,
    y: KEEP_POS.y - 124,
    sprite: ROOF_HATCH,
    height: 12,
    stands: ROOF_HEIGHT,
    id: "roof-hatch",
    reach: 40,
    label: "CLIMB BACK DOWN",
    interaction: { kind: "exit" },
  },
];

/**
 * Battlements ringing the roof, plus the cold beacon. Built once: a run of
 * parapet sections along each side, spaced by the sprite's own width so the
 * crenels line up into a continuous wall.
 */
export const ROOF_PROPS: readonly Billboard[] = (() => {
  const out: Billboard[] = [];
  // Chest-high, not eye-high: the whole point of climbing up here is to see
  // out over the moor, so the merlons must sit below the eye.
  const height = 17;
  // A billboard is as wide as its height times the sprite's aspect; space
  // the sections a shade tighter than that or the wall comes out in chunks.
  const step = Math.floor((height * PARAPET.w) / PARAPET.h) - 2;
  for (let d = -WALL_X; d <= WALL_X; d += step) {
    out.push({
      x: KEEP_POS.x + d,
      y: KEEP_POS.y + WALL_Y,
      sprite: PARAPET,
      height,
      stands: ROOF_HEIGHT,
    });
    out.push({
      x: KEEP_POS.x + d,
      y: KEEP_POS.y - WALL_Y,
      sprite: PARAPET,
      height,
      stands: ROOF_HEIGHT,
    });
  }
  for (let d = -WALL_Y; d <= WALL_Y; d += step) {
    out.push({
      x: KEEP_POS.x + WALL_X,
      y: KEEP_POS.y + d,
      sprite: PARAPET,
      height,
      stands: ROOF_HEIGHT,
    });
    out.push({
      x: KEEP_POS.x - WALL_X,
      y: KEEP_POS.y + d,
      sprite: PARAPET,
      height,
      stands: ROOF_HEIGHT,
    });
  }
  out.push({
    x: KEEP_POS.x - 48,
    y: KEEP_POS.y + 40,
    sprite: BEACON,
    height: 34,
    stands: ROOF_HEIGHT,
    solid: 10,
  });
  return out;
})();

/** Keep the mage on the leads: the parapet is a wall, not a suggestion. */
export function resolveRoofMove(
  toX: number,
  toY: number,
): { x: number; y: number } {
  const clamp = (v: number, centre: number) =>
    Math.max(centre - HALF_X, Math.min(centre + HALF_X, v));
  let x = clamp(toX, KEEP_POS.x);
  const y = Math.max(
    KEEP_POS.y - HALF_Y,
    Math.min(KEEP_POS.y + HALF_Y, toY),
  );
  // The beacon stands in the way too.
  const bx = KEEP_POS.x - 48;
  const by = KEEP_POS.y + 40;
  const dx = x - bx;
  const dy = y - by;
  const reach = 24;
  if (dx * dx + dy * dy < reach * reach) {
    x = bx + (dx >= 0 ? reach : -reach);
  }
  return { x, y };
}
