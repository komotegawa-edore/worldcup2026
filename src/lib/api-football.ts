import { GroupStanding, Match, MatchEvent, MatchPreview, MatchStatus, PlayerRank, RoundType, SquadPlayer, Team } from "./types";

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

function parseRound(round: string): { round: RoundType; slot?: number; group?: string } {
  const r = round.toLowerCase();
  if (r.includes("group")) {
    // "Group A - 1" → group "A"
    const gm = round.match(/Group\s+([A-L])/i);
    return { round: "GS", group: gm ? gm[1].toUpperCase() : undefined };
  }
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

function isTBD(team: { id: number; name: string }): boolean {
  return !team.name || team.name === "TBD" || team.id === 0;
}

export function convertFixture(fx: ApiFixture): Match {
  const { round, slot, group } = parseRound(fx.league.round);
  const status = STATUS_MAP[fx.fixture.status.short] ?? "scheduled";

  const homeTBD = isTBD(fx.teams.home);
  const awayTBD = isTBD(fx.teams.away);

  const match: Match = {
    id: String(fx.fixture.id),
    round,
    ko: fx.fixture.date,
    status,
    home: homeTBD ? null : toTeam(fx.teams.home),
    away: awayTBD ? null : toTeam(fx.teams.away),
  };

  if (homeTBD) match.homeFrom = fx.teams.home.name || "未定";
  if (awayTBD) match.awayFrom = fx.teams.away.name || "未定";

  if (slot !== undefined) match.slot = slot;
  if (group) match.group = group;

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
    .filter((e) => e.type === "Goal" || (e.type === "Card" && e.detail === "Red Card"))
    .map((e) => ({
      minute: e.time.elapsed + (e.time.extra ?? 0),
      type: (e.type === "Goal" ? "goal" : "red") as "goal" | "red",
      player: e.player.name,
      assist: e.type === "Goal" ? (e.assist.name ?? undefined) : undefined,
      detail: e.type === "Goal" && e.detail !== "Normal Goal" ? e.detail : undefined,
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

  // 不足ラウンドを補完 (API が TBD 試合を返さない場合のフォールバック)
  const roundCounts: Record<RoundType, number> = { GS: 0, R32: 0, R16: 0, QF: 0, SF: 0, "3P": 0, F: 0 };
  for (const m of matches) roundCounts[m.round]++;

  const placeholder = (round: RoundType, slot: number, label: string, ko: string): Match => ({
    id: `placeholder-${round}-${slot}`,
    round,
    slot,
    ko,
    status: "scheduled",
    home: null,
    away: null,
    homeFrom: label,
    awayFrom: label,
  });

  // 準決勝 (2試合必要)
  if (roundCounts.SF < 2) {
    for (let i = roundCounts.SF; i < 2; i++) {
      matches.push(placeholder("SF", i + 1, "準々決勝勝者", "2026-07-19T00:00:00Z"));
    }
  }
  // 3位決定戦 (1試合)
  if (roundCounts["3P"] < 1) {
    matches.push(placeholder("3P", 1, "準決勝敗者", "2026-07-19T18:00:00Z"));
  }
  // 決勝 (1試合)
  if (roundCounts.F < 1) {
    matches.push(placeholder("F", 1, "準決勝勝者", "2026-07-19T22:00:00Z"));
  }

  console.log(`[api-football] ${matches.length} fixtures fetched (incl. placeholders)`);
  return matches;
}

// ---------- ヘルパー: API-Football GET ----------

async function apiFetch<T>(endpoint: string): Promise<T> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY is not set");

  const res = await fetch(
    `https://v3.football.api-sports.io${endpoint}`,
    {
      headers: { "x-apisports-key": key },
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) throw new Error(`API-Football responded with ${res.status}`);

  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football error: ${Object.values(data.errors).join(", ")}`);
  }
  return data;
}

// ---------- 得点ランキング ----------

export async function fetchTopScorers(): Promise<PlayerRank[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await apiFetch("/players/topscorers?league=1&season=2026");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.response ?? []).map((p: any, i: number) => {
    const info = TEAM_MAP[p.statistics?.[0]?.team?.id];
    return {
      rank: i + 1,
      name: p.player?.name ?? "Unknown",
      team: info?.name ?? p.statistics?.[0]?.team?.name ?? "Unknown",
      flag: info?.flag ?? "🏳️",
      count: p.statistics?.[0]?.goals?.total ?? 0,
    };
  });
}

// ---------- アシストランキング ----------

export async function fetchTopAssists(): Promise<PlayerRank[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await apiFetch("/players/topassists?league=1&season=2026");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.response ?? []).map((p: any, i: number) => {
    const info = TEAM_MAP[p.statistics?.[0]?.team?.id];
    return {
      rank: i + 1,
      name: p.player?.name ?? "Unknown",
      team: info?.name ?? p.statistics?.[0]?.team?.name ?? "Unknown",
      flag: info?.flag ?? "🏳️",
      count: p.statistics?.[0]?.goals?.assists ?? 0,
    };
  });
}

// ---------- グループ順位表 ----------

export { TEAM_MAP };

export async function fetchStandings(): Promise<Record<string, GroupStanding[]>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await apiFetch("/standings?league=1&season=2026");
  const result: Record<string, GroupStanding[]> = {};

  // data.response[0].league.standings is array of groups
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const standings = data.response?.[0]?.league?.standings ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const group of standings) {
    if (!Array.isArray(group) || group.length === 0) continue;
    // Group name from first entry: "Group A" → "A"
    const gName = (group[0].group ?? "").replace(/^Group\s*/i, "");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result[gName] = group.map((entry: any) => {
      const info = TEAM_MAP[entry.team?.id];
      const team: Team = info
        ? { c: info.code, n: info.name, f: info.flag }
        : { c: (entry.team?.name ?? "").slice(0, 3).toUpperCase(), n: entry.team?.name ?? "", f: "🏳️" };
      return {
        rank: entry.rank ?? 0,
        team,
        played: entry.all?.played ?? 0,
        won: entry.all?.win ?? 0,
        drawn: entry.all?.draw ?? 0,
        lost: entry.all?.lose ?? 0,
        gf: entry.all?.goals?.for ?? 0,
        ga: entry.all?.goals?.against ?? 0,
        gd: entry.goalsDiff ?? 0,
        points: entry.points ?? 0,
      };
    });
  }

  return result;
}

// ---------- スカッド取得 ----------

const POS_ORDER: Record<string, number> = {
  Goalkeeper: 4,
  Defender: 3,
  Midfielder: 2,
  Attacker: 1,
};

async function fetchSquad(teamId: number): Promise<SquadPlayer[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await apiFetch(`/players/squads?team=${teamId}`);
  const players = data.response?.[0]?.players ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return players.map((p: any) => ({
    name: p.name ?? "Unknown",
    age: p.age ?? null,
    number: p.number ?? null,
    position: p.position ?? "Unknown",
    photo: p.photo ?? "",
  }));
}

/** TEAM_MAP から API team ID を逆引き */
function findTeamId(code: string): number | null {
  for (const [id, info] of Object.entries(TEAM_MAP)) {
    if (info.code === code) return Number(id);
  }
  return null;
}

export async function fetchMatchPreview(
  homeCode: string,
  awayCode: string,
): Promise<MatchPreview> {
  const homeId = findTeamId(homeCode);
  const awayId = findTeamId(awayCode);

  const [homeSquad, awaySquad] = await Promise.all([
    homeId ? fetchSquad(homeId) : Promise.resolve([]),
    awayId ? fetchSquad(awayId) : Promise.resolve([]),
  ]);

  // Sort by position priority (Attacker first) and take top 5
  const sortByPos = (a: SquadPlayer, b: SquadPlayer) =>
    (POS_ORDER[a.position] ?? 5) - (POS_ORDER[b.position] ?? 5);

  return {
    home: homeSquad.sort(sortByPos).slice(0, 5),
    away: awaySquad.sort(sortByPos).slice(0, 5),
  };
}
