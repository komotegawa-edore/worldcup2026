"use client";

import useSWR from "swr";
import { Match, GroupStanding } from "@/lib/types";
import ListCard from "./ListCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StandingsTable({ rows }: { rows: GroupStanding[] }) {
  return (
    <table className="standings-table">
      <thead>
        <tr>
          <th>#</th>
          <th>チーム</th>
          <th>勝</th>
          <th>分</th>
          <th>負</th>
          <th>得</th>
          <th>失</th>
          <th>差</th>
          <th>勝点</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.team.c}>
            <td className="num">{r.rank}</td>
            <td>{r.team.f} {r.team.n}</td>
            <td className="num">{r.won}</td>
            <td className="num">{r.drawn}</td>
            <td className="num">{r.lost}</td>
            <td className="num">{r.gf}</td>
            <td className="num">{r.ga}</td>
            <td className="num">{r.gd}</td>
            <td className="num standings-pts">{r.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const GROUP_ORDER = "ABCDEFGHIJKL".split("");

export default function GroupStage({ matches }: { matches: Match[] }) {
  const { data: standings } = useSWR<Record<string, GroupStanding[]>>(
    "/api/standings",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  const gsMatches = matches.filter((m) => m.round === "GS");

  if (gsMatches.length === 0 && !standings) {
    return (
      <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>
        グループステージのデータはまだありません
      </p>
    );
  }

  // Group matches by group letter
  const matchesByGroup: Record<string, Match[]> = {};
  for (const m of gsMatches) {
    const g = m.group ?? "?";
    (matchesByGroup[g] = matchesByGroup[g] || []).push(m);
  }

  // Determine which groups to show
  const groupKeys = standings
    ? GROUP_ORDER.filter((g) => standings[g] || matchesByGroup[g])
    : GROUP_ORDER.filter((g) => matchesByGroup[g]);

  return (
    <div>
      {groupKeys.map((g) => (
        <div key={g} className="group-section">
          <h3 className="group-header">グループ {g}</h3>

          {standings?.[g] && <StandingsTable rows={standings[g]} />}

          {matchesByGroup[g] && matchesByGroup[g].length > 0 && (
            <div className="list-grid" style={{ marginTop: 12 }}>
              {matchesByGroup[g]
                .sort((a, b) => new Date(a.ko).getTime() - new Date(b.ko).getTime())
                .map((m) => (
                  <ListCard key={m.id} match={m} />
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
