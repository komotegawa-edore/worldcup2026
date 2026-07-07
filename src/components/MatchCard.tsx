"use client";

import { useState } from "react";
import { Match, MatchEvent } from "@/lib/types";
import { ROUND_JA } from "@/lib/constants";
import { fmtDT, isLive, winnerSide } from "@/lib/utils";

function TeamRow({ match, side }: { match: Match; side: "home" | "away" }) {
  const t = match[side];
  const w = winnerSide(match);

  if (!t) {
    const from = side === "home" ? match.homeFrom : match.awayFrom;
    return (
      <div className="trow tbd">
        <span className="flag">·</span>
        <span className="tn">{from || "未定"}</span>
        <span className="sc">–</span>
      </div>
    );
  }

  const cls = w ? (w === side ? "win" : "lose") : "";
  const score =
    match.status === "final" || isLive(match)
      ? side === "home"
        ? match.hs
        : match.as
      : "–";

  return (
    <div className={`trow ${cls}`}>
      <span className="flag">{t.f}</span>
      <span className="tn">
        {t.n}
        {w === side && <span className="adv">進出</span>}
      </span>
      <span className="sc num">{score}</span>
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

interface MatchCardProps {
  match: Match;
  extraClass?: string;
}

export default function MatchCard({ match, extraClass = "" }: MatchCardProps) {
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
      className={`mcard ${extraClass} ${canExpand ? "expandable" : ""}`}
      onClick={handleClick}
    >
      <div className="meta">
        <span>{ROUND_JA[match.round]}</span>
        {live ? (
          <span className="badge-live">● LIVE</span>
        ) : match.status === "final" ? (
          <span>試合終了</span>
        ) : (
          <span className="num">{fmtDT(match.ko)}</span>
        )}
      </div>
      <TeamRow match={match} side="home" />
      <TeamRow match={match} side="away" />
      {match.note && <div className="note-pk">{match.note}</div>}
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
