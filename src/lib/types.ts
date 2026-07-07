export interface Team {
  c: string;   // 国コード (e.g. "JPN")
  n: string;   // 国名 (e.g. "日本")
  f: string;   // 国旗コード (flagcdn.com 用 ISO alpha-2, e.g. "jp")
}

export type RoundType = "GS" | "R32" | "R16" | "QF" | "SF" | "3P" | "F";
export type MatchStatus = "scheduled" | "live" | "final";

export interface Prob {
  h: number; // ホーム勝率 (%)
  d: number; // 引き分け率 (%)
  a: number; // アウェイ勝率 (%)
}

export interface MatchEvent {
  minute: number;
  type: "goal" | "card" | "red" | "subst";
  player: string;
  assist?: string;
  detail?: string;
  side: "home" | "away";
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
  group?: string;
  prob?: Prob;
  elapsed?: number;        // 現在の試合経過分 (live時のみ)
  events?: MatchEvent[];
}

export interface MatchData {
  updated: string;
  matches: Match[];
}

export interface PlayerRank {
  rank: number;
  name: string;
  team: string;
  flag: string;
  count: number;
}

export interface GroupStanding {
  rank: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface SquadPlayer {
  name: string;
  age: number | null;
  number: number | null;
  position: string;
  photo: string;
}

export interface MatchPreview {
  home: SquadPlayer[];
  away: SquadPlayer[];
}

export interface StatItem {
  label: string;
  home: string;
  away: string;
}
