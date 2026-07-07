"use client";

import Link from "next/link";
import { Match } from "@/lib/types";
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

interface MatchCardProps {
  match: Match;
  extraClass?: string;
}

export default function MatchCard({ match, extraClass = "" }: MatchCardProps) {
  const live = isLive(match);
  const canLink = match.status === "final" || live || (match.status === "scheduled" && match.home && match.away);

  const card = (
    <div className={`mcard ${extraClass} ${canLink ? "expandable" : ""}`}>
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
    </div>
  );

  if (canLink) {
    return (
      <Link href={`/matches/${match.id}`} style={{ textDecoration: "none", color: "inherit" }}>
        {card}
      </Link>
    );
  }

  return card;
}
