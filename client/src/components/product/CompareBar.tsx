import { Link, useLocation } from "react-router-dom";
import { MAX_COMPARE, useCompare } from "../../context/CompareContext";

export default function CompareBar() {
  const { items, remove, clear } = useCompare();
  const { pathname } = useLocation();

  if (!items.length || pathname === "/compare" || pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed inset-x-0 bottom-[66px] z-40 border-t border-chip bg-surface shadow-lg md:bottom-0">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <span className="text-sm font-medium text-ink/70">
          Müqayisə ({items.length}/{MAX_COMPARE})
        </span>
        <div className="flex flex-1 flex-wrap gap-2">
          {items.map((item) => (
            <span key={item.id} className="chip flex items-center gap-2 border-line bg-chip text-ink/70">
              {item.name}
              <button onClick={() => remove(item.id)} aria-label={`${item.name} sil`} className="text-muted hover:text-red-600">
                ×
              </button>
            </span>
          ))}
        </div>
        <button className="btn-outline" onClick={clear}>
          Təmizlə
        </button>
        <Link to="/compare" className={`btn-primary ${items.length < 2 ? "pointer-events-none opacity-50" : ""}`}>
          Müqayisə et
        </Link>
      </div>
    </div>
  );
}
