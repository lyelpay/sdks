"use client";

import type { ReactNode } from "react";

export interface OasisSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function OasisSwitch({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className = "",
}: OasisSwitchProps) {
  return (
    <label
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--oasis-spacing-2)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      data-oasis="switch-wrap"
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className="oasis-switch"
        data-state={checked ? "checked" : "unchecked"}
        onClick={() => onCheckedChange(!checked)}
      >
        <span className="oasis-switch__thumb" />
      </button>
      {label != null && <span style={{ fontSize: "var(--oasis-text-sm)" }}>{label}</span>}
    </label>
  );
}
