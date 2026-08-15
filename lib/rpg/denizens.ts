// Who is out on the moor. Everything here roams a fixed orbit around its
// home ground - deterministic, so the world is the same every session - and
// the friendly ones carry something to say.

import {
  ELF_ARCHER,
  NPC_HERMIT,
  SPIDER,
  WATER_SPIRIT,
} from "@/lib/rpg/bestiary";
import { SPIRIT_WISP } from "@/lib/rpg/flora";
import type { Actor } from "@/lib/rpg/interact";
import {
  REFERENCE_BRUTE,
  REFERENCE_DRAGON,
  REFERENCE_GOBLIN,
  REFERENCE_SKELETON,
} from "@/lib/rpg/reference-art.generated";
import { GROVE_POS, HENGE_POS, HERMITAGE_POS } from "@/lib/rpg/world";
import {
  VILLAGE_INNKEEPER,
  VILLAGE_POS,
  VILLAGE_WANDERER,
} from "@/lib/rpg/village";

export interface Denizen extends Actor {
  /** Home ground; the creature orbits this point. */
  originX: number;
  originY: number;
  /** Orbit radii and rate - two axes so the path is an ellipse, not a circle. */
  roamX: number;
  roamY: number;
  rate: number;
  phase: number;
  /** Hostiles have no interaction and will one day fight back. */
  hostile: boolean;
}

function denizen(d: Omit<Denizen, "x" | "y">): Denizen {
  return { ...d, x: d.originX, y: d.originY };
}

/**
 * The dragon crosses the western moor in sight of the starting leyline, and
 * south of the stone circle so its orbit never carries it into the stones.
 */
export const DRAGON_HOME = { x: -340, y: 280 };
/** The elves keep to a grove east of the line. */
const GROVE = { x: 380, y: 150 };

export const DENIZENS: Denizen[] = [
  denizen({
    id: "wyrm",
    originX: DRAGON_HOME.x,
    originY: DRAGON_HOME.y,
    roamX: 150,
    roamY: 90,
    rate: 0.11,
    phase: 0,
    hostile: false,
    sprite: REFERENCE_DRAGON,
    height: 118,
    reach: 96,
    label: "GREET THE WYRM",
    interaction: {
      kind: "talk",
      name: "THE WYRM",
      lines: [
        "HELLO, LITTLE LIGHT. YOU ARE THE FIRST THING TO WALK UP TO ME IN THREE HUNDRED YEARS.",
        "MOST RUN. IT IS A WASTE - I HAVE NOT EATEN ANYONE SINCE THE OLD KING, AND HE DISAGREED WITH ME.",
        "GO ON, THEN. THE KEEP IS NORTH ALONG THE LEY. MIND THE THINGS THAT CRAWL.",
      ],
    },
  }),

  // The kind folk of the greenwood.
  denizen({
    id: "elf-warden",
    originX: GROVE.x,
    originY: GROVE.y,
    roamX: 26,
    roamY: 18,
    rate: 0.22,
    phase: 0.6,
    hostile: false,
    sprite: ELF_ARCHER,
    height: 24,
    reach: 40,
    label: "SPEAK TO THE WARDEN",
    interaction: {
      kind: "talk",
      name: "GREENWOOD WARDEN",
      lines: [
        "PEACE, SPIRIT. WE KNOW WHAT YOU ARE - THE LEY CARRIES YOU AND WE FEEL IT MOVE.",
        "GOBLINS CAME DOWN OFF THE MOOR AT THE LAST DARK MOON. WE PUT ARROWS IN THREE. MORE CAME.",
        "IF YOU GO TO THE KEEP, GO ARMED WITH SOMETHING BETTER THAN COURAGE.",
      ],
    },
  }),
  denizen({
    id: "elf-scout",
    originX: GROVE.x + 62,
    originY: GROVE.y + 34,
    roamX: 34,
    roamY: 22,
    rate: 0.19,
    phase: 2.1,
    hostile: false,
    sprite: ELF_ARCHER,
    height: 23,
    reach: 38,
    label: "SPEAK TO THE SCOUT",
    interaction: {
      kind: "talk",
      name: "GREENWOOD SCOUT",
      lines: [
        "STAND STILL A MOMENT. THERE - DID YOU HEAR IT? SPIDERS. THEY HUNT THE HOLLOWS AT NIGHT.",
        "THE WYRM TO THE WEST WILL NOT HARM YOU. IT IS LONELY, AND IT TALKS. THAT IS ALL IT DOES NOW.",
      ],
    },
  }),

  // A hermit keeping his own company in the ancient woods, pottering in the
  // yard between his door, his hearth and his herb bed.
  denizen({
    id: "hermit",
    originX: HERMITAGE_POS.x + 26,
    originY: HERMITAGE_POS.y - 46,
    roamX: 22,
    roamY: 14,
    rate: 0.15,
    phase: 1.4,
    hostile: false,
    sprite: NPC_HERMIT,
    height: 27,
    reach: 42,
    label: "SPEAK TO THE HERMIT",
    interaction: {
      kind: "talk",
      name: "THE HERMIT",
      lines: [
        "EH? OH. YOU ARE ONE OF THE LEY-WALKERS. WE USED TO GET A LOT OF YOU.",
        "THE STONES EAST OF HERE WERE RAISED TO HOLD SOMETHING DOWN, NOT TO MARK A GRAVE. MIND THAT.",
        "IF YOU MEET THE WYRM, BE POLITE. IT IS OLDER THAN THE STONES AND IT HAS MANNERS.",
      ],
    },
  }),

  denizen({
    id: "village-innkeeper",
    originX: VILLAGE_POS.x + 42,
    originY: VILLAGE_POS.y + 5,
    roamX: 18,
    roamY: 13,
    rate: 0.17,
    phase: 0.4,
    hostile: false,
    sprite: VILLAGE_INNKEEPER,
    height: 25,
    reach: 42,
    label: "SPEAK TO THE INNKEEPER",
    interaction: {
      kind: "talk",
      name: "THE INNKEEPER",
      lines: [
        "THE LANTERN IS LIT, BUT THE COMMON ROOM IS QUIET. FOLK HAVE HEARD THINGS MOVING BY THE KEEP.",
        "YOU MAY FIND A BED HERE WHEN THE DOOR IS OPEN. FOR NOW, STAY ON THE LANE AND MIND THE WELL.",
      ],
    },
  }),
  denizen({
    id: "village-wanderer",
    originX: VILLAGE_POS.x - 52,
    originY: VILLAGE_POS.y - 73,
    roamX: 33,
    roamY: 24,
    rate: 0.14,
    phase: 2.2,
    hostile: false,
    sprite: VILLAGE_WANDERER,
    height: 24,
    reach: 40,
    label: "SPEAK TO THE VILLAGER",
    interaction: {
      kind: "talk",
      name: "A VILLAGER",
      lines: [
        "THE EAST COTTAGE IS MINE. THE OTHER BELONGS TO MY SISTER, THOUGH SHE HAS GONE TO THE GROVE.",
        "THE RED WYRM WILL TALK YOUR EAR OFF, BUT IT HAS NEVER HARMED THIS VILLAGE. THE MOOR-THINGS ARE WORSE.",
      ],
    },
  }),

  // The lady of the sacred pool. She rises where the water is stillest.
  denizen({
    id: "pool-lady",
    originX: GROVE_POS.x,
    originY: GROVE_POS.y,
    roamX: 0,
    roamY: 4,
    rate: 0.5,
    phase: 0,
    hostile: false,
    sprite: WATER_SPIRIT,
    height: 52,
    elevate: 15,
    reach: 104,
    label: "RECEIVE THE BLESSING",
    interaction: {
      kind: "bless",
      name: "THE LADY OF THE POOL",
      lines: [
        "COME TO THE WATER, LITTLE LIGHT. I HAVE STOOD HERE SINCE BEFORE THE STONES WERE RAISED.",
        "BE MENDED. WHAT THE MOOR TOOK FROM YOU, THE POOL GIVES BACK.",
        "GO WELL. THE HENGE IS EAST OF HERE, AND WHAT SLEEPS UNDER IT IS NOT MINE TO WAKE.",
      ],
      gem: 2,
    },
  }),

  // Wisps drifting among the henge stones and the greenwood.
  ...([
    { id: "wisp-1", x: HENGE_POS.x - 60, y: HENGE_POS.y + 40, p: 0.0 },
    { id: "wisp-2", x: HENGE_POS.x + 80, y: HENGE_POS.y - 30, p: 1.7 },
    { id: "wisp-3", x: HENGE_POS.x + 10, y: HENGE_POS.y + 120, p: 3.0 },
    { id: "wisp-4", x: GROVE_POS.x + 150, y: GROVE_POS.y + 90, p: 2.3 },
    { id: "wisp-5", x: 620, y: 260, p: 0.9 },
  ] as const).map((w) =>
    denizen({
      id: w.id,
      originX: w.x,
      originY: w.y,
      roamX: 58,
      roamY: 40,
      rate: 0.24,
      phase: w.p,
      hostile: false,
      sprite: SPIRIT_WISP,
      height: 20,
      elevate: 16,
      reach: 0,
      label: "",
    }),
  ),

  // And the things that crawl.
  ...([
    { id: "gob-1", x: 210, y: 620, s: REFERENCE_GOBLIN, h: 19, p: 0.0 },
    { id: "gob-2", x: 262, y: 668, s: REFERENCE_GOBLIN, h: 18, p: 1.3 },
    { id: "gob-3", x: -180, y: 830, s: REFERENCE_GOBLIN, h: 19, p: 2.6 },
    { id: "orc-1", x: -110, y: 1030, s: REFERENCE_BRUTE, h: 26, p: 0.4 },
    { id: "orc-2", x: 120, y: 1120, s: REFERENCE_BRUTE, h: 27, p: 3.1 },
    { id: "ghoul-1", x: 40, y: 760, s: REFERENCE_SKELETON, h: 23, p: 1.9 },
    { id: "ghoul-2", x: -240, y: 1180, s: REFERENCE_SKELETON, h: 22, p: 0.8 },
    // Spiders hunt the dead wood between the stones and the hermitage —
    // clear of both clearings, so neither place is walked into fighting.
    { id: "spider-1", x: -590, y: 620, s: SPIDER, h: 14, p: 2.2 },
    { id: "spider-2", x: -330, y: 760, s: SPIDER, h: 15, p: 0.3 },
    { id: "spider-3", x: 300, y: 940, s: SPIDER, h: 14, p: 1.1 },
  ] as const).map((m) =>
    denizen({
      id: m.id,
      originX: m.x,
      originY: m.y,
      roamX: 40,
      roamY: 30,
      rate: 0.3,
      phase: m.p,
      hostile: true,
      sprite: m.s,
      height: m.h,
      reach: 0,
      label: "",
    }),
  ),
];

/** Walk every denizen along its orbit. Pure function of time. */
export function roam(denizens: readonly Denizen[], t: number): void {
  for (const d of denizens) {
    d.x = d.originX + Math.sin(t * d.rate + d.phase) * d.roamX;
    d.y = d.originY + Math.cos(t * d.rate * 0.8 + d.phase) * d.roamY;
  }
}
