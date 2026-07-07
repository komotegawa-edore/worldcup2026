import { NextRequest, NextResponse } from "next/server";
import { fetchMatchPreview } from "@/lib/api-football";

export async function GET(req: NextRequest) {
  const home = req.nextUrl.searchParams.get("home");
  const away = req.nextUrl.searchParams.get("away");

  if (!home || !away) {
    return NextResponse.json(
      { error: "home and away query params required" },
      { status: 400 },
    );
  }

  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json(
      { error: "API_FOOTBALL_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const preview = await fetchMatchPreview(home, away);
    return NextResponse.json(preview);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/matches/preview]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
