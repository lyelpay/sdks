"use client";

import * as React from "react";

import { cn } from "../utils/cn";
import type { BreadcrumbItem } from "./types";
import { Breadcrumbs } from "./Breadcrumbs";

export type HeaderBarProps = {
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  search?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
};

export function HeaderBar({ title, subtitle, breadcrumbs, actions, search, rightSlot, className }: HeaderBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full border-b border-border bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex flex-col">
          {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} className="text-xs" />}
          {title && <div className="mt-1 text-lg font-semibold text-foreground">{title}</div>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {search}
          {actions}
          {rightSlot}
        </div>
      </div>
    </header>
  );
}

