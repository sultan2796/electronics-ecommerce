import { toast } from "../common/Overlays";
import { MouseEvent, useState } from "react";
import { useTilt } from "../../hooks/useMotion";
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
import { openQuickView } from "./QuickView";

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
  const [heartPulse, setHeartPulse] = useState(0);
  const [cartPulse, setCartPulse] = useState(0);
  const tilt = useTilt<HTMLElement>(5);
  const secondImage = product.images.find((image, position) => position > 0 && image && image !== product.images[0]);
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
      setCartPulse((value) => value + 1);
      flash(t("card.added"));
      toast(`${product.name} səbətə əlavə edildi`);
    } catch (error) {
      flash(getErrorMessage(error));
    }
  };

  const openPreview = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    if (openQuickView(product)) event.preventDefault();
  };

  const toggleWishlist = async () => {
    if (!requireUser()) return;
    try {
      await wishlist.toggle(product.id);
      if (!liked) setHeartPulse((value) => value + 1);
      toast(liked ? "İstək siyahısından çıxarıldı" : "İstək siyahısına əlavə edildi", liked ? "info" : "success");
    } catch (error) {
      flash(getErrorMessage(error));
    }
  };

  return (
    <article
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="tilt group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface hover:border-transparent hover:shadow-[0_22px_48px_-20px_rgba(15,23,42,0.35)]"
    >
      <span className="tilt-glare" aria-hidden="true" />
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
          <span key={heartPulse} className={heartPulse ? "heart-pop" : ""}>
            <Icon d={HEART} className={`size-4 ${liked ? "fill-current" : ""}`} />
          </span>
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

      <Link
        to={`/products/${product.slug}`}
        onClick={openPreview}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#f6f7f9] p-6 dark:bg-white"
      >
        <ProductImage
          src={product.images[0]}
          category={product.category?.slug}
          alt={product.name}
          className={`depth-1 size-full object-contain transition duration-500 ease-out group-hover:scale-[1.06] ${secondImage ? "group-hover:opacity-0" : ""} ${soldOut ? "opacity-50 grayscale" : ""}`}
        />
        {secondImage && (
          <img
            src={secondImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 m-auto size-full scale-95 object-contain p-6 opacity-0 transition duration-500 ease-out group-hover:scale-100 group-hover:opacity-100 ${soldOut ? "grayscale" : ""}`}
          />
        )}
        {soldOut ? (
          <span className="absolute bottom-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] font-medium text-surface">{t("card.soldOut")}</span>
        ) : (
          <span className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 translate-y-2 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink/85 px-3.5 py-1.5 text-[11px] font-semibold text-surface opacity-0 shadow-lg backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex">
            <Icon d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" className="size-3.5" />
            {t("card.quickView")}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 sm:p-4">
        <p lang="en" className="truncate text-[11px] font-medium uppercase tracking-wide text-muted">{product.brand}</p>
        <Link to={`/products/${product.slug}`} onClick={openPreview} translate="no" className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-ink transition hover:text-brand-600">
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
          {!soldOut &&
            (product.stock <= 5 ? (
              <span className="ml-auto text-[11px] font-medium text-amber-600">{t("card.lowStock", { count: product.stock })}</span>
            ) : (
              <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {t("card.inStock")}
              </span>
            ))}
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
          className={`mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition hover:bg-brand-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-chip disabled:text-muted ${
            cartPulse && message ? "cart-bump bg-emerald-600 text-white" : "bg-ink text-surface"
          }`}
        >
          {message ?? (soldOut ? t("card.soldOut") : t("card.addToCart"))}
        </button>
      </div>
    </article>
  );
}
