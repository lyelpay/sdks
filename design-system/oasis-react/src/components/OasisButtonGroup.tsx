"use client";

import type { ReactNode } from "react";

export interface OasisButtonGroupProps {
  children: ReactNode;
  className?: string;
}

export function OasisButtonGroup({ children, className = "" }: OasisButtonGroupProps) {
  return (
    <div className={`oasis-btn-group ${className}`.trim()} data-oasis="button-group">
      {children}
    </div>
  );
}
