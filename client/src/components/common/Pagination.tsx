interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Səhifələmə">
      <button className="btn-outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Əvvəlki
      </button>
      <span className="text-sm text-ink/70">
        {page} / {totalPages}
      </span>
      <button className="btn-outline" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Növbəti
      </button>
    </nav>
  );
}
