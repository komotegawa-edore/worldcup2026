"use client";

import Link from "next/link";
import { Match } from "@/lib/types";
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

export default function ListCard({ match }: { match: Match }) {
  const live = isLive(match);
  const canLink = match.status === "final" || live || (match.status === "scheduled" && match.home && match.away);

  const card = (
    <div className={`rcard ${canLink ? "expandable" : ""}`}>
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
