"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

export interface OasisPopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}

export function OasisPopover({ trigger, children, className = "" }: OasisPopoverProps) {
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
    <div className={`oasis-popover ${className}`.trim()} ref={ref} data-oasis="popover">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && <div className="oasis-popover__content">{children}</div>}
    </div>
  );
}
