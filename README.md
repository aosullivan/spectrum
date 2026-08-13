# Spectrum Studio

Vibe-code ZX Spectrum games in C, in your browser.

Three panes, side by side:

- **Editor** — Monaco, C syntax, ⌘/Ctrl-Enter to compile.
- **Emulator** — JSSpeccy 3 (full Z80 + ULA + AY emulation, 48K by default).
- **Co-pilot** — Claude with a system prompt that knows Spectrum hardware and z88dk idioms. Tap "Apply to editor" on any code block.

The default program prints `HELLO, SPECTRUM!` and flashes the border. Hit **Compile & Run** to see it.

## Setup

```bash
npm install
```

### z88dk (the C → .tap compiler)

The `/api/compile` route shells out to `zcc`. Two options:

**Local install** (recommended on dev machines):

```bash
brew install z88dk          # macOS
# or follow https://github.com/z88dk/z88dk/wiki/installation for other platforms
```

**Docker** (fallback if `zcc` isn't on PATH):

```bash
docker pull z88dk/z88dk:latest
```

The route tries local `zcc` first, then Docker. If neither is available it returns a clear error to the UI.

### AI co-pilot

The chat route talks to Anthropic directly. Put an `ANTHROPIC_API_KEY` in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get one at https://console.anthropic.com/settings/keys.

Optional: `AI_MODEL` to swap models (defaults to `claude-sonnet-4-6`).

## Run

```bash
npm run dev
```

Open http://localhost:3000.

## Deploy

It's just Next.js + a Node API route that shells out to a compiler. Host it anywhere that runs Node and has `zcc` (or Docker) available — your own box, Fly.io, Railway, a Raspberry Pi. There's no platform lock-in.

## Stack

| Piece            | Choice                                   |
| ---------------- | ---------------------------------------- |
| Framework        | Next.js 16 App Router + Tailwind CSS v4  |
| Editor           | `@monaco-editor/react`                   |
| Emulator         | JSSpeccy 3.2 (vendored in `public/`)     |
| Compiler         | z88dk (`zcc +zx ... -create-app`)        |
| AI               | AI SDK v6 + `@ai-sdk/anthropic`          |
| Layout           | `react-resizable-panels` v4              |
| Storage          | `localStorage` (one key, last source)    |

## Roadmap (not built yet)

- 128K target with AY sound presets.
- Project library + share-via-URL (Vercel Blob).
- Sprite editor (SP1 / Bifrost tile packs).
- Save snapshots (`.z80`) from the running emulator.
- Sandboxed compile (Docker-in-Docker, gVisor, or a hosted microVM) if you ever expose this publicly.

## Licenses

- JSSpeccy 3 is GPLv3 — see `public/jsspeccy/COPYING`. The vendored binary is unmodified.
- This project is MIT.
