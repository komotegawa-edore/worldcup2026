import { NextResponse } from "next/server";
import { DATA } from "@/lib/data";
import { fetchMatches } from "@/lib/api-football";

export async function GET() {
  // API_FOOTBALL_KEY が設定されていれば外部APIから取得
  if (process.env.API_FOOTBALL_KEY) {
    try {
      const liveMatches = await fetchMatches();

      if (liveMatches.length > 0) {
        // ライブデータで該当IDの試合を上書きし、残りはモックを維持
        const liveIds = new Set(liveMatches.map((m) => m.id));
        const merged = [
          ...DATA.matches.filter((m) => !liveIds.has(m.id)),
          ...liveMatches,
        ];
        // 元の試合順序を維持するため ko (キックオフ) でソート
        merged.sort((a, b) => a.ko.localeCompare(b.ko));

        return NextResponse.json({
          updated: new Date().toISOString(),
          matches: merged,
        });
      }
    } catch (e) {
      console.error("[api/matches] API-Football fetch failed, falling back to mock data:", e);
    }
  }

  return NextResponse.json(DATA);
}
