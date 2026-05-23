import type { ComponentType, PropsWithChildren, ReactNode } from "react";

export type LayoutVariant = "sidebar" | "compact" | "centered";

export type NavigationItem = {
  id?: string;
  label: string;
  href?: string;
  icon?: ComponentType<{ className?: string }> | ReactNode;
  badge?: ReactNode;
  isActive?: boolean;
  target?: string;
  onClick?: () => void;
};

export type NavigationSection = {
  label?: string;
  items: NavigationItem[];
};

export type SidebarLinkComponent = ComponentType<
  PropsWithChildren<{
    href?: string;
    target?: string;
    className?: string;
    onClick?: React.MouseEventHandler;
  }>
>;

export type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: ReactNode;
};

