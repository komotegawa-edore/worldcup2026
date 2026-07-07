"use client";

import { useState } from "react";
import { Match, MatchEvent } from "@/lib/types";
import { ROUND_JA } from "@/lib/constants";
import { fmtDT, isLive, winnerSide } from "@/lib/utils";
import ProbBar from "./ProbBar";

function ResultLine({
  match,
  side,
}: {
  match: Match;
  side: "home" | "away";
}) {
  const t = match[side];
  const w = winnerSide(match);

  if (!t) {
    const from = side === "home" ? match.homeFrom : match.awayFrom;
    return (
      <div className="rline">
        <span className="flag">·</span>
        <span className="tn" style={{ color: "var(--chalk-dim)" }}>
          {from}
        </span>
      </div>
    );
  }

  const cls = w ? (w === side ? "win" : "lose") : "";
  const sc =
    match.status === "final" || isLive(match)
      ? side === "home"
        ? match.hs
        : match.as
      : "";

  return (
    <div className={`rline ${cls}`}>
      <span className="flag">{t.f}</span>
      <span className="tn">{t.n}</span>
      <span className="sc num">{sc}</span>
    </div>
  );
}

function EventList({ events, match }: { events: MatchEvent[]; match: Match }) {
  if (events.length === 0) {
    return <div className="events-empty">得点なし</div>;
  }
  return (
    <div className="events-list">
      {events.map((ev, i) => {
        const teamName =
          ev.side === "home" ? match.home?.n : match.away?.n;
        return (
          <div key={i} className="event-row">
            <span className="event-icon">⚽</span>
            <span className="event-min num">{ev.minute}&apos;</span>
            <span className="event-player">
              {ev.player}
              {teamName && <span className="event-team">({teamName})</span>}
            </span>
            {ev.detail && (
              <span className="event-detail">{ev.detail}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ListCard({ match }: { match: Match }) {
  const live = isLive(match);
  const canExpand = match.status === "final" || live;
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<MatchEvent[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!canExpand) return;
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (events !== null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${match.id}`);
      if (res.ok) {
        const data: Match = await res.json();
        setEvents(data.events ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rcard ${canExpand ? "expandable" : ""}`}
      onClick={handleClick}
    >
      <div className="top">
        <span className="rname">{ROUND_JA[match.round]}</span>
        <span>
          {live ? (
            <span className="badge-live">● LIVE</span>
          ) : match.status === "final" ? (
            "終了"
          ) : (
            <span className="num">{fmtDT(match.ko)}</span>
          )}
        </span>
      </div>
      <ResultLine match={match} side="home" />
      <ResultLine match={match} side="away" />
      {match.note && (
        <div className="foot" style={{ color: "var(--gold)" }}>
          {match.note}
        </div>
      )}
      {match.upset && (
        <div className="foot">
          優勝候補ブラジルが姿を消す番狂わせ
          <span className="upset">UPSET</span>
        </div>
      )}
      {match.prob && match.status !== "final" && match.home && match.away && (
        <ProbBar prob={match.prob} home={match.home} away={match.away} mini />
      )}
      {open && (
        <div className="events-panel">
          {loading ? (
            <div className="events-loading">読み込み中…</div>
          ) : events ? (
            <EventList events={events} match={match} />
          ) : null}
        </div>
      )}
    </div>
  );
}
