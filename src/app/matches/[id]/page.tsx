"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Match, MatchEvent, MatchPreview, SquadPlayer, StatItem } from "@/lib/types";
import { ROUND_JA } from "@/lib/constants";
import { fmtDT } from "@/lib/utils";
import Flag from "@/components/Flag";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const POS_JA: Record<string, string> = {
  Attacker: "FW",
  Midfielder: "MF",
  Defender: "DF",
  Goalkeeper: "GK",
};

function Scoreboard({ match }: { match: Match }) {
  const isFinished = match.status === "final";
  const isLive = match.status === "live";

  return (
    <div className="scoreboard">
      <div className="sb-teams">
        <div className="sb-team">
          <span className="sb-flag"><Flag code={match.home?.f ?? ""} size={36} /></span>
          <span className="sb-name">{match.home?.n ?? "未定"}</span>
        </div>
        <div className="sb-score num">
          {match.status === "scheduled" ? (
            <span className="sb-vs">VS</span>
          ) : (
            <>
              <span>{match.hs ?? 0}</span>
              <span className="sb-dash">-</span>
              <span>{match.as ?? 0}</span>
            </>
          )}
        </div>
        <div className="sb-team">
          <span className="sb-flag"><Flag code={match.away?.f ?? ""} size={36} /></span>
          <span className="sb-name">{match.away?.n ?? "未定"}</span>
        </div>
      </div>
      <div className="sb-meta">
        <span>{ROUND_JA[match.round]}</span>
        <span>
          {isLive ? (
            <span className="badge-live">● LIVE</span>
          ) : isFinished ? (
            "試合終了"
          ) : (
            <span className="num">{fmtDT(match.ko)}</span>
          )}
        </span>
      </div>
      {match.note && <div className="sb-note">{match.note}</div>}
    </div>
  );
}

function Timeline({ events }: { events: MatchEvent[] }) {
  const sorted = [...events].sort((a, b) => a.minute - b.minute);

  if (sorted.length === 0) {
    return <div className="events-empty">イベントなし</div>;
  }

  return (
    <div className="timeline">
      {sorted.map((ev, i) => {
        const isHome = ev.side === "home";
        const icon = <span className={ev.type === "red" ? "tl-icon tl-icon-red" : "tl-icon tl-icon-goal"} />;
        return (
          <div key={i} className="tl-row">
            <div className="tl-home">
              {isHome && (
                <span className="tl-event">
                  {icon} {ev.player}
                  {ev.assist && <span className="tl-assist"> ({ev.assist})</span>}
                  {ev.detail && <span className="tl-detail"> {ev.detail}</span>}
                </span>
              )}
            </div>
            <div className="tl-min num">{ev.minute}&apos;</div>
            <div className="tl-away">
              {!isHome && (
                <span className="tl-event">
                  {ev.player} {icon}
                  {ev.assist && <span className="tl-assist"> ({ev.assist})</span>}
                  {ev.detail && <span className="tl-detail"> {ev.detail}</span>}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlayerList({ players, label }: { players: SquadPlayer[]; label: string }) {
  if (players.length === 0) return null;
  return (
    <div className="preview-team">
      <h4 className="preview-team-label">{label}</h4>
      <div className="preview-players">
        {players.map((p, i) => (
          <div key={i} className="preview-player">
            <span className="preview-pos">{POS_JA[p.position] ?? p.position}</span>
            <span className="preview-name">
              {p.number != null && <span className="preview-num num">#{p.number} </span>}
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchPreviewSection({ match }: { match: Match }) {
  const homeCode = match.home?.c;
  const awayCode = match.away?.c;
  const shouldFetch = homeCode && awayCode;

  const { data, isLoading } = useSWR<MatchPreview>(
    shouldFetch ? `/api/matches/preview?home=${homeCode}&away=${awayCode}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  );

  if (!shouldFetch) return null;
  if (isLoading) return <div className="events-loading">注目選手を読み込み中…</div>;
  if (!data || (data.home.length === 0 && data.away.length === 0)) return null;

  return (
    <div className="preview-section">
      <h3 className="preview-heading">注目選手</h3>
      <div className="preview-grid">
        <PlayerList players={data.home} label={match.home?.n ?? ""} />
        <PlayerList players={data.away} label={match.away?.n ?? ""} />
      </div>
    </div>
  );
}

function StatsPanel({ matchId }: { matchId: string }) {
  const { data, isLoading } = useSWR<StatItem[]>(
    `/api/matches/${matchId}/stats`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  if (isLoading) return <div className="events-loading">スタッツを読み込み中...</div>;
  if (!data || data.length === 0) return null;

  return (
    <div className="stats-section">
      <h3 className="stats-heading">Match Stats</h3>
      <div className="stats-list">
        {data.map((s) => {
          const hVal = parseFloat(s.home) || 0;
          const aVal = parseFloat(s.away) || 0;
          const total = hVal + aVal || 1;
          const hPct = (hVal / total) * 100;
          return (
            <div key={s.label} className="stat-row">
              <span className="stat-val num">{s.home}</span>
              <div className="stat-center">
                <div className="stat-bar">
                  <div className="stat-bar-h" style={{ width: `${hPct}%` }} />
                  <div className="stat-bar-a" style={{ width: `${100 - hPct}%` }} />
                </div>
                <span className="stat-label">{s.label}</span>
              </div>
              <span className="stat-val num">{s.away}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useSWR<Match>(`/api/matches/${id}`, fetcher, {
    refreshInterval: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="detail-page">
        <Link href="/" className="back-link">← トップへ</Link>
        <div className="loading">LOADING...</div>
      </div>
    );
  }

  const showStats = data.status === "final" || data.status === "live";

  return (
    <div className="detail-page">
      <Link href="/" className="back-link">← トップへ</Link>
      <Scoreboard match={data} />
      {data.status === "scheduled" ? (
        <>
          <div className="detail-kickoff">
            <p>キックオフ: <span className="num">{fmtDT(data.ko)}</span></p>
          </div>
          <MatchPreviewSection match={data} />
        </>
      ) : (
        data.events && <Timeline events={data.events} />
      )}
      {showStats && <StatsPanel matchId={id} />}
    </div>
  );
}
