"use client";

import * as React from "react";

import { cn } from "../utils/cn";
import type { PageContainerProps } from "./PageContainer";
import { PageContainer } from "./PageContainer";
import type { HeaderBarProps } from "./HeaderBar";
import { HeaderBar } from "./HeaderBar";
import type { MobileNavProps } from "./MobileNav";
import { MobileNav } from "./MobileNav";
import type { SidebarProps } from "./Sidebar";
import { Sidebar } from "./Sidebar";
import type { LayoutVariant } from "./types";
import { ThemeContext } from "./ThemeProvider";

export type AppShellProps = {
  variant?: LayoutVariant;
  sidebar?: SidebarProps;
  header?: HeaderBarProps;
  mobileNav?: MobileNavProps;
  pageContainerProps?: PageContainerProps;
  children: React.ReactNode;
  className?: string;
};

export function AppShell({
  variant,
  sidebar,
  header,
  mobileNav,
  pageContainerProps,
  children,
  className,
}: AppShellProps) {
  const themeContext = React.useContext(ThemeContext);
  const layoutVariant = variant ?? themeContext?.theme.layout ?? "sidebar";

  if (layoutVariant === "compact") {
    return (
      <CompactLayout
        className={className}
        header={header}
        mobileNav={mobileNav}
        pageContainerProps={pageContainerProps}
      >
        {children}
      </CompactLayout>
    );
  }

  if (layoutVariant === "centered") {
    return (
      <CenteredLayout className={className} header={header}>
        {children}
      </CenteredLayout>
    );
  }

  return (
    <SidebarLayout
      className={className}
      sidebar={sidebar}
      header={header}
      pageContainerProps={pageContainerProps}
    >
      {children}
    </SidebarLayout>
  );
}

type LayoutProps = {
  sidebar?: SidebarProps;
  header?: HeaderBarProps;
  mobileNav?: MobileNavProps;
  pageContainerProps?: PageContainerProps;
  children: React.ReactNode;
  className?: string;
};

function SidebarLayout({ sidebar, header, children, pageContainerProps, className }: LayoutProps) {
  return (
    <div className={cn("flex min-h-screen bg-background text-foreground", className)}>
      {sidebar && <Sidebar {...sidebar} />}
      <div className="flex flex-1 flex-col overflow-hidden">
        {header && <HeaderBar {...header} />}
        <main className="flex-1 overflow-y-auto">
          <PageContainer {...pageContainerProps}>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}

function CompactLayout({ header, mobileNav, children, pageContainerProps, className }: LayoutProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-background text-foreground", className)}>
      {header && <HeaderBar {...header} />}
      {mobileNav && <MobileNav {...mobileNav} />}
      <main className="flex-1 overflow-y-auto">
        <PageContainer {...pageContainerProps}>{children}</PageContainer>
      </main>
    </div>
  );
}

function CenteredLayout({ header, children, className }: LayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground", className)}>
      {header && <HeaderBar {...header} />}
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-[var(--radius-xl)] border border-border bg-white/90 p-8 shadow-2xl backdrop-blur">
          {children}
        </div>
      </main>
    </div>
  );
}

