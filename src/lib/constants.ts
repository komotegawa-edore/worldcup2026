import { RoundType } from "./types";

export const ROUND_JA: Record<RoundType, string> = {
  GS: "グループステージ",
  R32: "ラウンド32",
  R16: "ラウンド16",
  QF: "準々決勝",
  SF: "準決勝",
  "3P": "3位決定戦",
  F: "決勝",
};

/** 試合中とみなす時間幅 (2.5時間) */
export const MATCH_MS = 2.5 * 60 * 60 * 1000;
