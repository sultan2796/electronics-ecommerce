import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";
import { productService } from "../../services/product.service";
import { Product } from "../../types";
import { emptyFilters } from "../../utils/filters";
import { formatPrice } from "../../utils/format";
import FigmaIcon from "../common/FigmaIcon";
import ProductImage from "../product/ProductImage";

export default function SearchBox({ className = "" }: { className?: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(query.trim(), 250);
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      return;
    }
    let alive = true;
    productService
      .list({ ...emptyFilters, q: debounced }, 6)
      .then((page) => alive && setResults(page.items))
      .catch(() => alive && setResults([]));
    return () => {
      alive = false;
    };
  }, [debounced]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    setActive(-1);
    navigate(path);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (active >= 0 && results[active]) return go(`/products/${results[active].slug}`);
    go(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : "/products");
  };

  const showPanel = open && debounced.length >= 2;

  return (
    <form ref={boxRef} onSubmit={submit} role="search" className={`relative ${className}`}>
      <FigmaIcon name="search" className="pointer-events-none absolute left-[14px] top-1/2 size-4 -translate-y-1/2 dark:invert" />
      <input
        className="h-10 w-full rounded-full border border-line bg-canvas pl-[45px] pr-4 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
        type="search"
        placeholder="Məhsul, brend və ya model axtar"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") setActive((value) => Math.min(value + 1, results.length - 1));
          if (event.key === "ArrowUp") setActive((value) => Math.max(value - 1, -1));
          if (event.key === "Escape") setOpen(false);
        }}
      />
      {showPanel && (
        <div className="absolute inset-x-0 top-12 z-40 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl" role="listbox">
          {results.length === 0 ? (
            <p className="px-4 py-5 text-center text-sm text-muted">“{debounced}” üzrə nəticə yoxdur</p>
          ) : (
            <>
              {results.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(`/products/${product.slug}`)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${index === active ? "bg-chip" : ""}`}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-chip">
                    <ProductImage src={product.images[0]} category={product.category?.slug} alt={product.name} className="size-full object-contain" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{product.name}</span>
                    <span className="block truncate text-xs text-muted">{product.category?.name ?? product.brand}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-brand-600">{formatPrice(product.price)}</span>
                </button>
              ))}
              <button type="submit" className="w-full border-t border-line px-4 py-2.5 text-center text-xs font-medium text-brand-600 hover:bg-chip">
                Bütün nəticələrə bax →
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}
