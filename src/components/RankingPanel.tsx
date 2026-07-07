"use client";

import { useState } from "react";
import useSWR from "swr";
import { PlayerRank } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RankingData {
  scorers: PlayerRank[];
  assisters: PlayerRank[];
}

function RankTable({ rows, label }: { rows: PlayerRank[]; label: string }) {
  if (rows.length === 0) {
    return <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>データなし</p>;
  }
  return (
    <table className="ranking-table">
      <thead>
        <tr>
          <th>#</th>
          <th>選手</th>
          <th>国</th>
          <th>{label}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.rank} className="rank-row">
            <td className="num">{r.rank}</td>
            <td>{r.flag} {r.name}</td>
            <td>{r.team}</td>
            <td className="num">{r.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function RankingPanel() {
  const [sub, setSub] = useState<"scorers" | "assisters">("scorers");
  const { data, isLoading } = useSWR<RankingData>("/api/rankings", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  if (isLoading || !data) {
    return <div className="loading">LOADING...</div>;
  }

  return (
    <div>
      <div className="sub-tabs">
        <button
          className={`sub-tab${sub === "scorers" ? " active" : ""}`}
          onClick={() => setSub("scorers")}
        >
          得点
        </button>
        <button
          className={`sub-tab${sub === "assisters" ? " active" : ""}`}
          onClick={() => setSub("assisters")}
        >
          アシスト
        </button>
      </div>
      {sub === "scorers" ? (
        <RankTable rows={data.scorers} label="得点" />
      ) : (
        <RankTable rows={data.assisters} label="アシスト" />
      )}
    </div>
  );
}
