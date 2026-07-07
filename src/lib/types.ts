export interface Team {
  c: string;   // 国コード (e.g. "JPN")
  n: string;   // 国名 (e.g. "日本")
  f: string;   // 国旗絵文字
}

export type RoundType = "R32" | "R16" | "QF" | "SF" | "3P" | "F";
export type MatchStatus = "scheduled" | "live" | "final";

export interface Prob {
  h: number; // ホーム勝率 (%)
  d: number; // 引き分け率 (%)
  a: number; // アウェイ勝率 (%)
}

export interface Match {
  id: string;
  round: RoundType;
  slot?: number;
  ko: string;              // キックオフ ISO文字列
  status: MatchStatus;
  home: Team | null;
  away: Team | null;
  homeFrom?: string;       // 未定チームの説明
  awayFrom?: string;
  hs?: number;             // ホームスコア
  as?: number;             // アウェイスコア
  pkWinner?: "home" | "away";
  note?: string;
  upset?: boolean;
  prob?: Prob;
}

export interface MatchData {
  updated: string;
  matches: Match[];
}
