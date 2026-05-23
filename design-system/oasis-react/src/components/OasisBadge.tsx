"use client";

import type { ReactNode } from "react";

export type OasisBadgeVariant = "default" | "primary" | "secondary" | "destructive" | "outline";

export interface OasisBadgeProps {
  variant?: OasisBadgeVariant;
  children?: ReactNode;
  className?: string;
}

export function OasisBadge({ variant = "default", children, className = "" }: OasisBadgeProps) {
  const classes = ["oasis-badge", `oasis-badge--${variant}`, className].filter(Boolean).join(" ");
  return (
    <span className={classes} data-oasis="badge">
      {children}
    </span>
  );
}
