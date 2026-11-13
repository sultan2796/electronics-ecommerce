import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useCompare } from "../../context/CompareContext";
import { useWishlist } from "../../context/WishlistContext";
import { getErrorMessage } from "../../services/api";
import { Product } from "../../types";

export default function ProductActions({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { user } = useAuth();
  const { addItem, busy } = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);

  const requireUser = () => {
    if (!user) navigate("/login");
    return Boolean(user);
  };

  const onAdd = async () => {
    try {
      await addItem(product.id);
      setMessage("Səbətə əlavə edildi");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const onWishlist = async () => {
    if (!requireUser()) return;
    try {
      await wishlist.toggle(product.id);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  };

  const inWishlist = wishlist.has(product.id);
  const inCompare = compare.has(product.id);

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap gap-2 ${compact ? "" : "sm:flex-nowrap"}`}>
        <button className="btn-primary flex-1" disabled={busy || product.stock === 0} onClick={onAdd}>
          {product.stock === 0 ? "Stokda yoxdur" : "Səbətə at"}
        </button>
        <button
          className={`btn-outline ${inWishlist ? "border-rose-300 text-rose-600" : ""}`}
          onClick={onWishlist}
          aria-pressed={inWishlist}
          title="İstək siyahısı"
        >
          {inWishlist ? "♥" : "♡"}
        </button>
        <button
          className={`btn-outline ${inCompare ? "border-brand-500 text-brand-700 dark:text-brand-500" : ""}`}
          onClick={() => setMessage(compare.toggle(product))}
          aria-pressed={inCompare}
        >
          {inCompare ? "Müqayisədədir" : "Müqayisə"}
        </button>
      </div>
      {message && <p className="text-xs text-muted">{message}</p>}
    </div>
  );
}
