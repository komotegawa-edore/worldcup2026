import { Match, MatchEvent, MatchStatus, RoundType, Team } from "./types";

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

interface ApiEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
}

interface ApiFixtureDetail extends ApiFixture {
  events: ApiEvent[];
}

interface ApiResponse {
  errors: Record<string, string>;
  results: number;
  response: ApiFixture[];
}

interface ApiDetailResponse {
  errors: Record<string, string>;
  results: number;
  response: ApiFixtureDetail[];
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

function parseRound(round: string): { round: RoundType; slot?: number } {
  const r = round.toLowerCase();
  if (r.includes("group")) return { round: "GS" };
  if (r.includes("round of 32")) return { round: "R32" };
  if (r.includes("round of 16")) return { round: "R16" };
  if (r.includes("quarter")) return { round: "QF" };
  if (r.includes("semi")) return { round: "SF" };
  if (r.includes("3rd place") || r.includes("third")) return { round: "3P" };
  if (r.includes("final") && !r.includes("semi") && !r.includes("quarter")) {
    return { round: "F" };
  }
  return { round: "GS" };
}

// ---------- 国名・国旗マッピング ----------

interface CountryInfo {
  code: string;
  name: string;
  flag: string;
}

/** API-Football の team.id → 国情報 (実際のAPIレスポンスから取得したID) */
const TEAM_MAP: Record<number, CountryInfo> = {
  // ヨーロッパ
  1: { code: "BEL", name: "ベルギー", flag: "🇧🇪" },
  2: { code: "FRA", name: "フランス", flag: "🇫🇷" },
  3: { code: "CRO", name: "クロアチア", flag: "🇭🇷" },
  5: { code: "SWE", name: "スウェーデン", flag: "🇸🇪" },
  9: { code: "ESP", name: "スペイン", flag: "🇪🇸" },
  10: { code: "ENG", name: "イングランド", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  15: { code: "SUI", name: "スイス", flag: "🇨🇭" },
  25: { code: "GER", name: "ドイツ", flag: "🇩🇪" },
  27: { code: "POR", name: "ポルトガル", flag: "🇵🇹" },
  770: { code: "CZE", name: "チェコ", flag: "🇨🇿" },
  775: { code: "AUT", name: "オーストリア", flag: "🇦🇹" },
  777: { code: "TUR", name: "トルコ", flag: "🇹🇷" },
  1090: { code: "NOR", name: "ノルウェー", flag: "🇳🇴" },
  1108: { code: "SCO", name: "スコットランド", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  1113: { code: "BIH", name: "ボスニア・ヘルツェゴビナ", flag: "🇧🇦" },
  1118: { code: "NED", name: "オランダ", flag: "🇳🇱" },
  // 南米
  6: { code: "BRA", name: "ブラジル", flag: "🇧🇷" },
  7: { code: "URU", name: "ウルグアイ", flag: "🇺🇾" },
  8: { code: "COL", name: "コロンビア", flag: "🇨🇴" },
  26: { code: "ARG", name: "アルゼンチン", flag: "🇦🇷" },
  2380: { code: "PAR", name: "パラグアイ", flag: "🇵🇾" },
  2382: { code: "ECU", name: "エクアドル", flag: "🇪🇨" },
  // 北中米・カリブ
  11: { code: "PAN", name: "パナマ", flag: "🇵🇦" },
  16: { code: "MEX", name: "メキシコ", flag: "🇲🇽" },
  2384: { code: "USA", name: "アメリカ", flag: "🇺🇸" },
  2386: { code: "HAI", name: "ハイチ", flag: "🇭🇹" },
  5529: { code: "CAN", name: "カナダ", flag: "🇨🇦" },
  5530: { code: "CUW", name: "キュラソー", flag: "🇨🇼" },
  // アジア
  12: { code: "JPN", name: "日本", flag: "🇯🇵" },
  17: { code: "KOR", name: "韓国", flag: "🇰🇷" },
  20: { code: "AUS", name: "オーストラリア", flag: "🇦🇺" },
  22: { code: "IRN", name: "イラン", flag: "🇮🇷" },
  23: { code: "SAU", name: "サウジアラビア", flag: "🇸🇦" },
  1548: { code: "JOR", name: "ヨルダン", flag: "🇯🇴" },
  1567: { code: "IRQ", name: "イラク", flag: "🇮🇶" },
  1568: { code: "UZB", name: "ウズベキスタン", flag: "🇺🇿" },
  1569: { code: "QAT", name: "カタール", flag: "🇶🇦" },
  // アフリカ
  13: { code: "SEN", name: "セネガル", flag: "🇸🇳" },
  28: { code: "TUN", name: "チュニジア", flag: "🇹🇳" },
  31: { code: "MAR", name: "モロッコ", flag: "🇲🇦" },
  32: { code: "EGY", name: "エジプト", flag: "🇪🇬" },
  1501: { code: "CIV", name: "コートジボワール", flag: "🇨🇮" },
  1504: { code: "GHA", name: "ガーナ", flag: "🇬🇭" },
  1508: { code: "COD", name: "コンゴ民主共和国", flag: "🇨🇩" },
  1531: { code: "RSA", name: "南アフリカ", flag: "🇿🇦" },
  1532: { code: "DZA", name: "アルジェリア", flag: "🇩🇿" },
  1533: { code: "CPV", name: "カーボベルデ", flag: "🇨🇻" },
  // オセアニア
  4673: { code: "NZL", name: "ニュージーランド", flag: "🇳🇿" },
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

export function convertFixture(fx: ApiFixture): Match {
  const { round, slot } = parseRound(fx.league.round);
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

// ---------- イベント変換 ----------

export function convertEvents(
  events: ApiEvent[],
  homeTeamId: number,
): MatchEvent[] {
  return events
    .filter((e) => e.type === "Goal")
    .map((e) => ({
      minute: e.time.elapsed + (e.time.extra ?? 0),
      type: "goal" as const,
      player: e.player.name,
      assist: e.assist.name ?? undefined,
      detail: e.detail === "Normal Goal" ? undefined : e.detail,
      side: (e.team.id === homeTeamId ? "home" : "away") as "home" | "away",
    }));
}

// ---------- 1試合詳細取得 ----------

export async function fetchFixtureDetail(
  fixtureId: string,
): Promise<Match> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error("API_FOOTBALL_KEY is not set");
  }

  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
    {
      headers: { "x-apisports-key": key },
      next: { revalidate: 30 },
    },
  );

  if (!res.ok) {
    throw new Error(`API-Football responded with ${res.status}`);
  }

  const data: ApiDetailResponse = await res.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    const msg = Object.values(data.errors).join(", ");
    throw new Error(`API-Football error: ${msg}`);
  }

  if (data.response.length === 0) {
    throw new Error(`Fixture ${fixtureId} not found`);
  }

  const fx = data.response[0];
  const match = convertFixture(fx);
  match.events = convertEvents(fx.events ?? [], fx.teams.home.id);
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

  const matches = data.response.map(convertFixture);

  console.log(`[api-football] ${matches.length} fixtures fetched`);
  return matches;
}
