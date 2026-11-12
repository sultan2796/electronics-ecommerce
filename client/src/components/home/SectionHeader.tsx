import { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function SectionHeader({ title, hint, to, linkLabel, children }: { title: string; hint?: string; to?: string; linkLabel?: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {children}
      {to && (
        <Link to={to} className="group flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-700">
          {linkLabel}
          <span className="transition group-hover:translate-x-0.5">→</span>
        </Link>
      )}
    </div>
  );
}
