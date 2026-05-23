"use client";

import * as React from "react";

import { Card, CardContent } from "../primitives/card";
import { Button, type ButtonProps } from "../primitives/button";
import { cn } from "../utils/cn";

export type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  helperText?: string;
  action?: {
    label: string;
    onClick: () => void;
    props?: ButtonProps;
  };
  className?: string;
};

export function EmptyState({ icon, title, description, helperText, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <CardContent className="flex flex-col items-center space-y-4">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
          {helperText && <p className="text-xs text-muted-foreground/80">{helperText}</p>}
        </div>
        {action && (
          <Button onClick={action.onClick} {...action.props}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

