"use client";

import * as React from "react";

import { cn } from "../utils/cn";

export type PageContainerProps = React.ComponentProps<"div"> & {
  maxWidth?: "lg" | "xl" | "2xl" | "full";
  padded?: boolean;
};

const maxWidthMap: Record<NonNullable<PageContainerProps["maxWidth"]>, string> = {
  full: "max-w-full",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
};

export function PageContainer({
  className,
  children,
  maxWidth = "xl",
  padded = true,
  ...props
}: PageContainerProps) {
  return (
    <div
      data-slot="page-container"
      className={cn(
        "mx-auto w-full",
        maxWidthMap[maxWidth],
        padded && "px-6 py-8 sm:px-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

