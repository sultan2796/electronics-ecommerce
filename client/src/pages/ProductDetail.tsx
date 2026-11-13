import ProductViewer from "../components/product/ProductViewer";
import ProductVideo from "../components/product/ProductVideo";
import StickyBuyBar from "../components/product/StickyBuyBar";
import Breadcrumbs from "../components/common/Breadcrumbs";
import { productSpecGroups } from "../utils/productSpecs";
import { useI18n } from "../context/I18nContext";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "../components/common/Alert";
import FigmaIcon from "../components/common/FigmaIcon";
import Spinner from "../components/common/Spinner";
import ReviewSection from "../components/product/ReviewSection";
import PurchaseInfo from "../components/product/PurchaseInfo";
import RecentlyViewed from "../components/home/RecentlyViewed";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import { useWishlist } from "../context/WishlistContext";
import { useAsync } from "../hooks/useAsync";
import { getErrorMessage } from "../services/api";
import { productService } from "../services/product.service";
import { formatPrice, monthlyPayment, pricing } from "../utils/format";
import RelatedProducts from "../components/product/RelatedProducts";
import Countdown from "../components/home/Countdown";
import { productRating, reviewCountLabel } from "../utils/rating";
import { rememberProduct } from "../utils/recentlyViewed";
import { extraService } from "../services/extra.service";
import { useSeo } from "../hooks/useSeo";


export default function ProductDetail() {
  const { slug = "" } = useParams();
  const { data: product, loading, error, setData } = useAsync(() => productService.get(slug), [slug]);
  const { user } = useAuth();
  const { locale } = useI18n();
  const { addItem, busy } = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [ctaEl, setCtaEl] = useState<HTMLButtonElement | null>(null);
  const [ctaVisible, setCtaVisible] = useState(true);

  useEffect(() => {
    if (!ctaEl) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = ctaEl.getBoundingClientRect();
        setCtaVisible(rect.bottom > 0 && rect.top < window.innerHeight);
      });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [ctaEl]);

  const syncRating = useCallback(
    (average: number | null, count: number) =>
      setData((current) =>
        current && (current.ratingAverage !== average || current.reviewCount !== count)
          ? { ...current, ratingAverage: average, reviewCount: count }
          : current,
      ),
    [setData],
  );

  useEffect(() => {
    if (product) {
      rememberProduct(product);
    }
  }, [product]);

  useSeo({
    title: product?.name ?? "Məhsul",
    description: product ? `${product.name} — ${product.brand}. ${product.description.slice(0, 140)}` : undefined,
    image: product?.images[0],
    jsonLd: product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          sku: product.sku,
          brand: { "@type": "Brand", name: product.brand },
          description: product.description,
          image: product.images,
          offers: {
            "@type": "Offer",
            priceCurrency: "AZN",
            price: Number(product.price).toFixed(2),
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
          ...(product.reviewCount && product.ratingAverage
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratingAverage, reviewCount: product.reviewCount } }
            : {}),
        }
      : undefined,
  });

  if (loading) return <Spinner />;
  if (error || !product) return <Alert>{error ?? "Məhsul tapılmadı"}</Alert>;

  const soldOut = product.stock === 0;
  const rating = productRating(product);
  const price = pricing(product);
  const inWishlist = wishlist.has(product.id);
  const rows = productSpecGroups(product, locale).flatMap((group) => group.rows);

  const requireUser = () => {
    if (!user) navigate("/login", { state: { from: `/products/${product.slug}` } });
    return Boolean(user);
  };

  const buyNow = async () => {
    try {
      await addItem(product.id);
      navigate("/checkout");
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  const addToCart = async () => {
    try {
      await addItem(product.id);
      setMessage("Səbətə əlavə edildi");
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  const toggleWishlist = async () => {
    if (!requireUser()) return;
    try {
      await wishlist.toggle(product.id);
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  return (
    <div className="-mx-4 -mt-8 pb-20 sm:mx-0 sm:mt-0 md:pb-0">
      <div className="grid overflow-hidden bg-surface sm:rounded-phone sm:shadow-tile lg:grid-cols-2">
        <div className="relative p-5 pt-[34px] lg:p-8">
          <ProductViewer images={product.images} alt={product.name} category={product.category?.slug} model3d={product.model3dActive === false ? null : (product.model3dUrl ?? product.specs?.extra?.model3d)}
            modelCredit={[product.model3dSource, product.model3dLicense].filter(Boolean).join(" · ") || null} />
          <button
            type="button"
            onClick={toggleWishlist}
            aria-pressed={inWishlist}
            aria-label="İstək siyahısı"
            className={`absolute right-[34px] top-[40px] z-10 rounded-full transition lg:right-10 lg:top-10 ${inWishlist ? "text-red-500" : "text-ink/50 hover:text-red-500"}`}
          >
            <FigmaIcon name="heart-detail" className={`size-[22.5px] ${inWishlist ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="flex flex-col px-[27px] pb-[38px] pt-[37px] lg:px-12 lg:pt-12">
          <Breadcrumbs
            className="mb-3"
            items={[
              { label: "Ana səhifə", to: "/" },
              { label: "Məhsullar", to: "/products" },
              ...(product.category ? [{ label: product.category.name, to: `/products?category=${product.category.slug}` }] : []),
              { label: product.name },
            ]}
          />
          <p className="text-xs text-muted">{product.category?.name ?? product.brand}</p>
          <div className="flex items-start justify-between gap-4">
            <h1 translate="no" className="text-base font-semibold text-ink lg:text-2xl">{product.name}</h1>
            <div className="-mt-1 shrink-0 text-right">
              <p className={`text-xl font-bold lg:text-3xl ${price.percent > 0 ? "text-red-600" : "text-ink"}`}>{formatPrice(price.price)}</p>
              {price.was && (
                <p className="flex items-center justify-end gap-1.5 text-xs">
                  <span className="text-muted line-through">{formatPrice(price.was.toFixed(2))}</span>
                  <span className="rounded-md bg-red-600 px-1.5 py-0.5 font-semibold text-white">−{price.percent}%</span>
                </p>
              )}
            </div>
          </div>
          {product.campaign && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-red-600 to-brand-600 px-4 py-3 text-white">
              <span className="text-sm font-semibold">
                {product.campaign.name} · −{product.campaign.discountPercent}%
              </span>
              <Countdown until={product.campaign.endsAt} />
            </div>
          )}
          {price.price >= 100 && (
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-line px-4 py-3 text-sm">
              <span className="text-muted">Hissə-hissə ödəniş</span>
              <span>
                <strong className="text-ink">{formatPrice(monthlyPayment(price.price))}</strong>
                <span className="text-muted"> × 12 ay</span>
              </span>
            </div>
          )}
          <p className={`mt-1 flex items-center gap-1.5 text-xs ${soldOut ? "text-red-600" : "text-rating"}`}>
            <FigmaIcon name="star" className="h-[11px] w-3" />
            {rating && (
              <span>
                {rating.value.toFixed(1)}
                {rating.fromReviews && (
                  <a href="#reviews" className="ml-1 text-muted">
                    ({reviewCountLabel(rating.count)})
                  </a>
                )}{" "}
                ·
              </span>
            )}
            {soldOut ? "Stokda yoxdur" : `Stokda ${product.stock} ədəd var`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {product.brand} · SKU: {product.sku}
          </p>

          <h2 className="mt-[18px] text-base font-bold text-ink">Məhsul haqqında</h2>
          <p translate="no" className="mt-4 text-sm leading-relaxed text-ink/80">{product.description}</p>

          {rows.length > 0 && (
            <dl className="mt-6 divide-y divide-chip rounded-[20px] bg-chip/60 px-4 text-xs">
              {rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-2 gap-3 py-2.5">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-auto space-y-3 pt-10">
            {message && <p className="text-center text-xs text-muted">{message}</p>}
            {soldOut && (
              <button
                type="button"
                className="btn-outline w-full"
                onClick={async () => {
                  if (!requireUser()) return;
                  try {
                    setMessage((await extraService.stockAlert(product.id)).message);
                  } catch (err) {
                    setMessage(getErrorMessage(err));
                  }
                }}
              >
                Stoka gələndə xəbər ver
              </button>
            )}
            <button
              ref={setCtaEl}
              type="button"
              onClick={buyNow}
              disabled={busy || soldOut}
              className="btn-primary btn-lg w-full"
            >
              {soldOut ? "Stokda yoxdur" : "İndi al"}
            </button>
            <div className="flex gap-3">
              <button type="button" className="btn-outline flex-1" disabled={busy || soldOut} onClick={addToCart}>
                Səbətə at
              </button>
              <button
                type="button"
                className={`btn-outline flex-1 ${compare.has(product.id) ? "border-brand-500 text-brand-600" : ""}`}
                onClick={() => setMessage(compare.toggle(product))}
              >
                {compare.has(product.id) ? "Müqayisədədir" : "Müqayisə et"}
              </button>
            </div>
          </div>
          <PurchaseInfo product={product} />
        </div>
      </div>
      {product.videoUrl && (
        <div className="px-4 sm:px-0">
          <ProductVideo src={product.videoUrl} poster={product.videoPoster} title={product.name} />
        </div>
      )}
      <StickyBuyBar
        visible={!ctaVisible}
        price={price.price}
        soldOut={soldOut}
        busy={busy}
        onAdd={addToCart}
        onBuy={buyNow}
      />
      <ReviewSection productId={product.id} productSlug={product.slug} onSummaryChange={syncRating} />
      <RelatedProducts productId={product.id} />
      <div className="mt-10">
        <RecentlyViewed key={product.id} excludeId={product.id} title="Bunlara da baxmısınız" />
      </div>
    </div>
  );
}
