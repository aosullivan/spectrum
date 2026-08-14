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

**Commit first.** A worktree only carries committed content. If the work you
care about is untracked, the new worktree will be empty of it.

```bash
git add -A && git commit -m "Checkpoint before branching"
```

Create the worktree from your **local** HEAD, not from `origin`:

```bash
git worktree add /Users/you/spectrum-<feature> -b <feature>
```

`EnterWorktree` defaults to branching from `origin/<default-branch>`, which
on this repo is well behind local `main`. Creating it yourself with
`git worktree add` and then entering it by path keeps your actual work:

```
EnterWorktree({ path: "/Users/you/spectrum-<feature>" })
```

Install dependencies in the worktree. `node_modules` is not tracked, so it
does not come along:

```bash
cd /Users/you/spectrum-<feature> && npm install
```

## Running both dev servers

Next stores its dev lock at `<distDir>/lock` — that is, `.next/dev/lock`
inside whichever directory it resolves as the project. Two servers that
resolve to the same project directory will refuse to run together:

```
⨯ Another next dev server is already running.
```

The lock is held by whichever server got there first; `lsof -p <pid> | grep lock`
names the exact file.

The fix is simply that the second server must be **started with its working
directory set to the worktree**. Then it gets its own `.next`, its own lock,
and its own port:

```bash
cd /Users/you/spectrum-<feature> && npm run dev -- --port 3100
```

Both servers then coexist: `localhost:3000` for the main checkout,
`localhost:3100` for the worktree.

### Known limitation: the preview tool cannot do this

`preview_start` launches the command from the session's **original** project
root, not from the worktree, whatever `.claude/launch.json` in the worktree
says. It therefore resolves to the main checkout's `.next`, grabs that lock,
and fails. An agent working in a worktree cannot drive its own preview
server; ask the human to run the command above in a terminal, and verify
headlessly in the meantime (see below).

Do not "fix" this by killing the other session's dev server. It belongs to
work in progress that is not yours.

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

Remove the worktree when you are done:

```bash
git worktree remove /Users/you/spectrum-<feature>
```
