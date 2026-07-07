"use client";

import { useState } from "react";
import { useMatchData } from "@/hooks/useMatchData";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TabNav from "@/components/TabNav";
import Bracket from "@/components/Bracket";
import GroupStage from "@/components/GroupStage";
import ResultsList from "@/components/ResultsList";
import ScheduleList from "@/components/ScheduleList";
import Footer from "@/components/Footer";

export default function Home() {
  const { data, isLoading } = useMatchData();
  const [activeTab, setActiveTab] = useState("bracket");

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
        <TabNav active={activeTab} onTabChange={setActiveTab} />
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
      </main>
      <Footer />
    </>
  );
}
