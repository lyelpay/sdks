"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../primitives/card";
import { cn } from "../utils/cn";

export type DataCardProps = {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  primaryValue?: React.ReactNode;
  secondaryValue?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function DataCard({
  title,
  description,
  badge,
  icon,
  primaryValue,
  secondaryValue,
  footer,
  children,
  className,
}: DataCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="grid gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {icon && <div className="rounded-xl bg-muted p-2 text-muted-foreground">{icon}</div>}
          </div>
        </div>
        {(primaryValue || secondaryValue) && (
          <div className="flex flex-wrap items-baseline gap-2">
            {primaryValue && <span className="text-2xl font-semibold">{primaryValue}</span>}
            {secondaryValue && <span className="text-sm text-muted-foreground">{secondaryValue}</span>}
          </div>
        )}
      </CardHeader>
      {(children || footer) && (
        <CardContent className="space-y-4">
          {children}
          {footer && <div className="text-sm text-muted-foreground">{footer}</div>}
        </CardContent>
      )}
    </Card>
  );
}

