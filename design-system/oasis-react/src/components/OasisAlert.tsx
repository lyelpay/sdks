"use client";

import type { ReactNode } from "react";

export type OasisAlertVariant = "success" | "warning" | "error" | "info";

export interface OasisAlertProps {
  variant?: OasisAlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function OasisAlert({ variant = "info", title, children, className = "" }: OasisAlertProps) {
  const classes = ["oasis-alert", `oasis-alert--${variant}`, className].filter(Boolean).join(" ");
  return (
    <div className={classes} role="alert" data-oasis="alert">
      {title && <strong style={{ display: "block", marginBottom: "4px" }}>{title}</strong>}
      {children}
    </div>
  );
}
