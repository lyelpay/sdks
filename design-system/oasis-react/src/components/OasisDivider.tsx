"use client";

export type OasisDividerOrientation = "horizontal" | "vertical";

export interface OasisDividerProps {
  orientation?: OasisDividerOrientation;
  className?: string;
}

export function OasisDivider({ orientation = "horizontal", className = "" }: OasisDividerProps) {
  const classes = ["oasis-divider", `oasis-divider--${orientation}`, className]
    .filter(Boolean)
    .join(" ");
  return <hr className={classes} data-oasis="divider" />;
}
