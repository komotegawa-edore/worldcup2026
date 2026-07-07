import { Match } from "./types";
import { ROUND_JA } from "./constants";

/** 試合データを Claude に渡すためのテキストに変換 */
export function buildMatchContext(matches: Match[]): string {
  const now = Date.now();
  const lines: string[] = [];

  // LIVE試合
  const live = matches.filter((m) => m.status === "live" || m.status === "final");
  const upcoming = matches
    .filter((m) => m.status === "scheduled" && m.home && m.away)
    .sort((a, b) => new Date(a.ko).getTime() - new Date(b.ko).getTime());

  // 最近の結果（直近10試合）
  const recent = matches
    .filter((m) => m.status === "final")
    .sort((a, b) => new Date(b.ko).getTime() - new Date(a.ko).getTime())
    .slice(0, 10);

  if (recent.length > 0) {
    lines.push("【最近の試合結果】");
    for (const m of recent) {
      const h = m.home?.n ?? "未定";
      const a = m.away?.n ?? "未定";
      const pk = m.pkWinner ? " (PK)" : "";
      lines.push(`${ROUND_JA[m.round]}: ${h} ${m.hs}-${m.as} ${a}${pk}`);
    }
  }

  // LIVE
  const liveNow = matches.filter(
    (m) => m.status !== "final" && m.status !== "scheduled" &&
      new Date(m.ko).getTime() <= now
  );
  if (liveNow.length > 0) {
    lines.push("\n【現在LIVE中】");
    for (const m of liveNow) {
      lines.push(`${m.home?.n ?? "?"} ${m.hs}-${m.as} ${m.away?.n ?? "?"}`);
    }
  }

  // 次の試合（5件）
  if (upcoming.length > 0) {
    lines.push("\n【今後の試合予定】");
    for (const m of upcoming.slice(0, 5)) {
      const d = new Date(m.ko);
      const dt = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
      lines.push(`${dt} ${ROUND_JA[m.round]}: ${m.home?.n ?? "未定"} vs ${m.away?.n ?? "未定"}`);
    }
  }

  return lines.join("\n");
}
