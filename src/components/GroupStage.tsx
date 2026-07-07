"use client";

import { Match } from "@/lib/types";
import { groupByDay } from "@/lib/utils";
import ListCard from "./ListCard";

export default function GroupStage({ matches }: { matches: Match[] }) {
  const gs = matches
    .filter((m) => m.round === "GS")
    .sort((a, b) => new Date(b.ko).getTime() - new Date(a.ko).getTime());

  if (gs.length === 0) {
    return <p style={{ textAlign: "center", padding: "2rem", opacity: 0.6 }}>グループステージのデータはまだありません</p>;
  }

  const groups = groupByDay(gs);

  return (
    <div>
      {Object.entries(groups).map(([day, ms]) => (
        <div className="day-group" key={day}>
          <h3>{day}</h3>
          <div className="list-grid">
            {ms.map((m) => (
              <ListCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
