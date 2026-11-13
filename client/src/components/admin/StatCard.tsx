import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  to?: string;
  tone?: "brand" | "blue" | "green" | "amber" | "red";
}

const tones = {
  brand: "bg-brand-50 dark:bg-brand-500/15 text-brand-600",
  blue: "bg-sky-50 dark:bg-sky-500/15 text-sky-600",
  green: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600",
  amber: "bg-amber-50 dark:bg-amber-500/15 text-amber-600",
  red: "bg-red-50 dark:bg-red-500/15 text-red-600",
};

export default function StatCard({ label, value, hint, to, tone = "brand" }: StatCardProps) {
  const content = (
    <div className="card flex h-full flex-col gap-2 p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgba(15,23,42,0.35)]">
      <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{label}</span>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}
