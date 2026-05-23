"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type OasisButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type OasisButtonSize = "sm" | "md" | "lg";

export interface OasisButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: OasisButtonVariant;
  size?: OasisButtonSize;
  children?: ReactNode;
  className?: string;
}

export function OasisButton({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: OasisButtonProps) {
  const classes = ["oasis-btn", `oasis-btn--${variant}`, `oasis-btn--${size}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={classes} data-oasis="button" {...props}>
      {children}
    </button>
  );
}
