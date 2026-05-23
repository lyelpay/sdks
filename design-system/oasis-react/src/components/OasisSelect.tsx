"use client";

import { useId } from "react";
import type { SelectHTMLAttributes } from "react";

export interface OasisSelectOption {
  value: string;
  label: string;
}

export interface OasisSelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> {
  options: OasisSelectOption[];
  label?: string;
  error?: string;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
}

export function OasisSelect({
  options,
  label,
  error,
  placeholder,
  id: idProp,
  className = "",
  wrapperClassName = "",
  ...props
}: OasisSelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const classes = ["oasis-select", error ? "oasis-input--error" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={`oasis-input-wrap ${wrapperClassName}`.trim()} data-oasis="select-wrap">
      {label && (
        <label htmlFor={id} className="oasis-label">
          {label}
        </label>
      )}
      <select id={id} className={classes} aria-invalid={!!error} {...props}>
        {placeholder != null && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="oasis-input-msg oasis-input-msg--error">{error}</span>}
    </div>
  );
}
