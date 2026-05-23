"use client";

import { createElement, type ReactNode } from "react";

export type OasisHeadingLevel = 1 | 2 | 3 | 4;

export interface OasisHeadingProps {
  level?: OasisHeadingLevel;
  children?: ReactNode;
  className?: string;
}

export function OasisHeading({ level = 1, children, className = "" }: OasisHeadingProps) {
  const classes = ["oasis-heading", `oasis-heading--${level}`, className].filter(Boolean).join(" ");
  return createElement(`h${level}`, { className: classes, "data-oasis": "heading" }, children);
}
