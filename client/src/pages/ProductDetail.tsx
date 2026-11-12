import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "../components/common/Alert";
import FigmaIcon from "../components/common/FigmaIcon";
import Spinner from "../components/common/Spinner";
import ProductImage from "../components/product/ProductImage";
import ReviewSection from "../components/product/ReviewSection";
import RecentlyViewed from "../components/home/RecentlyViewed";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCompare } from "../context/CompareContext";
import { useWishlist } from "../context/WishlistContext";
import { useAsync } from "../hooks/useAsync";
import { getErrorMessage } from "../services/api";
import { productService } from "../services/product.service";
import { TechSpecification } from "../types";
import { discountOf, formatPrice, formatStorage, priceBeforeDiscount } from "../utils/format";
import { productRating, reviewCountLabel } from "../utils/rating";
import { rememberProduct } from "../utils/recentlyViewed";
import { extraService } from "../services/extra.service";
import { useSeo } from "../hooks/useSeo";

const specRows = (specs: TechSpecification): [string, string | null][] => [
  ["Prosessor (CPU)", specs.cpu],
  ["Qrafik (GPU)", specs.gpu],
  ["Operativ yaddaş", specs.ramGb ? `${specs.ramGb} GB` : null],
  ["Daxili yaddaş", specs.storageGb ? `${formatStorage(specs.storageGb)} ${specs.storageType ?? ""}`.trim() : null],
  ["Ekran", specs.screenSizeInch ? `${Number(specs.screenSizeInch)}″` : null],
  ["Ölçü (piksel)", specs.resolution],
  ["Yenilənmə tezliyi", specs.refreshRateHz ? `${specs.refreshRateHz} Hz` : null],
  ["Batareya", specs.batteryMah ? `${specs.batteryMah} mAh` : null],
  ["Əməliyyat sistemi", specs.os],
  ["Çəki", specs.weightGrams ? `${specs.weightGrams} q` : null],
  ["Bağlantı", specs.connectivity.length ? specs.connectivity.join(", ") : null],
  ["Zəmanət", specs.extra?.warranty ?? null],
  ["Çatdırılma", specs.extra?.shipping ?? null],
  ["Qaytarılma", specs.extra?.returnPolicy ?? null],
];

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const { data: product, loading, error, setData } = useAsync(() => productService.get(slug), [slug]);
  const { user } = useAuth();
  const { addItem, busy } = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);

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
  const discount = discountOf(product);
  const inWishlist = wishlist.has(product.id);
  const rows = product.specs ? specRows(product.specs).filter(([, value]) => value) : [];

  const requireUser = () => {
    if (!user) navigate("/login", { state: { from: `/products/${product.slug}` } });
    return Boolean(user);
  };

  const buyNow = async () => {
    if (!requireUser()) return;
    try {
      await addItem(product.id);
      navigate("/checkout");
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  const addToCart = async () => {
    if (!requireUser()) return;
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
    <div className="-mx-4 -mt-8 sm:mx-0 sm:mt-0">
      <div className="grid overflow-hidden bg-surface sm:rounded-phone sm:shadow-tile lg:grid-cols-2">
        <div className="relative flex items-center justify-center bg-chip pb-0 pt-[34px] lg:min-h-[560px] lg:pt-0">
          <ProductImage
            src={product.images[0]}
            category={product.category?.slug}
            alt={product.name}
            className="aspect-square w-full max-w-[383px] drop-shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
          />
          <button
            type="button"
            onClick={toggleWishlist}
            aria-pressed={inWishlist}
            aria-label="İstək siyahısı"
            className={`absolute right-[34px] top-[37px] rounded-full transition ${inWishlist ? "" : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"}`}
          >
            <FigmaIcon name="heart-detail" className="size-[22.5px]" />
          </button>
        </div>

        <div className="flex flex-col px-[27px] pb-[38px] pt-[37px] lg:px-12 lg:pt-12">
          <nav className="mb-3 hidden text-xs text-muted lg:block">
            <Link to="/products" className="hover:text-brand-600">
              Məhsullar
            </Link>
            {product.category && (
              <>
                {" / "}
                <Link to={`/products?category=${product.category.slug}`} className="hover:text-brand-600">
                  {product.category.name}
                </Link>
              </>
            )}
          </nav>
          <p className="text-xs text-muted">{product.category?.name ?? product.brand}</p>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-base font-semibold text-ink lg:text-2xl">{product.name}</h1>
            <div className="-mt-1 shrink-0 text-right">
              <p className="text-xl font-bold text-brand-500 lg:text-2xl">{formatPrice(product.price)}</p>
              {discount > 0 && (
                <p className="flex items-center justify-end gap-1.5 text-xs">
                  <span className="text-muted line-through">{formatPrice(priceBeforeDiscount(product.price, discount).toFixed(2))}</span>
                  <span className="rounded-full bg-brand-600 px-1.5 py-0.5 font-semibold text-white">-{discount}%</span>
                </p>
              )}
            </div>
          </div>
          <p className={`mt-1 flex items-center gap-1.5 text-xs ${soldOut ? "text-red-600" : "text-rating"}`}>
            <FigmaIcon name="star" className="h-[11px] w-3" />
            {rating && (
              <span>
                {rating.value.toFixed(1)}
                {rating.fromReviews && (
                  <a href="#reviews" className="ml-1 text-muted underline-offset-2 hover:underline">
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
          <p className="mt-4 text-xs leading-[1.5] text-ink">{product.description}</p>

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
              type="button"
              onClick={buyNow}
              disabled={busy || soldOut}
              className="flex h-[45px] w-full items-center justify-center rounded-[10px] bg-brand-600 text-base font-semibold text-white shadow-cta transition hover:bg-brand-700 disabled:opacity-50"
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
        </div>
      </div>
      <ReviewSection productId={product.id} productSlug={product.slug} onSummaryChange={syncRating} />
      <div className="mt-10">
        <RecentlyViewed key={product.id} excludeId={product.id} title="Bunlara da baxmısınız" />
      </div>
    </div>
  );
}
