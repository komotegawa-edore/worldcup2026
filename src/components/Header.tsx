"use client";

import { Match } from "@/lib/types";
import { ROUND_JA } from "@/lib/constants";

const ROUND_ORDER = ["R16", "QF", "SF", "3P", "F"] as const;

export default function Header({ matches }: { matches: Match[] }) {
  const cur = ROUND_ORDER.find((r) =>
    matches.some((m) => m.round === r && m.status !== "final")
  );

  return (
    <header>
      <div className="brand">
        <h1>
          FIFA World Cup <span className="yr">2026</span>
        </h1>
        <span className="sub">アメリカ・カナダ・メキシコ大会 — 決勝トーナメント速報</span>
      </div>
      <div className="round-now">
        {cur ? `${ROUND_JA[cur]} 進行中` : "大会終了"}
      </div>
    </header>
  );
}
