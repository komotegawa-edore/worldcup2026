"use client";

import { Prob, Team } from "@/lib/types";

interface ProbBarProps {
  prob: Prob;
  home: Team;
  away: Team;
  mini?: boolean;
}

export default function ProbBar({ prob, home, away, mini }: ProbBarProps) {
  if (mini) {
    return (
      <div>
        <div className="prob-mini">
          <span className="h" style={{ width: `${prob.h}%` }} />
          <span className="d" style={{ width: `${prob.d}%` }} />
          <span className="a" style={{ width: `${prob.a}%` }} />
        </div>
        <div className="prob-mini-lbl">
          <span>{home.n} {prob.h}%</span>
          <span>引分 {prob.d}%</span>
          <span>{away.n} {prob.a}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="prob">
      <div className="prob-bar">
        <span className="h" style={{ width: `${prob.h}%` }} />
        <span className="d" style={{ width: `${prob.d}%` }} />
        <span className="a" style={{ width: `${prob.a}%` }} />
      </div>
      <div className="prob-legend">
        <span>{home.n} 勝利 {prob.h}%</span>
        <span>引き分け {prob.d}%</span>
        <span>{away.n} 勝利 {prob.a}%</span>
      </div>
    </div>
  );
}
