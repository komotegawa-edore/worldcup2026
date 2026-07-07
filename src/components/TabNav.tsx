"use client";

interface TabNavProps {
  active: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: "bracket", label: "トーナメント表" },
  { id: "group", label: "グループ" },
  { id: "results", label: "試合結果" },
  { id: "schedule", label: "今後の日程" },
];

export default function TabNav({ active, onTabChange }: TabNavProps) {
  return (
    <nav className="tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn${active === tab.id ? " active" : ""}`}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
