# Running two agents on this repo at once

Two Claude sessions working in the same checkout **will** clobber each other.
This is not a theoretical risk — it happened here on 2026-08-14. One session
was building a bestiary while another was building tower verticality, both
editing `lib/rpg/game.ts`, `render.ts` and `interact.ts`. Files changed
between one session's read and its write; edits landed on top of edits.
Neither git nor the editor warns you, because both agents are writing the
working tree directly.

If you are about to start a second session on this repo, put it in a
worktree first.

## Spotting the problem

Symptoms, in the order you usually meet them:

- A `Write`/`Edit` fails with "file has been modified since read".
- Code you were about to write is already there — with comments in a voice
  you don't recognise.
- New files appear that you did not create.

Confirm it before acting:

```bash
ps -eo pid,etime,command | grep -c "[c]laude --output-format stream-json"
ls -lT lib/rpg/*.ts | sort -k7
```

More than one `claude` process on the same directory, and modification times
inside the last minute you cannot account for, means a live second writer.

## Setting up an isolated worktree

One command does the whole thing:

```bash
npm run worktree new <feature>
```

It creates `../spectrum-<feature>` on a new branch, copies `node_modules`
across, and prints the port that worktree owns. Three details it handles that
are easy to get wrong by hand:

- **It refuses to run with a dirty tree.** A worktree only carries committed
  content, so uncommitted work would simply not be there — which looks
  exactly like having lost it. Commit or stash, then run it again.
- **It branches from local `HEAD`, not `origin`.** `EnterWorktree` defaults to
  branching from `origin/<default-branch>`, which on this repo is well behind
  local `main`. To enter a worktree made this way, pass the path:
  `EnterWorktree({ path: "/Users/you/spectrum-<feature>" })`.
- **It clones `node_modules` rather than reinstalling it.** `cp -Rc` is an APFS
  clone: the 584 MB is shared with this checkout copy-on-write, so it takes
  about four seconds and almost no disk. It falls back to `npm install` on a
  filesystem that cannot clone.

Existing worktrees, including ones `EnterWorktree` made under
`.claude/worktrees/`, work the same way once they carry this `scripts/`
directory. `npm run worktree ls` shows all of them with their ports.

## Running a dev server per worktree

`npm run dev` gives each worktree its own port automatically. The main
checkout keeps 3000; every other worktree claims one from 3001 upward the
first time it starts, and keeps it after that, so its URL is stable:

```
rpg-verticality → http://localhost:3004
  /Users/you/spectrum-verticality
  preview_start({ url: "http://localhost:3004" })
```

The claims live in `dev-ports.json` inside the **shared** git directory —
`git rev-parse --git-common-dir` resolves to the same path from every
worktree, which is what lets them agree without a daemon. Ports are released
automatically when a worktree is removed. `npm run worktree ls` prints the
table, `npm run dev -- --new-port` forces a fresh claim.

The port is only half of it. Next stores its dev lock at `.next/dev/lock`
inside whichever directory it resolves as the *project*, so two servers that
resolve to the same project directory refuse to run together:

```
⨯ Another next dev server is already running.
```

`scripts/dev.mjs` resolves the project from `import.meta.dirname` — its own
location on disk — and passes that to `next dev` as an explicit directory
argument. Each worktree therefore gets its own `.next`, its own lock and its
own port, regardless of which directory the launcher was invoked from.

### The preview tool: attach, do not launch

`preview_start({ name: "studio" })` launches the command from the session's
**original** project root. From a worktree session it therefore serves the
main checkout while looking like it serves the worktree — a worse failure
than an error, because nothing complains.

Start the server yourself and attach the browser to the URL instead:

```bash
npm run dev
```

```
preview_start({ url: "http://localhost:3004" })
```

`preview_start` with a `url` and no `name` opens a browser tab against an
already-running server, which is all a worktree session needs. `npm run dev`
prints the exact call to paste.

Do not "fix" a port conflict by killing the other session's dev server. It
belongs to work in progress that is not yours.

## Verifying without a browser

The RPG engine is deliberately free of DOM dependencies except at the very
edge (`components/RpgGame.tsx`). Everything under `lib/rpg/` can be driven
from Node, which is faster and more deterministic than a browser anyway:

```bash
node --experimental-strip-types yourtest.ts
```

Two constraints make this work, and both are worth preserving:

- **No TypeScript parameter properties.** `constructor(private readonly x: T)`
  is not erasable syntax and Node's type stripping rejects it. Assign in the
  body instead.
- **`Screen` takes any object with `createImageData` and `putImageData`**, so
  a five-line stub stands in for a canvas.

Render frames by reading `screen.fb` (palette indices) through
`PALETTE_RGB`, and write them out as PNG with `zlib` + `struct` from the
Python standard library. There is a working example under the session
scratchpad each time this is done.

## Merging back

The worktree is an ordinary branch. When the other session's work has
settled:

```bash
git checkout main
git merge <feature>
```

Conflicts here are normal and resolvable, which is the entire point — the
alternative was two agents silently overwriting each other with no record.

Remove the worktree when you are done. This also releases its port:

```bash
npm run worktree rm <feature>
```
