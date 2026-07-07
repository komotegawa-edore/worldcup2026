"use client";

import { useState, useEffect, useCallback } from "react";
import { useMatchData } from "@/hooks/useMatchData";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TabNav from "@/components/TabNav";
import Bracket from "@/components/Bracket";
import GroupStage from "@/components/GroupStage";
import ResultsList from "@/components/ResultsList";
import ScheduleList from "@/components/ScheduleList";
import RankingPanel from "@/components/RankingPanel";
import Footer from "@/components/Footer";

const VALID_TABS = ["bracket", "group", "results", "schedule", "ranking"];

function getInitialTab(): string {
  if (typeof window === "undefined") return "bracket";
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  return tab && VALID_TABS.includes(tab) ? tab : "bracket";
}

export default function Home() {
  const { data, isLoading } = useMatchData();
  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    const url = tab === "bracket" ? "/" : `/?tab=${tab}`;
    window.history.replaceState(null, "", url);
  }, []);

  // popstate でブラウザ戻る/進むに対応
  useEffect(() => {
    const onPop = () => setActiveTab(getInitialTab());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (isLoading || !data) {
    return (
      <>
        <div className="loading">LOADING...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header matches={data.matches} />
      <main>
        <Hero matches={data.matches} />
        <TabNav active={activeTab} onTabChange={handleTabChange} />
        <section className={`panel${activeTab === "bracket" ? " active" : ""}`}>
          <Bracket matches={data.matches} />
        </section>
        <section className={`panel${activeTab === "group" ? " active" : ""}`}>
          <GroupStage matches={data.matches} />
        </section>
        <section className={`panel${activeTab === "results" ? " active" : ""}`}>
          <ResultsList matches={data.matches} />
        </section>
        <section className={`panel${activeTab === "schedule" ? " active" : ""}`}>
          <ScheduleList matches={data.matches} />
        </section>
        <section className={`panel${activeTab === "ranking" ? " active" : ""}`}>
          <RankingPanel />
        </section>
      </main>
      <Footer />
    </>
  );
}
