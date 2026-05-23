"use client";

import type { ImgHTMLAttributes } from "react";

export type OasisAvatarSize = "sm" | "md" | "lg";

export interface OasisAvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: OasisAvatarSize;
  className?: string;
}

export function OasisAvatar({
  src,
  alt = "",
  fallback,
  size = "md",
  className = "",
}: OasisAvatarProps) {
  const classes = ["oasis-avatar", `oasis-avatar--${size}`, className].filter(Boolean).join(" ");
  const initial = fallback ?? (alt ? alt.slice(0, 2).toUpperCase() : "?");

  return (
    <div className={classes} data-oasis="avatar">
      {src ? <img src={src} alt={alt} /> : <span>{initial}</span>}
    </div>
  );
}
