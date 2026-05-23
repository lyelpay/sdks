"use client";

import { useEffect, type ReactNode } from "react";

export interface OasisModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function OasisModal({
  open,
  onClose,
  title,
  children,
  footer,
  className = "",
}: OasisModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="oasis-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-oasis="modal-overlay"
    >
      <div
        className={`oasis-modal ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
        data-oasis="modal"
      >
        {title != null && <div className="oasis-modal__header">{title}</div>}
        <div className="oasis-modal__body">{children}</div>
        {footer != null && <div className="oasis-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
