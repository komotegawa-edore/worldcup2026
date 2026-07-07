import { NextResponse } from "next/server";
import { DATA } from "@/lib/data";
import { fetchMatches } from "@/lib/api-football";

export async function GET() {
  // API_FOOTBALL_KEY が設定されていれば外部APIから全試合取得
  if (process.env.API_FOOTBALL_KEY) {
    try {
      const matches = await fetchMatches();
      return NextResponse.json({
        updated: new Date().toISOString(),
        matches,
      });
    } catch (e) {
      console.error("[api/matches] API-Football fetch failed, falling back to mock data:", e);
    }
  }

  return NextResponse.json(DATA);
}
