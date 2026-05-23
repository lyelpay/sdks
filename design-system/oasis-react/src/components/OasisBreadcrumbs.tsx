"use client";

import type { ReactNode } from "react";

export interface OasisBreadcrumbItem {
  label: ReactNode;
  href?: string;
}

export interface OasisBreadcrumbsProps {
  items: OasisBreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

export function OasisBreadcrumbs({
  items,
  separator = "/",
  className = "",
}: OasisBreadcrumbsProps) {
  return (
    <nav
      className={`oasis-breadcrumbs ${className}`.trim()}
      aria-label="Breadcrumb"
      data-oasis="breadcrumbs"
    >
      {items.map((item, i) => (
        <span key={i} className="oasis-breadcrumbs__item">
          {i > 0 && <span className="oasis-breadcrumbs__sep">{separator}</span>}
          {i === items.length - 1 ? (
            <span className="oasis-breadcrumbs__current">{item.label}</span>
          ) : item.href ? (
            <a href={item.href} className="oasis-breadcrumbs__link">
              {item.label}
            </a>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
