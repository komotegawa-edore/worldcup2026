import { Match, MatchStatus, RoundType, Team } from "./types";

// ---------- API-Football レスポンス型 ----------

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
  };
  league: { id: number; round: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
  score: {
    penalty: { home: number | null; away: number | null };
  };
}

interface ApiResponse {
  errors: Record<string, string>;
  results: number;
  response: ApiFixture[];
}

// ---------- ステータス変換 ----------

const STATUS_MAP: Record<string, MatchStatus> = {
  NS: "scheduled",
  TBD: "scheduled",
  "1H": "live",
  HT: "live",
  "2H": "live",
  ET: "live",
  BT: "live",
  P: "live",
  FT: "final",
  AET: "final",
  PEN: "final",
};

// ---------- ラウンド変換 ----------

function parseRound(round: string): { round: RoundType | null; slot?: number } {
  const r = round.toLowerCase();
  if (r.includes("round of 32")) return { round: "R32" };
  if (r.includes("round of 16")) return { round: "R16" };
  if (r.includes("quarter")) return { round: "QF" };
  if (r.includes("semi")) return { round: "SF" };
  if (r.includes("3rd place") || r.includes("third")) return { round: "3P" };
  if (r.includes("final") && !r.includes("semi") && !r.includes("quarter")) {
    return { round: "F" };
  }
  // グループステージ等はノックアウトステージ外なので除外
  return { round: null };
}

// ---------- 国名・国旗マッピング ----------

interface CountryInfo {
  code: string;
  name: string;
  flag: string;
}

/** API-Football の team.id → 国情報 (主要国のみ。未登録はAPI名をそのまま使用) */
const TEAM_MAP: Record<number, CountryInfo> = {
  // アジア
  2: { code: "JPN", name: "日本", flag: "🇯🇵" },
  22: { code: "KOR", name: "韓国", flag: "🇰🇷" },
  23: { code: "AUS", name: "オーストラリア", flag: "🇦🇺" },
  31: { code: "IRN", name: "イラン", flag: "🇮🇷" },
  28: { code: "SAU", name: "サウジアラビア", flag: "🇸🇦" },
  29: { code: "QAT", name: "カタール", flag: "🇶🇦" },
  2384: { code: "UZB", name: "ウズベキスタン", flag: "🇺🇿" },
  5530: { code: "IRQ", name: "イラク", flag: "🇮🇶" },
  // ヨーロッパ
  10: { code: "ENG", name: "イングランド", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  1: { code: "FRA", name: "フランス", flag: "🇫🇷" },
  9: { code: "ESP", name: "スペイン", flag: "🇪🇸" },
  25: { code: "GER", name: "ドイツ", flag: "🇩🇪" },
  27: { code: "POR", name: "ポルトガル", flag: "🇵🇹" },
  6: { code: "BEL", name: "ベルギー", flag: "🇧🇪" },
  15: { code: "SUI", name: "スイス", flag: "🇨🇭" },
  3: { code: "ITA", name: "イタリア", flag: "🇮🇹" },
  4: { code: "NED", name: "オランダ", flag: "🇳🇱" },
  21: { code: "DEN", name: "デンマーク", flag: "🇩🇰" },
  13: { code: "CRO", name: "クロアチア", flag: "🇭🇷" },
  14: { code: "SRB", name: "セルビア", flag: "🇷🇸" },
  1099: { code: "NOR", name: "ノルウェー", flag: "🇳🇴" },
  1100: { code: "SCO", name: "スコットランド", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  // 南米
  26: { code: "ARG", name: "アルゼンチン", flag: "🇦🇷" },
  33: { code: "BRA", name: "ブラジル", flag: "🇧🇷" },
  7: { code: "COL", name: "コロンビア", flag: "🇨🇴" },
  8: { code: "PAR", name: "パラグアイ", flag: "🇵🇾" },
  // 北中米
  20: { code: "USA", name: "アメリカ", flag: "🇺🇸" },
  16: { code: "MEX", name: "メキシコ", flag: "🇲🇽" },
  5529: { code: "CAN", name: "カナダ", flag: "🇨🇦" },
  // アフリカ
  12: { code: "MAR", name: "モロッコ", flag: "🇲🇦" },
  5: { code: "EGY", name: "エジプト", flag: "🇪🇬" },
  11: { code: "DZA", name: "アルジェリア", flag: "🇩🇿" },
  17: { code: "GHA", name: "ガーナ", flag: "🇬🇭" },
  24: { code: "SEN", name: "セネガル", flag: "🇸🇳" },
  18: { code: "NGA", name: "ナイジェリア", flag: "🇳🇬" },
  19: { code: "CMR", name: "カメルーン", flag: "🇨🇲" },
  30: { code: "CPV", name: "カーボベルデ", flag: "🇨🇻" },
};

function toTeam(apiTeam: { id: number; name: string }): Team {
  const info = TEAM_MAP[apiTeam.id];
  if (info) {
    return { c: info.code, n: info.name, f: info.flag };
  }
  // 未登録チームはAPI名をそのまま使用
  return { c: apiTeam.name.slice(0, 3).toUpperCase(), n: apiTeam.name, f: "🏳️" };
}

// ---------- 1試合変換 ----------

export function convertFixture(fx: ApiFixture): Match | null {
  const { round, slot } = parseRound(fx.league.round);

  // グループステージ等はノックアウトステージ外なので除外
  if (round === null) return null;

  const status = STATUS_MAP[fx.fixture.status.short] ?? "scheduled";

  const match: Match = {
    id: String(fx.fixture.id),
    round,
    ko: fx.fixture.date,
    status,
    home: toTeam(fx.teams.home),
    away: toTeam(fx.teams.away),
  };

  if (slot !== undefined) match.slot = slot;

  // スコア (試合中・終了時のみ)
  if (status !== "scheduled") {
    match.hs = fx.goals.home ?? 0;
    match.as = fx.goals.away ?? 0;
  }

  // PK戦
  if (
    (fx.fixture.status.short === "PEN" || fx.fixture.status.short === "AET") &&
    fx.score.penalty.home != null &&
    fx.score.penalty.away != null
  ) {
    match.pkWinner =
      fx.score.penalty.home > fx.score.penalty.away ? "home" : "away";
  }

  return match;
}

// ---------- 全試合取得 ----------

export async function fetchMatches(): Promise<Match[]> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error("API_FOOTBALL_KEY is not set");
  }

  const res = await fetch(
    "https://v3.football.api-sports.io/fixtures?league=1&season=2026",
    {
      headers: { "x-apisports-key": key },
      next: { revalidate: 30 },
    },
  );

  if (!res.ok) {
    throw new Error(`API-Football responded with ${res.status}`);
  }

  const data: ApiResponse = await res.json();

  // API-Football は HTTP 200 でもエラーを返すことがある
  if (data.errors && Object.keys(data.errors).length > 0) {
    const msg = Object.values(data.errors).join(", ");
    throw new Error(`API-Football error: ${msg}`);
  }

  const matches = data.response
    .map(convertFixture)
    .filter((m): m is Match => m !== null);

  console.log(`[api-football] ${data.results} total, ${matches.length} knockout matches`);
  return matches;
}
