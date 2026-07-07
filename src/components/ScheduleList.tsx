"use client";

import { Match } from "@/lib/types";
import { groupByDay } from "@/lib/utils";
import ListCard from "./ListCard";

export default function ScheduleList({ matches }: { matches: Match[] }) {
  const upcoming = matches
    .filter((m) => m.status !== "final")
    .sort((a, b) => new Date(a.ko).getTime() - new Date(b.ko).getTime());

  const groups = groupByDay(upcoming);

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
