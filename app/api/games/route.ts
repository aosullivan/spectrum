import { NextResponse } from "next/server";

import { listGames } from "@/lib/games";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ games: await listGames() });
}
