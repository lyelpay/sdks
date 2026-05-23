"use client";

import type { HTMLAttributes, ReactNode } from "react";

export interface OasisContainerProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export function OasisContainer({ children, className = "", ...props }: OasisContainerProps) {
  const classes = ["oasis-container", className].filter(Boolean).join(" ");
  return (
    <div className={classes} data-oasis="container" {...props}>
      {children}
    </div>
  );
}
