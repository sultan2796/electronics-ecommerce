import { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import Spinner from "../components/common/Spinner";
import ProductImage from "../components/product/ProductImage";
import { useCart } from "../context/CartContext";
import { getErrorMessage } from "../services/api";
import { formatPrice } from "../utils/format";
import { shippingCost, useStoreConfig } from "../hooks/useStoreConfig";

export default function Cart() {
  const { cart, busy, updateItem, removeItem, isGuest } = useCart();
  const storeConfig = useStoreConfig();
  const [error, setError] = useState<string | null>(null);

  const safely = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!cart) return <Spinner />;
  if (!cart.items.length) {
    return (
      <EmptyState
        title="Səbətiniz boşdur."
        action={
          <Link to="/products" className="btn-primary">
            Alış-verişə başla
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Səbət</h1>
        {error && <Alert>{error}</Alert>}
        {cart.items.map((item) => (
          <article key={item.id} className="card flex flex-wrap items-center gap-4 p-4">
            <ProductImage src={item.product.images[0]} category={item.product.category?.slug} alt={item.product.name} className="h-20 w-28 rounded-lg" />
            <div className="min-w-[160px] flex-1">
              <Link to={`/products/${item.product.slug}`} className="font-semibold hover:text-brand-700">
                {item.product.name}
              </Link>
              {item.variant && (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  {item.variant.colorHex && <span className="h-3 w-3 rounded-full border border-line" style={{ backgroundColor: item.variant.colorHex }} aria-hidden="true" />}
                  {item.variant.name}
                </p>
              )}
              <p className="text-sm text-muted">{formatPrice(item.product.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-outline px-3" disabled={busy} onClick={() => safely(() => updateItem(item.id, item.quantity - 1))}>
                −
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                className="btn-outline px-3"
                disabled={busy || item.quantity >= item.product.stock}
                onClick={() => safely(() => updateItem(item.id, item.quantity + 1))}
              >
                +
              </button>
            </div>
            <p className="w-28 text-right font-semibold">{formatPrice(Number(item.product.price) * item.quantity)}</p>
            <button className="text-sm text-red-600" disabled={busy} onClick={() => safely(() => removeItem(item.id))}>
              Sil
            </button>
          </article>
        ))}
      </section>
      <aside className="card h-fit space-y-4 p-5">
        <h2 className="font-semibold">Sifariş xülasəsi</h2>
        <div className="flex justify-between text-sm">
          <span>Məhsul sayı</span>
          <span>{cart.itemCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Məhsulların dəyəri</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>
        {storeConfig && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Çatdırılma</span>
            {shippingCost(storeConfig, Number(cart.subtotal)) > 0 ? (
              <span>{formatPrice(shippingCost(storeConfig, Number(cart.subtotal)))}</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">Pulsuz</span>
            )}
          </div>
        )}
        {storeConfig && shippingCost(storeConfig, Number(cart.subtotal)) > 0 && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            {`Pulsuz çatdırılma üçün daha ${formatPrice(storeConfig.freeShippingMin - Number(cart.subtotal))} dəyərində məhsul əlavə edin`}
          </p>
        )}
        <div className="flex justify-between border-t border-line pt-3 text-lg font-bold">
          <span>Cəmi</span>
          <span>{formatPrice(Number(cart.subtotal) + shippingCost(storeConfig, Number(cart.subtotal)))}</span>
        </div>
        <p className="text-[11px] text-muted">
          {isGuest
            ? "Promo kod və bonus ballar hesaba daxil olduqda tətbiq olunur. Əlavə gizli ödəniş yoxdur."
            : "Endirim kodu və bonus ballar növbəti addımda tətbiq olunur. Əlavə gizli ödəniş yoxdur."}
        </p>
        <Link to="/checkout" className="btn-primary w-full">
          Sifarişi rəsmiləşdir
        </Link>
      </aside>
    </div>
  );
}
