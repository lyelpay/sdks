"use client";

import { useState, type ReactNode } from "react";

export interface OasisTooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export function OasisTooltip({ content, children, className = "" }: OasisTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={`oasis-tooltip-wrap ${className}`.trim()}
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      data-oasis="tooltip-wrap"
    >
      {children}
      {visible && (
        <span
          className="oasis-tooltip"
          role="tooltip"
          style={{
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "4px",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
