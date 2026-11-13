import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface Crumb {
  label: string;
  to?: string;
}

export default function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.to && { item: `${origin}${item.to}` }),
    })),
  };
  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 text-xs text-muted ${className}`}>
      <ol className="flex items-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className={`flex items-center gap-1 ${last ? "min-w-0" : ""}`}>
              {item.to && !last ? (
                <Link to={item.to} className="rounded transition hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring)/0.4)] dark:hover:text-brand-500">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "truncate font-medium text-ink/80" : ""} translate={last ? "no" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </nav>
  );
}
