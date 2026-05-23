"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

export interface OasisLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode;
  className?: string;
}

export function OasisLink({ children, className = "", ...props }: OasisLinkProps) {
  return (
    <a className={`oasis-link ${className}`.trim()} data-oasis="link" {...props}>
      {children}
    </a>
  );
}
