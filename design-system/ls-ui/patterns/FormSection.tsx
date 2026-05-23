"use client";

import * as React from "react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../primitives/card";
import { cn } from "../utils/cn";

export type FormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, actions, className }: FormSectionProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      {actions && (
        <CardFooter className="flex justify-end gap-2 border-t border-border/60 pt-4 lg:hidden">
          {actions}
        </CardFooter>
      )}
    </Card>
  );
}

