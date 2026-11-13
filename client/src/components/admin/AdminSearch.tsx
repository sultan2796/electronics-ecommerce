import { Search } from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSearchResult, adminService } from "../../services/admin.service";
import { formatPrice, orderStatusLabels } from "../../utils/format";

interface Hit {
  key: string;
  group: string;
  title: string;
  meta: string;
  to: string;
}

const toHits = (result: AdminSearchResult): Hit[] => [
  ...result.orders.map((order) => ({
    key: `o-${order.id}`,
    group: "Sifarişlər",
    title: order.orderNumber ?? order.id.slice(-8),
    meta: `${order.user?.name ?? order.guestName ?? "Qonaq"} · ${orderStatusLabels[order.status]} · ${formatPrice(order.total)}`,
    to: `/admin/orders?q=${encodeURIComponent(order.orderNumber ?? order.id)}`,
  })),
  ...result.products.map((product) => ({
    key: `p-${product.id}`,
    group: "Məhsullar",
    title: product.name,
    meta: `${product.sku} · stok ${product.stock}${product.isActive ? "" : " · deaktiv"}`,
    to: `/admin/products/${product.id}`,
  })),
  ...result.users.map((user) => ({
    key: `u-${user.id}`,
    group: "Müştərilər",
    title: user.name,
    meta: user.email,
    to: `/admin/users?q=${encodeURIComponent(user.email)}`,
  })),
];

export default function AdminSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      adminService
        .search(term, controller.signal)
        .then((result) => {
          setHits(toHits(result));
          setActive(0);
        })
        .catch(() => {
          if (!controller.signal.aborted) setHits([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const go = (hit: Hit) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    navigate(hit.to);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!hits?.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => (value + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => (value - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(hits[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative hidden w-full max-w-sm md:block">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" strokeWidth={1.8} aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Sifariş, məhsul, müştəri axtar"
        aria-label="Admin axtarışı"
        aria-expanded={showPanel}
        aria-controls="admin-search-results"
        role="combobox"
        aria-autocomplete="list"
        className="h-10 w-full rounded-full border border-line bg-canvas pl-10 pr-14 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:bg-surface"
      />
      {!query && <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-line px-1.5 text-[10px] text-muted">⌘K</kbd>}
      {showPanel && (
        <div id="admin-search-results" role="listbox" className="animate-pop absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
          {loading && !hits ? (
            <p className="px-3 py-3 text-sm text-muted">Axtarılır...</p>
          ) : hits?.length ? (
            hits.map((hit, index) => (
              <div key={hit.key}>
                {(index === 0 || hits[index - 1].group !== hit.group) && (
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{hit.group}</p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(hit)}
                  className={`block w-full rounded-xl px-3 py-2 text-left transition ${index === active ? "bg-chip" : ""}`}
                >
                  <span className="block truncate text-sm font-medium">{hit.title}</span>
                  <span className="block truncate text-xs text-muted">{hit.meta}</span>
                </button>
              </div>
            ))
          ) : (
            <p className="px-3 py-3 text-sm text-muted">Heç nə tapılmadı</p>
          )}
        </div>
      )}
    </div>
  );
}
