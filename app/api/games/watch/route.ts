import { watch } from "node:fs/promises";
import { basename } from "node:path";
import type { NextRequest } from "next/server";

import { GAMES_DIR, resolveGame } from "@/lib/games";

export const runtime = "nodejs";
// Long-lived SSE connection: it lives as long as the tab watching the file.
export const maxDuration = 3600;

export async function GET(req: NextRequest) {
  const found = await resolveGame(req.nextUrl.searchParams.get("src") ?? "");
  if (!found.ok) {
    return new Response(found.error, { status: found.status });
  }

  const target = basename(found.path);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Flush a comment immediately so the client sees an open connection
      // rather than a pending request.
      controller.enqueue(encoder.encode(": watching\n\n"));

      try {
        // Watch the directory rather than the file. Editors that save by
        // writing a temp file and renaming it over the original leave a
        // per-file watch pointing at an unlinked inode.
        for await (const event of watch(GAMES_DIR, { signal: req.signal })) {
          if (event.filename && basename(event.filename) === target) {
            controller.enqueue(encoder.encode("data: changed\n\n"));
          }
        }
      } catch {
        // AbortError on disconnect, or the directory went away.
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}
