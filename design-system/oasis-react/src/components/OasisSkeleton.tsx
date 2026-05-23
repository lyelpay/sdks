"use client";

export interface OasisSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function OasisSkeleton({ width, height = 20, className = "" }: OasisSkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };
  return (
    <div
      className={`oasis-skeleton ${className}`.trim()}
      style={style}
      data-oasis="skeleton"
      aria-hidden
    />
  );
}
