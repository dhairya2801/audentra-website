"use client";

import { useId, useState, type ReactNode } from "react";

export type Tab = {
  id: string;
  label: string;
  content: ReactNode;
};

export function Tabs({ tabs, label }: { tabs: Tab[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const uid = useId();

  return (
    <div>
      <div className="au-tabs" role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${uid}-tab-${tab.id}`}
            aria-controls={`${uid}-panel-${tab.id}`}
            aria-selected={active === tab.id}
            tabIndex={active === tab.id ? 0 : -1}
            className="au-tab"
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => {
              const index = tabs.findIndex((candidate) => candidate.id === active);
              if (event.key === "ArrowRight") {
                setActive(tabs[(index + 1) % tabs.length].id);
              }
              if (event.key === "ArrowLeft") {
                setActive(tabs[(index - 1 + tabs.length) % tabs.length].id);
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${uid}-panel-${tab.id}`}
          aria-labelledby={`${uid}-tab-${tab.id}`}
          hidden={active !== tab.id}
          className="au-tabpanel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
