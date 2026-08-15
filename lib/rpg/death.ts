// Death poses are derived from each combatant's own bitmap. Corporeal bodies
// topple into a low horizontal sprite; spirits shed cyan fragments upward.

import { BC, BW, C, T } from "@/lib/rpg/palette";
import type { Billboard } from "@/lib/rpg/projection";
import { hash, type Sprite } from "@/lib/rpg/screen";

export type DeathStyle = "corporeal" | "spirit";

const cache = new WeakMap<Sprite, Map<string, Sprite>>();

function cached(source: Sprite, key: string, build: () => Sprite): Sprite {
  let entries = cache.get(source);
  if (!entries) {
    entries = new Map();
    cache.set(source, entries);
  }
  const hit = entries.get(key);
  if (hit) return hit;
  const made = build();
  entries.set(key, made);
  return made;
}

function flash(source: Sprite): Sprite {
  return cached(source, "flash", () => {
    const data = source.data.slice();
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== T) data[i] = i % 3 === 0 ? BC : BW;
    }
    return { w: source.w, h: source.h, data };
  });
}

function leaning(source: Sprite, stage: number): Sprite {
  return cached(source, `lean-${stage}`, () => {
    const shiftMax = Math.ceil(source.h * stage * 0.17);
    const w = source.w + shiftMax;
    const data = new Uint8Array(w * source.h).fill(T);
    for (let y = 0; y < source.h; y++) {
      const shift = Math.round(((source.h - 1 - y) / source.h) * shiftMax);
      for (let x = 0; x < source.w; x++) {
        const colour = source.data[y * source.w + x];
        if (colour !== T) data[y * w + x + shift] = colour;
      }
    }
    return { w, h: source.h, data };
  });
}

function fallen(source: Sprite, dissolveStage: number): Sprite {
  return cached(source, `fallen-${dissolveStage}`, () => {
    const w = source.h;
    const h = Math.max(3, Math.ceil(source.w / 3));
    const data = new Uint8Array(w * h).fill(T);
    const cutoff = dissolveStage * 220;
    for (let sy = 0; sy < source.h; sy++) {
      for (let sx = 0; sx < source.w; sx++) {
        const colour = source.data[sy * source.w + sx];
        if (colour === T || hash(sx + 911, sy + 353) < cutoff) continue;
        const x = source.h - 1 - sy;
        const y = Math.min(h - 1, Math.floor(sx / 3));
        data[y * w + x] = colour;
      }
    }
    return { w, h, data };
  });
}

function spirit(source: Sprite, stage: number): Sprite {
  return cached(source, `spirit-${stage}`, () => {
    const pad = 6;
    const w = source.w + pad * 2;
    const h = source.h + 10;
    const data = new Uint8Array(w * h).fill(T);
    const progress = stage / 5;
    for (let sy = 0; sy < source.h; sy++) {
      for (let sx = 0; sx < source.w; sx++) {
        const sourceColour = source.data[sy * source.w + sx];
        if (sourceColour === T) continue;
        const lift = Math.round(progress * (4 + (hash(sx, sy) % 9)));
        const scatter = Math.round((((hash(sx + 73, sy + 19) % 7) - 3) * stage) / 5);
        const dissolve = progress * 920 + ((source.h - sy) / source.h) * 100;
        if (hash(sx + 401, sy + 809) < dissolve) continue;
        const x = sx + pad + scatter;
        const y = sy + 9 - lift;
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        const tone = hash(sx + stage * 13, sy) % 5;
        data[y * w + x] = tone === 0 ? BW : tone < 3 ? BC : C;
      }
    }
    // Detached motes continue upward after the body has broken apart.
    for (let i = 0; i < 18; i++) {
      if (hash(i, stage + 77) > 300 + stage * 110) continue;
      const x = pad + (hash(i + 17, stage) % source.w);
      const y = Math.max(0, 8 - stage - (hash(i, 91) % 8));
      data[y * w + x] = i % 4 === 0 ? BW : BC;
    }
    return { w, h, data };
  });
}

/** Return the current death pose, or null once the remains have cleared. */
export function deathBillboard(
  actor: Billboard,
  startedAt: number,
  now: number,
  style: DeathStyle,
): Billboard | null {
  const elapsed = now - startedAt;
  if (style === "spirit") {
    if (elapsed >= 1.2) return null;
    const stage = Math.min(5, Math.floor((elapsed / 1.2) * 6));
    return {
      ...actor,
      sprite: spirit(actor.sprite, stage),
      height: actor.height * (1 - stage * 0.045),
      elevate: (actor.elevate ?? 0) + stage * 2.5,
      energy: undefined,
      highlight: undefined,
    };
  }

  if (elapsed >= 3.2) return null;
  if (elapsed < 0.14) {
    return { ...actor, sprite: flash(actor.sprite), energy: undefined, highlight: undefined };
  }
  if (elapsed < 0.58) {
    const progress = (elapsed - 0.14) / 0.44;
    const stage = Math.min(3, 1 + Math.floor(progress * 3));
    return {
      ...actor,
      sprite: leaning(actor.sprite, stage),
      height: actor.height * (1 - progress * 0.56),
      energy: undefined,
      highlight: undefined,
    };
  }
  const dissolveStage = elapsed < 2.55 ? 0 : Math.min(4, 1 + Math.floor((elapsed - 2.55) * 6));
  return {
    ...actor,
    sprite: fallen(actor.sprite, dissolveStage),
    height: Math.max(4, actor.height * 0.3),
    energy: undefined,
    highlight: undefined,
  };
}
