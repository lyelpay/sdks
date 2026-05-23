"use client";

import type { ReactNode } from "react";

export type OasisToastVariant = "default" | "success" | "error" | "info";

export interface OasisToastItem {
  id: string;
  message: ReactNode;
  variant?: OasisToastVariant;
}

export interface OasisToastProps {
  message: ReactNode;
  variant?: OasisToastVariant;
  onClose?: () => void;
  className?: string;
}

export function OasisToast({
  message,
  variant = "default",
  onClose,
  className = "",
}: OasisToastProps) {
  const classes = ["oasis-toast", variant !== "default" ? `oasis-toast--${variant}` : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={classes}
      data-oasis="toast"
      role="status"
      style={{ display: "flex", alignItems: "flex-start", gap: "var(--oasis-spacing-2)" }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            fontSize: "var(--oasis-text-lg)",
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
