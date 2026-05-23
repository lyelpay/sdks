"use client";

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card } from "../primitives/card";
import { cn } from "../utils/cn";

export type Trend = {
  value: string;
  direction: "up" | "down";
};

export type KpiCardProps = {
  label: string;
  value: string | ReactNode;
  sublabel?: string;
  icon?: ReactNode;
  trend?: Trend;
  className?: string;
  footer?: ReactNode;
};

export function KpiCard({ label, value, sublabel, icon, trend, className, footer }: KpiCardProps) {
  return (
    <Card className={cn("gap-4 px-5 py-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">{value}</span>
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  trend.direction === "up" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
                )}
              >
                {trend.direction === "up" ? (
                  <ArrowUpRight className="mr-1 size-3" />
                ) : (
                  <ArrowDownRight className="mr-1 size-3" />
                )}
                {trend.value}
              </span>
            )}
          </div>
          {sublabel && <p className="text-sm text-muted-foreground">{sublabel}</p>}
        </div>
        {icon && <div className="rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div>}
      </div>
      {footer && <div className="text-sm text-muted-foreground">{footer}</div>}
    </Card>
  );
}

