import { NextRequest, NextResponse } from "next/server";
import { fetchMatches } from "@/lib/api-football";
import {
  broadcastGoalNotification,
  broadcastMatchStart,
  broadcastMatchEnd,
} from "@/lib/line-notify";
import { DATA } from "@/lib/data";
import { Match, MatchStatus } from "@/lib/types";
import { MATCH_MS } from "@/lib/constants";

/** 前回取得時のスコアとステータスを保持するキャッシュ */
const prevState = new Map<
  string,
  { hs: number; as: number; status: MatchStatus }
>();

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

    const scoreChanges: Match[] = [];
    const started: Match[] = [];
    const ended: Match[] = [];

    for (const match of activeMatches) {
      const hs = match.hs ?? 0;
      const as = match.as ?? 0;
      const prev = prevState.get(match.id);

      if (prev) {
        // スコア変化の検知
        if (prev.hs !== hs || prev.as !== as) {
          scoreChanges.push(match);
        }
        // ステータス変化の検知
        if (prev.status === "scheduled" && match.status === "live") {
          started.push(match);
        }
        if (prev.status === "live" && match.status === "final") {
          ended.push(match);
        }
      } else {
        // 初回登場 (コールドスタート時含む):
        // KO から5分以内の live 試合のみ開始通知する。
        // これにより、コールドスタートで古い live 試合に再通知するのを防ぐ。
        if (match.status === "live") {
          const koTime = new Date(match.ko).getTime();
          const elapsed = Date.now() - koTime;
          if (elapsed < 5 * 60 * 1000) {
            started.push(match);
          }
        }
      }

      // キャッシュ更新
      prevState.set(match.id, { hs, as, status: match.status });
    }

    // scheduled の試合もキャッシュに入れておく（開始検知のため）
    const scheduledMatches = matches.filter((m) => m.status === "scheduled");
    for (const match of scheduledMatches) {
      if (!prevState.has(match.id)) {
        prevState.set(match.id, {
          hs: 0,
          as: 0,
          status: match.status,
        });
      }
    }

    // 通知送信
    const notifications: string[] = [];

    // 試合開始通知
    for (const match of started) {
      try {
        await broadcastMatchStart(match);
        notifications.push(
          `🏟️ ${match.home?.n ?? "?"} vs ${match.away?.n ?? "?"}`,
        );
      } catch (e) {
        console.error(`[cron] LINE start notification failed for ${match.id}:`, e);
      }
    }

    // ゴール通知
    for (const match of scoreChanges) {
      try {
        await broadcastGoalNotification(match);
        notifications.push(
          `⚽ ${match.home?.n ?? "?"} ${match.hs} - ${match.as} ${match.away?.n ?? "?"}`,
        );
      } catch (e) {
        console.error(`[cron] LINE notification failed for ${match.id}:`, e);
      }
    }

    // 試合終了通知
    for (const match of ended) {
      try {
        await broadcastMatchEnd(match);
        notifications.push(
          `🏁 ${match.home?.n ?? "?"} ${match.hs} - ${match.as} ${match.away?.n ?? "?"}`,
        );
      } catch (e) {
        console.error(`[cron] LINE end notification failed for ${match.id}:`, e);
      }
    }

    return NextResponse.json({
      checked: activeMatches.length,
      scoreChanges: scoreChanges.length,
      started: started.length,
      ended: ended.length,
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
