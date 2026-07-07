import { NextResponse } from "next/server";
import { fetchTopScorers, fetchTopAssists } from "@/lib/api-football";

export async function GET() {
  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json(
      { error: "API_FOOTBALL_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const [scorers, assisters] = await Promise.all([
      fetchTopScorers(),
      fetchTopAssists(),
    ]);
    return NextResponse.json({ scorers, assisters });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[api/rankings]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
