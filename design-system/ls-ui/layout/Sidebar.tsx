"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";

import { Button } from "../primitives/button";
import { cn } from "../utils/cn";
import type { NavigationItem, NavigationSection, SidebarLinkComponent } from "./types";

export type SidebarProps = {
  sections: NavigationSection[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  linkComponent?: SidebarLinkComponent;
  activePath?: string;
  mobileBreakpointClass?: string;
  className?: string;
};

const defaultLinkComponent: SidebarLinkComponent = ({ href, className, children, ...props }) =>
  href ? (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ) : (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  );

export function Sidebar({
  sections,
  logo,
  footer,
  linkComponent,
  activePath,
  mobileBreakpointClass = "lg",
  className,
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const LinkComponent = linkComponent ?? defaultLinkComponent;

  const toggleMobile = () => setIsMobileOpen((prev) => !prev);

  return (
    <>
      <div className={cn(`${mobileBreakpointClass}:hidden fixed left-4 top-4 z-50`)}>
        <Button variant="outline" size="icon" onClick={toggleMobile} className="bg-background/80 backdrop-blur-sm">
          {isMobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </div>
      {isMobileOpen && (
        <div
          className={cn("fixed inset-0 z-40 bg-black/40", `${mobileBreakpointClass}:hidden`)}
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside
        data-slot="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-white transition-transform duration-200 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          `${mobileBreakpointClass}:translate-x-0 ${mobileBreakpointClass}:static`,
          className,
        )}
      >
        <div className="flex h-full flex-col">
          {logo && <div className="flex h-16 items-center justify-center border-b border-border px-6">{logo}</div>}
          <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
            {sections.map((section) => (
              <div key={section.label ?? section.items[0]?.label} className="space-y-3">
                {section.label && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {section.label}
                  </p>
                )}
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <SidebarLink
                      key={item.id ?? item.label}
                      item={item}
                      LinkComponent={LinkComponent}
                      closeMobile={() => setIsMobileOpen(false)}
                      activePath={activePath}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
          {footer && <div className="border-t border-border p-4 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </aside>
    </>
  );
}

type SidebarLinkProps = {
  item: NavigationItem;
  LinkComponent: SidebarLinkComponent;
  closeMobile: () => void;
  activePath?: string;
};

function SidebarLink({ item, LinkComponent, closeMobile, activePath }: SidebarLinkProps) {
  const isActive =
    item.isActive ??
    (!!activePath &&
      !!item.href &&
      (activePath === item.href || activePath.startsWith(`${item.href}/`)));

  const iconNode = getIconNode(item.icon);

  return (
    <LinkComponent
      href={item.href}
      target={item.target}
      onClick={(event) => {
        item.onClick?.();
        if (!item.href) {
          event.preventDefault();
        }
        closeMobile();
      }}
      className={cn(
        "flex items-center space-x-3 rounded-xl px-3 py-2 text-sm font-medium transition",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {iconNode}
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{item.badge}</span>
      )}
    </LinkComponent>
  );
}

function isIconComponent(
  icon: NavigationItem["icon"],
): icon is React.ComponentType<{ className?: string }> {
  return typeof icon === "function";
}

function getIconNode(icon: NavigationItem["icon"]) {
  if (!icon) return null;
  if (isIconComponent(icon)) {
    const IconComponent = icon;
    return <IconComponent className="size-4" />;
  }
  return icon;
}

