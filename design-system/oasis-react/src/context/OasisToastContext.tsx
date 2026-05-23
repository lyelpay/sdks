"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { OasisToast } from "../components/OasisToast";
import type { OasisToastVariant } from "../components/OasisToast";

interface ToastItem {
  id: string;
  message: ReactNode;
  variant?: OasisToastVariant;
}

type ShowToast = (message: ReactNode, variant?: OasisToastVariant) => void;

const OasisToastContext = createContext<ShowToast | null>(null);

export function useOasisToast(): ShowToast {
  const ctx = useContext(OasisToastContext);
  if (!ctx) throw new Error("useOasisToast must be used within OasisToastProvider");
  return ctx;
}

export function OasisToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: ReactNode, variant?: OasisToastVariant) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <OasisToastContext.Provider value={show}>
      {children}
      <div className="oasis-toast-container">
        {toasts.map((t) => (
          <OasisToast
            key={t.id}
            message={t.message}
            variant={t.variant}
            onClose={() => remove(t.id)}
          />
        ))}
      </div>
    </OasisToastContext.Provider>
  );
}
