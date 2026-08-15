// Game state and simulation: the spirit-mage gliding over the moor, and
// through the keep gate into the dark. Fixed-timestep update, render every
// animation frame.

import { DENIZENS, roam } from "@/lib/rpg/denizens";
import { deathBillboard, type DeathStyle } from "@/lib/rpg/death";
import { REFERENCE_WRAITH } from "@/lib/rpg/reference-art.generated";
import {
  actorInReach,
  wrapText,
  type Actor,
} from "@/lib/rpg/interact";
import {
  CELL,
  KEEP_INTERIOR,
  ROOF_HEIGHT,
  TOWER_INTERIOR,
  entryOf,
  floorHeightAt,
  interiorRayRange,
  onExit,
  resolveInteriorMove,
  type Interior,
} from "@/lib/rpg/interior";
import { renderInterior } from "@/lib/rpg/interior";
import {
  ROOF_ACTORS,
  ROOF_PLATFORM,
  ROOF_PROPS,
  resolveRoofMove,
  roofEntry,
} from "@/lib/rpg/roof";
import {
  forward,
  type Billboard,
  type CameraState,
} from "@/lib/rpg/projection";
import {
  drawLightning,
  drawOverlay,
  renderFrame,
  type HudState,
  type LightningState,
  type OverlayState,
} from "@/lib/rpg/render";
import { Screen } from "@/lib/rpg/screen";
import { paletteAt } from "@/lib/rpg/regions";
import { drawAreaMap } from "@/lib/rpg/areamap";
import {
  CIRCLE_POS,
  GATE,
  GROVE_POS,
  HENGE_POS,
  KEEP_POS,
  VILLAGE_POS,
  DEAD_WOOD_X,
  resolveMove,
} from "@/lib/rpg/world";

export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
  /** Edge-triggered: set on key-down, cleared once the game consumes it. */
  interact: boolean;
  /** Edge-triggered: cast the selected spell straight ahead. */
  fire: boolean;
  /** Edge-triggered: opens or closes the area map. */
  toggleMap: boolean;
}

export function emptyInput(): InputState {
  return {
    forward: false,
    back: false,
    left: false,
    right: false,
    boost: false,
    interact: false,
    fire: false,
    toggleMap: false,
  };
}

const TURN_RATE = 2.3; // rad/s
const GLIDE_SPEED = 78; // world units/s
const BOOST_SPEED = 140;
const REVERSE_SPEED = 40;
const ACCEL = 240;
const LIGHTNING_RANGE = 220;
const LIGHTNING_HALF_WIDTH = 30;
const LIGHTNING_DAMAGE = 34;
const ENEMY_MAX_ENERGY = 100;
const FIRE_COOLDOWN = 0.2;
/** From the leads, the keep is under your feet — never in front of you. */
const OMIT_ON_ROOF: ReadonlySet<string> = new Set(["keep"]);

/** Indoors the mage drifts a little slower — the chambers are close. */
const INDOOR_SCALE = 0.85;

interface Wraith extends Billboard {
  id: string;
  hostile: true;
  deathStyle: "spirit";
  originX: number;
  originY: number;
  phase: number;
}

interface CombatTarget extends Billboard {
  id: string;
  deathStyle: DeathStyle;
}

interface DeathState {
  actor: Billboard;
  at: number;
  style: DeathStyle;
  scope: string;
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
  /** True when standing on the leads at the top of the keep. */
  private onRoof = false;
  /** Where to put her back when she descends a storey. */
  private innerReturn: CameraState | null = null;
  private doorstep: Doorstep = { x: 0, y: 0, yaw: 0 };
  /** Blocks re-triggering the doorway you are standing in. */
  private transitionLock = false;

  private readonly wraiths: Wraith[] = [
    {
      id: "wraith-1",
      hostile: true,
      deathStyle: "spirit",
      x: -70,
      y: 480,
      originX: -70,
      originY: 480,
      phase: 0,
      sprite: REFERENCE_WRAITH,
      height: 26,
    },
    {
      id: "wraith-2",
      hostile: true,
      deathStyle: "spirit",
      x: 180,
      y: 900,
      originX: 180,
      originY: 900,
      phase: 2.4,
      sprite: REFERENCE_WRAITH,
      height: 26,
    },
  ];

  private readonly hud: HudState = {
    spellName: "WRAITHLIGHT",
    selectedRune: 0,
    lifeforce: 0.72,
    gems: [true, true, false],
    place: "THE MOOR",
    carried: [],
    blips: [],
  };

  /** True while the area map is open; the world holds still behind it. */
  private mapOpen = false;

  /** Ids of items already taken and one-shot conversations already had. */
  private readonly taken = new Set<string>();
  /** What the mage is carrying. */
  private readonly carried: string[] = [];
  /** The open conversation, if any. */
  private talk: { name: string; pages: string[][]; page: number } | null = null;
  /** A transient line — "YOU TAKE THE TORC" — and when it expires. */
  private notice: { text: string; until: number } | null = null;
  /** Combatants only; peaceful actors never acquire a health bar. */
  private readonly enemyEnergy = new Map<string, number>();
  private readonly enemyDeaths = new Map<string, DeathState>();
  private lightning: LightningState | null = null;
  private nextFireAt = 0;
  private shotSeed = 0;

  constructor() {
    for (const d of DENIZENS) {
      if (d.hostile) this.enemyEnergy.set(d.id, ENEMY_MAX_ENERGY);
    }
    for (const w of this.wraiths) this.enemyEnergy.set(w.id, ENEMY_MAX_ENERGY);
  }

  update(dt: number, input: InputState): void {
    this.t += dt;
    if (this.lightning && this.t >= this.lightning.until) this.lightning = null;

    const pressed = input.interact;
    input.interact = false;
    const fired = input.fire;
    input.fire = false;

    // The map is modal: opening it stops the world, as the spellbook does.
    if (input.toggleMap) {
      input.toggleMap = false;
      this.mapOpen = !this.mapOpen;
      if (this.mapOpen) this.speed = 0;
    }
    if (this.mapOpen) {
      this.speed = 0;
      return;
    }

    // A conversation holds the world still; the same key turns the page.
    if (this.talk) {
      if (pressed) {
        this.talk.page++;
        if (this.talk.page >= this.talk.pages.length) this.talk = null;
      }
      this.speed = 0;
      return;
    }

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
    let moved = this.onRoof
      ? resolveRoofMove(nextX, nextY)
      : this.interior
        ? resolveInteriorMove(this.interior, this.cam.x, this.cam.y, nextX, nextY)
        : resolveMove(this.cam.x, this.cam.y, nextX, nextY);
    if (!this.interior && !this.onRoof) {
      moved = this.resolveWyrmMove(this.cam.x, this.cam.y, moved.x, moved.y);
    }
    if (moved.x === this.cam.x && moved.y === this.cam.y) this.speed = 0;
    this.cam.x = moved.x;
    this.cam.y = moved.y;

    // The floor comes up under her on a stair; on the roof it is simply high.
    this.cam.elev = this.onRoof
      ? ROOF_HEIGHT
      : this.interior
        ? floorHeightAt(this.interior, this.cam.y)
        : 0;

    this.checkDoorways();
    if (fired) this.tryFire();
    if (pressed) this.tryInteract();

    for (const w of this.wraiths) {
      w.x = w.originX + Math.sin(this.t * 0.4 + w.phase) * 46;
      w.y = w.originY + Math.cos(this.t * 0.27 + w.phase) * 30;
    }
    roam(DENIZENS, this.t);
  }

  /** Keep the camera outside the wyrm while always allowing the player to escape. */
  private resolveWyrmMove(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ): { x: number; y: number } {
    const wyrm = DENIZENS.find((d) => d.id === "wyrm");
    if (!wyrm) return { x: toX, y: toY };
    const radius = 66;
    const radialX = fromX - wyrm.x;
    const radialY = fromY - wyrm.y;
    const fromDistance = Math.hypot(radialX, radialY);
    const moveX = toX - fromX;
    const moveY = toY - fromY;
    const toDistance = Math.hypot(toX - wyrm.x, toY - wyrm.y);

    if (toDistance >= radius) return { x: toX, y: toY };

    // A roaming wyrm can overlap the player between frames. In that case,
    // retain outward and tangential movement instead of trapping the player.
    if (fromDistance < 0.001) return { x: toX, y: toY };
    const normalX = radialX / fromDistance;
    const normalY = radialY / fromDistance;
    const inward = moveX * normalX + moveY * normalY;
    if (inward >= 0) return { x: toX, y: toY };

    return {
      x: fromX + moveX - inward * normalX,
      y: fromY + moveY - inward * normalY,
    };
  }

  private scope(): string {
    if (this.onRoof) return "roof";
    return this.interior?.id ?? "world";
  }

  /** Cast one short-lived bolt and damage the nearest hostile in its lane. */
  private tryFire(): void {
    if (this.t < this.nextFireAt) return;
    this.nextFireAt = this.t + FIRE_COOLDOWN;

    const { fx, fy } = forward(this.cam.yaw);
    const outdoorTargets: CombatTarget[] = [
      ...DENIZENS.filter((d) => d.hostile).map((d) => ({
        ...d,
        deathStyle: "corporeal" as const,
      })),
      ...this.wraiths,
    ];
    const indoorTargets: CombatTarget[] = (this.interior?.actors ?? [])
      .filter((actor) => (actor as Actor & { hostile?: boolean }).hostile)
      .map((actor) => ({
        ...actor,
        deathStyle:
          (actor as Actor & { deathStyle?: DeathStyle }).deathStyle ?? "corporeal",
      }));
    const targets = this.interior ? indoorTargets : outdoorTargets;
    const range = this.interior
      ? interiorRayRange(
          this.interior,
          this.cam.x,
          this.cam.y,
          this.cam.yaw,
          LIGHTNING_RANGE,
        )
      : LIGHTNING_RANGE;
    let hit: CombatTarget | null = null;
    let hitDepth = range + 1;
    for (const target of targets) {
      if (this.enemyDeaths.has(target.id)) continue;
      const dx = target.x - this.cam.x;
      const dy = target.y - this.cam.y;
      const along = dx * fx + dy * fy;
      if (along < 18 || along > range || along >= hitDepth) continue;
      const lateral = Math.abs(dx * fy - dy * fx);
      const targetRadius = Math.max(LIGHTNING_HALF_WIDTH, target.height * 0.45);
      if (lateral <= targetRadius) {
        hit = target;
        hitDepth = along;
      }
    }

    let endX = this.cam.x + fx * range;
    let endY = this.cam.y + fy * range;
    let endHeight = 18;
    if (hit) {
      endX = hit.x;
      endY = hit.y;
      endHeight = (hit.elevate ?? 0) + hit.height * 0.66;
      const energy = Math.max(
        0,
        (this.enemyEnergy.get(hit.id) ?? ENEMY_MAX_ENERGY) - LIGHTNING_DAMAGE,
      );
      this.enemyEnergy.set(hit.id, energy);
      if (energy === 0) {
        this.enemyDeaths.set(hit.id, {
          actor: { ...hit },
          at: this.t,
          style: hit.deathStyle,
          scope: this.scope(),
        });
      }
    }

    this.lightning = {
      x: endX,
      y: endY,
      height: endHeight,
      hit: hit !== null,
      seed: ++this.shotSeed,
      until: this.t + 0.17,
    };
  }

  /** The actor the mage is close enough to act on, indoors, out, or aloft. */
  private nearby(): Actor | null {
    const actors = this.onRoof
      ? ROOF_ACTORS
      : this.interior
        ? this.interior.actors
        : DENIZENS.filter((d) => !this.enemyDeaths.has(d.id));
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
        this.hud.lifeforce = 1;
        if (what.gem >= 0 && what.gem < this.hud.gems.length) {
          this.hud.gems[what.gem] = true;
        }
      }
    } else if (what.kind === "pickup") {
      this.taken.add(actor.id);
      this.carried.push(what.item);
      this.notice = { text: what.onTake, until: this.t + 3.5 };
    } else if (what.kind === "enter") {
      // Remember the doorway so "go back down" returns you to it.
      this.innerReturn = { ...this.cam };
      this.interior = TOWER_INTERIOR;
      this.cam = entryOf(TOWER_INTERIOR);
      this.speed = 0;
      this.transitionLock = true;
    } else if (what.kind === "roof") {
      this.innerReturn = { ...this.cam };
      this.onRoof = true;
      this.cam = roofEntry();
      this.speed = 0;
    } else {
      this.leaveInterior();
    }
  }

  /** Back down one storey: roof to stair, stair to hall, hall to the moor. */
  private leaveInterior(): void {
    if (this.onRoof) {
      this.onRoof = false;
      this.cam = this.innerReturn ?? entryOf(TOWER_INTERIOR);
      this.innerReturn = null;
      this.speed = 0;
      return;
    }
    if (this.interior === TOWER_INTERIOR) {
      this.interior = KEEP_INTERIOR;
      this.cam = this.innerReturn ?? entryOf(KEEP_INTERIOR);
      this.innerReturn = null;
      this.speed = 0;
      this.transitionLock = true;
      return;
    }
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
      this.cam.y > GATE.y - GATE.trigger &&
      this.cam.y < GATE.y + GATE.trigger;
    if (inGate) {
      if (!this.transitionLock) {
        // Step back out facing away from the keep, clear of the arch.
        this.doorstep = {
          x: KEEP_POS.x,
          y: GATE.doorstepY,
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

  /** Name the ground she is standing on, for the panel caption. */
  private whereAmI(): string {
    if (this.onRoof) return "THE KEEP ROOF";
    if (this.interior) {
      return this.interior.id === "tower" ? "THE TOWER STAIR" : "THE KEEP";
    }
    const near = (p: { x: number; y: number }, r: number) =>
      Math.abs(this.cam.x - p.x) < r && Math.abs(this.cam.y - p.y) < r;
    if (near(KEEP_POS, 300)) return "THE KEEP";
    if (near(VILLAGE_POS, 210)) return "THE VILLAGE";
    if (near(HENGE_POS, 260)) return "THE HENGE";
    if (near(GROVE_POS, 210)) return "THE GROVE";
    if (near(CIRCLE_POS, 160)) return "STONE CIRCLE";
    if (this.cam.x < DEAD_WOOD_X) return "ANCIENT WOODS";
    return "THE MOOR";
  }

  /** Refresh the panel's live readouts before it is drawn. */
  private refreshPanel(): void {
    this.hud.place = this.whereAmI();
    this.hud.carried = this.carried;
    // Indoors the radar shows the room; outdoors, whatever is near enough.
    if (this.interior && !this.onRoof) {
      this.hud.plan = { rows: this.interior.plan, cell: CELL };
      this.hud.blips = this.interior.actors
        .filter((a) => !this.taken.has(a.id))
        .map((a) => ({ x: a.x, y: a.y, hostile: false }));
      return;
    }
    this.hud.plan = undefined;
    this.hud.blips = [
      ...DENIZENS.filter((d) => !this.enemyDeaths.has(d.id)).map((d) => ({
        x: d.x,
        y: d.y,
        hostile: d.hostile,
      })),
      ...this.wraiths
        .filter((w) => !this.enemyDeaths.has(w.id))
        .map((w) => ({ x: w.x, y: w.y, hostile: true })),
    ];
  }

  render(screen: Screen): void {
    // Indoors the camera is in room coordinates, so a building takes the
    // palette of the ground it stands on rather than of the origin.
    const ground = this.interior ? this.doorstep : this.cam;
    screen.palette = paletteAt(ground.x, ground.y);
    const overlay = this.overlay();
    // The haloed actor is the one the key would act on — the same test the
    // prompt uses, so the two can never disagree about what you are near.
    const near = this.talk ? null : this.nearby();
    const halo = <T extends Actor>(a: T) =>
      a.id === near?.id && a.id !== "wyrm" ? { ...a, highlight: true } : a;
    this.refreshPanel();
    if (this.mapOpen) {
      drawAreaMap(screen, this.cam, this.hud.place);
      return;
    }
    if (this.onRoof) {
      // The outdoor renderer, eye raised to the leads: the moor below is the
      // real one, only the battlements are local scenery.
      renderFrame(
        screen,
        this.cam,
        [...ROOF_PROPS, ...ROOF_ACTORS.map(halo)],
        this.hud,
        this.t,
        overlay,
        OMIT_ON_ROOF,
        ROOF_PLATFORM,
        this.lightning ?? undefined,
      );
      return;
    }
    if (this.interior) {
      const visible = this.interior.actors
        .filter((a) => !this.taken.has(a.id) && !this.enemyDeaths.has(a.id))
        .map(halo);
      renderInterior(
        screen,
        this.interior,
        this.cam,
        this.deathEntities(),
        this.t,
        visible,
      );
      if (this.lightning) drawLightning(screen, this.cam, this.t, this.lightning);
      drawOverlay(screen, this.hud, this.t, overlay, this.cam);
      return;
    }
    const visibleWraiths = this.wraiths
      .filter((w) => !this.enemyDeaths.has(w.id))
      .map((w) => ({
        ...w,
        energy: this.inZapRange(w)
          ? (this.enemyEnergy.get(w.id) ?? ENEMY_MAX_ENERGY) / ENEMY_MAX_ENERGY
          : undefined,
      }));
    const visibleDenizens = DENIZENS.filter((d) => !this.enemyDeaths.has(d.id)).map((d) =>
      halo(
        d.hostile && this.inZapRange(d)
          ? {
              ...d,
              energy:
                (this.enemyEnergy.get(d.id) ?? ENEMY_MAX_ENERGY) / ENEMY_MAX_ENERGY,
            }
          : d,
      ),
    );
    renderFrame(
      screen,
      this.cam,
      [...visibleWraiths, ...visibleDenizens, ...this.deathEntities()],
      this.hud,
      this.t,
      overlay,
      undefined,
      undefined,
      this.lightning ?? undefined,
    );
  }

  private inZapRange(actor: Billboard): boolean {
    return Math.hypot(actor.x - this.cam.x, actor.y - this.cam.y) <= LIGHTNING_RANGE;
  }

  private deathEntities(): Billboard[] {
    const scope = this.scope();
    const entities: Billboard[] = [];
    for (const death of this.enemyDeaths.values()) {
      if (death.scope !== scope) continue;
      const entity = deathBillboard(death.actor, death.at, this.t, death.style);
      if (entity) entities.push(entity);
    }
    return entities;
  }
}
