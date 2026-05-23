"use client";

export interface OasisProgressProps {
  value: number;
  max?: number;
  size?: "md" | "lg";
  className?: string;
}

export function OasisProgress({
  value,
  max = 100,
  size = "md",
  className = "",
}: OasisProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const classes = ["oasis-progress", size === "lg" ? "oasis-progress--lg" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={classes}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      data-oasis="progress"
    >
      <div className="oasis-progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
