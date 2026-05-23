"use client";

import type { HTMLAttributes, ReactNode } from "react";

export interface OasisGridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4;
  children?: ReactNode;
  className?: string;
}

export function OasisGrid({ cols = 1, children, className = "", ...props }: OasisGridProps) {
  const classes = ["oasis-grid", `oasis-grid--${cols}`, className].filter(Boolean).join(" ");
  return (
    <div className={classes} data-oasis="grid" {...props}>
      {children}
    </div>
  );
}
