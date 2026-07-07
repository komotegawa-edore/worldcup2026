import { Match } from "./types";
import { MATCH_MS } from "./constants";

const WEEKDAYS = "日月火水木金土";

/** 日時を "M/D(曜) H:MM" にフォーマット */
export function fmtDT(ko: string): string {
  const d = new Date(ko);
  const w = WEEKDAYS[d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${w}) ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 試合が現在LIVE中かどうか */
export function isLive(m: Match): boolean {
  const t = Date.now();
  const k = new Date(m.ko).getTime();
  return m.status !== "final" && t >= k && t <= k + MATCH_MS;
}

/** 勝者サイドを返す。未確定ならnull */
export function winnerSide(m: Match): "home" | "away" | null {
  if (m.status !== "final") return null;
  if ((m.hs ?? 0) > (m.as ?? 0)) return "home";
  if ((m.as ?? 0) > (m.hs ?? 0)) return "away";
  return m.pkWinner || null;
}

/** 日付ごとにグループ化 */
export function groupByDay(list: Match[]): Record<string, Match[]> {
  const g: Record<string, Match[]> = {};
  list.forEach((m) => {
    const d = new Date(m.ko);
    const key = `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
    (g[key] = g[key] || []).push(m);
  });
  return g;
}
