// Things in the world you can do something with: people who talk, items you
// take, and the way out. Dragontorc's grammar — you walk up, a windowed
// prompt appears, and one key does the deed.

import { textWidth } from "@/lib/rpg/assets";
import type { Billboard } from "@/lib/rpg/projection";

export type Interaction =
  | {
      kind: "talk";
      /** Shown as the speaker's name in the dialogue window. */
      name: string;
      /** One window-full per entry; the player pages through them. */
      lines: readonly string[];
    }
  | { kind: "pickup"; item: string; onTake: string }
  /**
   * Says its piece, then mends the mage: lifeforce restored and a relic
   * gem lit. Repeatable — the pool does not run out.
   */
  | { kind: "bless"; name: string; lines: readonly string[]; gem: number }
  /** Step through into another interior — a stair door, a inner gate. */
  | { kind: "enter"; site: string }
  /** Climb out of the top of a stair onto a roof. */
  | { kind: "roof" }
  | { kind: "exit" };

export interface Actor extends Billboard {
  /** Stable id, so a taken item stays taken. */
  id: string;
  /** How close you must be, in world units. */
  reach: number;
  /** Verb shown in the prompt, e.g. "SPEAK TO THE HERMIT". */
  label: string;
  /**
   * What pressing the key does. Creatures with nothing to say — a spider,
   * an orc — leave this out and simply prowl.
   */
  interaction?: Interaction;
}

/** The nearest actor within its own reach, or null. */
export function actorInReach(
  actors: readonly Actor[],
  x: number,
  y: number,
  skip: ReadonlySet<string>,
): Actor | null {
  let best: Actor | null = null;
  let bestDist = Infinity;
  for (const a of actors) {
    if (skip.has(a.id) || !a.interaction) continue;
    const dx = x - a.x;
    const dy = y - a.y;
    const d = dx * dx + dy * dy;
    if (d < a.reach * a.reach && d < bestDist) {
      best = a;
      bestDist = d;
    }
  }
  return best;
}

/**
 * Break text into lines that fit `maxPx` at `scale`. The pixel font has no
 * lower case, so callers pass upper-case copy — which is period-correct
 * anyway.
 */
export function wrapText(text: string, maxPx: number, scale: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && textWidth(candidate, scale) > maxPx) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}
