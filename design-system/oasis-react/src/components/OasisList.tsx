"use client";

import type { ReactNode } from "react";

export interface OasisListProps {
  items: ReactNode[];
  striped?: boolean;
  className?: string;
}

export function OasisList({ items, striped = false, className = "" }: OasisListProps) {
  const classes = ["oasis-list", striped ? "oasis-list--striped" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <ul className={classes} data-oasis="list">
      {items.map((item, i) => (
        <li key={i} className="oasis-list__item">
          {item}
        </li>
      ))}
    </ul>
  );
}
