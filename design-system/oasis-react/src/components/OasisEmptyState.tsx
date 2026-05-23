"use client";

import type { ReactNode } from "react";

export interface OasisEmptyStateProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function OasisEmptyState({
  title = "Aucun résultat",
  description,
  action,
  className = "",
}: OasisEmptyStateProps) {
  return (
    <div className={`oasis-empty ${className}`.trim()} data-oasis="empty-state">
      <div className="oasis-empty__title">{title}</div>
      {description != null && <div className="oasis-empty__desc">{description}</div>}
      {action != null && <div style={{ marginTop: "var(--oasis-spacing-4)" }}>{action}</div>}
    </div>
  );
}
