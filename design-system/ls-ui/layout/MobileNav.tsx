"use client";

import * as React from "react";

import { cn } from "../utils/cn";
import type { NavigationItem } from "./types";

export type MobileNavProps = {
  items: NavigationItem[];
  onSelect?: (item: NavigationItem) => void;
  className?: string;
};

export function MobileNav({ items, onSelect, className }: MobileNavProps) {
  if (!items?.length) return null;

  return (
    <nav className={cn("w-full border-b border-border bg-background/80 backdrop-blur", className)}>
      <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-2">
        {items.map((item) => (
          <button
            key={item.id ?? item.label}
            type="button"
            onClick={() => {
              item.onClick?.();
              onSelect?.(item);
            }}
            className={cn(
              "rounded-full border border-border/60 px-3 py-1 text-xs font-semibold transition hover:border-primary hover:text-primary",
              (item.isActive ?? false) && "border-primary text-primary",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

