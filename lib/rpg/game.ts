// Game state and simulation: the spirit-mage gliding over the moor, and
// through the keep gate into the dark. Fixed-timestep update, render every
// animation frame.

import { WRAITH } from "@/lib/rpg/assets";
import { DENIZENS, roam } from "@/lib/rpg/denizens";
import {
  actorInReach,
  wrapText,
  type Actor,
} from "@/lib/rpg/interact";
import {
  KEEP_INTERIOR,
  entryOf,
  onExit,
  resolveInteriorMove,
  type Interior,
} from "@/lib/rpg/interior";
import { renderInterior } from "@/lib/rpg/interior";
import type { Billboard, CameraState } from "@/lib/rpg/projection";
import {
  drawOverlay,
  renderFrame,
  type HudState,
  type OverlayState,
} from "@/lib/rpg/render";
import { Screen } from "@/lib/rpg/screen";
import { GATE, KEEP_POS, resolveMove } from "@/lib/rpg/world";

export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
  /** Radians of pending mouse yaw, consumed each update (pointer-locked). */
  mouseYaw: number;
  /**
   * Cursor offset from screen centre, -1..1, used when pointer lock is
   * unavailable (embedded panes refuse it) — steer toward the cursor.
   */
  aim: number;
  /** Edge-triggered: set on key-down, cleared once the game consumes it. */
  interact: boolean;
}

export function emptyInput(): InputState {
  return {
    forward: false,
    back: false,
    left: false,
    right: false,
    boost: false,
    mouseYaw: 0,
    aim: 0,
    interact: false,
  };
}

const TURN_RATE = 2.3; // rad/s
const AIM_RATE = 2.0; // rad/s at full cursor deflection
const GLIDE_SPEED = 78; // world units/s
const BOOST_SPEED = 140;
const REVERSE_SPEED = 40;
const ACCEL = 240;
/** Indoors the mage drifts a little slower — the chambers are close. */
const INDOOR_SCALE = 0.85;

interface Wraith extends Billboard {
  originX: number;
  originY: number;
  phase: number;
}

/** Where the player stands when stepping back out of a site. */
interface Doorstep {
  x: number;
  y: number;
  yaw: number;
}

export class Game {
  private cam: CameraState = { x: 0, y: 40, yaw: 0 };
  private speed = 0;
  private t = 0;
  /** Null outdoors; the room plan when inside a site. */
  private interior: Interior | null = null;
  private doorstep: Doorstep = { x: 0, y: 0, yaw: 0 };
  /** Blocks re-triggering the doorway you are standing in. */
  private transitionLock = false;

  private readonly wraiths: Wraith[] = [
    {
      x: -70,
      y: 480,
      originX: -70,
      originY: 480,
      phase: 0,
      sprite: WRAITH,
      height: 26,
    },
    {
      x: 180,
      y: 900,
      originX: 180,
      originY: 900,
      phase: 2.4,
      sprite: WRAITH,
      height: 26,
    },
  ];

  private readonly hud: HudState = {
    spellName: "WRAITHLIGHT",
    selectedRune: 0,
    lifeforce: 23,
    gems: [true, true, false],
  };

  /** Ids of items already taken and one-shot conversations already had. */
  private readonly taken = new Set<string>();
  /** What the mage is carrying. */
  private readonly carried: string[] = [];
  /** The open conversation, if any. */
  private talk: { name: string; pages: string[][]; page: number } | null = null;
  /** A transient line — "YOU TAKE THE TORC" — and when it expires. */
  private notice: { text: string; until: number } | null = null;

  update(dt: number, input: InputState): void {
    this.t += dt;

    const pressed = input.interact;
    input.interact = false;

    // A conversation holds the world still; the same key turns the page.
    if (this.talk) {
      if (pressed) {
        this.talk.page++;
        if (this.talk.page >= this.talk.pages.length) this.talk = null;
      }
      this.speed = 0;
      return;
    }

    this.cam.yaw += input.mouseYaw;
    input.mouseYaw = 0;
    this.cam.yaw += input.aim * AIM_RATE * dt;
    if (input.left) this.cam.yaw -= TURN_RATE * dt;
    if (input.right) this.cam.yaw += TURN_RATE * dt;

    const scale = this.interior ? INDOOR_SCALE : 1;
    const target = input.forward
      ? (input.boost ? BOOST_SPEED : GLIDE_SPEED) * scale
      : input.back
        ? -REVERSE_SPEED * scale
        : 0;
    if (this.speed < target) {
      this.speed = Math.min(target, this.speed + ACCEL * dt);
    } else {
      this.speed = Math.max(target, this.speed - ACCEL * dt);
    }

    const nextX = this.cam.x + Math.sin(this.cam.yaw) * this.speed * dt;
    const nextY = this.cam.y + Math.cos(this.cam.yaw) * this.speed * dt;
    const moved = this.interior
      ? resolveInteriorMove(this.interior, this.cam.x, this.cam.y, nextX, nextY)
      : resolveMove(this.cam.x, this.cam.y, nextX, nextY);
    if (moved.x === this.cam.x && moved.y === this.cam.y) this.speed = 0;
    this.cam.x = moved.x;
    this.cam.y = moved.y;

    this.checkDoorways();
    if (pressed) this.tryInteract();

    for (const w of this.wraiths) {
      w.x = w.originX + Math.sin(this.t * 0.4 + w.phase) * 46;
      w.y = w.originY + Math.cos(this.t * 0.27 + w.phase) * 30;
    }
    roam(DENIZENS, this.t);
  }

  /** The actor the mage is close enough to act on, indoors or out. */
  private nearby(): Actor | null {
    const actors = this.interior ? this.interior.actors : DENIZENS;
    return actorInReach(actors, this.cam.x, this.cam.y, this.taken);
  }

  private tryInteract(): void {
    const actor = this.nearby();
    if (!actor?.interaction) return;
    const what = actor.interaction;
    if (what.kind === "talk" || what.kind === "bless") {
      this.talk = {
        name: what.name,
        pages: what.lines.map((line) => wrapText(line, 224, 1)),
        page: 0,
      };
      this.speed = 0;
      if (what.kind === "bless") {
        this.hud.lifeforce = 34;
        if (what.gem >= 0 && what.gem < this.hud.gems.length) {
          this.hud.gems[what.gem] = true;
        }
      }
    } else if (what.kind === "pickup") {
      this.taken.add(actor.id);
      this.carried.push(what.item);
      this.notice = { text: what.onTake, until: this.t + 3.5 };
    } else {
      this.leaveInterior();
    }
  }

  private leaveInterior(): void {
    this.interior = null;
    this.cam = { ...this.doorstep };
    this.speed = 0;
    this.transitionLock = true;
  }

  /** What the overlay should show this frame. */
  private overlay(): OverlayState {
    if (this.talk) {
      return {
        prompt: null,
        dialogue: {
          name: this.talk.name,
          lines: this.talk.pages[this.talk.page] ?? [],
          more: this.talk.page < this.talk.pages.length - 1,
        },
      };
    }
    if (this.notice && this.t < this.notice.until) {
      // Notices go in the wrapped window, not the one-line prompt — a long
      // line used to run straight off the right edge.
      return {
        prompt: null,
        dialogue: {
          name: "",
          lines: wrapText(this.notice.text, 224, 1),
          more: false,
        },
      };
    }
    const actor = this.nearby();
    return { prompt: actor ? `E   ${actor.label}` : null, dialogue: null };
  }

  /** Glide into the gate to enter; drift back over the threshold to leave. */
  private checkDoorways(): void {
    if (this.interior) {
      // Leaving is deliberate now — walk to the lit arch and press the key.
      // Drifting over a tile used to teleport you out with no warning.
      if (!onExit(this.interior, this.cam.x, this.cam.y)) {
        this.transitionLock = false;
      }
      return;
    }

    // A bounded box under the arch, not a half-plane: the old test was
    // "anywhere north of this line", which swallowed anyone who walked
    // round to the back of the keep.
    const inGate =
      Math.abs(this.cam.x - KEEP_POS.x) < GATE.halfW &&
      this.cam.y > KEEP_POS.y - GATE.trigger &&
      this.cam.y < KEEP_POS.y + GATE.trigger;
    if (inGate) {
      if (!this.transitionLock) {
        // Step back out facing away from the keep, clear of the arch.
        this.doorstep = {
          x: KEEP_POS.x,
          y: KEEP_POS.y - GATE.depth - 24,
          yaw: Math.PI,
        };
        this.interior = KEEP_INTERIOR;
        this.cam = entryOf(KEEP_INTERIOR);
        this.speed = 0;
        this.transitionLock = true;
      }
    } else {
      this.transitionLock = false;
    }
  }

  render(screen: Screen): void {
    const overlay = this.overlay();
    // The haloed actor is the one the key would act on — the same test the
    // prompt uses, so the two can never disagree about what you are near.
    const near = this.talk ? null : this.nearby();
    const halo = <T extends Actor>(a: T) =>
      a.id === near?.id ? { ...a, highlight: true } : a;
    if (this.interior) {
      const visible = this.interior.actors
        .filter((a) => !this.taken.has(a.id))
        .map(halo);
      renderInterior(screen, this.interior, this.cam, [], this.t, visible);
      drawOverlay(screen, this.hud, this.t, overlay);
      return;
    }
    renderFrame(
      screen,
      this.cam,
      [...this.wraiths, ...DENIZENS.map(halo)],
      this.hud,
      this.t,
      overlay,
    );
  }
}
