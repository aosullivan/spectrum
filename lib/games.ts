import { readdir, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";

// Games live as plain .c files in the repo so they can be edited by hand, by
// an agent, or by the studio — anything that can write a file.
export const GAMES_DIR = join(process.cwd(), "games");

export type GameFile = { name: string; bytes: number };

export type GameLookup =
  | { ok: true; path: string; name: string }
  | { ok: false; error: string; status: 400 | 404 };

function isInside(dir: string, target: string): boolean {
  const rel = relative(dir, target);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

/**
 * Map a caller-supplied `src` onto a real file inside games/.
 *
 * The string arrives straight off a query param, so this is all containment:
 * `../../etc/passwd` has to bounce, and so does a symlink inside games/ that
 * points back out of it.
 */
export async function resolveGame(src: string): Promise<GameLookup> {
  if (!src || src.includes("\0")) {
    return { ok: false, error: "Missing game source path", status: 400 };
  }
  if (!src.endsWith(".c")) {
    return { ok: false, error: "Game sources must be .c files", status: 400 };
  }

  // Accept "hello.c", "games/hello.c" and "./games/hello.c" alike.
  const name = src.replace(/^[./]+/, "").replace(/^games\//, "");
  const candidate = resolve(GAMES_DIR, name);
  if (!isInside(GAMES_DIR, candidate)) {
    return { ok: false, error: `Outside games/: ${src}`, status: 400 };
  }

  let path: string;
  try {
    path = await realpath(candidate);
  } catch {
    return { ok: false, error: `No such game: games/${name}`, status: 404 };
  }

  const root = await realpath(GAMES_DIR);
  if (!isInside(root, path)) {
    return { ok: false, error: `Outside games/: ${src}`, status: 400 };
  }

  return { ok: true, path, name };
}

export async function listGames(): Promise<GameFile[]> {
  let entries;
  try {
    entries = await readdir(GAMES_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const games = await Promise.all(
    entries
      .filter((e) => e.isFile() && e.name.endsWith(".c"))
      .map(async (e) => ({
        name: e.name,
        bytes: (await stat(join(GAMES_DIR, e.name))).size,
      })),
  );

  return games.sort((a, b) => a.name.localeCompare(b.name));
}
