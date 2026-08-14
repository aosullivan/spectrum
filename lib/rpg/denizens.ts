// Who is out on the moor. Everything here roams a fixed orbit around its
// home ground - deterministic, so the world is the same every session - and
// the friendly ones carry something to say.

import {
  DRAGON,
  ELF_ARCHER,
  GHOUL,
  GOBLIN,
  ORC,
  SPIDER,
  WATER_SPIRIT,
} from "@/lib/rpg/bestiary";
import { SPIRIT_WISP } from "@/lib/rpg/flora";
import type { Actor } from "@/lib/rpg/interact";
import { GROVE_POS, HENGE_POS } from "@/lib/rpg/world";

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

/** The dragon's home ground: west of the leyline, in sight of the start. */
export const DRAGON_HOME = { x: -340, y: 300 };
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
    sprite: DRAGON,
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
    { id: "gob-1", x: 210, y: 620, s: GOBLIN, h: 19, p: 0.0 },
    { id: "gob-2", x: 262, y: 668, s: GOBLIN, h: 18, p: 1.3 },
    { id: "gob-3", x: -180, y: 830, s: GOBLIN, h: 19, p: 2.6 },
    { id: "orc-1", x: -110, y: 1030, s: ORC, h: 26, p: 0.4 },
    { id: "orc-2", x: 120, y: 1120, s: ORC, h: 27, p: 3.1 },
    { id: "ghoul-1", x: 40, y: 760, s: GHOUL, h: 23, p: 1.9 },
    { id: "ghoul-2", x: -240, y: 1180, s: GHOUL, h: 22, p: 0.8 },
    { id: "spider-1", x: -430, y: 560, s: SPIDER, h: 14, p: 2.2 },
    { id: "spider-2", x: -520, y: 720, s: SPIDER, h: 15, p: 0.3 },
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
