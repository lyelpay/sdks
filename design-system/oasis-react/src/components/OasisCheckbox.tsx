"use client";

import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface OasisCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  className?: string;
}

export function OasisCheckbox({ label, id: idProp, className = "", ...props }: OasisCheckboxProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <label
      className={`oasis-checkbox-wrap ${className}`.trim()}
      htmlFor={id}
      data-oasis="checkbox-wrap"
    >
      <input type="checkbox" id={id} {...props} />
      {label != null && <span>{label}</span>}
    </label>
  );
}
