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

## Two ways to build a game

**In the browser** — http://localhost:3000. Editor, emulator, co-pilot. Source lives in `localStorage`, so it never touches the repo. Good for a scratch idea.

**From files** — drop a `.c` file in `games/` and open http://localhost:3000/play?src=yourgame.c. The page compiles that file on load and boots it. **Auto** (on by default) watches the file and rebuilds on every save, so you never touch the browser; **Rebuild** (or ⌘/Ctrl-Enter) forces one by hand. `/play` with no `src` lists everything in `games/`.

The file path is the one to use when something other than the browser is writing the code — your own editor, a script, or an agent with filesystem access. Nothing is shared between the two: the studio never reads `games/`, and `/play` never reads `localStorage`.

Both go through the same `/api/compile` route and the same z88dk flags. `POST {"source": "..."}` compiles a string; `POST {"path": "hello.c"}` compiles a file, resolved strictly inside `games/` (traversal and symlinks out of the directory are rejected).

### Driving the keyboard

`/play?src=hello.c&keys=wait:200,space` replays a key sequence into the emulator after every build, so a game that waits for input can get past the prompt on its own.

- `<key>[:frames]` — press, held for `frames` frames (default 12). Names: `space`, `enter`, `shift`, `up`, `down`, `left`, `right`, plus any single letter or digit.
- `wait:frames` — idle.

Holds are counted in animation frames, not milliseconds, because JSSpeccy steps the Z80 from `requestAnimationFrame`. In a hidden or background tab the machine runs at a crawl, and a millisecond-based press begins and ends between two emulated frames without the keyboard matrix ever being sampled.

One trap worth knowing: z88dk's `in_wait_key()` waits for *no* key before it waits for one, so a key still held when the program reaches it wedges the program permanently. The replay waits 60 frames before its first press for that reason — lead with your own `wait:` token to change that.

### Output format

`POST {"format": "sna" | "tap"}`, default `sna`.

A `.tap` has to be loaded through the emulated tape deck: the Spectrum runs the ROM loader for thousands of emulated frames and you watch the loading screen, same as 1982. A `.sna` (`zcc -subtype=sna`) is a 49K RAM image the emulator restores in one step, so the program is running before the frame is drawn. That's what both surfaces ask for, because a run happens every time you save.

Ask for `tap` when you want the artifact rather than the run — a `.tap` is what you'd hand to real hardware or another emulator. The response names it in `Content-Disposition` and repeats the choice in `X-Spectrum-Format`.

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
| Storage          | `localStorage` (studio) · `games/*.c` (`/play`) |

## Roadmap (not built yet)

- 128K target with AY sound presets.
- Project library + share-via-URL (Vercel Blob).
- Sprite editor (SP1 / Bifrost tile packs).
- Save snapshots (`.z80`) from the running emulator.
- Sandboxed compile (Docker-in-Docker, gVisor, or a hosted microVM) if you ever expose this publicly.

## Licenses

- JSSpeccy 3 is GPLv3 — see `public/jsspeccy/COPYING`. The vendored binary is unmodified.
- This project is MIT.
