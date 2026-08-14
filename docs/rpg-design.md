# Spectrum RPG — design

Confirmed with the user on 2026-08-13 after a full design-tree interview. This is the
source of truth for what the game is. Change it only with the user's agreement.

## One sentence

An **open-world action-RPG for the browser** that looks like a lost 128K ZX Spectrum
masterpiece — Dragontorc's haunted Britain seen through a rotating perspective camera —
but runs on a modern TypeScript engine at 60fps.

## The two laws

1. **Looks real, runs free.** Every frame must be plausible Spectrum output: 256×192
   logical pixels, the 15-colour palette, background art limited to 2 colours per 8×8
   attribute cell. But the engine is modern TS — unlimited memory, smooth 60fps, real
   floating-point math. The Z80 emulator elsewhere in this repo is not involved.
2. **Open world, honestly.** Free roaming in every direction is a first-class promise.
   Distant landmarks are real places at real bearings: *see a castle on the horizon →
   walk to it → enter it.* No corridors dressed as worlds.

## Decisions

| Branch | Decision |
|---|---|
| Runtime | Modern TS engine; Spectrum display lens. Emulator untouched. |
| Look | **"Leyline"**: black-dominant green line-work terrain, cyan leylines as roads, floating spirit-mage hero seen from behind. Dragontorc grammar, original content. |
| Authenticity | Designed clash — 2 colours per 8×8 cell on backgrounds, enforced as a screen-space pass over the framebuffer; sprites are clash-free. Subtle, toggleable CRT presentation. |
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
