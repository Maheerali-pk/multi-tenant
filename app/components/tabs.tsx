"use client";

import { ReactNode } from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-border-hr">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors relative cursor-pointer flex items-center gap-2 ${
            activeTab === tab.id
              ? "text-brand border-b-2 border-brand"
              : "text-text-secondary hover:text-text-primary"
          }`}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.icon && (
            <span className={activeTab === tab.id ? "text-brand" : ""}>
              {tab.icon}
            </span>
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
