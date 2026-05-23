"use client";

import { useState, type ReactNode } from "react";

export interface OasisTabItem {
  value: string;
  label: ReactNode;
  panel: ReactNode;
}

export interface OasisTabsProps {
  items: OasisTabItem[];
  defaultValue?: string;
  className?: string;
}

export function OasisTabs({ items, defaultValue, className = "" }: OasisTabsProps) {
  const [active, setActive] = useState(defaultValue ?? items[0]?.value ?? "");
  const current = items.find((t) => t.value === active) ?? items[0];

  return (
    <div className={`oasis-tabs ${className}`.trim()} data-oasis="tabs">
      <div className="oasis-tabs__list" role="tablist">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active === item.value}
            className="oasis-tabs__trigger"
            data-state={active === item.value ? "active" : "inactive"}
            onClick={() => setActive(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {current && (
        <div className="oasis-tabs__panel" role="tabpanel">
          {current.panel}
        </div>
      )}
    </div>
  );
}
