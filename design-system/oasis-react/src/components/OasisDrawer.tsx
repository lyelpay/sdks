"use client";

import { useEffect, type ReactNode } from "react";

export type OasisDrawerSide = "left" | "right";

export interface OasisDrawerProps {
  open: boolean;
  onClose: () => void;
  side?: OasisDrawerSide;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function OasisDrawer({
  open,
  onClose,
  side = "right",
  title,
  children,
  className = "",
}: OasisDrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="oasis-drawer-overlay" onClick={onClose} aria-hidden />
      <div
        className={`oasis-drawer oasis-drawer--${side} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        data-oasis="drawer"
      >
        {title != null && (
          <div
            style={{
              fontSize: "var(--oasis-text-lg)",
              fontWeight: 600,
              marginBottom: "var(--oasis-spacing-4)",
            }}
          >
            {title}
          </div>
        )}
        {children}
      </div>
    </>
  );
}
