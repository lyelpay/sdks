"use client";

import * as React from "react";

import { cn } from "../utils/cn";
import type { KpiCardProps } from "./KpiCard";
import { KpiCard } from "./KpiCard";

export type StatGridProps = {
  items: KpiCardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
};

const columnClass: Record<NonNullable<StatGridProps["columns"]>, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function StatGrid({ items, columns = 3, className }: StatGridProps) {
  return (
    <div className={cn("grid gap-4", columnClass[columns], className)}>
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
}

