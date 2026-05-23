"use client";

import type { ReactNode } from "react";

export interface OasisCardProps {
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function OasisCard({ header, footer, children, className = "" }: OasisCardProps) {
  const classes = ["oasis-card", className].filter(Boolean).join(" ");
  return (
    <div className={classes} data-oasis="card">
      {header && <div className="oasis-card__header">{header}</div>}
      <div className="oasis-card__body">{children}</div>
      {footer && <div className="oasis-card__footer">{footer}</div>}
    </div>
  );
}
