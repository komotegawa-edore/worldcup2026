"use client";

import { useEffect, useRef, useState } from "react";
import { Match } from "@/lib/types";
import { ROUND_JA } from "@/lib/constants";
import { fmtDT, isLive } from "@/lib/utils";
import ProbBar from "./ProbBar";

export default function Hero({ matches }: { matches: Match[] }) {
  const live = matches.find(isLive);
  const next = matches
    .filter(
      (m) =>
        m.status !== "final" &&
        m.home &&
        m.away &&
        new Date(m.ko).getTime() > Date.now()
    )
    .sort((a, b) => new Date(a.ko).getTime() - new Date(b.ko).getTime())[0];

  const m = live || next;
  const [countdown, setCountdown] = useState("--:--:--");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!m || live) return;

    const tick = () => {
      let s = Math.max(0, Math.floor((new Date(m.ko).getTime() - Date.now()) / 1000));
      const d = Math.floor(s / 86400);
      s %= 86400;
      const h = Math.floor(s / 3600);
      const mi = Math.floor((s % 3600) / 60);
      const se = s % 60;
      setCountdown(
        (d ? `${d}日 ` : "") +
          `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:${String(se).padStart(2, "0")}`
      );
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [m, live]);

  if (!m) {
    return (
      <section className="hero" aria-label="次の試合">
        <div>
          <div className="eyebrow">大会終了</div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero" aria-label="次の試合">
      <div>
        <div className="eyebrow">
          {live ? (
            <>
              <span className="dot">●</span> いま試合中
            </>
          ) : (
            "次の一戦"
          )}{" "}
          — {ROUND_JA[m.round]}
        </div>
        <div className="next-match">
          <div className="next-team">
            <span className="flag">{m.home!.f}</span>
            <span className="name">{m.home!.n}</span>
          </div>
          <span className="next-vs">
            {live ? `${m.hs} – ${m.as}` : "VS"}
          </span>
          <div className="next-team">
            <span className="flag">{m.away!.f}</span>
            <span className="name">{m.away!.n}</span>
          </div>
        </div>
        <div className="kickoff num">キックオフ:{fmtDT(m.ko)}(日本時間)</div>
        {m.prob && m.home && m.away && (
          <ProbBar prob={m.prob} home={m.home} away={m.away} />
        )}
      </div>
      <div className="countdown">
        {live ? (
          <>
            <div className="cd">
              <span className="badge-live">● LIVE</span>
            </div>
            <div className="lbl">LIVE</div>
          </>
        ) : (
          <>
            <div className="cd num">{countdown}</div>
            <div className="lbl">キックオフまで</div>
          </>
        )}
      </div>
    </section>
  );
}
