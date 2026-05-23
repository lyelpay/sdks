"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "../utils/cn";

export type InfoBannerVariant = "info" | "success" | "warning";

const variantStyles: Record<InfoBannerVariant, string> = {
  info: "bg-primary/10 text-primary",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
};

const variantIcons: Record<InfoBannerVariant, React.ReactNode> = {
  info: <Info className="size-4" />,
  success: <CheckCircle2 className="size-4" />,
  warning: <AlertCircle className="size-4" />,
};

export type InfoBannerProps = {
  title?: string;
  description?: string;
  variant?: InfoBannerVariant;
  actions?: React.ReactNode;
  className?: string;
};

export function InfoBanner({ title, description, variant = "info", actions, className }: InfoBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-2xl border border-border px-4 py-3 text-sm",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex flex-1 items-start gap-3">
        {variantIcons[variant]}
        <div className="space-y-1">
          {title && <p className="font-medium">{title}</p>}
          {description && <p className="text-sm opacity-90">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

