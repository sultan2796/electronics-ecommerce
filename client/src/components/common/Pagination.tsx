interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const pagesToShow = (page: number, total: number): (number | "gap")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const set = new Set([1, total, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((value) => set.add(value));
  if (page >= total - 2) [total - 3, total - 2, total - 1].forEach((value) => set.add(value));
  const sorted = [...set].filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
  return sorted.flatMap((value, index) => (index > 0 && value - sorted[index - 1] > 1 ? ["gap" as const, value] : [value]));
};

const Arrow = ({ flip }: { flip?: boolean }) => (
  <svg viewBox="0 0 20 20" className={`size-4 ${flip ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m12.5 15-5-5 5-5" />
  </svg>
);

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const go = (next: number) => {
    onChange(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const base = "flex size-10 items-center justify-center rounded-xl text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Səhifələmə">
      <button type="button" className={`${base} border border-line bg-surface hover:border-ink/30`} disabled={page <= 1} onClick={() => go(page - 1)} aria-label="Əvvəlki səhifə">
        <Arrow />
      </button>
      {pagesToShow(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => go(item)}
            aria-current={item === page ? "page" : undefined}
            className={`${base} ${item === page ? "bg-ink text-surface" : "text-ink/70 hover:bg-chip hover:text-ink"}`}
          >
            {item}
          </button>
        ),
      )}
      <button type="button" className={`${base} border border-line bg-surface hover:border-ink/30`} disabled={page >= totalPages} onClick={() => go(page + 1)} aria-label="Növbəti səhifə">
        <Arrow flip />
      </button>
    </nav>
  );
}
