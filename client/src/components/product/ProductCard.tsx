import { toast } from "../common/Overlays";
import { Eye, Heart, Scale } from "lucide-react";
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
import { openQuickView } from "./QuickView";


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
    if (product.variants?.length) {
      navigate(`/products/${product.slug}`);
      return;
    }
    try {
      await addItem(product.id);
      setCartPulse((value) => value + 1);
      flash(t("card.added"));
      toast(`${product.name} səbətə əlavə edildi`);
    } catch (error) {
      flash(getErrorMessage(error));
    }
  };

  const openPreview = () => {
    if (!openQuickView(product)) navigate(`/products/${product.slug}`);
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

  const iconButton =
    "flex size-8 items-center justify-center rounded-full border border-line/70 bg-surface/85 backdrop-blur-sm transition duration-200 ease-out hover:border-ink/20 hover:text-ink active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]";

  return (
    <article className="product-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="relative">
        <Link
          to={`/products/${product.slug}`}
          className="product-card-media relative isolate flex aspect-square items-center justify-center overflow-hidden bg-[#f4f4f6] p-[10%] dark:bg-[#ececee]"
          aria-label={product.name}
        >
          <ProductImage
            src={product.images[0]}
            category={product.category?.slug}
            alt={product.name}
            blend
            className={`product-card-img size-full object-contain ${secondImage ? "group-hover:opacity-0" : ""} ${soldOut ? "opacity-50 grayscale" : ""}`}
          />
          {secondImage && (
            <img
              src={secondImage}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className={`product-card-alt absolute inset-0 m-auto size-full object-contain p-[10%] mix-blend-multiply opacity-0 group-hover:opacity-100 ${soldOut ? "grayscale" : ""}`}
            />
          )}
          {soldOut && (
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/80 px-3 py-1 text-[11px] font-medium text-surface">{t("card.soldOut")}</span>
          )}
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {price.percent > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${price.live ? "bg-red-600" : "bg-brand-600"}`}>−{price.percent}%</span>
          )}
          {product.campaign && <span className="max-w-[9rem] truncate rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-medium text-surface">{product.campaign.name}</span>}
        </div>
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={toggleWishlist}
            aria-pressed={liked}
            aria-label={t("card.wishlist")}
            className={`${iconButton} ${liked ? "text-red-500" : "text-muted"}`}
          >
            <span key={heartPulse} className={heartPulse ? "heart-pop" : ""}>
              <Heart className={`size-4 ${liked ? "fill-current" : ""}`} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => flash(compare.toggle(product))}
            aria-pressed={inCompare}
            aria-label={t("card.compare")}
            className={`${iconButton} product-card-reveal ${inCompare ? "text-brand-600 opacity-100" : "text-muted"}`}
          >
            <Scale className="size-4" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p lang="en" className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{product.brand}</p>
        <Link to={`/products/${product.slug}`} translate="no" className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-ink transition-colors duration-200 hover:text-brand-600">
          {product.name}
        </Link>
        <div className="mt-1.5 flex h-4 items-center gap-1 text-xs text-muted">
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
              <span className="ml-auto truncate text-[11px] font-medium text-amber-600">{t("card.lowStock", { count: product.stock })}</span>
            ) : (
              <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {t("card.inStock")}
              </span>
            ))}
        </div>

        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className={`text-base font-bold tracking-tight sm:text-lg ${price.percent > 0 ? "text-red-600" : "text-ink"}`}>{formatPrice(price.price)}</span>
            {price.was && <span className="text-xs text-muted line-through">{formatPrice(price.was.toFixed(2))}</span>}
          </div>
          <p className="h-4 truncate text-[11px] text-muted">
            {price.price >= 100 ? t("card.monthly", { amount: formatPrice(monthlyPayment(price.price)) }) : ""}
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={addToCart}
            disabled={busy || soldOut}
            className={`flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl px-2 text-[13px] font-semibold transition duration-200 ease-out hover:bg-cta-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:bg-chip disabled:text-muted sm:text-sm ${
              cartPulse && message ? "cart-bump bg-success text-white dark:text-canvas" : "bg-cta text-white"
            }`}
          >
            <span className="truncate">{message ?? (soldOut ? t("card.soldOut") : product.variants?.length ? t("card.chooseOption") : t("card.addToCart"))}</span>
          </button>
          <button
            type="button"
            onClick={openPreview}
            aria-label={t("card.quickView")}
            title={t("card.quickView")}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line text-muted transition duration-200 ease-out hover:border-ink/25 hover:bg-chip hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
          >
            <Eye className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
