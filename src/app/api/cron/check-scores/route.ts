import { NextRequest, NextResponse } from "next/server";
import { fetchMatches } from "@/lib/api-football";
import { broadcastGoalNotification } from "@/lib/line-notify";
import { DATA } from "@/lib/data";
import { Match } from "@/lib/types";
import { MATCH_MS } from "@/lib/constants";

/** 前回取得時のスコアを保持するキャッシュ (fixtureId → { hs, as }) */
const prevScores = new Map<string, { hs: number; as: number }>();

/** 現在ライブ中 or まもなく開始の試合があるか (前後30分のマージン付き) */
function hasLiveWindow(): boolean {
  const now = Date.now();
  const MARGIN = 30 * 60 * 1000; // 30分
  return DATA.matches.some((m) => {
    if (m.status === "final") return false;
    const ko = new Date(m.ko).getTime();
    return now >= ko - MARGIN && now <= ko + MATCH_MS + MARGIN;
  });
}

export async function GET(req: NextRequest) {
  // CRON_SECRET による認証 (Vercel Cron は Authorization ヘッダーを送る)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // API_FOOTBALL_KEY が未設定なら何もしない
  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json({ message: "API_FOOTBALL_KEY not configured, skipped" });
  }

  // ライブ試合がなければ API を叩かずスキップ
  if (!hasLiveWindow()) {
    return NextResponse.json({ message: "No live matches, skipped" });
  }

  try {
    const matches = await fetchMatches();

    // live / final の試合のみスコア比較
    const activeMatches = matches.filter(
      (m) => m.status === "live" || m.status === "final",
    );

    const changes: Match[] = [];

    for (const match of activeMatches) {
      const hs = match.hs ?? 0;
      const as = match.as ?? 0;
      const prev = prevScores.get(match.id);

      if (prev && (prev.hs !== hs || prev.as !== as)) {
        changes.push(match);
      }

      // キャッシュ更新
      prevScores.set(match.id, { hs, as });
    }

    // 変化があった試合ごとに LINE 通知
    const notifications: string[] = [];
    for (const match of changes) {
      try {
        await broadcastGoalNotification(match);
        notifications.push(
          `${match.home?.n ?? "?"} ${match.hs} - ${match.as} ${match.away?.n ?? "?"}`,
        );
      } catch (e) {
        console.error(`[cron] LINE notification failed for ${match.id}:`, e);
      }
    }

    return NextResponse.json({
      checked: activeMatches.length,
      changes: changes.length,
      notifications,
    });
  } catch (e) {
    console.error("[cron] check-scores failed:", e);
    return NextResponse.json(
      { error: "Failed to check scores" },
      { status: 500 },
    );
  }
}
