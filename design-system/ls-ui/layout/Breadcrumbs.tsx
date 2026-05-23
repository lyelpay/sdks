"use client";

import * as React from "react";
import { ChevronRightIcon } from "lucide-react";

import { cn } from "../utils/cn";
import type { BreadcrumbItem } from "./types";

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
};

export function Breadcrumbs({ items, separator, className }: BreadcrumbsProps) {
  if (!items?.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const content = (
          <span
            className={cn(
              "inline-flex items-center gap-1 capitalize",
              isLast ? "text-foreground font-medium" : "hover:text-foreground",
            )}
          >
            {item.icon}
            {item.label}
          </span>
        );

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {item.href && !isLast ? (
              <a href={item.href} className="transition hover:text-foreground">
                {content}
              </a>
            ) : (
              content
            )}
            {!isLast &&
              (separator ?? <ChevronRightIcon aria-hidden className="size-3 text-muted-foreground/80" />)}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

