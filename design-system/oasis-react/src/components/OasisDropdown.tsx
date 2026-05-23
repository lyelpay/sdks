"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

export interface OasisDropdownItemProps {
  label: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export interface OasisDropdownProps {
  trigger: ReactNode;
  items: OasisDropdownItemProps[];
  align?: "left" | "right";
  className?: string;
}

export function OasisDropdown({
  trigger,
  items,
  align = "left",
  className = "",
}: OasisDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={`oasis-dropdown ${className}`.trim()} ref={ref} data-oasis="dropdown">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className="oasis-dropdown__menu" style={{ [align]: 0 }} role="menu">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              className={`oasis-dropdown__item ${item.danger ? "oasis-dropdown__item--danger" : ""}`.trim()}
              role="menuitem"
              onClick={() => {
                item.onClick?.();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
