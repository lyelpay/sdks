"use client";

import type { ReactNode } from "react";

export interface OasisTextProps {
  children?: ReactNode;
  className?: string;
}

export function OasisText({ children, className = "" }: OasisTextProps) {
  return (
    <p className={`oasis-text ${className}`.trim()} data-oasis="text">
      {children}
    </p>
  );
}
