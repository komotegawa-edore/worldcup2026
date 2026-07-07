import { MatchData } from "./types";

/**
 * 初期試合データ
 * リアルタイム化する場合は API Route 内で外部APIレスポンスに差し替える。
 */
export const DATA: MatchData = {
  updated: "2026-07-07T12:00:00+09:00",
  matches: [
    // ---- ラウンド32(直近の結果のみ) ----
    {
      id: "r32a", round: "R32", ko: "2026-07-03T12:00:00+09:00", status: "final",
      home: { c: "SUI", n: "スイス", f: "🇨🇭" }, away: { c: "DZA", n: "アルジェリア", f: "🇩🇿" }, hs: 2, as: 0,
    },
    {
      id: "r32b", round: "R32", ko: "2026-07-04T03:00:00+09:00", status: "final",
      note: "延長・PK戦の末エジプトが勝ち上がり",
      home: { c: "AUS", n: "オーストラリア", f: "🇦🇺" }, away: { c: "EGY", n: "エジプト", f: "🇪🇬" }, hs: 1, as: 1, pkWinner: "away",
    },
    {
      id: "r32c", round: "R32", ko: "2026-07-04T07:00:00+09:00", status: "final",
      home: { c: "ARG", n: "アルゼンチン", f: "🇦🇷" }, away: { c: "CPV", n: "カーボベルデ", f: "🇨🇻" }, hs: 3, as: 2,
    },
    {
      id: "r32d", round: "R32", ko: "2026-07-04T10:30:00+09:00", status: "final",
      home: { c: "COL", n: "コロンビア", f: "🇨🇴" }, away: { c: "GHA", n: "ガーナ", f: "🇬🇭" }, hs: 1, as: 0,
    },

    // ---- ラウンド16 ----
    {
      id: "r16-1", round: "R16", slot: 1, ko: "2026-07-05T02:00:00+09:00", status: "final",
      home: { c: "CAN", n: "カナダ", f: "🇨🇦" }, away: { c: "MAR", n: "モロッコ", f: "🇲🇦" }, hs: 0, as: 3,
    },
    {
      id: "r16-2", round: "R16", slot: 2, ko: "2026-07-05T06:00:00+09:00", status: "final",
      home: { c: "PAR", n: "パラグアイ", f: "🇵🇾" }, away: { c: "FRA", n: "フランス", f: "🇫🇷" }, hs: 0, as: 1,
    },
    {
      id: "r16-3", round: "R16", slot: 3, ko: "2026-07-07T04:00:00+09:00", status: "final",
      home: { c: "POR", n: "ポルトガル", f: "🇵🇹" }, away: { c: "ESP", n: "スペイン", f: "🇪🇸" }, hs: 0, as: 1,
    },
    {
      id: "r16-4", round: "R16", slot: 4, ko: "2026-07-07T09:00:00+09:00", status: "final",
      home: { c: "USA", n: "アメリカ", f: "🇺🇸" }, away: { c: "BEL", n: "ベルギー", f: "🇧🇪" }, hs: 1, as: 4,
    },
    {
      id: "r16-5", round: "R16", slot: 5, ko: "2026-07-06T05:00:00+09:00", status: "final", upset: true,
      home: { c: "BRA", n: "ブラジル", f: "🇧🇷" }, away: { c: "NOR", n: "ノルウェー", f: "🇳🇴" }, hs: 1, as: 2,
    },
    {
      id: "r16-6", round: "R16", slot: 6, ko: "2026-07-06T10:00:00+09:00", status: "final",
      home: { c: "MEX", n: "メキシコ", f: "🇲🇽" }, away: { c: "ENG", n: "イングランド", f: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, hs: 2, as: 3,
    },
    {
      id: "r16-7", round: "R16", slot: 7, ko: "2026-07-08T01:00:00+09:00", status: "scheduled",
      home: { c: "ARG", n: "アルゼンチン", f: "🇦🇷" }, away: { c: "EGY", n: "エジプト", f: "🇪🇬" },
      prob: { h: 72.8, a: 8.9, d: 18.3 },
    },
    {
      id: "r16-8", round: "R16", slot: 8, ko: "2026-07-08T05:00:00+09:00", status: "scheduled",
      home: { c: "SUI", n: "スイス", f: "🇨🇭" }, away: { c: "COL", n: "コロンビア", f: "🇨🇴" },
      prob: { h: 27.0, a: 42.4, d: 30.6 },
    },

    // ---- 準々決勝 ----
    {
      id: "qf-1", round: "QF", slot: 1, ko: "2026-07-10T05:00:00+09:00", status: "scheduled",
      home: { c: "FRA", n: "フランス", f: "🇫🇷" }, away: { c: "MAR", n: "モロッコ", f: "🇲🇦" },
      prob: { h: 60.4, a: 16.0, d: 23.6 },
    },
    {
      id: "qf-2", round: "QF", slot: 2, ko: "2026-07-11T04:00:00+09:00", status: "scheduled",
      home: { c: "ESP", n: "スペイン", f: "🇪🇸" }, away: { c: "BEL", n: "ベルギー", f: "🇧🇪" },
      prob: { h: 58.9, a: 17.2, d: 23.9 },
    },
    {
      id: "qf-3", round: "QF", slot: 3, ko: "2026-07-12T06:00:00+09:00", status: "scheduled",
      home: { c: "NOR", n: "ノルウェー", f: "🇳🇴" }, away: { c: "ENG", n: "イングランド", f: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
      prob: { h: 23.8, a: 50.5, d: 25.7 },
    },
    {
      id: "qf-4", round: "QF", slot: 4, ko: "2026-07-12T10:00:00+09:00", status: "scheduled",
      home: null, homeFrom: "アルゼンチン / エジプトの勝者",
      away: null, awayFrom: "スイス / コロンビアの勝者",
    },

    // ---- 準決勝 ----
    {
      id: "sf-1", round: "SF", slot: 1, ko: "2026-07-15T04:00:00+09:00", status: "scheduled",
      home: null, homeFrom: "準々決勝1の勝者", away: null, awayFrom: "準々決勝2の勝者",
    },
    {
      id: "sf-2", round: "SF", slot: 2, ko: "2026-07-16T04:00:00+09:00", status: "scheduled",
      home: null, homeFrom: "準々決勝3の勝者", away: null, awayFrom: "準々決勝4の勝者",
    },

    // ---- 3位決定戦・決勝 ----
    {
      id: "third", round: "3P", ko: "2026-07-19T06:00:00+09:00", status: "scheduled",
      home: null, homeFrom: "準決勝1の敗者", away: null, awayFrom: "準決勝2の敗者",
    },
    {
      id: "final", round: "F", slot: 1, ko: "2026-07-20T04:00:00+09:00", status: "scheduled",
      home: null, homeFrom: "準決勝1の勝者", away: null, awayFrom: "準決勝2の勝者",
    },
  ],
};
