import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useCompare } from "../../context/CompareContext";
import { useWishlist } from "../../context/WishlistContext";
import { useI18n } from "../../context/I18nContext";
import { getErrorMessage } from "../../services/api";
import { Product } from "../../types";
import { formatPrice, monthlyPayment, pricing } from "../../utils/format";
import { productRating } from "../../utils/rating";
import ProductImage from "./ProductImage";

const Icon = ({ d, className = "size-4" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const HEART = "M12 20s-7-4.4-9.2-8.6C1.1 8.1 3 4.5 6.6 4.5c2 0 3.3 1.1 4.1 2.3h.6c.8-1.2 2.1-2.3 4.1-2.3 3.6 0 5.5 3.6 3.8 6.9C19 15.6 12 20 12 20z";
const SCALE = "M12 3v18M5 7h14M5 7l-3 7a4 4 0 0 0 6 0zm14 0-3 7a4 4 0 0 0 6 0z";

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addItem, busy } = useCart();
  const compare = useCompare();
  const wishlist = useWishlist();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const inCompare = compare.has(product.id);
  const liked = wishlist.has(product.id);
  const soldOut = product.stock === 0;
  const rating = productRating(product);
  const price = pricing(product);

  const flash = (text: string | null) => {
    if (!text) return;
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2200);
  };

  const requireUser = () => {
    if (!user) navigate("/login", { state: { from: `/products/${product.slug}` } });
    return Boolean(user);
  };

  const addToCart = async () => {
    if (!requireUser()) return;
    try {
      await addItem(product.id);
      flash(t("card.added"));
    } catch (error) {
      flash(getErrorMessage(error));
    }
  };

  const toggleWishlist = async () => {
    if (!requireUser()) return;
    try {
      await wishlist.toggle(product.id);
    } catch (error) {
      flash(getErrorMessage(error));
    }
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.28)]">
      <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
        {price.percent > 0 && (
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold text-white ${price.live ? "bg-red-600" : "bg-brand-600"}`}>−{price.percent}%</span>
        )}
        {product.campaign && <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-medium text-surface">{product.campaign.name}</span>}
      </div>
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <button
          type="button"
          onClick={toggleWishlist}
          aria-pressed={liked}
          aria-label={t("card.wishlist")}
          className={`flex size-8 items-center justify-center rounded-full bg-surface shadow-sm ring-1 ring-line transition hover:text-red-500 ${liked ? "text-red-500 sm:opacity-100" : "text-muted"}`}
        >
          <Icon d={HEART} className={`size-4 ${liked ? "fill-current" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => flash(compare.toggle(product))}
          aria-pressed={inCompare}
          aria-label={t("card.compare")}
          className={`flex size-8 items-center justify-center rounded-full bg-surface shadow-sm ring-1 ring-line transition hover:text-brand-600 ${inCompare ? "text-brand-600" : "text-muted"}`}
        >
          <Icon d={SCALE} />
        </button>
      </div>

      <Link to={`/products/${product.slug}`} className="relative flex aspect-square items-center justify-center bg-[#f6f7f9] p-6 dark:bg-white">
        <ProductImage
          src={product.images[0]}
          category={product.category?.slug}
          alt={product.name}
          className={`size-full object-contain transition duration-500 group-hover:scale-105 ${soldOut ? "opacity-50 grayscale" : ""}`}
        />
        {soldOut && <span className="absolute bottom-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] font-medium text-surface">{t("card.soldOut")}</span>}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted">{product.brand}</p>
        <Link to={`/products/${product.slug}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-ink transition hover:text-brand-600">
          {product.name}
        </Link>
        <div className="flex h-4 items-center gap-1 text-xs text-muted">
          {rating && (
            <>
              <svg viewBox="0 0 24 24" className="size-3.5 fill-amber-400" aria-hidden="true">
                <path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.53L12 17.5l-5.87 3.07 1.12-6.53L2.5 9.41l6.56-.95z" />
              </svg>
              <span className="font-medium text-ink">{rating.value.toFixed(1)}</span>
              {rating.fromReviews && <span>({rating.count})</span>}
            </>
          )}
          {!soldOut && product.stock <= 5 && <span className="ml-auto text-[11px] font-medium text-amber-600">{t("card.lowStock", { count: product.stock })}</span>}
        </div>

        <div className="mt-auto pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className={`text-lg font-bold ${price.percent > 0 ? "text-red-600" : "text-ink"}`}>{formatPrice(price.price)}</span>
            {price.was && <span className="text-xs text-muted line-through">{formatPrice(price.was.toFixed(2))}</span>}
          </div>
          {price.price >= 100 && (
            <p className="text-[11px] text-muted">{t("card.monthly", { amount: formatPrice(monthlyPayment(price.price)) })}</p>
          )}
        </div>

        <button
          type="button"
          onClick={addToCart}
          disabled={busy || soldOut}
          className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-surface transition hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:bg-chip disabled:text-muted"
        >
          {message ?? (soldOut ? t("card.soldOut") : t("card.addToCart"))}
        </button>
      </div>
    </article>
  );
}
