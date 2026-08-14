import type { Metadata } from "next";
import Link from "next/link";

import { Player } from "@/components/Player";
import { listGames } from "@/lib/games";

export const metadata: Metadata = {
  title: "Play — Spectrum Studio",
};

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string | string[] }>;
}) {
  const { src } = await searchParams;
  const raw = Array.isArray(src) ? src[0] : src;

  // "hello.c", "games/hello.c" and "./games/hello.c" all name the same file;
  // normalise here so the header and the compile request agree.
  const name = raw?.replace(/^[./]+/, "").replace(/^games\//, "");
  if (name) return <Player src={name} />;

  const games = await listGames();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-zinc-100">
      <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <span className="text-amber-400">▶</span> Games
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Every <code className="font-mono text-zinc-400">.c</code> file in{" "}
        <code className="font-mono text-zinc-400">games/</code>. Picking one
        compiles it with z88dk and boots it on a 48K Spectrum.
      </p>

      {games.length === 0 ? (
        <p className="mt-8 rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-500">
          Nothing in <code className="font-mono">games/</code> yet. Drop a{" "}
          <code className="font-mono">.c</code> file in there and reload.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-zinc-900 border-y border-zinc-900">
          {games.map((game) => (
            <li key={game.name}>
              <Link
                href={`/play?src=${encodeURIComponent(game.name)}`}
                className="flex items-baseline justify-between px-1 py-3 text-sm hover:bg-zinc-950"
              >
                <span className="font-mono text-zinc-200">{game.name}</span>
                <span className="text-xs text-zinc-600">{game.bytes} B</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/"
        className="mt-8 inline-block text-xs text-zinc-500 hover:text-zinc-200"
      >
        ← Studio
      </Link>
    </div>
  );
}
