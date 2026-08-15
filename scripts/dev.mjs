import { execFileSync, spawn } from "node:child_process";
import { closeSync, existsSync, openSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";

// Resolved from this file's own location rather than process.cwd(). npm can
// launch a script from a parent directory, and serving the wrong worktree while
// claiming to serve this one is exactly the confusion this file exists to stop.
const root = path.resolve(import.meta.dirname, "..");

const firstPort = 3000;
const lastPort = 3099;

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

// Every worktree resolves --git-common-dir to the same shared .git, so a
// registry kept there is the one place all of them already agree on. It is
// outside the working tree, so it is never committed and never conflicts.
function registryPath() {
  return path.join(path.resolve(root, git("rev-parse", "--git-common-dir")), "dev-ports.json");
}

function readRegistry() {
  try {
    const parsed = JSON.parse(readFileSync(registryPath(), "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRegistry(registry) {
  const file = registryPath();
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(registry, null, 2)}\n`);
  // Rename is atomic, so a reader never sees a half-written registry.
  renameSync(temporary, file);
}

// Two worktrees started at the same moment would otherwise read the same
// registry and both claim the same free port.
async function withRegistryLock(work) {
  const lock = `${registryPath()}.lock`;
  for (let attempt = 0; attempt < 100; attempt++) {
    let handle;
    try {
      handle = openSync(lock, "wx");
    } catch {
      // A crashed run leaves the lock behind; treat an old one as abandoned.
      try {
        if (Date.now() - statSync(lock).mtimeMs > 30_000) rmSync(lock, { force: true });
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }
    try {
      return await work();
    } finally {
      closeSync(handle);
      rmSync(lock, { force: true });
    }
  }
  throw new Error(`could not take ${lock} — delete it if no dev server is starting`);
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(port, "0.0.0.0");
  });
}

function liveWorktrees() {
  const paths = new Set();
  for (const line of git("worktree", "list", "--porcelain").split("\n")) {
    if (line.startsWith("worktree ")) paths.add(line.slice("worktree ".length));
  }
  return paths;
}

// git lists the main worktree first. It keeps firstPort permanently: it is the
// port everyone reaches for by habit, and the one .claude/launch.json declares.
function isMainWorktree() {
  return git("worktree", "list", "--porcelain").split("\n")[0].slice("worktree ".length) === root;
}

function branchOf(worktree) {
  try {
    return execFileSync("git", ["-C", worktree, "rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "?";
  }
}

async function claimPort({ forceNew = false } = {}) {
  if (isMainWorktree()) return firstPort;

  return withRegistryLock(async () => {
    const registry = readRegistry();
    const alive = liveWorktrees();

    // Reclaim ports from worktrees that have been removed since.
    for (const worktree of Object.keys(registry)) {
      if (!alive.has(worktree)) delete registry[worktree];
    }

    if (!forceNew && registry[root]) {
      const existing = registry[root].port;
      registry[root] = { port: existing, branch: branchOf(root) };
      writeRegistry(registry);
      return existing;
    }

    const taken = new Set(Object.entries(registry).flatMap(([worktree, entry]) => (worktree === root ? [] : [entry.port])));
    for (let port = firstPort + 1; port <= lastPort; port++) {
      if (taken.has(port)) continue;
      if (!(await isPortFree(port))) continue;
      registry[root] = { port, branch: branchOf(root) };
      writeRegistry(registry);
      return port;
    }
    throw new Error(`no free port between ${firstPort} and ${lastPort}`);
  });
}

async function list() {
  const registry = readRegistry();
  const alive = [...liveWorktrees()];
  const rows = [];
  for (const [index, worktree] of alive.entries()) {
    const port = index === 0 ? firstPort : registry[worktree]?.port;
    rows.push({
      port: port ? String(port) : "~",
      running: port && !(await isPortFree(port)) ? "running" : "",
      branch: branchOf(worktree),
      worktree: worktree === root ? `${worktree}  (this one)` : worktree,
    });
  }
  rows.sort((a, b) => a.port.localeCompare(b.port));
  const width = (key) => Math.max(0, ...rows.map((row) => row[key].length));
  for (const row of rows) {
    console.log(
      `${row.port.padStart(5)}  ${row.running.padEnd(width("running"))}  ${row.branch.padEnd(width("branch"))}  ${row.worktree}`,
    );
  }
}

const argv = process.argv.slice(2);

if (argv.includes("--list")) {
  await list();
} else if (argv.includes("--print-port")) {
  console.log(await claimPort());
} else if (argv.includes("--release")) {
  await withRegistryLock(() => {
    const registry = readRegistry();
    delete registry[root];
    writeRegistry(registry);
  });
  console.log(`released the port claimed by ${root}`);
} else {
  const port = await claimPort({ forceNew: argv.includes("--new-port") });
  const url = `http://localhost:${port}`;

  if (!(await isPortFree(port))) {
    const mine = existsSync(path.join(root, ".next/dev/lock"));
    console.error(
      mine
        ? `A dev server for this worktree is already up at ${url}.`
        : `Port ${port} is claimed by this worktree but held by something else.\nStop it, or take a different port with: npm run dev -- --new-port`,
    );
    process.exit(mine ? 0 : 1);
  }

  console.log(`${branchOf(root)} → ${url}`);
  console.log(`  ${root}`);
  console.log(`  preview_start({ url: "${url}" })`);

  // This worktree's own binary, not npx's idea of one: npx resolves from the
  // working directory, and would quietly download next if the worktree turned
  // out to have no node_modules.
  const binary = path.join(root, "node_modules/.bin/next");
  if (!existsSync(binary)) {
    console.error(`No node_modules in ${root}. Run: npm install`);
    process.exit(1);
  }

  const passthrough = argv.filter((arg) => arg !== "--new-port");
  // The positional directory keeps Next on this worktree even when the launcher
  // was invoked from somewhere else.
  const next = spawn(binary, ["dev", root, "--port", String(port), ...passthrough], {
    cwd: root,
    stdio: "inherit",
  });
  next.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
}
