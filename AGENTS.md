<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Check whether another agent is already working here

Two sessions editing this checkout will overwrite each other's edits
silently — it has already happened once. Before a long editing run:

```bash
ps -eo pid,command | grep -c "[c]laude --output-format stream-json"
```

More than one, or an `Edit` that fails with "file has been modified since
read", means a second live writer. Stop and move to a worktree rather than
racing it:

```bash
npm run worktree new <feature>
```

That branches from local `HEAD`, clones `node_modules`, and assigns the
worktree its own dev port. `npm run dev` then serves that worktree alone —
the main checkout keeps 3000, worktrees get 3001 upward and keep the same
port thereafter.

From a worktree, attach the browser rather than launching it:
`preview_start({ name: "studio" })` runs from the session's original root and
would silently serve the main checkout instead. Run `npm run dev` and pass
its URL to `preview_start({ url: ... })`.

Full detail: [docs/parallel-development.md](docs/parallel-development.md).
