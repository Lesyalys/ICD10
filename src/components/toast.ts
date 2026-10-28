// src/components/toast.ts
// Контекст и хук уведомлений вынесены отдельно от компонента Toaster,
// чтобы файл компонента экспортировал только компоненты (требование
// react-refresh/only-export-components).

import { createContext, useContext } from "react";

export type ToastKind = "error" | "success" | "info";

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

export type ToastContextValue = {
  notify: (message: string, kind?: ToastKind) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Хук доступа к уведомлениям. Обязателен <Toaster> выше по дереву. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <Toaster>");
  }
  return ctx;
}
