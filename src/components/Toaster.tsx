// src/components/Toaster.tsx
import { useCallback, useState, type ReactNode } from "react";
import { ToastContext, type ToastKind, type Toast } from "./toast.ts";

const TIMEOUT_MS = 4500;

let nextId = 0;

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => dismiss(id), TIMEOUT_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-2 px-4 pb-5"
        role="region"
        aria-label="Уведомления"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`toaster__item toaster__item--${t.kind}`}
          >
            <span className="toaster__text">{t.message}</span>
            <button
              type="button"
              className="toaster__close"
              aria-label="Закрыть уведомление"
              onClick={() => dismiss(t.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
