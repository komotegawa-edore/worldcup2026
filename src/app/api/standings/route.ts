import { NextResponse } from "next/server";
import { fetchStandings } from "@/lib/api-football";

export async function GET() {
  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json(
      { error: "API_FOOTBALL_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const standings = await fetchStandings();
    return NextResponse.json(standings);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/standings]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
