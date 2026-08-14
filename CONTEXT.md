# Spectrum Studio

A browser workspace for writing ZX Spectrum games in C and watching them run on an emulated Spectrum. There are two ways in — a live editing studio and a file-backed player — and they deliberately share nothing.

## Language

### Workspaces

**Studio**:
The three-pane browser workspace: editor, emulator, co-pilot. Its code belongs to the browser and never reaches the repo.
_Avoid_: IDE, playground, app

**Player**:
The file-backed workspace that boots a Game straight from the repo. It runs code; it never edits it.
_Avoid_: runner, viewer, /play page

**Co-pilot**:
The Claude pane inside the Studio. It proposes C for the editor, and that is the limit of its reach — it cannot write files or compile.
_Avoid_: assistant, chatbot, agent, AI

### Code and artifacts

**Game**:
A single self-contained C file in `games/`, owned by the repo and editable by anything that can write a file — a person, a script, an agent.
_Avoid_: project, sketch, demo

**Editor buffer**:
The C text currently open in the Studio. Unnamed, unsaved, and never a Game.
_Avoid_: draft, document, source file

**Snapshot**:
The RAM image a compile produces by default. The emulator restores it in one step, with no Tape load, which is what makes a run cheap enough to fire on every save.
_Avoid_: save state, dump, image

**Tap**:
The tape image a compile produces on request. What real hardware and other emulators take; not what either workspace boots.
_Avoid_: binary, executable, build, ROM

### The machine

**Machine**:
The Spectrum model the emulator presents. Everything here targets 48K; 128K and Pentagon exist in the emulator but nothing selects them.
_Avoid_: model, target, platform, hardware

**Tape load**:
The emulated cassette-loading sequence between a finished compile and a playable Game. Only a Tap pays it; a Snapshot skips it entirely.
_Avoid_: boot, startup, loading screen, warm-up
