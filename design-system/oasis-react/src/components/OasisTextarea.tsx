"use client";

import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";

export interface OasisTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  className?: string;
  wrapperClassName?: string;
}

export function OasisTextarea({
  label,
  error,
  id: idProp,
  className = "",
  wrapperClassName = "",
  ...props
}: OasisTextareaProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const classes = ["oasis-textarea", error ? "oasis-input--error" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={`oasis-input-wrap ${wrapperClassName}`.trim()} data-oasis="textarea-wrap">
      {label && (
        <label htmlFor={id} className="oasis-label">
          {label}
        </label>
      )}
      <textarea id={id} className={classes} aria-invalid={!!error} {...props} />
      {error && <span className="oasis-input-msg oasis-input-msg--error">{error}</span>}
    </div>
  );
}
