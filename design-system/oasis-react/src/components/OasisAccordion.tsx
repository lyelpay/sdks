"use client";

import { useState, type ReactNode } from "react";

export interface OasisAccordionItemProps {
  value: string;
  trigger: ReactNode;
  children: ReactNode;
}

export interface OasisAccordionProps {
  items: OasisAccordionItemProps[];
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  className?: string;
}

export function OasisAccordion({
  items,
  type = "single",
  defaultValue,
  className = "",
}: OasisAccordionProps) {
  const [open, setOpen] = useState<string[]>(() => {
    if (defaultValue === undefined) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const toggle = (value: string) => {
    setOpen((prev) =>
      type === "single"
        ? prev.includes(value)
          ? []
          : [value]
        : prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
    );
  };

  return (
    <div className={`oasis-accordion ${className}`.trim()} data-oasis="accordion">
      {items.map((item) => {
        const isOpen = open.includes(item.value);
        return (
          <div key={item.value} className="oasis-accordion__item">
            <button
              type="button"
              className="oasis-accordion__trigger"
              data-state={isOpen ? "open" : "closed"}
              onClick={() => toggle(item.value)}
              aria-expanded={isOpen}
            >
              {item.trigger}
              <span aria-hidden>{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && <div className="oasis-accordion__content">{item.children}</div>}
          </div>
        );
      })}
    </div>
  );
}
