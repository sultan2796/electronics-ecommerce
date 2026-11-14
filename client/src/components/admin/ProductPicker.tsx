import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { productService } from "../../services/product.service";
import { Product } from "../../types";
import { emptyFilters } from "../../utils/filters";
import { formatPrice } from "../../utils/format";
import ProductImage from "../product/ProductImage";

export interface PickedProduct {
  id: string;
  name: string;
  price: string;
  image?: string;
  stock?: number;
}

export const toPicked = (product: Product): PickedProduct => ({
  id: product.id,
  name: product.name,
  price: String(product.compareAtPrice ?? product.price),
  image: product.images?.[0],
  stock: product.stock,
});

export default function ProductPicker({
  onPick,
  excluded = [],
  placeholder = "Məhsul adı və ya SKU ilə axtar",
}: {
  onPick: (product: PickedProduct) => void;
  excluded?: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ticket = ++request.current;
    setLoading(true);
    const timer = window.setTimeout(() => {
      productService
        .list({ ...emptyFilters, q: term }, 8)
        .then((page) => ticket === request.current && setResults(page.items))
        .catch(() => ticket === request.current && setResults([]))
        .finally(() => ticket === request.current && setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const visible = results.filter((product) => !excluded.includes(product.id));

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" strokeWidth={1.8} aria-hidden="true" />
      <input
        className="input pl-9 pr-9"
        value={query}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
      />
      {query && (
        <button type="button" aria-label="Təmizlə" onClick={() => setQuery("")} className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink">
          <X className="size-4" strokeWidth={1.8} aria-hidden="true" />
        </button>
      )}
      {open && query.trim().length >= 2 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-sm" role="listbox">
          {loading && <li className="px-3 py-2 text-sm text-muted">Axtarılır...</li>}
          {!loading && visible.length === 0 && <li className="px-3 py-2 text-sm text-muted">Məhsul tapılmadı</li>}
          {!loading &&
            visible.map((product) => (
              <li key={product.id} role="option" aria-selected="false">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onPick(toPicked(product));
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-chip"
                >
                  <ProductImage src={product.images?.[0]} category={product.category?.slug} alt="" className="size-9 shrink-0 rounded-md bg-white object-contain" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{product.name}</span>
                    <span className="block text-xs text-muted">
                      {formatPrice(product.compareAtPrice ?? product.price)}
                      {product.stock <= 0 && " · Stokda yoxdur"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
