"use client";

import * as React from "react";

import { cn } from "../utils/cn";
import type { BreadcrumbItem } from "../layout/types";
import { Breadcrumbs } from "../layout/Breadcrumbs";

export type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, breadcrumbs, meta, actions, tabs, className }: PageHeaderProps) {
  return (
    <section className={cn("space-y-4 border-b border-border pb-6", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} className="text-xs" />}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {meta}
          </div>
          {description && <p className="text-muted-foreground max-w-2xl text-sm">{description}</p>}
        </div>
        {actions}
      </div>
      {tabs}
    </section>
  );
}

