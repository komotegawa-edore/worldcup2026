"use client";

import { Match } from "@/lib/types";
import { groupByDay } from "@/lib/utils";
import ListCard from "./ListCard";

export default function ResultsList({ matches }: { matches: Match[] }) {
  const done = matches
    .filter((m) => m.status === "final")
    .sort((a, b) => new Date(b.ko).getTime() - new Date(a.ko).getTime());

  const groups = groupByDay(done);

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
