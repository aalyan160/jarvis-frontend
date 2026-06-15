"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => removeToast(id), 3000);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const Icon = isSuccess ? CheckCircle2 : XCircle;

          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold shadow-glow backdrop-blur ${
                isSuccess
                  ? "border-jarvis-success/25 bg-jarvis-success/15 text-jarvis-success"
                  : "border-jarvis-error/25 bg-jarvis-error/15 text-jarvis-error"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
