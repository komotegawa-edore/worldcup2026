"use client";

import { Match } from "@/lib/types";
import MatchCard from "./MatchCard";

function pairUp(arr: Match[]) {
  const pairs: Match[][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    pairs.push(arr[i + 1] ? [arr[i], arr[i + 1]] : [arr[i]]);
  }
  return pairs;
}

function bySlot(matches: Match[], round: string): Match[] {
  return matches
    .filter((m) => m.round === round)
    .sort((a, b) => (a.slot || 0) - (b.slot || 0));
}

export default function Bracket({ matches }: { matches: Match[] }) {
  const knockout = matches.filter((m) => m.round !== "GS");
  const r32 = bySlot(knockout, "R32");
  const r16 = bySlot(knockout, "R16");
  const qf = bySlot(knockout, "QF");
  const sf = bySlot(knockout, "SF");
  const f = bySlot(knockout, "F");
  const third = knockout.find((m) => m.round === "3P");

  const rounds = [
    ...(r32.length > 0 ? [{ title: "ラウンド32", data: r32, finalH: false }] : []),
    { title: "ラウンド16", data: r16, finalH: false },
    { title: "準々決勝", data: qf, finalH: false },
    { title: "準決勝", data: sf, finalH: false },
    { title: "決勝", data: f, finalH: true },
  ];

  return (
    <>
      <div className="bracket-scroll">
        <div className="bracket">
          {rounds.map((round) => (
            <div className="round-col" key={round.title}>
              <h3 className={round.finalH ? "final-h" : ""}>{round.title}</h3>
              <div className="pairs">
                {pairUp(round.data).map((pair, i) => (
                  <div className="pair" key={i}>
                    {pair.map((m) => (
                      <MatchCard
                        key={m.id}
                        match={m}
                        extraClass={round.finalH ? "final-card" : ""}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {third && (
        <div className="third-place">
          <h3>3位決定戦 — 7/19(日) 6:00</h3>
          <MatchCard match={third} />
        </div>
      )}
    </>
  );
}
