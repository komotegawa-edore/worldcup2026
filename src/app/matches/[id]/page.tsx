"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Match, MatchEvent, MatchPreview, SquadPlayer } from "@/lib/types";
import { ROUND_JA } from "@/lib/constants";
import { fmtDT } from "@/lib/utils";

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
          <span className="sb-flag">{match.home?.f ?? "·"}</span>
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
          <span className="sb-flag">{match.away?.f ?? "·"}</span>
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
        const icon = ev.type === "red" ? "🟥" : "⚽";
        const isHome = ev.side === "home";
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
    </div>
  );
}
