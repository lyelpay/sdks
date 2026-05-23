"use client";

import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface OasisRadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  className?: string;
}

export function OasisRadio({ label, id: idProp, className = "", ...props }: OasisRadioProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  return (
    <label className={`oasis-radio-wrap ${className}`.trim()} htmlFor={id} data-oasis="radio-wrap">
      <input type="radio" id={id} {...props} />
      {label != null && <span>{label}</span>}
    </label>
  );
}
