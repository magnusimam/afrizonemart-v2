'use client';

import { create } from 'zustand';
import { useEffect } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastEntry {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastState {
  toasts: ToastEntry[];
  push: (variant: ToastVariant, message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (variant, message) =>
    set((s) => ({ toasts: [...s.toasts, { id: ++nextId, variant, message }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, variant: ToastVariant = 'success'): void {
  useToastStore.getState().push(variant, message);
}

const VARIANT_STYLE: Record<ToastVariant, { wrap: string; icon: React.ReactNode }> = {
  success: {
    wrap: 'border-success/30 bg-success/10 text-charcoal',
    icon: <CheckCircle2 size={18} className="text-success" aria-hidden />,
  },
  error: {
    wrap: 'border-danger/30 bg-danger/10 text-charcoal',
    icon: <XCircle size={18} className="text-danger" aria-hidden />,
  },
  info: {
    wrap: 'border-border bg-white text-charcoal',
    icon: null,
  },
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), 4000),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-2"
    >
      {toasts.map((t) => {
        const v = VARIANT_STYLE[t.variant];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-card border p-3 shadow-card ${v.wrap}`}
          >
            {v.icon}
            <span className="flex-1 font-sans text-sm leading-snug">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="rounded p-0.5 text-muted hover:text-charcoal"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
