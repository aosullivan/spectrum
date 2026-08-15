import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: "inherit", ...options });
}

const mainWorktree = git("worktree", "list", "--porcelain").split("\n")[0].slice("worktree ".length);

function pathFor(name) {
  return path.join(path.dirname(mainWorktree), `spectrum-${name}`);
}

function create(name) {
  const worktree = pathFor(name);
  if (existsSync(worktree)) throw new Error(`${worktree} already exists`);

  // A worktree only carries committed content, so uncommitted work would be
  // invisible in the new one — and easy to mistake for having been lost.
  const dirty = git("status", "--porcelain");
  if (dirty) {
    console.error("Uncommitted changes here; they will not appear in the new worktree:\n");
    console.error(dirty);
    console.error("\nCommit or stash first, then run this again.");
    process.exit(1);
  }

  // Branch from local HEAD. Branching from origin/main would silently rewind the
  // new worktree to whatever was last pushed.
  run("git", ["worktree", "add", worktree, "-b", name], { cwd: root });

  // node_modules is untracked, so it does not come along. An APFS clone shares
  // the blocks with this checkout: seconds instead of a full npm install, and
  // near-zero extra disk until something writes.
  process.stdout.write("copying node_modules… ");
  try {
    run("cp", ["-Rc", path.join(root, "node_modules"), path.join(worktree, "node_modules")]);
    console.log("done");
  } catch {
    console.log("clone unavailable, falling back to npm install");
    run("npm", ["install"], { cwd: worktree });
  }

  const port = execFileSync("node", [path.join(worktree, "scripts/dev.mjs"), "--print-port"], {
    encoding: "utf8",
  }).trim();

  console.log(`\n${worktree}`);
  console.log(`  branch ${name}, port ${port}`);
  console.log(`  cd ${worktree} && npm run dev`);
}

function remove(name) {
  const worktree = pathFor(name);
  try {
    execFileSync("node", [path.join(worktree, "scripts/dev.mjs"), "--release"], { stdio: "ignore" });
  } catch {}
  run("git", ["worktree", "remove", worktree], { cwd: root });
  console.log(`removed ${worktree} (branch ${name} kept)`);
}

const [command, name] = process.argv.slice(2);

if (command === "new" && name) create(name);
else if (command === "rm" && name) remove(name);
else if (command === "ls") run("node", [path.join(root, "scripts/dev.mjs"), "--list"]);
else {
  console.error("usage: npm run worktree new <name> | rm <name> | ls");
  process.exit(1);
}
