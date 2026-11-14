import { FormEvent, useEffect, useState } from "react";
import { rememberGuestOrder } from "../utils/guestOrders";
import { shippingCost, useStoreConfig } from "../hooks/useStoreConfig";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useAsync } from "../hooks/useAsync";
import { getErrorMessage } from "../services/api";
import { extraService } from "../services/extra.service";
import { orderService } from "../services/order.service";
import { goToPayment, paymentService } from "../services/payment.service";
import { CouponCheck, PaymentMethod, SavedAddress, ShippingAddress } from "../types";
import { formatPrice } from "../utils/format";

const fields: { name: keyof ShippingAddress; label: string; required: boolean; type?: string; autoComplete?: string }[] = [
  { name: "fullName", label: "Ad Soyad", required: true, autoComplete: "name" },
  { name: "phone", label: "Telefon", required: true, type: "tel", autoComplete: "tel" },
  { name: "line1", label: "Ünvan", required: true, autoComplete: "address-line1" },
  { name: "line2", label: "Ünvan (əlavə)", required: false, autoComplete: "address-line2" },
  { name: "city", label: "Şəhər", required: true, autoComplete: "address-level2" },
  { name: "postalCode", label: "Poçt indeksi", required: true, autoComplete: "postal-code" },
  { name: "country", label: "Ölkə", required: true, autoComplete: "country-name" },
];

const initialAddress: ShippingAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "Bakı",
  postalCode: "",
  country: "Azərbaycan",
};

const methodInfo: Record<PaymentMethod, { title: string; description: string }> = {
  CARD: { title: "Kartla onlayn ödəniş", description: "Visa, Mastercard və digər bank kartları. Təhlükəsiz ödəniş səhifəsinə yönləndiriləcəksiniz." },
  CASH_ON_DELIVERY: { title: "Qapıda ödəniş", description: "Sifarişi aldıqda nağd və ya kartla kuryerə ödəyin." },
};

export default function Checkout() {
  const { cart, refresh, isGuest, clearGuest } = useCart();
  const [guestEmail, setGuestEmail] = useState("");
  const storeConfig = useStoreConfig();
  const { user, reloadUser } = useAuth();
  const [usePoints, setUsePoints] = useState(false);
  const navigate = useNavigate();
  const config = useAsync(() => paymentService.config(), []);
  const [address, setAddress] = useState<ShippingAddress>(initialAddress);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [saveAddress, setSaveAddress] = useState(false);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<CouponCheck | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (isGuest) return;
    extraService
      .addresses()
      .then((list) => {
        setSaved(list);
        const preferred = list.find((item) => item.isDefault) ?? list[0];
        if (preferred) pickAddress(preferred);
      })
      .catch(() => setSaved([]));
  }, [isGuest]);

  useEffect(() => {
    setCoupon(null);
  }, [cart?.subtotal]);

  const pickAddress = (item: SavedAddress) =>
    setAddress({
      fullName: item.fullName,
      phone: item.phone,
      line1: item.line1,
      line2: item.line2 ?? "",
      city: item.city,
      postalCode: item.postalCode,
      country: item.country,
    });

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setCouponError(null);
    try {
      setCoupon(await extraService.checkCoupon(code.trim()));
    } catch (err) {
      setCoupon(null);
      setCouponError(getErrorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  const baseTotal = Number(coupon ? coupon.total : cart?.subtotal ?? 0);
  const availablePoints = user?.points ?? 0;
  const maxPoints = Math.min(availablePoints, Math.floor((baseTotal * 0.5) / 0.01));
  const pointsDiscount = usePoints ? maxPoints * 0.01 : 0;
  const shipping = shippingCost(storeConfig, baseTotal);
  const finalTotal = Math.max(0, Math.round((baseTotal - pointsDiscount + shipping) * 100) / 100);
  const earnPoints = Math.floor(finalTotal - shipping);

  const methods: PaymentMethod[] = isGuest ? ["CASH_ON_DELIVERY"] : (config.data?.methods ?? ["CASH_ON_DELIVERY"]);
  const selected: PaymentMethod = method && methods.includes(method) ? method : methods[0];

  if (cart && !cart.items.length) {
    return (
      <EmptyState
        title="Sifariş üçün səbətdə məhsul yoxdur."
        action={
          <Link to="/products" className="btn-primary">
            Məhsullara bax
          </Link>
        }
      />
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { line2, ...rest } = address;
      if (isGuest) {
        const items = (cart?.items ?? []).map((item) => ({ productId: item.productId, ...(item.variantId ? { variantId: item.variantId } : {}), quantity: item.quantity }));
        const placed = await orderService.guestCheckout({ email: guestEmail.trim(), shippingAddress: line2?.trim() ? address : rest, items });
        rememberGuestOrder(placed.orderNumber, placed.trackingToken);
        clearGuest();
        navigate(`/track/${placed.orderNumber}#token=${placed.trackingToken}`, { replace: true, state: { placed: true } });
        return;
      }
      const result = await orderService.checkout(line2?.trim() ? address : rest, selected, {
        couponCode: coupon?.code,
        usePoints: usePoints || undefined,
        saveAddress: saveAddress || undefined,
      });
      void Promise.all([refresh(), reloadUser()]).catch(() => undefined);
      if (result.payment?.redirectUrl) {
        goToPayment(result.payment.redirectUrl, navigate);
        return;
      }
      navigate(`/orders/${result.order.id}`, {
        replace: true,
        state: { placed: true, paymentError: result.paymentError ?? null },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card space-y-4 p-6">
          <h1 className="text-2xl font-bold">Çatdırılma məlumatları</h1>
          {error && <Alert>{error}</Alert>}
          {isGuest && (
            <div className="space-y-3 rounded-2xl border border-line bg-chip/40 p-4">
              <p className="text-sm">
                Qonaq kimi sifariş verirsiniz.{" "}
                <Link to="/login" state={{ from: "/checkout" }} className="link">
                  Hesabınız var? Daxil olun
                </Link>
              </p>
              <label className="block space-y-1">
                <span className="text-sm font-medium">E-poçt *</span>
                <input
                  className="input"
                  type="email"
                  required
                  autoComplete="email"
                  value={guestEmail}
                  onChange={(event) => setGuestEmail(event.target.value)}
                  placeholder="siz@example.com"
                />
                <span className="block text-xs text-muted">Sifariş təsdiqi və izləmə linki bu ünvana göndəriləcək.</span>
              </label>
            </div>
          )}
          {saved.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {saved.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pickAddress(item)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                    address.line1 === item.line1 && address.phone === item.phone ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-line hover:border-brand-500/50"
                  }`}
                >
                  <span className="block font-semibold">{item.label}</span>
                  <span className="text-muted">{item.line1}, {item.city}</span>
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className={`space-y-1 ${field.name.startsWith("line") ? "sm:col-span-2" : ""}`}>
                <span className="text-sm font-medium">{field.label}</span>
                <input
                  className="input"
                  type={field.type ?? "text"}
                  required={field.required}
                  autoComplete={field.autoComplete}
                  value={address[field.name] ?? ""}
                  onChange={(e) => setAddress((current) => ({ ...current, [field.name]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          {!isGuest && (
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" className="accent-brand-600" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
              Bu ünvanı növbəti sifarişlər üçün yadda saxla
            </label>
          )}
        </section>

        <section className="card space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Ödəniş üsulu</h2>
            {config.data?.testMode && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                Test rejimi
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {methods.map((value) => (
              <label
                key={value}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                  selected === value ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-line hover:border-brand-500/50"
                }`}
              >
                <input type="radio" name="payment" className="mt-1 accent-brand-600" checked={selected === value} onChange={() => setMethod(value)} />
                <span>
                  <span className="block text-sm font-semibold">{methodInfo[value].title}</span>
                  <span className="mt-1 block text-xs text-muted">{methodInfo[value].description}</span>
                </span>
              </label>
            ))}
          </div>
          {isGuest ? (
            <p className="text-xs text-muted">Qonaq sifarişlərində ödəniş qapıda edilir. Onlayn kart ödənişi, promo kod və bonus ballar üçün hesaba daxil olun.</p>
          ) : (
            !methods.includes("CARD") &&
            !config.loading && <p className="text-xs text-muted">Kartla onlayn ödəniş hazırda aktiv deyil.</p>
          )}
        </section>
      </div>

      <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold">Sifarişiniz</h2>
        {cart?.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-4 text-sm">
            <span className="text-ink/80">
              {item.variant ? `${item.product.name} (${item.variant.name}) × ${item.quantity}` : `${item.product.name} × ${item.quantity}`}
            </span>
            <span className="shrink-0">{formatPrice(Number(item.product.price) * item.quantity)}</span>
          </div>
        ))}
        <div className={`space-y-2 border-t border-line pt-3 ${isGuest ? "hidden" : ""}`}>
          <div className="flex gap-2">
            <input
              className="input py-2 text-sm uppercase"
              placeholder="Promo kod"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void applyCoupon();
                }
              }}
            />
            <button type="button" className="btn-outline shrink-0 py-2 text-sm" disabled={checking || !code.trim()} onClick={applyCoupon}>
              {checking ? "..." : "Tətbiq et"}
            </button>
          </div>
          {couponError && <p className="text-xs text-red-600">{couponError}</p>}
          {coupon && (
            <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
              <span>
                {`Endirim (${coupon.code}) `}
                <button type="button" className="text-xs text-muted hover:text-red-600" onClick={() => setCoupon(null)}>
                  sil
                </button>
              </span>
              <span>−{formatPrice(coupon.discount)}</span>
            </div>
          )}
        </div>
        {maxPoints > 0 && (
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm dark:bg-amber-500/10">
            <span className="flex items-center gap-2">
              <input type="checkbox" className="accent-brand-600" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
              {`${maxPoints} bonus bal istifadə et`}
            </span>
            <span className="font-medium text-amber-700 dark:text-amber-300">−{formatPrice(maxPoints * 0.01)}</span>
          </label>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted">Çatdırılma</span>
          {shipping > 0 ? <span>{formatPrice(shipping)}</span> : <span className="text-emerald-600 dark:text-emerald-400">Pulsuz</span>}
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Cəmi</span>
          <span>{formatPrice(finalTotal)}</span>
        </div>
        <button type="submit" className="btn-primary btn-lg w-full" disabled={submitting || !cart} aria-busy={submitting || undefined}>
          {submitting && <span className="btn-spinner" aria-hidden="true" />}
          {submitting ? "Göndərilir..." : selected === "CARD" ? "Ödənişə keç" : "Sifarişi təsdiqlə"}
        </button>
        {!isGuest && earnPoints > 0 && <p className="text-center text-xs text-emerald-600 dark:text-emerald-400">{`Bu sifarişdən ${earnPoints} bonus bal qazanacaqsınız`}</p>}
        <p className="text-center text-[11px] text-muted">Sifarişi təsdiqləməklə satış şərtləri ilə razılaşırsınız.</p>
      </aside>
    </form>
  );
}
