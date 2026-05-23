"use client";

import { useId } from "react";
import type { InputHTMLAttributes } from "react";

export interface OasisInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  message?: string;
  className?: string;
  wrapperClassName?: string;
}

export function OasisInput({
  label,
  error,
  message,
  id: idProp,
  className = "",
  wrapperClassName = "",
  ...props
}: OasisInputProps) {
  const generatedId = useId();
  const id = idProp || generatedId;
  const inputClasses = ["oasis-input", error ? "oasis-input--error" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={`oasis-input-wrap ${wrapperClassName}`.trim()} data-oasis="input-wrap">
      {label && (
        <label htmlFor={id} className="oasis-label">
          {label}
        </label>
      )}
      <input id={id} className={inputClasses} aria-invalid={!!error} {...props} />
      {(message || error) && (
        <span className={error ? "oasis-input-msg oasis-input-msg--error" : "oasis-input-msg"}>
          {error || message}
        </span>
      )}
    </div>
  );
}
