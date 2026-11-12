import { ReactNode } from "react";

const variants = {
  error: "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300",
  success: "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  info: "border-brand-100 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-500",
};

export default function Alert({ variant = "error", children }: { variant?: keyof typeof variants; children: ReactNode }) {
  return <div className={`rounded-lg border px-4 py-3 text-sm ${variants[variant]}`}>{children}</div>;
}
