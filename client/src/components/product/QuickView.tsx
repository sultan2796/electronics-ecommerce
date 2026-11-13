import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useI18n } from "../../context/I18nContext";
import { useWishlist } from "../../context/WishlistContext";
import { getErrorMessage } from "../../services/api";
import { productService } from "../../services/product.service";
import { Product } from "../../types";
import { formatPrice, monthlyPayment, pricing } from "../../utils/format";
import { productSpecGroups } from "../../utils/productSpecs";
import { productRating } from "../../utils/rating";
import { toast } from "../common/Overlays";
import StarRating from "./StarRating";
import ProductViewer from "./ProductViewer";

let openHandler: ((product: Product) => void) | null = null;

export const openQuickView = (product: Product) => {
  if (openHandler) openHandler(product);
  return Boolean(openHandler);
};

export default function QuickView() {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const { addItem, busy } = useCart();
  const wishlist = useWishlist();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    openHandler = (next) => {
      lastFocus.current = document.activeElement as HTMLElement | null;
      setQuantity(1);
      setProduct(next);
      productService
        .get(next.slug)
        .then((full) => setProduct((current) => (current?.id === full.id ? full : current)))
        .catch(() => undefined);
    };
    return () => {
      openHandler = null;
    };
  }, []);

  useEffect(() => {
    setProduct(null);
  }, [pathname]);

  useEffect(() => {
    if (!product) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProduct(null);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      lastFocus.current?.focus?.();
    };
  }, [product?.id]);

  if (!product) return null;

  const price = pricing(product);
  const rating = productRating(product);
  const soldOut = product.stock === 0;
  const liked = wishlist.has(product.id);
  const groups = productSpecGroups(product, locale);

  const requireUser = () => {
    if (user) return true;
    setProduct(null);
    navigate("/login", { state: { from: `/products/${product.slug}` } });
    return false;
  };

  const addToCart = async () => {
    if (!requireUser()) return;
    try {
      await addItem(product.id, quantity);
      toast(`${product.name} səbətə əlavə edildi`);
    } catch (error) {
      toast(getErrorMessage(error), "error");
    }
  };

  const toggleWishlist = async () => {
    if (!requireUser()) return;
    try {
      await wishlist.toggle(product.id);
      toast(liked ? "İstək siyahısından çıxarıldı" : "İstək siyahısına əlavə edildi", liked ? "info" : "success");
    } catch (error) {
      toast(getErrorMessage(error), "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm animate-page sm:items-center sm:p-6" onMouseDown={() => setProduct(null)}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl outline-none sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={() => setProduct(null)}
          aria-label="Bağla"
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-chip text-ink/70 transition hover:bg-ink hover:text-surface"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="grid flex-1 overflow-y-auto lg:grid-cols-[1.05fr_1fr]">
          <div className="border-b border-line p-5 lg:border-b-0 lg:border-r lg:p-7">
            <ProductViewer images={product.images} alt={product.name} category={product.category?.slug} model3d={product.model3dActive === false ? null : (product.model3dUrl ?? product.specs?.extra?.model3d)}
            modelCredit={[product.model3dSource, product.model3dLicense].filter(Boolean).join(" · ") || null} />
          </div>

          <div className="space-y-6 p-5 lg:p-7">
            <div className="space-y-2 pr-12">
              <p className="text-xs font-medium text-muted">
                <span lang="en" className="uppercase tracking-wide">
                  {product.brand}
                </span>
                {product.category && ` · ${product.category.name}`}
              </p>
              <h2 id="quick-view-title" translate="no" className="text-2xl font-bold leading-tight text-ink">
                {product.name}
              </h2>
              {rating && (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <StarRating value={rating.value} size="sm" />
                  <span className="font-medium text-ink">{rating.value.toFixed(1)}</span>
                  {rating.fromReviews && <span>({rating.count})</span>}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-chip/60 p-4">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className={`text-3xl font-bold ${price.percent > 0 ? "text-red-600" : "text-ink"}`}>{formatPrice(price.price)}</span>
                {price.was && <span className="pb-1 text-sm text-muted line-through">{formatPrice(price.was.toFixed(2))}</span>}
                {price.percent > 0 && <span className="mb-1 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">−{price.percent}%</span>}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted">Qiymət</dt>
                  <dd className="font-semibold text-ink">{formatPrice(price.was ?? price.price)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Endirimli qiymət</dt>
                  <dd className={`font-semibold ${price.was ? "text-red-600" : "text-muted"}`}>{price.was ? formatPrice(price.price) : "—"}</dd>
                </div>
              </dl>
              {price.price >= 100 && (
                <p className="mt-3 text-xs text-muted">
                  Hissə-hissə ödəniş: <strong className="text-ink">{formatPrice(monthlyPayment(price.price))}</strong> × 12 ay
                </p>
              )}
              <p className={`mt-2 text-xs font-medium ${soldOut ? "text-red-600" : product.stock <= 5 ? "text-amber-600" : "text-emerald-600"}`}>
                {soldOut ? "Stokda yoxdur" : `Stokda ${product.stock} ədəd var`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!soldOut && (
                <div className="flex h-12 items-center rounded-xl border border-line">
                  <button type="button" aria-label="Azalt" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-full px-3 text-lg text-ink/70 hover:text-ink">
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Artır"
                    onClick={() => setQuantity((value) => Math.min(product.stock, 20, value + 1))}
                    className="h-full px-3 text-lg text-ink/70 hover:text-ink"
                  >
                    +
                  </button>
                </div>
              )}
              <button type="button" onClick={addToCart} disabled={busy || soldOut} className="btn-primary h-12 flex-1 text-base">
                {soldOut ? "Stokda yoxdur" : "Səbətə at"}
              </button>
              <button
                type="button"
                onClick={toggleWishlist}
                aria-pressed={liked}
                aria-label="İstək siyahısı"
                className={`flex size-12 items-center justify-center rounded-xl border transition ${liked ? "border-red-200 bg-red-50 text-red-500 dark:border-red-500/30 dark:bg-red-500/10" : "border-line text-ink/70 hover:text-red-500"}`}
              >
                <svg viewBox="0 0 24 24" className={`size-5 ${liked ? "fill-current" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 20s-7-4.4-9.2-8.6C1.1 8.1 3 4.5 6.6 4.5c2 0 3.3 1.1 4.1 2.3h.6c.8-1.2 2.1-2.3 4.1-2.3 3.6 0 5.5 3.6 3.8 6.9C19 15.6 12 20 12 20z" />
                </svg>
              </button>
            </div>
            <Link to={`/products/${product.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
              Tam səhifəyə keç →
            </Link>

            <section className="space-y-4">
              <h3 className="text-base font-bold text-ink">Məhsul xüsusiyyətləri</h3>
              {groups.map((group) => (
                <div key={group.title}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{group.title}</p>
                  <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line text-sm">
                    {group.rows.map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 px-3.5 py-2.5">
                        <dt className="text-muted">{label}</dt>
                        <dd className="font-medium text-ink" translate={label === "SKU" ? "no" : undefined}>
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </section>

            {product.description && (
              <section>
                <h3 className="mb-2 text-base font-bold text-ink">Ətraflı açıqlama</h3>
                <p translate="no" className="whitespace-pre-line text-sm leading-relaxed text-ink/80">
                  {product.description}
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
