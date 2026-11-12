import { useEffect, useRef, useState } from "react";

type Tone = "default" | "danger";

interface ConfirmRequest {
  id: number;
  title: string;
  description?: string;
  confirmLabel: string;
  tone: Tone;
  resolve: (value: boolean) => void;
}

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

let pushConfirm: ((request: ConfirmRequest) => void) | null = null;
let pushToast: ((toast: ToastItem) => void) | null = null;
let counter = 0;

export const confirmDialog = (title: string, options: { description?: string; confirmLabel?: string; tone?: Tone } = {}) =>
  new Promise<boolean>((resolve) => {
    if (!pushConfirm) return resolve(window.confirm(title));
    pushConfirm({ id: ++counter, title, description: options.description, confirmLabel: options.confirmLabel ?? "Təsdiqlə", tone: options.tone ?? "danger", resolve });
  });

export const toast = (message: string, tone: ToastTone = "success") => pushToast?.({ id: ++counter, message, tone });

const toneStyles: Record<ToastTone, { ring: string; icon: string; path: string }> = {
  success: { ring: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15", icon: "", path: "m5 10.5 3.5 3.5L15 7" },
  error: { ring: "text-red-600 bg-red-50 dark:bg-red-500/15", icon: "", path: "M10 6v5M10 14h.01" },
  info: { ring: "text-sky-600 bg-sky-50 dark:bg-sky-500/15", icon: "", path: "M10 9v5M10 6h.01" },
};

export default function Overlays() {
  const [dialog, setDialog] = useState<ConfirmRequest | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    pushConfirm = setDialog;
    pushToast = (item) => {
      setToasts((current) => [...current.slice(-3), item]);
      window.setTimeout(() => setToasts((current) => current.filter((toastItem) => toastItem.id !== item.id)), 3200);
    };
    return () => {
      pushConfirm = null;
      pushToast = null;
    };
  }, []);

  useEffect(() => {
    if (!dialog) return;
    confirmRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const close = (result: boolean) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  return (
    <>
      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-page sm:items-center" onMouseDown={() => close(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`dialog-${dialog.id}`}
            className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className={`flex size-11 items-center justify-center rounded-full ${dialog.tone === "danger" ? "bg-red-50 text-red-600 dark:bg-red-500/15" : "bg-brand-50 text-brand-600 dark:bg-brand-500/15"}`}>
              <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d={dialog.tone === "danger" ? "M10 6.5v4.5M10 14h.01M8.6 2.9 1.9 14.5A1.6 1.6 0 0 0 3.3 17h13.4a1.6 1.6 0 0 0 1.4-2.5L11.4 2.9a1.6 1.6 0 0 0-2.8 0z" : "M10 9v5M10 6h.01"} />
              </svg>
            </span>
            <h2 id={`dialog-${dialog.id}`} className="mt-4 text-lg font-semibold text-ink">
              {dialog.title}
            </h2>
            {dialog.description && <p className="mt-1.5 text-sm text-muted">{dialog.description}</p>}
            <div className="mt-6 flex gap-2">
              <button type="button" className="btn-outline flex-1" onClick={() => close(false)}>
                Ləğv et
              </button>
              <button
                ref={confirmRef}
                type="button"
                className={`flex-1 ${dialog.tone === "danger" ? "btn bg-red-600 text-white hover:bg-red-700" : "btn-primary"}`}
                onClick={() => close(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-xl animate-page">
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${toneStyles[item.tone].ring}`}>
              <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={toneStyles[item.tone].path} />
              </svg>
            </span>
            {item.message}
          </div>
        ))}
      </div>
    </>
  );
}
