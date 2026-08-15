# Spectrum RPG — design

Confirmed with the user on 2026-08-13 after a full design-tree interview. This is the
source of truth for what the game is. Change it only with the user's agreement.

## One sentence

An **open-world action-RPG for the browser** that looks like a lost 128K ZX Spectrum
masterpiece — Dragontorc's haunted Britain seen through a rotating perspective camera —
but runs on a modern TypeScript engine at 60fps.

## The two laws

1. **Looks real, runs free.** Every frame must be plausible Spectrum-family output:
   256×192 logical pixels, the 15-colour palette for sprites, HUD and light, plus
   ULAplus-fiction terrain rows — per-region 4-step ground and sky value ramps
   (palette 16–23) — background art limited to 2 colours per 8×1 attribute strip
   (the Timex hi-colour fiction), presented through subtle CRT glass by default
   (toggleable). Amended from 8×8 cells / 15 colours flat with the Dusk look, then
   to the Relief look (ramps + rolling heightfield + CRT), then to the moonlit
   night key (navy sky-row values, three-magnitude starfield, all-soil ground
   mat), all 2026-08-15. But the
   engine is modern TS — unlimited memory, smooth 60fps, real floating-point math.
   The Z80 emulator elsewhere in this repo is not involved.
2. **Open world, honestly.** Free roaming in every direction is a first-class promise.
   Distant landmarks are real places at real bearings: *see a castle on the horizon →
   walk to it → enter it.* No corridors dressed as worlds. The horizon honours this
   (the skyline ring, adopted 2026-08-15): sites beyond their draw range keep a
   silhouette at their true bearing, sized by true distance, standing where the drawn
   land meets the sky and dither-fading into their real geometry as you approach —
   with nameless ruin stubs between them, dressing only, on the ranges' own fiction.

## Decisions

| Branch | Decision |
|---|---|
| Runtime | Modern TS engine; Spectrum display lens. Emulator untouched. |
| Look | **"Leyline — Relief"** (adopted 2026-08-15 from rendered prototypes, superseding Dusk from earlier the same day): a shaded ULAplus world — gradient night sky, mottled tonal ground, lit leyline verge — rolling over a value-noise heightfield whose ridges occlude and stand against the sky, seen through CRT glass. Green line-work and dense undergrowth over it; cyan leylines as roads; floating spirit-mage hero seen from behind. Dragontorc grammar, original content. Amended again 2026-08-15 (the night-key round, held against the graveyard concept frame): the sky rows carry a just-visible navy night gradient under a deep azimuth-anchored starfield, and the ground mat shades through soil tones only — bright green ink marks growth, never ground. Flags in `lib/rpg/look.ts` (`night` and `skyline` dials, defaults moonlit + peopled); Relief, Dusk and the original void-black look survive as presets. |
| Authenticity | Designed clash — 2 colours per 8×1 strip on backgrounds (Timex hi-colour fiction), enforced as a screen-space pass over the framebuffer; the ULAplus ramps vote in it like any ink; sprites are clash-free. Terrain-only palette rows: index 8 earth tone, 16–19 ground ramp, 20–23 sky ramp (black stays black for water and sprite work). Sites and the leyline road sit on level aprons of the heightfield. Subtle CRT presentation, on by default, toggleable (C). |
| Camera | Smooth Mode-7-style rotation; hero at your back; the attribute grid stays fixed to the "glass" while the world turns beneath it. |
| World | Open biomes (woods, plains, moor) + enterable sites (castles, towers, barrow dungeons). Interiors use the same perspective camera with walls closing in. |
| Mechanics | Action-RPG: real-time aimed bolts + wards + utility spells; lifeforce; inventory and quest items; light stats that can deepen later. |
| Spellbook | Dragontorc-style pause-menu spellbook (windowed, runic) + 3–4 quick-select slots. |
| Input | Keyboard moves (WASD/arrows), mouse refines facing / aims / casts. Desktop-first. |
| Sound | AY-3-8912-style 3-channel chiptune + SFX, synthesized in WebAudio (128K fiction). |
| Saves | Auto-save at safe moments + named slots, in localStorage. |
| Lore | "Same soil, new myth": dark-ages Britain, leylines, barrows, stone circles — original hero, antagonist, artifact. No Maroc, no Morag, no Merlyn. |
| Authoring | World + sprites as readable data files in-repo (text bitmaps, biome maps). A Studio world editor only if data-file friction demands it. |
| Home | This repo, route `/rpg`; engine code in `lib/rpg/`. Single-player. |

## Visual reference

The look was chosen from generated 256×192 concept art. The winning concept
("V2 — Leyline") established: night sky with thin moon; horizon around y≈60; green
contour/tuft terrain floating in black; gnarled leafless trees; a keep silhouette with
a lit gate on the horizon; a cyan leyline running down the path; the hooded hero
hovering (no legs, robe tapering to a wisp); a dark HUD with a yellow spell name in
blocky pixel text, a green LIFEFORCE bar, and rune icons.

## V1 slice (agreed scope)

One open region (moor + woods edge) · rotating camera, free roam · one castle visible
from afar, walkable-to and enterable (a few rooms) · one barrow dungeon · 3 spells
(bolt, light, ward) · 2 enemy types · lifeforce · auto-save · AY title theme + basic
SFX · subtle CRT. Playable end-to-end in ~10 minutes.

**Build order: renderer first** — walking the moor with the rotating camera is the
first milestone, before combat or interiors.

## Deliberately open (owed an options pass each, like the art got)

Title · hero/antagonist names · full spell list & names · enemy roster · final HUD
layout · music direction.

## Technical sketch (implementation may refine, not contradict)

- Indexed 256×192 framebuffer (Uint8 palette indices) drawn per-frame in TS:
  Mode-7 ground-plane scanlines below the horizon, billboard sprites scaled by 1/z
  and painter-sorted, hero composited last before the HUD.
- Post passes over the framebuffer: attribute quantize (per 8×8 cell keep the two
  dominant colours), then present scaled with nearest-neighbour + CRT overlay.
- Deterministic hash-based terrain detail (no per-frame RNG), authored biome/site
  data over it.
- Sprites authored as string-array bitmaps (one char per pixel, char→colour legend).
