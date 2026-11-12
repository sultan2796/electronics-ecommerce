import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useCompare } from "../../context/CompareContext";
import { getErrorMessage } from "../../services/api";
import { Product } from "../../types";
import { discountOf, formatPrice } from "../../utils/format";
import FigmaIcon from "../common/FigmaIcon";
import ProductImage from "./ProductImage";
import { productRating } from "../../utils/rating";

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addItem, busy } = useCart();
  const compare = useCompare();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const inCompare = compare.has(product.id);
  const soldOut = product.stock === 0;
  const rating = productRating(product);
  const discount = discountOf(product);

  const addToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await addItem(product.id);
      setMessage("Səbətə əlavə edildi");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  return (
    <article className="tile-shape group relative flex h-[221px] flex-col bg-tile shadow-tile transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_-10px_rgba(16,24,40,0.25)]">
      <button
        type="button"
        onClick={() => setMessage(compare.toggle(product))}
        aria-pressed={inCompare}
        title="Müqayisə"
        className={`absolute right-2.5 top-2.5 z-10 rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
          inCompare ? "bg-brand-500 text-white" : "bg-surface/80 text-muted hover:text-ink"
        }`}
      >
        {inCompare ? "✓ Müqayisə" : "+ Müqayisə"}
      </button>
      {discount > 0 && (
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
          -{discount}%
        </span>
      )}
      <Link to={`/products/${product.slug}`} className="flex h-[107px] items-center justify-center pt-2.5">
        <ProductImage
          src={product.images[0]}
          category={product.category?.slug}
          alt={product.name}
          className="size-[98px] drop-shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
        />
      </Link>
      <div className="tile-shape relative mt-auto flex h-[113.654px] flex-col bg-surface px-[13px] pt-[17px]">
        <Link to={`/products/${product.slug}`} className="truncate pr-2 text-base leading-tight text-ink hover:text-brand-600">
          {product.name}
        </Link>
        <p className="truncate text-xs text-ink">{product.category?.name ?? product.brand}</p>
        <p className={`mt-1 flex items-center gap-1 text-xs ${soldOut ? "text-red-600" : "text-rating"}`}>
          {message ?? (
            <>
              {rating && (
                <>
                  <FigmaIcon name="star" className="h-[11px] w-3" />
                  <span>{rating.value.toFixed(1)}</span>
                  {rating.fromReviews && <span className="text-muted">({rating.count})</span>}
                  <span className="text-muted">·</span>
                </>
              )}
              <span className="truncate">{soldOut ? "Stokda yoxdur" : `stokda ${product.stock}`}</span>
            </>
          )}
        </p>
        <p className="mt-auto pb-[13px] text-xs font-bold text-brand-500">{formatPrice(product.price)}</p>
        <button
          type="button"
          onClick={addToCart}
          disabled={busy || soldOut}
          aria-label={`${product.name} səbətə at`}
          className="tile-shape absolute bottom-[15px] right-[17px] flex h-[35px] w-[35.833px] items-center justify-center rounded-[10px] rounded-br-[30px] bg-brand-500 transition hover:bg-brand-600 disabled:opacity-40"
        >
          <FigmaIcon name="bag" className="h-[21px] w-[19.333px]" />
        </button>
      </div>
    </article>
  );
}
